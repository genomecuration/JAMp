#!/bin/bash

#e.g $1 = masked.exons.aa.trim
# $2 transposon
# for processing masked.exons.aa.trim_transposon.db.*
SOURCE="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
export PATH=$PATH:$SOURCE

TARGET=$2
if [ ! $TARGET ]; then TARGET='out2'; fi

if [ $1 ]; then
        if [ -e "$1"."$TARGET".db ]; then
	   ffindex_build -as "$1"."$TARGET.all".db "$1"."$TARGET.all".db.idx -d "$1"."$TARGET".db -i "$1"."$TARGET".db.idx
	   rm -f "$1"."$TARGET".db "$1"."$TARGET".db.idx
	fi
	for i in {0..100}; do
          if [ -e "$1"."$TARGET".db.$i ]; then
	   ffindex_build -as "$1"."$TARGET.all".db "$1"."$TARGET.all".db.idx -d "$1"."$TARGET".db.$i -i "$1"."$TARGET".db.idx.$i
           rm -f "$1"."$TARGET".db.$i "$1"."$TARGET".db.idx.$i
          fi
	 done
	if [ -e "$1".db.idx.orig ]; then
	        ffindex_resume.pl "$1".db.idx.orig "$1"."$TARGET".all.db.idx
	else
	        ffindex_resume.pl "$1".db.idx "$1"."$TARGET".all.db.idx
	fi
else
    cat  *.all.db |tr -d '\000' >  results.all.db.hhr
fi

