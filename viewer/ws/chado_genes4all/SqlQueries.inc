<?php
$sqlQueries = array(
//chado specific
	"cvtermid"=>"select cvterm_id from cvterm where name='%s'",


// the name of the species
	'genus'=>'select genus, species from organism where organism_id = %1$d',

// the sequence of a feature
	'fasta'=>'select feature_id  , residues , uniquename from feature where feature_id = %1$d',

// _id is a unique object identifier. It might be required that it is an integer

	'organismLibraries'=>'select l.library_id from library l JOIN cvterm c ON c.cvterm_id=l.type_id JOIN organism o ON l.organism_id=o.organism_id where library_id in ( select distinct(library_id) from library_feature ) and o.organism_id = %1$d',
	'library' => array(
  	  'metadataCvterm'=>'select l.library_id as dsid , l.name as selection, c.name as term,cv.name as vocabulary, true as value from library l JOIN library_cvterm lc ON l.library_id=lc.library_id JOIN cvterm c ON c.cvterm_id=lc.cvterm_id JOIN cv ON c.cv_id=cv.cv_id JOIN pub p ON lc.pub_id=p.pub_id JOIN cvterm cp ON cp.cvterm_id=p.type_id where l.library_id = %1$d',
  	  'metadataProp'=>'select lp.name as vocabulary, value as term, lp.library_id as dsid, l.name as selection, true as value from libraryprop lp join cvterm on lp.type_id = cvterm.cvterm_id join library l on lp.library_id = l.library_id where lp.library_id= %1$d',
	  'metadataDbxref'=>'select ld.library_id as dsid , ld.name as vocabulary, ld.dbxref_id as term, l.name as selection from library l join library_dbxref ld on l.library_id = ld.library_id join dbxref on ld.dbxref_id = dbxref.dbxref_id join db on dbxref.db_id = db.db_id where ld.library_id= %1$d',
	  'featureDetails'=>'select f.feature_id , f.name, f.uniquename, cvt.cvterm_id, cvt.name as type from feature f join cvterm cvt on cvt.cvterm_id = f.type_id  and f.feature_id in ( %1$s ) %2$s %3$s',
	  'filters'=>'select feature_id from feature where feature_id in ( select distinct l.feature_id from library_feature_cvterm_mat l where l.library_id %1$s ) and  type_id in ( select cvterm_id from cvterm where name like \'\%%2$s\%\' )',
	  'allFeatures'=>'select distinct l.feature_id from library_feature_cvterm_mat l where l.library_id %1$s',
	  'facets'=>'select feature_id from library_feature_cvterm_mat where cvterm_id=%1$d and library_id %2$s',
	  'listCV'=>'select cv_id, sq.name, sq.name as title ,  array_to_string(array_agg(sq.dsid), \',\') as dsid, \'cv_term\' as get from ( select distinct cv.cv_id, cv.name, cv.name as title , library_id as dsid from library_feature_cvterm_mat m  join cvterm c ON c.cvterm_id=m.cvterm_id join cv on cv.cv_id = c.cv_id where library_id  %1$s ) sq group by   cv_id,name',
	  'dbxref'=>'select dbxref.accession as id,dbxref.description as name, count(dbxref.accession) as count from library_feature_dbxref_mat join dbxref on library_feature_dbxref_mat.dbxref_id=dbxref.dbxref_id join db on dbxref.db_id=db.db_id  where library_id = %1$d group by db.name,dbxref.accession,dbxref.description order by count DESC limit %2$s',
	  'blast'=>'SELECT value as name,count(value) as count from featureprop where type_id =(select cvterm_id from cvterm where name =\'inferred from electronic annotation\'  and cv_id=(select cv_id from cv where name=\'Evidence Codes\'))  and feature_id  IN (SELECT feature_id from library_feature where library_id=%1$d) group by value order by count DESC limit %2$d',
	  'cvtermSummary'=>'select c.cv_id, c.cvterm_id , c.name  , count(*) as count  from ( select distinct feature_id as fid , * from library_feature_cvterm_mat where library_id = %1$d ) as l join cvterm c ON c.cvterm_id=l.cvterm_id where c.cv_id = %2$d %3$s group by c.cv_id,c.cvterm_id, c.name order by count DESC',
	  'tree'=>'select l.library_id as id , l.name as text , \'true\' as leaf , o.organism_id as organism_id, genus , species from library l JOIN cvterm c ON c.cvterm_id=l.type_id JOIN organism o ON l.organism_id=o.organism_id where library_id in ( select distinct(library_id) from library_feature ) order by genus, species',
		'totalUncategorised'=>'select count(*) from feature f join cvterm cvt on cvt.cvterm_id = f.type_id and f.feature_id not in ( select distinct l.feature_id from library_feature_cvterm_mat l where l.library_id  in %3$s )  where type_id = %1$d and organism_id = %2$d',
 		'uncategorised'=>'select feature_id, f.name, uniquename from feature f join cvterm cvt on cvt.cvterm_id = f.type_id and f.feature_id not in ( select distinct l.feature_id from library_feature_cvterm_mat l where l.library_id  in %3$s )  where type_id = %1$d and organism_id = %2$d limit %4$d offset %5$d'
	),

	'species' => array(
		'features' => 'select feature_id from feature where organism_id in (%1$s) and type_id = (select cvterm_id from cvterm where name = \'polypeptide\')',
		'featuresWType'=>'select distinct feature_id from feature where organism_id in (%1$s) and  type_id in ( select cvterm_id from cvterm where name like \'%2$s%%\')',
		'featuresWCvtermId'=>'select feature_id from feature_cvterm where cvterm_id= %2$d and feature_id in ( select feature_id from feature where organism_id in (%1$s) )',
		'cv'=>'select cv_id, name, name as title ,  array_to_string(array_agg( dsid),\',\'), \'cv_term\' as get from (select distinct( cv_id ) , cv_name as name , organism_id as dsid from cvterm_organism_mat join cv on cv.name = cv_name where organism_id %1$s) sq group by cv_id , name',
		'dbxref'=>'select dbxref.accession as id,dbxref.description as name, count(*) as count from dbxref_organism_mat d join dbxref on d.dbxref_id=dbxref.dbxref_id join db on dbxref.db_id=db.db_id  where organism_id = %1$s group by dbxref.accession, dbxref.description',
		'cvtermSummaryFacets'=>'select cvterm_id , cvterm_name as name  , count(*)  from ( select distinct feature_id as fid , * from cvterm_organism_mat where organism_id = %1$d and cv_name = \'%2$s\' ) l where %3$s group by l.cvterm_id, l.cvterm_name order by count DESC',
		'cvtermSummary'=>'select cvterm_id , cvterm_name as name  , count(*)  from ( select distinct feature_id as fid , * from cvterm_organism_mat where organism_id = %1$d and cv_name = \'%2$s\' ) l group by l.cvterm_id, l.cvterm_name order by count DESC',
		'metadataDbxref'=>'select organism_id as dsid , name as vocabulary,dbx.dbxref_id as term from organism_dbxref_mat mat join dbxref dbx on mat.dbxref_id = dbx.dbxref_id join db on dbx.db_id = db.db_id where organism_id = %1$d',
		'metadataProp'=>'select name as vocabulary, value as term, o.organism_id as dsid, true as value, species as selection from organismprop join cvterm on organismprop.type_id = cvterm.cvterm_id join organism o on o.organism_id = organismprop.organism_id where o.organism_id =%1$d',
		'featureList'=>'select f.feature_id , f.name, f.uniquename, cvt.cvterm_id, cvt.name as type from feature f join cvterm cvt on cvt.cvterm_id = f.type_id  and f.feature_id in ( %1$s ) %2$s %3$s',
		'tree'=>'select organism_id as id, genus, species, \'true\' as leaf from organism order by genus, species'
	),

	'feature' => array(
	  'total'=>'select count(*) from feature',
	  'cvterm'=>'select f.feature_id as dsid ,c.name as term,cv.name as vocabulary, true as value from feature f JOIN feature_cvterm lc ON f.feature_id=lc.feature_id JOIN cvterm c ON c.cvterm_id=lc.cvterm_id JOIN cv ON c.cv_id=cv.cv_id where f.feature_id = %1$d',
	  'propSql'=>'select name as term, value as value, feature_id as dsid from featureprop join cvterm on featureprop.type_id = cvterm.cvterm_id where feature_id=%1$d',
	  'dbxref'=>'select feature_id as dsid , name as term, ld.dbxref_id as value from feature_dbxref ld join dbxref on ld.dbxref_id = dbxref.dbxref_id join db on dbxref.db_id = db.db_id where feature_id= %1$d',
	  'filterLibraries'=>'select feature_id from library_feature lf join library l on lf.library_id = l.library_id where l.name like \'\%%1$s\%\'',
	  'filterSrcFeature'=>'select fl.feature_id from featureLoc fl join feature f on fl.srcfeature_id = f.feature_id where f.uniquename = \'%1$s\'',
	  'countFiltered'=>'select count( f.feature_id ) from feature f JOIN organism o on f.organism_id = o.organism_id join cvterm cvt on cvt.cvterm_id = f.type_id join (%1$s) sq on sq.feature_id = f.feature_id %2$s',
	  'featureFiltered'=>'select f.feature_id , f.name, f.uniquename, f.organism_id, f.seqlen,  cvt.cvterm_id, cvt.name as type, o.genus, o.species from feature f JOIN organism o on f.organism_id = o.organism_id join cvterm cvt on cvt.cvterm_id = f.type_id join (%1$s) sq on sq.feature_id = f.feature_id %2$s %3$s %4$s',
	  'withoutFilter'=>'select f.feature_id , f.name, f.uniquename, f.organism_id, f.seqlen, cvt.cvterm_id, cvt.name as type, o.genus, o.species from feature f JOIN organism o on f.organism_id = o.organism_id join cvterm cvt on cvt.cvterm_id = f.type_id  %1$s %2$s %3$s',
	  'countWithout'=>'select count( f.feature_id ) from feature f %1$s'
	),

//genome browser query
	'gb'=>array (
  	  'sourceFeatures'=>'select ct.name, fmin , fmax from featureloc fl join feature f on f.feature_id = fl.feature_id join cvterm ct on ct.cvterm_id = f.type_id  where srcfeature_id = %1$d'
        )
);
?>
