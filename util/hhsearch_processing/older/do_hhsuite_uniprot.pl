#!/usr/bin/env perl

use strict;
use warnings;
my $dbdir = shift;
$dbdir = '/scratch/pap056/databases/hhsearch/' unless $dbdir;
my $dir = `pwd`;chomp($dir);
open (OUT,">multithread.unip.sh");
my @files = glob($dir."/*seq");
foreach my $file (@files){
	my $name = $file;
	$name =~s/\.seq$//;
	my $out = $name .'.vs_uniprot.hhr';
	if ($out && -s $out){
		my $check = `tail -n 1 $out`;
		next if $check && $check=~/^Done!/;
	}
	print OUT "hhblits -z 0 -b 0 -E 1e-1 -p 70  -maxmem 5 -v 1 -i '$file' -d '$dbdir/uniprot20_2012_10_klust20_dc_2012_12_10' -oa3m '$name.vs_uniprot.a3m' -o '$out' -n 2 -mact 0.5 -addss -psipred /home/pap056/software/psipred/2/bin -psipred_data /home/pap056/software/psipred/2/data  >/dev/null\n";
}

close OUT;

if (-s "multithread.unip.sh"){
	system("shuf multithread.unip.sh > multithread.unip.sh.");
	unlink("multithread.unip.sh");
	rename("multithread.unip.sh.","multithread.unip.sh");
	system("rm multithread.unip.sh.* -f");
	system("split -a 3 -d -l 50 multithread.unip.sh  multithread.unip.sh.");
}
