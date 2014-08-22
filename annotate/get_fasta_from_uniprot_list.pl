#!/usr/bin/env perl

=pod

=head1 USAGE

 Annotation database:
  * -annot_dbname :s   => Name of database
  * -annot_host   :s   => IP address of host (localhost)
  * -annot_port   :i   => Pg Port number (5432)
    -annot_user   :s   => DB username
    -annot_pass   :s   => DB password
 
  * -list_file    :s   => ID file from Uniprot.org, one accession per line
    -kegg              => List file is from KEGG 'htext' (http://www.kegg.jp/kegg-bin/download_htext?htext=ola03310&format=htext)
  * -dataset_id   :i   => JAMp internal dataset identifier

    -csv               => Print out one JAMp identifier per line
    -fasta             => Print out FASTA of ORF (frame +1)
    
    -evalue_cutoff :f  => Evalue cutoff (def 1e-10)

 Defaults to -fasta
 * are mandatory options

=cut

use strict;
use warnings;
use Getopt::Long;
use Pod::Usage;
use DBI;

my ( $annot_dbname, $annot_host, $annot_dbport ) =
  ( 'annotations', 'localhost', '5432' );
my ( $annot_username, $annot_password ) = ( $ENV{'USER'}, undef );
my ( $dataset_id, $do_csv, $do_fasta, $list_file, %list_hash, $is_kegg );
my $evalue_cutoff = 1e-10;

&GetOptions(

 #annotation database
 'annot_dbname:s'  => \$annot_dbname,
 'annot_host:s'    => \$annot_host,
 'annot_port:i'    => \$annot_dbport,
 'annot_user:s'    => \$annot_username,
 'annot_pass:s'    => \$annot_password,
 'list_file=s'     => \$list_file,
 'id|dataset_id=i' => \$dataset_id,
 'csv'             => \$do_csv,
 'fasta'           => \$do_fasta,
 'evalue_cutoff:f' => \$evalue_cutoff,
 'kegg'            => \$is_kegg
);

pod2usage unless $list_file && $dataset_id;

open( LIST, $list_file ) || die $!;
while ( my $ln = <LIST> ) {
 next if $ln =~ /^\s*$/;
 chomp($ln);
 if ($is_kegg) {
  my @data = split( "\t", $ln );
  next unless $data[1];

  #K05547
  if ( $data[1] =~ /\b(K\d{5})\b/ ) {
   my $acc = "'$1'";
   $list_hash{$acc} = 1;
  }
 }

 elsif ( $ln =~ /^(\S+)/ ) {
  my $acc = "'$1'";
  $list_hash{$acc} = 1;
 }
}
close LIST;


die "No uniprot accessions in $list_file\n" unless %list_hash;
my $list = join( ',', keys %list_hash );
die "No uniprot accessions in $list_file\n" unless $list;

my $dbh = &connect_db( $annot_dbname,   $annot_host, $annot_dbport,
                       $annot_username, $annot_password );
die "No DB connection\n" unless $dbh;

my $grab_sql_fasta = "SELECT cds,substring(transcript_sequence from start for cds_length) from  ( SELECT c.uname AS cds  , nuc_sequence AS transcript_sequence, cds_start as start, ((cds_stop - cds_start) + 1 ) as cds_length,strand FROM cds c JOIN transcript t ON c.transcript_uname = t.uname WHERE c.uname IN (SELECT distinct ON (cds_uname) cds_uname FROM inference_cds it WHERE known_protein_id IN ";
my $grab_sql_list = "SELECT distinct ON (cds_uname) cds_uname FROM inference_cds it WHERE known_protein_id IN ";
my ($suffix_sql);
if ($is_kegg) {
  $suffix_sql = "(SELECT uniprot_id FROM known_proteins.ko_assoc WHERE ko_id IN ($list)) AND significance < $evalue_cutoff)) as s";
}
else {
 $suffix_sql .= "($list) AND significance < $evalue_cutoff)) as s";
}

$grab_sql_fasta .= $suffix_sql; 
$grab_sql_list .=  $suffix_sql;

my $grab_sql_fasta_prepared = $dbh->prepare($grab_sql_fasta);
my $grab_sql_list_prepared  = $dbh->prepare($grab_sql_list);

open( OUT, ">$list_file.results" );

print "Processing dataset $dataset_id\n";
my $schema_name = 'dataset_' . $dataset_id;
$dbh->do("set search_path to $schema_name");
my $counter = int(0);
if ($do_csv) {
 $grab_sql_list_prepared->execute();
 die "Error " . $grab_sql_list_prepared->errstr if $grab_sql_list_prepared->err;
 while ( my $res = $grab_sql_list_prepared->fetchrow_arrayref ) {
  $counter++;
  print OUT $res->[0] . "\n" if $res->[0];
 }
}
else {
 $grab_sql_fasta_prepared->execute();
 die "Error " . $grab_sql_fasta_prepared->errstr
   if $grab_sql_fasta_prepared->err;
 while ( my $res = $grab_sql_fasta_prepared->fetchrow_arrayref ) {
  $counter++;
  print OUT ">" . $res->[0] . "\n" . &wrap_text( $res->[1] ) if $res->[0];
 }
}

close OUT;
$dbh->disconnect;

print "Done. Found $counter items\n";

#################################################
sub wrap_text() {
 my $string      = shift;
 my $wrap_length = shift;
 $wrap_length = 120 if !$wrap_length;
 $string =~ s/(.{0,$wrap_length})/$1\n/g;
 $string =~ s/\n{2,}/\n/;
 return $string;
}

sub connect_db() {
 my ( $dbname, $dbhost, $dbport, $username, $password ) = @_;
 my $dbh;
 $username = $ENV{'USER'} unless $username;
 $dbh = DBI->connect( "dbi:Pg:dbname=$dbname;host=$dbhost;port=$dbport",
                      $username, $password, { AutoCommit => 1 } )
   if $password;
 $dbh = DBI->connect( "dbi:Pg:dbname=$dbname;host=$dbhost;port=$dbport",
                      '', '', { AutoCommit => 1, RaiseError => 1 } )
   if !$password;
 die unless $dbh;
 return $dbh;
}

