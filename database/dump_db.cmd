#!/bin/bash
pg_dump -n public -n known_proteins -O -C -x -f annotations.psql annotations
pbzip2 annotations.psql #or just bzip2
