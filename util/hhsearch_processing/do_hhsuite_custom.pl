#!/usr/bin/env perl

use strict;
use warnings;
my $custom = shift||die;

my $dir = `pwd`;chomp($dir);
open (OUT,">multithread.custom.sh");
my @files = glob($dir."/*a3m");
@files = glob($dir."/*seq") unless $files[0];
foreach my $file (@files){
	my $name = $file;
	$name =~s/\.seq$//;
	my $out = $name .'.vs_custom.hhr';
	if ($out && -s $out){
		my $check = `tail -n 1 $out`;
		next if $check && $check=~/^Done!/;
	}
	print OUT "hhblits -z 0 -b 0 -E 1e-1 -p 70  -maxmem 5 -v 1 -i '$file' -d '$custom' -o '$out' -n 1 -cpu 1 -mact 0.3 >/dev/null\n";
}

close OUT;

if (-s "multithread.custom.sh"){
	system("shuf multithread.custom.sh > multithread.custom.sh.");
	unlink("multithread.custom.sh");
	rename("multithread.custom.sh.","multithread.custom.sh");
	system("rm multithread.custom.sh.* -f");
	system("split -a 3 -d -l 1000 multithread.custom.sh  multithread.custom.sh.");
	my @a = glob("multithread.custom.sh.*");
	print "Done. Produced 0-".(scalar(@a)-1)." jobs for array\n";
}
