#!/usr/bin/env perl

=head1 NAME

 create_annotations_2019

=head1 USAGE

Mandatory

 -result     :s{1,}   => One or more HHBlits result files
 -cluster    :s       => Cluster membership file

=cut

use strict;
use warnings;
use Getopt::Long;
use Pod::Usage;
use File::Basename;
use FindBin qw($RealBin);
use JSON;

my (@result_files,$hhblits_cluster_tsv_file,$help,$debug);

GetOptions(
        'result_file:s{1,}' => \@result_files,
	'cluster_tsv_filee:s' => \$hhblits_cluster_tsv_file,
	'help'		=> \$help,
	'debug'	=> \$debug
);

pod2usage( -verbose => 2 ) if $help;

die pod2usage "No result file provided\n"
  unless $result_files[0] && -s $result_files[0];
die pod2usage "No cluster TSV file provided\n"
  unless $hhblits_cluster_tsv_file && -s $hhblits_cluster_tsv_file;

my $cluster_identities_hashref = &prepare_tsv_hash($hhblits_cluster_tsv_file);

foreach my $result_file (@result_files){
	&parse_hhr($result_file, 70, 1e-3, 1e-6, 100, 50, 30, 0 );
}



###########################
sub prepare_tsv_hash(){
	$|=1;
	my $file = shift;
	my $line_count = `wc -l < $file`;chomp($line_count);
	my (%hash,$counter);
	print "Parsing $file...\n";
	open (IN,$file);
	while (my $ln=<IN>){
		chomp($ln);
		my @data=split("\t",$ln);
		push(@{$hash{$data[0]}},$data[1]) if $data[1];
		$counter++;
		print "Processed: $counter / $line_count        \r" if $counter=~/000000$/;
	}
	close IN;
	print "Processed: $counter / $line_count        \n";
	$|=0;
	return \%hash;
}

sub remove_zero_bytes() {
 my $infile  = shift;
 my $outfile = "hhr.$infile.db";
 return $outfile if ( -s $outfile );
 &process_cmd("cat $infile*.idx* > $outfile.idx");
 system("rm -f $infile*.idx*");
 &process_cmd("cat $infile* | tr -d '\\000' > $outfile");
 system("rm -f $infile*");
 return $outfile;
}


sub parse_hhr() {

 # (70,1e-3,1e-6,100,50,30);
 my ( $infile, $homology_prob_cut, $eval_cut, $pval_cut, $score_cut,
      $align_col_cut, $template_aln_size_cut, $is_repeat )
   = @_;

#expensive: $infile = &remove_zero_bytes($infile);
 my $outfile = "$infile.results";
 print "Post-processing $infile\n";
 my $min_filesize = 500;
 my ( $qcounter, %hit_counter );

 die "Can't find $infile or it is too small\n"
   unless -s $infile && ( -s $infile ) >= $min_filesize;

 open( IN, $infile ) || die($!);
 open( GFF3,    ">$outfile.gff3" );
 open( HINTS,   ">$outfile.hints" );
 open( OUT,     ">$outfile" );
 print OUT "# $infile $hhblits_cluster_tsv_file $homology_prob_cut $eval_cut $pval_cut $score_cut $align_col_cut $template_aln_size_cut $is_repeat\n";

 my ( $query, $id, $reverse, $start, $stop );

 while ( my $ln = <IN> ) {
  if ( $ln =~ /^\s*Query\s+(\S+)/ ) {
   $qcounter++;
   $query = $1;
   $id    = $query;
   $id =~ s/_\d+$//;
   $reverse = ( $ln =~ /REVERSE SENSE/ ) ? 1 : 0;
   $ln =~ /\[(\d+)\s\-\s(\d+)\]/;
   $start = $1 && $1 =~ /^(\d+)$/ ? $1 : int(0);
   $stop  = $2 && $2 =~ /^(\d+)$/ ? $2 : int(0);
   next;
  }
  elsif ( $ln =~ /^\s*No Hit/ ) {
   while ( my $ln2 = <IN> ) {
    last if $ln2 =~ /^\s*$/;
    last if $ln2 =~ /^Done/;
    $ln2 =~ /^\s*(\d+)/;
    my $hit_number = $1;
#    next unless $hit_number == 1;
    my ( $hit_desc, $hit_data, $hit_id );
    $hit_desc = substr( $ln2, 4, 31 );
    $hit_data = substr( $ln2, 35 );
    $hit_desc =~ /^(\S+)\s*(.*)/;
    $hit_id   = $1;
#    $hit_desc = $2;
    $hit_desc = undef;

    # uniprot
    if ($hit_id=~/^[ts][rp]\|(\S+)\|/){
	$hit_id = $1;
    }

    if ($hit_desc) {
     $hit_desc =~ s/[\s\.]+$//;
     $hit_desc =~ s/\s+/_/g;
    }
    chomp($hit_data);
    $hit_data =~ s/^\s+//;
    my @data = split( /\s+/, $hit_data );
    my ( $prob, $evalue, $pvalue, $score, $structure_score, $alignment_length )
      = ( $data[0], $data[1], $data[2], $data[3], $data[4], $data[5] );
    $data[6] =~ /(\d+)\-(\d+)/;
    my $aa_start = $1;
    my $aa_stop  = $2;
    $data[7] =~ /(\d+)\-(\d+)/;
    my $hit_start = $1;
    my $hit_stop  = $2;

    if ( $data[7] =~ s/\((\d+)\)// ) {
     $data[8] = $1;
    }
    else {
     $data[8] =~ s/[\(\)]//g;
    }
    my $template_size     = $data[8];
    my $template_aln_size = abs( $hit_start - $hit_stop ) + 1;

    next if $homology_prob_cut > $prob;
    next if $eval_cut && $eval_cut < $evalue;
    next if $pval_cut && $pval_cut < $pvalue;
    next if $score_cut && $score_cut > $score;
    next if $alignment_length < $align_col_cut;
    next if $template_aln_size < $template_aln_size_cut;
    my ( $gff_start, $gff_end );
    if ( !$reverse ) {
     $gff_start = $start + ( 3 * $aa_start ) - 1;
     $gff_end   = $start + ( 3 * $aa_stop ) - 1;
    }
    else {
     $gff_start = $start - ( 3 * $aa_start ) + 1;
     $gff_end   = $start - ( 3 * $aa_stop ) + 1;
    }
    my $src  = $is_repeat ? 'R'           : 'H';
    my $type = $is_repeat ? 'nonexonpart' : 'CDSpart';
    my $prio = $is_repeat ? 6             : 5;
    my $uid  = "$hit_id.s$hit_start.e$hit_stop";
    $hit_counter{$uid}++;
    $uid .= '.n' . $hit_counter{$uid};

    my $name = $uid;
    $name .= " ($hit_desc)" if $hit_desc;
    if ($reverse) {
     print HINTS $id
       . "\thhblits\t$type\t$gff_end\t$gff_start\t$score\t-\t.\tsrc=$src;grp=$hit_id;pri=$prio"
       . "\n";
     print GFF3 $id
       . "\thhblits\tprotein_match\t$gff_end\t$gff_start\t$score\t-\t.\tID=$uid;Name=$name;Target=$hit_id $hit_start $hit_stop\n";
    }
    else {
     print HINTS $id
       . "\thhblits\t$type\t$gff_start\t$gff_end\t$score\t+\t.\tsrc=$src;grp=$hit_id;pri=$prio"
       . "\n";
     print GFF3 $id
       . "\thhblits\tprotein_match\t$gff_start\t$gff_end\t$score\t+\t.\tID=$uid;Name=$name;Target=$hit_id $hit_start $hit_stop\n";
    }
    print OUT $query."\t".join("\t",@{$cluster_identities_hashref->{$hit_id}})."\n";
#    last;    # top hit
   }
  }
 }
 close IN;

 close OUT;
 close HINTS;
 close GFF3;
 if ( -s "$outfile.gff3" ) {
  system("sort -nk 4,4 $outfile.gff3| sort -s -k 1,1 > $outfile.gff3.sorted");
  rename( "$outfile.gff3.sorted", "$outfile.gff3" );
  system("sort -nk4,4 $outfile.hints|sort -s -k1,1 > $outfile.hints. ");
  rename( "$outfile.hints.", "$outfile.hints" );
 }

 return $outfile;

}
