#!/usr/bin/env perl

use strict;
use warnings;

my ($counter);
my $file = shift || die;
open (IN,$file);

my $output_dir = $file . "_unpack";
mkdir ($output_dir) unless -d $output_dir;
my @todelete = glob("$output_dir/*");
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
	$id=~s/\s+/_/g;
	$id=~s/\//-/g;
#	warn "$id already written out. Skipping.\n" if -s "$output_dir/$id";
	next  if -s "$output_dir/$id";
	open (OUT,">$output_dir/$id") ||die "Can't create output for file $id ".$!;
	print OUT $record;
	close OUT;
}
close IN;
print "Processed $counter                 \n";

