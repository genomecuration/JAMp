#!/bin/bash
pbzip2 -d annotations.psql # or just bzip2 -d
createdb annotations
psql -f annotations.psql annotations
