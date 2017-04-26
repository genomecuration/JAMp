#!/usr/bin/env perl

=pod

=head1 NAME

 jamp_purge_GO_hhblits_db_all.pl

=head1 USAGE 

    -id_go :s	=> List of FASTA IDs to keep (e.g. because they have a GO annotation
    -db    :s 	=> FFINDEX database of aligned FASTAs. If one aligned sequence is present in the id_go list then alignment is processed, otherwise discarded
    -index :s 	=> Index file of FFINDEX database 
    -noss	=> Do not run addss.pl to add 2ndary structure information (FASTER)
    -cpu   :i   => Number of CPUs/threads for building HHBlits databases (def 10). Set to 0 to disable it and only do GO term ID and reformating.

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
use lib ("$RealBin/../../PerlLib");
$ENV{'PATH'} .= ":$RealBin:$RealBin/../../3rd_party/bin";

my ($uniprot_ids_with_go,$index_file,$db_file,$no_ss,$fix_public,$use_a3m_dir,$debug);
my $cpus = 10;
pod2usage $! unless &GetOptions(
	'debug' => \$debug,
	'id_go:s' => \$uniprot_ids_with_go,
	'index:s' => \$index_file,
	'db:s' => \$db_file,
	'noss' => \$no_ss,
	'cpus|threads:i' => \$cpus,
	'fix_public' => \$fix_public,
	'use_a3m_dir' => \$use_a3m_dir,
);

my $a3m_dir = './a3m_dir';
my $hhm_dir = './hhm_dir';

mkdir $a3m_dir unless -d $a3m_dir;

my $base_hhblits = "$RealBin/../../3rd_party/hhsuite";
my $hhmake_exec = $base_hhblits."/bin/hhmake";
my $addss_exec = $base_hhblits."/scripts/addss.pl";
#my $reformat_exec = $base_hhblits."/scripts/reformat.pl";
my $reformat_exec = $base_hhblits."/bin/hhconsensus";
my $ffindex_build_exec = $base_hhblits."/bin/ffindex_build";
my $ffindex_order_exec = $base_hhblits."/bin/ffindex_order";
my $mpirun_exec = `which mpirun`; die "No mpirun installed\n" unless $mpirun_exec;chomp($mpirun_exec);

die "Can't find hhsuite directory $base_hhblits\n" unless -d $base_hhblits;
die "Can't find executable $addss_exec\n" unless -x $addss_exec ;
die "Can't find executable $ffindex_build_exec\n" unless -x $ffindex_build_exec;
die "Can't find executable $ffindex_order_exec\n" unless -x $ffindex_order_exec;
die "Can't find executable $reformat_exec\n" unless -x $reformat_exec;
die "Can't find executable $hhmake_exec\n" unless -x $hhmake_exec;

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

die "No Uniprot IDs found!\n" unless scalar(keys %uniprot_ids_with_go_hash) > 0;

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


if ($use_a3m_dir){
 $counter_pass = `find $a3m_dir -type f|wc -l`;chomp($counter_pass);
  $counter = $index_lines;
}else{
  while (my $index_ln=<INDEX>){
	$counter++;
	print "Processed $counter / $index_lines ($counter_pass passed)     \r" if ($counter_pass % 1000 == 0);
	chomp($index_ln);
	my @index_data = split("\t",$index_ln);
	next unless $index_data[2];
	seek(DB,$index_data[1],0);
	my $record;
	my $length = read(DB,$record,$index_data[2]);
	next unless $record;
	$record=~s/\x00$//;
	&process_msa($record);
 }
}
close DB;
close INDEX;
print "Processed $counter / $index_lines ($counter_pass passed)     \n";


if (!$debug){
unlink("a3m.ffdata");unlink("a3m.ffindex");
&process_cmd("$ffindex_build_exec -s a3m.ffdata a3m.ffindex a3m_dir/");

exit(0) if !$cpus || $cpus < 1;

#system("rm -rf a3m_dir");

unlink("temp.ffdata");unlink("temp.ffindex");

print "Formatting...\n";
if ($fix_public){
    &process_cmd("$mpirun_exec -np $cpus ffindex_apply_mpi a3m.ff{data,index} -d temp.ffdata -i temp.ffindex -- "
		."$reformat_exec -maxres 34000 -v 0 -M a2m -i /dev/stdin -oa3m /dev/stdout >/dev/null 2>/dev/null");
}else{
    &process_cmd("$mpirun_exec -np $cpus ffindex_apply_mpi a3m.ff{data,index} -d temp.ffdata -i temp.ffindex -- "
	."$reformat_exec -maxres 34000 -v -M 40 0 -i /dev/stdin -oa3m /dev/stdout >/dev/null 2>/dev/null");
}
  sleep(3);
  die "Failed... $reformat_exec " unless -s "temp.ffdata" && -s "temp.ffindex";
  rename("temp.ffdata","a3m.ffdata");
  rename("temp.ffindex","a3m.ffindex");
  system("rm -f temp.ffdata* temp.ffindex*");
  die "Failed $reformat_exec " unless -s "a3m.ffdata" && -s "a3m.ffindex";
  unless ($no_ss){
	&process_cmd("$mpirun_exec -np $cpus ffindex_apply_mpi a3m.ff{data,index} -d temp.ffdata -i temp.ffindex -- "
	."$addss_exec /dev/stdin /dev/stdout -a3m 2>/dev/null >/dev/null"); 
	sleep(3);
	die "Failed... $addss_exec " unless -s "temp.ffdata" && -s "temp.ffindex";
	rename("temp.ffdata","a3m.ffdata");
	rename("temp.ffindex","a3m.ffindex");
	system("rm -f temp.ffdata* temp.ffindex*");
    }
die "Failed $addss_exec " unless -s "a3m.ffdata" && -s "a3m.ffindex";
}
print "Creating HHM...\n";
  unlink("hhm.ffdata");unlink("hhm.ffindex");
  &process_cmd("$mpirun_exec -np $cpus ffindex_apply_mpi a3m.ff{data,index} -d hhm.ffdata -i hhm.ffindex -- "
	."$hhmake_exec -i /dev/stdin -o /dev/stdout -v 0 -id 100 -diff 500 2>/dev/null >/dev/null");
 
print "Creating column states...\n";
  unlink("cs219.ffdata");unlink("cs219.ffindex");
  &process_cmd("$mpirun_exec -np $cpus $base_hhblits/bin/cstranslate_mpi -i a3m -o cs219 -A $base_hhblits/data/cs219.lib -I a3m >/dev/null 2>/dev/null");
  sleep(3);
 die "Failed to create cs219.ffdata" unless -s "cs219.ffdata" && -s "cs219.ffindex";

print "Sorting...\n";
  &process_cmd("sort -nk3 cs219.ffindex | cut -f1 > sorting.dat");
  die "Can't sort cs219.ffindex" unless -s "sorting.dat";;
  &process_cmd("$ffindex_order_exec sorting.dat hhm.ff{data,index} hhm_ordered.ff{data,index}");
  rename("hhm_ordered.ffdata","hhm.ffdata") if -s "hhm_ordered.ffdata";
  rename("hhm_ordered.ffindex","hhm.ffindex") if -s "hhm_ordered.ffindex";

  &process_cmd("$ffindex_order_exec sorting.dat a3m.ff{data,index} a3m_ordered.ff{data,index}");
  rename("a3m_ordered.ffdata","a3m.ffdata") if -s "a3m_ordered.ffdata";
  rename("a3m_ordered.ffindex","a3m.ffindex") if -s "a3m_ordered.ffindex";
  unlink("sorting.dat");

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
		my $id_str = $1;
		next unless $id_str;
		$id_str=~s/->/-/g;
		$id_str=~s/</-/g;
		$id_str=~s/>/-/g;
		$id_str=~s/--/-/g;

		$ln=~s/->/-/g;
		$ln=~s/</-/g;
		$ln=~s/(.+)>/$1-/g;
		$ln=~s/--/-/g;

		$number_of_seqs++;
		my $id;
		if ($id_str =~/[st][pr]\|([^\|]+)\|/){
			$id=$1;
			##issue createdb will split sequences .e.g tr|H1L0P2_0|H1L0P2_9EURY Split=0
			if ($id_str=~/Split=/){
				# first occurence assumed.
				$id_str=~s/_\d+//;
				$id=~s/_\d+//;
			}
			$go_check++ if $uniprot_ids_with_go_hash{$id};
		}
		next unless $id;
		$header.=$id_str." ";
		if ($ln=~/\s(OS)=([A-Z][a-z]+\s+[a-z]+)/){
			$header.="$1=$2 ";
		}while ($ln=~/\s([A-Z]{2})=(\S+)/g){
			next if $1 eq 'OS';
			$header.="$1=$2 ";
		}
		$ln = '>'.$id_str;
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
    if (-s $a3m_file){
	return;
    }
    open (OUT,">$a3m_file");
    print OUT '#cl|'."$uid $header\n".$data_str;
    close OUT;
}



sub do_hmm(){
 my ($in,$uid) = @_;
 return if -s "$hhm_dir/$uid";
 my $err = system($hhmake_exec." -i $in -o $hhm_dir/$uid -v 0 &");
}

sub process_cmd {
 my ($cmd) = @_;
 print "CMD: $cmd\n";
 my $ret = system($cmd);
 return $ret;
}

