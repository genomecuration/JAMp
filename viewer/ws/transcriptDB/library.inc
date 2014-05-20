<?PHP
require_once ('utils.inc');

function listLibrary($lib) {
	global $db;
	require ('SqlQueries.inc');
	$lib = cleanLib($lib);

	$cvtermSql = sprintf($sqlQueries['library']['metadataDataset'], pg_escape_string($lib));
	$result = query_execute($db, $cvtermSql, null);
	$result = flattenTwoD($result, 'vocabulary', 'term', 'selection', 'library name');
	// flatten result
	// $data = array();
	// $res = array_merge( $result );
	return $result;
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

function featureLibraryList($ids) {
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
	require ('SqlQueries.inc');
	require_once ('const.inc');
	// $id = $_REQUEST['id'];
	// // echo print_r( $request );
	// $intersect = array();
	// // library filter
	// $filters = json_decode($_REQUEST['filter']);
	// $cvtermsArray = json_decode($_REQUEST['cvterms']);
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
			// $facetQuery = sprintf( $sqlQueries['library']['itemsFacets'], $go_id );
			$facetQuery = '(' . join(') intersect (', $facetsQueryArray) . ')';
			$facetQuery = sprintf($sqlQueries['library']['unameFilter'], $facetQuery);
		}
		// echo print_r($ids);
		// $order = orderby($_REQUEST, $translation);
		//
		// $refineSql = refineSQL($id, $filters, $facets , $ids);
		// echo $facetQuery;
		array_push($count, sprintf($sqlQueries['library']['cdss'], pg_escape_string($id), $facetQuery));
		array_push($sqls, sprintf($sqlQueries['library']['items'], pg_escape_string($id), $facetQuery, ''));
		// echo sprintf( $sqlQueries['library']['items'], $id, $facetQuery ,'');
	}
	
	$countSql = join(' union all ', $count);
	if (!empty($countSql)){
		$countSql = sprintf($sqlQueries['library']['count'], $countSql);
		$total = query_execute(null, $countSql, null);
		$total = $total[0]['count'];
	}
	$sql = join(' union all ', $sqls);
	$sql = sprintf($sqlQueries['library']['itemsUnion'], $sql, $page);
	// echo print_r($sqls);
	// echo $sql;
	// echo $countSql;
	// $detailsSql = featureDetailsSql( $refineSql , $order['string'] , $page );
	//
	// if ($countSql) {
	// $count = query_execute(null, $countSql, null);
	// $total = $count[0]['count'];
	// }
	// $data = query_execute(null, $detailsSql , null);
	// echo 'nothing';

	// echo $sql;
	$data = query_execute(null, $sql, TRUE);
	// echo print_r( $data );
	header('Content-Type: application/json');
	$result = array('data' => $data, 'total' => $total);

	return $result;
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

function addLibraryStats($id, $selection) {
	require ('SqlQueries.inc');
	$contigSql = sprintf($sqlQueries['library']['contigCount'], pg_escape_string($id));
	$data = query_execute(null, $contigSql, null);
	$data[0]['term'] = number_format($data[0]['term']);
	$transcriptSql = sprintf($sqlQueries['library']['cdsCount'], pg_escape_string($id));
	$data2 = query_execute(null, $transcriptSql, null);
	$data2[0]['term'] = number_format($data2[0]['term']);
	return array_merge($data, $data2);
}
?>
