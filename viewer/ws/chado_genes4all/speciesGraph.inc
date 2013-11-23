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
require( dirname(__FILE__) . '/utils.inc' );
require( dirname(__FILE__) . '/species.inc' );
function speciescv( $id , $ids = NULL){
	require('SqlQueries.inc');
	// when more than one library is selected. done so that it works with the previous version of the function.
	if( isset( $ids ) ){
	  $id = join( ',' , $ids );
	  $id = ' in ('.$id.')';
	} else {
	  $id = ' = '.$id;
	}

	$sql = sprintf( $sqlQueries['species']['cv'] , $id);
	$data = query_execute('chado', $sql , null);
	$data = processData($data);
	return $data;	
}
function speciesdbxref( $id ){
	require('SqlQueries.inc');
	$sql = sprintf( $sqlQueries['species']['dbxref'] , $id );
	$data = query_execute( 'chado', $sql , null );
	return $data;
}
function speciesblast ( $id ){
	require('SqlQueries.inc');
	$sql = sprintf( $sqlQueries['species']['blast'], $id );
	$data = query_execute('chado', $sql , null);
	return $data ;
}
function speciescvTermSummary ( $id , $cv_id , $cv_name){
	require('SqlQueries.inc');

  	$limit = '';
	  if ( isset( $_REQUEST['limit'] ) ) {
	    $limit = $_REQUEST['limit'];
	  }
 	$facets = json_decode( $_REQUEST['facets']);
 	if ( $facets ){
 		$facets = refineSQL($id,null, $facets);
 		$facets = " feature_id in ($facets)";
 	} else {
 		$facets = '';
 	}
 	if( $facets ){

	  $librarySql = sprintf( $sqlQueries['species']['cvtermSummaryFacets'] , $id , $cv_name , $facets );
 	} else {

	  $librarySql = sprintf( $sqlQueries['species']['cvtermSummary'], $id , $cv_name );
 	}

	  $data = query_execute('chado', $librarySql , null);
	  
  	  $sNameSql = sprintf( $sqlQueries['genus'] , $id );
	  $sName = query_execute( 'chado', $sNameSql ,null);
	  $data = addProperty($data , 'highername' , array( $id => $sName[0]['genus'] .' '.$sName[0]['species'] ));
	  
	  return $data;
}
?>