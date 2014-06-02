#!/usr/bin/env perl

use strict;
use warnings;
use File::Basename;
use threads;
use Thread_helper;

my $threads = 10;
my $a3m_dir = shift || die;
die unless -d $a3m_dir;
my $hhmake_exec = `which hhmake` || die("$!"); chomp($hhmake_exec);
my $hhm_dir = 'hhmdir';
mkdir ($hhm_dir) unless -d $hhm_dir;

my $thread_helper = new Thread_helper($threads);


my @files = glob("$a3m_dir/*a3m");
my $counter;
foreach my $file (@files){
	$counter++;
	if ($counter % 1000 == 0){
		print "\r Processed $counter / ".scalar(@files)."                   ";
	}
	my $outfile = $file;
	$outfile = basename($outfile);
	$outfile=~s/\.a3m$/.hhm/;
	$outfile = "$hhm_dir/$outfile";
	unlink($outfile) if -s $outfile;
	if (-s $file < 10000){
		unlink ($file);
		next;
	}
	my $thread = threads->create('do_job',$file,$outfile);
	$thread_helper->add_thread($thread);
}

 $thread_helper->wait_for_all_threads_to_complete();
 my @failed_threads = $thread_helper->get_failed_threads();
 if (@failed_threads) {
  die "Error, " . scalar(@failed_threads) . " threads failed.\n";
  exit(1);
 }

print "\nDone!\n";


###
sub do_job(){
 my ($in,$out) = @_;
 my $err = system($hhmake_exec." -i $in -o $out -v 0 ");
 unlink($in) unless $err && $err > 0;
}
