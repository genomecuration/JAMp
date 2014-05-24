<?PHP
require_once ('utils.inc');

function listLibrary($lib) {
	// this is used to populate the metadata panel for the selected tree item
	global $db;
	require ('SqlQueries.inc');
	$lib = cleanLib($lib);
	$return_array = array();
	$cvtermSql = sprintf($sqlQueries['library']['metadataDataset'], pg_escape_string($lib));
	$sql_result = query_execute($db, $cvtermSql, null);
	$return_array = flattenTwoD($sql_result, 'vocabulary', 'term', 'selection', 'library name');

	// get expression libraries
	$expression_libs = get_expression_libraries($lib);
	if (!empty($expression_libs)){
		format_expression_library_metadata($lib,$expression_libs,$return_array);
	}

	return $return_array;
}

function get_fortree_expression_library_metadata($expression_libs){
	$return_array = array();
	foreach ($expression_libs as $id){
		preg_match('/^(\d+)\^(.+)/',$id,$matches);
		$dsId=$matches[1];
		$library_uname = pg_escape_string($matches[2]);
		$expression_library_metadata = get_library_expression_metadata($dsId,$library_uname);
		if (!empty($expression_library_metadata)){
			foreach ($expression_library_metadata as $expression_library_metadatum){
				if ($expression_library_metadatum['value'] == $library_uname )  { continue; }
				$return_array[] = array('vocabulary'=>$expression_library_metadatum['term'],'term'=>$expression_library_metadatum['value'],'selection'=>$library_uname,'library name'=>$library_uname);
			}
		}
	}
	return $return_array;
}


function format_expression_library_metadata($dsId,$expression_libs,&$return_array){

	foreach ($expression_libs as $expression_lib){
		$expression_library_metadata = get_library_expression_metadata($dsId,$expression_lib['uname']);
		if (!empty($expression_library_metadata)){
			foreach ($expression_library_metadata as $expression_library_metadatum){
				if ($expression_library_metadatum['value'] == $expression_lib['uname'] )  { continue; }
				$return_array[] = array('vocabulary'=>$expression_library_metadatum['term'],'term'=>$expression_library_metadatum['value'],'selection'=>$expression_lib['uname'],'library name'=>$expression_lib['uname']);
			}
		}
	}

	return $return_array;
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




function expression_library_get_features($ids,$facets=NULL){
  	require ('SqlQueries.inc');
	require_once ('const.inc');
  
  	$expression_libraries = convert_expression_lib_ids_to_id_array($ids);
  	if (empty($facets)){
	$facets = json_decode($_REQUEST['facets'], TRUE);
  	}
	$page = paging($_REQUEST);
	$count = array();
	$sqls = array();
	$go_id = array_map('getValue', $facets);
	$go_id = join(',', $go_id);
	foreach ($expression_libraries as $expression_libraries_data) {
	    $dsid = $expression_libraries_data['dsid'];
	    $library_uname = pg_escape_string($expression_libraries_data['uname']);
		$facetsQueryArray = array();
		$library_where = '';
		if ($library_uname === 'All'){
		  $library_where = "AND library_uname IS NOT NULL";
		}else{
		  $library_where = "AND library_uname='$library_uname'";
		}
		if (!empty($facets)){
		 foreach ($facets as $index => $facet) {
		 	$facetSql = '';
		 	switch ($facet['cv_id']) {
		 		case 1 :
		 			$facetSql = sprintf($sqlQueries['library']['go_expression_library_Transcripts'], pg_escape_string($facet['value']), pg_escape_string($dsid),$library_where );
		 			break;
		 		case 2 :
		 		  $facetSql = sprintf($sqlQueries['library']['go_expression_library_Transcripts'], pg_escape_string($facet['value']), pg_escape_string($dsid), $library_where);
		 			break;
		 		case 3 :
		 		  $facetSql = sprintf($sqlQueries['library']['go_expression_library_Transcripts'], pg_escape_string($facet['value']), pg_escape_string($dsid), $library_where);
		 			break;
		 		case 4 :
		 		  $facetSql = sprintf($sqlQueries['library']['kegg_expression_library_Transcripts'], pg_escape_string($facet['value']), pg_escape_string($dsid), $library_where);
		 			break;
		 		case 5 :
		 		  $facetSql = sprintf($sqlQueries['library']['ko_expression_library_Transcripts'], pg_escape_string($facet['value']), pg_escape_string($dsid), $library_where);
		 			break;
		 		case 6 :
		 		  $facetSql = sprintf($sqlQueries['library']['enzyme_expression_library_Transcripts'], pg_escape_string($facet['value']), pg_escape_string($dsid), $library_where);
		 			break;
		 		case 7 :
		 		  $facetSql = sprintf($sqlQueries['library']['eggnog_expression_library_Transcripts'], pg_escape_string($facet['value']), pg_escape_string($dsid), $library_where);
		 			break;
		 		case CV::nothit :
		 			$facetSql = sprintf($sqlQueries['library']['nohits_expression_library_Transcripts'], pg_escape_string($id),$library_where);
		 			break;
		 	}
		 	array_push($facetsQueryArray, $facetSql);
		 }
		}else{
			$facetSql = sprintf($sqlQueries['library']['nohits_expression_library_Transcripts'], pg_escape_string($id),$library_where);
			array_push($facetsQueryArray, $facetSql);
		}
		
		$facetQuery = '';
		if ($go_id) {
			$facetQuery = '(' . join(') INTERSECT (', $facetsQueryArray) . ')';
			$facetQuery = sprintf($sqlQueries['library']['unameFilter_expression_library'], $facetQuery);
		}
		array_push($count, sprintf($sqlQueries['library']['cdss_expression_library'], pg_escape_string($dsid),$library_where, $facetQuery));
		array_push($sqls, sprintf($sqlQueries['library']['items_expression_library'], pg_escape_string($dsid), $library_where,$facetQuery, ''));
	}

	$countSql = join(' UNION ALL ', $count);
	if (!empty($countSql)){
		$countSql = sprintf($sqlQueries['library']['count'], $countSql);
		$total = query_execute(null, $countSql, null);
		$total = $total[0]['count'];
	}

	$sql = join(' UNION ALL ', $sqls);
	$sql = sprintf($sqlQueries['library']['itemsUnion'], $sql, $page);

	$data = query_execute(null, $sql, TRUE);
	header('Content-Type: application/json');
	return array('data' => $data, 'total' => $total);
}

function featureLibraryList($ids) {
	/*
	 * user wants:
	 * for every feature
	 * 1 feature)	tell me what organism it is
	 * 1)	what type it is
	 * 1) what name, uniquename
	 * 2)	what library (if any)
	 * 3) what sourcefeature (featureloc) if any
	 */
	require ('SqlQueries.inc');
	require_once ('const.inc');
	
	$facets = json_decode($_REQUEST['facets'], TRUE);
	$page = paging($_REQUEST);
	$count = array();
	$sqls = array();
	$go_id = array_map('getValue', $facets);
	$go_id = join(',', $go_id);
	foreach ($ids as $index => $id) {
		$facetsQueryArray = array();
		if (!empty($facets)){
		 foreach ($facets as $index => $facet) {
		 	$facetSql = '';
		 	switch ($facet['cv_id']) {
		 		case 1 :
		 			$facetSql = mfFeature($facet['value'], $id);
		 			break;
		 		case 2 :
		 			$facetSql = bpFeature($facet['value'], $id);
		 			break;
		 		case 3 :
		 			$facetSql = ccFeature($facet['value'], $id);
		 			break;
		 		case 4 :
		 			$facetSql = keggFeature($facet['value'], $id);
		 			break;
		 		case 5 :
		 			$facetSql = enzymeFeature($facet['value'], $id);
		 			break;
		 		case 6 :
		 			$facetSql = eggnogFeature($facet['value'], $id);
		 			break;
		 		case 7 :
		 			$facetSql = koFeature($facet['value'], $id);
		 			break;
		 		case CV::nothit :
		 			$facetSql = sprintf($sqlQueries['library']['nohitsTranscripts'], pg_escape_string($id));
		 			break;
		 	}
		 	array_push($facetsQueryArray, $facetSql);
		 }
		}else{
			$facetSql = sprintf($sqlQueries['library']['nohitsTranscripts'], pg_escape_string($id));
			array_push($facetsQueryArray, $facetSql);
		}
		$facetQuery = '';
		if ($go_id) {
			$facetQuery = '(' . join(') intersect (', $facetsQueryArray) . ')';
			$facetQuery = sprintf($sqlQueries['library']['unameFilter'], $facetQuery);
		}
		array_push($count, sprintf($sqlQueries['library']['cdss'], pg_escape_string($id), $facetQuery));
		array_push($sqls, sprintf($sqlQueries['library']['items'], pg_escape_string($id), $facetQuery, ''));
	}

	$countSql = join(' union all ', $count);
	if (!empty($countSql)){
		$countSql = sprintf($sqlQueries['library']['count'], $countSql);
		$total = query_execute(null, $countSql, null);
		$total = $total[0]['count'];
	}
	$sql = join(' union all ', $sqls);
	$sql = sprintf($sqlQueries['library']['itemsUnion'], $sql, $page);
	$data = query_execute(null, $sql, TRUE);
	header('Content-Type: application/json');
	return array('data' => $data, 'total' => $total);
}

function mfFeature($ids, $dsid) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['goTranscripts'], pg_escape_string($ids), pg_escape_string($dsid));
}

function bpFeature($ids, $dsid) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['goTranscripts'], pg_escape_string($ids), pg_escape_string($dsid));
}

function ccFeature($ids, $dsid) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['goTranscripts'], pg_escape_string($ids), pg_escape_string($dsid));
}

function keggFeature($ids, $dsid) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['keggTranscripts'], pg_escape_string($ids), pg_escape_string($dsid));
}

function enzymeFeature($ids, $dsid) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['enzymeTranscripts'], pg_escape_string($ids), pg_escape_string($dsid));

}

function eggnogFeature($ids, $dsid) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['eggnogTranscripts'], pg_escape_string($ids), pg_escape_string($dsid));

}

function koFeature($ids, $dsid) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['koTranscripts'], pg_escape_string($ids), pg_escape_string($dsid));

}

function featureDetailsSql($sql, $order, $page) {
	require ('SqlQueries.inc');
	return sprintf($sqlQueries['library']['featureDetails'], $sql, $order, $page);
}

function refineSQL($id, $filters, $facets, $ids = NULL) {
	require ('SqlQueries.inc');
	$sql = array();
	// when more than one library is selected. done so that it works with the previous version of the function.
	if (isset($ids)) {
		$id = join(',', $ids);
		$id = ' in (' . $id . ')';
	} else {
		$id = ' = ' . $id;
	}
	if ($filters) {
		$intersectCvterm = array();
		foreach ($filters as $key => $cvterm) {
			if ($cvterm -> property == 'type') {
				array_push($sql, sprintf($sqlQueries['library']['filters'], pg_escape_string($id), pg_escape_string($cvterm -> value)));
			}
		}
	} else {
		array_push($sql, sprintf($sqlQueries['library']['allFeatures'], pg_escape_string($id)));
	}
	if ($facets) {
		$intersectCvterm = array();
		foreach ($facets as $key => $cvterm) {
			array_push($sql, sprintf($sqlQueries['library']['facets'], pg_escape_string($cvterm -> value), pg_escape_string($id)));
		}
	}
	return implode(' intersect ', $sql);
}

function reduceArray($v, $item) {
	$values = array_values($item);
	return array_merge($v, $values);
}

function getUncategorisedFeatures($selectedIds) {
	require ('SqlQueries.inc');
	$id = -1 * $selectedIds[0];
	$librariesSql = sprintf($sqlQueries['organismLibraries'], pg_escape_string($id));
	$libraries = query_execute(null, $librariesSql, null);
	$libraries = array_reduce($libraries, "reduceArray", array());
	$libraries = '(' . implode(',', $libraries) . ')';
	$cvtermidsql = sprintf($sqlQueries['cvtermid'], pg_escape_string('polypeptide'));
	$cvtermid = query_execute(null, $cvtermidsql);
	$cvtermid = $cvtermid ? $cvtermid[0]['cvterm_id'] : 0;
	$sql = sprintf($sqlQueries['library']['uncategorised'], pg_escape_string($cvtermid), pg_escape_string($id), $libraries, pg_escape_string($_REQUEST['limit']), pg_escape_string($_REQUEST['start']));
	$features = query_execute(null, $sql, null);
	$totalSql = sprintf($sqlQueries['library']['totalUncategorised'], pg_escape_string($cvtermid), pg_escape_string($id), $libraries);
	$total = query_execute(null, $totalSql, null);
	$total = $total ? $total[0]['count'] : 0;
	return array('total' => $total, 'data' => $features);
}


function get_library_expression_metadata($dsid,$library_uname){
	if (empty($library_uname)){return;}
	require ('SqlQueries.inc');

	if ($library_uname === 'All'){
		$sql = sprintf($sqlQueries['library']['get_expression_library_metadata_all'], pg_escape_string($dsid));
	}else{
		$sql = sprintf($sqlQueries['library']['get_expression_library_metadata'], pg_escape_string($dsid),pg_escape_string($library_uname));
	}
	$return = query_execute(null, $sql);
	return $return;
}

function addLibraryStats($id, $selection) {
	require ('SqlQueries.inc');
	$contigSql = sprintf($sqlQueries['library']['contigCount'], pg_escape_string($id));
	$data = query_execute(null, $contigSql, null);
	$data[0]['term'] = number_format($data[0]['term']);
	$data[0]['selection'] = $selection;
	$transcriptSql = sprintf($sqlQueries['library']['cdsCount'], pg_escape_string($id));
	$data2 = query_execute(null, $transcriptSql, null);
	$data2[0]['term'] = number_format($data2[0]['term']);
	$data2[0]['selection'] = $selection;
	return array_merge($data, $data2);
}

function add_expression_library_stats($ids,$selection){
	require ('SqlQueries.inc');
	$ids_for_sql_array = array();
	$dsid = 0;
	$return_array = array();
	foreach ($ids as $id){
		preg_match('/^(\d+)\^(.+)/',$id,$matches);
		$dsid=$matches[1];
		$id = pg_escape_string($matches[2]);
		if ($id === 'All'){
			$sql = sprintf($sqlQueries['library']['count_expression_library_transcripts_all'], $dsid);
		}else{
			$sql = sprintf($sqlQueries['library']['count_expression_library_transcripts'], $dsid, $id);
		}
		$data = query_execute(null, $sql);
		$return_array[] = array('term'=>number_format($data[0]['count']),'selection'=>$id,'vocabulary'=>'Number of transcripts','library name'=>$id);
	}
	return $return_array;
}


function get_expression_libraries($dsid){
	// gets expression libraries for whole dataset
	if (empty($dsid)){return;}
	require ('SqlQueries.inc');
	$sql  = sprintf($sqlQueries['library']['get_expression_library'], pg_escape_string($dsid));
	$return = query_execute(null, $sql);
	return $return;
}

?>
