#!/usr/bin/env perl
#VERSION 0.3 November 2013

=pod

=head1 Developer Notes

Added authorization

=head2 TODO

ALlow for cd-hit clustering so that protein annotations are not inflated. Or perhaps we should impose cd-hit clustering?
Accepting a cd-hit input can do two things:
 - store the clustering information
 - skip reading the hhblits entries for those skipped/clustered data
 - delete any inference links if the clustered data (if it exists, .e.g. hhsearch was run prior clustering)
 - something else?
alternatively, 
 - store all annotations transiently based on clustering
  - what to do with co-ordinates? don't store them?
 - Store all main (reference) members of the cluster in a cluster_id group and get gui faceting to work with it.
 
 
 edit transdecoder svn gto spit out CDS in fasta


-all versus all: needleall too expensive (and diagonal) 
- or hhblits against self?

=head2 old stuff

use idmapping to convert blast ids to uniprot id
use gp_association.goa_uniprot and uniprot ids to get go terms 

kegg tables built using kobas2.0-20120208:
$ sqlite3 kobas2.dat

SELECT pathway_id,pathway_name FROM pathways ;
SELECT id,name,definition from kos;
SELECT pathway_id,up FROM pathways p JOIN genes_pathways gp ON p.puid=gp.puid JOIN genes_uniprots gu ON gu.gene_id=gp.gene_id;
SELECT ko_id,up FROM kos k JOIN kos_genes kg ON k.id=kg.ko_id JOIN genes_uniprots gu ON gu.gene_id=kg.gene_id;
SELECT pathway_id,ko_id from pathways p JOIN kos_pathways kp ON kp.puid=p.puid

=pod

=head1 VERSION

0.2

Changelog
 0.1 March13 - first version - populates an annotation database with known proteins (48Gb)
 0.2 July13 - associates new proteins with annotation database 
 0.3 Sep-Nov - added authorization
             - added linkouts
             - bug fix on CDS vs mRNA co-ordinates
             - support genome-based gene prediction

=head1 NAME 

 annotate_me.pl
 
=head1 USAGE

Options with :s expect a string and :i expect an integer. The character | means either or (e.g. -i|fasta means you can use -i or -fasta)

NB: Options with * are mandatory.

Annotation database connection

   * -annot_dbname :s   => Name of postgres database
     -annot_host   :s   => Hostname, optional
     -annot_port   :i   => Port for database connection, optional
     -annot_user   :s   => Username for database connection, optional
     -annot_pass   :s   => Password for database connection, optional

General options

     -blast_format :s   => Format of BLAST report (BioPerl: 'blast', 'blastxml' etc)
     -help              => This menu.

Creating a new annotation database

     -create            => Create the annotation database using known protein annotations. Takes a long time, so better download it.
     -uniprot           => Load uniprot terms
     -go                => Load Gene Ontology terms
     -inference         => Associate inferrences by electronic similarity with the relevant GO terms 
     -ec                => Load Enzyme Classification
     -eggnog            => Load EggNog (gene clusters for eukaryotes)
     -databases :s      => TSV file with cross-reference database descriptions
             
             
Populating an annotation db with inferred gene annotations. We support Trinity and Transdecoder.

     -contigs      :s    => Contigs in FASTA, e.g. Trinity.fasta
     -protein      :s    => Protein FASTA file used in searches. From transdecoder.
     -translation  :i    => Translation table number. Defaults to 1 (universal)
     -gff_orf      :s    => GFF3 file specifying ORFs from transdecoder.
     OR
     -gff_genome   :s    => GFF3 file linking contigs to Genome (e.g. official gene predictions, alignments via GMAP, exonerate or prepare_golden_genes_for_predictors.pl)
     -genome_fasta :s    => The FASTA file for the Genome
     OR
     -delete       :s      => Delete dataset (provide anm ID or name)
     
     The program then searches for the file name and if 
     * it finds [filename]*blast*, it considers it a BLAST
     * it finds [filename]*hhr, it considers it a HHblits output
     * it finds [filename]*ipr*, it considers it an InterProScan output
     
Analyses available:

     -doblast     => Process BLAST files
     -dohhr       => Process HHblits files 
     -doipr       => Process InterProScan files
     -donetwork   => Process .network files

Metadata can be added/controlled:

     -authorization|dataset_authority :s => An owner name to control authorization for web interface. 
     -linkout_conf                    :s => A text file that specifies how these data can be linked-out to a website (see DESCRIPTION)

The following metadata can be provided or are interactively asked during import:
   
     -dataset_uname                   :s => Name for dataset (must be unique)
     -dataset_description             :s => A description for the dataset
     -dataset_species                 :s => Species name (latin binomial)
     -dataset_library                 :s => A name for the 'library' these data belong to, e.g. cDNA library
     -dataset_type                    :s => What type is the dataset, e.g. RNASeq or 'genome annotation' 
 
=head1 DESCRIPTION

This program does two things. The first step is creating a database linking known proteins with annotations. These are derived
from a variety of sources and the purpose of having this local database is (step two) that you can rapidly annotate your own genes
in a high-throughput manner.

Because this database is quite large and it can be downloaded if you don't need the latest version of known proteins. Just restore it
use in pg_restore (I support postgres 9.x):

 $ createdb annotations # or create an empty database the way you normally do.
 $ pg_restore -Fc -d annotations -c -j $NCPUS annotations.psql # where NCPUS is the number of concurrent threads you want to use (2 is enough).

After the database is created, the program will accept the postgres connection credentials, a FASTA file and one or more of
 
 * the results of a HHblits search (e.g. against UniProt or NR or other known protein dataset).
 * the results of a BLAST search (e.g. against NR or UniProt or other known protein dataset).
 * the results of a HHblits search against PFAM.
 * the results of an InterProScan (V6+) search.

It will then add annotations for your genes in the database, linking them to the functions derived from these 'informatic experiment' searches (or computed in the case of some
InterProScan searches).

In my opinion, the HHblits searches are superior to BLAST, especially if they are searched against UniProt. In fact, due to limited
time, I can only support use cases as those in my lab (currently HHblits and InterProScan). If anyone wants to lend a hand in 
storing other types of informatic experiments then that would be great!

Remember that some ORF prediction programs use * to denote stop codon. You must remove this because it is actually not a real amino acid (just a landmark)
and therefore not a valid character for the protein FASTA format that we (or InterProScan) use.

You can try this shell way

 $ tr -d '\*$' < $FILE > $FILE.fsa
 $ mv $FILE.fsa $FILE

Regardless, once you have annotated your proteins, you can view the results using our Annotation Viewer.

=head2 HHblits

Running hhblits is beyond the scope of this software but here is what I do for high-throughput annotation (e.g. large transcriptome projects):

 NCPUS=10
 FILE=best_candidates.eclipsed_orfs_removed.pep.sample
 DB=~/databases/hhsearch/uniprot20_2012_10_klust20_dc_2012_12_10 # searches with uniprot and/or PFAM are recommended
 $ ffindex_from_fasta -s $FILE.ffindex.dat $FILE.ffindex.dat.idx $FILE

# serial way of running hhblits
 
 $ ffindex_apply $FILE.ffindex.dat $FILE.dat.idx  hhblits -i stdin -d $DB -n 2 -o stdout -cpu $NCPUS -v 1 > $FILE.hhr

# (open)mpi way of running hhblits
 
 $ mpirun.openmpi -n $NCPUS ffindex_apply_mpi -d $FILE.hhblits.db -i $FILE.hhblits.idx $FILE.ffindex.dat $FILE.ffindex.dat.idx -- \
  hhblits -i stdin -d $DB -n  2 -o stdout -cpu 2 -v 1
 $ tr -d '^\000' < $FILE.hhblits.db* > $FILE.hhr

# MPICH way of running hhblits

 NCPUS=5 # concurrent processes access the database concurrently, leading to an I/O bottleneck
 $ mpd & # unless already running
 $ mpiexec -n $NCPUS ffindex_apply_mpi -d $FILE.hhblits.db -i $FILE.hhblits.idx $FILE.ffindex.dat $FILE.ffindex.dat.idx -- \
  hhblits -i stdin -d $DB -n 2 -o stdout -cpu 2 -v 1
 $ tr -d '^\000' < $FILE.hhblits.db* > $FILE.hhr

For multiple projects, I actually run HHBLITS on a PBSpro supercomputing cluster so it is slightly different. If you are an IT-specialist I recommend it, let me know if you need help.

Further, HHblits has issues with very large proteins. The default max number of amino acids is 15000. You can increase it via the -maxres option (see hhblits -h) but it costs memory.

=head2 InterProScan

You need to visit the Google Code page and work from there.

 https://code.google.com/p/interproscan
 
Edit interproscan.properties to make sure you have the right binaries for any software you want to use 
(e.g. SignalP, phobius, prosite, TMHMM including the model files to $INTERPROSCAN_HOME/data/tmhmm/model/2.0)

Remember to test it with:

 $INTERPROSCAN_HOME/interproscan.sh -i test_proteins.fasta -f tsv --iprlookup --goterms --pathways 

You then use it like so:

 FILE=best_candidates.eclipsed_orfs_removed.pep.sample.fsa
 $ $INTERPROSCAN_HOME/interproscan.sh -f TSV,XML,GFF3 --iprlookup --goterms --pathways -i $FILE -b $FILE.ipr   

You can also use the cluster modes etc but InterProScan usage this is beyond the scope of this software. 

=head2 Evidence Codes for Inferences

The following defines the type of evidence for GO-entries which will be used for the uniprot subset. 
The evidence can be thought of in a loose hierarchy of reliability (according to the GOA curators):

TAS / IDA >  IMP / IGI / IPI > ISS / IEP > NAS > RCA > IEA >> NR

 # IC: Inferred by Curator
 # TAS: Traceable Author Statement
 # IDA: Inferred from Direct Assay
 # IMP: Inferred from Mutant Phenotype
 # IGI: Inferred from Genetic Interaction
 # IPI: Inferred from Physical Interaction
 # ISS: Inferred from Sequence or Structural Similarity
 # IEP: Inferred from Expression Pattern
 # NAS: Non-traceable Author Statement
 # IEA: Inferred from Electronic Annotation
 # ND: No biological Data available
 # RCA: inferred from Reviewed Computational Analysis
 # NR: Not Recorded


=head2 DATABASE CROSS-REFERENCES

These are controlled by a tab delimited configuration file given with the -linkout_conf option. The format is simple, the idea is that there is a 
URL that provides the metadata for a particular accession by simply appending the accession in this "URL-PREFIX":

 TYPE    UNIQUE NAME     URL-PREFIX      DESCRIPTION OF DATABASE

Type is either 'gene', 'CDS' or 'hit'. It is used by the browser to specify whether this linkout should be for genes, transcripts or the known_protein hits.
The unique name needs to be unique within the dataset being loaded, but needs not be unique between datasets. 
The last column can be either gene or transcript and is optional.  If not provided, gene is assumed.


For example use this for hits of say Q5NGP7 (accessible via www.uniprot.org/uniprot/Q5NGP7). NB the forward slash at the end of the URL:

 hit UniProt    http://www.uniprot.org/uniprot/      The mission of UniProt is to provide the scientific community with a comprehensive, high-quality and freely accessible resource of protein sequence and functional information. 

For JBrowse:

 gene JBrowse_mygenome   http://mygenome.org/jbrowse/?loc=   This is a description of the JBrowse of my genome.

Make sure that any URL options are before the key required for the query (loc in this case).
For example, JBrowse is highly configurable and I highly recommend tracks=DNA at least (Annotations is from WebApollo), for example:

 gene JBrowse_mygenome   http://mygenome.org/jbrowse/?tracks=DNA%2CAnnotations&loc=   This is a description of the JBrowse of my genome.


=head1 AUTHORS

 Alexie Papanicolaou

        CSIRO Ecosystem Sciences
        alexie@butterflybase.org

=head1 DISCLAIMER & LICENSE

This software is released under the GNU General Public License version 3 (GPLv3).
It is provided "as is" without warranty of any kind.
You can find the terms and conditions at http://www.opensource.org/licenses/gpl-3.0.html.
Please note that incorporating the whole software or parts of its code in proprietary software
is prohibited under the current license.

=head1 BUGS & LIMITATIONS

No bugs known so far. 


=head1 Developer Notes

=cut

use strict;
use warnings;
use Getopt::Long;
use Pod::Usage;
use Cwd;
use File::Basename;
use File::Copy;
use File::Spec;
use DBI qw(:sql_types);
use XML::LibXML::Reader;
use Digest::MD5 qw(md5_hex);
use JSON;

use FindBin;
$ENV{'PATH'} .= ":" . $FindBin::RealBin;
use lib ("$FindBin::RealBin/../PerlLib");
use Gene_obj;
use Fasta_reader;
use GFF3_utils;
use Carp;
use Nuc_translator;

# bioperl
use Bio::SeqIO;
use Bio::Tools::pICalculator;
use Bio::Tools::SeqStats;

#use Time::Progress;
#use IO::Compress::Bzip2 qw(bzip2 $Bzip2Error);
#use DBD::Pg qw(:pg_types);
#debug
use Data::Dumper;
my $cwd = getcwd;
$|=1;

=pod


=cut

our $sql_hash_ref;
my (
     $dataset_type,        $dataset_library, $dataset_species,
     $dataset_description, $dataset_uname,   $linkout_conf
);
my (
     $contig_fasta_file,  $orf_gff_file, $genome_gff_file,
     $protein_fasta_file, $genome_fasta_file
);

my $authorization_name = 'demo';
my ( $annot_dbname, $annot_host,   $annot_dbport );
my ( $chado_dbname, $chado_dbhost, $chado_dbport );
my ( $annot_username, $annot_password ) = ( $ENV{'USER'}, undef );
my ( $chado_username, $chado_password ) = ( $ENV{'USER'}, undef );
my ( $create_annot_database, $do_protein_hhr, $do_protein_blasts, $do_kegg );
my (
     $do_uniprot,     $do_go,               $do_ec,
     $do_eggnog,      $drop_annot_database, $do_protein_ipr,
     $debug,          $database_tsv_file,   $do_chado,
     $do_inferences,  $dohelp,              $do_slow,
     $delete_dataset, $do_protein_networks
);
my $blast_format             = 'blastxml';
my $translation_table_number = 1;
my %accepted_linkout_types   = ( 'gene' => 1, 'hit' => 1, 'CDS' => 1 );

# start of default configurations (to go to separate .config file)
# defaults for search cutoffs:
my (
     $hhr_homology_prob_cut, $hhr_eval_cut,     $hhr_pval_cut,
     $hhr_score_cut,         $hhr_min_filesize, $hhr_max_hits
) = ( 80, 1e-10, 1e-12, 70, 700, 10 );

# evidence codes that will NOT be used when assigning metadata to a KNOWN protein (i.e. from UniProt)
my %NOTALLOWED_EVID = (
                        'IEA' => 1,
                        'ISS' => 1,
                        'IEP' => 1,
                        'NAS' => 1,
                        'ND'  => 1,
                        'NR'  => 1,
);

# database defaults (remove for production)
( $annot_host, $annot_dbport, $annot_password ) = qw/localhost 5433 cccccc/;
( $chado_dbhost, $chado_dbport ) = qw/localhost 5433/;

#$dataset_uname = 'test2';

## end of default configurations

&GetOptions(
 'help'  => \$dohelp,
 'debug' => \$debug,

 #annotation database
 'annot_dbname:s' => \$annot_dbname,
 'annot_host:s'   => \$annot_host,
 'annot_port:i'   => \$annot_dbport,
 'annot_user:s'   => \$annot_username,
 'annot_pass:s'   => \$annot_password,

 #chado database
 'chado_dbname:s' => \$chado_dbname,
 'chado_host:s'   => \$chado_dbhost,
 'chado_port:i'   => \$chado_dbport,
 'chado_user:s'   => \$chado_username,
 'chado_pass:s'   => \$chado_password,

 #annotdb creation
 'inference' => \$do_inferences,
 'uniprot'   => \$do_uniprot,
 'go'        => \$do_go,
 'ec'        => \$do_ec,
 'eggnog'    => \$do_eggnog,
 'kegg'      => \$do_kegg,
 'create'    => \$create_annot_database,
 'drop'      => \$drop_annot_database,

 #	new protein annotation
 'contigs:s'      => \$contig_fasta_file,
 'gff_orf:s'      => \$orf_gff_file,
 'gff_genome:s'   => \$genome_gff_file,
 'genome_fasta:s' => \$genome_fasta_file,
 'protein:s'      => \$protein_fasta_file,
 'translation:i'  => \$translation_table_number,
 'delete:s'       => \$delete_dataset,

 'doblast'        => \$do_protein_blasts,
 'dohhr'          => \$do_protein_hhr,
 'doipr'          => \$do_protein_ipr,
 'donetwork'      => \$do_protein_networks,
 'blast_format:s' => \$blast_format,
 'databases:s'    => \$database_tsv_file,
 'chado'          => \$do_chado,

 # HHR
 'hhr_homol_prob:i' => \$hhr_homology_prob_cut,
 'hhr_eval:s'       => \$hhr_eval_cut,
 'hhr_pval:s'       => \$hhr_pval_cut,
 'hhr_score:i'      => \$hhr_score_cut,
 'hhr_filesize:i'   => \$hhr_min_filesize,
 'hhr_maxhits:i'    => \$hhr_max_hits,

 # dataset metadata
 'authorization|dataset_authority:s' => \$authorization_name,
 'dataset_uname:s'                   => \$dataset_uname,
 'dataset_description:s'             => \$dataset_description,
 'dataset_species:s'                 => \$dataset_species,
 'dataset_library:s'                 => \$dataset_library,
 'dataset_type:s'                    => \$dataset_type,
 'linkout_conf:s'                    => \$linkout_conf
);
pod2usage "No annotation database name\n" unless $annot_dbname;
pod2usage "A required file is missing\n"
  unless $dohelp
   || $do_uniprot
   || $do_go
   || $do_ec
   || $do_eggnog
   || $do_kegg
   || (    $protein_fasta_file
        && $contig_fasta_file
        && $orf_gff_file )
   || (    $genome_gff_file
        && $genome_fasta_file )
   || $delete_dataset
   || $linkout_conf
   || $do_protein_blasts
   || $do_protein_hhr
   || $do_protein_ipr
   || $do_protein_networks

;

&check_required_files(
                       $protein_fasta_file, $contig_fasta_file,
                       $orf_gff_file,       $genome_gff_file,
                       $genome_fasta_file,  $linkout_conf
);

if ($delete_dataset) {
 my $dbh = &get_dataset_connection();
 &delete_dataset( $dbh, $delete_dataset );
 exit;
}

die
"Cannot provide both a genome-guided annotation and Transdecoder at the same time\n"
  if $genome_gff_file && $protein_fasta_file;

$blast_format = lc($blast_format);

die "BLAST format can only be 'blast' or 'blastxml'\n"
  unless $blast_format eq 'blast' || $blast_format eq 'blastxml';

# optionally we can create a database.
&create_populate_annotation_database()
  if (    $create_annot_database
       || $do_uniprot
       || $do_ec
       || $do_eggnog
       || $do_go
       || $do_kegg );

# if we have a genome, then we can prepare the genome and protein files (unless they already exist)
&process_for_genome_gff()
  if (    $genome_gff_file
       && $genome_fasta_file
       && -s $genome_gff_file
       && -s $genome_fasta_file );

# if we have files, we can store annotations by inference
if (    ( $protein_fasta_file && -s $protein_fasta_file )
     || $do_protein_blasts
     || $do_protein_hhr
     || $do_protein_ipr
     || $do_protein_networks )
{
 &store_annotation_of_proteins();
}
elsif ($linkout_conf) {
 my $dbh_store = &get_dataset_connection();
 if ($dataset_uname) {
  my $dataset_id = &check_dataset( $dbh_store, $dataset_uname );
  &add_linkout( $dbh_store, $linkout_conf, $dataset_id );
 }
 else {
  &add_linkout( $dbh_store, $linkout_conf );
 }

}

print "\nDone!\n";
###########################################################################
sub connect_db() {
 my ( $dbname, $dbhost, $dbport, $username, $password ) = @_;
 my $dbh;
 $username = $ENV{'USER'} unless $username;
 if ($drop_annot_database) {
  &process_cmd("dropdb -p $dbport -h $dbhost $dbname");
  &process_cmd("createdb -p $dbport -h $dbhost $dbname");
  $create_annot_database = 1;
 }
 $dbh = DBI->connect( "dbi:Pg:dbname=$dbname;host=$dbhost;port=$dbport",
                      $username, $password, { AutoCommit => 1 } )
   if $password;
 $dbh = DBI->connect( "dbi:Pg:dbname=$dbname;host=$dbhost;port=$dbport",
                      '', '', { AutoCommit => 1 } )
   if !$password;
 unless ($dbh) {
  print "Creating database...\n";
  &process_cmd("createdb -p $dbport -h $dbhost $dbname");
  $dbh = DBI->connect( "dbi:Pg:dbname=$dbname;host=$dbhost;port=$dbport",
                       $username, $password, { AutoCommit => 1 } )
    if $password;
  $dbh = DBI->connect( "dbi:Pg:dbname=$dbname;host=$dbhost;port=$dbport",
                       '', '', { AutoCommit => 1 } )
    if !$password;
 }
 return $dbh;
}

sub disconnect_db() {
 my $dbh = shift;
 &finish_sqls();
 $dbh->disconnect();
}
#############################################################
###################### prepare annotation database ##########
#############################################################

sub check_dataset() {
 my $dbh  = shift;
 my $name = shift;
 my $check_dataset =
     $name =~ /^\d+$/
   ? $dbh->prepare("SELECT dataset_id from public.datasets where dataset_id=?")
   : $dbh->prepare("SELECT dataset_id from public.datasets where uname=?");
 $check_dataset->execute($name);
 my $result = $check_dataset->fetchrow_arrayref();
 return $result->[0] if ( $result && $result->[0] );
}

sub check_create_native_dataset() {
 my $dbh = shift || die;
 my $dataset_id;
 if ($dataset_uname) {
  die "Dataset name must not be just numbers\n" if $dataset_uname =~ /^\d+$/;
  $dataset_id = &check_dataset( $dbh, $dataset_uname );
  return $dataset_id if $dataset_id;
 }

 while ( !$dataset_uname ) {
  print "\nPlease provide a unique name for your dataset\n";
  $dataset_uname = <STDIN>;
  chomp($dataset_uname);
  if ( $dataset_uname =~ /^\s*$/ ) {
   warn "Unique name cannot be empty\n";
   undef($dataset_uname);
  }
  elsif ( $dataset_uname =~ /^\d+$/ ) {
   warn "Dataset name must not be just numbers\n";
   undef($dataset_uname);
  }

 }
 my $create_dataset = $dbh->prepare(
"INSERT INTO datasets (uname,description,species_name,library_uname,type,owner ) VALUES (?,?,?,?,?,'$authorization_name')"
 );

 unless ($dataset_description) {
  print "\nPlease provide a description for your dataset\n";
  $dataset_description = <STDIN>;
  chomp($dataset_description);
  $dataset_description = undef if $dataset_description =~ /^\s*$/;
 }

 while ( !$dataset_species ) {
  print "\nPlease provide a species name for your dataset\n";
  $dataset_species = <STDIN>;
  chomp($dataset_species);
  if ( $dataset_species =~ /^\s*$/ ) {
   warn "Species cannot be empty\n";
   undef($dataset_species);
  }
 }

 while ( !$dataset_library ) {
  print "\nPlease provide a library name for your dataset\n";
  $dataset_library = <STDIN>;
  chomp($dataset_library);
  if ( $dataset_library =~ /^\s*$/ ) {
   warn "Library name cannot be empty\n";
   undef($dataset_library);
  }
 }

 while ( !$dataset_type ) {
  print "\nPlease provide a type for your dataset (e.g. RNAseq)\n";
  $dataset_type = <STDIN>;
  chomp($dataset_type);
  if ( $dataset_type =~ /^\s*$/ ) {
   warn "Dataset type name cannot be empty\n";
   undef($dataset_type);
  }

 }

 $dataset_id = &check_dataset( $dbh, $dataset_uname );
 return $dataset_id if $dataset_id;
 my $res = $create_dataset->execute(
                                     $dataset_uname,   $dataset_description,
                                     $dataset_species, $dataset_library,
                                     $dataset_type
 );
 $dataset_id = &check_dataset( $dbh, $dataset_uname );
 if ($dataset_id) {
  my $schema_name = 'dataset_' . $dataset_id;
  return $dataset_id;
 }
 else {
  die "Cannot create a new dataset identifier.\n";
 }

}

sub create_new_annotation_db() {
 my $dbh = shift;
 print "(Re)Creating db\n";
 my $check_sql =
   $dbh->prepare("SELECT * FROM pg_catalog.pg_tables WHERE tablename=?");
 $check_sql->execute('inference');
 my $check = $check_sql->fetchrow_arrayref;
 if ( $check && $check->[0] ) {
  warn
"Annotation database schema seems to exist already. Will not recreate it.\n";
  return;
 }

 $dbh->{"PrintError"} = 0;
 $dbh->do('DROP TABLE datasets');
 $dbh->do('DROP SCHEMA known_proteins CASCADE');
 $dbh->do('CREATE SCHEMA known_proteins');
 $dbh->{"RaiseError"} = 1;

 $dbh->begin_work;
 warn "Creating new tables\n";
 ################################ public ################################
 $dbh->do(
"CREATE TABLE datasets (dataset_id serial primary key, uname varchar UNIQUE, description text, species_name varchar, library_uname varchar UNIQUE, type varchar, date_created date default now() not null,owner varchar default 'demo')"
 );
 $dbh->do(
'CREATE UNIQUE INDEX datasets_species_description_key on datasets (species_name,description)'
 );

 $dbh->do(
'CREATE TABLE linkout (linkout_id serial primary key, name varchar, description text, dataset_id int references datasets(dataset_id), type varchar, urlprefix varchar )'
 );
 $dbh->do(
   'CREATE UNIQUE INDEX linkout_dataset_id_name_idx ON linkout(dataset_id,name)'
 );

 $dbh->do( '
 CREATE TABLE metadata (
  metadata_id serial primary key,
  uname varchar UNIQUE,
  description text 
 );
 ' );
 
 $dbh->do('
 CREATE TABLE metadata_jslib (
  metadata_id integer primary key REFERENCES public.metadata(metadata_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
  json text NOT NULL
 );
');
 

 ################################# known proteins ################################
 $dbh->do("SET SEARCH_PATH='known_proteins");
 $dbh->do(
'CREATE TABLE go (go_id integer primary key,name varchar,class char(1),is_synomym boolean)'
 );
 $dbh->do(
'CREATE TABLE go_assoc (go_assoc_uid serial primary key, uniprot_id varchar, go_id integer REFERENCES go(go_id), '
    . 'reference_db varchar, reference_uid varchar, evidence varchar,annotator varchar, date_annotated date)'
 );
 $dbh->do(
'CREATE TABLE go_slim (go_slim_uid serial primary key, go_id integer REFERENCES go(go_id), slim_go_id integer REFERENCES go(go_id))'
 );

 $dbh->do(
'CREATE TABLE go_synonym (go_id integer REFERENCES go(go_id), go_synonym integer REFERENCES go(go_id))'
 );

 $dbh->do(
       'CREATE TABLE enzyme (ec_id varchar primary key, primary_name varchar)');
 $dbh->do(
'CREATE TABLE enzyme_assoc (ec_assoc_uid serial primary key, ec_id varchar REFERENCES enzyme(ec_id), uniprot_id varchar)'
 );
 $dbh->do(
'CREATE TABLE enzyme_description (ec_description_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id), description text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_names (ec_names_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id), alias text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_catalytic_activity (ec_catalytic_activity_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id), catalytic_activity text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_cofactor (ec_cofactor_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id), cofactor text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_comments (ec_comment_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id), comment text)'
 );
 $dbh->do(
        'CREATE TABLE eggnog (eggnog_id varchar primary key,description text)');
 $dbh->do(
'CREATE TABLE eggnog_categories (category char(1) primary key,grouping text,description text)'
 );
 $dbh->do(
'CREATE TABLE eggnog_category (eggnog_id varchar REFERENCES eggnog(eggnog_id),category char(1) REFERENCES eggnog_categories(category) )'
 );
 $dbh->do(
'CREATE TABLE eggnog_assoc (eggnog_assoc_uid serial primary key,eggnog_id varchar REFERENCES eggnog(eggnog_id),uniprot_id varchar)'
 );
 $dbh->do(
'CREATE TABLE uniprot_assoc (uniprot_id varchar,xref_db varchar,xref_accession varchar)'
 );
 $dbh->do('CREATE TABLE ko (ko_id varchar primary key, description text)');
 $dbh->do(
  'CREATE TABLE kegg_pathway (pathway_id varchar primary key, description text)'
 );
 $dbh->do(
       'CREATE TABLE ko_names (ko_id varchar REFERENCES ko(ko_id), name text)');
 $dbh->do(
'CREATE TABLE ko_kegg_pathway (ko_id varchar references ko(ko_id), pathway_id varchar references kegg_pathway(pathway_id))'
 );
 $dbh->do(
'CREATE TABLE kegg_pathway_assoc (kegg_pathway_assoc_uid serial primary key, pathway_id varchar REFERENCES kegg_pathway(pathway_id),uniprot_id varchar)'
 );
 $dbh->do(
'CREATE TABLE ko_assoc (ko_assoc_uid serial primary key, ko_id varchar REFERENCES ko(ko_id),uniprot_id varchar)'
 );
 $dbh->do("SET SEARCH_PATH TO DEFAULT");
 die if $dbh->{"ErrCount"};
 $dbh->commit;
 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;
}

=pod
 For chado these results will go into tables that have schemas identical to 
 analysis and analysisfeature but the feature will refer to the query not the
 hit. i will name these tables inference, inferencefeature and inferencefeature_dbxref
 
 
CREATE TABLE inference (
    inference_id serial primary key,
    name character varying(255),
    description text,
    filepath text NOT NULL,
    program character varying(255) NOT NULL,
    programversion character varying(255) NOT NULL,
    algorithm character varying(255),
    sourcename character varying(255),
    sourceversion character varying(255),
    sourceuri text,
    timeexecuted timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY inference ADD CONSTRAINT inference_c1 UNIQUE (program, programversion, sourcename);
CREATE UNIQUE INDEX inference_filepath_idx ON inference (filepath);

CREATE TABLE inferenceprop (
    inferenceprop_id serial primary key,
    inference_id integer NOT NULL,
    type_id integer NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    rank integer DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY inferenceprop ADD CONSTRAINT inferenceprop_c1 UNIQUE (inference_id, type_id, rank);
CREATE INDEX inferenceprop_idx1 ON inferenceprop USING btree (inference_id);
CREATE INDEX inferenceprop_idx2 ON inferenceprop USING btree (type_id);
ALTER TABLE ONLY inferenceprop ADD CONSTRAINT inferenceprop_inference_id_fkey FOREIGN KEY (inference_id) REFERENCES inference(inference_id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY inferenceprop ADD CONSTRAINT inferenceprop_type_id_fkey FOREIGN KEY (type_id) REFERENCES cvterm(cvterm_id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE inferencefeature (
    inferencefeature_id serial primary key,
    feature_id integer NOT NULL,
    inference_id integer NOT NULL,
    dbxref_id integer NOT NULL,
    rawscore double precision,
    normscore double precision,
    significance double precision,
    identity double precision,
    fmin integer,
    fmax integer,
    strand integer
);



-- for any particular inference (a blast vs uniprot), a feature can only be linked to a dbxref (e.g. known protein) only once  
ALTER TABLE ONLY inferencefeature  ADD CONSTRAINT inferencefeature_c1 UNIQUE (feature_id, inference_id,dbxref_id);
CREATE INDEX inferencefeature_idx1 ON inferencefeature USING btree (feature_id);
CREATE INDEX inferencefeature_idx2 ON inferencefeature USING btree (inference_id);
CREATE INDEX inference_dbxref_idx3 ON inferencefeature USING btree (dbxref_id);
ALTER TABLE ONLY inferencefeature ADD CONSTRAINT inferencefeature_inference_id_fkey FOREIGN KEY (inference_id) REFERENCES inference(inference_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY inferencefeature ADD CONSTRAINT inferencefeature_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES feature(feature_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY inferencefeature ADD CONSTRAINT inferencefeature_dbxref_id_fkey FOREIGN KEY (dbxref_id) REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



-- optional maybe for secondary dbxrefs? (also maybe a inferencefeature_cvterm ?)
CREATE TABLE inferencefeature_dbxref (
    inferencefeature_dbxref_id serial primary key,
    inferencefeature_id integer NOT NULL,
    dbxref_id integer NOT NULL,
    is_current boolean DEFAULT true NOT NULL
);

CREATE INDEX inferencefeature_dbxref_idx1 ON inferencefeature_dbxref USING btree (inferencefeature_id);
CREATE INDEX inferencefeature_dbxref_idx2 ON inferencefeature_dbxref USING btree (dbxref_id);

TODO
 1.  enforce db.prefixurl 
 2.  enforce prefix hostname in inference.filepath
 3.  add inferenceprop with type name 'database'.

=cut

sub create_chado_inference_tables() {
 my $dbh = shift;
 $dbh->do('SET SEARCH_PATH TO default');

 my $check_sql =
   $dbh->prepare("SELECT * FROM pg_catalog.pg_tables WHERE tablename=?");
 $check_sql->execute('inference');
 my $check = $check_sql->fetchrow_arrayref;
 return 1 if $check && $check->[0];

 print "Editing Chado\n";
 $dbh->{"RaiseError"} = 1;
 $dbh->begin_work;
 $dbh->do( '
 CREATE TABLE inference (
    inference_id serial primary key,
    name character varying(255),
    description text,
    filepath text NOT NULL UNIQUE,
    program character varying(255) NOT NULL,
    programversion character varying(255) NOT NULL,
    algorithm character varying(255),
    sourcename character varying(255),
    sourceversion character varying(255),
    sourceuri text,
    timeexecuted timestamp without time zone DEFAULT now() NOT NULL
);
' );
 $dbh->do( '
ALTER TABLE ONLY inference ADD CONSTRAINT inference_c1 UNIQUE (program, programversion, sourcename);
' );
 $dbh->do( '
CREATE TABLE inferenceprop (
    inferenceprop_id serial primary key,
    inference_id integer NOT NULL REFERENCES inference(inference_id) DEFERRABLE INITIALLY DEFERRED,
    type_id integer NOT NULL REFERENCES cvterm(cvterm_id) DEFERRABLE INITIALLY DEFERRED,
    value text DEFAULT \'\'::text NOT NULL,
    rank integer DEFAULT 0 NOT NULL
);
' );
 $dbh->do( '
ALTER TABLE ONLY inferenceprop ADD CONSTRAINT inferenceprop_c1 UNIQUE (inference_id, type_id, rank);
' );
 $dbh->do( '
CREATE INDEX inferenceprop_idx1 ON inferenceprop USING btree (inference_id);
' );
 $dbh->do( '
CREATE INDEX inferenceprop_idx2 ON inferenceprop USING btree (type_id);
' );
 $dbh->do( '
CREATE TABLE inferencefeature (
    inferencefeature_id serial primary key,
    feature_id integer NOT NULL REFERENCES feature(feature_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    inference_id integer NOT NULL REFERENCES inference(inference_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    dbxref_id integer NOT NULL REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    rawscore double precision,
    normscore double precision,
    significance double precision,
    identity double precision,
    fmin integer,
    fmax integer,
    strand integer
);
' );

#-- for any particular inference (a blast vs uniprot), a feature can only be linked to a dbxref (e.g. known protein) only once
 $dbh->do( '
ALTER TABLE ONLY inferencefeature  ADD CONSTRAINT inferencefeature_c1 UNIQUE (feature_id, inference_id,dbxref_id);
' );
 $dbh->do( '
CREATE INDEX inferencefeature_idx1 ON inferencefeature USING btree (feature_id);
' );
 $dbh->do( '
CREATE INDEX inferencefeature_idx2 ON inferencefeature USING btree (inference_id);
' );
 $dbh->do( '
CREATE INDEX inference_dbxref_idx3 ON inferencefeature USING btree (dbxref_id);
' );

#-- optional maybe for secondary dbxrefs? (also maybe a inferencefeature_cvterm ?)
 $dbh->do( '
CREATE TABLE inferencefeature_dbxref (
    inferencefeature_dbxref_id serial primary key,
    inferencefeature_id integer NOT NULL,
    dbxref_id integer NOT NULL,
    is_current boolean DEFAULT true NOT NULL
);
' );
 $dbh->do( '
CREATE INDEX inferencefeature_dbxref_idx1 ON inferencefeature_dbxref USING btree (inferencefeature_id);
' );
 $dbh->do( '
CREATE INDEX inferencefeature_dbxref_idx2 ON inferencefeature_dbxref USING btree (dbxref_id);
' );
 die if $dbh->{"ErrCount"};
 $dbh->commit;
 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;
}

=pod

The native schema is based on chado but not...
The annotation database lives within the known_proteins schema
then each dataset (a.k.a. experiment, aka report) lives within its own schema.
The cool thing is that postgres 9+ offers schema specific authorization.

These schema are named after the word dataset_<serial of dataset_id>
The public schema has tables that offer metadata on the different datasets.
also has
=db (db_id,uname,urlprefix) # this is also used for webservices
=dbxref (dbxref_id,(db_id,accession))

Each dataset schema has the following tables
=gene (id, uname, alias, nuc_sequence, orf_sequence, protein_seq,dbxref)
=component (component_id,name,dbxref_id) # eg orf, domain
=gene_component (gene_id,component_id,dbxref_id,min,max) # this is not interbase. starts from 1


inference # there was an analysis...
inference_gene # that got this gene with these data, including a dbxref to this known proteins

gene_dbxref (db,accession) # manual curations (for future)

=cut

sub create_native_inference_tables() {
 my $dbh = shift;
 ## this is created on the base annot_sql CREATE TABLE datasets (dataset_id serial, uname varchar UNIQUE, description text, species_name varchar, library_uname varchar, type varchar, date_created date default now() not null)
 my $dataset_id = &check_create_native_dataset($dbh);

 die "Cannot get dataset name"            unless $dataset_uname;
 die "Cannot get a dataset identifier..." unless $dataset_id;
 my $schema_name = 'dataset_' . $dataset_id;

 my $check_sql = $dbh->prepare(
"SELECT * FROM pg_catalog.pg_tables WHERE tablename=? AND schemaname='$schema_name'"
 );
 $check_sql->execute('inference');
 my $check = $check_sql->fetchrow_arrayref;
 if ( $check && $check->[0] ) {
  warn "Schema already exists for dataset '$dataset_uname'\n";
  sleep 5;
  return $dataset_id;
 }
 $dbh->do("CREATE SCHEMA $schema_name")
   ;    # temporary until we shift to &add_dataset
 $dbh->do("SET SEARCH_PATH TO $schema_name");
 print "Creating schema for new dataset $dataset_uname ($schema_name)\n";
 $dbh->{"PrintError"} = 0;
 $dbh->{"RaiseError"} = 1;
 $dbh->begin_work;

 $dbh->do( '
		CREATE TABLE db (
		db_id serial primary key,
		uname varchar unique,
		urlprefix varchar
		);
	' );

 $dbh->do( '
		CREATE TABLE dbxref (
		dbxref_id serial primary key,
		db_id integer REFERENCES db(db_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
		accession varchar
		);
	' );
 $dbh->do(
   'ALTER TABLE ONLY dbxref ADD CONSTRAINT dbxref_c1 UNIQUE (db_id,accession)');

 $dbh->do( '
  CREATE TABLE gene (
    uname varchar UNIQUE primary key, 
    alias varchar,
    nuc_sequence varchar,
    nuc_checksum varchar
  );
  ' );

 $dbh->do( '
   CREATE TABLE gene_dbxref (
    gene_uname varchar REFERENCES gene(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    dbxref_id integer REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
   )
   ' );
 $dbh->do(
    'CREATE UNIQUE INDEX gene_dbxref_idx ON gene_dbxref(gene_uname,dbxref_id)');

 # for everything except transcripts
 $dbh->do( '
  CREATE TABLE gene_component (
    gene_component_id serial primary key,
    gene_uname varchar REFERENCES gene(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    component_name varchar, 
    dbxref_id integer REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    min integer default 1  not null,
    max integer default 1  not null,
    strand char
  );
  ' );

 $dbh->do( '
ALTER TABLE ONLY gene_component ADD CONSTRAINT gene_component_c1 UNIQUE (gene_uname, component_name, min, max, strand);
' );

 # optionally #5'/3' of gene
 $dbh->do( '
  CREATE TABLE gene_genomeloc (
    gene_genome_id serial primary key,
    gene_uname varchar REFERENCES gene(uname) NOT NULL ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    genome_name_version varchar  NOT NULL, 
    parent_feature_uname varchar  NOT NULL,
    start integer default 1  NOT NULL, 
    stop integer default 1  NOT NULL, 
    strand char  NOT NULL
  );
  ' );

 # each gene is in one location on a genome version
 $dbh->do( '
ALTER TABLE ONLY gene_genomeloc ADD CONSTRAINT gene_genomeloc_c1 UNIQUE (gene_uname, genome_name_version, parent_feature_uname, strand);
' );

 $dbh->do( '
  CREATE TABLE transcript (
    uname varchar UNIQUE primary key,
    gene_uname varchar REFERENCES gene(uname) NOT NULL ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, 
    alias varchar,
    dbxref_id integer REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    translation_table integer,
    cds_start integer default 1 NOT NULL,
    cds_stop integer default 1 NOT NULL,  
    strand char
  );
  ' );

 $dbh->do( '
   CREATE TABLE transcript_dbxref (
    transcript_uname varchar REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    dbxref_id integer REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
   )
   ' );

 $dbh->do(
'CREATE UNIQUE INDEX transcript_dbxref_idx ON transcript_dbxref(transcript_uname,dbxref_id)'
 );

 $dbh->do( '
  CREATE TABLE transcript_properties (
    transcript_uname varchar REFERENCES transcript(uname) primary key  ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    udef_residues integer, 
    min_molweight float,
    max_molweight float,
    pos_aa integer,
    negative_aa integer,
    iso_pot float,
    charge_ph5 float,
    charge_ph7 float,
    charge_ph9 float,
    pep_checksum varchar
  );
  ' );

 $dbh->do( '
  CREATE TABLE transcript_component (
    transcript_component_id serial primary key,
    transcript_uname varchar REFERENCES transcript(uname)  ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    component_name varchar, 
    dbxref_id integer REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    min integer default 1  not null,
    max integer default 1  not null,
    strand char
  );
  ' );

 $dbh->do( '
ALTER TABLE ONLY transcript_component ADD CONSTRAINT transcript_component_c1 UNIQUE (transcript_uname, component_name, min, max, strand );
' );

 $dbh->do( '
 CREATE TABLE inference (
    inference_id serial primary key,
    name character varying(255),
    description text,
    filepath text NOT NULL UNIQUE,
    program character varying(255) NOT NULL,
    programversion character varying(255) NOT NULL,
    algorithm character varying(255),
    sourcename character varying(255),
    sourceversion character varying(255),
    sourceuri text,
    timeexecuted timestamp without time zone DEFAULT now() NOT NULL
);
' );

# for time being, I didn't put ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED on known_protein_id till figure out how known_protein schema is being updated
 $dbh->do( '
CREATE TABLE inference_transcript (
    inference_transcript_id serial primary key,
    transcript_uname varchar NOT NULL REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    inference_id integer NOT NULL REFERENCES inference(inference_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    inference_hit_rank integer DEFAULT 1 NOT NULL, 
    known_protein_id varchar NOT NULL,
    rawscore double precision,
    normscore double precision,
    significance double precision,
    identity double precision,
    similarity double precision,
    query_start integer,
    query_end integer,
    hit_start integer,
    hit_end integer,
    query_strand char,
    hit_strand char
);
' );
 $dbh->do(
'ALTER TABLE ONLY inference_transcript  ADD CONSTRAINT inference_transcript_c1 UNIQUE (transcript_uname, inference_id,known_protein_id);'
 );

#        $dbh->do('ALTER TABLE ONLY inference_transcript  ADD CONSTRAINT inference_transcript_c2 UNIQUE (transcript_uname, inference_id,inference_hit_rank);'        );
 $dbh->do(
'CREATE INDEX inference_transcript_idx1 ON inference_transcript USING btree (transcript_uname);'
 );

#       $dbh->do('CREATE INDEX inference_transcript_idx2 ON inference_transcript USING btree (inference_id);'     );
 $dbh->do(
'CREATE INDEX inference_transcript_idx3 ON inference_transcript USING btree (known_protein_id);'
 );


 $dbh->do( '
CREATE TABLE network (
 network_id serial primary key,
 network_type integer REFERENCES public.metadata(metadata_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
 description varchar,
 json text NOT NULL,
 size integer DEFAULT 0
);
' );
 $dbh->do( '
 CREATE INDEX network_idx1 ON network USING btree (network_type);
 ' );

 $dbh->do( '
 CREATE TABLE transcript_network (
  transcript_network_id serial primary key,
  transcript_uname varchar NOT NULL REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  network_id integer NOT NULL REFERENCES network(network_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
 );
 ' );

 $dbh->do( '
 CREATE INDEX transcript_network_idx1 ON transcript_network USING btree (transcript_uname);
 ' );
 $dbh->do( '
 CREATE INDEX transcript_network_idx2 ON transcript_network USING btree (network_id);
 ' );

 die if $dbh->{"ErrCount"};
 $dbh->commit;
 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;
 return $dataset_id;
}

sub delete_dataset() {
 my $dbh = shift;
 my $dataset_id = shift || die;
 print "Attempting to delete dataset $dataset_id\n";
 unless ( $dataset_id =~ /^\d+$/ ) {
  $dataset_id = &check_dataset( $dbh, $dataset_id );
  die "Can't convert it to a dataset ID or it doesn't exist...\n"
    if !$dataset_id;
 }
 my $schema_name = 'dataset_' . $dataset_id;
 $dbh->{"RaiseError"} = 1;
 $dbh->begin_work;
 $dbh->do( 'DROP SCHEMA ' . $schema_name . ' CASCADE' );
 $dbh->do("DELETE FROM public.datasets WHERE dataset_id = $dataset_id");
 die if $dbh->{"ErrCount"};
 $dbh->commit;
 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;
 print "Done\n";
}

sub get_www_files() {
 print "Getting files\n";
 my @files = @_;
 my @new_files;
 for ( my $i = 0 ; $i < scalar(@files) ; $i++ ) {
  my $f = basename( $files[$i] );
  if ( $f =~ /\.tar\.gz$/ ) {
   my $f_base = $f;
   $f_base =~ s/\.tar\.gz$//;
   &process_cmd("wget --passive-ftp $files[$i]")
     unless ( -s $f || -s $f_base );
   my @uncompressed_files = `tar -tzf $f`;
   chomp(@uncompressed_files);
   &process_cmd("tar -xzf $f");
   push( @new_files, @uncompressed_files );
  }
  elsif ( $f =~ /\.gz$/ ) {
   my $f_base = $f;
   $f_base =~ s/\.gz$//;
   &process_cmd("wget --passive-ftp $files[$i]")
     unless ( -s $f || -s $f_base );
   &process_cmd("gunzip -dc $f > $f_base")
     unless ( !-s $f || -s $f_base );
   push( @new_files, $f_base );
  }
  elsif ( $f =~ /\.bz2$/ ) {
   my $f_base = $f;
   $f_base =~ s/\.bz2$//;
   &process_cmd("wget --passive-ftp $files[$i]")
     unless ( -s $f || -s $f_base );
   &process_cmd("bunzip2 -dck $f > $f_base")
     unless ( !-s $f || -s $f_base );
   push( @new_files, $f_base );
  }
 }
 return (@new_files);
}

sub prepare_uniprot_id_mapping() {
 my $dbh = shift;
 print "Parsing Uniprot ID mapping (slow)\n";
 $dbh->do("COPY uniprot_assoc (uniprot_id,xref_db,xref_accession) FROM STDIN");
 &do_copy_stdin( "idmapping.dat", $dbh );

 print "Indexing...\n";
 $dbh->do(
         'CREATE INDEX uniprot_assoc_uniprot_idx on uniprot_assoc(uniprot_id)');

 # 10Gb
 $dbh->do(
        'CREATE INDEX uniprot_assoc_xref_idx on uniprot_assoc(xref_accession)');
 print "Indexing complete.\n";
}

sub prepare_ec() {
 my $dbh = shift;
 print "Processing enzyme terms (fast)\n";
 my @files_to_get = qw|
   ftp://ftp.expasy.org/databases/enzyme/enzyme.dat
   |;
 @files_to_get = &get_www_files(@files_to_get);

=pod

 ID  Identification                         (Begins each entry; 1 per entry)
   DE  Description (official name)            (>=1 per entry)
   AN  Alternate name(s)                      (>=0 per entry)
   CA  Catalytic activity                     (>=1 per entry)
   CF  Cofactor(s)                            (>=0 per entry)
   CC  Comments                               (>=0 per entry)
   PR  Cross-references to PROSITE            (>=0 per entry)
   DR  Cross-references to Swiss-Prot         (>=0 per entry)
   //  Termination line                       (Ends each entry; 1 per entry)

=cut

 my $orig_record_sep = $/;
 $/ = "//\n";
 open( IN,   'enzyme.dat' );
 open( OUT1, ">$cwd/.enzyme.psql" );
 open( OUT2, ">$cwd/.enzyme_assoc.psql" );
 open( OUT3, ">$cwd/.enzyme_desc.psql" );
 open( OUT4, ">$cwd/.enzyme_names.psql" );
 open( OUT5, ">$cwd/.enzyme_cat.psql" );
 open( OUT6, ">$cwd/.enzyme_cofact.psql" );
 open( OUT7, ">$cwd/.enzyme_comm.psql" );
 my $header = <IN>;
RECORD: while ( my $record = <IN> ) {
  my ( $accession, @descriptions, @alternate_names, @catalytic_activities,
       @cofactors, @comments, @uniprot_uids );
  my ( $description_lines, $alternate_name_lines, $catalytic_activities_lines,
       $cofactor_lines, $comment_lines, $uniprot_lines );
  my @entry = split( "\n", $record );
  foreach my $ln (@entry) {
   if ( $ln =~ /^ID\s+(\S+)/ ) {
    $accession = $1;
   }
   elsif ( $ln =~ /^DE\s+(.+)/ ) {
    my $desc = $1;
    next RECORD
      if $desc eq 'Deleted entry'
       || $desc =~ /^Transferred entry/;
    $description_lines .= $1 . "\n";
   }
   elsif ( $ln =~ /^AN\s+(.+)/ ) {
    $alternate_name_lines .= $1 . "\n";
   }
   elsif ( $ln =~ /^CA\s+(.+)/ ) {
    $catalytic_activities_lines .= $1 . "\n";
   }
   elsif ( $ln =~ /^CF\s+(.+)/ ) {
    $cofactor_lines .= $1 . "\n";
   }
   elsif ( $ln =~ /^CC\s+(.+)/ ) {
    $comment_lines .= $1;
   }
   elsif ( $ln =~ /^DR\s+(.+)/ ) {
    my $cap = $1;
    $cap =~ s/\S+\s*;\s*//g;
    $uniprot_lines .= $cap;
   }
  }
  if ($accession) {
   my %hash;
   if ($uniprot_lines) {
    my @uniprot_data = split( /,\s*/, $uniprot_lines );
    $hash{'uniprot_data'} = \@uniprot_data;
   }
   else {

    # we don't care about it?
    next RECORD;
   }
   if ($description_lines) {
    my @desc = split( ".\n", $description_lines );
    $hash{'primary_name'} = $desc[0];
    $hash{'descriptions'} = \@desc;
   }
   @{ $hash{'altnames'} } = split( ".\n", $alternate_name_lines )
     if $alternate_name_lines;
   @{ $hash{'catalytic_act'} } =
     split( ".\n", $catalytic_activities_lines )
     if $catalytic_activities_lines;
   @{ $hash{'cofactors'} } = split( /.\n|;\s*/, $cofactor_lines )
     if $cofactor_lines;
   if ($comment_lines) {
    @comments = split( "-!- ", $comment_lines );
    shift(@comments);
    $hash{'comments'} = \@comments;
   }
   print OUT1 join( "\t", ( $accession, $hash{'primary_name'} ) ) . "\n"
     if $hash{'primary_name'};
   foreach my $data ( @{ $hash{'uniprot_data'} } ) {
    print OUT2 join( "\t", $accession, $data ) . "\n";
   }
   foreach my $data ( @{ $hash{'descriptions'} } ) {
    print OUT3 join( "\t", $accession, $data ) . "\n";
   }
   foreach my $data ( @{ $hash{'altnames'} } ) {
    print OUT4 join( "\t", $accession, $data ) . "\n";
   }
   foreach my $data ( @{ $hash{'catalytic_act'} } ) {
    print OUT5 join( "\t", $accession, $data ) . "\n";
   }
   foreach my $data ( @{ $hash{'cofactors'} } ) {
    print OUT6 join( "\t", $accession, $data ) . "\n";
   }
   foreach my $data ( @{ $hash{'comments'} } ) {
    print OUT7 join( "\t", $accession, $data ) . "\n";
   }
  }
 }
 close IN;
 $/ = $orig_record_sep;
 close OUT1;
 close OUT2;
 close OUT3;
 close OUT4;
 close OUT5;
 close OUT6;
 close OUT7;
 $dbh->begin_work();
 $dbh->do("COPY enzyme (ec_id,primary_name) FROM STDIN");
 &do_copy_stdin( ".enzyme.psql", $dbh );

 $dbh->do("COPY enzyme_assoc (ec_id,uniprot_id) FROM STDIN");
 &do_copy_stdin( ".enzyme_assoc.psql", $dbh );

 $dbh->do("COPY enzyme_description (ec_id,description) FROM STDIN");
 &do_copy_stdin( ".enzyme_desc.psql", $dbh );

 $dbh->do("COPY enzyme_names (ec_id,alias) FROM STDIN");
 &do_copy_stdin( ".enzyme_names.psql", $dbh );

 $dbh->do(
        "COPY enzyme_catalytic_activity (ec_id,catalytic_activity) FROM STDIN");
 &do_copy_stdin( ".enzyme_cat.psql", $dbh );

 $dbh->do("COPY enzyme_cofactor (ec_id,cofactor) FROM STDIN");
 &do_copy_stdin( ".enzyme_cofact.psql", $dbh );

 $dbh->do("COPY enzyme_comments (ec_id,comment) FROM STDIN");
 &do_copy_stdin( ".enzyme_comm.psql", $dbh );

 $dbh->commit();
 &process_cmd(
"rm -f  $cwd/.enzyme.psql $cwd/.enzyme_assoc.psql $cwd/.enzyme_desc.psql $cwd/.enzyme_names.psql $cwd/.enzyme_cat.psql $cwd/.enzyme_cofact.psql $cwd/.enzyme_comm.psql"
 );
 print "Indexing...\n";
 $dbh->do('CREATE INDEX enzyme_assoc_ec_idx on enzyme_assoc(ec_id)');
 $dbh->do(
         'CREATE INDEX enzyme_description_ec_idx on enzyme_description(ec_id)');
 $dbh->do('CREATE INDEX enzyme_names_ec_idx on enzyme_names(ec_id)');
 $dbh->do(
'CREATE INDEX enzyme_catalytic_activity_ec_idx on enzyme_catalytic_activity(ec_id)'
 );
 $dbh->do('CREATE INDEX enzyme_cofactor_ec_idx on enzyme_cofactor(ec_id)');
 $dbh->do('CREATE INDEX enzyme_comments_ec_idx on enzyme_comments(ec_id)');
 $dbh->do('CREATE INDEX enzyme_assoc_uniprot_idx on enzyme_assoc(uniprot_id)');
 $dbh->do('CREATE INDEX enzyme_name_idx on enzyme(primary_name)');
 print "Indexing complete.\n";
}

sub prepare_go_slim() {
 my $dbh = shift;
 print "\t GO slim terms\n";
 open( IN,  'goaslim.map' );
 open( OUT, ">$cwd/.goslim.psql" );
 while ( my $ln = <IN> ) {
  next unless $ln =~ /^GO:(\d+)\s+GO:(\d+)/;
  print OUT join( "\t", ( $1, $2 ) ) . "\n";
 }
 close IN;
 close OUT;
 $dbh->do("COPY go_slim (go_id,slim_go_id) FROM STDIN");
 &do_copy_stdin( ".goslim.psql", $dbh );
 unlink("$cwd/.goslim.psql");
}

sub prepare_go() {
 my $dbh = shift;
 print "Parsing GO terms (slowish - 8min)\n";
 my @files_to_get = qw|
   http://www.geneontology.org/ontology/obo_format_1_2/gene_ontology_ext.obo
   ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/goslim/goaslim.map
   ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/UNIPROT/gp_association.goa_uniprot.gz
   |;

# ftp://ftp.ebi.ac.uk/pub/databases/uniprot/current_release/knowledgebase/idmapping/idmapping.dat.gz
#ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/UNIPROT/gene_association.goa_uniprot.gz
#ftp://ftp.ebi.ac.uk/pub/databases/GO/goa/UNIPROT/gp_information.goa_uniprot.gz
 @files_to_get = &get_www_files(@files_to_get);

 my $orig_record_sep = $/;
 $/ = "[Term]\n";
 open( IN, "gene_ontology_ext.obo" );
 my $header = <IN>;
 open( OUT,  ">$cwd/.go_terms.psql" );
 open( OUT2, ">$cwd/.go_syn.psql" );

 while ( my $record = <IN> ) {
  my @entries = split( "\n", $record );
  next unless $entries[2];
  my ( $go_id, @synonyms, $name, $class );
  foreach my $ln (@entries) {
   if ( $ln =~ /^id:\s+GO:(\d+)/ ) {
    $go_id = $1;
   }
   elsif ( $ln =~ /^name:\s+(.+)/ ) {
    $name = $1;
   }
   elsif ( $ln =~ /^alt_id:\s+GO:(\d+)/ ) {
    push( @synonyms, $1 );
   }
   elsif ( $ln =~ /^namespace:\s+(.+)/ ) {
    if ( $1 eq 'biological_process' ) {
     $class = 'P';
    }
    elsif ( $1 eq 'cellular_component' ) {
     $class = 'C';
    }
    elsif ( $1 eq 'molecular_function' ) {
     $class = 'F';
    }
   }
  }
  if ( $go_id && $name && $class ) {
   print OUT $go_id . "\t" . $name . "\t" . $class . "\tF\n";
   if (@synonyms) {
    foreach my $syn_id (@synonyms) {
     print OUT $syn_id . "\t" . $name . "\t" . $class . "\tT\n";
     print OUT2 $go_id . "\t" . $syn_id . "\n";
    }
   }
  }
 }
 close IN;
 $/ = $orig_record_sep;
 close OUT;
 close OUT2;
 &process_cmd("sort -u -o $cwd/.go_syn.psql. $cwd/.go_syn.psql");
 my %uhash;
 open( IN, "$cwd/.go_syn.psql." );

 while ( my $ln = <IN> ) {
  chomp($ln);
  my @data = split( "\t", $ln );
  next unless $data[1];
  $uhash{ $data[0] } = $data[1] unless $uhash{ $data[1] } = $data[0];
 }
 close IN;
 unlink("$cwd/.go_syn.psql.");
 open( OUT, ">$cwd/.go_syn.psql" );
 foreach my $id ( keys %uhash ) {
  print OUT $id . "\t", $uhash{$id} . "\n";
 }
 close OUT;
 $dbh->begin_work();
 $dbh->do("COPY go (go_id,name,class,is_synomym) FROM STDIN");
 &do_copy_stdin( ".go_terms.psql", $dbh );
 $dbh->do("COPY go_synonym (go_id,go_synonym) FROM STDIN");
 &do_copy_stdin( ".go_syn.psql", $dbh );
 unlink("$cwd/.go_terms.psql");
 unlink("$cwd/.go_syn.psql");
 &associate_uniprot_gene_ontology();
 &prepare_go_slim();
 $dbh->commit();
 print "Indexing...\n";
 $dbh->do('CREATE INDEX go_class_idx on go(class)');
 $dbh->do('CREATE INDEX go_synonym_idx1 on go_synonym(go_id)');
 $dbh->do('CREATE INDEX go_synonym_idx2 on go_synonym(go_synonym)');
 $dbh->do('CREATE INDEX go_slim_go_id_idx on go_slim(go_id)');
 $dbh->do('CREATE INDEX go_slim_slim_go_id_idx on go_slim(slim_go_id)');
 $dbh->do('CREATE INDEX go_assoc_uniprot_idx on go_assoc(uniprot_id)');
 print "Indexing complete.\n";
}

sub associate_uniprot_gene_ontology() {
 my $dbh     = shift;
 my $go_file = 'gp_association.goa_uniprot';
 if ( !$go_file || !-s $go_file ) {
  warn
"No GO Uniprot association file found. GO terms cannot be associated with Uniprot.\n";
  return;
 }
 print "\t GO uniprot entries\n";
 open( IN,  $go_file );
 open( OUT, ">$cwd/.go.psql" );
 while ( my $ln = <IN> ) {
  next unless $ln =~ /^UniProtKB\b/;
  my @data = split( "\t", $ln );
  next if !$do_inferences && $NOTALLOWED_EVID{ $data[5] };
  $data[3] =~ s/^GO:// || next;
  $data[4] =~ /^(\S+):(\S+)/;
  my $ref_db = $1;
  my $ref_id = $2;
  print OUT join(
                  "\t",
                  (
                    $data[1], $data[3], $ref_db, $ref_id,
                    $data[5], $data[9], $data[8]
                  )
  ) . "\n";
 }
 close IN;
 close OUT;
 $dbh->begin_work();
 $dbh->do(
"COPY go_assoc (uniprot_id,go_id,reference_db,reference_uid,evidence,annotator,date_annotated) FROM STDIN"
 );
 &do_copy_stdin( ".go.psql", $dbh );
 $dbh->commit();
 unlink("$cwd/.go.psql");
}

sub prepare_kegg() {
 my $dbh = shift;
 print "Preparing KEGG terms...\n";

=pod

.mode tabs
.output ko_terms.tsv # SELECT  id,name,definition from kos ; 
.output pathways.tsv # SELECT pathway_id,pathway_name FROM pathways WHERE pathway_name is not null ;
.output ko_pathway.tsv # SELECT pathway_id,ko_id from pathways p JOIN kos_pathways kp ON kp.puid=p.puid
.output ko_uniprot.tsv # SELECT ko_id,up FROM kos k JOIN kos_genes kg ON k.id=kg.ko_id JOIN genes_uniprots gu ON gu.gene_id=kg.gene_id;
.output pathway_uniprot.tsv # SELECT pathway_id,up FROM pathways p JOIN genes_pathways gp ON p.puid=gp.puid JOIN genes_uniprots gu ON gu.gene_id=gp.gene_id;

=cut

 my $ko_file              = "$cwd/ko_terms.tsv";        #name is comma delimited
 my $pathway_file         = "$cwd/pathways.tsv";
 my $ko_pathway_file      = "$cwd/ko_pathway.tsv";
 my $ko_uniprot_file      = "$cwd/ko_uniprot.tsv";
 my $pathway_uniprot_file = "$cwd/pathway_uniprot.tsv";
 die "Cannot find $ko_file file\n"         unless -s $ko_file;
 die "Cannot find $pathway_file file\n"    unless -s $pathway_file;
 die "Cannot find $ko_pathway_file file\n" unless -s $ko_pathway_file;
 die "Cannot find $ko_uniprot_file file\n" unless -s $ko_uniprot_file;
 die "Cannot find $pathway_uniprot_file file\n"
   unless -s $pathway_uniprot_file;
 open( IN, $ko_file ) || die;
 open( OUT,  ">$cwd/.$ko_file.ko.psql" );
 open( OUT2, ">$cwd/.$ko_file.names.psql" );

 while ( my $ln = <IN> ) {
  my @data = split( "\t", $ln );
  next unless $data[2];
  print OUT join( "\t", ( $data[0], $data[2] ) );
  my @names = split( ",", $data[1] );
  foreach my $n (@names) {
   print OUT2 join( "\t", ( $data[0], $n ) ) . "\n";
  }
 }
 close IN;
 close OUT;
 close OUT2;
 $dbh->begin_work();
 chmod( 0644, "$cwd/.$ko_file.ko.psql" );
 $dbh->do("COPY ko (ko_id,description) FROM STDIN");
 &do_copy_stdin( ".$ko_file.ko.psql", $dbh );
 unlink("$cwd/.$ko_file.ko.psql");

 $dbh->do("COPY ko_names (ko_id,name) FROM STDIN");
 &do_copy_stdin( ".$ko_file.names.psql", $dbh );
 unlink("$cwd/.$ko_file.names.psql");
 &process_cmd("sort -k1,1 -u $pathway_file > $pathway_file.");
 rename( "$pathway_file.", "$pathway_file" );
 $dbh->do("COPY kegg_pathway (pathway_id,description) FROM STDIN");
 &do_copy_stdin( "$pathway_file", $dbh );
 $dbh->do("COPY ko_kegg_pathway (pathway_id,ko_id) FROM STDIN");
 &do_copy_stdin( "$ko_pathway_file", $dbh );
 $dbh->do("COPY ko_assoc (ko_id,uniprot_id) FROM STDIN");
 &do_copy_stdin( "$ko_uniprot_file", $dbh );
 &process_cmd(
"sort -k1,1 -u $pathway_uniprot_file|grep  '^[:alnum:]' > $pathway_uniprot_file."
 );
 rename( "$pathway_uniprot_file.", "$pathway_uniprot_file" );
 $dbh->do("COPY kegg_pathway_assoc (pathway_id,uniprot_id) FROM STDIN ");
 &do_copy_stdin( "$pathway_uniprot_file", $dbh );

 $dbh->commit();
 $dbh->do('CREATE INDEX ko_names_ko_idx on ko_names(ko_id)');
 $dbh->do('CREATE INDEX ko_kegg_pathway_ko_idx on ko_kegg_pathway(ko_id)');
 $dbh->do('CREATE INDEX ko_kegg_pathway_ko_idx on ko_kegg_pathway(pathway_id)');
 $dbh->do('CREATE INDEX ko_assoc_uniprot_idx on ko_assoc(uniprot_id)');
 $dbh->do(
'CREATE INDEX kegg_pathway_assoc_uniprot_idx on kegg_pathway_assoc(uniprot_id)'
 );
}

sub prepare_eggnog() {
 my $dbh = shift;
 print "Preparing eggnog...\n";

 #$dbh->{"RaiseError"} = 1;

 my @eggNOG = qw|
   ftp://eggnog.embl.de/eggNOG/latest/protein.aliases.v3.txt.gz
   ftp://eggnog.embl.de/eggNOG/latest/UniProtAC2eggNOG.3.0.tsv.gz
   ftp://eggnog.embl.de/eggNOG/latest/fun.txt.gz
   ftp://eggnog.embl.de/eggNOG/latest/all.funccat.tar.gz
   ftp://eggnog.embl.de/eggNOG/latest/all.description.tar.gz
   ftp://eggnog.embl.de/eggNOG/latest/all.members.tar.gz
   |;

 #  ftp://eggnog.embl.de/eggNOG/latest/protein.sequences.v3.fa.gz
 #  ftp://eggnog.embl.de/eggNOG/latest/all.members.tar.gz
 @eggNOG = &get_www_files(@eggNOG);
 $dbh->begin_work;

 # functinoal cat descs
 my $insert_eggnot_funccat = $dbh->prepare(
  "INSERT INTO eggnog_categories (category,grouping,description) VALUES (?,?,?)"
 );
 open( EGGNOG, "fun.txt" ) || die;
 while ( my $ln = <EGGNOG> ) {
  next if $ln =~ /^\s*$/;
  if ( $ln =~ /^\w+/ ) {
   chomp($ln);
   my $category = $ln || next;
   while ( my $ln2 = <EGGNOG> ) {
    last if $ln2 =~ /^\s*$/;
    chomp($ln2);
    if ( $ln2 =~ /\[(\w)\]\s(.+)/ ) {
     next unless $1 && $2;
     $insert_eggnot_funccat->execute( $1, $category, $2 );
    }
   }
  }
 }
 close EGGNOG;
 $dbh->commit;
 $insert_eggnot_funccat->finish();
 print "Parsing eggnog individual files...\n";
 $dbh->begin_work;
 foreach my $egg (@eggNOG) {
  die if !-s $egg;

  # populate descriptions
  if ( $egg =~ /description/ ) {
   $dbh->do("COPY eggnog (eggnog_id,description) FROM STDIN");
   &do_copy_stdin( "$egg", $dbh );
  }
 }
 $dbh->commit;

 print "Parsing eggnog individual functions/categories...\n";
 my %protein2eggnog;

#my $insert_eggnog_func=$dbh->prepare("INSERT INTO eggnog_category (eggnog_id,category) VALUES (?,?)");
 my $check_eggnog =
   $dbh->prepare("SELECT eggnog_id from eggnog WHERE eggnog_id = ?");

 $dbh->begin_work;
 foreach my $egg (@eggNOG) {

  # populate func categories
  #TODO Key (eggnog_id)=(NOG204072) is not present in table "eggnog"
  if ( $egg =~ /funccat/ ) {
   open( EGG,    $egg );
   open( EGGOUT, ">$cwd/.$egg.psql" );
   while ( my $ln = <EGG> ) {
    next if $ln =~ /^\s*$/;
    chomp($ln);
    my @data = split( "\t", $ln );
    next unless $data[0] && $data[1];
    my @cats = split( '', $data[1] );
    foreach my $cat (@cats) {
     next if $cat eq 'X';
     $check_eggnog->execute( $data[0] );
     my $res = $check_eggnog->fetchrow_arrayref();
     if ($res) {
      print EGGOUT $data[0] . "\t$cat\n";

      #$insert_eggnog_func->execute($data[0],$cat);
     }

    }
   }
   close EGG;
   close EGGOUT;
   $dbh->do("COPY eggnog_category (eggnog_id,category) FROM STDIN");
   &do_copy_stdin( ".$egg.psql", $dbh );
   unlink("$cwd/.$egg.psql");
  }
  elsif ( $egg =~ /members/ ) {
   open( EGG, $egg );

   #open (EGGOUT,">.$egg.psql");
   while ( my $ln = <EGG> ) {
    next if $ln =~ /^\s*$/;
    my @data = split( "\t", $ln );

    #$data[1]=~/(\d+)\.(\S+)/ ||next;
    #my $species = $1;
    #my $protein = $2;
    #my $egg_clus = $data[0];
    $protein2eggnog{ $data[1] } = $data[0];

    #print EGGOUT join("\t",@data)."\n";
   }
   close EGG;

   #close EGGOUT;
   #$dbh->do("COPY eggnog (eggnog_id,description) FROM STDIN");
   #&do_copy_stdin(".$egg.psql",$dbh);
   #unlink("$cwd/.$egg.psql");
  }
 }
 $dbh->commit;
 print "Indexing...\n";
 $dbh->do(
    'CREATE INDEX eggnog_category_eggnog_id_idx on eggnog_category(eggnog_id)');
 print "Indexing complete.\n";
 print "Associating eggnog with Uniprot (slow)...\n";

 # do associations
 unlink("$cwd/.eggnog_assoc.psql");
 &process_cmd("sort -u -o $cwd/.eggnog_assoc.psql UniProtAC2eggNOG.3.0.tsv");

#my $check_uniprot = $dbh->prepare("SELECT uniprot_id from uniprot_assoc WHERE uniprot_id=?");
 my $find_uniprot =
   $dbh->prepare("SELECT uniprot_id from uniprot_assoc WHERE xref_accession=?");

 # this is a check to make sure all aliases are stored as uniprots...
 &process_cmd(
         "sort -u -o $cwd/.protein.aliases.v3.txt $cwd/protein.aliases.v3.txt");
 open( EGGNOG, "$cwd/.protein.aliases.v3.txt" );
 open( EGGOUT, ">>$cwd/.eggnog_assoc.psql" );
 my %uniprot_done;
 while ( my $ln = <EGGNOG> ) {
  chomp($ln);
  my @data = split( '\|', $ln );
  next if !$data[1] || $data[1] =~ /^\w{6}_\w{5}$/;
  my $eggnog_id = $protein2eggnog{ $data[0] } || next;

  #delete $protein2eggnog{ $data[0] };
  if ( length( $data[1] ) == 6 && $data[1] =~ /^\w+$/ ) {
   next if $uniprot_done{ $data[1] }{$eggnog_id};
   print EGGOUT join( "\t", ( $data[1], $eggnog_id ) ) . "\n";
   $uniprot_done{ $data[1] }{$eggnog_id}++;
  }
  else {
   $find_uniprot->execute( $data[1] );
   my $result = $find_uniprot->fetchrow_arrayref();
   if ($result) {
    next if $uniprot_done{ $result->[0] }{$eggnog_id};
    print EGGOUT join( "\t", ( $result->[0], $eggnog_id ) ) . "\n";
    $uniprot_done{ $result->[0] }{$eggnog_id}++;
   }
  }
 }
 close EGGNOG;
 close EGGOUT;
 &process_cmd("sort -u -o $cwd/.eggnog_assoc.psql. $cwd/.eggnog_assoc.psql");
 unlink("$cwd/.eggnog_assoc.psql");
 rename( "$cwd/.eggnog_assoc.psql.", "$cwd/.eggnog_assoc.psql" );
 $dbh->begin_work;
 $dbh->do("COPY eggnog_assoc (uniprot_id,eggnog_id) FROM STDIN");
 &do_copy_stdin( ".eggnog_assoc.psql", $dbh );
 $dbh->commit;
 unlink("$cwd/.eggnog_assoc.psql");
 print "Indexing...\n";
 $dbh->do('CREATE INDEX eggnog_assoc_eggnog_id_idx on eggnog_assoc(eggnog_id)');
 $dbh->do(
        'CREATE INDEX eggnog_assoc_uniprot_id_idx on eggnog_assoc(uniprot_id)');
 print "Indexing complete.\n";
 $check_eggnog->finish();

 #$insert_eggnog_func->finish();
 #$check_uniprot->finish();
 $find_uniprot->finish();

 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;
}

#############################################################
###################### parse annotation output  #############
#############################################################
sub process_protein_blast() {
 print "Processing BLAST output...\n";
 my @files = @_;

 sub _version_blast() {
  my @version = `blastp -version 2>/dev/null`;
  chomp(@version);
  return join( "\n", @version );    #return string
 }
}

sub process_protein_hhr() {
 print "Processing HHR markov output...\n";

# this can be multiple hhr files concatanated together but only one database per file.
 my $dbh_store     = shift;
 my $files         = shift;
 my $record_number = int(0);
 open( INFERENCEFEATURECOPY, ">$cwd/.INFERENCEFEATURECOPY.psql" );

 foreach my $infile (@$files) {
  next unless $infile && -s $infile && ( -s $infile ) >= $hhr_min_filesize;
  print "Processing $infile as an hhblits result\n";
  my ( %hash, %databases_used, $dontstore );
  my $absolute_infile_name = File::Spec->rel2abs( $infile, $cwd );

  $sql_hash_ref->{'check_inference'}->execute($absolute_infile_name);
  my $inference_exists =
    $sql_hash_ref->{'check_inference'}->fetchrow_arrayref();
  if ( $inference_exists && $inference_exists->[0] ) {
   warn
"This file ($absolute_infile_name) has already been processed in the database. I will proceed anyway to link it with current dataset but be careful\n";
   $dontstore = 1;
  }
  my $record_sep = $/;
  $/ = "Done!\n";
  open( IN, $infile ) || die;
  $| = 1;
  my ( $last_database, $last_date_searched, $last_command );
RECORD: while ( my $record = <IN> ) {
   $record_number++;
   print "Processed: $record_number\t\t\r" if ( $record_number % 100 == 0 );
   next unless ( length($record) ) >= $hhr_min_filesize;
   my @record_lines = split( "\n", $record );
   my ( $query, %check );
   for ( my $i = 0 ; $i < 10 ; $i++ ) {
    $query = shift(@record_lines);
    chomp($query);
    last if $query =~ s/^Query\s+//;
   }

   my $attribute = $query;
   $query =~ /^(\S+)/;

   if ($1) {
    $query = $1;
   }
   else {
    warn "\nFile $infile is not a .hhr output file; skipping...\n";
    close IN;
    next;
   }

   $sql_hash_ref->{'check_transcript'}->execute($query);
   my $tres = $sql_hash_ref->{'check_transcript'}->fetchrow_arrayref();
   unless ( $tres && $tres->[0] ) {
    warn "Cannot find $query in the transcript database. Skipping\n";
    next;
   }
   my $match_columns = shift(@record_lines);
   my $No_of_seqs    = shift(@record_lines);
   my $Neff          = shift(@record_lines);
   my $Searched_HMMs = shift(@record_lines);
   my $date_searched = shift(@record_lines);
   $date_searched =~ /^Date\s+(.+)/;
   $date_searched = $1;
   my $command = shift(@record_lines);
   $command =~ /^Command\s+(.+)/;
   $command = $1;
   $command =~ /\s-d\s(\S+)/;
   my $database = $1;
   $database = basename($database);
   my $i = int(0);

   for ( my $i = 0 ; $i < @record_lines ; $i++ ) {
    my $ln = $record_lines[$i];

    # if a3m lines, then stop
    last if $ln =~ /^>$query/;
    if ( $ln =~ /^\s*No Hit/ ) {
     for ( my $k = $i + 1 ; $k < @record_lines ; $k++ ) {
      my $ln2 = $record_lines[$k];
      last if $ln2 =~ /^\s*$/;

      $ln2 =~ /^\s*(\d+)/;
      my $hit_number = $1;
      last if $hit_number > $hhr_max_hits;
      my $hit = substr( $ln2, 35 );

      # Prob E-value P-value  Score    SS Cols Query HMM  Template HMM
      $hit =~
        /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
      my ( $prob, $evalue, $pvalue, $score, $structure_score, $alignment_length,
           $aligned_query_columns, $aligned_hit_columns )
        = ( $1, $2, $3, $4, $5, $6, $7, $8 );
      next if $hhr_homology_prob_cut > $prob;
      next if $hhr_eval_cut && $hhr_eval_cut < $evalue;
      next if $hhr_pval_cut && $hhr_pval_cut < $pvalue;
      next if $hhr_score_cut && $hhr_score_cut > $score;
      if ( $evalue < 1e-99 ) {
       $evalue = int(0.00);
      }
      if ( $pvalue < 1e-99 ) {
       $pvalue = int(0.00);
      }

      $aligned_query_columns =~ /(\d+)-(\d+)/;
      my $Qstart = $1;
      my $Qstop  = $2;
      $aligned_hit_columns =~ /(\d+)-(\d+)/;
      my $hit_start = $1;
      my $hit_stop  = $2;
      $hash{$query}{'data'}{$hit_number} = {

       #							'prob'       => $prob,
       #							'eval'       => $evalue,
       'pval'       => $pvalue,
       'full_score' => $score + $structure_score,

       #							'aln_length' => $alignment_length,
       'Qstart'    => $Qstart,
       'Qstop'     => $Qstop,
       'hit_start' => $hit_start,
       'hit_stop'  => $hit_stop
      };
     }
     for ( my $k = $i + 1 ; $k < @record_lines ; $k++ ) {
      my $ln2 = $record_lines[$k];
      next if $ln2 =~ /^\s*$/;
      if ( $ln2 =~ /^No\s(\d+)/ ) {
       my $hit_number = $1;
       last if $hit_number > $hhr_max_hits;

       # didn't pass criteria
       next unless $hash{$query}{'data'}{$hit_number};

       my $desc = $record_lines[ $k + 1 ];
       chomp($desc);
       my $stats = $record_lines[ $k + 2 ];
       $k += 2;

       #TODO parse descriptino to get the actual hit

=cut
>UP20|VEGDUSABA|52|169 Ribosomal-protein-alanine acetyltransferase OX=345219; Ribosomal-protein-alanine acetyltransferase OX=665940; Ribosomal-protein-alanine acetyltransferase OX=1144311; Ribosomal-protein-alanine N-acetyltransferase OX=683837; Ribosomal-protein-alanine acetyltransferase OX=941639; Ribosomal-protein-alanine acetyltransferase OX=429009. [Clostridium sp. 7_3_54FAA.]|G5FC42 [Bacillus coagulans 36D1.]|G2TIN3 [Clostridium symbiosum WAL-14673.]|E9SUK0 [Clostridium symbiosum WAL-14163.]|E7GRC0 [Geobacillus kaustophilus (strain HTA426). GN=]|Q5L3F7 [Geobacillus sp. (strain Y412MC52). GN=]|E8SS21 [Geobacillus sp. (strain C56-T3). GN=]|D7CZ50 [Geobacillus sp. (strain Y412MC61). GN=]|C9RVJ0 [Megamonas funiformis YIT 11815.]|H3KA08 [Geobacillus thermoleovorans CCB_US3_UF5.]|G8N2C4 [Veillonella sp. oral taxon 780 str. F0422. GN=]|F9N5J0 [Veillonella sp. oral taxon 158 str. F0412. GN=]|E4LCI8 [Lysinibacillus fusiformis ZC1. GN=]|D7WLY9 [Megamonas hypermegale ART12/1.]|D4KGJ5 [Veillonella sp. ACP1. GN=]|J5APD2 [Veillonella atypica ACS-134-V-Col7a. GN=]|E1LBQ5 [Veillonella atypica ACS-049-V-Sch6. GN=]|E1L8F9 [Blautia hydrogenotrophica DSM 10507.]|C0CKZ7 [NBRC 102448/ NCIMB 2269) (Sporosarcina halophila). GN=]|I0JI14 [Solibacillus silvestris (strain StLB046) (Bacillus silvestris). GN=]|F2F6G0 [743B). GN=]|D9STI6 [Listeriaceae bacterium TTU M1-001.]|H7F3D1 [Mitsuokella multacida DSM 20544.]|C9KJT8 [Bacillus cereus Rock3-44. GN=]|C2W372 [Anaerococcus lactolyticus ATCC 51172. GN=]|C2BG71 [Roseburia inulinivorans DSM 16841.]|C0FWN0 [Selenomonas sp. oral taxon 149 str. 67H29BP. GN=]|E0NY02 [Moorella thermoacetica (strain ATCC 39073). GN=]|Q2RGJ2 [acidocaldarius). GN=]|F8ICI1 [27009 / DSM 446 / 104-1A) (Bacillus acidocaldarius). GN=]|C8WRZ6 [Alicyclobacillus acidocaldarius LAA1.]|B7DM88 [Selenomonas sp. FOBRC9. GN=]|J4KEM8 [Selenomonas artemidis F0399.]|E7N4H8 [Selenomonas sp. oral taxon 137 str. F0430. GN=]|E4LL31 [Selenomonas flueggei ATCC 43531.]|C4V0J9 [Selenomonas sp. FOBRC6. GN=]|J4QBV0 [Selenomonas noxia F0398.]|G5H2D3 [Selenomonas infelix ATCC 43532.]|G5GLE1 [Centipeda periodontii DSM 2778. GN=]|F5RNJ1 [Desulforudis audaxviator (strain MP104C). GN=]|B1I668 [Dethiobacter alkaliphilus AHT 1.]|C0GCU8 [Clostridium difficile 050-P50-2011.]|G6BHT1 [Clostridium difficile 002-P50-2011.]|G6B2Y2 [Clostridium difficile NAP07. GN=]|D5S4P6 [Clostridium difficile NAP08. GN=]|D5Q987 [Ammonifex degensii (strain DSM 10501 / KC4). GN=]|C9RAP4 [Acidaminococcus intestini (strain RyC-MR95). GN=]|G4Q923 [Acidaminococcus sp. D21.]|C0WAD0 [Clostridium asparagiforme DSM 15981.]|C0CVB7 [Bacillus coagulans (strain 2-6). GN=]|F7Z0E2 [100100 / SLCC 3954). GN=]|D3UQ33 [Brevibacillus sp. CF112. GN=]|J3BAL2.

The OX (Organism taxonomy cross-reference) line is used to indicate the identifier of a specific organism in a taxonomic database. who knows what they are using....

    Prob: the Probability of target to be a true positive. For the probability of being a true positive,
the secondary structure score in column SS is taken into account, together with the raw score
incolumn Score. True positives are dened to be either globally homologous or they are at
least homologous in parts, and thereby locally similar in structure. More precisely, the latter
criterion demands that the MAXSUB score between query and hit is at least 0.1. In almost
all cases the structural similarity will we be due to a global OR LOCAL homology between
query and target.
E-value: The E-value gives the average number of false positives ('wrong hits') with a score
better than the one for the target when scanning the database. It is a measure of reliability:
E-values near to 0 signify a very reliable hit, an E-value of 10 means about 10 wrong hits are
expected to be found in the database with a score at least this good. Note that E-value and
P-value are calculated without taking the secondary structure into account!
P-value: The P-value is the E-value divided by the number of sequences in the database. It is
the probability that in a pairwise comparison a wrong hit will score at least this good.
Score: the raw score, which does not include the secondary structure score.
    
    assume NCBI ID
=cut

       $desc =~ s/^>(\S+)\s+//;
       my $accession = $1;
       if ( $accession =~ /^UP/ ) {
        my %hits;
        while ( $desc =~ /\|(\w{6})[\W]/g ) {
         if ($1) {
          next if $check{$1};
          $check{$1} = 1;
          $hits{$1}  = 1;
         }
        }
        my @d = keys %hits;
        $hash{$query}{'data'}{$hit_number}{'uniprots'} = \@d
          if @d;
       }
       else {
        warn "\nThis accession is not from a UniProt search!\n$accession\n";
       }

       $stats =~
         /Probab=(\S+)\s+E-value=(\S+)\s+Score=(\S+)\s+Aligned_cols=(\d+)\s/;
       my $prob       = $1;
       my $evalue     = $2;
       my $score      = $3;
       my $aln_length = $4;
       if ( $evalue < 1e-99 ) {
        $evalue = int(0.00);
       }
       $hash{$query}{'data'}{$hit_number}{'prob'}       = $prob;
       $hash{$query}{'data'}{$hit_number}{'eval'}       = $evalue;
       $hash{$query}{'data'}{$hit_number}{'score'}      = $score;
       $hash{$query}{'data'}{$hit_number}{'aln_length'} = $aln_length;
       $stats =~ /Identities=(\S+)\s+Similarity=(\S+)\s+Sum_probs=(\S+)/;
       my $ident    = $1;
       my $simil    = $2 * 100;
       my $sum_prob = $3;
       $ident =~ s/\%//;
       $hash{$query}{'data'}{$hit_number}{'descr'}     = $desc;
       $hash{$query}{'data'}{$hit_number}{'ident'}     = $ident;
       $hash{$query}{'data'}{$hit_number}{'simil'}     = $simil;
       $hash{$query}{'data'}{$hit_number}{'sum_probs'} = $sum_prob;
      }
     }
    }
   }

   # end of a record; check if we got everything
   die
"\nI don't know which database this record is from.... (file = $infile ; record: $record_number)"
     unless $database;
   if ( !$hash{$query}{'data'} ) {

#	warn "Query $query had no hits.\n" if $debug;
# anything else we want to do: store that it has been searched and delete from hash.
#	&_store_hhr_processed_no_hits( $query, $date_searched, $command,					$database );
    delete( $hash{$query} );
    next RECORD;
   }
   $hash{$query}{'metadata'}{'date_searched'} = $date_searched;
   $hash{$query}{'metadata'}{'command'}       = $command;
   $hash{$query}{'metadata'}{'database'}      = $database;
   $last_database                             = $database;
   $last_command                              = $command;
   $last_date_searched                        = $date_searched;
  }
  close IN;
  $/ = $record_sep;

  # now have data in hash and can store it.
  # store the fact there was a search. assume one file per search (inference)
  unless ($dontstore) {

   #(name,description,filepath,program,programversion,algorithm,timeexecuted)
   $sql_hash_ref->{'store_inference'}
     ->execute( $last_command, 'hhblits vs ' . $dataset_uname,
                $absolute_infile_name, 'hhblits', &_version_hhblits, 'hhblits',
                $last_date_searched );
   $sql_hash_ref->{'check_inference'}->execute($absolute_infile_name);
   $inference_exists = $sql_hash_ref->{'check_inference'}->fetchrow_arrayref();
   warn "Couldn't store inference in database. Skipping...\n"
     unless $inference_exists && $inference_exists->[0];
  }

  # now we are storing just the data for every feature
  foreach my $query ( keys %hash ) {
   my %processed_uniprots;

   foreach my $hit_number (
                            sort { $a <=> $b }
                            keys %{ $hash{$query}{'data'} }
     )
   {
    last if $hit_number > $hhr_max_hits;

    #check_inference_transcript
    #store_inference_transcript
    #store_inference_hit_significance
    #store_inference_hit_rawscore
    #store_inference_hit_normscore
    #store_inference_hit_identity
    #store_inference_hit_start
    #store_inference_hit_stop
    #store_inference_hit_strand
    ### or just create it:
# transcript_uname,inference_id,known_protein_id,rawscore,normscore,significance,identity,similarity,hit_start,hit_end,strand

# one thing we need to do is check if the transcript has been already stored with a higher significance (assuming - correctly - that
# earlier hits are more significant.)

    if ($do_chado) { }
    else {
     foreach my $uniprot ( @{ $hash{$query}{'data'}{$hit_number}{'uniprots'} } )
     {
      next if $processed_uniprots{$query}{$uniprot};
      $processed_uniprots{$query}{$uniprot}++;
      print INFERENCEFEATURECOPY $query . "\t"
        . $inference_exists->[0] . "\t"
        . $hit_number . "\t"
        . $uniprot . "\t"
        . $hash{$query}{'data'}{$hit_number}{'full_score'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'prob'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'pval'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'ident'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'simil'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'Qstart'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'Qstop'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'hit_start'} . "\t"
        . $hash{$query}{'data'}{$hit_number}{'hit_stop'} . "\t"
        . "+\t+\n";
     }
    }
   }
  }

  # we now store the metadata for the search 'inference'
  # %databases_used
 }
 close(INFERENCEFEATURECOPY);
 print "Processed: $record_number\t\t\n";
 $| = 0;
 print "\nCommitting to database...\n";

 # now execute copy statement
 $dbh_store->do('DROP INDEX inference_transcript_idx1');

 #       $dbh_store->do('DROP INDEX inference_transcript_idx2');
 $dbh_store->do('DROP INDEX inference_transcript_idx3');

 $dbh_store->{"RaiseError"} = 1;
 $dbh_store->begin_work();
 if ($do_chado) { }
 else {
  $dbh_store->do(
"COPY inference_transcript (transcript_uname,inference_id,inference_hit_rank,known_protein_id,rawscore,normscore,significance,identity,similarity,query_start,query_end,hit_start,hit_end,query_strand,hit_strand) FROM STDIN"
  );
  &do_copy_stdin( ".INFERENCEFEATURECOPY.psql", $dbh_store );
  $dbh_store->commit();
  die if $dbh_store->{"ErrCount"};
  unlink("$cwd/.INFERENCEFEATURECOPY.psql");
  print "Indexing...\n";

  $dbh_store->do(
'CREATE INDEX inference_transcript_idx1 ON inference_transcript USING btree (transcript_uname);'
  );

#		$dbh_store->do('CREATE INDEX inference_transcript_idx2 ON inference_transcript USING btree (inference_id);'		);
  $dbh_store->do(
'CREATE INDEX inference_transcript_idx3 ON inference_transcript USING btree (known_protein_id);'
  );
 }

 sub _version_hhblits() {
  my $version = `hhblits 2>/dev/null|grep version`;
  chomp($version);
  return $version;
 }
}

sub process_protein_network() {
 print "Processing network output...\n";
 my $dbh_store = shift;
 my $files     = shift;
 my $separator = shift;
 $separator = "\n" unless $separator;
 my $orig_sep = $/;
 $/ = $separator;
 my $record_number = int(0);
 
 foreach my $infile (@$files) {
  next unless $infile && -s $infile && ( -s $infile ) >= 10;
  my $absolute_infile_name = File::Spec->rel2abs( $infile, $cwd );
  print "Processing $infile as a network result\n";
  open( IN, $infile ) || die("Cannot open $infile\n");
  my $header = <IN>;
  chomp($header);
  die unless $header =~ /^#?Network_type\t(\S+)/;
  my $network_type = $1;
  my $description;

  if ( $header =~ /Description\t(\S+)/ ) {
   $description = $1;
  }
  $dbh_store->begin_work;
  while ( my $network = <IN> ) {
   next if $network =~ /^\s*$/ || $network =~ /^#/;
   $record_number++;
   print "Processed: $record_number\t\t\r" if ( $record_number % 10 == 0 );

   chomp($network);
   my @members = split( "\t", $network );
   my $network_size = scalar(@members);
   next if !$network_size || $network_size < 2;
   @members = sort { $a cmp $b } (@members);
   my $json_data;
   my $json_metadata;
   if ($network_type eq 'MCL'){
    $json_data = &create_undirected_unweighted_network( \@members );
    my %hash = (
  "backgroundGradient1Color" => "rgb(112,179,222)",
  "backgroundGradient2Color" => "rgb(226,236,248)",
  "gradient" => 'true',
  "graphType" => "Network",
  "indicatorCenter" => "rainbow",
  "nodeFontColor" => "rgb(29,34,43)",
  "showAnimation" => 'true'
    );
    $json_metadata = encode_json(\%hash);
   }
   my ($metadata_id,$network_id);
   $sql_hash_ref->{'check_metadata'}->execute($network_type );
   my $res        = $sql_hash_ref->{'check_metadata'}->fetchrow_arrayref();
   if ($res){
    $metadata_id = $res->[0];undef($res);
   }else{
     $sql_hash_ref->{'store_metadata'}->execute($network_type );
     $sql_hash_ref->{'get_last_metadata_id'}->execute();
     $res        = $sql_hash_ref->{'get_last_metadata_id'}->fetchrow_arrayref();
     $metadata_id = $res->[0];undef($res);
     $sql_hash_ref->{'store_metadata_js'}->execute($metadata_id, $json_metadata);
   }  
   $sql_hash_ref->{'store_network'}->execute( $metadata_id, $description, $json_data, $network_size );
   $sql_hash_ref->{'get_last_network_id'}->execute();
   $res        = $sql_hash_ref->{'get_last_network_id'}->fetchrow_arrayref();
   $network_id = $res->[0];undef($res);

   foreach my $transcript_uname (@members) {
    $sql_hash_ref->{'store_transcript_network'}
      ->execute( $transcript_uname, $network_id );
   }
  }

  close IN;
  $dbh_store->commit;
 }
 
 $/ = $orig_sep;
}

sub process_protein_ipr() {
 my $dbh       = shift;
 my $files_ref = shift;
 my $ipr_schema =
'http://www.ebi.ac.uk/interpro/resources/schemas/interproscan5/interproscan-model-1.1.xsd';

 #XML::LibXML::Parser
 foreach my $xmlfile (@$files_ref) {
  print "Processing $xmlfile\n";
  my $reader = XML::LibXML::Reader->new( location => $xmlfile ) || die;

  die Dumper $reader->read;

  while ( $reader->read ) {

   _processNode($reader);
  }
 }

 sub _processNode {
  my $reader = shift;

 }

}

sub calculate_protein_properties() {
 my $fastafile = shift || die;
 my $basename  = basename($fastafile);
 my $outfile   = "$cwd/$basename.phys";
 print "Calculating protein physical properties...\n";
 open( FILEPHYS, ">$outfile" );

#	print FILEPHYS "#ID\tUndefined residues\tmin MW\tmax MW\tPositive aa\tNegative aa\tIso-Electric Potential\tCharge at pH5\tCharge at pH7\tCharge at pH9\n";
 my $protein_obj = Bio::SeqIO->new(
                                    -file     => $fastafile,
                                    -format   => 'Fasta',
                                    -alphabet => 'protein'
 );

# initiate calculator
# http://fields.scripps.edu/DTASelect/20010710-pI-Algorithm.pdf
# http://us.expasy.org/tools/pi_tool.html
# There are various sources for the pK values of the amino acids.  The set of pK values chosen will affect the pI reported.
# The charge state of each residue is assumed to be independent of the others. Protein modifications (such as a phosphate group) that have a charge are ignored.
 my $calc = Bio::Tools::pICalculator->new( -places => 2, -pKset => 'EMBOSS' );
 while ( my $seq_obj = $protein_obj->next_seq ) {
  my $seq = $seq_obj->seq();

  #make calculations
  $calc->seq($seq_obj);
  my $seq_id = $seq_obj->id;

  #print "Processing $seq_id\n";
  my $iep      = $calc->iep;
  my $ch_5     = $calc->charge_at_pH("5");
  my $ch_7     = $calc->charge_at_pH("7");
  my $ch_9     = $calc->charge_at_pH("9");
  my $checksum = md5_hex($seq);

#    my $seqobj = Bio::PrimarySeq->new( -seq      => "$string",-alphabet => 'protein' );
  my $weight   = Bio::Tools::SeqStats->get_mol_wt($seq_obj);
  my $hash_ref = Bio::Tools::SeqStats->count_monomers($seq_obj);
  my $minmw    = $$weight[0];
  my $maxmw    = $$weight[1];
  my %hash   = %$hash_ref;                   # dereference hash to avoid warning
  my $ch_pos = ( $hash{"K"} + $hash{"R"} );
  my $ch_neg = ( $hash{"D"} + $hash{"E"} );
  my $undefined_residues = $hash{"X"} ? $hash{"X"} : int(0);
  print FILEPHYS sprintf( "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%.1f\t%.1f\t%.1f\t%s\n",
                          $seq_id, $undefined_residues, $minmw, $maxmw, $ch_pos,
                          $ch_neg, $iep, $ch_5, $ch_7, $ch_9, $checksum );
 }
 close FILEPHYS;
 return $outfile;

 # these will go to chado.featureprop
}

=pod

 These store the fact that certain searches have been done and what the result was.
 
=cut

sub prepare_native_inference_sqls() {
 my $dbh        = shift || die;
 my $dataset_id = shift || die;
 my %sql_hash;
 $dbh->do( "SET SEARCH_PATH TO dataset_" . $dataset_id );

# we will not be making much use of db and dbxref. in the native database, everything is linked with a known protein.
 $sql_hash{'check_db'} = $dbh->prepare("SELECT db_id FROM db WHERE uname=?");
 $sql_hash{'check_dbxref'} = $dbh->prepare(
"SELECT dbxref_id from dbxref WHERE db_id=(SELECT db_id FROM db WHERE uname=?) AND accession = ?"
 );

 $sql_hash{'check_gene'} =
   $dbh->prepare("SELECT uname FROM gene WHERE uname=?");
 $sql_hash{'check_transcript'} =
   $dbh->prepare("SELECT uname FROM transcript WHERE uname=?");
 $sql_hash{'check_gene_all'} = $dbh->prepare("SELECT uname FROM gene");
 $sql_hash{'check_number_gene'} =
   $dbh->prepare("SELECT count(uname) FROM gene");
 $sql_hash{'check_library'} = $dbh->prepare(
                "SELECT library_uname from public.datasets WHERE dataset_id=?");
 $sql_hash{'check_gene_component'} = $dbh->prepare(
"SELECT gene_component_id FROM gene_component WHERE gene_uname=? AND component_name=? AND min=? AND max=? "
 );
 $sql_hash{'check_transcript_component'} = $dbh->prepare(
"SELECT transcript_component_id FROM transcript_component WHERE transcript_uname=? AND component_name=? AND min=? AND max=? "
 );
 $sql_hash{'check_inference'} =
   $dbh->prepare("SELECT inference_id FROM inference WHERE filepath=?");
 $sql_hash{'get_last_inference_id'} =
   $dbh->prepare("SELECT currval ('inference_id_seq')");
 $sql_hash{'check_transcript_properties'} = $dbh->prepare(
   "SELECT transcript_uname from transcript_properties WHERE transcript_uname=?"
 );

 $sql_hash{'check_inference_transcript'} = $dbh->prepare(
"SELECT inference_transcript_id FROM inference_transcript WHERE transcript_uname=? AND inference_id=? AND known_protein_id=?"
 );
 $sql_hash{'get_last_inference_transcript_id'} =
   $dbh->prepare("SELECT currval ('inference_transcript_id_seq')");

 $sql_hash{'update_db_urlprefix'} = $dbh->prepare(
               "UPDATE db SET urlprefix=? WHERE db_id=? and urlprefix is NULL");

 $sql_hash{'store_gene'} = $dbh->prepare("INSERT INTO gene (uname) VALUES (?)");
 $sql_hash{'store_gene_seq'} = $dbh->prepare(
                "UPDATE gene SET nuc_sequence=?, nuc_checksum=? WHERE uname=?");

 $sql_hash{'store_gene_name_seq'} = $dbh->prepare(
           "INSERT INTO gene (uname,nuc_sequence,nuc_checksum) VALUES (?,?,?)");

 $sql_hash{'store_gene_dbxref'} =
   $dbh->prepare("INSERT INTO gene_dbxref (gene_uname,dbxref_id) VALUES (?,?)");
 $sql_hash{'store_gene_alias'} =
   $dbh->prepare("UPDATE gene SET alias=? WHERE uname=?");

 $sql_hash{'store_transcript'} = $dbh->prepare(
"INSERT INTO transcript (uname,gene_uname,translation_table,cds_start,cds_stop,strand) VALUES (?,?,?,?,?,?)"
 );
 $sql_hash{'store_transcript_dbxref'} = $dbh->prepare(
     "INSERT INTO transcript_dbxref (transcript_uname,dbxref_id) VALUES (?,?)");
 $sql_hash{'store_transcript_alias'} =
   $dbh->prepare("UPDATE transcript SET alias=? WHERE uname=?");

 $sql_hash{'store_gene_component'} = $dbh->prepare(
"INSERT INTO gene_component (gene_uname,name,min,max,strand) VALUES (?,?,?,?,?)"
 );
 $sql_hash{'store_gene_component_dbxref'} = $dbh->prepare(
             "UPDATE gene_component SET dbxref_id=? WHERE gene_component_id=?");

 $sql_hash{'store_transcript_component'} = $dbh->prepare(
"INSERT INTO transcript_component (transcript_uname,name,min,max,strand) VALUES (?,?,?,?,?)"
 );
 $sql_hash{'store_transcript_component_dbxref'} = $dbh->prepare(
   "UPDATE transcript_component SET dbxref_id=? WHERE transcript_component_id=?"
 );

 $sql_hash{'store_inference'} = $dbh->prepare(
"INSERT INTO inference (name,description,filepath,program,programversion,algorithm,timeexecuted,sourcename,sourceversion) VALUES (?,?,?,?,?,?,?,'annotate_me','0.2')"
 );
 $sql_hash{'delete_inference'} =
   $dbh->prepare("DELETE FROM inference where filepath=? CASCADE");
 $sql_hash{'get_known_protein_id'} = $dbh->prepare(
"SELECT uniprot_id from known_proteins.uniprot_id WHERE xref_accession=? AND xref_db=?"
 );

 $sql_hash{'store_inference_transcript'} = $dbh->prepare(
"INSERT INTO inference_transcript (transcript_uname,inference_id,known_protein_id) VALUES (?,?,?)"
 );
 $sql_hash{'store_inference_hit_significance'} = $dbh->prepare(
"UPDATE inference_transcript SET significance=? WHERE inference_transcript_id=?"
 );
 $sql_hash{'store_inference_hit_rawscore'} = $dbh->prepare(
    "UPDATE inference_transcript SET rawscore=? WHERE inference_transcript_id=?"
 );
 $sql_hash{'store_inference_hit_normscore'} = $dbh->prepare(
   "UPDATE inference_transcript SET normscore=? WHERE inference_transcript_id=?"
 );
 $sql_hash{'store_inference_hit_identity'} = $dbh->prepare(
    "UPDATE inference_transcript SET identity=? WHERE inference_transcript_id=?"
 );
 $sql_hash{'store_inference_hit_start'} = $dbh->prepare(
   "UPDATE inference_transcript SET hit_start=? WHERE inference_transcript_id=?"
 );
 $sql_hash{'store_inference_hit_stop'} = $dbh->prepare(
    "UPDATE inference_transcript SET hit_stop=? WHERE inference_transcript_id=?"
 );
 $sql_hash{'store_inference_hit_strand'} = $dbh->prepare(
    "UPDATE inference_transcript SET strand=? WHERE inference_transcript_id=?");

 $sql_hash{'store_metadata'} = $dbh->prepare("INSERT INTO public.metadata (uname) VALUES  (?) ");
 
 $sql_hash{'get_last_metadata_id'} =
   $dbh->prepare("SELECT currval ('public.metadata_metadata_id_seq')");

 $sql_hash{'store_network'} = $dbh->prepare(
   "INSERT INTO network (network_type,description,json,size) VALUES (?,?,?,?)");
 $sql_hash{'get_last_network_id'} =
   $dbh->prepare("SELECT currval ('network_network_id_seq')");

 $sql_hash{'store_transcript_network'} = $dbh->prepare(
   "INSERT INTO transcript_network (transcript_uname,network_id) VALUES (?,?)");

 $sql_hash{'store_metadata_js'} = $dbh-> prepare("INSERT INTO public.metadata_jslib (metadata_id,json) VALUES (?,?)");

 $sql_hash{'check_metadata'} =$dbh-> prepare("SELECT metadata_id from public.metadata WHERE uname=?");

 return \%sql_hash;

}

sub prepare_chado_inference_sqls() {
 my $dbh = shift || die;
 my %sql_hash;
 $sql_hash{'check_feature'} =
   $dbh->prepare("SELECT feature_id from feature WHERE uniquename=?")
   ;    # essential; check or die.
 $sql_hash{'check_library'} =
   $dbh->('(SELECT library_id from library WHERE uniquename=?)');    # or die

 # get database used for inference
 $sql_hash{'get_db_id'} =
   $dbh->prepare("SELECT db_id,urlprefix FROM db WHERE name~*?")
   ; # case insensitive; we want to check if urlprefix is empty; if it is then problem
     # if db_id does not exist
 $sql_hash{'store_db'} = $dbh->prepare(
             "INSERT INTO db (name,description,urlprefix,url) VALUES (?,?,?,?)")
   ;    # we want to make sure all this data is provided by $database_tsv_file
        # if db_id exists
 $sql_hash{'update_db_desc'} = $dbh->prepare(
           "UPDATE db SET description=? WHERE db_id=? AND description is NULL");
 $sql_hash{'update_db_urlprefix'} = $dbh->prepare(
               "UPDATE db SET urlprefix=? WHERE db_id=? and urlprefix is NULL");
 $sql_hash{'update_db_url'} =
   $dbh->prepare("UPDATE db SET url=? WHERE db_id=? AND url is NULL");
 $sql_hash{'check_dbxref'} = $dbh->prepare(
'SELECT dbxref_id FROM dbxref where db_id=(SELECT db_id FROM db WHERE name~*?) AND accession=?'
 );     #case insensitive
 $sql_hash{'store_hit_dbxref'} = $dbh->prepare(
'INSERT INTO dbxref (db_id,accession) VALUES ((SELECT db_id FROM db WHERE name~*?),?)'
   )
   ; # we don't litter database with potentially outdated descriptions. always get them with urlprefix
 $sql_hash{'store_inference'} = $dbh->prepare(
"INSERT INTO inference (name,description,filepath,program,programversion,algorithm,timeexecuted,sourcename,sourceversion) VALUES (?,?,?,?,?,?,?,'annotate_me','0.2')"
 );
 $sql_hash{'delete_inference'} =
   $dbh->prepare("DELETE FROM inference where filepath=? CASCADE");
 $sql_hash{'check_inference'} =
   $dbh->prepare("SELECT inference_id FROM inference WHERE filepath=?");
 $sql_hash{'store_inference_database'} = $dbh->prepare(
"INSERT INTO inferenceprop (inference_id,type_id,value) VALUES (?,(SELECT cvterm_id FROM cvterm WHERE name='contains' AND cv_id=(SELECT cv_id from cv where name='relationship') ),?) "
 );
 $sql_hash{'check_inference_hit'} = $dbh->prepare(
"SELECT inferencefeature_id from inferencefeature where inference_id=? AND feature_id=? AND dbxref_id=?"
 );

#i'm preparing the following for the sake of completeness but probably we will not use any of them as i'd rather do a copy statement.
#COPY inference FROM 'filename'
 $sql_hash{'store_inference_hit'} = $dbh->prepare(
"INSERT INTO infererencefeature (inference_id,feature_id,dbxref_id) VALUES (?,?,?) "
 );    #required
       #optional:
 $sql_hash{'store_inference_hit_significance'} = $dbh->prepare(
      "UPDATE inferencefeature SET significance=? WHERE inferencefeature_id=?");
 $sql_hash{'store_inference_hit_rawscore'} = $dbh->prepare(
          "UPDATE inferencefeature SET rawscore=? WHERE inferencefeature_id=?");
 $sql_hash{'store_inference_hit_normscore'} = $dbh->prepare(
         "UPDATE inferencefeature SET normscore=? WHERE inferencefeature_id=?");
 $sql_hash{'store_inference_hit_identity'} = $dbh->prepare(
          "UPDATE inferencefeature SET identity=? WHERE inferencefeature_id=?");
 $sql_hash{'store_inference_hit_fmin'} = $dbh->prepare(
              "UPDATE inferencefeature SET fmin=? WHERE inferencefeature_id=?");
 $sql_hash{'store_inference_hit_fmax'} = $dbh->prepare(
              "UPDATE inferencefeature SET fmax=? WHERE inferencefeature_id=?");
 $sql_hash{'store_inference_hit_strand'} = $dbh->prepare(
            "UPDATE inferencefeature SET strand=? WHERE inferencefeature_id=?");
 $sql_hash{'store_additional_inference_hit'} = $dbh->prepare(
'INSERT INTO inferencefeature_dbxref (inferencefeature_id,dbxref_id) VALUES (?,?)'
 );
 $sql_hash{'check_link_feature_to_library'} = $dbh->prepare(
'SELECT library_feature_id FROM library_feature WHERE feature_id=? AND library_id=?'
 );
 $sql_hash{'link_feature_to_library'} =
   $dbh->prepare('INSERT INTO library_feature (feature_id,library_id)');
   
   
   
 return \%sql_hash;
}

sub finish_sqls() {
 foreach ( keys %$sql_hash_ref ) {
  $sql_hash_ref->{$_}->finish();
 }
}

sub store_chado_genes() {
 my $dbh_store    = shift;
 my $protein_file = shift;
 my $phys_file    = &calculate_protein_properties($protein_file);
}

sub store_native_genes() {
 my $dbh = shift;

# $contig_fasta_file $orf_gff_file $genome_gff_file $protein_fasta_file $translation_table_number
 my ( %orf_gff_data, $first_transcript_uname, $number_genes );
 open( GFF, $orf_gff_file ) || die;
 while ( my $ln = <GFF> ) {
  next unless $ln =~ /\tCDS\t/;
  $number_genes++;
  chomp($ln);
  my @data = split( "\t", $ln );

  $ln =~ /ID=([^;]+);?/
    || die "Can't find an ID in the GFF $orf_gff_file for:" . $ln;
  my $transcript_uname = $1 || die $ln;

  my $gene_uname;
  if ($genome_gff_file) {
   $ln =~ /Parent=([^;]+);?/
     || die "Can't find a Parent in the GFF $orf_gff_file for:" . $ln;
   $gene_uname = $1;
  }
  else {
   $gene_uname = $data[0];
  }

  my %d = (
            'transcript_uname' => $transcript_uname,
            'start'            => $data[3],
            'stop'             => $data[4],
            'strand'           => $data[6]             # +,- or .
  );
  push( @{ $orf_gff_data{$gene_uname} }, \%d );
  $first_transcript_uname = $transcript_uname;
 }
 close GFF;

 my $contig_obj = new Fasta_reader($contig_fasta_file);

 $sql_hash_ref->{'check_number_gene'}->execute();
 my $stored_genes_res =
   $sql_hash_ref->{'check_number_gene'}->fetchrow_arrayref();
 my $number_stored_genes = $stored_genes_res->[0];
 undef($stored_genes_res);
 if ( $number_stored_genes && $number_stored_genes > 0 ) {
  $sql_hash_ref->{'check_gene_all'}->execute();
  while ( my $res = $sql_hash_ref->{'check_gene_all'}->fetchrow_arrayref ) {
   $stored_genes_res->{ $res->[0] } = 1;
  }
 }
 print "Processing $number_genes coding mRNA sequences from "
   . scalar( keys %orf_gff_data )
   . " loci and any non-coding...\n";
 print "$number_stored_genes had been previously stored.\n";
 $dbh->{"PrintError"} = 0;
 $dbh->{"RaiseError"} = 1;
 $dbh->begin_work;
 my $counter = 0;
 $| = 1;

 while ( my $seq_obj = $contig_obj->next() ) {
  $counter++;
  if ( $counter % 1000 == 0 ) {
   print " $counter reference contigs loaded\t\t\r";
   die if $dbh->{"ErrCount"};
   $dbh->commit;
   $dbh->begin_work;
  }
  my $gene_uname = $seq_obj->get_accession();

  next if $stored_genes_res && $stored_genes_res->{$gene_uname};

  my $seq = $seq_obj->get_sequence();

  #DEBUG print "Adding gene $gene_uname\n";
  $sql_hash_ref->{'store_gene_name_seq'}
    ->execute( $gene_uname, $seq, md5_hex($seq) );

# if there is a transcript for this 'gene' (it may actually be a contig of UTR/non-coding)
  foreach my $transcript_data ( @{ $orf_gff_data{$gene_uname} } ) {

   #DEBUG     print "Adding mrna ".$transcript_data->{'transcript_uname'}."\n";

   $sql_hash_ref->{'store_transcript'}->execute(
           $transcript_data->{'transcript_uname'}, $gene_uname,
           $translation_table_number,              $transcript_data->{'start'},
           $transcript_data->{'stop'},             $transcript_data->{'strand'},
   );
  }

 }
 print " $counter\t\t\r";
 die if $dbh->{"ErrCount"};
 $dbh->commit;
 undef($stored_genes_res);
 print "\n";
 $| = 0;
 $sql_hash_ref->{'check_transcript_properties'}
   ->execute($first_transcript_uname);
 my $res = $sql_hash_ref->{'check_transcript_properties'}->fetchrow_arrayref;

 if ( !$res || !$res->[0] ) {
  my $phys_file = &calculate_protein_properties($protein_fasta_file);
  $dbh->begin_work;
  $dbh->do(
"COPY transcript_properties (transcript_uname,udef_residues,min_molweight,max_molweight,pos_aa,negative_aa,iso_pot,charge_ph5,charge_ph7,charge_ph9,pep_checksum) FROM STDIN"
  );
  &do_copy_stdin( $phys_file, $dbh );
  die if $dbh->{"ErrCount"};
  $dbh->commit;
 }
 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;
}

sub do_copy_stdin() {
 my $file = shift;
 my $dbh  = shift;
 open( TMP, $file );
 $dbh->pg_putcopydata($_) while (<TMP>);
 close TMP;
 $dbh->pg_putcopyend();
}

sub add_linkout() {

#  UniProt    http://www.uniprot.org/uniprot      The mission of UniProt is to provide the scientific community with a comprehensive, high-quality and freely accessible resource of protein sequence and functional information.
 my $dbh        = shift || die;
 my $conf_file  = shift;
 my $dataset_id = shift;
 my $linkout_sql_prepared =
   $dataset_id
   ? $dbh->prepare(
"INSERT INTO public.linkout (type,name,urlprefix,description,dataset_id) VALUES (?,?,?,?,$dataset_id)"
   )
   : $dbh->prepare(
"INSERT INTO public.linkout (type,name,urlprefix,description) VALUES (?,?,?,?)"
   );
 my $linkout_sql_check =
   $dataset_id
   ? $dbh->prepare(
        "SELECT linkout_id from public.linkout WHERE name=? AND dataset_id = ?")
   : $dbh->prepare("SELECT linkout_id from public.linkout WHERE name=?");

 open( IN, $conf_file );

 while ( my $ln = <IN> ) {
  next if $ln =~ /^#/;
  chomp($ln);
  my @data = split( "\t", $ln );
  next unless $data[2];
  for ( my $i = 0 ; $i < @data ; $i++ ) {
   $data[$i] =~ s/^\s+//;
   $data[$i] =~ s/\s+$//;
   die "Possible error in tab-delimited file. Entry $i is empty: "
     . $data[$i]
     . " in:\n$ln\n"
     if !$data[$i] || $data[$i] =~ /^\s*$/;
  }
  unless ( $accepted_linkout_types{ $data[0] } ) {
   warn "Linkout type "
     . $data[0]
     . " not supported, only CDS, gene and hit! Skipping...\n";
   next;
  }
  if ( !$dataset_id ) {
   $linkout_sql_check->execute( $data[1] );
  }
  else {
   $linkout_sql_check->execute( $data[1], $dataset_id );
  }
  my $result = $linkout_sql_check->fetchrow_arrayref();
  next if ( $result && $result->[0] );

  $data[2] = 'No description' unless $data[2];
  $linkout_sql_prepared->execute( $data[0], $data[1], $data[2], $data[3] );
 }
 close IN;

}

sub create_populate_annotation_database() {
 my $dbh_create = &connect_db(
                               $annot_dbname, $annot_host,
                               $annot_dbport, $annot_username,
                               $annot_password
 );
 die "Cannot connect to annotation database...\n" unless $dbh_create;
 $dbh_create->do('SET search_path TO  known_proteins');
 &create_new_annotation_db($dbh_create)   if $create_annot_database;
 &prepare_uniprot_id_mapping($dbh_create) if $do_uniprot;
 &prepare_ec($dbh_create)                 if $do_ec;
 &prepare_go($dbh_create)                 if $do_go;
 &prepare_eggnog($dbh_create)             if $do_eggnog;
 &prepare_kegg($dbh_create)               if $do_kegg;
 &disconnect_db($dbh_create);

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

sub store_annotation_of_proteins() {

# where we store annotations, different flavours (chado/native) available but 'native' is the best one.
 my $dbh_store;
 warn "File $protein_fasta_file cannot be found\n"
   if $protein_fasta_file && !-s $protein_fasta_file;
 if ($do_chado) {
  ### TODO
  $dbh_store = &connect_db( $chado_dbname,   $chado_dbhost, $chado_dbport,
                            $chado_username, $chado_password );
  &create_chado_inference_tables($dbh_store);

  #making these things global
  $sql_hash_ref = &prepare_chado_inference_sqls($dbh_store);

  if ($protein_fasta_file) {
   print "Processing $protein_fasta_file protein file\n";
   &store_chado_genes($protein_fasta_file);
  }
 }
 else {
  $dbh_store = &connect_db( $annot_dbname,   $annot_host, $annot_dbport,
                            $annot_username, $annot_password );
  my $dataset_id = &create_native_inference_tables($dbh_store);

  #making these things global
  $sql_hash_ref = &prepare_native_inference_sqls( $dbh_store, $dataset_id );

  if ($protein_fasta_file) {
   print "Processing $protein_fasta_file protein file\n";
   &store_native_genes($dbh_store);
  }

  &add_linkout( $dbh_store, $linkout_conf, $dataset_id ) if $linkout_conf;
 }
 $protein_fasta_file = '' if !$protein_fasta_file; # will grab everything!
 
 if ($do_protein_blasts) {
  print "Looking for BLAST files that match: $protein_fasta_file*blast*\n";
  my @files = glob("$protein_fasta_file*blast*");
  &process_protein_blast( $dbh_store, \@files ) if @files;
 }
 if ($do_protein_hhr) {
  print "Looking for hhblits HHR files that match: $protein_fasta_file*.hhr\n";
  my @files = glob("$protein_fasta_file*.hhr");
  &process_protein_hhr( $dbh_store, \@files ) if @files;
 }
 if ($do_protein_networks) {
  print "Looking for network files that match: $protein_fasta_file*.network\n";
  my @files = glob("$protein_fasta_file*.network");
  &process_protein_network( $dbh_store, \@files ) if @files;
 }
 if ($do_protein_ipr) {
  print
    "Looking for InterProScan files that match: $protein_fasta_file*ipr*xml\n";
  my @files = glob("$protein_fasta_file*ipr*xml");
  &process_protein_ipr( $dbh_store, \@files ) if @files;
 }

 &disconnect_db($dbh_store);

}

sub process_cmd {
 my ($cmd) = @_;
 print "CMD: $cmd\n";
 my $ret = system($cmd);
 if ( $ret && $ret != 256 ) {
  die "Error, cmd died with ret $ret\n";
 }
 return $ret;
}

sub process_for_genome_gff() {
 $protein_fasta_file = $genome_gff_file . '.proteins.fasta';
 $contig_fasta_file  = $genome_gff_file . '.mRNA.fasta';
 $orf_gff_file       = $genome_gff_file . '.mRNA.gff3';
 if ( -s $orf_gff_file ) {
  return ( $protein_fasta_file, $contig_fasta_file, $orf_gff_file );
 }
 print "Preparing genome $genome_fasta_file\n";
 my $fasta_reader = new Fasta_reader($genome_fasta_file);
 my %genome       = $fasta_reader->retrieve_all_seqs_hash();
 die "No genome data!" unless %genome && scalar( keys %genome ) >= 1;
 my $genome_ref = \%genome;

 open( PROTOUT, ">$protein_fasta_file" );
 open( CDNAOUT, ">$contig_fasta_file" );
 open( GFFOUT,  ">$orf_gff_file" );
 my $gene_obj_indexer_href = {};

## associate gene identifiers with contig id's.
 my $scaffold_to_gene_list_href =
   &GFF3_utils::index_GFF3_gene_objs( $genome_gff_file,
                                      $gene_obj_indexer_href );
 print "Processing...\n";
 foreach my $reference_id ( sort keys %$scaffold_to_gene_list_href ) {

  my $genome_seq = $genome_ref->{$reference_id}
    or die "Error, cannot find sequence for $reference_id"
    ;    #cdbyank_linear($reference_id, $fasta_db);

  my @gene_ids = @{ $scaffold_to_gene_list_href->{$reference_id} };

  foreach my $gene_id (@gene_ids) {
   my $gene_obj_ref = $gene_obj_indexer_href->{$gene_id};

   my %params;

   $gene_obj_ref->create_all_sequence_types( \$genome_seq, %params );

   my $counter = 0;
   $gene_obj_ref->trivial_refinement();
   foreach
     my $isoform ( $gene_obj_ref, $gene_obj_ref->get_additional_isoforms() )
   {

    next unless $isoform->has_CDS();
    $counter++;

    my $orientation = $isoform->get_orientation();
    my ( $model_lend, $model_rend ) =
      sort { $a <=> $b } $isoform->get_model_span();
    my ( $gene_lend, $gene_rend ) =
      sort { $a <=> $b } $isoform->get_gene_span();

    my $isoform_id = $isoform->{Model_feat_name};
    my $com_name = $isoform->{com_name} || "";
    $com_name = "" if ( $com_name eq $isoform_id );

    #eval {$isoform->set_CDS_phases (\$genome_seq);};

    my $cDNA_seq = $isoform->get_cDNA_sequence();
    my $prot_seq = $isoform->get_protein_sequence();
    my $cds_seq  = $isoform->get_CDS_sequence();
    next unless $cDNA_seq && $prot_seq && $cds_seq;

    my $cds_length  = length($cds_seq);
    my $cDNA_length = length($cDNA_seq);

    my ( $iso_start, $iso_end ) = ( int(0), int(0) );
    if ( $cds_length != $cDNA_length ) {
     $iso_start = index( $cDNA_seq, $cds_seq );
     if ( $iso_start == -1 ) {
      warn
"Cannot find the coding sequence of model $isoform_id will have to skip!\n";

      #     warn $cDNA_seq;
      #     warn $cds_seq;
      #     warn Dumper $isoform;
      next;
     }
     $iso_end = $iso_start + $cds_length;    # 1base co-ordinate
     $iso_start++;                           # 1base co-ordinate
    }
    else {
     $iso_start = 1;
     $iso_end   = $isoform->{CDS_sequence_length};
    }

    # not currently printing UTR...
    print GFFOUT
      "$gene_id\tPrediction\tgene\t1\t$cDNA_length\t.\t+\t.\tID=$gene_id\n"
      . "$gene_id\tPrediction\tmRNA\t1\t$cDNA_length\t.\t+\t.\tID=$isoform_id;Parent=$gene_id\n"
      . "$gene_id\tPrediction\texon\t1\t$cDNA_length\t.\t+\t.\tID=$isoform_id.exon;Parent=$isoform_id\n"
      . "$gene_id\tPrediction\tCDS\t$iso_start\t$iso_end\t.\t+\t.\tID=cds.$isoform_id;Parent=$isoform_id\n"
      . "\n";

    #FASTA format
    $prot_seq =~ s/(\S{60})/$1\n/g;
    chomp $prot_seq;
    $cDNA_seq =~ s/(\S{60})/$1\n/g;
    chomp $cDNA_seq;

    print PROTOUT
">cds.$isoform_id $com_name $gene_id $reference_id:$model_lend-$model_rend($orientation)\n$prot_seq\n";
    print CDNAOUT
">$isoform_id $com_name $gene_id CDS_start:$iso_start CDS_end:$iso_end $reference_id:$model_lend-$model_rend($orientation)\n$cDNA_seq\n";

   }
  }
 }
 close PROTOUT;
 close CDNAOUT;
 close GFFOUT;
 return ( $protein_fasta_file, $contig_fasta_file, $orf_gff_file );
}

sub get_dataset_connection() {
 my $dbhandle;
 if ($do_chado) {
  $dbhandle = &connect_db( $chado_dbname,   $chado_dbhost, $chado_dbport,
                           $chado_username, $chado_password );
 }
 else {
  $dbhandle = &connect_db( $annot_dbname,   $annot_host, $annot_dbport,
                           $annot_username, $annot_password );
 }
 return $dbhandle;
}

sub check_required_files() {
 my $death;
 foreach my $_ (@_) {
  next unless $_;
  unless ( -s $_ ) {
   warn $_ . " file does not exist.\n";
   $death++;
  }

 }
 die $death . " files not found.\n" if $death;
}

sub create_undirected_unweighted_network() {

=cut

{
  'nodes': [
    {
      'id': 'Node1',
      'color': 'rgb(255,0,0)',
      'shape': 'circle',
      'size': 1
    },
    {
      'id': 'Node2',
      'color': 'rgb(0,255,0)',
      'shape': 'square',
      'size': 1.5
    },
    {
      'id': 'Node3',
      'color': 'rgb(0,0,255)',
      'shape': 'triangle',
      'size': 2
    }
  ],
  'edges': [
    {
      'id1': 'Node1',
      'id2': 'Node2',
      'color': 'rgb(125,125,0)',
      'type': 'line'
    },
    {
      'id1': 'Node1',
      'id2': 'Node3',
      'color': 'rgb(0,125,125)',
      'type': 'squareHeadLine'
    },
    {
      'id1': 'Node2',
      'id2': 'Node3',
      'color': 'rgb(125,0,125)',
      'type': 'arrowHeadLine'
    }
  ]
}

The (nodes) property contains as it name indicates the nodes in the network. Each node must have a unique (id) property. Also, (color), (shape), (rotate), (pattern), (outline), (outlineWidth) and either (size) or (width) and (height) can be specified for each node. The (color) property is specified in an rgb format compatible with the <canvas> element. The (shape) must be one of the shapes in this library (see the options section). The rotation for the shape must be expressed in degrees. The (pattern) is either 'closed' or 'open'. The (size) is a multiplier and not the actual size of the node, for example, to make a node twice as big, the size should be set to 2. If you need more control over the shape then you need to specify (width) and (height). The (edges) property as you can imagine, contains the info for the edges in the network. Each edge must contain an (id1) and an (id2) properties which must match two nodes in the network. Similarly, you can specify the (color), the (width), which is the actual width of the line, the (cap) which could be 'butt', 'round' or 'square' and the line (type) which should be one of the types in this library (see the options section). The property (legend) is an object that contains the information for the nodes and edges and additional text.

Each node may have one parent under the property 'parentNode' and it has to match a valid node id. This feature is useful if you want to group nodes together. You can assign a name and / or a label to each node. The order in which the text will be displayed is label or name or id.

=cut

 my $members_ref = shift;
 my %json;
 for ( my $i = 0 ; $i < (@$members_ref) ; $i++ ) {
  my $member1 = $members_ref->[$i];
  my %node_hash = (
                    'id'    => $member1
#                    'name'  => $member1,
#                    'group' => 1
  );
  push( @{ $json{'nodes'} }, \%node_hash );
  for ( my $k = $i + 1 ; $i < (@$members_ref) ; $k++ ) {
   my $member2 = $members_ref->[$k] || last;
   my %edge_hash = (
                     'id1'   => $member1,
                     'id2'   => $member2
#                     'value' => 1
   );
   push( @{ $json{'edges'} }, \%edge_hash );
  }
 }

 return encode_json( \%json );
}
