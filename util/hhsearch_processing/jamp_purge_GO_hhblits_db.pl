#!/usr/bin/perl
# i use this to reconstruct the HHblits distributed DB to be the way i like it: only GO- term containing 
# entries and psipred added if possible best done in /dev/shm/$USER best performed with a ffindex_apply

# e.g.: 
# CPUS=30
# DB=uniprot_sprot
# mkdir -p /dev/shm/$USER && cd /dev/shm/$USER
# rm -rf a3m_dir hhm_dir; mkdir a3m_dir hhm_dir # ensure empty dir
# # export the right paths and the HHLIB env
# psql annotations -c 'select distinct(uniprot_id) from known_proteins.go_assoc;' > uniprot_ids_with_go.txt  
# MPI will not work
# split -a 2 -d -n l/$CPUS ${DB}.ffindex ${DB}.ffindex.
# test one for a bit then exit with control-C
# ffindex_apply ${DB}.ffdata ${DB}.ffindex.00 $JAMP_DIR/util/hhsearch_processing/jamp_purge_GO_hhblits_db.pl uniprot_ids_with_go.txt
# for for loops, $CPUS cannot be used, use number
# for i in {0..29}; do i=`printf "%02d" $i` && ffindex_apply ${DB}.ffdata ${DB}.ffindex.$i $JAMP_DIR/util/hhsearch_processing/jamp_purge_GO_hhblits_db.pl uniprot_ids_with_go.txt & done
# for i in {0..29}; do fg;done
# ffindex_build 

use strict;
use warnings;
use Digest::MD5 qw/md5_base64/;

my $a3m_dir = './a3m_dir';
my $hhm_dir = './hhm_dir';
mkdir $a3m_dir unless -d $a3m_dir;
mkdir $hhm_dir unless -d $hhm_dir;
my $base_hhblits = $ENV{'HOME'}."/software/hh-suite";
my $hhmake_exec = $base_hhblits."/bin/hhmake";
my $addss_exec = $base_hhblits."/scripts/addss.pl";

die unless -d $base_hhblits;
die unless -x $addss_exec ;



my $uniprot_ids_with_go = shift;
die "I need a file with Uniprot IDs, e.g.:\n\tpsql annotations -c ' select distinct(uniprot_id)  from known_proteins.go_assoc ;' > uniprot_ids_with_go.txt\n\nThen I will read the data from STDIN\n\n" unless $uniprot_ids_with_go  && -s $uniprot_ids_with_go;

my %uniprot_ids_with_go_hash;
open (IN,$uniprot_ids_with_go) ||die $!;
my $discard_header =<IN>;
while (my $ln = <IN>){
	chomp($ln);
	next if $ln=~/^\s*$/ || $ln=~/^-/;
	$ln=~s/\s+//g;
	$uniprot_ids_with_go_hash{$ln}++;
}
close IN;


# first we read every sequence and create an a3m header with all the representatives.
# if identified in the list, then we carry on and print the a3m


#rewrite header
my %header_hash;
open (STDIN,"-") ||die("No STDIN\n");

my (@data,$header,$go_check);
my $number_of_seqs = int(0);

while (my $ln=<STDIN>){
	next if $ln=~/^#/ || $ln=~/^\s*$/;
	if ($ln=~/^>(\S+)/){
		$ln=~s/->/-/g;
		$ln=~s/--/-/g;
		$number_of_seqs++;
		my $id_str = $1;
		next unless $id_str;
		my $id;
		if ($id_str =~/[st][pr]\|([^\|]+)\|/){
			$id=$1;
			##iissue createdb will split sequences .e.g tr|H1L0P2_0|H1L0P2_9EURY Split=0
			if ($id_str=~/Split=/){
				# first occurence assumeed.
				$id_str=~s/_\d+//;
				$id=~s/_\d+//;
				$ln=~s/_\d+//;
			}
			$go_check++ if $uniprot_ids_with_go_hash{$id};
		}
		next unless $id_str;
		$header.=$id_str." ";
		if ($ln=~/\s(OS)=([A-Z][a-z]+\s+[a-z]+)/){
			$header.="$1=$2 ";
		}while ($ln=~/\s([A-Z]{2})=(\S+)/g){
			next if $1 eq 'OS';
			$header.="$1=$2 ";
		}
	}
	push(@data,$ln);
}
close STDIN;
exit(0) unless $go_check;
#print '.';
chop($header);
my $data_str = join("",@data);
my $uid = md5_base64($header);
$uid=~s/\W+//g;
$header = '#cl|'."$uid $header\n";


my $a3m_file = 'a3m_dir/'.$uid;
die "Collision $a3m_file\n" if -s $a3m_file;
open (OUT,">$a3m_file");
print OUT $header.$data_str;
close OUT;
system("$addss_exec $a3m_file -a3m >/dev/null 2>/dev/null");
rename("$a3m_file.a3m",$a3m_file);

if (-s $a3m_file >= 10000 && $number_of_seqs > 40){
	&do_hmm($a3m_file,$uid);
}

#open (A3M,"$a3m_file.a3m");
#slurp for i/o
#my @lines = <A3M>;
#close A3M;
#print @lines;

#unlink("$a3m_file");
#unlink("$a3m_file.a3m");

##########################
sub do_hmm(){
 my ($in,$uid) = @_;
 my $err = system($hhmake_exec." -i $in -o $hhm_dir/$uid -v 0 ");
}
