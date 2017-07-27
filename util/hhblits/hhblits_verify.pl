#!/usr/bin/perl

use strict;
use warnings;
my $ffindex = shift;
my @files = glob("*out");
die "Cant find ffindex $ffindex\n" unless $ffindex && -s $ffindex;
my $ffdata = $ffindex;
$ffdata=~s/ffindex$/ffdata/;
die "Cant find ffdata $ffdata\n" unless -s $ffdata;

my %hash;
open (IN,$ffindex);
while (my $ln=<IN>){
	my @data = split("\t",$ln);
	next unless $data[1];
	$hash{$data[0]}++;
}
close IN;
$|=1;

my $orig_sep = $/;
$/ = 'Query         ';
my $counter;
foreach my $file (@files){
	$counter++;
	print "Processed $counter / ".scalar(@files)."    \r";
	open (IN,$file);
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
print "Processed $counter / ".scalar(@files)."    \n";
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
