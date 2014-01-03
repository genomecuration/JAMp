#!/usr/bin/env perl

use strict;
use warnings;
my $dbdir = shift;
$dbdir = '~/30day/databases/hhsearch/' unless $dbdir;
my $dir = `pwd`;chomp($dir);
open (OUT,">multithread.repeats.sh");
my @files = glob($dir."/*seq");
foreach my $file (@files){
	my $name = $file;
	$name =~s/\.seq$//;
	my $out = $name .'.vs_repeats.hhr';
	if ($out && -s $out){
		my $check = `tail -n 1 $out`;
		next if $check && $check=~/^Done!/;
	}
	print OUT "hhblits -z 0 -b 0 -E 1e-1 -p 70  -maxmem 5 -v 1 -i '$file' -d '$dbdir/transposons' -o '$out' -n 2 -mact 0.5 >/dev/null\n";
}

close OUT;

if (-s "multithread.repeats.sh"){
	system("shuf multithread.repeats.sh > multithread.repeats.sh.");
	unlink("multithread.repeats.sh");
	rename("multithread.repeats.sh.","multithread.repeats.sh");
	system("rm multithread.repeats.sh.* -f");
	system("split -a 3 -d -l 1000 multithread.repeats.sh  multithread.repeats.sh.");
}
