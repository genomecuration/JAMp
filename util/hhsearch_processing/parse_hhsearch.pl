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
             'eval_cut:f' => e-value cut off: average number of false positives with a better score
             'pval_cut:f' => P-value cut off (evalue/effective number of sequences in db)
             'score_cut:i' => Total score: viterbi raw score cut off + secondary structure score
             'prob_homol_cut:i' => Probability (0-100) that hit is homologous (def 70)
             'skip_description:s' => Skip sequences (queries and hits) with this pattern (quote it; case insensitive regex, e.g. 'fragment|partial'). 
             'pattern:s'         => Case sensitive pattern in Query name to get attributes
             'ipattern:s'         => Case insensitive pattern in Query name to get attributes
             'align_cut:i' => Minimum number of aligned columns (def. 100)
             'minfile:i' => Minimum filesize of input hhr file to process (def.600)
             'noself' => Do not check for hit to self 

=cut


use strict;
use warnings;
use Pod::Usage;
use Data::Dumper;
use Digest::MD5 qw/md5_hex/;
use Getopt::Long;
use Statistics::Descriptive;

my $outfile = 'hhsearch_output';
my ( $eval_cut, $pval_cut, $score_cut,$skip_description,$not_self );
my $align_col_cut = 100;
my $homology_prob_cut = 70;
my $pattern;
my $ipattern;
my $min_filesize = 600;
&GetOptions(
	     'minfile:i' =>\$min_filesize,
	     'noself' => \$not_self,
             'outfile:s'  => \$outfile,
             'prob_homol_cut:i' => $homology_prob_cut,
             'eval_cut:f' => \$eval_cut,
             'pval_cut:f' => \$pval_cut,
             'align_cut:i' => \$align_col_cut,
             'score_cut:i' => \$score_cut,
             'skip_description:s' => \$skip_description,
	     'pattern:s'         => \$pattern,
	     'ipattern:s'         => \$ipattern,
);
$|=1;
my @infiles = @ARGV;
pod2usage unless $infiles[0] && -s $infiles[0];
my (%hash,%hit_to_self);
open( ATTR, ">$outfile.attributes.csv" );

FILE: foreach my $infile (@infiles) {
  next unless -s $infile && (-s $infile)>=$min_filesize;
  my $orig_separator = $/;
  $/ = "Done!\n";
  open( IN, $infile );
  RECORD: while (my $record = <IN>){
  my @lines = split("\n",$record);
  my $query = shift @lines;
  chomp($query);
  $query=~s/^Query\s+//;
  $query=~/$pattern/ if $pattern && $pattern=~/\(/ && $pattern=~/\)/;
  $query=~/$ipattern/i if $ipattern && $ipattern=~/\(/ && $ipattern=~/\)/;
  my $attribute = $1 ? $1 : $query;
  $query =~/^(\S+)/;
  if ($1){
    $query = $1;
    print ATTR "$query\t$attribute\n";
    die "Either query $query or gene file is not unique as it exists in ".$hash{$query}{'file'}." and $infile!\n" if (exists($hash{$query}));
  }else{
    warn "File $infile is not a .hhr output file; skipping...\n";
    warn $query;
    next RECORD;
  }
  $hash{$query}{'file'} = $infile;
  for (my $i=0;$i<@lines;$i++){
    my $ln = $lines[$i];
    if ( $ln =~ /No Hit/ ) {
      for (my $k=$i+1;$i<@lines;$k++){
        my $ln2 = $lines[$k]||last;
        last if $ln2 =~ /^\s*$/;
        $ln2 =~ /^\s*(\d+)/;
        my $hit_number = $1;
        my $hit = substr( $ln2, 35 );

        # Prob E-value P-value  Score    SS Cols Query HMM  Template HMM
        $hit =~ /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
        my ( $prob, $evalue, $pvalue, $score, $structure_score,
             $alignment_length )
          = ( $1, $2, $3, $4, $5, $6 );
          next if $homology_prob_cut > $prob;
          next if $eval_cut && $eval_cut < $evalue;
          next if $pval_cut && $pval_cut < $pvalue;
          next if $score_cut && $score_cut > $score;
          
        $hash{$query}{'data'}{$hit_number} = {
          'prob'  => $prob,
          'eval'  => $evalue,
          'pval'  => $pvalue,
          'score' => $score+$structure_score,

          #                                'ss' => $structure_score,
          'aln_length' => $alignment_length
        };
        #print Dumper $hash{$query}{'data'}{$hit_number};
      }
    }
  }

  for (my $i=0;$i<@lines;$i++){
    my $ln = $lines[$i];
      for (my $k=$i+1;$i<@lines;$k++){
        my $ln2 = $lines[$k]||last;
        next if $ln2 =~ /^\s*$/;
        if ( $ln2 =~ /^No\s(\d+)/ ) {
          my $hit_number = $1;
          my $desc       =  $lines[$k+1];
          $desc =~ /^>(\S+)/;
          $desc = $1;
          my $stats =  $lines[$k+2];
          next unless $hash{$query}{'data'}{$hit_number}; 
          $stats =~ /Identities=(\S+)\s+Similarity=(\S+)\s+Sum_probs=(\S+)/;
          $hash{$query}{'data'}{$hit_number}{'descr'}        = $desc;
          $hash{$query}{'data'}{$hit_number}{'ident'}        = $1;
          $hash{$query}{'data'}{$hit_number}{'similarities'} = $2;
          $hash{$query}{'data'}{$hit_number}{'sum_probs'}    = $3;
          if ($desc eq $query &&  !$hit_to_self{$query}){
            $hash{$query}{'data'}{$hit_number}{'self'} = 1 ;
            $hit_to_self{$query} = int($hit_number); 
          }else{
            $hash{$query}{'data'}{$hit_number}{'self'} = 0;
          }
        }

       # die Dumper $hash{$query}{'data'};
     } 
    }
   print "."; 

  }
  print "\n";  
  close IN;
  $/ = $orig_separator;
}

close ATTR;

my @queries = sort { $a cmp $b } keys %hash;
my (%pairs_hash,%pairs_norm_hash,%md5_hash,%dissimilarity_matrix_hash);
my $query_counter = 0;
open( OUT1, ">$outfile.0.csv" ) if !$not_self; # self-hit
open( OUT2, ">$outfile.csv" ); # without selves
print OUT1 join( "\t",
                 qw|QueryNo HitNo Score Score/length Distance_to_top 1/Distance_to_top -log(1/Distance_to_top) Identities Evalue Pvalue -log(Pvalue) Probability SumProbs AlnLength QUERY TARGET checksums_Q_T|
) . "\n" if !$not_self;
print OUT2 join( "\t",
                 qw|QueryNo HitNo Score Score/length Distance_to_top 1/Distance_to_top -log(1/Distance_to_top) Identities Evalue Pvalue -log(Pvalue) Probability SumProbs AlnLength QUERY TARGET checksums_Q_T|
) . "\n";

foreach my $query (@queries) {
  next if ($skip_description && $query=~/$skip_description/i);
  my $qid = md5_hex($query);
  my $query_counter++;
  my @hits = ( sort { $a <=> $b } keys %{ $hash{$query}{'data'} } );
  my $self_hit_number = $hit_to_self{$query};
  warn "Warning: Query $query has no hit to self amongst the input files!\n" if !$self_hit_number && !$not_self;
  foreach my $hit_number (@hits) {
    next if ($skip_description && $hash{$query}{'data'}{$hit_number}{'descr'}=~/$skip_description/i);
    if ($self_hit_number && $hit_number == $self_hit_number  ) {
      $hash{$query}{'data'}{$hit_number}{'distance_to_top'} = int(0);
    }elsif($self_hit_number){
      $hash{$query}{'data'}{$hit_number}{'distance_to_top'} = 
      sprintf( "%.2f", $hash{$query}{'data'}{$self_hit_number}{'score'} - $hash{$query}{'data'}{$hit_number}{'score'} );
    }else{

      $hash{$query}{'data'}{$hit_number}{'distance_to_top'} = 'NA' ;
    }
    
    if (!$not_self && $hash{$query}{'data'}{$hit_number}{'distance_to_top'} && $hash{$query}{'data'}{$hit_number}{'distance_to_top'} ne 'NA' && $hash{$query}{'data'}{$hit_number}{'distance_to_top'} < 0){
      warn "Setting distance to top score to 1 as this is weird for $query : ".$hash{$query}{'data'}{$hit_number}{'distance_to_top'}."\n";
      $hash{$query}{'data'}{$hit_number}{'distance_to_top'} = 1;
    }
    
    my $inverse_distance = ($not_self || $hash{$query}{'data'}{$hit_number}{'distance_to_top'} == 0) ? 1 : sprintf('%.2e',(1/$hash{$query}{'data'}{$hit_number}{'distance_to_top'}));
    
    my $tid = md5_hex( $hash{$query}{'data'}{$hit_number}{'descr'} );
    $dissimilarity_matrix_hash{$qid}{$tid} = $not_self ? int(0) : sprintf( "%.2f", $hash{$query}{'data'}{$hit_number}{'distance_to_top'} );
    
    $pairs_hash{$query}{$hash{$query}{'data'}{$hit_number}{'descr'}} = $hash{$query}{'data'}{$hit_number}{'score'};
    $pairs_norm_hash{$query}{$hash{$query}{'data'}{$hit_number}{'descr'}} = sprintf( "%.4f",$hash{$query}{'data'}{$hit_number}{'score'}/$hash{$query}{'data'}{$hit_number}{'aln_length'});
    my $logpval = $hash{$query}{'data'}{$hit_number}{'pval'} == 0 ? 0 : -log($hash{$query}{'data'}{$hit_number}{'pval'}); 
    
    print OUT1 join(
                     "\t",
                     (
                       $query_counter,
                       $hit_number,
                       $hash{$query}{'data'}{$hit_number}{'score'},
                       sprintf( "%.4f",$hash{$query}{'data'}{$hit_number}{'score'}/$hash{$query}{'data'}{$hit_number}{'aln_length'}),
                       $hash{$query}{'data'}{$hit_number}{'distance_to_top'},
                       $inverse_distance,
                       -log($inverse_distance),
                       $hash{$query}{'data'}{$hit_number}{'ident'},
                       $hash{$query}{'data'}{$hit_number}{'eval'},
                       $hash{$query}{'data'}{$hit_number}{'pval'},
                       $logpval,
                       $hash{$query}{'data'}{$hit_number}{'prob'},
                       $hash{$query}{'data'}{$hit_number}{'sum_probs'},
                       $hash{$query}{'data'}{$hit_number}{'aln_length'},
                       $query,
                       $hash{$query}{'data'}{$hit_number}{'descr'},
                       $qid . ':' . $tid
                     )
    ) . "\n" if !$not_self;
    print OUT2 join(
                     "\t",
                     (
                       $query_counter,
                       $hit_number,
                       $hash{$query}{'data'}{$hit_number}{'score'},
                       sprintf( "%.4f",$hash{$query}{'data'}{$hit_number}{'score'}/$hash{$query}{'data'}{$hit_number}{'aln_length'}),
                       $hash{$query}{'data'}{$hit_number}{'distance_to_top'},
                       $inverse_distance,
                       -log($inverse_distance),
                       $hash{$query}{'data'}{$hit_number}{'ident'},
                       $hash{$query}{'data'}{$hit_number}{'eval'},
                       $hash{$query}{'data'}{$hit_number}{'pval'},
                       $logpval,
                       $hash{$query}{'data'}{$hit_number}{'prob'},
                       $hash{$query}{'data'}{$hit_number}{'sum_probs'},
                       $hash{$query}{'data'}{$hit_number}{'aln_length'},
                       $query,
                       $hash{$query}{'data'}{$hit_number}{'descr'},
                       $qid . ':' . $tid
                     )
      )
      . "\n"
      unless $qid eq $tid;
  }
}
close OUT1 if !$not_self;
close OUT2;
exit(0) if $not_self;

open( OUT, ">$outfile.paired.csv" );
print OUT "Query\tTarget\tAverageScore\tln(Score)\n";
for (my $i=0;$i<scalar(@queries);$i++) {
  for (my $k=$i+1;$k<scalar(@queries);$k++) {
   my $query = $queries[$i];
   my $target = $queries[$k];
   
   my $scoreA = $pairs_hash{$query}{$target} ? $pairs_hash{$query}{$target} : int(0);
   my $scoreB = $pairs_hash{$target}{$query} ? $pairs_hash{$target}{$query} : int(0);
   my $average_score = ($scoreA + $scoreB) / 2; 
   print OUT "$query\t$target\t$average_score\t".sprintf("%.2f",log($average_score))."\n" if $average_score;
 }
}

close OUT;

open( OUT, ">$outfile.paired.normalized.csv" );
print OUT "Query\tTarget\tAverageNormScore\tln(NormScore)\n";
for (my $i=0;$i<scalar(@queries);$i++) {
  for (my $k=$i+1;$k<scalar(@queries);$k++) {
   my $query = $queries[$i];
   my $target = $queries[$k];
   
   my $scoreA = $pairs_norm_hash{$query}{$target} ? $pairs_norm_hash{$query}{$target} : int(0);
   my $scoreB = $pairs_norm_hash{$target}{$query} ? $pairs_norm_hash{$target}{$query} : int(0);
   my $average_score = ($scoreA + $scoreB) / 2; 
#scale:
   print OUT "$query\t$target\t$average_score\t".sprintf("%.6f",log($average_score))."\n" if $average_score;
 }
}

close OUT;

#my $stat = Statistics::Descriptive::Full->new();
#$stat->add_data(\@scores);

open( OUT, ">$outfile.matrix.csv" );
print OUT "ID\t" . join( "\t", @queries ) . "\n";

#each row
foreach my $query (@queries) {
  my $qid   = md5_hex($query);
  my $print = $query;

  #each column
  foreach my $target (@queries) {
    my $tid = md5_hex($target);
    my $score = $dissimilarity_matrix_hash{$qid}{$tid} ? $dissimilarity_matrix_hash{$qid}{$tid} : 'NA';
    $print .= "\t" . $score;
  }
  print OUT $print . "\n";
}
close OUT;
