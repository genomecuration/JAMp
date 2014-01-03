#!/usr/bin/env perl

=pod

=head1 NAME

 parse_hhsearch.pl parse hhsearch output, include self if possible
 currently only one file is expected per gene otherwise pvalues are wrong
 
=head1 TODO

 Add table attributes for cytoscape (organism, cleanup name)
 average linkage

=head1 USAGE

             'outfile:s'  => Output base filename ('hhsearch_output')
             'eval_cut:f' => e-value cut off: average number of false positives with a better score (def. 1e-3)
             'pval_cut:f' => P-value cut off (evalue/effective number of sequences in db; def. 1e-6)
             'score_cut:i' => Total score: viterbi raw score cut off + secondary structure score (def. 100)
             'prob_homol_cut:i' => Probability (0-100) that hit is homologous (def 70)
             'align_cut:i' => Minimum number of aligned columns (def. 50)
             'template_aln_size:i' => Minimum number of template aligned columns in alignment (def. 30)
             'minfile:i' => Minimum filesize of input hhr file to process (def. 600)
             'repeat_hhr' => Input is hhblits against repeats
	     'sanitize_id' => Sanitize hit description (delete anything after first space/underscore)
             'stringent:s{,}'  => list of IDs that have repeats/are nuisance and only >= 3x -score_cut should be accepted
	
=cut
use strict;
use warnings;
use Pod::Usage;
use Data::Dumper;
use Digest::MD5 qw/md5_hex/;
use Getopt::Long;
use Statistics::Descriptive;
my $outfile = 'hhsearch_output';
my ( $skip_description, $not_self, $trim_hit,@stringent_ids,$no_coord_adjust );
my $template_aln_size_cut = 30;
my $align_col_cut         = 50;
my $pval_cut              = "1e-6";
my $eval_cut              = "1e-3";
my $score_cut             = 100;
my $homology_prob_cut     = 70;
my $pattern;
my $ipattern;
my $is_repeat;
my $min_filesize = 600;
&GetOptions(
             'minfile:i'           => \$min_filesize,
             'outfile:s'           => \$outfile,
             'prob_homol_cut:i'    => $homology_prob_cut,
             'eval_cut:f'          => \$eval_cut,
             'pval_cut:f'          => \$pval_cut,
             'align_cut:i'         => \$align_col_cut,
             'template_aln_size:i' => \$template_aln_size_cut,
             'score_cut:i'         => \$score_cut,
             'repeat_hhr'          => \$is_repeat,
	     'sanitize_id'         => \$trim_hit,
	     'stringent:s{,}'      => \@stringent_ids,
	     'no_coord_adjust'     => \$no_coord_adjust
);
my @infiles = @ARGV;
pod2usage unless $infiles[0];
my ( %hash, %hit_to_self, %hit_stringent );


if (@stringent_ids){
   foreach my $id (@stringent_ids){
	   $hit_stringent{$id} = 1;
   }
}

open( GLIMMER, ">$outfile.glimmer" );
open( GENEID,  ">$outfile.geneid" );
open( GFF3,    ">$outfile.gff3" );
open( HINTS,   ">$outfile.hints" );
my $qcounter = int(0);
my %hit_counter;
foreach my $infile (@infiles) {
  next unless -s $infile && ( -s $infile ) >= $min_filesize;
  open( IN, $infile );
  my $query = <IN>;
  $qcounter++;
  chomp($query);
  $query =~ s/^Query\s+(\S+)//;
  my $id = $1;
  $id =~ s/_\d+$// if $id;
  my $reverse = $query =~ /REVERSE SENSE/ ? 1 : 0;
  $query =~ /\[(\d+)\s\-\s(\d+)\]/;
  my $start = $1 && $1=~/^(\d+)$/ ? $1 : int(0);
  my $stop  = $2 && $2=~/^(\d+)$/ ? $2 : int(0);
  while ( my $ln = <IN> ) {
    if ( $ln =~ /^\W*Query\s+(\S+)/ ) {
      $qcounter++;
      $query = $ln;
      $id    = $1;
      $id =~ s/_\d+$//;
      $reverse = $ln =~ /REVERSE SENSE/ ? 1 : 0;
      $ln =~ /\[(\d+)\s\-\s(\d+)\]/;
      $start = $1 && $1=~/^(\d+)$/ ? $1 : int(0);
      $stop  = $2 && $2=~/^(\d+)$/ ? $2 : int(0);
      next;
    } elsif ( $ln =~ /^\s*No Hit/ ) {
      while ( my $ln2 = <IN> ) {
        last if $ln2 =~ /^\s*$/;
        last if $ln2 =~ /^Done/;
        $ln2 =~ /^\s*(\d+)/;
        my $hit_number = $1;
        next unless $hit_number == 1;
        my ( $hit_desc, $hit_data, $hit_id );
        $hit_desc = substr( $ln2, 4, 31 );
        $hit_data = substr( $ln2, 35 );
        $hit_desc =~ /^(\S+)\s*(.*)/;
        $hit_id = $1;
        $hit_desc = $2;
        if ($hit_desc){
	        $hit_desc =~ s/[\s\.]+$//;
	        $hit_desc =~ s/\s+/_/g;
		if ($trim_hit){
	#		$hit_desc =~ s/\|$//g;
	#		$hit_desc =~ s/^\w{,4}\|//g;
        		$hit_desc =~ s/_.+$// unless $hit_desc=~/NP_\d+/;;
		}
	}

# Prob E-value P-value  Score    SS Cols Query HMM  Template HMM
#$hit_data =~ /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)-(\d+)\s+(\d+)-(\d+)\s+\((\d+)\)/;
        chomp($hit_data);
        $hit_data =~ s/^\s+//;
        my @data = split( /\s+/, $hit_data );
        my ( $prob, $evalue, $pvalue, $score, $structure_score,
             $alignment_length )
          = ( $data[0], $data[1], $data[2], $data[3], $data[4], $data[5] );
        $data[6] =~ /(\d+)\-(\d+)/;
        my $aa_start = $1;
        my $aa_stop  = $2;
        $data[7] =~ /(\d+)\-(\d+)/;
        my $hit_start = $1;
        my $hit_stop  = $2;

        if ( $data[7] =~ s/\((\d+)\)// ) {
          $data[8] = $1;
        } else {
          $data[8] =~ s/[\(\)]//g;
        }
        my $template_size     = $data[8];
        my $template_aln_size = abs( $hit_start - $hit_stop ) + 1;
        next if $homology_prob_cut > $prob;
        next if $eval_cut && $eval_cut < $evalue;
        next if $pval_cut && $pval_cut < $pvalue;
        next if $score_cut && $score_cut > $score;
        next if $hit_stringent{$hit_desc} && $score_cut && (3 * $score_cut) > $score;
        next if $alignment_length < $align_col_cut;
        next if $template_aln_size < $template_aln_size_cut;
        my ( $gff_start, $gff_end );
          if ( !$reverse ) {
            $gff_start = $start + ( 3 * $aa_start ) - 1;
            $gff_end   = $start + ( 3 * $aa_stop ) - 1;
          } else {
            $gff_start = $start - ( 3 * $aa_start ) + 1;
            $gff_end   = $start - ( 3 * $aa_stop ) + 1;
          }
        my $src = $is_repeat ? 'R' : 'H';
        my $type = $is_repeat ? 'nonexonpart' : 'CDSpart';
        my $prio = $is_repeat ? 6 : 5;
	my $uid = "$hit_id.s$hit_start.e$hit_stop";
	$hit_counter{$uid}++;
	$uid .= '.n'.$hit_counter{$uid};
	my $name = $uid; 
        $name .=" ($hit_desc)" if $hit_desc;
        if ($reverse) {
          print HINTS $id
            . "\thhblits\t$type\t$gff_end\t$gff_start\t$score\t-\t.\tsrc=$src;grp=$hit_id;pri=$prio"
            . "\n";
          print GFF3 $id
            . "\thhblits\tprotein_match\t$gff_end\t$gff_start\t$score\t-\t.\tID=$uid;Name=$name;Target=$hit_id $hit_start $hit_stop\n";
          print GENEID $id
            . "\thhblits\tsr\t$gff_end\t$gff_start\t$score\t-\t." . "\n";
        } else {
          print HINTS $id
            . "\thhblits\t$type\t$gff_start\t$gff_end\t$score\t+\t.\tsrc=$src;grp=$hit_id;pri=$prio"
            . "\n";
          print GFF3 $id
            . "\thhblits\tprotein_match\t$gff_start\t$gff_end\t$score\t+\t.\tID=$uid;Name=$name;Target=$hit_id $hit_start $hit_stop\n";
          print GENEID $id
            . "\thhblits\tsr\t$gff_start\t$gff_end\t$score\t+\t." . "\n";
        }
        print GLIMMER "$id $gff_start $gff_end $score $evalue\n\n";
        last;    # top hit
      }
    }
  }
  close IN;
}
close GLIMMER;
close HINTS;
close GFF3;
close GENEID;
if ( -s "$outfile.gff3" ) {
  system("sort -nk 4,4 $outfile.gff3| sort -s -k 1,1 > $outfile.gff3.sorted");
  system("sort -nk4,4 $outfile.hints|sort -s -k1,1 > $outfile.hints. ");
  rename("$outfile.hints.","$outfile.hints");
}
print "Done. Processed $qcounter queries\n";
