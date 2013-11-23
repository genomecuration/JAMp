<?PHP
require_once ('library.inc');
require_once ('utils.inc');
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

	$facets = json_decode($_REQUEST['facets'], TRUE);
	// echo print_r($facets);
	$page = paging($_REQUEST);
	$facetsQueryArray = array();

	$count = array();
	$sqls = array();
	foreach ($speciesIds as $key => $species) {
		$dsSql = sprintf($sqlQueries['species']['datasets'], $species);
		$ds = query_execute(NULL, $dsSql, NULL);
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

					default :
						echo 'default';
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
			array_push($count, sprintf($sqlQueries['library']['transcripts'], $id, $facetQuery));
			array_push($sqls, sprintf($sqlQueries['library']['items'], $id, $facetQuery, ''));
		}
	}
	$countSql = join(' union all ', $count);
	// echo print_r($sqls);
	$countSql = sprintf($sqlQueries['library']['count'], $countSql);
	$sql = join(' union all ', $sqls);

	$sql = sprintf($sqlQueries['library']['itemsUnion'], $sql, $page);
	// echo $sql;
	// echo $countSql;
	$total = query_execute(null, $countSql, null);
	$total = $total[0]['count'];

	// echo 'nothing';

	// echo $sql;
	$data = query_execute(null, $sql, null);

	header('Content-Type: application/json');
	$result = array('data' => $data, 'total' => $total);

	return $result;
}
?>
