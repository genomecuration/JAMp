#!/usr/bin/env perl

use strict;
use warnings;
my $dbdir = shift;
$dbdir = '~/30day/databases/hhsearch/' unless $dbdir;
my $dir = `pwd`;chomp($dir);
open (OUT,">multithread.pfam.sh");
my @files = glob($dir."/*seq");
foreach my $file (@files){
	my $name = $file;
	$name =~s/\.seq$//;
	my $out = $name .'.vs_pfam.hhr';
	if ($out && -s $out){
		my $check = `tail -n 1 $out`;
		next if $check && $check=~/^Done!/;
	}
	print OUT "hhblits -z 0 -b 0 -E 1e-1 -p 70  -maxmem 5 -v 1 -i '$file' -d '$dbdir/pfamA_v26.0_06Dec11' -o '$out' -n 2 -mact 0.5 >/dev/null\n";
}

close OUT;

if (-s "multithread.pfam.sh"){
	system("shuf multithread.pfam.sh > multithread.pfam.sh.");
	unlink("multithread.pfam.sh");
	rename("multithread.pfam.sh.","multithread.pfam.sh");
	system("rm multithread.pfam.sh.* -f");
	system("split -a 3 -d -l 1000 multithread.pfam.sh  multithread.pfam.sh.");
}
