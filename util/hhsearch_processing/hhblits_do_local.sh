#!/bin/bash

PROTEIN_FILE=$1
DBDIR=$2
if [ ! $DBDIR ]; then
# DBDIR=$HOME/databases/hhsearch/uniprot20_2016_02
 DBDIR=$HOME/databases/hhsearch
fi

sed -i '~s/\*$//' $PROTEIN_FILE
ffindex_from_fasta $PROTEIN_FILE.db $PROTEIN_FILE.db.idx $PROTEIN_FILE
shuf $PROTEIN_FILE.db.idx > $PROTEIN_FILE.db.idx.
mv -f $PROTEIN_FILE.db.idx. $PROTEIN_FILE.db.idx

split -d -a 3 -l 500 $PROTEIN_FILE.db.idx $PROTEIN_FILE.db.idx.
let NUMBERSPROCESSES=`ls -l $PROTEIN_FILE.db.idx.???|wc -l`-1

for (( i=0; i<=$NUMBERSPROCESSES; i++ )); do
	INDEX_PADDED=`printf "%03d" $i`
	IDX=$PROTEIN_FILE.db.idx.$INDEX_PADDED
	echo ffindex_apply $PROTEIN_FILE.db $IDX hhblits -maxres 24000 -maxmem 10 -d $DBDIR/swissprot70 -mact 0.3 -cpu 4 -i stdin -o stdout -oa3m stdout -e 0.0001 -id 100 -p 60 -E 1E-03 -z 0 -b 0 -v 0 -n 2 \> $IDX.out
done
