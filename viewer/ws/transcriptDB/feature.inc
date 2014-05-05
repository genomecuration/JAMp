<?php
require_once ('utils.inc');
require_once ('const.inc');
function featureList() {
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
	global $own;
	$translation = array('feature_id' => array('name' => 't.uname', 'type' => 'number'), 'name' => array('name' => 't.uname', 'type' => 'number'));

	// iterate through datasets table
	// union of all dataset schema
	// limit offset
	$filterArray = json_decode($_REQUEST['filter']);
	foreach ($filterArray as $key => $filterParam) {
		if ($filterParam -> property == 'feature_id') {
			$dsType = datasetType($filterParam -> value);
			$filterParam -> value = $dsType['id'];
			$filterParam -> type = $dsType['type'];
			$filterParam -> dataset_id = $dsType['dataset_id'];
		}
	}
	$filter = filterWithSubQuery($filterArray, $translation, 'end');
	// echo print_r( $filter );
	$params = datasetType($_REQUEST['feature_id']);
	$datasetsSql = sprintf($sqlQueries['datasets'], $own);
	$datasets = query_execute(null, $datasetsSql);

	$page = paging($_REQUEST);
	$dsQueries = array();
	$totalQueries = array();
	$libraries = array();
	// print_r($datasets);
	foreach ($datasets as $key => $ds) {
		$id = $ds['dataset_id'];
		$libraries[$id] = $ds;
		// echo $ds['organism_id'];
		if (count($filterArray) == 0) {
			// echo "count 1";
			array_push($dsQueries, sprintf($sqlQueries['feature']['transcriptFilter'], $id, $filter['string'], $ds['species_name']));
			array_push($totalQueries, sprintf($sqlQueries['feature']['countTranscript'], $id, $filter['string']));
		} else {
			// echo "count 2";
			// echo "$id ".$filterArray[0]->dataset_id;
			if ($id == $filterArray[0] -> dataset_id) {
				switch ($filterArray[0]->type) {
					case Type::gene :
						array_push($dsQueries, sprintf($sqlQueries['feature']['geneFilter'], $id, $filter['string'], $ds['species_name']));
						array_push($totalQueries, sprintf($sqlQueries['feature']['countGene'], $id, $filter['string']));
						break;
					case Type::transcript :
						array_push($dsQueries, sprintf($sqlQueries['feature']['transcriptFilter'], $id, $filter['string'], $ds['species_name']));
						array_push($totalQueries, sprintf($sqlQueries['feature']['countTranscript'], $id, $filter['string']));

						break;
					default :
						break;
				}
			} else if (!$filterArray[0] -> dataset_id) {
				array_push($dsQueries, sprintf($sqlQueries['feature']['transcriptFilter'], $id, $filter['string'], $ds['species_name']));
				array_push($totalQueries, sprintf($sqlQueries['feature']['countTranscript'], $id, $filter['string']));
			}
		}
		// echo $filterParam->{0}->type." <br/>";
	}
	$sql = sprintf($sqlQueries['feature']['unionQuery'], join(' union ', $dsQueries), $page);
	// echo print_r($dsQueries);
	// echo $sql;
	$data = query_execute(null, $sql);

	foreach ($data as $key => $value) {
		if ($value['nuc_sequence']) {
			// get sequence length
			switch ($filterArray[0]->type) {
				case Type::gene :
					// echo seqLen($value['nuc_sequence']);
					$data[$key]['seqlen'] = seqLen($value['nuc_sequence']);
					break;
				case Type::transcript :
					$data[$key]['seqlen'] = $data[$key]['cds_stop'] - $data[$key]['cds_start'] + 1;
					unset($data[$key]['cds_stop']);
					unset($data[$key]['cds_start']);
					break;
			}
			unset($data[$key]['nuc_sequence']);
			if ($data[$key]['srcfeature']) {
				$data[$key]['sources'] = array( array('feature_id' => $data[$key]['srcfeature'], 'uniquename' => $data[$key]['srcfeature']));
			}
			// add library
			$data[$key]['libraries'] = array( array('library_id' => $libraries[$data[$key]['datasetid']]['dataset_id'], 'library_name' => $libraries[$data[$key]['datasetid']]['description']));
			unset($data[$key]['datasetid']);
			// unset( $data[$key]['nuc_sequence'] );
			// add species name
			$data[$key]['species'] = $datasets[0]['species_name'];
		}
	}

	$totalSql = sprintf($sqlQueries['feature']['unionCount'], join(' union all ', $totalQueries));
	// echo $totalSql;
	$total = query_execute(null, $totalSql);
	$total = $total[0]['count'];
	$result = array('data' => $data, 'total' => $total);
	return $result;
}

function feature_details() {
	$sql = "SELECT column_name from information_schema.columns WHERE table_name='feature'";
}

function featureController() {
	$view = $_REQUEST['view'];
	switch ($view) {
		default :
		case 'feature' :
			featureList();
			break;
		case 'species' :
			featureSpeciesList();
			break;
		case 'library' :
			featureLibraryList();
			break;
	}
}

function featureCV($id) {
	require ('SqlQueries.inc');
	require 'genomebrowser.inc';
	$minmax = '';
	$parsed = datasetType($id);
	$id = $parsed['id'];
	$dsId = $parsed['dataset_id'];

	$tSql = sprintf($sqlQueries['feature']['tUniprotUrl'], $id, $dsId);
	$tUrl = query_execute($db, $tSql, null);

	$transciptDetailsSql = sprintf($sqlQueries['transcriptDetails'], $dsId, $id);
	$transcript = query_execute(null, $transciptDetailsSql, null);
	$groups = uniprotGroups($dsId, $id);
	$grps = knownProteinHits($dsId, $transcript[0]);
	// echo print_r($grps);
	$groupLookup = array();
	// make a hash of fmin and fmax values
	foreach ($groups as $index => $group) {
		$minmax = $group['fmin'] . ' ' . $group['fmax'];
		$groupLookup[$minmax] = $grps[$index]['fmin'] . ' - ' . $grps[$index]['fmax'];
	}
	foreach ($tUrl as $key => $columns) {
		$columns['value'] = ahref($columns['known_protein_id'], $columns['value']);
		$minmax = $columns['fmin'] . ' ' . $columns['fmax'];
		$columns['gr'] = $groupLookup[$minmax];
		unset($columns['known_protein_id']);
		$tUrl[$key] = $columns;
	}
	// echo print_r($tUrl);
	$gSql = sprintf($sqlQueries['feature']['gUniprotUrl'], $dsId, $id);
	$gUrl = query_execute($db, $gSql, null);
	foreach ($gUrl as $key => $columns) {
		$columns['value'] = ahref($columns['gene'], $columns['value']);
		unset($columns['gene']);
		$gUrl[$key] = $columns;
	}
	$res = array('root' => array_merge($gUrl, $tUrl));
	return $res;
}

/**
 * group the uniprot hits according to query start and query end columns
 */
function uniprotGroups($dsId, $id) {
	require ('SqlQueries.inc');

	$tSql = sprintf($sqlQueries['gb']['knownProteinHits'], $dsId, $id);
	$result = query_execute(null, $tSql, null);
	return $result;
}


/*
 * Helper function of featureFasta to get the 
 * sequence of a feature (transcript or gene)
 * @author Alexie
 */
function get_featureFasta($feature_id){
	if (empty($feature_id)){return;}
	require ('SqlQueries.inc');
	$params = datasetType( $feature_id );
	switch ($params['type']) {
			case Type::gene :
				$sql = sprintf($sqlQueries['fasta'], $params['dataset_id'], $params['id']);
				$result = query_execute('chado', $sql, null);
				break;
			case Type::transcript :
				$sql = sprintf($sqlQueries['fastaTranscript'], $params['dataset_id'], $params['id']);
				$result = query_execute('chado', $sql, null);
				$start = $result[0]['cds_start'] - 1;
				$stop = ($result[0]['cds_stop'] - 1);
				$len = $stop - $start + 1;
				$geneticcode = substr($result[0]['residues'], $start, $len);
				$result[0] = array_replace($result[0], array('residues' => $geneticcode));
				// echo "$start $stop ".strlen($result[0]['residues']);
				break;
		}
		if (!empty($result)){
			$name = $result[0]['uniquename'];
			if (!empty($result[0]['residues'])){
				$fasta_out = ">$name\n".chunk_split($result[0]['residues'], 80, "\n");
			}
			return array($result[0],$fasta_out);
		}else{
			return array();
		}
}

function featureFasta( $id ) {
	$return = array();
	if ( $id ) {
		header('Content-Type: text/plain;');
		header('Content-Disposition: attachment; filename=' . $featureId . '.txt');
		list ($feature_data,$fasta) = get_featureFasta($id);
		if (!empty($feature_data)){
			$return = $feature_data;
			$return[ 'out' ] = $fasta;
		}else{
			$return[ 'out' ] = "No data found";
		}
	} else {
		$return[ 'out' ] = "Please provide feature id";
	}
	
	return $return;
}

/*
 * Like featureFasta but multiple IDs
 * expects either an array or json or string delimited by ; (in that order)
 * @author Alexie
 */
function get_multiple_featureFasta($feature_ids){
	$return_fasta = '';
	if (empty($feature_ids)){return $return_fasta;}
	if (!is_array($feature_ids)){
		$feature_ids = json_decode($feature_ids);
		// still not an array? delimit by;
		if (!is_array($feature_ids)){
				$feature_ids = explode(';',$feature_ids);
		}
	}
	
	foreach ($feature_ids as $id){
		list ($feature_data,$fasta) = get_featureFasta($id);
		$return_fasta .= $fasta;
 	}
	if (empty($return_fasta)){
		$return_fasta = "No sequences found\n";
	}
 	return $return_fasta;
}


function getAnnotations($id) {
	$go = annotations($id, 'transcriptGO');
	$kegg = annotations($id, 'transcriptKEGG');
	$ko = annotations($id, 'transcriptKO');
	$enzyme = annotations($id, 'transcriptENZYME');
	$eggnog = annotations($id, 'transcriptEGGNOG');

	$result = array('text' => 'Vocabularies', 'children' => array());
	if (count($go) > 0) {
		array_push($result['children'], array('text' => 'GO', 'expanded' => 'true', 'children' => $go));
	}
	if (count($kegg) > 0) {
		array_push($result['children'], array('text' => 'KEGG', 'expanded' => 'true', 'children' => $kegg));
	}
	if (count($ko) > 0) {
		array_push($result['children'], array('text' => 'KO', 'expanded' => 'true', 'children' => $ko));
	}
	if (count($enzyme) > 0) {
		array_push($result['children'], array('text' => 'ENZYME', 'expanded' => 'true', 'children' => $enzyme));
	}
	if (count($eggnog) > 0) {
		array_push($result['children'], array('text' => 'EGGNOG', 'expanded' => 'true', 'children' => $eggnog));
	}
	// $result= array( 'root' => $result );
	return json_encode($result);
}

function annotations($id, $cv) {
	require ('SqlQueries.inc');
	$idDs = datasetType($id);
	$sql;
	switch ( $idDs['type'] ) {
		case Type::gene :
			$sql = sprintf($sqlQueries['library'][$cv], $idDs['dataset_id'], $idDs['transcriptName']);
			break;
		case Type::transcript :
			$sql = sprintf($sqlQueries['library'][$cv], $idDs['dataset_id'], $idDs['id']);
			break;
	}
	// echo $sql."\n";
	$result = query_execute(null, $sql, null);
	return $result;
}

function getNetworkTree($id) {
	require ('SqlQueries.inc');
	$idDs = datasetType($id);
	$res;
	switch ( $idDs['type'] ) {
		case Type::gene :
			$res = array();
			$sql = sprintf($sqlQueries['checkGene'], $idDs['dataset_id'], $idDs['id']);
			$transcripts = query_execute(null, $sql);
			// echo print_r( $sql );
			foreach ($transcripts as $key => $transcript) {
				array_push($res, getAllTranscriptNetworks($transcript['tuname'], $idDs['dataset_id']));
			}
			$res = array('text' => $idDs['id'], 'expanded' => 'true', 'children' => $res);
			break;
		case Type::transcript :
			$res = getAllTranscriptNetworks($idDs['id'], $idDs['dataset_id']);
			break;
	}
	return $res;
}

/**
 * get all networks for a given transcript
 */
function getAllTranscriptNetworks($id, $dsId) {
	require ('SqlQueries.inc');
	$sql = sprintf($sqlQueries['feature']['networkTree'], $id, $dsId);
	$res = query_execute(null, $sql);
	return array('text' => $id, 'expanded' => 'true', 'children' => $res);
}

function getNetworkJson($id, $dsId) {
	require ('SqlQueries.inc');
	$dsId = datasetType($dsId);
	$sql = sprintf($sqlQueries['feature']['networkJson'], $id, $dsId['dataset_id']);
	$res = query_execute(null, $sql);
	return $res[0]['json'];
}
?>