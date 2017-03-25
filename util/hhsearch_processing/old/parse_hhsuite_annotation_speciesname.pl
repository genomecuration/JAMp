#!/usr/bin/perl -w

use strict;
my $file = shift||die;

open (IN,$file)||die;
open (OUT,">$file.out")||die;
while (my $ln=<IN>){
	chomp($ln);
	my @data = split("\t",$ln);
	$data[1]=~/^([A-Z][a-z]{3})([A-Z][A-Za-z]+)\d*/ || warn $data[1];
	push(@data,$1);
	push(@data,$2);
	print OUT join ("\t",@data)."\n";
}
close IN;
close OUT;
