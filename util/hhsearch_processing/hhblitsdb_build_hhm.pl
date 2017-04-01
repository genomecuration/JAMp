#!/usr/bin/env perl


use strict;
use warnings;

my $tmpdir = shift;
die unless $tmpdir && -d $tmpdir;
my $hhmfile = shift || die;

my $hhmext = 'hhm';
my $ffindex_build_exec = `which ffindex_build` || die;chomp($ffindex_build_exec);

    open (OUT, ">hhm.filelist");
    my $numhhmfiles = 0;
    my @files = glob("$tmpdir/*.$hhmext");
    $numhhmfiles += scalar(@files);
    foreach my $file (@files) {
            print OUT "$file\n";
    }
    close OUT;

    system("$ffindex_build_exec -s -f hhm.filelist $hhmfile $hhmfile.index");
 
    open (OUT, ">$hhmfile.index.sizes");
    print OUT "$numhhmfiles\n";
    close OUT;
    unlink("hhm.filelist");

