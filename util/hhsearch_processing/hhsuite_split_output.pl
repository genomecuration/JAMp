#!/usr/bin/env perl

=pod

        'i|fa|fasta=s' => \$file,
        'debug' =>\$debug,
        'hhr' =>\$do_hhr


=cut


use strict;
use warnings;
use Pod::Usage;
use Getopt::Long;

my ($file,$do_hhr,$debug);

GetOptions(
        'i|fa|fasta=s' => \$file,
	'debug' =>\$debug,
	'hhr' =>\$do_hhr
);

$file = shift unless $file;
pod2usage unless $file;

my $orig_sep = $/;
$/ = "Done!\n";
open (IN,$file)||die;
mkdir('a3m_out');
mkdir('hhr_out') if $do_hhr;

RECORD: while (my $record = <IN>){
	my ($ln,@hhr_lines);
 	my @lines = split("\n",$record);
	my $check = pop @lines;
	die "File not ending with Done!\n" unless $check eq "Done!";
	$ln = shift @lines while !$ln || $ln=~/Stop searching!/;
	$ln=~/^Query\s+(\S+)/ || die $ln;
	my $query = $1;
	$query=~s/\|/\\|/g;
	print "Processing query $query\n" if $debug;
	while ($ln!~/^>$query/){
		if ($ln=~/Stop searching!/){
			$ln = shift @lines;
			next;
		}
		push (@hhr_lines,$ln) if $do_hhr;
		$ln = shift @lines;
	}

	$query=~s/[;\/\\&\$\>\<]+//g;
	open (OUT,'>a3m_out/'.$query.'.a3m');
	print OUT $ln."\n".join("\n",@lines)."\n";
	close OUT;
	if ($do_hhr){
		open (OUT,'>hhr_out/'.$query.'.hhr');
		print OUT join("\n",@hhr_lines)."\nDone!\n";
		close OUT;
	}
}
close IN;

$/ = $orig_sep;
