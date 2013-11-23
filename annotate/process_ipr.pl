#!/usr/bin/perl

use strict;
use warnings;
use XML::LibXML::Reader;
use Data::Dumper;

my $xmlfile = 'best_candidates.eclipsed_orfs_removed.pep.fsa.ipr.xml';
print "Processing $xmlfile\n";
my $reader = XML::LibXML::Reader->new(
	location => $xmlfile
) || die;

$reader->read;
$reader->read;
$reader->read;
$reader->nextSibling;
#$reader->nextSibling;
while ( $reader->nextSibling ) {
	warn $reader->localName;
    die Dumper $reader->readInnerXml;
}

sub _processNode {
	my $reader = shift;
    warn Dumper $reader->document->toString(1);
}

