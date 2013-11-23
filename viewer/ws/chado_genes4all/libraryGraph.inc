<?PHP
/**
 * webservice name: ws/libraryGraph
 * parameters
 *      library_id (integer)- library id
 *      limit (integer) - number of items in returned data or number of bars in a bar chart 
 *                              i.e. if limit = 20 and sql retuns 100 rows, the ws will return 20 rows 
 *                              with 19 coming from the sql command and "Others" row containing
 *                              the sum of the rest
 *      cv_id (string) - controlled vocabulory id is passed here. eg. they are integers representing vocabularies biological_process, KEGG_PATHWAY etc.
 * 		get ['cv','cv_term','dbxref'] - these variable is used to decide what the web service returns, cv or cv_terms. 
 */
require( dirname(__FILE__) . '/utils.inc' );
require( dirname(__FILE__) . '/library.inc' );
function cv( $id , $db, $ids = NULL){
		// when more than one library is selected. done so that it works with the previous version of the function.
	require('SqlQueries.inc');
	if( isset( $ids ) ){
	  $id = join( ',' , $ids );
	  $id = ' in ('.$id.')';
	} else {
	  $id = ' = '.$id;
	}

	$sql = sprintf( $sqlQueries['library']['listCV'] , $id );
	$data = query_execute($db, $sql , null);
	
    $data = processData($data);
	return $data;	
}
function dbxref( $id , $limit){
	require ( 'SqlQueries.inc' );
	$limit = $limit?$limit : 100;
	$sql = sprintf( $sqlQueries['library']['dbxref'] , $id , $limit );
	$data = query_execute( 'chado', $sql , null );
	return $data;
}
function blast( $id , $limit){
	require ( 'SqlQueries.inc' );
	$limit = $limit?$limit : 100;
	$sql = sprintf( $sqlQueries['library']['blast'] , $id , $limit );
	$data = query_execute('chado', $sql , null);
	return $data;
}
function cvTermSummary ( $id , $cv_id ){
	require ( 'SqlQueries.inc' );
	$limit = '';
	  if ( isset( $_REQUEST['limit'] ) ) {
	    $limit = $_REQUEST['limit'];
	  }
 	$facets = json_decode( $_REQUEST['facets']);
 	if ( $facets ){
 		$facets = refineSQL($id,null, $facets);
 		$facets = " and feature_id in ($facets)";
 	} else {
 		$facets = '';
 	}

	  $librarySql = sprintf( $sqlQueries['library']['cvtermSummary'], $id , $cv_id , $facets );

	  $data = query_execute('chado', $librarySql , null);
	  
	  // add library name
	  $lNameSql = "select name from library where library_id = $id";
	  $lName = query_execute( 'chado', $lNameSql ,null);
	  $data = addProperty($data , 'highername' , array( $id => $lName[0]['name'] ));

	return $data;
}
?>
