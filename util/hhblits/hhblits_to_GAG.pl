#!/usr/bin/perl

use strict;
use warnings;
my $outfile = shift;
die "Cant find file $outfile\n" unless $outfile && -s $outfile;

my $orig_sep = $/;
$/ = 'Query         ';
open (IN,$outfile);
	while (my $record = <IN>){
		my @lines = split("\n",$record);
		my $id_ln = shift(@lines);
		if ($id_ln=~/(\S+)/){
			my $id = $1;
			$hash{$id}++;
		}else{next;}
	}
close IN;

}
$/ = $orig_sep;

open(OUT,">$ffindex.failed");

foreach my $id (keys %hash){
	if ($hash{$id} == 1){
		warn "$id failed\n";
		my $fail = `ffindex_get $ffdata $ffindex $id`;
		print OUT $fail if $fail;
	}	

}
close OUT;
print "\nDone, see $ffindex.failed\n\n" if -s "$ffindex.failed";
print "\nDone, no problems\n\n"  if !-s "$ffindex.failed";
