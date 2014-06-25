<?php
$sqlQueries = array(
     'get_dataset_info' =>'SELECT description,species_name,library_uname FROM datasets WHERE dataset_id = %1$d',

//chado specific
	"cvtermid"=>'SELECT cvterm_id FROM cvterm WHERE name=\'%1$s\'',


// the name of the species
	'genus'=>'SELECT genus, species FROM organism WHERE organism_id = %1$d',

// the sequence of a feature
	'fastaGene'=>'SELECT uname AS feature_id, nuc_sequence AS residues, uname AS uniquename FROM dataset_%1$d.gene WHERE uname = \'%2$s\'',
/**
 * @param 1: dataset id
 * @param 2: uname
 */
	'checkTranscript'=>'SELECT uname FROM dataset_%1$d.cds WHERE uname=\'%2$s\'',
/**
 * cds details
 * @param 1: dataset id
 * @param 2: cds uname
 */
	 'cdsDetails'=>'SELECT uname AS name,transcript_uname, alias, dbxref_id , translation_table ,cds_start AS fmin , cds_stop AS fmax, strand FROM dataset_%1$d.cds WHERE uname=\'%2$s\'',
/**
 * @param 1: dataset id
 * @param 2: uname id
 */
	'fastaCDS'=>'SELECT c.uname AS feature_id  , nuc_sequence AS residues , c.uname AS uniquename, cds_start, cds_stop FROM dataset_%1$d.cds c JOIN dataset_%1$d.transcript t ON c.transcript_uname = t.uname WHERE c.uname = \'%2$s\'',
	'fastaTranscript'=>'SELECT t.uname AS feature_id , nuc_sequence AS residues, t.uname AS uniquename FROM dataset_%1$d.transcript t WHERE t.uname = \'%2$s\'',
/*
 * @param 1: id of dataset
 * @param 2: id of transcript
 */
	'getTranscriptSequence'=>'SELECT nuc_sequence FROM dataset_%1$d.transcript WHERE uname=\'%2$s\'',
	'getGeneSequence'=>'SELECT nuc_sequence FROM dataset_%1$d.gene WHERE uname=\'%2$s\'',
/**
 * get all datasets
 * @param 1: owner name
 */
	'datasets'=>'SELECT * FROM datasets WHERE owner =\'%1$s\'',
/**
 * @param 1: dataset id
 * @param 2: cds id
 */
	'getgene'=>'SELECT gene_uname FROM dataset_%1$d.transcript_gene WHERE transcript_uname = \'%2$s\'',
	'gettranscripts'=>'SELECT transcript_uname as name, start as fmin, stop as fmax, strand, gene_uname FROM dataset_%1$d.transcript_gene WHERE gene_uname = \'%2$s\'',
	'organismLibraries'=>'SELECT dataset_id FROM datasets WHERE species_name = \'%1$s\'',
/**
 * get owner for a dataset
 */
	'getOwner'=>'SELECT owner FROM datasets WHERE dataset_id in %1$s',
    'getOwner_species'=>'SELECT owner FROM datasets WHERE species_name ~* \'%1$s\'',
	'library' => array(
/**
 * get the total number of trancsript that do not have a uniprot hit
 * @param 1: dataset id
 * @param 2: cv id
 */
	 'totalNoHits'=>'SELECT %2$s cv_id, 0 AS cvterm_id, COUNT(*), \'-No hit\' AS name FROM dataset_%1$d.cds WHERE uname not in ( SELECT distinct(cds_uname) FROM dataset_%1$d.inference_cds )',
/**
 * query to fill metadata panel
 * @param 1: dataset id
 */
	 'metadataDataset'=>'SELECT description AS description,species_name AS "species name",library_uname AS "library name",type AS "library type",date_created "date created" FROM datasets WHERE dataset_id = %1$d',
/**
 * @param 1: dataset id
 */
  	  'metadataCvterm'=>'SELECT dataset_id AS dsid, \'species\' AS vocabulary, species_name AS term, description AS selection FROM datasets WHERE dataset_id = %1$d',
/**
 * query to fill metadata panel
 * @param 1: dataset id
 */
	 'metadataDataset'=>'SELECT description AS description,species_name AS "species name",description AS "library name",type AS "library type",date_created "date created" FROM datasets WHERE dataset_id = %1$d',
/**
 * total number of transcript/contigs in a file
 * @param 1: dataset id
 * @param 2: selection name
 */
	 'contigCount'=>'SELECT count(*) AS term, \'total number of genes/contigs\' AS vocabulary FROM dataset_%1$d.transcript',
/**
 * query to fill metadata panel
 * @param 1: dataset id
 * @param 2: selection name
 */
	 'cdsCount'=>'SELECT count(*) AS term, \'total number of coding transcripts\' AS vocabulary FROM dataset_%1$d.cds',
/**
 * @param 1: faceting query string
 * @param 2: GO class name i.e. F, M, P
 * @param 3: cv_id assigned
 * @param 4: dataset id
 */
	  'GOSummary'=>'SELECT %3$s cv_id, go_id AS cvterm_id, COUNT(go_id), name FROM (SELECT distinct ON (cds_uname,go.go_id) cds_uname,uniprot_id,go.go_id,go.name FROM known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%4$d.inference_cds it ON it.known_protein_id=ga.uniprot_id WHERE class=\'%2$s\' %1$s) s group by go_id,name',
/**
 * @param 1: dataset id
 * @param 2: cds id
 */
	   'getGO'=>'SELECT cds_uname,go_id AS id,text || \' (\' || count || \')\' AS text,leaf, lpad(\'\' || go_id || \'\',7,\'0\') AS id, linkout.urlprefix AS href, text AS msg FROM (SELECT cds_uname,go.go_id,go.name AS text, \'true\' leaf,count(go.go_id) FROM known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%1$d.inference_cds it ON it.known_protein_id=ga.uniprot_id WHERE cds_uname=\'%2$s\' group by cds_uname,go.go_id,go.name) s, linkout WHERE linkout.dataset_id IS NULL AND linkout.name=\'GO\'',
/**
 * @param 1: faceting query string
 * @param 2: cv_id assigned
 * @param 3: dataset id
 */
	  'KEGGSummary'=>'SELECT %2$s cv_id, pathway_id AS cvterm_id, COUNT(pathway_id), name FROM (SELECT distinct ON (cds_uname,kegg.pathway_id) cds_uname,uniprot_id,kegg.pathway_id,kegg.description AS name FROM known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kegg ON kegg.pathway_id=kpa.pathway_id JOIN dataset_%3$d.inference_cds it ON it.known_protein_id=kpa.uniprot_id %1$s) s group by pathway_id,name',
/**
 * @param 1: dataset id
 * @param 2: cds id
 */
	   'getKEGG'=>'SELECT cds_uname,pathway_id,pathway_id AS id, text || \' (\' || count || \')\' AS text,leaf, linkout.urlprefix AS href, text AS msg FROM (SELECT cds_uname,kegg.pathway_id,kegg.description AS text, \'true\' leaf, count(kegg.pathway_id) FROM known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kegg ON kegg.pathway_id=kpa.pathway_id JOIN dataset_%1$d.inference_cds it ON it.known_protein_id=kpa.uniprot_id WHERE cds_uname=\'%2$s\' group by cds_uname,kegg.pathway_id,text) s, linkout WHERE linkout.dataset_id IS NULL AND linkout.name=\'Pathway\'',
/**
 * @param 1: faceting query string
 * @param 2: cv_id assigned
 * @param 3: dataset id
 */
	  'KOSummary'=>'SELECT %2$s cv_id, ko_id AS cvterm_id, COUNT(ko_id), name FROM (SELECT distinct ON (cds_uname,ko.ko_id) cds_uname,uniprot_id,ko.ko_id,ko.description AS name FROM known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ko.ko_id=ka.ko_id JOIN dataset_%3$d.inference_cds it ON it.known_protein_id=ka.uniprot_id %1$s) s group by ko_id,name',
/**
 * @param 1: dataset id
 * @param 2: cds id
 */
	  'getKO'=>'SELECT cds_uname,ko_id,ko_id AS id,text || \' (\' || count || \')\' AS text,leaf, linkout.urlprefix AS href, text AS msg FROM (SELECT cds_uname,ko.ko_id,ko.description AS text, count(ko.ko_id), \'true\' leaf FROM known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ko.ko_id=ka.ko_id JOIN dataset_%1$d.inference_cds it ON it.known_protein_id=ka.uniprot_id WHERE cds_uname=\'%2$s\' group by cds_uname,ko.ko_id,text) s, linkout WHERE linkout.dataset_id IS NULL AND linkout.name=\'KO\'',
/**
 * @param 1: faceting query string
 * @param 2: cv_id assigned
 * @param 3: dataset id
 */
	  'ENZYMESummary'=>'SELECT %2$s cv_id, ec_id AS cvterm_id, COUNT(ec_id), name FROM (SELECT distinct ON (cds_uname,e.ec_id) cds_uname,uniprot_id,e.ec_id,e.primary_name AS name FROM known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON e.ec_id=ea.ec_id JOIN dataset_%3$d.inference_cds it ON it.known_protein_id=ea.uniprot_id %1$s) s group by ec_id,name',
/**
 * @param 1: dataset id
 * @param 2: cds id
 */
	  'getENZYME'=>'SELECT cds_uname,ec_id,ec_id AS id,text || \' (\' || count || \')\' AS text,leaf, linkout.urlprefix AS href, text AS msg FROM (SELECT cds_uname, e.ec_id, e.primary_name AS text, count(e.ec_id), \'true\' leaf FROM known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON e.ec_id=ea.ec_id JOIN dataset_%1$d.inference_cds it ON it.known_protein_id=ea.uniprot_id WHERE cds_uname=\'%2$s\' group by cds_uname,e.ec_id,e.primary_name) s, linkout WHERE linkout.dataset_id IS NULL AND linkout.name=\'EC\'',
/**
 * @param 1: faceting query string
 * @param 2: cv_id assigned
 * @param 3: dataset id
 */
	  'EGGNOGSummary'=>'SELECT %2$s cv_id, eggnog_id AS cvterm_id, COUNT(eggnog_id), name FROM (SELECT distinct ON (cds_uname,e.description) cds_uname,uniprot_id,e.eggnog_id,e.description AS name FROM known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON e.eggnog_id=ea.eggnog_id JOIN dataset_%3$d.inference_cds it ON it.known_protein_id=ea.uniprot_id WHERE e.description IS NOT NULL %1$s) s group by eggnog_id,name',
/**
 * @param 1: dataset id
 * @param 2: cds id
 */
	  'getEGGNOG'=>'SELECT cds_uname,eggnog_id AS id, text || \' (\'|| count || \')\' AS text,leaf, text AS msg FROM (SELECT cds_uname,e.eggnog_id,e.description AS text, \'true\' leaf , count(e.eggnog_id) FROM known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON e.eggnog_id=ea.eggnog_id JOIN dataset_%1$d.inference_cds it ON it.known_protein_id=ea.uniprot_id WHERE cds_uname=\'%2$s\' group by cds_uname,e.eggnog_id,text) s',
/**
 * @param 1: dataset id
 * @param 2: cv id
 */
	   'NoHitsSummary'=>'SELECT %2$s cv_id, 0 AS cvterm_id, COUNT(*), \'-No hit\' AS name FROM dataset_%1$d.cds WHERE uname not in ( SELECT distinct(cds_uname) FROM dataset_%1$d.inference_cds )',
/**
 * @param 1: subquery that lists cdss
 */
	   'facetFilterCondition'=>' AND cds_uname IN (%1$s)',
/**
 * @param 1: subquery that lists cdss
 */
	   'unameFilter'=>' WHERE uname in (%1$s)',
	  'GoSummaryFacets'=>'SELECT 1 cv_id, go_id AS cvterm_id, COUNT(go_id), name FROM ((SELECT distinct ON (cds_uname,go.go_id) cds_uname,uniprot_id,go.go_id,go.name FROM known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ga.uniprot_id WHERE cds_uname in (%1$s))) s group by go_id, name',
/**
 * @param 1: owner name
 */
	  'tree'=>'SELECT dataset_id AS id,dataset_id AS dsid , description AS text , \'true\' AS leaf , species_name AS organism_id, species_name AS species FROM public.datasets  WHERE owner =\'%1$s\' ORDER BY species_name',
		'totalUncategorised'=>'SELECT count(*) FROM feature f JOIN cvterm cvt ON cvt.cvterm_id = f.type_id AND f.feature_id not in ( SELECT distinct l.feature_id FROM library_feature_cvterm_mat l WHERE l.library_id IN %3$s )  WHERE type_id = %1$d AND organism_id = %2$d',
 		'uncategorised'=>'SELECT feature_id, f.name, uniquename FROM feature f JOIN cvterm cvt ON cvt.cvterm_id = f.type_id AND f.feature_id not in ( SELECT distinct l.feature_id FROM library_feature_cvterm_mat l WHERE l.library_id IN %3$s )  WHERE type_id = %1$d AND organism_id = %2$d limit %4$d offset %5$d',
/**
 * @param 1: dataset id
 * @param 2: facet query
 * @param 3: paging values
 */
 		'items'=>'SELECT \'dataset_%1$d.\' || uname AS uname, transcript_uname FROM dataset_%1$d.cds %2$s %3$s',
/**
 *
 */
		 'itemsUnion'=>'SELECT uname AS feature_id , uname AS name, uname AS uniquename FROM (%1$s) s %2$s',
/**
 * @param 1: dataset id
 */
  		'cdss'=>'SELECT uname FROM dataset_%1$d.cds %2$s',
/**
 * @param 1: sub query
 */
  		'count'=>'SELECT count(*) FROM (%1$s) s',
/**
 * @param 1: dataset id
 * @param 2: facet query string i.e. filled itemsFacets query.
 */
 		'itemsCount'=>'SELECT count(*) FROM dataset_%1$d.cds %2$s',
		'itemsCountExpression'=>'SELECT count(*) FROM dataset_%1$d.transcript_expression_library %2$s',
/**
 * @param 1: coma separated go_id list
 * @param 2: dataset id
 */
 		'goTranscripts'=>'SELECT distinct(cds_uname) FROM known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ga.uniprot_id WHERE ga.go_id = %1$d',
 		'keggTranscripts'=>'SELECT distinct(cds_uname) FROM known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kp ON kpa.pathway_id=kp.pathway_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=kpa.uniprot_id WHERE kp.pathway_id = \'%1$s\'',
 		'koTranscripts'=>'SELECT distinct(cds_uname) FROM known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ka.ko_id=ko.ko_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ka.uniprot_id WHERE ko.ko_id = \'%1$s\'',
 		'enzymeTranscripts'=>'SELECT distinct(cds_uname) FROM known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON ea.ec_id=e.ec_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ea.uniprot_id WHERE e.ec_id = \'%1$s\' ',
 		'eggnogTranscripts'=>' SELECT distinct(cds_uname) FROM known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON ea.eggnog_id=e.eggnog_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ea.uniprot_id WHERE ea.eggnog_id = \'%1$s\' ',
	     'nohitsTranscripts'=>'SELECT uname FROM dataset_%1$d.cds WHERE uname not in ( SELECT distinct(cds_uname) FROM dataset_%1$d.inference_cds )',
		 
		 'get_expression_library'=>'SELECT * FROM dataset_%1$d.expression_library order by uname',
		 'get_expression_library_metadata'=>'SELECT term,value FROM dataset_%1$d.expression_library_metadata WHERE library_uname=\'%2$s\'',
		 'get_expression_library_metadata_all'=>'SELECT term,value FROM dataset_%1$d.expression_library_metadata',
		 'get_expression_library_transcripts'=>'SELECT transcript_uname FROM dataset_%1$d.transcript_expression_library WHERE library_uname=\'%2$s\'',
		 'get_expression_library_transcripts_all'=>'SELECT transcript_uname FROM dataset_%1$d.transcript_expression_library',
		 'count_expression_library_transcripts'=>'SELECT count(transcript_uname) as count FROM dataset_%1$d.transcript_expression_library WHERE library_uname=\'%2$s\'',
		 'count_expression_library_transcripts_all'=>'SELECT count(transcript_uname) as count FROM dataset_%1$d.transcript_expression_library',
  	     
		 'go_expression_library_Transcripts'=>'SELECT distinct(cds_uname) FROM known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id '
                                                .'JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ga.uniprot_id JOIN dataset_%2$d.transcript_expression_library tel ON tel.transcript_uname=it.cds_uname '
                                                .'WHERE ga.go_id = %1$d %3$s ',
 		'kegg_expression_library_Transcripts'=>'SELECT distinct(cds_uname) FROM known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kp ON kpa.pathway_id=kp.pathway_id '
                                                .'JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=kpa.uniprot_id JOIN dataset_%2$d.transcript_expression_library tel ON tel.transcript_uname=it.cds_uname WHERE kp.pathway_id = \'%1$s\'  %3$s ',
 		'ko_expression_library_Transcripts'=>'SELECT distinct(cds_uname) FROM known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ka.ko_id=ko.ko_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ka.uniprot_id JOIN dataset_%2$d.transcript_expression_library tel ON tel.transcript_uname=it.cds_uname WHERE ko.ko_id = \'%1$s\' %3$s ',
 		'enzyme_expression_library_Transcripts'=>'SELECT distinct(cds_uname) FROM known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON ea.ec_id=e.ec_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ea.uniprot_id JOIN dataset_%2$d.transcript_expression_library tel ON tel.transcript_uname=it.cds_uname WHERE e.ec_id = \'%1$s\' %3$s ',
 		'eggnog_expression_library_Transcripts'=>' SELECT distinct(cds_uname) FROM known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON ea.eggnog_id=e.eggnog_id JOIN dataset_%2$d.inference_cds it ON it.known_protein_id=ea.uniprot_id JOIN dataset_%2$d.transcript_expression_library tel ON tel.transcript_uname=it.cds_uname WHERE ea.eggnog_id = \'%1$s\' %3$s ',
	    'nohits_expression_library_Transcripts'=>'SELECT uname FROM dataset_%1$d.cds c JOIN dataset_%1$d.transcript_expression_library tel ON tel.transcript_uname=c.uname '
                                                .'WHERE TRUE %2$s EXCEPT SELECT distinct(cds_uname) as uname FROM dataset_%1$d.inference_cds ',
        'items_expression_library'=>'SELECT \'dataset_%1$d.\' || transcript_uname AS uname, transcript_uname FROM dataset_%1$d.transcript_expression_library WHERE TRUE %2$s %3$s %4$s',   
        'cdss_expression_library'=>'SELECT transcript_uname as uname FROM dataset_%1$d.transcript_expression_library WHERE TRUE %2$s %3$s',
  		'unameFilter_expression_library'=>' AND transcript_uname in (%1$s)',
		'totalNoHits_expression_library'=>'SELECT %2$s cv_id, 0 AS cvterm_id, COUNT(*), \'-No hit\' AS name FROM dataset_%1$d.transcript_expression_library WHERE %3$s transcript_uname not in ( SELECT distinct(cds_uname) FROM dataset_%1$d.inference_cds )',
	),

	'species' => array(
		 /**
		  * get all datasets
		  * param 1: species name
		  * param 2: owner name
		  */
		'datasets'=>'SELECT * FROM datasets WHERE species_name = \'%1$s\' AND owner =\'%2$s\' ',
		'features' => 'SELECT feature_id FROM feature WHERE organism_id in (%1$s) AND type_id = (SELECT cvterm_id FROM cvterm WHERE name = \'polypeptide\')',
		'featuresWType'=>'SELECT distinct feature_id FROM feature WHERE organism_id in (%1$s) AND  type_id in ( SELECT cvterm_id FROM cvterm WHERE name like %2$s%%)',
		'featuresWCvtermId'=>'SELECT feature_id FROM feature_cvterm WHERE cvterm_id= %2$d AND feature_id in ( SELECT feature_id FROM feature WHERE organism_id in (%1$s) )',
		'cv'=>'SELECT cv_id, name, name AS title ,  array_to_string(array_agg( dsid),\',\'), \'cv_term\' AS get FROM (SELECT distinct( cv_id ) , cv_name AS name , organism_id AS dsid FROM cvterm_organism_mat JOIN cv ON cv.name = cv_name WHERE organism_id %1$s) sq group by cv_id , name',
		'dbxref'=>'SELECT dbxref.accession AS id,dbxref.description AS name, count(*) AS count FROM dbxref_organism_mat d JOIN dbxref ON d.dbxref_id=dbxref.dbxref_id JOIN db ON dbxref.db_id=db.db_id  WHERE organism_id = %1$d group by dbxref.accession, dbxref.description',
		'cvtermSummaryFacets'=>'SELECT cvterm_id , cvterm_name AS name  , count(*) FROM ( SELECT distinct feature_id AS fid , * FROM cvterm_organism_mat WHERE organism_id = %1$d AND cv_name = \'%2$s\' ) l WHERE %3$s group by l.cvterm_id, l.cvterm_name ORDER BY count DESC',
		'featureList'=>'SELECT f.feature_id , f.name, f.uniquename, cvt.cvterm_id, cvt.name AS type FROM feature f JOIN cvterm cvt ON cvt.cvterm_id = f.type_id  AND f.feature_id in ( %1$s ) %2$s %3$s',
		'tree'=>'SELECT organism_id AS id, organism_id AS dsid, genus, species, \'true\' AS leaf FROM organism ORDER BY genus, species'
		),

	'feature' => array(
		'linkout_type' => 'SELECT name,description,urlprefix FROM linkout WHERE dataset_id = %1$d AND type=\'%2$s\'',
	  'dbxref_gene'=>'SELECT db.uname as db_name,db.urlprefix,x.accession FROM dataset_%1$d.gene_dbxref a JOIN dataset_%1$d.dbxref x ON a.dbxref_id=x.dbxref_id JOIN dataset_%1$d.db ON x.db_id=db.db_id WHERE a.gene_uname=\'%2$s\'',
	  'dbxref_transcript'=>'SELECT db.uname as db_name,db.urlprefix,x.accession FROM dataset_%1$d.transcript_dbxref a JOIN dataset_%1$d.dbxref x ON a.dbxref_id=x.dbxref_id JOIN dataset_%1$d.db ON x.db_id=db.db_id WHERE a.transcript_uname=\'%2$s\'',
	   'gUniprotUrl'=>'SELECT name AS term , urlprefix || \'%2$s\' AS value, \'%2$s\' AS transcript FROM public.linkout WHERE (dataset_id is NULL or dataset_id = %1$d) AND type=\'gene\'',
		'transcript_notes' => 'SELECT note from dataset_%1$d.transcript_note WHERE transcript_uname=\'%2$s\'',
		'gene_notes' => 'SELECT note from dataset_%1$d.gene_note WHERE gene_uname=\'%2$s\'',
	  'total'=>'SELECT count(*) FROM feature',
		
	    // used in feature.metadata
	   'UniprotUrl'=>'SELECT urlprefix FROM linkout WHERE name=\'UniProt\'',
		/**
		 * resolve uniprot url for a given transcript
		 * @param 1: dataset id
		 * @param 2: transcript name
		 */
	  'cvterm'=>'',
	  'propSql'=>'',
	  'filterLibraries'=>'',
	  'filterSrcFeature'=>'',
	  'countFiltered'=>'',
	  'featureFiltered'=>'',
		/*
		 * @param 1: dataset id
		 * @param 2: filtering terms
		 */
	  'withoutFilter'=>'SELECT uname AS feature_id, uname AS name, uname AS uniquename, nuc_sequence, \'nucleotide\' AS type FROM dataset_%1$d.transcript %2$s',
		/*
		 * @param 1: dataset id
		 * @param 2: filtering terms
		 * @param 3: organism id i.e. species name
		 */
	  'cdsFilter'=>'SELECT \'dataset_%1$d.\' || c.uname AS feature_id, c.uname AS name, c.uname AS uniquename, t.nuc_sequence, \'cds\' AS type, \'dataset_%1$d.\' || t.uname AS srcfeature, \'%3$s\' AS organism_id, \'%1$s\' AS datasetid, cds_start, cds_stop FROM dataset_%1$d.transcript t JOIN dataset_%1$d.cds c ON t.uname = c.transcript_uname \'%2$s\'',
		/*
		 * @param 1: dataset id
		 * @param 2: filtering terms
		 * @param 3: organism id i.e. species name
		 */
	  'transcriptFilter'=>'SELECT \'dataset_%1$d.\' || uname AS feature_id, uname AS name, uname AS uniquename, nuc_sequence, \'transcript\' AS type, \'%3$s\' AS organism_id, \'%1$s\' AS datasetid FROM dataset_%1$d.transcript %2$s',
	  'geneFilter'=>'SELECT \'dataset_%1$d.\' || uname AS feature_id, uname AS name, uname AS uniquename, nuc_sequence, \'gene\' AS type, \'%3$s\' AS organism_id, \'%1$s\' AS datasetid FROM dataset_%1$d.gene %2$s',
		/*
		 * @param 1: dataset id
		 * @param 2: filter string
		 */
	  'countWithout'=>'SELECT uname FROM dataset_%1$d.transcript %2$s',
		/*
		 * @param 1: dataset id
		 * @param 2: filter string
		 */
	  'countTranscript'=>'SELECT uname FROM dataset_%1$d.cds t %2$s',
		/*
		 * @param 1: dataset id
		 * @param 2: filter string
		 */
	  'countGene'=>'SELECT uname FROM dataset_%1$d.gene %2$s',
		/**
		 * @param 1: union query
		 * @param 2: paging string
		 */
	   'unionQuery'=>'SELECT * FROM (%1$s) AS a %2$s',
		/**
		 * @param 1: union query
		 */
	    'unionCount'=>'SELECT count(*) FROM (%1$s) AS a',
		/**
		 * @param 1: cds uname
		 * @param 2: dataset id
		 */
		 'networkTree'=>'SELECT m.uname as type, m.description as qtip, n.description || \' \' || network_id AS text,network_id AS id, network_id AS networkid, \'true\' AS leaf,\'true\' AS expanded FROM dataset_%2$d.network n JOIN metadata m ON m.metadata_id=n.network_type WHERE network_id in ( SELECT distinct(network_id) FROM dataset_%2$d.cds_network WHERE cds_uname = \'%1$s\')',
		/**
		 * @param 1: network id
		 * @param 2: dataset id
		 */
		 'networkJson'=>'SELECT json FROM dataset_%2$d.network WHERE network_id = %1$d',
		/**
		 * @param 1: dataset id
		 * @param 2: network id
		 */
		  'networkcds'=>'SELECT cds_uname AS name, %1$s dataset_id FROM dataset_%1$d.cds_network WHERE network_id = %2$d',
		  "get_expression_data" => 'SELECT * FROM dataset_%1$d.transcript_expression_library WHERE transcript_uname=\'%2$s\' order by library_uname',
		// only one picture; PNG preferred over SVG (order by)
		  "get_expression_picture" => 'SELECT transcript_uname,timeloaded,image_data,type,format FROM dataset_%1$d.transcript_expression_image WHERE transcript_uname=\'%2$s\' AND type=\'%3$s\' ORDER by format limit 1',
		  "get_one_expression_picture" => 'SELECT transcript_uname,timeloaded,image_data,type,format FROM dataset_%1$d.transcript_expression_image WHERE transcript_expression_id=%2$d',
		  "list_expression_pictures" => 'SELECT transcript_expression_id as expressionid, transcript_expression_id as id,timeloaded as qtip,type,format, type || \' figure \'  || transcript_expression_id   || \' (\' || format || \')\'    as text, \'true\' AS leaf,\'true\' AS expanded FROM dataset_%1$d.transcript_expression_image WHERE transcript_uname=\'%2$s\'',
		  "list_expression_pictures_genes" => 'SELECT transcript_expression_id as expressionid,transcript_expression_id as id,timeloaded as qtip,type,format, type || \' figure \'  || transcript_expression_id   || \' (\' || format || \')\'    as text, \'true\' AS leaf,\'true\' AS expanded FROM dataset_%1$d.transcript_expression_image WHERE transcript_uname IN (%3$s)'
		  ),
		  /**
		   * sql for differential expression
		   */
	'de'=>array(
		'experiments'=>'SELECT \'true\' AS leaf, description AS text, d.deid AS pid, g.id AS gid FROM de d JOIN graphdata g ON g.deid = d.deid',
		  /**
		   * @param 1: id
		   * @param 2: differential expression id
		   */
		'graphdata'=>'SELECT json,type FROM graphdata WHERE id=%1$d AND deid=%2$d'
		),
		//genome browser query
	'gb'=>array (
		/**
		 * @param 1: dataset id
		 * @param 2: transcript id
		 */
	'sourceFeatures'=>'SELECT gene_uname as name,start as fmin,stop as fmax FROM dataset_%1$d.transcript_gene where transcript_uname=\'%2$s\'',
	'childrenFeatures'=>'SELECT transcript_uname as name,start as fmin,stop as fmax FROM dataset_%1$d.transcript_gene where gene_uname=\'%2$s\'',
	//used by genome browser
	'knownProteinHits'=>'SELECT query_start AS fmin, query_end AS fmax, count(known_protein_id),array_to_string(array_agg(known_protein_id),\',\') AS name FROM dataset_%1$d.inference_cds WHERE cds_uname=\'%2$s\' group by fmin,fmax  ORDER BY fmin ASC,fmax DESC'
	),
    'annotations'=>array(
	/**
	 * @param 1: dataset id
	 */
    'uniprotHits'=>'SELECT known_protein_id FROM dataset_%1$d.inference_cds ',
	/**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'goauto'=>'SELECT distinct (known_proteins.go.go_id,name), \'1\' AS cvid, known_proteins.go.go_id AS cvtermid, name AS cvtermname, \'GO\' AS cvname, length(name) lname, known_proteins.go.go_id FROM known_proteins.go JOIN known_proteins.go_assoc ON known_proteins.go.go_id=known_proteins.go_assoc.go_id WHERE %1$s AND uniprot_id IN (%2$s) group by known_proteins.go.go_id,name ORDER BY lname ASC limit %3$d',
	/**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'koauto'=>'SELECT distinct(description,ko.ko_id) ,\'7\' AS cvid,ko.ko_id AS cvtermid, description AS cvtermname, \'KO\' AS cvname,length(description) FROM known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ko.ko_id=ka.ko_id WHERE description ILIKE \'%%%1$s%%\' or ko.ko_id = \'%1$s\' AND uniprot_id IN (%2$s) ORDER BY length ASC limit %3$d',
	/**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'eggnogauto'=>'SELECT distinct(description,e.eggnog_id),\'6\' AS cvid, e.eggnog_id AS cvtermid, description AS cvtermname, \'Eggnog\' AS cvname,length(description) FROM  known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON e.eggnog_id=ea.eggnog_id  WHERE description IS NOT NULL AND (description ILIKE \'%%%1$s%%\' or e.eggnog_id = \'%1$s\') AND uniprot_id IN (%2$s) ORDER BY length ASC limit %3$d',
	/**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'enzymeauto'=>'SELECT distinct(e.ec_id,primary_name),\'5\' AS cvid,e.ec_id AS cvtermid, primary_name AS cvtermname, \'Enzyme\' AS cvname,length(primary_name) FROM known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON e.ec_id=ea.ec_id WHERE primary_name ILIKE \'%%%1$s%%\' OR e.ec_id = \'%1$s\' AND uniprot_id IN (%2$s) ORDER BY length ASC limit %3$d',
	/**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'pathwayauto'=>'SELECT distinct(kegg.pathway_id,description),\'4\' AS cvid, kegg.pathway_id AS cvtermid, description AS cvtermname, \'Pathway\' AS cvname,length(description) FROM known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kegg ON kegg.pathway_id=kpa.pathway_id  WHERE description ILIKE \'%%%1$s%%\' or kegg.pathway_id = \'%1$s\' AND uniprot_id IN (%2$s) ORDER BY length ASC limit %3$d'
		),
	'config'=>array(
		/**
		 * @param 1:dataset id
		 */
	'linkout'=>'SELECT linkout_id , name , description , dataset_id , type , urlprefix || \'$GENE$\' AS url, \'GENE\' placeholder FROM linkout WHERE dataset_id is NULL or dataset_id = %1$d'
	)
	);
	?>
