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
require_once (dirname(__FILE__) . '/utils.inc');
require_once (dirname(__FILE__) . '/library.inc');
function cv($id, $db, $ids = NULL) {
	// when more than one library is selected. done so that it works with the previous version of the function.
	require ('SqlQueries.inc');
	if (isset($ids)) {
		$id = join(',', $ids);
		$id = ' in (' . pg_escape_string($id) . ')';
	} else {
		$id = ' = ' . pg_escape_string($id);
	}

	$sql = sprintf($sqlQueries['library']['listCV'], $id);
	$data = query_execute($db, $sql, null);

	$data = processData($data);
	return $data;
}

function dbxref($id, $limit) {
	require ('SqlQueries.inc');
	$limit = $limit ? $limit : 100;
	$sql = sprintf($sqlQueries['library']['dbxref'], $id, $limit);
	$data = query_execute(null, $sql, null);
	return $data;
}

function blast($id, $limit) {
	require ('SqlQueries.inc');
	$limit = $limit ? $limit : 100;
	$sql = sprintf($sqlQueries['library']['blast'], $id, $limit);
	$data = query_execute(null, $sql, null);
	return $data;
}



function cvSummary_expression($dsid, $cv_id,$expression_lib) {
	require ('SqlQueries.inc');
	
	if (empty($expression_lib)){return;}
	$limit = '';
	if (isset($_REQUEST['limit'])) {
		$limit = $_REQUEST['limit'];
	}
	$facets = json_decode($_REQUEST['facets'], TRUE);
	$facetQueryArray = array();
	$data = array();
	

	if (!empty($facets)){
	 foreach ($facets as $index => $facet) {
		array_push($facetQueryArray, transcriptSql(pg_escape_string($facet['cv_id']), pg_escape_string($facet['value']), $dsid));
	 }
	}
	$goFacets = '';
	if (count($facetQueryArray) > 0) {
		$goFacets = sprintf($sqlQueries['library']['facetFilterCondition'], join(' intersect ', $facetQueryArray));
	}
	
	if ($expression_lib === 'All'){
	  $goFacets .= " AND it.cds_uname IN (SELECT transcript_uname as cds_uname FROM dataset_$dsid.transcript_expression_library) ";
	  $library_where = '';
	}else{
		$expression_lib = pg_escape_string($expression_lib);
	  $goFacets .= " AND it.cds_uname IN (SELECT transcript_uname as cds_uname FROM dataset_$dsid.transcript_expression_library WHERE library_uname='$expression_lib') ";
	  $library_where = "library_uname='$expression_lib' AND";
	}
	$librarySql = summarySql($cv_id, $goFacets, $dsid);
	$data = query_execute(null, $librarySql, null);
	if (empty($data)){
		$data[] = array('cv_id'=>$cv_id,'count'=> 1,'cvterm_id'=>0,'name'=>'-No results found');
	}
	
	$data = addProperty($data, 'highername', array($expression_lib => $dsid));
	// add no hits to the output
//	require_once ('const.inc');
//	if ( (count($facetQueryArray) == 0)||( (count($facetQueryArray) == 1) && ($facets[0]['cv_id'] == CV::nothit))) {
//		$cvterm = array("highername" => array($expression_lib => $dsid));
//		$nohits = nohits_expression($dsid, $cvterm,$library_where);
//		array_push($data, $nohits);
//	}

	return $data;
}



function cvSummary($id, $cv_id) {
	require ('SqlQueries.inc');
	
	$limit = '';
	if (isset($_REQUEST['limit'])) {
		$limit = $_REQUEST['limit'];
	}
	
	$facets = json_decode($_REQUEST['facets'], TRUE);
	$facetQueryArray = array();
	if (!empty($facets)){
	 foreach ($facets as $index => $facet) {
		array_push($facetQueryArray, transcriptSql(pg_escape_string($facet['cv_id']), pg_escape_string($facet['value']), $id));
	 }
	}
	
	$goFacets = '';
	if (count($facetQueryArray) > 0) {
		$goFacets = sprintf($sqlQueries['library']['facetFilterCondition'], join(' intersect ', $facetQueryArray));
	}
	
	$librarySql = summarySql($cv_id, $goFacets, $id);
	
	$data = query_execute(null, $librarySql, null);
	$lNameSql = "select description from datasets where dataset_id = $id";
	$lName = query_execute(null, $lNameSql, null);
	
	if (empty($data)){
		$data[] = array('cv_id'=>$cv_id,'count'=> 1,'cvterm_id'=>0,'name'=>'-No results found');
	}
	$data = addProperty($data, 'highername', array($id => $lName[0]['description']));
	
	
	
//	// Add no hits to the output
//	require_once ('const.inc');
//	if ( (count($facetQueryArray) == 0)||( (count($facetQueryArray) == 1) && ($facets[0]['cv_id'] == CV::nothit))) {
//		$cvterm = array("highername" => array($id => $lName[0]['description']));
//		$nohits = nohits($id, $cvterm);
//		array_push($data, $nohits);
//	}
	return $data;
}

function addProportion($data, $input = 'count', $prop = 'proportion') {
	$total = (int)0;
	foreach ($data as $key => $value) {
		$total+=$value['count'];
	}
	
	foreach ($data as $key => $value) {
		$value[$prop] = number_format(($value[$input] / $total) * 100, 2);
		$data[$key] = $value;
	}
	return $data;
}


/**
 * get the total number of transcripts that do not have a hit
 */
function nohits( $dsId, $cvterm ) {
	require ('SqlQueries.inc');
	require_once ('const.inc');
	$sql = sprintf($sqlQueries['library']['totalNoHits'], pg_escape_string($dsId), pg_escape_string(CV::nothit));
	$result = query_execute(null, $sql, null);
	$cvterm = array_replace($result[0], $cvterm);
	return $cvterm;
}

function nohits_expression( $dsId, $cvterm,$expression_where ) {
	require ('SqlQueries.inc');
	require_once ('const.inc');
	$sql = sprintf($sqlQueries['library']['totalNoHits_expression_library'], pg_escape_string($dsId), pg_escape_string(CV::nothit),$expression_where);
	$result = query_execute(null, $sql, null);
	$cvterm = array_replace($result[0], $cvterm);
	return $cvterm;
}


function transcriptSql($cv_id, $cvterm_id, $dataset_id) {
	require ('SqlQueries.inc');
	require_once ('const.inc');
	$sql = '';
	switch ($cv_id) {
		case 1 :
		case 2 :
		case 3 :
			$sql = sprintf($sqlQueries['library']['goTranscripts'], pg_escape_string($cvterm_id), pg_escape_string($dataset_id));
			break;
		case 4 :
			$sql = sprintf($sqlQueries['library']['keggTranscripts'], pg_escape_string($cvterm_id), pg_escape_string($dataset_id));
			break;
		case 5 :
			$sql = sprintf($sqlQueries['library']['enzymeTranscripts'], pg_escape_string($cvterm_id), pg_escape_string($dataset_id));
			break;
		case 6 :
			$sql = sprintf($sqlQueries['library']['eggnogTranscripts'], pg_escape_string($cvterm_id), pg_escape_string($dataset_id));
			break;
		case 7 :
			$sql = sprintf($sqlQueries['library']['koTranscripts'], pg_escape_string($cvterm_id), pg_escape_string($dataset_id));
			break;
		case CV::nothit:
			$sql = sprintf($sqlQueries['library']['nohitsTranscripts'], pg_escape_string($cvterm_id), pg_escape_string($dataset_id));
			break;
		default :
			break;
	}
	return $sql;
}

function summarySql($cv_id, $facetSql, $datasetId) {
	require ('SqlQueries.inc');
	require_once ('const.inc');
	
	$sql = '';
	switch ($cv_id) {
		case 1 :
			$sql = sprintf($sqlQueries['library']['GOSummary'], $facetSql, pg_escape_string('F'), pg_escape_string($cv_id), pg_escape_string($datasetId));
			break;
		case 2 :
			$sql = sprintf($sqlQueries['library']['GOSummary'], $facetSql, pg_escape_string('P'), pg_escape_string($cv_id), pg_escape_string($datasetId));
			break;
		case 3 :
			$sql = sprintf($sqlQueries['library']['GOSummary'], $facetSql, pg_escape_string('C'), pg_escape_string($cv_id), pg_escape_string($datasetId));
			break;
		case 4 :
			$sql = sprintf($sqlQueries['library']['KEGGSummary'], $facetSql, pg_escape_string($cv_id), pg_escape_string($datasetId));
			break;
		case 5 :
			$sql = sprintf($sqlQueries['library']['ENZYMESummary'], $facetSql, pg_escape_string($cv_id), pg_escape_string($datasetId));
			break;
		case 6 :
			$sql = sprintf($sqlQueries['library']['EGGNOGSummary'], $facetSql, pg_escape_string($cv_id), pg_escape_string($datasetId));
			break;
		case 7 :
			$sql = sprintf($sqlQueries['library']['KOSummary'], $facetSql, pg_escape_string($cv_id), pg_escape_string($datasetId));
			break;
		case CV::nothit :
			$sql = sprintf($sqlQueries['library']['NoHitsSummary'], pg_escape_string($datasetId),CV::nothit);
			break;
		default :
			break;
	}
	return $sql;
}
?>
