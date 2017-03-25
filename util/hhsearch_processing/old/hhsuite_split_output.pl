#!/usr/bin/env perl

=pod

=head1 USAGE

Split HH result file to create a file for each query with just the A3M alignments

	in  => HHBlits output that has both HH results and A3M alignments
        hhr => Print out HH results in a separate file as well as A3M

Results will be in one (or two with -hhr) directories: a3m_out and hhr_out

=cut


use strict;
use warnings;
use Pod::Usage;
use Getopt::Long;

my ($hhr_a3m_output,$do_hhr,$debug);

GetOptions(
        'in:s' => \$hhr_a3m_output,
	'debug' =>\$debug,
	'hhr' =>\$do_hhr
);

$hhr_a3m_output = shift unless $hhr_a3m_output;
pod2usage unless $hhr_a3m_output;

my $orig_sep = $/;
$/ = "Done!\n";
open (IN,$hhr_a3m_output)||die;
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
