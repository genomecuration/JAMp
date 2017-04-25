#!/usr/bin/env perl

=pod

=head1 NAME

 jamp_purge_GO_hhblits_db_all.pl

=head1 USAGE 

    -id_go :s	=> List of FASTA IDs to keep (e.g. because they have a GO annotation
    -db    :s 	=> FFINDEX database of aligned FASTAs. If one aligned sequence is present in the id_go list then alignment is processed, otherwise discarded
    -index :s 	=> Index file of FFINDEX database 
    -noss	=> Do not run addss.pl to add 2ndary structure information nor create HHM database (FASTER)
    -cpu   :i   => Number of CPUs/threads for final cs219 step (def 10)

 Can create a id_go list using this JAMp SQL command:
   psql annotations -c 'select distinct(uniprot_id) from known_proteins.go_assoc;' > uniprot_ids_with_go.txt  

=cut

use strict;
use warnings;
use Data::Dumper;
use Carp;
use Digest::MD5 qw/md5_base64/;
use Getopt::Long;
use Pod::Usage;
use FindBin qw($RealBin);
#use threads;
use lib ("$RealBin/../../PerlLib");
$ENV{'PATH'} .= ":$RealBin:$RealBin/../../3rd_party/bin";

my ($uniprot_ids_with_go,$index_file,$db_file,$no_ss,$fix_public);
my $cpus = 10;
pod2usage $! unless &GetOptions(
	'id_go:s' => \$uniprot_ids_with_go,
	'index:s' => \$index_file,
	'db:s' => \$db_file,
	'noss' => \$no_ss,
	'cpus|threads:i' => \$cpus,
	'fix_public' => \$fix_public
);

my $a3m_dir = './a3m_dir';
my $hhm_dir = './hhm_dir';

mkdir $a3m_dir unless -d $a3m_dir;
mkdir $hhm_dir unless -d $hhm_dir;

my $base_hhblits = "$RealBin/../../3rd_party/hhsuite";
my $hhmake_exec = $base_hhblits."/bin/hhmake";
my $addss_exec = $base_hhblits."/scripts/addss.pl";
my $reformat_exec = $base_hhblits."/scripts/reformat.pl";
my $ffindex_build_exec = $base_hhblits."/bin/ffindex_build";

die unless -d $base_hhblits;
die unless -x $addss_exec ;
die unless -x $ffindex_build_exec;


pod2usage unless $uniprot_ids_with_go  && -s $uniprot_ids_with_go;

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
print "Number of Uniprot IDs kept: ".scalar(keys %uniprot_ids_with_go_hash)."\n";

#rewrite header
my %header_hash;

open (INDEX,$index_file) ||die($!);
my $index_lines = `wc -l < $index_file`;chomp($index_lines);

print "Will process these many records: $index_lines\n";
open (DB,$db_file) ||die($!);
binmode(DB);
my $counter = int(0);
my $counter_pass = int(0);

while (my $index_ln=<INDEX>){
	$counter++;
	print "Processed $counter / $index_lines ($counter_pass passed)     \r" if ($counter % 100 == 0 && !$no_ss) || ($counter % 1000 == 0 && $no_ss);
	chomp($index_ln);
	my @index_data = split("\t",$index_ln);
	next unless $index_data[2];
	seek(DB,$index_data[1],0);
	my $record;
	my $length = read(DB,$record,$index_data[2]);
	next unless $record;
	$record=~s/\x00$//;
	&process_msa($record);
#	my $thr = threads->create('process_msa', $record);
#	$thr->detach();	print "$counter \r";
#	sleep(1);
}

close DB;
close INDEX;
print "Processed $counter / $index_lines ($counter_pass passed)     \n";

unlink("a3m.ffdata");unlink("a3m.ffindex");
&process_cmd("$ffindex_build_exec -s a3m.ffdata a3m.ffindex a3m_dir/");

unless ($no_ss){
	unlink("hhm.ffdata");unlink("hhm.ffindex");
	&process_cmd("$ffindex_build_exec -s hhm.ffdata hhm.ffindex hhm_dir/");
}

print "\nNow running:\n mpirun -np $cpus $base_hhblits/bin/cstranslate_mpi -i a3m -o cs219.ffdata -A $base_hhblits/data/cs219.lib -I a3m\n\n";
&process_cmd("mpirun -np $cpus $base_hhblits/bin/cstranslate_mpi -i a3m -o cs219.ffdata -A $base_hhblits/data/cs219.lib -I a3m");
print "\nDone\n\n";

##########################
sub process_msa(){
    my $record = shift;
    my @lines = split("\n",$record);
    my (@data,$header,$go_check);
    my $number_of_seqs = int(0);

    foreach my $ln (@lines){
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
			##issue createdb will split sequences .e.g tr|H1L0P2_0|H1L0P2_9EURY Split=0
			if ($id_str=~/Split=/){
				# first occurence assumed.
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
	push(@data,$ln."\n");
    }
    return unless $go_check;
    $counter_pass++;
    chop($header);
    my $data_str = join("",@data);
    my $uid = md5_base64($header);
    $uid=~s/\W+//g;

    my $a3m_file = 'a3m_dir/'.$uid;
    return if -s $a3m_file;
    open (OUT,">$a3m_file");
    print OUT '#cl|'."$uid $header\n".$data_str;
    close OUT;

    if ($fix_public){
	    &process_cmd("$reformat_exec a3m a3m $a3m_file $a3m_file. >/dev/null 2>/dev/null");
    }else{
	    &process_cmd("$reformat_exec fas a3m $a3m_file $a3m_file. -M first >/dev/null 2>/dev/null");
    }
    rename("$a3m_file.",$a3m_file) if -s "$a3m_file.";
    unless ($no_ss){
	    &process_cmd("$addss_exec $a3m_file -a3m >/dev/null 2>/dev/null"); 
	    rename("$a3m_file.a3m",$a3m_file) if -s "$a3m_file.a3m";
	    &do_hmm($a3m_file,$uid) if (-s $a3m_file >= 10000 && $number_of_seqs > 40);
    }
 }



sub do_hmm(){
 my ($in,$uid) = @_;
 my $err = &process_cmd($hhmake_exec." -i $in -o $hhm_dir/$uid -v 0 &");
}

sub process_cmd {
 my ($cmd) = @_;
 my $ret = system($cmd);
 return $ret;
}

