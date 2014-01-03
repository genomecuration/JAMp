#!/usr/bin/env perl

use strict;
use warnings;
my $in = shift ||die;
open (IN,$in);
my @files = <IN>;
close IN;
open (OUT,">multithread_2.sh");
foreach my $ln (@files){
	$ln=~/-i\s(\S+)(.seq)\s/;
	my $name = $1 ||next;
	my $file = $1.$2 || next;
	my $out = $name .'.hhr';
	if ($out && -s $out){
		my $check = `tail -n 1 $out`;
		next if $check && $check=~/^Done!/;
	}
	print OUT $ln;
}

close OUT;

if (-s "multithread_2.sh"){
	system("shuf multithread_2.sh > multithread_2.sh.");
	unlink("multithread_2.sh");
	rename("multithread_2.sh.","multithread_2.sh");
	system("rm multithread.sh* -f");
	system("split -a 3 -d -l 500 multithread_2.sh  multithread.sh.");
}
