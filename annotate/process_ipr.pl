#!/usr/bin/perl

=pod


=head1 AUTHORS

 Alexie Papanicolaou

        CSIRO Ecosystem Sciences
        alexie@butterflybase.org

=head1 DISCLAIMER & LICENSE

Copyright 2012-2014 the Commonwealth Scientific and Industrial Research Organization. 
This software is released under the Mozilla Public License v.2.

It is provided "as is" without warranty of any kind.
You can find the terms and conditions at http://www.mozilla.org/MPL/2.0.


=cut

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

