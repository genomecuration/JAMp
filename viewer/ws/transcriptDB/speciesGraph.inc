<?PHP
/**
 * webservice name: ws/libraryGraph
 * parameters
 *      id (integer)- organism id
 *      limit (integer) - number of items in returned data or number of bars in a bar chart 
 *                              i.e. if limit = 20 and sql retuns 100 rows, the ws will return 20 rows 
 *                              with 19 coming from the sql command and "Others" row containing
 *                              the sum of the rest
 *      cv_id (string) - controlled vocabulory id is passed here. eg. they are integers representing vocabularies biological_process, KEGG_PATHWAY etc.
 * 		get ['cv','cv_term'] - these variable is used to decide what the web service returns, cv or cv_terms. 
 */
require_once('libraryGraph.inc');
require_once( 'utils.inc' );
// require( dirname(__FILE__) . '/species.inc' );

function speciescv( $id , $ids = NULL){
	require('SqlQueries.inc');
	// when more than one library is selected. done so that it works with the previous version of the function.
	if( isset( $ids ) ){
	  $id = join( ',' , $ids );
	  $id = ' in ('.pg_escape_string($id).')';
	} else {
	  $id = ' = '.pg_escape_string($id);
	}

	$sql = sprintf( $sqlQueries['species']['cv'] , $id);
	$data = query_execute(null, $sql , null);
	$data = processData($data);
	return $data;	
}
function speciesdbxref( $id ){
	require('SqlQueries.inc');
	$sql = sprintf( $sqlQueries['species']['dbxref'] , $id );
	$data = query_execute( null, $sql , null );
	return $data;
}
function speciesblast ( $id ){
	require('SqlQueries.inc');
	$sql = sprintf( $sqlQueries['species']['blast'], $id );
	$data = query_execute(null, $sql , null);
	return $data ;
}
function speciescvTermSummary ( $id , $cv_id , $cv_name){
	require('SqlQueries.inc');
	require_once('const.inc');
	global $own;
	// iterate through a list of species
	$ids = array();
	$data = array();
	$datasetIds = array();
	$dsSql = sprintf($sqlQueries['species']['datasets'],$id, pg_escape_string($own));
	$ds = query_execute( NULL, $dsSql, NULL);
	foreach ($ds as $index => $row) {
		array_push( $datasetIds, $row['dataset_id'] ); 
		$data[ $row['dataset_id'] ] = cvSummary($row['dataset_id'], pg_escape_string($cv_id));
	}
// echo print_r($data);
	$data = mergeCvTermsSum( $data );
	// echo print_r($data);
	$data = sumColumns( $data, $datasetIds , "$id count");
	
	  
	$data = addProperty($data , 'highername' , array( $id => $id ));
	// echo print_r( $data );  
	  return $data;
}
?>