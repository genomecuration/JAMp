#!/bin/bash

#server specific
DBNAME=annotations  # name of postgres database used for JAMp annotations
HOST=		    # name or IP of postgres server host
PORT=	            # Postgres server port if it is not the standard 5432
RWUSER=		    # Name of user with read write access to postgres server
PASS=''             # password for postgres server for user with write permissions. may want to quote it
ROUSER=		    # User with read only access on postgres server, (ought to be) used by the viewer

#dataset specific (quote if with spaces)
LOCAL_CPUS=	    # number of CPUS
GENOME_PATH=        # path to FASTA
GENOME_GFF=.gff3    # the final gene models
AUTH=medfly         # this is used to control the directory from which the viewer will be accessible /medfly in this case
UNAME="Medfly JAMg v1"   # a unique name can contain spaces
HHBLITS=            # output of hhblits
EXPRESSION=         # directory of DEW

# load data
annotate_me.pl -annot_dbname $DBNAME -annot_port $PORT  -annot_read $ROUSER \
 -annot_host $HOST -annot_user $RWUSER -annot_pass "$PASS" -authorization $AUTH \
 -genome_fasta $GENOME_PATH -gff_genome $GENOME_GFF -dataset_uname "$UNAME" -dataset_type "Genome annotation" \
 -dataset_description "Mediterranean fruit fly JAMg gene set v1" -dataset_species "Ceratitis capitata" -dataset_library "Medfly JAMg Gene Set 1" 


# load functional $DBNAME
annotate_me.pl -annot_dbname $DBNAME -annot_port $PORT -annot_read $ROUSER -dataset_uname "$UNAME" \
 -annot_host $HOST -annot_user $RWUSER -annot_pass "$PASS" -authorization $AUTH \
 -dohhr $HHBLITS


# load network data
cd-hit -c 0.95 -s 0.95 -M 0 -d 0 -T $LOCAL_CPUS -i $GENOME_GFF.pep -o $GENOME_GFF.pep.nr95
annotate_me.pl -annot_dbname $DBNAME -annot_port $PORT -annot_read $ROUSER -dataset_uname "$UNAME" \
 -annot_host $HOST -annot_user $RWUSER -annot_pass "$PASS" -authorization $AUTH \
 -network_description 'Similarity based clustering' -network_name "CDHIT 95% cluster" -network_type "cd-hit" \
 -nojson -donetwork $GENOME_GFF.pep.nr95.clstr


makeblastdb -in $GENOME_GFF.pep -dbtype prot -parse_seqids -hash_index
blastp  -outfmt 6 -query $GENOME_GFF.pep -db $GENOME_GFF.pep -out $GENOME_GFF.pep.selfblast -num_threads $LOCAL_CPUS -max_target_seqs 200 -evalue 1e-10
mclblastline --blast-m9 --blast-score=b --blast-sort=a --blast-bcut=100 --mcl-I=2.5 $GENOME_GFF.pep.selfblast

annotate_me.pl -annot_dbname $DBNAME -annot_port $PORT -annot_read $ROUSER -dataset_uname "$UNAME" \
 -annot_host $HOST -annot_user $RWUSER -annot_pass "$PASS" -authorization $AUTH \
 -network_description 'Undirected, unweighted network created by: clustering using the Markov Cluster Algorithm and BLAST bit-scores' \
 -network_name "MCL-BLAST" -network_type "MCL" \
 -nojson -donetwork dump.out.$GENOME_GFF.pep.selfblast.I25


# load expression data
annotate_me.pl -annot_dbname $DBNAME -annot_port $PORT -annot_read $ROUSER -dataset_uname "$UNAME" \
 -annot_host $HOST -annot_user $RWUSER -annot_pass "$PASS" -authorization $AUTH \
 -expression_directory $EXPRESSION



# this requires a hhblits against self
annotate_me.pl -annot_dbname $DBNAME -annot_port $PORT -annot_read $ROUSER -dataset_uname "$UNAME" \
 -annot_host $HOST -annot_user $RWUSER -annot_pass "$PASS" -authorization $AUTH \
 -network_description 'Undirected, unweighted network created by: clustering using the Markov Cluster Algorithm and HHBLITS with pairwise-averaged, length-normalized scores' \
 -network_name "MCL-HMM" -network_type "MCL" -donetwork ...


