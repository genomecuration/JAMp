<?PHP
require_once ('utils.inc');
require_once ('library.inc');
function listLibrary( $lib ) {

	require( 'SqlQueries.inc' );
	$lib = cleanLib($lib);

	$fields = array('l.library_id' => 'id', 'c.name' => 'term', 'cv.name' => 'vocabulary', 'p.uniquename' => 'publication_title', 'cp.name' => 'publication_type');

	// multiple rows per library_id; when integrating to a datagrid, vocabulary becomes the column name and term is the value for that column/row intersection.

	// for the sake of completeness, i've added example metadata for that column/row intersection: publication title and type. this cannot appear on a data grid but one could

	// perhaps show them on clicking/hovering over the column/row intersection.

	$cvtermSql = sprintf( $sqlQueries['library']['metadataCvterm'], $lib );

	// connect to db
	$result = query_execute('chado', $cvtermSql, null);
	$propSql = sprintf( $sqlQueries['library']['metadataProp'], $lib);

	$prop = query_execute('chado', $propSql, null);
	$dbxrefSql = sprintf( $sqlQueries['library']['metadataDbxref'], $lib );
	$dbxref = query_execute('chado', $dbxrefSql, null);

	// flatten result
	$data = array();
	$res = array_merge($result, $prop, $dbxref);
	return $res;
}

/**
 * checks if the query is a numeric value or *, for all library
 *
 */
function cleanLib($lib) {
	$result;
	switch ( $lib ) {
		case '*' :
			$lib = '*';
			break;
		default :
			if (!is_numeric($lib)) {
				$lib = NULL;
			}
	}
	return $lib;
}

function featureLibraryList( $ids ) {
	/*
	 * user wants:
	 * for every feature
	 * 1 feature)	tell me what organism it is
	 * 1)	what type it is
	 * 1) what name, uniquename
	 *
	 * 2)	what library (if any)
	 * 3) what sourcefeature (featureloc) if any
	 *
	 *
	 */
	$translation = array('type' => 'cvt.name', 'species' => 'o.species', 'library_name' => 'lib.library_id', 'feature_id' => array('name' => 'f.feature_id', 'type' => 'number'), 'name' => 'f.name', 'uniquename' => 'f.uniquename', 'organism_id' => array('name' => 'f.organism_id', 'type' => 'number'), 'cvterm_id' => array('name' => 'cvt.cvterm_id', 'type' => 'number'), 
	'library_id' => array('name' => 'lib.library_id', 'type' => 'number'), 'srcuniquename' => 'fs.srcuniquename', 'srcfeature_id' => array('name' => 'loc.srcfeature_id', 'type' => 'number'));

	$total = 100000000;
	$id = $_REQUEST['id'];
	// echo print_r( $request );
	$intersect = array();
	// library filter
	$filters = json_decode($_REQUEST['filter']);
	$cvtermsArray = json_decode($_REQUEST['cvterms']);
	$facets = json_decode($_REQUEST['facets']);
	$page = paging($_REQUEST);
	$order = orderby($_REQUEST, $translation);
	
	$refineSql = refineSQL($id, $filters, $facets , $ids);
	$countSql = countSql( $refineSql );
	$detailsSql = featureDetailsSql( $refineSql , $order['string'] , $page );

	if ($countSql) {
		$count = query_execute('chado', $countSql, null);
		$total = $count[0]['count'];
	}
	$data = query_execute('chado', $detailsSql , null);
	
	header('Content-Type: application/json');
	$result = array('data' => $data, 'total' => $total);

	return $result;
}
function featureDetailsSql( $sql , $order, $page ){
	require( 'SqlQueries.inc' );
	return sprintf( $sqlQueries['library']['featureDetails'], $sql, $order, $page );
}
function refineSQL( $id , $filters , $facets , $ids = NULL ){
	require( 'SqlQueries.inc' );
	$sql = array();	
	// when more than one library is selected. done so that it works with the previous version of the function.
	if( isset( $ids ) ){
	  $id = join( ',' , $ids );
	  $id = ' in ('.$id.')';
	} else {
	  $id = ' = '.$id;
	}
	if( $filters ){
		$intersectCvterm = array();
		foreach ($filters as $key => $cvterm) {
			if ( $cvterm->property == 'type' ){
				array_push( $sql , sprintf( $sqlQueries['library']['filters'] , $id , $cvterm->value ) );
			}
		}
	} else {
		array_push( $sql  , sprintf( $sqlQueries['library']['allFeatures'], $id ) );
	}
	if ( $facets ){
		$intersectCvterm = array();
		foreach ($facets as $key => $cvterm) {
			array_push( $sql , sprintf( $sqlQueries['library']['facets'], $cvterm->value,$id ) );
		}
	}
	return implode( ' intersect ' , $sql );
}
function reduceArray( $v , $item){
	$values = array_values( $item );
	return array_merge( $v , $values );
}
function getUncategorisedFeatures( $selectedIds ){
	require( 'SqlQueries.inc' );
	$id = -1*$selectedIds[0];
	$librariesSql = sprintf($sqlQueries['organismLibraries'] , $id );
	$libraries = query_execute( 'chado', $librariesSql, null);
	$libraries = array_reduce( $libraries , "reduceArray", array());
	$libraries = '('.implode( ',' ,  $libraries ).')';
	$cvtermidsql = sprintf( $sqlQueries['cvtermid'], 'polypeptide');
	$cvtermid = query_execute( 'chado',$cvtermidsql );
	$cvtermid = $cvtermid ? $cvtermid[0]['cvterm_id']:0;
	$sql = sprintf( $sqlQueries['library']['uncategorised'], $cvtermid, $id , $libraries, $_REQUEST['limit'], $_REQUEST['start']  );
	$features = query_execute('chado', $sql , null);
	$totalSql = sprintf( $sqlQueries['library']['totalUncategorised'], $cvtermid, $id, $libraries );
	$total = query_execute('chado',$totalSql , null);
	$total = $total ? $total[0]['count']:0;
	return array( 'total'=>$total , 'data' => $features );
}
?>