#!/usr/bin/env perl

use strict;
my $force =shift;
use warnings;
#my $dir = `pwd`;chomp($dir);
my $dir = '.';
open (OUT1,">multithread_addss.sh");
open (OUT2,">multithread_addss.toolong.sh");
my @files = glob($dir."/*a3m");
foreach my $file (@files){
	my $name = $file;
	$name =~s/\.a3m$//;
	my @checks = `head -n 2 $file`;
	# sspred ran; output not empty
	next if (!$force && ($checks[0] && $checks[0]=~/^>ss_pred/) && ($checks[1] && $checks[1]!~/^\s*$/));
        if (($checks[0] && $checks[0]=~/^>ss_pred/) && ($checks[1] && $checks[1]=~/^\s*$/)){
  	   print OUT2 "addss.pl $file >/dev/null\n";
           open (IN,$file);
           open (OUT,">$file.t");
           #skip 4 lines
           my $skip = <IN>.<IN>.<IN>.<IN>;
	   while (my $ln=<IN>){
              print OUT $ln;
           }
	   close IN;
	   close OUT;
           unlink($file);
	   rename("$file.t",$file);
        }else{
           if (-s $file > 5485760){
          	   print OUT2 "addss.pl $file >/dev/null\n";
           }else{
	  	   print OUT1 "addss.pl $file >/dev/null\n";
	   }
	}
}

close OUT1;
close OUT2;
