<?php
$sqlQueries = array(
//chado specific
	"cvtermid"=>"select cvterm_id from cvterm where name='%s'",


// the name of the species
	'genus'=>'select genus, species from organism where organism_id = %1$d',

// the sequence of a feature
	'fasta'=>'select uname as feature_id  , nuc_sequence as residues , uname as uniquename from dataset_%1$s.gene where uname = \'%2$s\'',
	/**
	 * @param 1: dataset id 
	 * @param 2: uname
	 */
	'checkTranscript'=>'select uname from dataset_%1$s.transcript where uname=\'%2$s\'',
	/**
	 * transcript details
	 * @param 1: dataset id
	 * @param 2: transcript uname
	 */
	 'transcriptDetails'=>'select uname as name,gene_uname, alias, dbxref_id , translation_table ,cds_start as fmin , cds_stop as fmax, strand from dataset_%1$s.transcript where uname=\'%2$s\'',
	/**
	 * @param 1: dataset id 
	 * @param 2: uname
	 */
	'checkGene'=>'select g.uname, t.uname as tuname from dataset_%1$s.gene g join dataset_%1$s.transcript t on g.uname = t.gene_uname where g.uname=\'%2$s\'',
	/**
	 * @param 1: dataset id
	 * @param 2: uname id
	 */
	'fastaTranscript'=>'select t.uname as feature_id  , nuc_sequence as residues , t.uname as uniquename, cds_start, cds_stop from dataset_%1$s.transcript t join dataset_%1$s.gene g on t.gene_uname = g.uname where t.uname = \'%2$s\'',
	/*
	 * @param 1: id of dataset
	 * @param 2: id of gene
	 */
	'nucleotides'=>'select nuc_sequence from dataset_%1$s.gene where uname=\'%2$s\'',
	/**
	 * get all datasets
	 * @param 1: owner name
	 */
	// 'datasets'=>'select * from datasets where owner =\'%1$s\' and dataset_id = %2$s',
	'datasets'=>'select * from datasets where owner =\'%1$s\'',
	/**
	 * @param 1: dataset id
	 * @param 2: transcript id
	 */
	'gene'=>'select gene_uname from dataset_%1$s.transcript where uname =\'%2$s\'',
// _id is a unique object identifier. It might be required that it is an integer

	'organismLibraries'=>'select l.library_id from library l JOIN cvterm c ON c.cvterm_id=l.type_id JOIN organism o ON l.organism_id=o.organism_id where library_id in ( select distinct(library_id) from library_feature ) and o.organism_id = %1$d',
	/**
	 * get owner for a dataset
	 */
	'getOwner'=>'select owner from datasets where dataset_id in %1$s',
	'library' => array(
	/**
	 * get the total number of trancsript that do not have a uniprot hit
	 * @param 1: dataset id
	 * @param 2: cv id
	 */
	 'totalNoHits'=>'select %2$s cv_id, 1 as cvterm_id, COUNT(*), \'no hits\' as name from dataset_%1$s.transcript where uname not in ( select distinct(transcript_uname) from dataset_%1$s.inference_transcript )',
	/**
	 * query to fill metadata panel
	 * @param 1: dataset id
	 */
	 'metadataDataset'=>'select description as description,species_name as "species name",library_uname as "library name",type as "library type",date_created "date created" from datasets where dataset_id=%1$d',
	/**
	 * @param 1: dataset id
	 */
  	  'metadataCvterm'=>'select dataset_id as dsid, \'species\' as vocabulary, species_name as term, description as selection from datasets where dataset_id = %1$s',
  	/**
	 * query to fill metadata panel
	 * @param 1: dataset id
	 */
	 'metadataDataset'=>'select description as description,species_name as "species name",description as "library name",type as "library type",date_created "date created" from datasets where dataset_id=%1$d',
	 /**
	  * total number of gene/contigs in a file
	  * @param 1: dataset id
	  * @param 2: selection name
	  */
	 'contigCount'=>'select count(*) as term, \'total number of contigs\' as vocabulary, \'%2$s\' as selection from dataset_%1$s.gene',
 	 /**
	  * query to fill metadata panel
	  * @param 1: dataset id
	  * @param 2: selection name 
	  */	 
	 'transcriptCount'=>'select count(*) as term, \'total number of transcripts\' as vocabulary, \'%2$s\' as selection from dataset_%1$s.transcript',
	  /**
	   * @param 1: faceting query string
	   * @param 2: GO class name i.e. F, M, P 
	   * @param 3: cv_id assigned
	   * @param 4: dataset id
	   */
	  'GOSummary'=>'select %3$s cv_id, go_id as cvterm_id, COUNT(go_id), name from (select distinct ON (transcript_uname,go.go_id) transcript_uname,uniprot_id,go.go_id,go.name from known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%4$s.inference_transcript it ON it.known_protein_id=ga.uniprot_id where it.inference_hit_rank=1 AND class=\'%2$s\' %1$s) s group by go_id,name',
	  /**
	   * @param 1: dataset id
	   * @param 2: transcript id 
	   */
	   'transcriptGO'=>'select transcript_uname,go_id as id,text || \' (\' || count || \')\' as text,leaf, lpad(\'\' || go_id || \'\',7,\'0\') as id, linkout.urlprefix as href, text as msg from (select transcript_uname,go.go_id,go.name as text, \'true\' leaf,count(go.go_id) from known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%1$s.inference_transcript it ON it.known_protein_id=ga.uniprot_id where it.inference_hit_rank=1 AND transcript_uname=\'%2$s\' group by transcript_uname,go.go_id,go.name) s, linkout where linkout.type=\'GO\'',
	  /**
	   * @param 1: faceting query string 
	   * @param 2: cv_id assigned
	   * @param 3: dataset id
	   */
	  'KEGGSummary'=>'select %2$s cv_id, pathway_id as cvterm_id, COUNT(pathway_id), name from (select distinct ON (transcript_uname,kegg.pathway_id) transcript_uname,uniprot_id,kegg.pathway_id,kegg.description as name from known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kegg ON kegg.pathway_id=kpa.pathway_id JOIN dataset_%3$s.inference_transcript it ON it.known_protein_id=kpa.uniprot_id where it.inference_hit_rank=1  %1$s) s group by pathway_id,name',
  	  /**
	   * @param 1: dataset id
	   * @param 2: transcript id 
	   */
	   'transcriptKEGG'=>'select transcript_uname,pathway_id,pathway_id as id, text || \' (\' || count || \')\' as text,leaf, linkout.urlprefix as href, text as msg from (select transcript_uname,kegg.pathway_id,kegg.description as text, \'true\' leaf, count(kegg.pathway_id) from known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kegg ON kegg.pathway_id=kpa.pathway_id JOIN dataset_%1$s.inference_transcript it ON it.known_protein_id=kpa.uniprot_id where it.inference_hit_rank=1 AND transcript_uname=\'%2$s\' group by transcript_uname,kegg.pathway_id,text) s, linkout where linkout.type=\'Pathway\'',
  	  /**
	   * @param 1: faceting query string 
	   * @param 2: cv_id assigned
	   * @param 3: dataset id
	   */
	  'KOSummary'=>'select %2$s cv_id, ko_id as cvterm_id, COUNT(ko_id), name from (select distinct ON (transcript_uname,ko.ko_id) transcript_uname,uniprot_id,ko.ko_id,ko.description as name from known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ko.ko_id=ka.ko_id JOIN dataset_%3$s.inference_transcript it ON it.known_protein_id=ka.uniprot_id where it.inference_hit_rank=1  %1$s) s group by ko_id,name',
  	  /**
	   * @param 1: dataset id
	   * @param 2: transcript id 
	   */
	  'transcriptKO'=>'select transcript_uname,ko_id,ko_id as id,text || \' (\' || count || \')\' as text,leaf, linkout.urlprefix as href, text as msg from (select transcript_uname,ko.ko_id,ko.description as text, count(ko.ko_id), \'true\' leaf from known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ko.ko_id=ka.ko_id JOIN dataset_%1$s.inference_transcript it ON it.known_protein_id=ka.uniprot_id where it.inference_hit_rank=1 AND transcript_uname=\'%2$s\' group by transcript_uname,ko.ko_id,text) s, linkout where linkout.type=\'KO\'',
	  /**
	   * @param 1: faceting query string 
	   * @param 2: cv_id assigned
	   * @param 3: dataset id
	   */
	  'ENZYMESummary'=>'select %2$s cv_id, ec_id as cvterm_id, COUNT(ec_id), name from (select distinct ON (transcript_uname,e.ec_id) transcript_uname,uniprot_id,e.ec_id,e.primary_name as name from known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON e.ec_id=ea.ec_id JOIN dataset_%3$s.inference_transcript it ON it.known_protein_id=ea.uniprot_id where it.inference_hit_rank=1 %1$s) s group by ec_id,name',
  	  /**
	   * @param 1: dataset id
	   * @param 2: transcript id 
	   */
	  'transcriptENZYME'=>'select transcript_uname,ec_id,ec_id as id,text || \' (\' || count || \')\' as text,leaf, linkout.urlprefix as href, text as msg from (select transcript_uname, e.ec_id, e.primary_name as text, count(e.ec_id), \'true\' leaf from known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON e.ec_id=ea.ec_id JOIN dataset_%1$s.inference_transcript it ON it.known_protein_id=ea.uniprot_id where it.inference_hit_rank=1 AND transcript_uname=\'%2$s\' group by transcript_uname,e.ec_id,e.primary_name) s, linkout where linkout.type=\'EC\'',
	  /**
	   * @param 1: faceting query string 
	   * @param 2: cv_id assigned
	   * @param 3: dataset id
	   */
	  'EGGNOGSummary'=>'select %2$s cv_id, eggnog_id as cvterm_id, COUNT(eggnog_id), name from (select distinct ON (transcript_uname,e.eggnog_id) transcript_uname,uniprot_id,e.eggnog_id,e.description as name from known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON e.eggnog_id=ea.eggnog_id JOIN dataset_%3$s.inference_transcript it ON it.known_protein_id=ea.uniprot_id where it.inference_hit_rank=1 %1$s) s group by eggnog_id,name',
  	  /**
	   * @param 1: dataset id
	   * @param 2: transcript id 
	   */
	  'transcriptEGGNOG'=>'select transcript_uname,eggnog_id as id, text || \' (\'|| count || \')\' as text,leaf, text as msg from (select transcript_uname,e.eggnog_id,e.description as text, \'true\' leaf , count(e.eggnog_id) from known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON e.eggnog_id=ea.eggnog_id JOIN dataset_%1$s.inference_transcript it ON it.known_protein_id=ea.uniprot_id where it.inference_hit_rank=1 AND transcript_uname=\'%2$s\' group by transcript_uname,e.eggnog_id,text) s',
	  /**
	   * @param 1: dataset id
	   * @param 2: cv id
	   */
	   'NoHitsSummary'=>'select %2$s cv_id, 1 as cvterm_id, COUNT(*), \'no hits\' as name from dataset_%1$s.transcript where uname not in ( select distinct(transcript_uname) from dataset_%1$s.inference_transcript )',
	  /**
	   * @param 1: subquery that lists transcripts
	   */
	   'facetFilterCondition'=>' and transcript_uname in (%1$s)',
   	  /**
	   * @param 1: subquery that lists transcripts
	   */
	   'unameFilter'=>' where uname in (%1$s)',
	  'GoSummaryFacets'=>'select 1 cv_id, go_id as cvterm_id, COUNT(go_id), name from ((select distinct ON (transcript_uname,go.go_id) transcript_uname,uniprot_id,go.go_id,go.name from known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%2$s.inference_transcript it ON it.known_protein_id=ga.uniprot_id where it.inference_hit_rank=1 and transcript_uname in (%1$s))) s group by go_id, name',
	  /**
	   * @param 1: owner name
	   */
	  'tree'=>'select dataset_id as id , description as text , \'true\' as leaf , species_name as organism_id, species_name as species from public.datasets  where owner =\'%1$s\' order by species_name',
		'totalUncategorised'=>'select count(*) from feature f join cvterm cvt on cvt.cvterm_id = f.type_id and f.feature_id not in ( select distinct l.feature_id from library_feature_cvterm_mat l where l.library_id  in %3$s )  where type_id = %1$d and organism_id = %2$d',
 		'uncategorised'=>'select feature_id, f.name, uniquename from feature f join cvterm cvt on cvt.cvterm_id = f.type_id and f.feature_id not in ( select distinct l.feature_id from library_feature_cvterm_mat l where l.library_id  in %3$s )  where type_id = %1$d and organism_id = %2$d limit %4$d offset %5$d',
 		/**
		 * @param 1: dataset id
		 * @param 2: facet query
		 * @param 3: paging values
		 */
 		'items'=>'select \'dataset_%1$s.\' || uname as uname, gene_uname from dataset_%1$s.transcript %2$s %3$s',
 		/**
		 * 
		 */
		 'itemsUnion'=>'select uname as feature_id , uname as name, uname as uniquename from (%1$s) s %2$s',
 		/**
		 * @param 1: dataset id
		 */
  		'transcripts'=>'select uname from dataset_%1$s.transcript %2$s',
  		/**
		 * @param 1: sub query
		 */
  		'count'=>'select count(*) from (%1$s) s',
 		/**
		 * @param 1: dataset id
		 * @param 2: facet query string i.e. filled itemsFacets query.
		 */
 		'itemsCount'=>'select count(*) from dataset_%1$s.transcript %2$s',
 		/**
		 * @param 1: coma separated go_id list
		 * @param 2: dataset id
		 */ 		
 		'goTranscripts'=>'select distinct(transcript_uname) from known_proteins.go_assoc ga JOIN known_proteins.go ON go.go_id=ga.go_id JOIN dataset_%2$s.inference_transcript it ON it.known_protein_id=ga.uniprot_id where it.inference_hit_rank=1 and ga.go_id = %1$s',
 		/**
		 * @param 1: coma separated go_id list
		 * @param 2: dataset id
		 */ 		
 		'keggTranscripts'=>'select distinct(transcript_uname) from known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kp ON kpa.pathway_id=kp.pathway_id JOIN dataset_%2$s.inference_transcript it ON it.known_protein_id=kpa.uniprot_id where it.inference_hit_rank=1 and kp.pathway_id=\'%1$s\'',
 		/**
		 * @param 1: coma separated go_id list
		 * @param 2: dataset id
		 */ 		
 		'koTranscripts'=>'select distinct(transcript_uname) from known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ka.ko_id=ko.ko_id JOIN dataset_%2$s.inference_transcript it ON it.known_protein_id=ka.uniprot_id where it.inference_hit_rank=1 and ko.ko_id=\'%1$s\'',
 		/**
		 * @param 1: coma separated go_id list
		 * @param 2: dataset id
		 */ 		
 		'enzymeTranscripts'=>'select distinct(transcript_uname) from known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON ea.ec_id=e.ec_id JOIN dataset_%2$s.inference_transcript it ON it.known_protein_id=ea.uniprot_id where it.inference_hit_rank=1 and e.ec_id = \'%1$s\'',
 		/**
		 * @param 1: coma separated go_id list
		 * @param 2: dataset id
		 */ 		
 		'eggnogTranscripts'=>' select distinct(transcript_uname) from known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON ea.eggnog_id=e.eggnog_id JOIN dataset_%2$s.inference_transcript it ON it.known_protein_id=ea.uniprot_id where it.inference_hit_rank=1 and ea.eggnog_id=\'%1$s\'',
 		/**
		 * 
		 */
		 'nohitsTranscripts'=>'select uname from dataset_%1$s.transcript where uname not in ( select distinct(transcript_uname) from dataset_%1$s.inference_transcript )'
	),

	'species' => array(
		/**
		 * get all datasets
		 * param 1: species name
		 * param 2: owner name
		 */
		'datasets'=>'select * from datasets where species_name=\'%1$s\' and owner=\'%2$s\'',
		'features' => 'select feature_id from feature where organism_id in (%1$s) and type_id = (select cvterm_id from cvterm where name = \'polypeptide\')',
		'featuresWType'=>'select distinct feature_id from feature where organism_id in (%1$s) and  type_id in ( select cvterm_id from cvterm where name like \'%2$s%%\')',
		'featuresWCvtermId'=>'select feature_id from feature_cvterm where cvterm_id= %2$d and feature_id in ( select feature_id from feature where organism_id in (%1$s) )',
		'cv'=>'select cv_id, name, name as title ,  array_to_string(array_agg( dsid),\',\'), \'cv_term\' as get from (select distinct( cv_id ) , cv_name as name , organism_id as dsid from cvterm_organism_mat join cv on cv.name = cv_name where organism_id %1$s) sq group by cv_id , name',
		'dbxref'=>'select dbxref.accession as id,dbxref.description as name, count(*) as count from dbxref_organism_mat d join dbxref on d.dbxref_id=dbxref.dbxref_id join db on dbxref.db_id=db.db_id  where organism_id = %1$s group by dbxref.accession, dbxref.description',
		'cvtermSummaryFacets'=>'select cvterm_id , cvterm_name as name  , count(*)  from ( select distinct feature_id as fid , * from cvterm_organism_mat where organism_id = %1$d and cv_name = \'%2$s\' ) l where %3$s group by l.cvterm_id, l.cvterm_name order by count DESC',
		'featureList'=>'select f.feature_id , f.name, f.uniquename, cvt.cvterm_id, cvt.name as type from feature f join cvterm cvt on cvt.cvterm_id = f.type_id  and f.feature_id in ( %1$s ) %2$s %3$s',
		'tree'=>'select organism_id as id, genus, species, \'true\' as leaf from organism order by genus, species'
	),

	'feature' => array(
	  'total'=>'select count(*) from feature',
	  /**
	   * resolve uniprot url for a given transcript
	   * @param 1: transcript uname
	   * @param 2: dataset id
	   */
	   'tUniprotUrl'=>'select distinct \'uniprot\' as term, \'http://www.uniprot.org/uniprot/\' || known_protein_id as value, known_protein_id, query_end as fmax, query_start as fmin from dataset_%2$s.inference_transcript WHERE dataset_%2$s.inference_transcript.transcript_uname =\'%1$s\' UNION   select dataset_%2$s.db.uname as term ,dataset_%2$s.db.urlprefix || dataset_%2$s.dbxref.accession as value, \'\' as known_protein_id , -10 as fmin, -10 as fmax from dataset_%2$s.dbxref JOIN dataset_%2$s.db on dataset_%2$s.db.db_id = dataset_%2$s.dbxref.db_id JOIN dataset_%2$s.transcript ON dataset_%2$s.transcript.dbxref_id = dataset_%2$s.dbxref.dbxref_id  WHERE dataset_%2$s.transcript.uname = \'%1$s\'',
	  /**
	   * resolve uniprot url for a given gene
	   * @param 1: dataset id
	   * @param 2: gene name
	   */
	   'gUniprotUrl'=>'select name as term , urlprefix || \'%2$s\' as value, \'%2$s\' as gene from linkout where (dataset_id is NULL or dataset_id =%1$s) and type=\'gene\'',
	  'cvterm'=>'',
	  'propSql'=>'',
	  'dbxref'=>'',
	  'filterLibraries'=>'',
	  'filterSrcFeature'=>'',
	  'countFiltered'=>'',
	  'featureFiltered'=>'',
	  /*
	   * @param 1: dataset id
	   * @param 2: filtering terms
	   */
	  'withoutFilter'=>'select uname as feature_id, uname as name, uname as uniquename, nuc_sequence, \'nucleotide\' as type from dataset_%1$s.gene %2$s',
	  /*
	   * @param 1: dataset id
	   * @param 2: filtering terms
	   * @param 3: organism id i.e. species name
	   */
	  'transcriptFilter'=>'select \'dataset_%1$s.\' || t.uname as feature_id, t.uname as name, t.uname as uniquename, g.nuc_sequence, \'transcript\' as type, \'dataset_%1$s.\' || g.uname as srcfeature, \'%3$s\' as organism_id, \'%1$s\' as datasetid, cds_start, cds_stop from dataset_%1$s.gene g join dataset_%1$s.transcript t on g.uname = t.gene_uname %2$s',
  	  /*
	   * @param 1: dataset id
	   * @param 2: filtering terms
	   * @param 3: organism id i.e. species name
	   */
	  'geneFilter'=>'select \'dataset_%1$s.\' || t.uname as feature_id, t.uname as name, t.uname as uniquename, t.nuc_sequence, \'gene\' as type, \'%3$s\' as organism_id, \'%1$s\' as datasetid  from dataset_%1$s.gene t %2$s',
	  /*
	   * @param 1: dataset id
	   * @param 2: filter string
	   */
	  'countWithout'=>'select uname from dataset_%1$s.gene %2$s',
  	  /*
	   * @param 1: dataset id
	   * @param 2: filter string
	   */
	  'countTranscript'=>'select uname from dataset_%1$s.transcript t %2$s',
	  /*
	   * @param 1: dataset id
	   * @param 2: filter string
	   */
	  'countGene'=>'select uname from dataset_%1$s.gene t %2$s',
	  /**
	   * @param 1: union query
	   * @param 2: paging string
	   */
	   'unionQuery'=>'select * from (%1$s) as a %2$s',
	   /**
	   	* @param 1: union query 
	    */
	    'unionCount'=>'select count(*) from (%1$s) as a',
	    /**
		 * @param 1: transcript uname
		 * @param 2: dataset id
		 */
		 'networkTree'=>'select network_id as text,network_id as id, network_id as networkid, \'true\' as leaf,\'true\' as expanded from dataset_%2$s.network where network_id in ( select distinct(network_id) from dataset_%2$s.transcript_network where transcript_uname=\'%1$s\')',
 	    /**
		 * @param 1: network id
		 * @param 2: dataset id
		 */
		 'networkJson'=>'select json from dataset_%2$s.network where network_id = %1$s',
		 /**
		  * @param 1: dataset id
		  * @param 2: network id
		  */
		  'networktranscripts'=>'select transcript_uname as name, \'%1$s\' dataset_id from dataset_%1$s.transcript_network where network_id = %2$s'
	),
	/**
	 * sql for differential expression
	 */
	'de'=>array(
		'experiments'=>'select \'true\' as leaf, description as text, d.deid as pid, g.id as gid from de d join graphdata g on g.deid = d.deid',
		/**
		 * @param 1: id 
		 * @param 2: differential expression id
		 */
		'graphdata'=>'select json,type from graphdata where id=%1$s and deid=%2$s'
	),
//genome browser query
	'gb'=>array (
	/**
	 * @param 1: dataset id
	 * @param 2: gene id
	 */
	'sourceFeatures'=>'select uname as name, cds_start as fmin,cds_stop as fmax from dataset_%1$s.transcript where gene_uname=\'%2$s\'',
	/**
	 * @param 1: dataset id
	 * @param 2: transcript id
	 */  	  
	'knownProteinHits'=>'select query_start as fmin, query_end as fmax, count(known_protein_id),array_to_string(array_agg(known_protein_id),\',\') as name from dataset_%1$s.inference_transcript where transcript_uname=\'%2$s\' group by fmin,fmax  order by fmin ASC,fmax DESC'
    ),
    'annotations'=>array(
    /**
	 * @param 1: dataset id
	 */
    'uniprotHits'=>'SELECT known_protein_id from dataset_%1$s.inference_transcript where inference_hit_rank=1',
    /**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'goauto'=>'select distinct (known_proteins.go.go_id,name), \'1\' as cvid, known_proteins.go.go_id as cvtermid, name as cvtermname, \'GO\' as cvname, length(name) lname, known_proteins.go.go_id from known_proteins.go join known_proteins.go_assoc ON known_proteins.go.go_id=known_proteins.go_assoc.go_id where %1$s AND uniprot_id IN (%2$s) group by known_proteins.go.go_id,name order by lname ASC limit 10',
    /**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'koauto'=>'select distinct(description,ko.ko_id) ,\'7\' as cvid,ko.ko_id as cvtermid, description as cvtermname, \'KO\' as cvname,length(description)  from known_proteins.ko_assoc ka JOIN known_proteins.ko ko ON ko.ko_id=ka.ko_id where description ilike \'%%%1$s%%\' or ko.ko_id = \'%1$s\' and uniprot_id IN (%2$s) order by length ASC limit 10',
    /**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'eggnogauto'=>'select distinct(description,e.eggnog_id),\'6\' as cvid, e.eggnog_id as cvtermid, description as cvtermname, \'Eggnog\' as cvname,length(description) from  known_proteins.eggnog_assoc ea JOIN known_proteins.eggnog e ON e.eggnog_id=ea.eggnog_id  where description ilike \'%%%1$s%%\' or e.eggnog_id = \'%1$s\' and uniprot_id IN (%2$s) order by length ASC limit 10',
    /**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'enzymeauto'=>'select distinct(e.ec_id,primary_name),\'5\' as cvid,e.ec_id as cvtermid, primary_name as cvtermname, \'Enzyme\' as cvname,length(primary_name)  from known_proteins.enzyme_assoc ea JOIN known_proteins.enzyme e ON e.ec_id=ea.ec_id where primary_name ilike \'%%%1$s%%\' or e.ec_id = \'%1$s\' and uniprot_id IN (%2$s) order by length ASC limit 10',
    /**
	 * @param 1: search query
	 * @param 2: uniprot id hits sql
	 */
		'pathwayauto'=>'select distinct(kegg.pathway_id,description),\'4\' as cvid, kegg.pathway_id as cvtermid, description as cvtermname, \'Pathway\' as cvname,length(description) from known_proteins.kegg_pathway_assoc kpa JOIN known_proteins.kegg_pathway kegg ON kegg.pathway_id=kpa.pathway_id  where description ilike \'%%%1$s%%\' or kegg.pathway_id = \'%1$s\' and uniprot_id IN (%2$s) order by length ASC limit 10'
	),
	'config'=>array(
	/**
	 * @param 1:dataset id
	 */
	'linkout'=>'select linkout_id , name , description , dataset_id , type , urlprefix || \'$GENE$\' as url, \'GENE\' placeholder from linkout where dataset_id is NULL or dataset_id =%1$s'
	)
);
?>
