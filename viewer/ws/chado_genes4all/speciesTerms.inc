<?PHP
require_once (dirname(__FILE__) .  '/utils.inc');
function listTerms ( $id , $ids) {
	require('SqlQueries.inc');
  
  $fields = array ( 'l.library_id' =>'id' , 'c.name' => 'term','cv.name' => 'vocabulary', 'p.uniquename' => 'publication_title','cp.name' => 'publication_type'  );
  
   
  // multiple rows per library_id; when integrating to a datagrid, vocabulary becomes the column name and term is the value for that column/row intersection.

  // for the sake of completeness, i've added example metadata for that column/row intersection: publication title and type. this cannot appear on a data grid but one could  

  
  // TODO: table organism_dbxref_mat does not exist in dev database
   $dbxrefSql = sprintf( $sqlQueries['species']['metadataDbxref'], $id );
   $dbxrefResult = query_execute('chado', $dbxrefSql , null);

   $propSql = sprintf( $sqlQueries['species']['metadataProp'] , $id );
   $propResult = query_execute('chado', $propSql , null);
   
  // flatten result
  $prop = array();
  $data = array ();
  $i;
  $result = array_merge( $dbxrefResult , $propResult );
  return $result;
}

/**
 * checks if the query is a numeric value or *, for all library
 * 
 */
function cleanLib ( $lib ) {
  $result ;
  switch ( $lib ) {
    case '*' : 
      $lib = '*';
      break;
    default : 
      if ( !is_numeric( $lib ) ) {
        $lib = NULL;
      }
  }
  return $lib;
}
function featureSpeciesList( $ids ) {
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

	$translation = array('type' => 'cvt.name', 'species' => 'o.species', 'library_name' => 'lib.library_id', 'feature_id' => array('name' => 'f.feature_id', 'type' => 'number'), 'name' => 'f.name', 'uniquename' => 'f.uniquename', 'organism_id' => array('name' => 'f.organism_id', 'type' => 'number'), 'cvterm_id' => array('name' => 'cvt.cvterm_id', 'type' => 'number'), 'genus' => 'o.genus', 'library_id' => array('name' => 'lib.library_id', 'type' => 'number'), 'srcuniquename' => 'fs.srcuniquename', 'srcfeature_id' => array('name' => 'loc.srcfeature_id', 'type' => 'number'));

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
	
	$refineSql = speciesRefineSQL($id, $filters, $facets, $ids );	
	// echo $refineSql;
	// echo "\n";
	$countSql = countSql( $refineSql );
	$detailsSql = speciesDetailsSql( $refineSql , $order['string'] , $page );
	// echo $detailsSql;
	if ($countSql) {
		$count = query_execute('chado', $countSql, null);
		$total = $count[0]['count'];
	}
	$data = query_execute('chado', $detailsSql , null);
// echo $detailsSql;
	// header('Content-Type: application/json');
	$result = array('data' => $data, 'total' => $total);
	// echo json_encode( $result );
	return $result;
}
function speciesDetailsSql( $sql , $order, $page ){
	require 'SqlQueries.inc';
	return sprintf( $sqlQueries['species']['featureList'] , $sql , $order ,$page );
}
function speciesRefineSQL( $id , $filters , $facets , $ids = NULL ){
	require( 'SqlQueries.inc' );
	$sql = array();	
	
	// when more than one species is selected.

    $id = join( ',' , $ids );
	// echo $id;
	if( $filters ){
		$intersectCvterm = array();
		foreach ($filters as $key => $cvterm) {
			if ( $cvterm->property == 'type' ){
				$featuresWType = sprintf( $sqlQueries['species']['featuresWType'] , $id , $cvterm->value );
				array_push( $sql  , $featuresWType );
			}
		}
	} else {
		$features = sprintf($sqlQueries['species']['features'] , $id );
		array_push( $sql  , $features );
	}
	if ( $facets ){
		$intersectCvterm = array();
		foreach ($facets as $key => $cvterm) {
			$featureWCvtermId = sprintf( $sqlQueries['species']['featuresWCvtermId'] , $id , $cvterm->value );
			array_push( $sql ,$featureWCvtermId);
		}
	}
	return implode( ' intersect ' , $sql );
}
?>
