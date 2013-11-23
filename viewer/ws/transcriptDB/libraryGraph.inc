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
function cvSummary ( $id , $cv_id ){
	require ( 'SqlQueries.inc' );
	$limit = '';
	  if ( isset( $_REQUEST['limit'] ) ) {
	    $limit = $_REQUEST['limit'];
	  }
 	$facets = json_decode( $_REQUEST['facets'], TRUE );
	$facetQueryArray=array();
	// echo $id;
	foreach ($facets as $index => $facet) {
		array_push( $facetQueryArray, transcriptSql($facet['cv_id'], $facet['value'], $id));
	}
	// $go_id = array();
	// $go_id = array_map('getValue',$facets);
	// echo print_r($facetQueryArray);
	// echo count( $facetQueryArray );
	// $go_id = join(',', $go_id);
	$goFacets ='';
 	if( count( $facetQueryArray ) > 0){
 		// $goFacets = sprintf( $sqlQueries['library']['GoFFacets'] , ' where transcript_uname in ('.join(') intersect (', $facetQueryArray).')');
		$goFacets = sprintf( $sqlQueries['library']['facetFilterCondition'], join(' intersect ', $facetQueryArray) );
 	}
	  // $librarySql = sprintf( $sqlQueries['library']['GOSummary'], $goFacets ,$class);
	  $librarySql = summarySql($cv_id , $goFacets , $id);
	  // echo $librarySql;
	  $data = query_execute('chado', $librarySql , null);
	  // echo $cv_id;
	  // add library name
	  $lNameSql = "select description from datasets where dataset_id = $id";
	  $lName = query_execute( 'chado', $lNameSql ,null);
	  $data = addProperty($data , 'highername' , array( $id => $lName[0]['description'] ));

	return $data;
}
function transcriptSql( $cv_id , $cvterm_id, $dataset_id){
	require ( 'SqlQueries.inc' );
	$sql = '';
	switch ($cv_id) {
		case 1:
		case 2:
		case 3:
			$sql = sprintf( $sqlQueries['library']['goTranscripts'], $cvterm_id, $dataset_id);
			break;
		case 4:
			$sql = sprintf( $sqlQueries['library']['keggTranscripts'], $cvterm_id, $dataset_id);
			break;
		case 5:
			$sql = sprintf( $sqlQueries['library']['enzymeTranscripts'], $cvterm_id, $dataset_id);
			break;
		case 6:
			$sql = sprintf( $sqlQueries['library']['eggnogTranscripts'], $cvterm_id, $dataset_id);
			break;
		case 7:
			$sql = sprintf( $sqlQueries['library']['koTranscripts'], $cvterm_id, $dataset_id);
			break;
		default:
			break;
	}
	return $sql;
}
function summarySql( $cv_id, $facetSql, $datasetId ){
	require ( 'SqlQueries.inc' );
	$sql = '';
	switch ($cv_id) {
		case 1:
			$sql = sprintf( $sqlQueries['library']['GOSummary'], $facetSql, 'F', $cv_id,$datasetId);
			break;
		case 2:
			$sql = sprintf( $sqlQueries['library']['GOSummary'], $facetSql, 'P', $cv_id,$datasetId);
			break;
		case 3:
			$sql = sprintf( $sqlQueries['library']['GOSummary'], $facetSql, 'C', $cv_id,$datasetId);
			break;
		case 4:
			$sql = sprintf( $sqlQueries['library']['KEGGSummary'], $facetSql, $cv_id,$datasetId);
			break;
		case 5:
			$sql = sprintf( $sqlQueries['library']['ENZYMESummary'], $facetSql, $cv_id,$datasetId);
			break;
		case 6:
			$sql = sprintf( $sqlQueries['library']['EGGNOGSummary'], $facetSql, $cv_id,$datasetId);
			break;
		case 7:
			$sql = sprintf( $sqlQueries['library']['KOSummary'], $facetSql, $cv_id,$datasetId);
			break;
		default:
			break;
	}
	return $sql;
}
?>
