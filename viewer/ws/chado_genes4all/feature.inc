<?php
require_once ('utils.inc');
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
	require('SqlQueries.inc');
	$translation = array(
	'type' => 'cvt.name',
	'species' => 'o.species', 
	'library_name' => 'lib.library_id', 
	'feature_id' => array(
		'name' => 'f.feature_id', 
		'type' => 'number'),
	 'name' => 'f.name',
	 'uniquename' => 'f.uniquename',
	 'seqlen'=>'f.seqlen',
	 'organism_id' => array('name' => 'f.organism_id', 
	 	'type' => 'number'),
	 'cvterm_id' => array('name' => 'cvt.cvterm_id',
		 'type' => 'number'),
	 'library_id' => array('name' => 'lib.library_id',
		 'type' => 'number'),
	 'srcuniquename' => 'fs.srcuniquename', 
	 'srcfeature_id' => array('name' => 'loc.srcfeature_id',
		'type' => 'number')
	);


	$total = 100000000;

	$sqlTotal = $sqlQueries['feature']['total'];
	$total = getRowsFromExplain($sqlTotal, 'feature' , 'chado');

	$request = cloning($_REQUEST);

	$intersect = array();
	// library filter
	$filterArray = json_decode($_REQUEST['filter']);
	$selectors = new stdClass();
	$selectors -> {0} = new stdClass;
	$selectors -> {0} -> {'property'} = 'cv_id';
	$selectors -> {0} -> {'data'} = 'comparison';
	$selectors -> {0} -> {'value'} = 29;
	$selectors -> {1} = new stdClass;
	$selectors -> {1} -> {'property'} = 'cvterm_id';

	$selectors -> {1} -> {'value'} = 32771;


	foreach ($filterArray as $key => $value) {
		switch ($value->property) {
			case 'libraries' :
				array_push($intersect, sprintf( $sqlQueries['feature']['filterLibraries'] , $value -> value ));
				unset($filterArray[$key]);
				break;
			case 'srcuniquename' :
				array_push($intersect, sprintf( $sqlQueries['feature']['filterSrcFeature'] , $value -> value ) );
				unset($filterArray[$key]);
				break;
		}
	}
	$intersectSql = join(' intersect ', $intersect);
	$filter = filterWithSubQuery($filterArray, $translation, 'end');
	$order = orderby($_REQUEST, $translation);
	$where = filter($selectors, $translation);
	$page = paging($_REQUEST);
	$featureSql = '';
	$countSql = '';
	if ($intersectSql) {

		$countSql = sprintf( $sqlQueries['feature']['countFiltered'], $intersectSql , $filter['string'] );

		$featureSql = sprintf( $sqlQueries['feature']['featureFiltered'], $intersectSql, $filter['string'] , $order['string'] , $page );
	} else {
		if($filter['string']) {
			$countSql = sprintf( $sqlQueries['feature']['countWithout'] , $filter['string'] );

		}

		$featureSql = sprintf( $sqlQueries['feature']['withoutFilter'] , $filter['string'] , $order['string'], $page );
	}
	if ($countSql) {
		$total = query_execute('chado', $countSql, null);
		$total = $total[0]['count'];
	}
	$data = query_execute('chado', $featureSql, null);
	$data = addLibraries($data);
	$data = addSourceFeature($data);
	$result = array('data' => $data, 'total' => $total);
	return $result;
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


function featureCV() {
	require('SqlQueries.inc');
	$featureId = $_REQUEST['feature_id'];

	$cvtermSql = sprintf( $sqlQueries['feature']['cvterm'] , $featureId );
	// connect to db
	$result = query_execute('chado', $cvtermSql, null);

	$propSql = sprintf( $sqlQueries['feature']['propSql'], $featureId );
	$prop = query_execute('chado', $propSql, null);


	$dbxrefSql = sprintf( $sqlQueries['feature']['dbxref'] , $featureId);
	$dbxref = query_execute('chado', $dbxrefSql, null);

	$res = array('root' => array_merge($result, $prop, $dbxref));
	return $res;
}

/*
 * Helper function of featureFasta to get the
 * sequence of a feature (transcript or gene)
 * @author Alexie
 */
function get_featureFasta($feature_id){
	if (empty($feature_id)){return;}
	require ('SqlQueries.inc');
	$sql = sprintf( $sqlQueries['fasta'], $feature_id );
	$result = query_execute('chado', $sql, null);
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

/*
 * get fasta of single ID
 */
function featureFasta( $id ) {
	$return = array();
	if (!empty($id )) {
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



?>