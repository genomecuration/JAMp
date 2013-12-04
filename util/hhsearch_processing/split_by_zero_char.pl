#!/usr/bin/env perl

use strict;
use warnings;

my ($counter);
my $file = shift || die;
open (IN,$file);

mkdir ("unpack") unless -d "unpack";
my @todelete = glob("unpack/*");
foreach (@todelete){unlink("$_");}

my $orig_sep = $/;
$/ = "\0";
$|=1;
while (my $record=<IN>){
	$counter++;
	print "\rProcessed $counter   " if $counter % 100 == 0;
	chomp($record);
	$record=~/^[>#]?(\S+)/;
	my $id = $1;
#	warn "$id already written out. Skipping.\n" if -s "unpack/$id";
	next  if -s "unpack/$id";
	open (OUT,">unpack/$id");
	print OUT $record;
	close OUT;
}
close IN;
print "Processed $counter                 \n";

