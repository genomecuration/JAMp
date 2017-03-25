#!/usr/bin/env perl

=pod

=head1 USAGE

Create an HHBlits DB using mmseqs2

 Mandatory
        -base_hh     :s    Base directory with hhblits/hhsuite software
	-infile      :s    Input protein DB that has been clustered and MSA-ed with mmseqs result2msa

 Optional
        -do_cs219          Option to also produce cs219 files
	-do_ss             Add SS prediction
	-threads|CPU :i    Number of CPUs to use (def. 10)
	-compress_header   Don't print description on header of alignment
	-do_swissprot_check
	-use_a3m

 NB: input protein db must not have any -- or -> text in headers. Use SED to remove them (see code description)



=cut

# Suggestions to run this software:
# git clone https://github.com/soedinglab/MMseqs2 && git clone https://github.com/soedinglab/hh-suite
# export PATH=$PATH:$HOME/software/hh-suite/bin/:$HOME/software/hh-suite/scripts
# export HHLIB=$HOME/software/hh-suite
# sed '~s/--/-/g' uniprot_sprot.fasta | sed '~s/->/-/g'  > uniprot_sprot.clean
# mmseqs2/build/bin/mmseqs createdb uniprot_sprot.clean uniprot_sprot
# mmseqs2/build/bin/mmseqs createindex uniprot_sprot
# mmseqs2/build/bin/mmseqs cluster uniprot_sprot uniprot_sprot.clu /dev/shm/ --remove-tmp-files --spaced-kmer-mode 0 --alignment-mode 3 -c 0.6 --max-seqs 500 --min-seq-id 0.3 --frag-merge
# mmseqs2/build/bin/mmseqs result2msa uniprot_sprot uniprot_sprot uniprot_sprot.clu uniprot_sprot.clu_msa --max-seq-id 0.7

use strict;
use warnings;
use Data::Dumper;
use File::Basename;
use Pod::Usage;
use Getopt::Long;
use FindBin qw/$RealBin/;
use lib $RealBin."/../../PerlLib";
use threads;
use Thread_helper;

my $threads = 10;
my $db_infile;
my ($also_do_cs219,$base_hhblits,$do_addss,$compress_headers,$use_a3m,$do_swissprot_check);
my $a3m_dir = 'a3m_dir';
my $hhm_dir = 'hhm_dir';
my $msa_dir = 'msa_dir';
my $cs219_dir = 'cs219_dir';
GetOptions(
	'threads|CPU:i'=>\$threads,
	'base_hh:s' => \$base_hhblits,
	'do_cs219' => \$also_do_cs219,
	'use_a3m' => \$use_a3m,
	'do_ss' => \$do_addss,
	'infile:s' => \$db_infile,
	'compress_header' => \$compress_headers,
	'do_swissprot_check' => \$do_swissprot_check,
);
pod2usage "No DB infile\n" if $db_infile && !-s $db_infile && !$use_a3m;
pod2usage "No A3M directory given or found\n" unless ($a3m_dir && -d $a3m_dir && $use_a3m) || $db_infile;
pod2usage "Cannot find the base directory of HHblits\n" if $base_hhblits && !-d $base_hhblits;
my $base_infile = basename($db_infile);

mkdir ($a3m_dir) unless -d $a3m_dir;
mkdir ($hhm_dir) unless -d $hhm_dir;
mkdir $cs219_dir unless -d $cs219_dir;
print "Using up to $threads CPUs\n";
my $thread_helper = new Thread_helper($threads);

my ($ffindex_unpack_exec,$hhmake_exec,$a3m_exec,$addss_exec,$cstranslate_exec,$hhsuite_db_exec) = &check_program("ffindex_unpack","hhmake","hhconsensus","addss.pl","cstranslate","hhsuitedb.py");
my $cstranslate_db1 = "$base_hhblits/data/context_data.lib";
my $cstranslate_db2 = "$base_hhblits/data/cs219.lib";
my $cs_command = "$cstranslate_exec -D $cstranslate_db1 -A $cstranslate_db2 -x 0.3 -c 4 -I a3m -b";

die ("Cannot find $cstranslate_db1") unless -s $cstranslate_db1;
die ("Cannot find $cstranslate_db2") unless -s $cstranslate_db2;

##
if ($use_a3m){
	my $counter;
	my @files = glob("$a3m_dir/*");
	my $file_number = scalar(@files);
	print "Processing $file_number alignments\n";
	foreach my $file (@files){
		next unless -s $file;
		$counter++;
		if ($counter % 100 == 0){
			print "\r Processed $counter / $file_number        ";
			sleep(1);
		}
	        my $thread = threads->create('process_a3m',$file);
	       	$thread_helper->add_thread($thread);
	}
}else{

	print "Splitting db into MSAs\n";
	unless (-d $msa_dir){
		mkdir ($msa_dir);
		system("$ffindex_unpack_exec $db_infile $db_infile.index $msa_dir");
	}
	my $counter;
	my @files = glob("$msa_dir/*");
	my $file_number = scalar(@files);
	print "Processing $file_number alignments\n";
	foreach my $file (@files){
		next unless -s $file;
		$counter++;
		if ($counter % 100 == 0){
			print "\r Processed $counter / $file_number        ";
			sleep(1);
		}
	        my $thread = threads->create('make_a3m',$file);
	       	$thread_helper->add_thread($thread);
	}
}
$thread_helper->wait_for_all_threads_to_complete();
my @failed_threads = $thread_helper->get_failed_threads();
 if (@failed_threads) {
  die "Error, " . scalar(@failed_threads) . " threads failed.\n";
  exit(1);
 }
print "\n";
sleep(3);
print "Creating HHBlits database\n";
system ("$hhsuite_db_exec --ia3m='a3m_dir/*' --ics219='cs219_dir/*' --ihhm='hhm_dir/*' --cpu=$threads -o $base_hhblits");
print "\nDone!\n";

######################################################################
sub make_a3m(){
	my $msa_file = shift;
	my $base = basename($msa_file);
	my $a3m_file = "$a3m_dir/$base";
	system("$a3m_exec -i $msa_file -o $a3m_file  -M first >/dev/null 2>/dev/null");
	&process_a3m($a3m_file);
}

sub process_a3m(){
	my $a3m_file = shift;
	my $base = basename($a3m_file);
	#rewrite header
	my %header_hash;
	open (A3MI,$a3m_file);
	my ($header1,$header2,$number_of_seqs);
	my (@data,$sw_check);
	while (my $ln=<A3MI>){
		if ($ln=~s/^#(\S+\|\S+\|?\S*)//){
			$header1 = '#cl|'.$base." ".$1;
			$ln=~s/->/-/g;
			$ln=~s/--/-/g;
			while ($ln=~s/\s(OS)=([A-Z][a-z]+\s+[a-z]+)//){
				unless ($header_hash{$1} && $header_hash{$1} eq $1."=".$2){
					$header1 .= " $1=$2";
					$header_hash{$1} = $1."=".$2;
				}
			}
			while ($ln=~s/\s([A-Z]{2})=(\S+)//){
				unless ($header_hash{$1} && $header_hash{$1} eq $1."=".$2){
					$header1 .= " $1=$2";
					$header_hash{$1} = $1."=".$2;
				}
			}
			$header2 = $ln;
			chomp($header2);
		}else{
			push(@data,$ln);
			$sw_check++ if $ln=~/^>sp\|/;
			if ($ln=~s/^>(\S+\|\S+\|?\S*)//){
				$number_of_seqs++;
				$header1 .= " ".$1;
				$ln=~s/->/-/g;
				$ln=~s/--/-/g;
				while ($ln=~s/\s(OS)=([A-Z][a-z]+\s+[a-z]+)//){
					unless ($header_hash{$1} && $header_hash{$1} eq $1."=".$2){
						$header1 .= " $1=$2";
						$header_hash{$1} = $1."=".$2;
					}
				}
				while ($ln=~s/\s([A-Z]{2})=(\S+)//){
					unless ($header_hash{$1} && $header_hash{$1} eq $1."=".$2){
						$header1 .= " $1=$2";
						$header_hash{$1} = $1."=".$2;
					}
				}
				$header2 .=$ln;
				chomp($header2);
			}
		}
	}
	close A3MI;
	if (!$sw_check && $do_swissprot_check){
		unlink($a3m_file);
		return;
	}
	$header1 .= " ".$header2 unless $compress_headers;
	open (A3MO,">$a3m_file");
	print A3MO "$header1\n".join("",@data);
	close A3MO;
	if ($do_addss){
		system("$addss_exec $a3m_file -a3m >/dev/null 2>/dev/null");
		rename("$a3m_file.a3m",$a3m_file);
	}
	if ($also_do_cs219){
		&do_cs219($a3m_file,$base);
	}
	if (-s $a3m_file >= 10000 && $number_of_seqs > 40){
		&do_hmm($a3m_file,$base);
	}
}

sub do_hmm(){
 my ($in,$base) = @_;
 my $err = system($hhmake_exec." -i $in -o $hhm_dir/$base -v 0 ");
}


sub do_cs219(){
	my ($in,$base) = @_;
	my $err = system($cs_command." -i $in -o $cs219_dir/$base  >/dev/null ");
}

sub check_program() {
 my @paths;
 foreach my $prog (@_) {
  my $path = `which $prog`;
  pod2usage "Error, path to a required program ($prog) cannot be found\n\n"
    unless $path =~ /^\//;
  chomp($path);
  $path = readlink($path) if -l $path;
  push( @paths, $path );
 }
 return @paths;
}

