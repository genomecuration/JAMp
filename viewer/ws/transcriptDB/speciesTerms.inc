<?PHP
require_once ('library.inc');
require_once ('utils.inc');


function get_cv_from_species($selectedIds){
	require ('SqlQueries.inc');
	$data = array();
	// currently have to check that we only get datasets that people have access to.
	// move this to utils
	global $own;
	$my_datasets = array();
	$my_datasets_sql = sprintf($sqlQueries['datasets'], pg_escape_string($own));
	$my_datasets_result = query_execute(null, $my_datasets_sql);
	foreach ($my_datasets_result as $result){
		$my_datasets[] = $result['dataset_id'];
	}
	if (!empty($selectedIds)){
	  foreach ($selectedIds as $species_id){
			$librariesSql = sprintf($sqlQueries['organismLibraries'], pg_escape_string($species_id));
			$result = query_execute(null, $librariesSql);
			foreach ($result as $lib_data){
				foreach ($lib_data as $dataset_id){
				 if (in_array($dataset_id,$my_datasets)){
                                               $meta = listLibrary( $dataset_id );
                                               $data = array_merge( $data, $meta );
                                               $stats = array();
                                               if(count($meta)){
                                                       $stats =addLibraryStats( $dataset_id , $meta[0]['selection'] );
                                               }
                                               $data = array_merge( $data, $stats );
				 }
				}
			}
	  } 
	}
	return $data;
}



function listTerms ( $id , $ids) {
  require('SqlQueries.inc');
 
  // flatten result
  $prop = array();
  $data = array ();
  $i;
  $result = array_merge( $dbxrefResult , $propResult );
  return $result;
}

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
function featureSpeciesList($speciesIds) {
	require ('SqlQueries.inc');
	require_once('const.inc');
	global $own;
	$facets = json_decode($_REQUEST['facets'], TRUE);
	// echo print_r($facets);
	$page = paging($_REQUEST);

	$count = array();
	$sqls = array();
	foreach ($speciesIds as $key => $species) {
		$dsSql = sprintf($sqlQueries['species']['datasets'], pg_escape_string($species), pg_escape_string($own));
		$ds = query_execute(NULL, $dsSql, NULL);
		$facetsQueryArray = array();
		foreach ($ds as $index => $dsid) {
			$id = $dsid['dataset_id'];
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
					case CV::nothit:
						$facetSql = sprintf($sqlQueries['library']['nohitsTranscripts'], $id);
						break;
				}
				// echo $facetSql." sql";
				array_push($facetsQueryArray, $facetSql);
			}
			// echo print_r($facetsQueryArray);

			$facetQuery = '';
			if (count($facets) > 0) {
				$facetQuery = '(' . join(') intersect (', $facetsQueryArray) . ')';
				$facetQuery = sprintf($sqlQueries['library']['unameFilter'], $facetQuery);
			}
			// echo print_r($ids);

			// echo $facetQuery;
			array_push($count, sprintf($sqlQueries['library']['cdss'], $id, $facetQuery));
			array_push($sqls, sprintf($sqlQueries['library']['items'], $id, $facetQuery, ''));
		}
	}
	$countSql = join(' union all ', $count);
	if (!empty($countSql)){
		$countSql = sprintf($sqlQueries['library']['count'], $countSql);
		$total = query_execute(null, $countSql, null);
		$total = $total[0]['count'];
		
	}
	//echo print_r($sqls);
	$sql = join(' union all ', $sqls);
	$sql = sprintf($sqlQueries['library']['itemsUnion'], $sql, $page);
	// echo $sql;
	// echo $countSql;
	// echo 'nothing';
	// echo $sql;
	$data = query_execute(null, $sql, null);

	header('Content-Type: application/json');
	$result = array('data' => $data, 'total' => $total);

	return $result;
}
?>
