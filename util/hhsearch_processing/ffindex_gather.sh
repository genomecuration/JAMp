#!/bin/bash

#e.g $1 = transposon_db.nr90.db

if [ $1 ]; then
        if [ -e "$1"_out2.db ]; then
	   ffindex_build -as "$1"_out2.all.db "$1"_out2.all.idx -d "$1"_out2.db -i "$1"_out2.db.idx
	   rm -f "$1"_out2.db "$1"_out2.db.idx
	fi
	for i in {0..100}; \
         do 
          if [ -e "$1"_out2.db.$i ]; then 
	   ffindex_build -as "$1"_out2.all.db "$1"_out2.all.idx -d "$1"_out2.db.$i -i "$1"_out2.db.idx.$i
           rm -f "$1"_out2.db.$i "$1"_out2.db.idx.$i
          fi
	 done
        ffindex_resume.pl "$1".idx.orig "$1"_out2.all.idx
else
    cat  *.all.db |tr -d '\000' >  results.all.db.hhr
fi

