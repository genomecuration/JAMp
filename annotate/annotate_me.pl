#!/usr/bin/env perl
#VERSION 0.6 May 2014

=pod

=begin comment

=head1 Developer Notes

Added authorization

=head2 TODO

NETWORK colour with black background
support Graph::GML 
come up with an example where there is a valid graph network

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

=end comment

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
     -annot_user   :s   => Username for database connection, optional. This is the user with full priviliges
     -annot_pass   :s   => Password for database connection, optional
     -annot_read   :s   => Optionally, username who will be given SELECT permissions in the whole database 

General options

     -blast_format :s   => Format of BLAST report (BioPerl: 'blast', 'blastxml' etc)
     -help              => This menu.

Creating a new annotation database

     -create            => Create the annotation database using known protein annotations. Takes a long time, so better download it.
     -uniprot           => Load uniprot terms. Caution this will create a 20-25 Gb table which is currently not needed by JAMp
     -go                => Load Gene Ontology terms
     -inference         => Associate inferrences by electronic similarity with the relevant GO terms 
     -ec                => Load Enzyme Classification
     -eggnog            => Load EggNog (gene clusters for eukaryotes)
     -databases :s      => TSV file with cross-reference database descriptions
             
             
Populating an annotation db with inferred gene annotations. We support Trinity and Transdecoder.

     -contigs      :s    => Contigs in FASTA, e.g. Trinity.fasta
     -transdecoder :s    => Transdecoder base file (i.e has .mRNA, .pep and .gff3 files)
     -translation  :i    => Translation table number. Defaults to 1 (universal)
     OR
     -gff_genome   :s    => GFF3 file linking genes to Genome (e.g. official gene predictions, alignments via GMAP, exonerate or prepare_golden_genes_for_predictors.pl)
     -genome_fasta :s    => The FASTA file for the Genome
     OR
     -delete       :s      => Delete dataset (provide an ID or name)
     
     The program then searches for the file name and if 
     * it finds [filename]*blast*, it considers it a BLAST
     * it finds [filename]*hhr, it considers it a HHblits output
     * it finds [filename]*ipr*, it considers it an InterProScan output
     
Analyses available:

     -doblast     => Process BLAST files
     -dohhr       => Process HHblits files 
     -doipr       => Process InterProScan files
     -donetwork   => Process .network files as tab: subject, query, weight (optionally)

Network:

    * -network_name        => Name of network
    * -network_type        => Type of network (MCL, CDHIT etc). Decides how to parse the network file
      -network_description => Describe what kind of network is this (once per type)
      -network_directed    => Network: The edjes are directed (column1 to column2); 
      -nojson              => Network: Do not store a JSON for drawing network relationships (e.g. if it is a clustering rather than a directed network)

Expression:

    * -expression_directory => Base directory of the DEW output


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

=head2 OVERVIEW

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

 gene JBrowse   http://mygenome.org/jbrowse/?loc=   This is a description of the JBrowse of my genome.

Make sure that any URL options are before the key required for the query (loc in this case).
For example, JBrowse is highly configurable and I highly recommend tracks=DNA at least (Annotations is from WebApollo), for example:

 gene JBrowse_mygenome   http://mygenome.org/jbrowse/?tracks=DNA%2CAnnotations&loc=   This is a description of the JBrowse of my genome.

Once your file is created, provide it to the program with the option -linkout_conf. If you'd like the linkout to be specific to a dataset, also
provide the relevant -dataset_uname. If you don't provide -dataset_uname then the linkout will be available to all datasets.

The unique name needs to be unique within a name-dataset combination, so you can have a different 'jbrowse' link for each dataset.


=head1 AUTHORS

 Alexie Papanicolaou

        CSIRO Ecosystem Sciences
        alexie@butterflybase.org

=head1 DISCLAIMER & LICENSE

Copyright 2012-2014 the Commonwealth Scientific and Industrial Research Organization. 
See LICENSE file for license info
It is provided "as is" without warranty of any kind.

=head1 BUGS & LIMITATIONS

No bugs known so far. 

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
use DBD::Pg qw(:pg_types);
use XML::LibXML::Reader;
use Digest::MD5 qw(md5_hex);
use JSON;
use URI::Escape;

use FindBin qw($RealBin);
$ENV{'PATH'} .= ":$RealBin:$RealBin/../3rd_party/bin";
use lib ("$FindBin::RealBin/../PerlLib");
use Gene_obj;
use Fasta_reader;
use GFF3_utils;
use Carp;
use Nuc_translator;

use Data::Dumper;
my $cwd = getcwd;

# bioperl
use Bio::SeqIO;
use Bio::Tools::pICalculator;
use Bio::Tools::SeqStats;

$| = 1;

our $sql_hash_ref;
my (
     $dataset_type,        $dataset_library, $dataset_species,
     $dataset_description, $dataset_uname,   $linkout_conf,
     $directed_network,    $warnings_msgs
);
my ( $contig_fasta_file, $genome_gff_file, $transdecoder, $genome_fasta_file );
my $max_network_size   = 250;
my $authorization_name = 'demo';
my ( $annot_dbname, $annot_host, $annot_dbport, $annot_readuser );
my ( $chado_dbname, $chado_dbhost, $chado_dbport );
my ( $annot_username, $annot_password ) = ( $ENV{'USER'}, undef );
my ( $chado_username, $chado_password ) = ( $ENV{'USER'}, undef );
my ( @do_protein_hhr, @do_protein_blasts, @do_protein_networks,
     @do_protein_ipr );
my (
     $create_annot_database, $do_uniprot_renaming, $do_go,
     $do_ec,                 $do_kegg,             $do_eggnog,
     $drop_annot_database,   $debug,               $database_tsv_file,
     $do_chado,              $do_inferences,       $dohelp,
     $do_slow,               $delete_dataset,      $nojson,
     $expression_dew_outdir
);

my ($extra_expression_column_name,$extra_expression_column_file);
my $extra_expression_column_type = 'real';

my ( $network_description, $network_type, $network_name );

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
 'annot_read:s'   => \$annot_readuser,
 'annot_pass:s'   => \$annot_password,

 #chado database
 'chado_dbname:s' => \$chado_dbname,
 'chado_host:s'   => \$chado_dbhost,
 'chado_port:i'   => \$chado_dbport,
 'chado_user:s'   => \$chado_username,
 'chado_pass:s'   => \$chado_password,

 #annotdb creation
 'inference' => \$do_inferences,
 'uniprot'   => \$do_uniprot_renaming,
 'go'        => \$do_go,
 'ec'        => \$do_ec,
 'eggnog'    => \$do_eggnog,
 'kegg'      => \$do_kegg,
 'create'    => \$create_annot_database,
 'drop'      => \$drop_annot_database,

 #	new protein annotation
 'contigs:s'      => \$contig_fasta_file,
 'transdecoder:s' => \$transdecoder,
 'gff_genome:s'   => \$genome_gff_file,
 'genome_fasta:s' => \$genome_fasta_file,
 'translation:i'  => \$translation_table_number,
 'delete:s'       => \$delete_dataset,

 'doblast:s{,}'   => \@do_protein_blasts,
 'dohhr:s{,}'     => \@do_protein_hhr,
 'doipr:s{,}'     => \@do_protein_ipr,
 'donetwork:s{,}' => \@do_protein_networks,

 # not used / implemented
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

 #network
 'network_description:s' => \$network_description,
 'network_name:s'        => \$network_name,
 'network_type:s'        => \$network_type,
 'network_directed'      => \$directed_network,
 'nojson'                => \$nojson,

 #expression
 'expression_directory:s' => \$expression_dew_outdir,
 'extra_expression_name:s' => \$extra_expression_column_name,
 'extra_expression_type:s' => \$extra_expression_column_type,
 'extra_expression_file:s' => \$extra_expression_column_file,


 # dataset metadata
 'authorization|dataset_authority:s' => \$authorization_name,
 'dataset_uname:s'                   => \$dataset_uname,
 'dataset_description:s'             => \$dataset_description,
 'dataset_species:s'                 => \$dataset_species,
 'dataset_library:s'                 => \$dataset_library,
 'dataset_type:s'                    => \$dataset_type,
 'linkout_conf:s'                    => \$linkout_conf

);

die
"Cannot provide both a genome-guided annotation and Transdecoder at the same time\n"
  if $genome_gff_file && $transdecoder;

#globals
my ( $cdna_fasta_file, $cds_gff_file, $protein_fasta_file );

if ($transdecoder) {
 $cdna_fasta_file    = $transdecoder . '.mRNA';
 $cds_gff_file       = $transdecoder . '.gff3';
 $protein_fasta_file = $transdecoder . '.pep';
 &check_required_files( $protein_fasta_file, $cds_gff_file, $cdna_fasta_file );
}
elsif ($genome_gff_file) {
 &check_required_files( $genome_gff_file, $genome_fasta_file );
}

pod2usage "No annotation database name\n" unless $annot_dbname;
pod2usage "A required file is missing\n"
  unless $dohelp
   || $do_uniprot_renaming
   || $do_go
   || $do_ec
   || $do_eggnog
   || $do_kegg
   || ( $transdecoder || $genome_gff_file )
   || $delete_dataset
   || $linkout_conf
   || scalar(@do_protein_blasts) > 0
   || scalar(@do_protein_hhr) > 0
   || scalar(@do_protein_ipr) > 0
   || scalar(@do_protein_networks) > 0
   || $expression_dew_outdir;

# anyother files
&check_required_files(
                       $linkout_conf,   @do_protein_hhr,
                       @do_protein_ipr, @do_protein_blasts,
                       @do_protein_networks
);

if ($delete_dataset) {
 my $dbh = &get_dataset_connection();
 &delete_dataset( $dbh, $delete_dataset );
 exit;
}

$blast_format = lc($blast_format);

die "BLAST format can only be 'blast' or 'blastxml'\n"
  unless $blast_format eq 'blast' || $blast_format eq 'blastxml';

# optionally we can create a database.
&create_populate_annotation_database()
  if (    $create_annot_database
       || $do_uniprot_renaming
       || $do_ec
       || $do_eggnog
       || $do_go
       || $do_kegg );

# if we have a genome, then we can prepare the genome and protein files
( $protein_fasta_file, $contig_fasta_file, $cdna_fasta_file, $cds_gff_file ) =
  &process_for_genome_gff()
  if (    $genome_gff_file
       && $genome_fasta_file
       && -s $genome_gff_file
       && -s $genome_fasta_file );

# if we have files, we can store annotations by inference
if (    ( $protein_fasta_file && -s $protein_fasta_file )
     || scalar(@do_protein_blasts) > 0
     || scalar(@do_protein_hhr) > 0
     || scalar(@do_protein_ipr) > 0
     || scalar(@do_protein_networks) > 0
     || $expression_dew_outdir )
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
  die "Dataset name must not have the ^ character\n" if $dataset_uname =~ /\^/;
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
'CREATE TABLE linkout (linkout_id serial primary key, name varchar, description text, dataset_id int REFERENCES public.datasets(dataset_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, type varchar, urlprefix varchar )'
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

 $dbh->do( '
 CREATE TABLE metadata_jslib (
  metadata_id integer primary key REFERENCES public.metadata(metadata_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
  json text NOT NULL
 );
' );

 ################################# known proteins ################################
 $dbh->do("SET SEARCH_PATH='known_proteins");
 $dbh->do(
'CREATE TABLE go (go_id integer primary key,name varchar,class char(1),is_synomym boolean)'
 );
 $dbh->do(
'CREATE TABLE go_assoc (go_assoc_uid serial primary key, uniprot_id varchar, go_id integer REFERENCES go(go_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, '
    . 'reference_db varchar, reference_uid varchar, evidence varchar,annotator varchar, date_annotated date)'
 );
 $dbh->do(
'CREATE TABLE go_slim (go_slim_uid serial primary key, go_id integer REFERENCES go(go_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, slim_go_id integer REFERENCES go(go_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED)'
 );

 $dbh->do(
'CREATE TABLE go_synonym (go_id integer REFERENCES go(go_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, go_synonym integer REFERENCES go(go_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED)'
 );

 $dbh->do(
       'CREATE TABLE enzyme (ec_id varchar primary key, primary_name varchar)');
 $dbh->do(
'CREATE TABLE enzyme_assoc (ec_assoc_uid serial primary key, ec_id varchar REFERENCES enzyme(ec_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, uniprot_id varchar)'
 );
 $dbh->do(
'CREATE TABLE enzyme_description (ec_description_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, description text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_names (ec_names_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, alias text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_catalytic_activity (ec_catalytic_activity_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, catalytic_activity text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_cofactor (ec_cofactor_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, cofactor text)'
 );
 $dbh->do(
'CREATE TABLE enzyme_comments (ec_comment_uid serial primary key,ec_id varchar REFERENCES enzyme(ec_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, comment text)'
 );
 $dbh->do(
        'CREATE TABLE eggnog (eggnog_id varchar primary key,description text)');
 $dbh->do('CREATE INDEX eggnog_idx1 ON known_proteins.eggnog(description)');

 $dbh->do(
'CREATE TABLE eggnog_categories (category char(1) primary key,grouping text,description text)'
 );
 $dbh->do(
'CREATE TABLE eggnog_category (eggnog_id varchar REFERENCES eggnog(eggnog_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,category char(1) REFERENCES eggnog_categories(category) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED )'
 );
 $dbh->do(
'CREATE TABLE eggnog_assoc (eggnog_assoc_uid serial primary key,eggnog_id varchar REFERENCES eggnog(eggnog_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,uniprot_id varchar)'
 );
 $dbh->do(
'CREATE TABLE uniprot_assoc (uniprot_id varchar,xref_db varchar,xref_accession varchar)'
 );
 $dbh->do('CREATE TABLE ko (ko_id varchar primary key, description text)');
 $dbh->do(
  'CREATE TABLE kegg_pathway (pathway_id varchar primary key, description text)'
 );
 $dbh->do(
'CREATE TABLE ko_names (ko_id varchar REFERENCES ko(ko_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, name text)'
 );
 $dbh->do(
'CREATE TABLE ko_kegg_pathway (ko_id varchar REFERENCES ko(ko_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, pathway_id varchar references kegg_pathway(pathway_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED)'
 );
 $dbh->do(
'CREATE TABLE kegg_pathway_assoc (kegg_pathway_assoc_uid serial primary key, pathway_id varchar REFERENCES kegg_pathway(pathway_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,uniprot_id varchar)'
 );
 $dbh->do(
'CREATE TABLE ko_assoc (ko_assoc_uid serial primary key, ko_id varchar REFERENCES ko(ko_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,uniprot_id varchar)'
 );
 $dbh->do("SET SEARCH_PATH TO DEFAULT");
 die if $dbh->{"ErrCount"};
 $dbh->commit;
 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;
}

=pod

=begin comment

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

=begin comment

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
=gene (id, uname, alias, nuc_sequence, cds_sequence, protein_seq,dbxref)


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

# gene or trinity contig. this can have 0 or more transcripts. in case of gene (i.e from genome),
# this includes introns.
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

 #transcript
 $dbh->do( '
  CREATE TABLE transcript (
    uname varchar UNIQUE primary key, 
    alias varchar,
    nuc_sequence varchar,
    nuc_checksum varchar
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
 CREATE TABLE transcript_gene (
    transcript_gene_id serial primary key,
    transcript_uname varchar NOT NULL REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    gene_uname varchar REFERENCES gene(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    start integer default 1  NOT NULL, 
    stop integer default 1  NOT NULL, 
    strand char  NOT NULL
  );
  ' );

 # each transcript is in one gene
 $dbh->do(
'ALTER TABLE ONLY transcript_gene ADD CONSTRAINT transcript_gene_c1 UNIQUE (transcript_uname, gene_uname)'
 );
 $dbh->do(
'CREATE UNIQUE INDEX transcript_gene_uidx1 ON transcript_gene(transcript_uname)'
 );

# # optionally #5'/3' of transcript
# $dbh->do( '
#  CREATE TABLE transcript_genomeloc (
#    transcript_genome_id serial primary key,
#    transcript_uname varchar NOT NULL REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
#    genome_name_version varchar  NOT NULL,
#    parent_feature_uname varchar  NOT NULL,
#    start integer default 1  NOT NULL,
#    stop integer default 1  NOT NULL,
#    strand char  NOT NULL
#  );
#  ' );
#
# # each transcript is in one location on a genome version
# $dbh->do( '
#ALTER TABLE ONLY transcript_genomeloc ADD CONSTRAINT transcript_genomeloc_c1 UNIQUE (transcript_uname, genome_name_version, parent_feature_uname, strand);
#' );

 $dbh->do( '
  CREATE TABLE cds (
    uname varchar UNIQUE primary key,
    transcript_uname varchar NOT NULL REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED, 
    alias varchar,
    dbxref_id integer REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    translation_table integer,
    cds_start integer default 1 NOT NULL,
    cds_stop integer default 1 NOT NULL,  
    strand char
  );
  ' );

 $dbh->do( '
   CREATE TABLE cds_dbxref (
    cds_uname varchar REFERENCES cds(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    dbxref_id integer REFERENCES dbxref(dbxref_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
   )
   ' );

 $dbh->do(
       'CREATE UNIQUE INDEX cds_dbxref_idx ON cds_dbxref(cds_uname,dbxref_id)');

 $dbh->do( '
  CREATE TABLE cds_transcript (
    cds_transcript_id serial primary key,
    cds_uname varchar REFERENCES cds(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    transcript_uname varchar NOT NULL REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    start integer default 1  NOT NULL, 
    stop integer default 1  NOT NULL, 
    strand char  NOT NULL
  );
  ' );

 $dbh->do(
'ALTER TABLE ONLY cds_transcript ADD CONSTRAINT cds_transcript_c1 UNIQUE (cds_uname, transcript_uname)'
 );

 $dbh->do( '
  CREATE TABLE cds_properties (
    cds_uname varchar primary key REFERENCES cds(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
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
CREATE TABLE inference_cds (
    inference_cds_id serial primary key,
    cds_uname varchar NOT NULL REFERENCES cds(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
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
'ALTER TABLE ONLY inference_cds  ADD CONSTRAINT inference_cds_c1 UNIQUE (cds_uname, inference_id,known_protein_id);'
 );

#        $dbh->do('ALTER TABLE ONLY inference_cds  ADD CONSTRAINT inference_cds_c2 UNIQUE (cds_uname, inference_id,inference_hit_rank);'        );
 $dbh->do(
   'CREATE INDEX inference_cds_idx1 ON inference_cds USING btree (cds_uname);');

#       $dbh->do('CREATE INDEX inference_cds_idx2 ON inference_cds USING btree (inference_id);'     );
 $dbh->do(
'CREATE INDEX inference_cds_idx3 ON inference_cds USING btree (known_protein_id);'
 );

################# networks ################

 $dbh->do( '
CREATE TABLE network (
 network_id serial primary key,
 network_type integer REFERENCES public.metadata(metadata_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
 description varchar,
 json text ,
 size integer DEFAULT 0
);
' );
 $dbh->do( '
 CREATE INDEX network_idx1 ON network USING btree (network_type);
 ' );

 $dbh->do( '
 CREATE TABLE cds_network (
  cds_network_id serial primary key,
  cds_uname varchar NOT NULL REFERENCES cds(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  network_id integer NOT NULL REFERENCES network(network_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
 );
 ' );

 $dbh->do( '
 CREATE INDEX cds_network_idx1 ON cds_network USING btree (cds_uname);
 ' );
 $dbh->do( '
 CREATE INDEX cds_network_idx2 ON cds_network USING btree (network_id);
 ' );

############# expression from DEW ################

# best way to link an image from DEW to a transcript is by using the transcript.nuc_checksum
 $dbh->do( '
 CREATE TABLE transcript_expression_image (
    transcript_expression_id serial primary key NOT NULL,
    transcript_uname character varying REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
    type character varying NOT NULL,
    timeloaded timestamp without time zone DEFAULT now(),
    image_data bytea,
    format character(3) NOT NULL
)
' );
 $dbh->do(
'CREATE UNIQUE INDEX transcript_expression_uidx ON transcript_expression_image(transcript_uname, type, format)'
 );

 $dbh->do( '
 CREATE TABLE expression_library (
    uname character varying primary key NOT NULL,
    description text
)
' );

 $dbh->do( '
 CREATE TABLE expression_library_metadata (
    library_metadata_id serial primary key NOT NULL,
    library_uname character varying REFERENCES expression_library(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
    term varchar,
    value varchar
)
' );
 $dbh->do(
'CREATE UNIQUE INDEX expression_library_metadata_idx ON expression_library_metadata(library_uname, term)'
 );

 $dbh->do( '
 CREATE TABLE transcript_expression_library (
    transcript_expression_library_id serial primary key NOT NULL,
    transcript_uname character varying REFERENCES transcript(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
    library_uname character varying REFERENCES expression_library(uname) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT NULL,
    raw_counts int,
    raw_rpkm real,
    express_fpkm real,
    express_tpm real,
    express_counts real,
    kangade_counts real,
    tmm_counts real,
    tmm_fpkm real,
    tmm_tpm real 
)
' );

 $dbh->do(
'CREATE UNIQUE INDEX transcript_expression_library_uidx ON transcript_expression_library(library_uname,transcript_uname)'
 );
 $dbh->do(
'CREATE INDEX transcript_expression_library_idx2 ON transcript_expression_library(transcript_uname)'
 );

################ ################

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
 print
"Parsing Uniprot ID mapping (v slow and will need about 22G of PostGres disk space)\n";
 $dbh->do("COPY uniprot_assoc (uniprot_id,xref_db,xref_accession) FROM STDIN");
 &do_copy_stdin( "idmapping.dat", $dbh );

 print "Indexing (will need about 11Gb...\n";
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

=begin comment

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

=begin comment

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

 my %eggs_to_store;    # because they have no description etc

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

 $dbh->do('DROP INDEX eggnog_assoc_eggnog_id_idx');
 $dbh->do('DROP INDEX eggnog_assoc_uniprot_id_idx');
 $dbh->do('DROP INDEX eggnog_category_eggnog_id_idx');

 $dbh->begin_work;

 # # functinoal cat descs
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
 for ( my $i = 0 ; $i < @eggNOG ; $i++ ) {
  my $egg = $eggNOG[$i];
  die if !-s $egg;

  # populate descriptions
  if ( $egg =~ /description/ ) {
   open( IN,  $egg );
   open( OUT, ">$egg.trim" );
   while (<IN>) {
    my @data = split( "\t", $_ );
    next if ( !$data[1] || $data[1] =~ /^\s*$/ );
    print OUT $_;
    $eggs_to_store{ $data[0] } = 1;
   }
   close IN;
   close OUT;
   $egg = "$egg.trim";

   $dbh->do("COPY eggnog (eggnog_id,description) FROM STDIN");
   &do_copy_stdin( $egg, $dbh );
  }
 }
 $dbh->commit;

 print "Parsing eggnog individual functions/categories...\n";
 my %protein2eggnog;

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
    next unless ( $data[0] && $data[1] && $eggs_to_store{ $data[0] } );
    my @cats = split( '', $data[1] );
    foreach my $cat (@cats) {
     next if $cat eq 'X';
     $check_eggnog->execute( $data[0] );
     my $res = $check_eggnog->fetchrow_arrayref();
     if ($res) {
      print EGGOUT $data[0] . "\t$cat\n";
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
   while ( my $ln = <EGG> ) {
    next if $ln =~ /^\s*$/;
    my @data = split( "\t", $ln );
    next unless ( $data[0] && $data[1] && $eggs_to_store{ $data[0] } );
    $protein2eggnog{ $data[1] } = $data[0];
   }
   close EGG;
  }
 }
 $dbh->commit;
 print "Indexing...\n";

 # one eggnog, one category
 $dbh->do(
'CREATE UNIQUE INDEX eggnog_category_eggnog_id_idx on eggnog_category(eggnog_id,category)'
 );
 print "Indexing complete.\n";

 # do associations
 print "Associating eggnog with Uniprot (slow)...\n";
 unlink("$cwd/.eggnog_assoc.psql");

 #&process_cmd("sort -u -o $cwd/.eggnog_assoc.psql UniProtAC2eggNOG.3.0.tsv");
 open( IN,     "UniProtAC2eggNOG.3.0.tsv" );
 open( EGGOUT, ">.eggnog_assoc.psql" );
 while ( my $ln = <IN> ) {
  chomp($ln);
  next if $ln =~ /^\s*$/;
  my @data = split( "\t", $ln );
  next unless ( $data[0] && $data[1] && $eggs_to_store{ $data[1] } );
 }
 close IN;

 my $find_uniprot =
   $dbh->prepare("SELECT uniprot_id from uniprot_assoc WHERE xref_accession=?");

 # this is a check to make sure all aliases are stored as uniprots...
 &process_cmd(
    "sort -S1G -u -o $cwd/.protein.aliases.v3.txt $cwd/protein.aliases.v3.txt");
 open( EGGNOG, "$cwd/.protein.aliases.v3.txt" );
 my %uniprot_done;
 while ( my $ln = <EGGNOG> ) {
  chomp($ln);
  my @data = split( '\|', $ln );
  next if !$data[1] || $data[1] =~ /^\w{6}_\w{5}$/;
  my $eggnog_id = $protein2eggnog{ $data[0] } || next;
  next unless $eggs_to_store{$eggnog_id};

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
 &process_cmd(
            "sort -S1G -u -o $cwd/.eggnog_assoc.psql. $cwd/.eggnog_assoc.psql");
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
 $find_uniprot->finish();
 $dbh->{"RaiseError"} = 0;
 $dbh->{"PrintError"} = 1;

 print "Cleaning up\n";
 foreach my $f (@eggNOG) {
  unlink($f);
 }

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
 print "Processing HHR output...\n";

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
   if ( $query =~ /^(\S+)/ ) {
    $query = $1;
    $query =~ s/^cds\.//;
   }
   else {
    warn "\nFile $infile is not a .hhr output file; skipping...\n";
    close IN;
    next;
   }

   $sql_hash_ref->{'check_cds'}->execute($query);
   my $tres = $sql_hash_ref->{'check_cds'}->fetchrow_arrayref();
   unless ( $tres && $tres->[0] ) {
    warn "Cannot find $query in the cds database. Skipping\n";
    next;
   }
   my $match_columns = shift(@record_lines);
   my $No_of_seqs    = shift(@record_lines);
   my $Neff          = shift(@record_lines);
   my $Searched_HMMs = shift(@record_lines);
   my $date_searched = shift(@record_lines);
   if ( $date_searched =~ /^Date\s+(.+)/ ) {
    $date_searched = $1;
   }
   my $command = shift(@record_lines);
   if ( $command =~ /^Command\s+(.+)/ ) {
    $command = $1;
   }
   my $database = 'unknown';
   if ( $command =~ /\s-d\s(\S+)/ ) {
    $database = $1;
   }
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

      my $hit_number = int(0);
      if ( $ln2 =~ /^\s*(\d+)/ ) {
       $hit_number = $1;
      }
      last if $hit_number > $hhr_max_hits;
      my $hit = substr( $ln2, 35 );
      my ( $prob, $evalue, $pvalue, $score, $structure_score, $alignment_length,
           $aligned_query_columns, $aligned_hit_columns );

      # Prob E-value P-value  Score    SS Cols Query HMM  Template HMM
      if ( $hit =~
           /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/ )
      {
       (
         $prob, $evalue, $pvalue, $score, $structure_score, $alignment_length,
         $aligned_query_columns, $aligned_hit_columns
       ) = ( $1, $2, $3, $4, $5, $6, $7, $8 );
      }
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

      my ( $Qstart, $Qstop, $hit_start, $hit_stop );
      if ( $aligned_query_columns =~ /(\d+)-(\d+)/ ) {
       $Qstart = $1;
       $Qstop  = $2;
      }
      if ( $aligned_hit_columns =~ /(\d+)-(\d+)/ ) {
       $hit_start = $1;
       $hit_stop  = $2;
      }
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

=pod

=begin comment

>UP20|VEGDUSABA|52|169 Ribosomal-protein-alanine acetyltransferase OX=345219; \
 Ribosomal-protein-alanine acetyltransferase OX=665940; Ribosomal-protein-alanine acetyltransferase OX=1144311; Ribosomal-protein-alanine N-acetyltransferase OX=683837;
 Ribosomal-protein-alanine acetyltransferase OX=941639; Ribosomal-protein-alanine acetyltransferase OX=429009. [Clostridium sp. 7_3_54FAA.]
 |G5FC42 [Bacillus coagulans 36D1.]|G2TIN3 [Clostridium symbiosum WAL-14673.]|E9SUK0 [Clostridium symbiosum WAL-14163.]|E7GRC0 [Geobacillus kaustophilus (strain HTA426). GN=]
 |Q5L3F7 [Geobacillus sp. (strain Y412MC52). GN=]|E8SS21 [Geobacillus sp. (strain C56-T3). GN=]|D7CZ50 [Geobacillus sp. (strain Y412MC61). GN=]   .....

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
    
* assume NCBI ID

=cut

       my $accession;
       if ( $desc =~ s/^>(\S+)\s+// ) {
        $accession = $1;
       }

       #if ( $accession =~ /^UP/ ) {
       if ($accession) {
        my %hits;

        #while ( $desc =~ /\|(\w{6})[\W]/g ) {
        while ( $desc =~ /sp:(\w{6})/g ) {
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

       my ( $prob, $evalue, $score, $aln_length, $ident, $simil, $sum_prob );
       if ( $stats =~
           /Probab=(\S+)\s+E-value=(\S+)\s+Score=(\S+)\s+Aligned_cols=(\d+)\s/ )
       {
        $prob       = $1;
        $evalue     = $2;
        $score      = $3;
        $aln_length = $4;
       }
       if ( $evalue < 1e-99 ) {
        $evalue = int(0.00);
       }
       $hash{$query}{'data'}{$hit_number}{'prob'}       = $prob;
       $hash{$query}{'data'}{$hit_number}{'eval'}       = $evalue;
       $hash{$query}{'data'}{$hit_number}{'score'}      = $score;
       $hash{$query}{'data'}{$hit_number}{'aln_length'} = $aln_length;
       if ( $stats =~ /Identities=(\S+)\s+Similarity=(\S+)\s+Sum_probs=(\S+)/ )
       {
        $ident    = $1;
        $simil    = $2 * 100;
        $sum_prob = $3;
       }
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

    warn "Query $query had no hits.\n" if $debug;

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
   unless ( $inference_exists && $inference_exists->[0] ) {
    confess "Couldn't store inference in database for $infile.\n";
   }
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

    #check_inference_cds
    #store_inference_cds
    #store_inference_hit_significance
    #store_inference_hit_rawscore
    #store_inference_hit_normscore
    #store_inference_hit_identity
    #store_inference_hit_start
    #store_inference_hit_stop
    #store_inference_hit_strand
    ### or just create it:
# cds_uname,inference_id,known_protein_id,rawscore,normscore,significance,identity,similarity,hit_start,hit_end,strand

# one thing we need to do is check if the cds has been already stored with a higher significance (assuming - correctly - that
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
 print "Processed: $record_number\t\t\n" if ( $record_number % 10 == 0 );
 $| = 0;
 print "\nCommitting to database...\n";

 # now execute copy statement
 $dbh_store->do('DROP INDEX inference_cds_idx1');

 #       $dbh_store->do('DROP INDEX inference_cds_idx2');
 $dbh_store->do('DROP INDEX inference_cds_idx3');

 $dbh_store->{"RaiseError"} = 1;
 $dbh_store->begin_work();
 if ($do_chado) { }
 else {
  $dbh_store->do(
"COPY inference_cds (cds_uname,inference_id,inference_hit_rank,known_protein_id,rawscore,normscore,significance,identity,similarity,query_start,query_end,hit_start,hit_end,query_strand,hit_strand) FROM STDIN"
  );
  &do_copy_stdin( ".INFERENCEFEATURECOPY.psql", $dbh_store );
  $dbh_store->commit();
  die if $dbh_store->{"ErrCount"};
  unlink("$cwd/.INFERENCEFEATURECOPY.psql");
  print "Indexing...\n";

  $dbh_store->do(
     'CREATE INDEX inference_cds_idx1 ON inference_cds USING btree (cds_uname);'
  );

#		$dbh_store->do('CREATE INDEX inference_cds_idx2 ON inference_cds USING btree (inference_id);'		);
  $dbh_store->do(
'CREATE INDEX inference_cds_idx3 ON inference_cds USING btree (known_protein_id);'
  );
 }

 sub _version_hhblits() {
  my $version = `hhblits 2>/dev/null|grep version`;
  chomp($version);
  return $version;
 }
}

sub process_protein_network_cdhit() {

 # convert to tab format
 my ( $dbh_store, $files, $separator ) = @_;
 my $orig_sep = $/;
 $/ = '>Cluster ';
 for ( my $i = 0 ; $i < scalar(@$files) ; $i++ ) {
  next unless -s $files->[$i];
  my %hash;
  open( IN,  $files->[$i] );
  open( OUT, '>' . $files->[$i] . '.tab' );
  while ( my $record = <IN> ) {
   chomp($record);
   next if $record =~ /^\s*$/;
   my @data = split( "\n", $record );
   if ( scalar(@data) > 2 ) {
    my ( $master, %cluster_hash );
    my $clus_def = shift(@data);
    foreach my $hit (@data) {

     #0       647aa, >cds.CUFF.19.1|m.75... *
     #0       7903nt, >CUFF.38.1... *
     #0       2779nt, >CUFF.41.1... at -/93%
     my @d = split( "\t", $hit );
     if ( $d[1] && $d[1] =~ /,\s+>(.+)/ ) {
      my $des = $1;
      my ($id);
      if ( $des =~ /^(.+)\.\.\./ ) {
       $id = $1;
       $id =~ s/^cds\.//;
      }
      else {
       next;
      }
      if ( $des =~ /\*$/ ) {
       $master = $id;
      }
      elsif ( $des =~ /([\d+\.]+)\%$/ ) {
       $cluster_hash{$id} = $1;
      }
     }
     else {
      next;
     }
    }
    next unless $master;
    foreach my $id ( keys %cluster_hash ) {
     next unless $cluster_hash{$id};
     print OUT "$master\t$id\t" . $cluster_hash{$id} . "\n";
    }
   }

  }
  close IN;
  close OUT;
  $files->[$i] .= '.tab';
 }
 $/ = $orig_sep;
 &process_protein_network_tab( $dbh_store, $files );
}

sub process_protein_network() {
 print "Processing network output...\n";
 my $dbh_store = shift;
 my $files     = shift;
 my $separator = shift;
 $separator = "\n" unless $separator;

 if ( $network_type eq 'MCL' ) {
  &process_protein_network_mcl( $dbh_store, $files, $separator );
 }
 elsif ( $network_type =~ /cd-hit/i || $network_type =~ /cdhit/i ) {
  &process_protein_network_cdhit( $dbh_store, $files );
 }
 else {
  &process_protein_network_tab( $dbh_store, $files );
 }
}

sub _flatten_network_edges() {

}

sub process_protein_network_tab() {

 my ( $dbh_store, $files ) = @_;

 my %js_hash = (
                 "backgroundGradient1Color" => "rgb(10,10,10)",
                 "backgroundGradient2Color" => "rgb(0,0,0)",
                 "nodeFontColor"            => "rgb(255,255,255)",
                 "gradient"                 => 'true',
                 "preScaleNetwork"          => 'true',
                 "graphType"                => "Network",
                 "indicatorCenter"          => "rainbow",
                 "nodeFontSize"             => 10,
                 "showNodeNameThreshold"    => 30,
                 "edgeWidth"                => 1,
                 "colorNodeBy"              => "group",
                 "colorEdgeBy"              => "value",
                 "showAnimation"            => 'true'
 );
 my $json_metadata = encode_json( \%js_hash );
 my ($metadata_id);
 $sql_hash_ref->{'check_metadata'}->execute($network_type);
 my $res = $sql_hash_ref->{'check_metadata'}->fetchrow_arrayref();
 if ($res) {
  $metadata_id = $res->[0];
  undef($res);
 }
 else {
  $sql_hash_ref->{'store_metadata'}
    ->execute( $network_type, $network_description );
  $sql_hash_ref->{'get_last_metadata_id'}->execute();
  $res         = $sql_hash_ref->{'get_last_metadata_id'}->fetchrow_arrayref();
  $metadata_id = $res->[0];
  undef($res);
  $sql_hash_ref->{'store_metadata_js'}->execute( $metadata_id, $json_metadata )
    if $json_metadata;
 }

 foreach my $infile (@$files) {
  my ( %edges, $weighted );
  next unless $infile && -s $infile && ( -s $infile ) >= 10;
  my $absolute_infile_name = File::Spec->rel2abs( $infile, $cwd );
  print "Processing $infile as a network result\n";
  open( IN, $infile ) || die("Cannot open $infile\n");
  while ( my $network = <IN> ) {
   next if $network =~ /^\s*$/ || $network =~ /^#/;
   chomp($network);
   my @data = split( "\t", $network );
   next unless $data[1];

   #need to remove these identifiers...
   $data[1] =~ s/^cds\.//;
   $data[2] =~ s/^cds\.// if $data[2];

   if ( $data[2] && $data[2] =~ /^\d+$/ ) {
    $weighted = 1 if !$weighted;
    $edges{ $data[0] }{ $data[1] } = $data[2];
    if ( !$directed_network ) {
     $edges{ $data[1] }{ $data[0] } = $data[2];
    }
    else {
     $edges{ $data[1] }{ $data[0] } = undef;
    }
   }
   else {
    $edges{ $data[0] }{ $data[1] } = undef if !$edges{ $data[0] }{ $data[1] };
    $edges{ $data[1] }{ $data[0] } = undef if !$edges{ $data[0] }{ $data[1] };
   }
  }
  close IN;
  print "Flattening "
    . scalar( keys %edges )
    . " edges and preparing for database...\n";
  my (@groups);
  my %edges_process = %edges;
  while ( my ($start) = keys %edges_process ) {

#http://stackoverflow.com/questions/19536347/perl-finding-sets-of-similar-association
   my @seen  = ($start);
   my @stack = ($start);
   while (@stack) {
    my $vertex = pop @stack;
    my @reachable = keys %{ delete( $edges_process{$vertex} ) // {} };
    delete $edges_process{$_}{$vertex} for @reachable;
    push @seen,  @reachable;
    push @stack, @reachable;
   }
   push( @groups, \@seen );
  }
  %edges_process = ();
  print "Done, processing up to " . scalar(@groups) . " networks...\n";
  my ($record_number);
  $dbh_store->begin_work;
  foreach my $group (@groups) {
   my @members      = &uniquefy_array($group);
   my $network_size = scalar(@members);
   next if !$network_size || $network_size < 2;
   my $shall_I_jsonit =
     ( $nojson || scalar(@members) > $max_network_size ) ? 0 : 1;

   if ($shall_I_jsonit) {
    my $json_data;
    $json_data = &create_undirected_weighted_network( \@members, \%edges )
      if $weighted;
    $json_data = &create_undirected_unweighted_network( \@members )
      if !$weighted;
    $sql_hash_ref->{'store_network_json'}
      ->execute( $metadata_id, $network_size, $json_data, $network_name )
      if $json_data;
    next if !$json_data;
   }
   else {
    $sql_hash_ref->{'store_network_nojson'}
      ->execute( $metadata_id, $network_size, $network_name );
   }
   $sql_hash_ref->{'get_last_network_id'}->execute();
   $res = $sql_hash_ref->{'get_last_network_id'}->fetchrow_arrayref();
   die "Could not store network!\n" unless $res;
   my $network_id = $res->[0];
   undef($res);

   foreach my $cds_uname (@members) {
    $sql_hash_ref->{'store_cds_network'}->execute( $cds_uname, $network_id );
   }
   $record_number++;
   print "Processed: $record_number\t\t\r" if ( $record_number % 10 == 0 );
  }
  print "\nStoring in database...\n";
  $dbh_store->commit;
 }
}

sub process_protein_network_mcl() {

 # this is a tab file but we do some special processing.
 my $dbh_store = shift;
 my $files     = shift;
 my $separator = shift;

 my $orig_sep = $/;
 $/ = $separator;
 my $record_number = int(0);

 foreach my $infile (@$files) {
  next unless $infile && -s $infile && ( -s $infile ) >= 10;
  my $absolute_infile_name = File::Spec->rel2abs( $infile, $cwd );
  print "Processing $infile as a network result\n";
  open( IN, $infile ) || die("Cannot open $infile\n");

  $dbh_store->begin_work;
  while ( my $network = <IN> ) {
   next if $network =~ /^\s*$/ || $network =~ /^#/;
   $record_number++;
   print "Processed: $record_number\t\t\r" if ( $record_number % 10 == 0 );

   chomp($network);
   my @members = split( "\t", $network );

   # remove cds. identifier...
   for ( my $i = 0 ; $i < @members ; $i++ ) {
    $members[$i] =~ s/^cds\.//;
   }
   my $shall_I_jsonit = ( $nojson || scalar(@members) > 50 ) ? 0 : 1;
   my $network_size = scalar(@members);
   next if !$network_size || $network_size < 2;
   @members = sort { $a cmp $b } (@members);
   my $json_data;
   my $json_metadata;

   if ($shall_I_jsonit) {
    my %hash = (
                 "backgroundGradient1Color" => "rgb(10,10,10)",
                 "backgroundGradient2Color" => "rgb(0,0,0)",
                 "nodeFontColor"            => "rgb(255,255,255)",
                 "gradient"                 => 'true',
                 "preScaleNetwork"          => 'true',
                 "graphType"                => "Network",
                 "indicatorCenter"          => "rainbow",
                 "nodeFontSize"             => 10,
                 "showNodeNameThreshold"    => 30,
                 "edgeWidth"                => 1,
                 "colorNodeBy"              => "group",
                 "colorEdgeBy"              => "value",
                 "showAnimation"            => 'true'
    );
    $json_metadata = encode_json( \%hash );
    $json_data     = &create_undirected_unweighted_network( \@members );
   }

   my ( $metadata_id, $network_id );
   $sql_hash_ref->{'check_metadata'}->execute('MCL');
   my $res = $sql_hash_ref->{'check_metadata'}->fetchrow_arrayref();
   if ($res) {
    $metadata_id = $res->[0];
    undef($res);
   }
   else {
    $sql_hash_ref->{'store_metadata'}->execute( 'MCL', $network_description );
    $sql_hash_ref->{'get_last_metadata_id'}->execute();
    $res         = $sql_hash_ref->{'get_last_metadata_id'}->fetchrow_arrayref();
    $metadata_id = $res->[0];
    undef($res);
    $sql_hash_ref->{'store_metadata_js'}
      ->execute( $metadata_id, $json_metadata )
      if $json_metadata;
   }

   $sql_hash_ref->{'store_network_nojson'}
     ->execute( $metadata_id, $network_size, $network_name )
     if !$json_data;
   $sql_hash_ref->{'store_network_json'}
     ->execute( $metadata_id, $network_size, $json_data, $network_name )
     if $json_data;
   $sql_hash_ref->{'get_last_network_id'}->execute();
   $res        = $sql_hash_ref->{'get_last_network_id'}->fetchrow_arrayref();
   $network_id = $res->[0];
   undef($res);

   foreach my $cds_uname (@members) {
    $sql_hash_ref->{'store_cds_network'}->execute( $cds_uname, $network_id );
   }
  }

  close IN;
  $dbh_store->commit;
 }

 $/ = $orig_sep;

}

sub process_dew_expression() {
 my (
      $dbh_store,               $library_alias_file,
      $binary_expression_file,  $stats_file,
      $gene_coverage_directory, $gene_expression_directory_fpkm,
      $gene_expression_directory_tpm
 ) = @_;
 $dbh_store->begin_work();
 &store_library_metadata($library_alias_file);
 &store_expression_library_transcripts( $binary_expression_file, $stats_file );
 print "Committing...\n";
 $dbh_store->commit();

 $dbh_store->begin_work();
 &store_pictures( $gene_coverage_directory, 'coverage' );
 print "Committing...\n";
 $dbh_store->commit();

 $dbh_store->begin_work();
 &store_pictures( $gene_expression_directory_fpkm, 'FPKM' );
 print "Committing...\n";
 $dbh_store->commit();

 $dbh_store->begin_work();
 &store_pictures( $gene_expression_directory_tpm,  'TPM' );
 print "Committing...\n";
 $dbh_store->commit();

}

sub store_expression_library_transcripts() {
 my $binary_expression = shift;
 my $stats_file        = shift;
 &process_binary($binary_expression);
 &process_expression_stats($stats_file);
}

sub process_expression_stats() {
 my $stats_file = shift;
 open( IN, $stats_file ) || die($!);
 my @headers = split( "\t", <IN> );
 chomp( $headers[-1] );

# currently:
# Checksum Gene alias  Readset Raw_Counts  RPKM    Express_FPKM    Express_TPM Express_eff.counts  KANGADE_counts  TMM_Normalized.count    TMM.FPKM    TMM.TPM
 print "Processing expression statistics via $stats_file\n";
 while ( my $ln = <IN> ) {
  next if $ln =~ /^\s*$/;
  chomp($ln);
  my @data = split( "\t", $ln );
  next unless $data[9];
  my $md5_sum          = $data[0];
  my $transcript_uname = $data[1];
  my $library_uname    = $data[2];

  # do it this way in case headers change again
  my %hash;
  for ( my $i = 3 ; $i < scalar(@data) ; $i++ ) {
   $hash{ $headers[$i] } = $data[$i];
  }

  $sql_hash_ref->{'check_transcript_expression_library'}
    ->execute( $transcript_uname, $library_uname );
  my $sql_res =
    $sql_hash_ref->{'check_transcript_expression_library'}->fetchrow_arrayref();
  unless ( $sql_res && $sql_res->[0] ) {
#   this is now controlled by the binary file. if the gene is not expressed, don't process.
#   warn "Couldn't find expression library for $transcript_uname, $library_uname\n";
#   $warnings_msgs++;die "Stopping: too many warnings...\n" if $warnings_msgs > 10;
   next;
  }
  my $id = $sql_res->[0];

  # undefined values are SET as null

  $sql_hash_ref->{'update_statistics_transcript_expression_library'}->execute(
                         $hash{'Raw_Counts'},           $hash{'RPKM'},
                         $hash{'Express_FPKM'},         $hash{'Express_TPM'},
                         $hash{'Express_eff.counts'},   $hash{'KANGADE_counts'},
                         $hash{'TMM_Normalized.count'}, $hash{'TMM.FPKM'},
                         $hash{'TMM.TPM'},              $id
  );
 }
 close IN;
}

sub process_binary() {
 my $binary_expression = shift;
 open( IN, $binary_expression ) || die($!);
 my @headers = split( "\t", <IN> );
 chomp( $headers[-1] );
 print "Linking transcripts to expression libraries via $binary_expression\n";

OUTER: while ( my $ln = <IN> ) {
  next if $ln =~ /^\s*$/;
  chomp($ln);
  my @data = split( "\t", $ln );
  next unless $data[1];
  for ( my $i = 1 ; $i < scalar(@data) ; $i++ ) {
   next OUTER unless $data[$i] =~ /^[01]$/;
   my $library_name = $headers[$i];
   if ( $data[$i] == 1 ) {
    $sql_hash_ref->{'check_transcript_expression_library'}
      ->execute( $data[0], $library_name );
    my $check =
      $sql_hash_ref->{'check_transcript_expression_library'}
      ->fetchrow_arrayref();
    if ( !$check ) {
     $sql_hash_ref->{'store_transcript_expression_library'}
       ->execute( $data[0], $library_name );
     $sql_hash_ref->{'check_transcript_expression_library'}
       ->execute( $data[0], $library_name );
       $check =
      $sql_hash_ref->{'check_transcript_expression_library'}
      ->fetchrow_arrayref();
     die "Can't store expression data..."
       if !$check;
    }
   }
  }
 }
 close IN;
}

sub store_pictures() {
 my ( $dir, $graph_type ) = @_;
 my %allowed_formats = ( 'png' => 1, 'svg' => 1 );
 my @pictures = glob( $dir . '/*' );
 print "Storing up to "
   . scalar(@pictures)
   . " $graph_type pictures from $dir\n";
 foreach my $picture (@pictures) {
  next unless -s $picture && -f $picture;
  my $picture_basename = basename($picture);
  my ( $format, $md5sum, $transcript_uname );
  if ( $picture_basename =~ /\.(\w{3})$/ ) {
   $format = lc($1);
  }
  next unless $format && $allowed_formats{$format};
  if ( $picture_basename =~ /^([^\-\_\.]+)/ ) {
   $md5sum = $1;
   $sql_hash_ref->{'get_transcript_from_md5sum'}->execute($md5sum);
   my $res = $sql_hash_ref->{'get_transcript_from_md5sum'}->fetchrow_arrayref();
   if ($res) {
    $transcript_uname = $res->[0];
    $sql_hash_ref->{'check_transcript_expression_image'}
      ->execute( $transcript_uname, $graph_type, $format );
    next
      if $sql_hash_ref->{'check_transcript_expression_image'}
       ->fetchrow_arrayref();
   }
   else {
    warn "No transcript name found for md5sum $md5sum\n";
    $warnings_msgs++;die "Stopping: too many warnings...\n" if $warnings_msgs > 10;
    next;
   }
  }
  else {
   next;
  }
  my $filedata = &read_whole_file($picture);
  next unless $filedata;
  $sql_hash_ref->{'store_transcript_expression_image'}
    ->bind_param( 1, $transcript_uname );
  $sql_hash_ref->{'store_transcript_expression_image'}
    ->bind_param( 2, $graph_type );
  $sql_hash_ref->{'store_transcript_expression_image'}
    ->bind_param( 3, $filedata, { pg_type => DBD::Pg::PG_BYTEA } );
  $sql_hash_ref->{'store_transcript_expression_image'}
    ->bind_param( 4, $format );
  $sql_hash_ref->{'store_transcript_expression_image'}->execute();
 }

}

sub store_library_metadata() {
 my $file = shift;
 open( LIB, $file );
 print "Reading and storing expression libraries and metadata from $file\n";

 # 'name' is required; others optional
 my @headers = split( "\t", <LIB> );
 chomp( $headers[-1] );
 die
"Peculiar lib_alias file $file (no headers or headers don't start with 'file' and 'name')\n"
   unless ( $headers[0] && $headers[1] )
   && ( $headers[0] eq 'file' && $headers[1] eq 'name' );
 while ( my $ln = <LIB> ) {
  next if $ln =~ /^\s*$/ || $ln =~ /^#/;
  chomp($ln);
  my @data = split( "\t", $ln );
  die "Peculiar lib_alias file $file: number of headers ("
    . scalar(@headers)
    . ") does not equal no. of data ("
    . scalar(@data)
    . ") at line:\n$ln\n"
    unless scalar(@data) == scalar(@headers);
  my $library_name = $data[1];
  die "No library name from $ln\n" unless $library_name;
  die "Library name must not have the ^ character\n" if $library_name =~ /\^/;
  $sql_hash_ref->{'check_expression_library'}->execute($library_name);

  if ( !$sql_hash_ref->{'check_expression_library'}->fetchrow_arrayref() ) {
   $sql_hash_ref->{'store_expression_library'}->execute($library_name);
   $sql_hash_ref->{'check_expression_library'}->execute($library_name);
   die if !$sql_hash_ref->{'check_expression_library'}->fetchrow_arrayref();
  }
  for ( my $i = 1 ; $i < @data ; $i++ ) {
   next unless $headers[$i];
   if ( $headers[$i] =~ /description/i ) {
    $sql_hash_ref->{'store_expression_library_description'}
      ->execute( $data[$i], $library_name );
   }
   else {
    $sql_hash_ref->{'check_expression_library_metadata'}
      ->execute( $library_name, $headers[$i] );
    if (
      !$sql_hash_ref->{'check_expression_library_metadata'}->fetchrow_arrayref )
    {
     $sql_hash_ref->{'store_expression_library_metadata'}
       ->execute( $library_name, $headers[$i], $data[$i] );
     $sql_hash_ref->{'check_expression_library_metadata'}
       ->execute( $library_name, $headers[$i] );
     die
       if ( !$sql_hash_ref->{'check_expression_library_metadata'}
            ->fetchrow_arrayref );
    }
   }
  }
 }

 close LIB;
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

   # remove cds identifier
   # $seq_id=~s/^cds\.//;

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
  $seq =~ s/\*$//;

  #make calculations
  $calc->seq($seq_obj);
  my $seq_id = $seq_obj->id;

  # remove cds identifier
  $seq_id =~ s/^cds\.//;

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
 $sql_hash{'check_db'}  = $dbh->prepare("SELECT db_id FROM db WHERE uname=?");
 $sql_hash{'create_db'} = $dbh->prepare("INSERT INTO db (uname) VALUES (?)");
 $sql_hash{'check_dbxref'} = $dbh->prepare(
"SELECT dbxref_id from dbxref WHERE db_id=(SELECT db_id FROM db WHERE uname=?) AND accession = ?"
 );
 $sql_hash{'create_dbref'} =
   $dbh->prepare("INSERT INTO dbxref (db_id,accession) VALUES (?,?)");

 #new
 $sql_hash{'check_gene'} =
   $dbh->prepare("SELECT uname FROM gene WHERE uname=?");
 $sql_hash{'check_number_gene'} =
   $dbh->prepare("SELECT count(uname) FROM gene");
 $sql_hash{'check_gene_all'} = $dbh->prepare("SELECT uname FROM gene");

 $sql_hash{'check_transcript'} =
   $dbh->prepare("SELECT uname FROM transcript WHERE uname=?");
 $sql_hash{'check_cds'} = $dbh->prepare("SELECT uname FROM cds WHERE uname=?");
 $sql_hash{'check_transcript_all'} =
   $dbh->prepare("SELECT uname FROM transcript");
 $sql_hash{'check_number_transcript'} =
   $dbh->prepare("SELECT count(uname) FROM transcript");
 $sql_hash{'check_library'} = $dbh->prepare(
                "SELECT library_uname from public.datasets WHERE dataset_id=?");
 $sql_hash{'check_inference'} =
   $dbh->prepare("SELECT inference_id FROM inference WHERE filepath=?");
 $sql_hash{'get_last_inference_id'} =
   $dbh->prepare("SELECT currval ('inference_id_seq')");
 $sql_hash{'check_cds_properties'} =
   $dbh->prepare("SELECT cds_uname from cds_properties WHERE cds_uname=?");

 $sql_hash{'check_inference_cds'} = $dbh->prepare(
"SELECT inference_cds_id FROM inference_cds WHERE cds_uname=? AND inference_id=? AND known_protein_id=?"
 );
 $sql_hash{'get_last_inference_cds_id'} =
   $dbh->prepare("SELECT currval ('inference_cds_id_seq')");

 $sql_hash{'update_db_urlprefix'} = $dbh->prepare(
               "UPDATE db SET urlprefix=? WHERE db_id=? and urlprefix is NULL");

 #new
 $sql_hash{'store_gene_name_seq'} = $dbh->prepare(
           "INSERT INTO gene (uname,nuc_sequence,nuc_checksum) VALUES (?,?,?)");
 $sql_hash{'store_gene_dbxref'} =
   $dbh->prepare("INSERT INTO gene_dbxref (gene_uname,dbxref_id) VALUES (?,?)");
 $sql_hash{'store_gene_alias'} =
   $dbh->prepare("UPDATE gene SET alias=? WHERE uname=?");

 $sql_hash{'store_transcript'} =
   $dbh->prepare("INSERT INTO transcript (uname) VALUES (?)");
 $sql_hash{'store_transcript_seq'} = $dbh->prepare(
          "UPDATE transcript SET nuc_sequence=?, nuc_checksum=? WHERE uname=?");
 $sql_hash{'store_transcript_name_seq'} = $dbh->prepare(
     "INSERT INTO transcript (uname,nuc_sequence,nuc_checksum) VALUES (?,?,?)");
 $sql_hash{'store_transcript_dbxref'} = $dbh->prepare(
     "INSERT INTO transcript_dbxref (transcript_uname,dbxref_id) VALUES (?,?)");
 $sql_hash{'store_transcript_alias'} =
   $dbh->prepare("UPDATE transcript SET alias=? WHERE uname=?");

 #new
 $sql_hash{'store_transcript_gene'} = $dbh->prepare(
"INSERT INTO transcript_gene (transcript_uname,gene_uname,start,stop,strand) VALUES (?,?,?,?,?)"
 );

 $sql_hash{'store_cds'} = $dbh->prepare(
"INSERT INTO cds (uname,transcript_uname,translation_table,cds_start,cds_stop,strand) VALUES (?,?,?,?,?,?)"
 );

 $sql_hash{'store_inference'} = $dbh->prepare(
"INSERT INTO inference (name,description,filepath,program,programversion,algorithm,timeexecuted,sourcename,sourceversion) VALUES (?,?,?,?,?,?,?,'annotate_me','0.2')"
 );
 $sql_hash{'delete_inference'} =
   $dbh->prepare("DELETE FROM inference where filepath=? CASCADE");

 $sql_hash{'get_known_protein_id'} = $dbh->prepare(
"SELECT uniprot_id from known_proteins.uniprot_id WHERE xref_accession=? AND xref_db=?"
 );

 $sql_hash{'store_inference_cds'} = $dbh->prepare(
"INSERT INTO inference_cds (cds_uname,inference_id,known_protein_id) VALUES (?,?,?)"
 );
 $sql_hash{'store_inference_hit_significance'} = $dbh->prepare(
            "UPDATE inference_cds SET significance=? WHERE inference_cds_id=?");
 $sql_hash{'store_inference_hit_rawscore'} = $dbh->prepare(
                "UPDATE inference_cds SET rawscore=? WHERE inference_cds_id=?");
 $sql_hash{'store_inference_hit_normscore'} = $dbh->prepare(
               "UPDATE inference_cds SET normscore=? WHERE inference_cds_id=?");
 $sql_hash{'store_inference_hit_identity'} = $dbh->prepare(
                "UPDATE inference_cds SET identity=? WHERE inference_cds_id=?");

 $sql_hash{'store_inference_hit_start'} = $dbh->prepare(
               "UPDATE inference_cds SET hit_start=? WHERE inference_cds_id=?");

 $sql_hash{'store_inference_hit_stop'} = $dbh->prepare(
                "UPDATE inference_cds SET hit_stop=? WHERE inference_cds_id=?");

 $sql_hash{'store_inference_hit_strand'} =
   $dbh->prepare("UPDATE inference_cds SET strand=? WHERE inference_cds_id=?");

##### NETWORK

 $sql_hash{'store_metadata'} = $dbh->prepare(
              "INSERT INTO public.metadata (uname,description) VALUES  (?,?) ");

 $sql_hash{'get_last_metadata_id'} =
   $dbh->prepare("SELECT currval ('public.metadata_metadata_id_seq')");

 $sql_hash{'store_network_nojson'} = $dbh->prepare(
          "INSERT INTO network (network_type,size,description) VALUES (?,?,?)");

 $sql_hash{'store_network_json'} = $dbh->prepare(
   "INSERT INTO network (network_type,size,json,description) VALUES (?,?,?,?)");

 $sql_hash{'get_last_network_id'} =
   $dbh->prepare("SELECT currval ('network_network_id_seq')");

 $sql_hash{'store_cds_network'} =
   $dbh->prepare("INSERT INTO cds_network (cds_uname,network_id) VALUES (?,?)");

 $sql_hash{'store_metadata_js'} = $dbh->prepare(
           "INSERT INTO public.metadata_jslib (metadata_id,json) VALUES (?,?)");

 $sql_hash{'check_metadata'} =
   $dbh->prepare("SELECT metadata_id from public.metadata WHERE uname=?");

#### expression

 $sql_hash{'check_transcript_expression_image'} = $dbh->prepare(
"SELECT transcript_expression_id from transcript_expression_image WHERE transcript_uname=? AND type=? AND format=?"
 );
 $sql_hash{'store_transcript_expression_image'} = $dbh->prepare(
"INSERT INTO transcript_expression_image (transcript_uname,type,image_data,format) VALUES (?,?,?,?)"
 );

 $sql_hash{'check_expression_library'} =
   $dbh->prepare("SELECT uname FROM expression_library WHERE uname=?");
 $sql_hash{'store_expression_library'} =
   $dbh->prepare("INSERT INTO expression_library (uname) VALUES (?)");
 $sql_hash{'store_expression_library_description'} =
   $dbh->prepare("UPDATE expression_library set description=? WHERE uname=?");

 $sql_hash{'check_expression_library_metadata'} = $dbh->prepare(
"SELECT library_metadata_id FROM expression_library_metadata WHERE  library_uname=? AND term=?"
 );
 $sql_hash{'store_expression_library_metadata'} = $dbh->prepare(
"INSERT INTO expression_library_metadata (library_uname,term,value) VALUES (?,?,?)"
 );

 $sql_hash{'check_transcript_expression_library'} = $dbh->prepare(
"SELECT transcript_expression_library_id FROM transcript_expression_library WHERE transcript_uname=? AND library_uname=?"
 );
 $sql_hash{'store_transcript_expression_library'} = $dbh->prepare(
"INSERT INTO transcript_expression_library (transcript_uname,library_uname) VALUES (?,?)"
 );

 $sql_hash{'get_transcript_from_md5sum'} =
   $dbh->prepare("SELECT uname from transcript WHERE nuc_checksum=?");

 $sql_hash{'update_statistics_transcript_expression_library'} = $dbh->prepare(
"UPDATE transcript_expression_library SET raw_counts=?,raw_rpkm=?,express_fpkm=?,express_tpm=?,express_counts=?,kangade_counts=?,tmm_counts=?,tmm_fpkm=?,tmm_tpm=? WHERE transcript_expression_library_id=?"
 );

 $sql_hash{'add_custom_statistics_transcript_expression_library'} = $dbh->prepare("ALTER TABLE transcript_expression_library ADD column $extra_expression_column_name $extra_expression_column_type");
 $sql_hash{'update_custom_statistics_transcript_expression_library'} = $dbh->prepare("UPDATE transcript_expression_library SET $extra_expression_column_name = ? WHERE transcript_expression_library_id=?");

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

sub parse_transcript_gff() {
 my ( %cds_gff_data, %transcript_gff_data, $number_transcripts );
 open( GFF, $cds_gff_file ) || die;
 my ( $gene_uname, $cds_uname, $transcript_uname, $genome_reference_sequence,
      $gene_alias, $gene_dbxref );
 while ( my $ln = <GFF> ) {
  if ( $ln =~ /^\s*$/ || $ln =~ /^#/ ) {
   undef($gene_uname);
   undef($cds_uname);
   undef($transcript_uname);
   undef($genome_reference_sequence);
   undef($gene_alias);
   undef($gene_dbxref);
   next;
  }

  if ( $genome_gff_file && $ln =~ /\tgene\t/ ) {
   chomp($ln);
   my @data = split( "\t", $ln );
   next unless $data[2] eq 'gene';
   $genome_reference_sequence = $data[0];
   if ( $data[8] =~ /ID=([^;]+);?/ ) {
    $gene_uname = $1 || die $ln;
    if ( $data[8] =~ /Name=([^;]+);?/ ) {
     $gene_alias = uri_unescape($1);
    }
    if ( $data[8] =~ /Dbxref=([^;]+);?/ ) {
     $gene_dbxref = uri_unescape($1);
    }
   }
   else {
    die "Can't find an ID in the GFF $cds_gff_file for:" . $ln;
   }
   next;
  }

  if ( $ln =~ /\tmRNA\t/ ) {
   chomp($ln);
   my @data = split( "\t", $ln );
   my ( $transcript_alias, $transcript_dbxref );
   next unless $data[2] eq 'mRNA';
   if ( $data[8] =~ /ID=([^;]+);?/ ) {
    $transcript_uname = $1 || die $ln;
    if ( $data[8] =~ /Name=([^;]+);?/ ) {
     $transcript_alias = uri_unescape($1);
    }
    if ( $data[8] =~ /Dbxref=([^;]+);?/ ) {
     $transcript_dbxref = uri_unescape($1);
    }
   }
   else {
    die "Can't find an ID in the GFF mRNA $cds_gff_file for:" . $ln;
   }
   $gene_uname = $data[0] if !$genome_gff_file;

   my %t = (
             'gene_uname' => $gene_uname,
             'start'      => $data[3],
             'stop'       => $data[4],
             'strand'     => $data[6]       # +,- or .
   );

   $t{'transcript_alias'}  = $transcript_alias if $transcript_alias;
   $t{'transcript_dbxref'} = $transcript_alias if $transcript_dbxref;
   $t{'gene_alias'}        = $gene_alias       if $gene_alias;
   $t{'gene_dbxref'}       = $gene_dbxref      if $gene_dbxref;

   $transcript_gff_data{$transcript_uname} = \%t;
   next;
  }

  next unless $ln =~ /\tCDS\t/;
  chomp($ln);
  my @data = split( "\t", $ln );
  next unless $data[2] eq 'CDS';

  #coding transcripts:
  $number_transcripts++;

# we will use the same ID as the transcript (otherwise cds is just = "cds.$transcript_uname")
#  if ($data[8] =~ /ID=([^;]+);?/){
#   #$cds_uname = $1 || die $ln;
#  }else{
#   die "Can't find an ID in the GFF $cds_gff_file for:" . $ln;
#  }

  if ( $data[8] =~ /Parent=([^;]+);?/ ) {
   $transcript_uname = $1;
   $cds_uname        = $1;
  }
  else {
   die "Can't find a Parent in the GFF CDS $cds_gff_file for:" . $ln;
  }

  # trinity component
  $gene_uname = $data[0] if !$genome_gff_file;

  my %d = (
            'cds_uname' => $cds_uname,
            'start'     => $data[3],
            'stop'      => $data[4],
            'strand'    => $data[6]      # +,- or .
  );

  # for each transcript there is one CDS:
  $cds_gff_data{$transcript_uname} = \%d;
 }
 close GFF;
 return ( \%transcript_gff_data, \%cds_gff_data );
}

sub store_native_genes() {
 my $dbh = shift;

 #check
 $sql_hash_ref->{'check_gene_all'}->execute();
 my $stored_genes_ref    = {};
 my $number_stored_genes = int(0);
 while ( my $res = $sql_hash_ref->{'check_gene_all'}->fetchrow_arrayref ) {
  $stored_genes_ref->{ $res->[0] } = 1;
  $number_stored_genes++;
 }

 print "Processing genes from $contig_fasta_file\n";
 print "$number_stored_genes had been previously stored.\n";
 $dbh->{"PrintError"} = 0;
 $dbh->{"RaiseError"} = 1;
 $dbh->begin_work;
 my $counter = 0;
 $| = 1;

 #process
 my $contig_obj = new Fasta_reader($contig_fasta_file);    # genes
 while ( my $seq_obj = $contig_obj->next() ) {
  $counter++;
  if ( $counter % 1000 == 0 ) {
   print " $counter reference contigs loaded\t\t\r";
   die if $dbh->{"ErrCount"};
   $dbh->commit;
   $dbh->begin_work;
  }

  my $gene_uname = $seq_obj->get_accession();
  die "No gene name!" unless $gene_uname;
  next if $stored_genes_ref->{$gene_uname};

  print "Adding gene $gene_uname\n" if $debug;
  my $seq = $seq_obj->get_sequence();
  die "No sequence for $gene_uname!\n" unless $seq;
  $sql_hash_ref->{'store_gene_name_seq'}
    ->execute( $gene_uname, $seq, md5_hex($seq) );

 }
 print " $counter reference contigs loaded\t\t\r";
 die if $dbh->{"ErrCount"};
 $dbh->commit;
 print "\n";
 $|                   = 0;
 $dbh->{"PrintError"} = 1;
 $dbh->{"RaiseError"} = 0;

 &store_native_transcripts($dbh);

}

sub store_native_transcripts() {
 my $dbh = shift;
 my ( $transcript_gff_data_ref, $cds_gff_data_ref ) = &parse_transcript_gff();
 my $number_transcripts        = scalar( keys %{$cds_gff_data_ref} );
 my $number_stored_transcripts = int(0);
 my $obj                       = new Fasta_reader($cdna_fasta_file);    # genes
 my $stored_transcripts_ref    = {};

 $sql_hash_ref->{'check_transcript_all'}->execute();
 while ( my $res = $sql_hash_ref->{'check_transcript_all'}->fetchrow_arrayref )
 {
  $stored_transcripts_ref->{ $res->[0] } = 1;
  $number_stored_transcripts++;
 }

 print
"Processing $number_transcripts coding mRNA sequences from $cdna_fasta_file\n";
 print "$number_stored_transcripts had been previously stored.\n";
 $dbh->{"PrintError"} = 0;
 $dbh->{"RaiseError"} = 1;
 $dbh->begin_work;
 my $counter = 0;
 my $do_phys_file;
 $| = 1;

 while ( my $seq_obj = $obj->next() ) {
  $counter++;
  if ( $counter % 1000 == 0 ) {
   print " $counter transcripts loaded\t\t\r";
   die if $dbh->{"ErrCount"};
   $dbh->commit;
   $dbh->begin_work;
  }
  my $transcript_uname = $seq_obj->get_accession();
  next if $stored_transcripts_ref->{$transcript_uname};

  #check if in GFF file
  next unless $transcript_gff_data_ref->{$transcript_uname};
  print "Adding transcript $transcript_uname\n" if $debug;

  my $seq = $seq_obj->get_sequence();
  $sql_hash_ref->{'store_transcript_name_seq'}
    ->execute( $transcript_uname, $seq, md5_hex($seq) );

  my $transcript_data_ref = $transcript_gff_data_ref->{$transcript_uname};

  #link to GENE
  $sql_hash_ref->{'store_transcript_gene'}->execute(
          $transcript_uname,               $transcript_data_ref->{'gene_uname'},
          $transcript_data_ref->{'start'}, $transcript_data_ref->{'stop'},
          $transcript_data_ref->{'strand'}
  );

  #dbxref
  if ( $transcript_data_ref->{'transcript_dbxref'} ) {
   my ( $db, $dbxref ) =
     split( ':', $transcript_data_ref->{'transcript_dbxref'} );
   if ( $db && $dbxref ) {
    my $dbxref_id = &store_dbxref( $db, $dbxref );
    $sql_hash_ref->{'store_transcript_dbxref'}
      ->execute( $transcript_uname, $dbxref_id );
   }
  }
  if ( $transcript_data_ref->{'gene_dbxref'} ) {
   my ( $db, $dbxref ) = split( ':', $transcript_data_ref->{'gene_dbxref'} );
   if ( $db && $dbxref ) {
    my $dbxref_id = &store_dbxref( $db, $dbxref );
    $sql_hash_ref->{'store_gene_dbxref'}
      ->execute( $transcript_data_ref->{'gene_uname'}, $dbxref_id );
   }
  }

  #aliases
  if ( $transcript_data_ref->{'transcript_alias'} ) {
   $sql_hash_ref->{'store_transcript_alias'}
     ->execute( $transcript_data_ref->{'transcript_alias'}, $transcript_uname );
  }
  if ( $transcript_data_ref->{'gene_alias'} ) {
   $sql_hash_ref->{'store_transcript_alias'}
     ->execute( $transcript_data_ref->{'gene_alias'},
                $transcript_data_ref->{'gene_uname'} );
  }

  # check if coding, store CDS data

  if ( $cds_gff_data_ref->{$transcript_uname} ) {
   my $cds_data = $cds_gff_data_ref->{$transcript_uname};
   $sql_hash_ref->{'store_cds'}->execute(
                               $cds_data->{'cds_uname'},  $transcript_uname,
                               $translation_table_number, $cds_data->{'start'},
                               $cds_data->{'stop'},       $cds_data->{'strand'},
   );
   $sql_hash_ref->{'check_cds'}->execute($cds_data->{'cds_uname'});
   my $check = $sql_hash_ref->{'check_cds'}->fetchrow_arrayref();
   confess "Couldn't add item ".$cds_data->{'cds_uname'}." in the CDS table\n" unless $check;
   $do_phys_file++;
  }

 }
 print " $counter transcripts loaded\t\t\r";
 die if $dbh->{"ErrCount"};
 $dbh->commit;
 print "\n";
 $| = 0;

 if ($do_phys_file) {
  my $phys_file = &calculate_protein_properties($protein_fasta_file);
  $dbh->{"RaiseError"} = 0;
  $dbh->begin_work;
  $dbh->do(
"COPY cds_properties (cds_uname,udef_residues,min_molweight,max_molweight,pos_aa,negative_aa,iso_pot,charge_ph5,charge_ph7,charge_ph9,pep_checksum) FROM STDIN"
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

#  UniProt    http://www.uniprot.org/uniprot
# The mission of UniProt is to provide the scientific community with a comprehensive, high-quality and freely accessible resource of protein sequence and functional information.
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
 &prepare_uniprot_id_mapping($dbh_create) if $do_uniprot_renaming;
 &prepare_ec($dbh_create)                 if $do_ec;
 &prepare_go($dbh_create)                 if $do_go;
 &prepare_eggnog($dbh_create)             if $do_eggnog;
 &prepare_kegg($dbh_create)               if $do_kegg;

 &postgres_permissions( $dbh_create, $annot_username, $annot_readuser );
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
 $protein_fasta_file = '' if !$protein_fasta_file;    # will grab everything!

 if ( scalar(@do_protein_blasts) > 0 ) {
  print "Processing BLASTs\n";
  &process_protein_blast( $dbh_store, \@do_protein_blasts );
 }
 if ( scalar(@do_protein_hhr) > 0 ) {
  print "Processing hhblits HHR files\n";
  &process_protein_hhr( $dbh_store, \@do_protein_hhr );
 }
 if ( scalar(@do_protein_networks) > 0 ) {
  print "Processing network files\n";
  if ( $network_type && $network_name && $network_description ) {
   &process_protein_network( $dbh_store, \@do_protein_networks );
  }
  else {
   warn
"Cannot process network unless -network_description, -network_name and -network_type are given\n";
  }
 }

 if ($expression_dew_outdir) {
  if ( !-d $expression_dew_outdir ) {
   warn
"Cannot find DEW output directory $expression_dew_outdir. Skipping expression processing...\n";
  }
  else {
   my $library_alias_file = $expression_dew_outdir . '/lib_alias.txt';
   my @binary_expression_files =
     glob( $expression_dew_outdir . '/*.expression_levels.binary.tsv' );
   my $gene_coverage_directory =
     $expression_dew_outdir . '/gene_coverage_plots';
   my $gene_expression_directory_fpkm =
     $expression_dew_outdir . '/gene_expression_fpkm';
   my $gene_expression_directory_tpm =
     $expression_dew_outdir . '/gene_expression_tpm';

   my @stats_files =
     glob( $expression_dew_outdir . '/*.expression_levels.stats.tsv' );

   if ( !-s $library_alias_file ) {
    warn "Cannot find $library_alias_file. Skipping expression processing...\n";
   }
   elsif ( !$binary_expression_files[0] || !-s $binary_expression_files[0] ) {
    warn
"Cannot find the $expression_dew_outdir/*expression_levels.binary.tsv file. Skipping expression processing...\n";
   }
   elsif ( !-d $gene_coverage_directory ) {
    warn
"Cannot find $gene_coverage_directory. Skipping expression processing...\n";
   }
   elsif ( !-s $stats_files[0] ) {
    warn
"Cannot find gene expression statistics ($expression_dew_outdir/*.expression_levels.stats.tsv). Skipping expression processing...\n";
   }
   elsif ( !-d $gene_expression_directory_fpkm ) {
    warn
"Cannot find $gene_expression_directory_fpkm. Skipping expression processing...\n";
   }
   elsif ( !-d $gene_expression_directory_tpm ) {
    warn
"Cannot find  $gene_expression_directory_tpm. Skipping expression processing...\n";
   }
   else {
    &process_dew_expression(
                             $dbh_store,
                             $library_alias_file,
                             $binary_expression_files[0],
                             $stats_files[0],
                             $gene_coverage_directory,
                             $gene_expression_directory_fpkm,
                             $gene_expression_directory_tpm,
    );
   }
  }

 }

 if ( scalar(@do_protein_ipr) > 0 ) {
  print "Processing InterProScan files\n";
  &process_protein_ipr( $dbh_store, \@do_protein_ipr );
 }
 &postgres_permissions( $dbh_store, $annot_username, $annot_readuser );
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
#return  $protein_fasta_file, $contig_fasta_file, $cdna_fasta_file, $cds_gff_file
 $protein_fasta_file = $genome_gff_file . '.proteins.fasta';
 $contig_fasta_file  = $genome_gff_file . '.gene.fasta';
 $cdna_fasta_file    = $genome_gff_file . '.mRNA.fasta';
 $cds_gff_file       = $genome_gff_file . '.mRNA.gff3';
 if ( -s $cds_gff_file ) {
  return ( $protein_fasta_file, $contig_fasta_file, $cdna_fasta_file,$cds_gff_file );
 }
 print "Preparing genome $genome_fasta_file with $genome_gff_file\n";
 my %unique_names_check;
 my $genome_ref = &read_fasta($genome_fasta_file);

 print "Indexing...\n";
 my $gene_obj_indexer =
   new Gene_obj_indexer( { "create" => $genome_gff_file . '.inx' } );
 my $scaffold_to_gene_list_href =
   &GFF3_utils::index_GFF3_gene_objs( $genome_gff_file, $gene_obj_indexer );
 print "Processing...\n";
 open( PROTOUT, ">$protein_fasta_file" );
 open( GENEOUT, ">$contig_fasta_file" );
 open( CDNAOUT, ">$cdna_fasta_file" );
 open( GFFOUT,  ">$cds_gff_file" );
 my $master_counter = 0;

 foreach my $reference_id ( sort keys %$scaffold_to_gene_list_href ) {
  my $genome_seq = $genome_ref->{$reference_id};
  if ( !$genome_seq ) {
   warn "Cannot find sequence $reference_id from genome\n";
   next;
  }
  my @gene_ids = sort @{ $scaffold_to_gene_list_href->{$reference_id} };

  foreach my $gene_id (@gene_ids) {
   my $counter      = 0;
   my $gene_obj_ref = $gene_obj_indexer->get_gene($gene_id);
   my ( %params, %preferences );
   $preferences{'sequence_ref'} = \$genome_seq;
   $params{unspliced_transcript} = 1;    # highlights introns
   $gene_obj_ref->trivial_refinement();
   $gene_obj_ref->create_all_sequence_types( \$genome_seq, %params );
   my $gene_seq = $gene_obj_ref->get_gene_sequence();
   $gene_seq =~ s/(\S{80})/$1\n/g;
   chomp $gene_seq;
   my ( $gene_lend, $gene_rend ) =
     sort { $a <=> $b } $gene_obj_ref->get_gene_span();
   my $gene_orientation = $gene_obj_ref->get_orientation();
   my $source           = $gene_obj_ref->{source};
   my $gene_common_name = $gene_obj_ref->{com_name};
   my $gene_name        = $gene_id;
   my ( $to_gff3_out_print, $gff3_out_print, $gene_description );

   if ($gene_common_name) {
    if ( $gene_common_name =~ /\s/ ) {
     $gene_description = $gene_common_name;
     $gene_description =~ s/^\s*(\S+)\s*//;
     $gene_description = $gene_description;
     $gene_common_name = $1 || die;
    }
    die "Gene name ($gene_common_name) is not unique\n"
      if $unique_names_check{$gene_common_name};
    $gene_name = $gene_common_name;
    $gff3_out_print =
"$reference_id\t$source\tgene\t$gene_lend\t$gene_rend\t.\t$gene_orientation\t.\tID=$gene_name;Alias=$gene_id";
    $gff3_out_print .= ";Note=$gene_description" if $gene_description;
    $gff3_out_print .= "\n";
    print GENEOUT
">$gene_name type:gene original_name:$gene_id $reference_id:$gene_lend-$gene_rend($gene_orientation)\n$gene_seq\n";
   }
   else {
    $gff3_out_print =
"$reference_id\t$source\tgene\t$gene_lend\t$gene_rend\t.\t$gene_orientation\t.\tID=$gene_name\n";
    print GENEOUT
">$gene_name type:gene $reference_id:$gene_lend-$gene_rend($gene_orientation)\n$gene_seq\n";
   }

   foreach
     my $isoform ( $gene_obj_ref, $gene_obj_ref->get_additional_isoforms() )
   {
    next unless $isoform->has_CDS() || !$isoform->get_CDS_span();
    my @model_span = $isoform->get_CDS_span();
    next if ( abs( $model_span[0] - $model_span[1] ) < 3 );
    $counter++;
    $master_counter++;

    my $orientation = $isoform->get_orientation();
    my ( $model_lend, $model_rend ) =
      sort { $a <=> $b } $isoform->get_model_span();
    my ( $gene_lend, $gene_rend ) =
      sort { $a <=> $b } $isoform->get_gene_span();

    my $isoform_id  = $isoform->{Model_feat_name};
    my $main_id     = $isoform_id;
    my $description = '';
    my $alt_name    = '';
    my $common_name = $isoform->{transcript_name} || $isoform->{com_name};

    # use common name if available.
    if ($common_name) {
     $alt_name = "($isoform_id) ";
     if ( $common_name =~ /\s/ ) {
      $description = $common_name;
      $description =~ s/^\s*(\S+)\s*//;
      $common_name = $1 || die;
     }

     if ( $common_name =~ /-R[A-Z]+$/ ) {
      $main_id = $common_name;
     }
     else {
      $main_id = $common_name . '-RA';
     }

     if ( $unique_names_check{$common_name} ) {
      if ( $common_name =~ /-R[A-Z]+$/ ) {
       die
"Common name $common_name ends in transcript notation but it is not unique!\n";
      }
      my $letter = 'B';
      for ( my $i = 1 ; $i < $unique_names_check{$common_name} ; $i++ ) {
       $letter++;
      }
      $main_id = $common_name . '-R' . $letter;
     }
     $unique_names_check{$common_name}++;

     # set description as note and update name
     $isoform->{transcript_name} = $main_id;
     $isoform->{com_name}        = $main_id;
     $isoform->{pub_comment}     = $description if $description;
    }

    # get sequences
    my $cDNA_seq = $isoform->get_cDNA_sequence();
    my $prot_seq = $isoform->get_protein_sequence();
    my $cds_seq  = $isoform->get_CDS_sequence();       # not to be printed
    next unless $cDNA_seq && $prot_seq && $cds_seq;
    $to_gff3_out_print++;

    my $cds_length  = length($cds_seq);
    my $cDNA_length = length($cDNA_seq);

    my ( $iso_start, $iso_end ) = ( int(0), int(0) );
    if ( $cds_length != $cDNA_length ) {
     $iso_start = index( $cDNA_seq, $cds_seq );
     if ( $iso_start == -1 ) {
      warn
"Cannot find the coding sequence of model $main_id will have to skip!\n";

      #           warn $cDNA_seq;
      #          warn $cds_seq;
      #         die Dumper $isoform;
      next;
     }
     $iso_end = $iso_start + $cds_length;    # 1base co-ordinate
     $iso_start++;                           # 1base co-ordinate
    }
    else {
     $iso_start = 1;
     $iso_end   = $isoform->{CDS_sequence_length};
    }

# this is semi-standard GFF3 (mix references) but we don't care as it is just represent things for the JAMP database
    $gff3_out_print .=
        "$gene_name\tPrediction\tmRNA\t1\t$cDNA_length\t.\t+\t.\tID=$main_id\n"
      . "$gene_name\tPrediction\texon\t1\t$cDNA_length\t.\t+\t.\tID=$main_id.exon;Parent=$main_id\n"
      . "$gene_name\tPrediction\tCDS\t$iso_start\t$iso_end\t.\t+\t.\tID=cds.$main_id;Parent=$main_id\n"
      . "\n";

    #FASTA format
    $prot_seq =~ s/(\S{60})/$1\n/g;
    chomp $prot_seq;
    $cDNA_seq =~ s/(\S{60})/$1\n/g;
    chomp $cDNA_seq;
    print CDNAOUT ">$main_id "
      . $alt_name
      . "type:mRNA  gene:$gene_name$description\n$cDNA_seq\n";
    print PROTOUT ">$main_id "
      . $alt_name
      . "type:polypeptide  gene:$gene_name$description\n$prot_seq\n";

   }
   print GFFOUT $gff3_out_print if $to_gff3_out_print;
  }
 }
 close PROTOUT;
 close CDNAOUT;
 close GENEOUT;
 close GFFOUT;
 print "\nCompleted $master_counter transcripts...\n";
 return ( $protein_fasta_file, $contig_fasta_file, $cdna_fasta_file,
          $cds_gff_file );
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
 my $members_ref = shift;
 my %json;
 for ( my $i = 0 ; $i < (@$members_ref) ; $i++ ) {
  my $member1 = $members_ref->[$i];
  my %node_hash = ( 'id' => $member1 );
  push( @{ $json{'nodes'} }, \%node_hash );
  for ( my $k = $i + 1 ; $i < (@$members_ref) ; $k++ ) {
   my $member2 = $members_ref->[$k] || last;
   my %edge_hash = (
                     'id1' => $member1,
                     'id2' => $member2
   );
   push( @{ $json{'edges'} }, \%edge_hash );
  }
 }

 return encode_json( \%json );
}

sub create_undirected_weighted_network() {

 my $members_ref = shift;
 my $edges_ref   = shift;
 my %json;
 my $anything_connected;
 for ( my $i = 0 ; $i < (@$members_ref) ; $i++ ) {
  my $member1 = $members_ref->[$i];
  my %node_hash = ( 'id' => $member1 );
  push( @{ $json{'nodes'} }, \%node_hash );
  for ( my $k = $i + 1 ; $i < (@$members_ref) ; $k++ ) {
   my $member2 = $members_ref->[$k] || last;
   my $edge;
   if ( $edges_ref->{$member1}->{$member2} ) {
    $edge = $edges_ref->{$member1}->{$member2};
   }
   elsif ( $edges_ref->{$member2}->{$member1} ) {
    $edge = $edges_ref->{$member2}->{$member1};
   }
   next unless $edge;

   $anything_connected++;
   my %edge_hash = (
                     'id1'   => $member1,
                     'id2'   => $member2,
                     'value' => $edge
   );
   push( @{ $json{'edges'} }, \%edge_hash );
  }
 }

 if ($anything_connected) {
  return encode_json( \%json );
 }
}

sub postgres_permissions() {
 my $dbh_store = shift;
 my $db_admin  = shift;
 my $db_user   = shift;

 my $function_grant = '
 CREATE OR REPLACE FUNCTION pg_grant_select(TEXT) 
RETURNS integer AS \'DECLARE obj record;
num integer;
BEGIN
num:=0;
FOR obj IN SELECT relname,nspname FROM pg_class c
JOIN pg_namespace ns ON (c.relnamespace = ns.oid) WHERE
relkind in (\'\'r\'\',\'\'v\'\',\'\'S\'\') AND
nspname NOT IN ( \'\'information_schema\'\',\'\'pg_catalog\'\',\'\'pg_toast\'\',\'\'pg_toast_temp_1\'\',\'\'pg_temp_1\'\') AND 
relname LIKE \'\'%\'\'
LOOP
EXECUTE \'\'GRANT SELECT ON \'\' || obj.nspname || \'\' . \'\' || obj.relname || \'\' TO \'\' || $1;
num := num + 1;
END LOOP;
FOR obj IN SELECT nspname FROM pg_namespace ns WHERE nspname NOT IN ( \'\'information_schema\'\',\'\'pg_catalog\'\',\'\'pg_toast\'\',\'\'pg_toast_temp_1\'\',\'\'public\'\',\'\'pg_temp_1\'\') LOOP
EXECUTE \'\'GRANT USAGE ON SCHEMA \'\' || obj.nspname || \'\' TO \'\' || $1;
num := num + 1;
END LOOP;
RETURN num;
END;
\' LANGUAGE plpgsql ;
';
 my $function_admin = '
CREATE OR REPLACE FUNCTION pg_grant_all(TEXT) 
RETURNS integer AS \'DECLARE obj record;
num integer;
BEGIN
num:=0;
FOR obj IN SELECT relname,nspname FROM pg_class c
JOIN pg_namespace ns ON (c.relnamespace = ns.oid) WHERE
relkind in (\'\'r\'\',\'\'v\'\',\'\'S\'\') AND
nspname NOT IN ( \'\'information_schema\'\',\'\'pg_catalog\'\',\'\'pg_toast\'\',\'\'pg_toast_temp_1\'\',\'\'pg_temp_1\'\') AND 
relname LIKE \'\'%\'\'
LOOP
EXECUTE \'\'GRANT ALL ON \'\' || obj.nspname || \'\' . \'\' || obj.relname || \'\' TO \'\' || $1;
num := num + 1;
END LOOP;
FOR obj IN SELECT nspname FROM pg_namespace ns WHERE nspname NOT IN ( \'\'information_schema\'\',\'\'pg_catalog\'\',\'\'pg_toast\'\',\'\'pg_toast_temp_1\'\',\'\'public\'\',\'\'pg_temp_1\'\') LOOP
EXECUTE \'\'GRANT ALL ON SCHEMA \'\' || obj.nspname || \'\' TO \'\' || $1;
num := num + 1;
END LOOP;
RETURN num;
END;
\' LANGUAGE plpgsql ;
 ';
 $dbh_store->do($function_admin);
 $dbh_store->do($function_grant);

 $dbh_store->do("SELECT pg_grant_all('$db_admin')")   if $db_admin;
 $dbh_store->do("SELECT pg_grant_select('$db_user')") if $db_user;

}

sub uniquefy_array() {
 my $ref = shift;
 return unless $ref && scalar(@$ref) > 0;
 my %hash;
 foreach my $r (@$ref) {
  $hash{$r} = 1;
 }
 return keys %hash;
}

sub store_dbxref() {
 my $dbxref = shift;
 my $db     = shift;
 return unless $dbxref;

 $sql_hash_ref->{'check_dbxref'}->execute( $db, $dbxref );
 my $dbxref_res = $sql_hash_ref->{'check_dbxref'}->fetchrow_arrayref();
 my $dbxref_id  = $dbxref_res->[0];
 return $dbxref_id if $dbxref_id;

 $sql_hash_ref->{'check_db'}->execute($db);
 my $db_res = $sql_hash_ref->{'check_db'}->fetchrow_arrayref();
 my $db_id  = $db_res->[0];
 if ( !$db_id ) {
  $sql_hash_ref->{'create_db'}->execute($db);
  $sql_hash_ref->{'check_db'}->execute($db);
  my $db_res = $sql_hash_ref->{'check_db'}->fetchrow_arrayref();
  $db_id = $db_res->[0];
  die "Cannot insert DB $db\n" unless $db_id;
 }

 $sql_hash_ref->{'create_dbref'}->execute( $db_id, $dbxref );
 $sql_hash_ref->{'check_dbxref'}->execute( $db,    $dbxref );
 $dbxref_res = $sql_hash_ref->{'check_dbxref'}->fetchrow_arrayref();
 $dbxref_id  = $dbxref_res->[0];
 die "Cannot insert DBxref $db $dbxref\n" unless $dbxref_id;
 return $dbxref_id;

}

sub read_whole_file() {
 my $file = shift;
 my $filedata;
 return if ( !-s $file );
 open( IN, $file );
 while ( my $ln = <IN> ) {
  $filedata .= $ln;
 }
 close IN;
 return $filedata;
}

sub read_fasta() {
 my $fasta = shift;
 my %hash;
 my $orig_sep = $/;
 $/ = '>';
 open( IN, $fasta ) || confess( "Cannot open $fasta : " . $! );
 while ( my $record = <IN> ) {
  chomp($record);
  next unless $record;
  my @lines = split( "\n", $record );
  my $id    = shift(@lines);
  my $seq   = join( '', @lines );
  $seq =~ s/\s+//g;
  if ( $id && $seq && $id =~ /^(\S+)/ ) {
   $hash{$1} = $seq;
  }
 }
 close IN;
 $/ = $orig_sep;
 return \%hash;
}
