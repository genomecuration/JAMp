#!/usr/bin/perl

use strict;
use warnings;

# i use this to reconstruct the HHblits distributed
# DB to be the way i like it: only swissprot-supported
# entries and psipred added
# best performed with a ffindex_apply using a split index
# (for parallel CPU processing) using /dev/shm

# e.g.: 
# split -l 207500 -d -a 2 uniprot20_2016_02_a3m.ffindex uniprot20_2016_02_a3m.ffindex.
# for i in {0..39}; do i=`printf "%02d" $i` && 
#    ffindex_apply uniprot20_2016_02_a3m.ffdata uniprot20_2016_02_a3m.ffindex.$i jamp_purge_uniprot_hhblits_db.pl &  done
# for i in {0..39}; do fg;done



my $a3m_dir = 'a3m_dir';
my $hhm_dir = 'hhm_dir';
my $cs219_dir = 'cs219_dir';

my $base_hhblits = $ENV{'HOME'}."/software/hh-suite";
my $ffindex_unpack_exec = $base_hhblits."/bin/ffindex_unpack";
my $hhmake_exec = $base_hhblits."/bin/hhmake";
my $a3m_exec = $base_hhblits."/bin/hhconsensus";
my $addss_exec = $base_hhblits."/scripts/addss.pl";
my $cstranslate_exec = $base_hhblits."/bin/cstranslate";
my $hhsuite_db_exec = $base_hhblits."/scripts/hhsuitedb.py";


mkdir $a3m_dir unless -d $a3m_dir;
mkdir $hhm_dir unless -d $hhm_dir;
mkdir $cs219_dir unless -d $cs219_dir;
my $cstranslate_db1 = "$base_hhblits/data/context_data.lib";
my $cstranslate_db2 = "$base_hhblits/data/cs219.lib";
my $cs_command = "$cstranslate_exec -D $cstranslate_db1 -A $cstranslate_db2 -x 0.3 -c 4 -I a3m -b";

	#rewrite header
	my %header_hash;
	open (STDIN,"-") ||die;
	my ($header1,$header2,$number_of_seqs);
	my (@data,$sw_check,$a3m_file,$base);
	while (my $ln=<STDIN>){
		if ($ln=~s/^#(\S+\|(\S+)\|?\S*)//){
			$base = $2;
			$a3m_file = "a3m_dir/".$base;
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
	close STDIN;
	exit(0) unless $a3m_file && $sw_check;
	open (A3MO,">$a3m_file");
	print A3MO "$header1\n".join("",@data);
	close A3MO;
	system("$addss_exec $a3m_file -a3m >/dev/null 2>/dev/null");
	rename("$a3m_file.a3m",$a3m_file);
	&do_cs219($a3m_file,$base);
	if (-s $a3m_file >= 10000 && $number_of_seqs > 40){
		&do_hmm($a3m_file,$base);
	}
##########################
sub do_hmm(){
 my ($in,$base) = @_;
 my $err = system($hhmake_exec." -i $in -o $hhm_dir/$base -v 0 ");
}


sub do_cs219(){
	my ($in,$base) = @_;
	my $err = system($cs_command." -i $in -o $cs219_dir/$base  >/dev/null ");
}

