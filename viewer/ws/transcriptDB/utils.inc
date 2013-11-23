<?php
require_once 'const.inc';
/*
 * filtering
 * ordering
 * grouping
 */
 
 /* array(
  * conditions =>array(
  * 1 => 'a.a = b.a',
  * 2 => 'a.c = 'a''
  * ),
  * string => 'where a.a = b.a and a.c = 'a''
  * )
  */
  
  $paramConfig=array(
  	'filterParam' => 'filter',
  	'orderParam' => 'order',
  	'groupParam' => 'group'
  );
/*
 *parameters
 * params - $_REQUEST
 * filter - format - Array( 0 => array( 'data'='VALUEIFNUMBER','property'=>'PROPERTYVALUE','value'=>'FIELDVALUEIFSTRING'));
 * translation - an array that can translate filter property to appropriate sql names
 * searchType - values -( 'all','end', 'beginning')
 */
function filter( $filter , $translation , $searchType ){
	global $paramConfig;
  // $translation  = array('type' => 'cvt.name' );
	// $filter = $params[ 'filter' ];
	// echo print_r($paramConfig);
	// $filter = json_decode( $filter );
	$output  = array(
		'conditions' => array( ),
		'string' => ''
	);
	foreach ($filter as $key => $value) {
		$type = $value->data ? 'comparison':'regex';
		$colName = $value->property;
		if ( $translation && $translation [ $colName ]){
			$colName = $translation [ $colName ];
			if( is_array( $colName ) ){
				if ( $colName['type'] == 'number' ){
					$type = 'comparison';
				}
				$colName = $colName['name'];
			}
		}
		switch ($type) {
			case 'comparison':
				array_push( $output['conditions'] , $colName." = ".$value->value );
			break;
			case 'regex':
				// echo $translation [ $colName ];
				switch ( $searchType) {
					case 'end':
						array_push($output['conditions'] , $colName." like '".$value->value ."%'");
						break;
					case 'beginning':
						array_push($output['conditions'] , $colName." like '%".$value->value ."'");
						break;
					case 'all':
						array_push($output['conditions'] , $colName." like '%".$value->value ."%'");
					default:
						array_push($output['conditions'] , $colName." = '".$value->value ."'");
						break;
				}
				
			break;	
		}
	}
	if ( count ( $output['conditions'] )){
		$output ['string'] = 'where '.join(' and ', $output['conditions']);
	}
	return $output;
}
/*
 *parameters
 * params - $_REQUEST
 * filter - format - Array( 0 => array( 'data'='VALUEIFNUMBER','property'=>'PROPERTYVALUE','value'=>'FIELDVALUEIFSTRING'));
 * translation - an array that can translate filter property to appropriate sql names
 * searchType - values -( 'all','end', 'beginning')
 */
function filterWithSubQuery( $filter , $translation , $searchType ){
	global $paramConfig;
  // $translation  = array('type' => 'cvt.name' );
	// $filter = $params[ 'filter' ];
	// echo print_r($paramConfig);
	// $filter = json_decode( $filter );
	$output  = array(
		'conditions' => array( ),
		'string' => ''
	);
	foreach ($filter as $key => $value) {
		// echo print_r($value);
		$type = $value->data ? 'comparison':'regex';
		$colName = $value->property;
		if ( $translation && $translation [ $colName ]){
			$colName = $translation [ $colName ];
			if( is_array( $colName ) ){
				if ( $colName['type'] == 'number' ){
					$type = 'comparison';
				}
				$colName = $colName['name'];
				$value->property = $colName;
			}
		}
		// removing regex search as it is taking too much time
		// echo $value->property;
		switch( $value->property ){
			// case 'type':
				// array_push($output['conditions'] ,"type_id in (select cvterm_id from cvterm where name = '".$value->value."')" );
				// break;
			// case 'genus':
				// array_push($output['conditions'] , "organism_id in (select organism_id from organism where genus = '".$value->value."')" );
				// break;
			// case 'species':
				// array_push($output['conditions'] , "organism_id in (select organism_id from organism where species = '".$value->value."')" );
				// break;
			// case 'name':
				// array_push($output['conditions'] , "f.name like '".$value->value."%'" );
				// break;
			case 't.uname':
				array_push( $output['conditions'], $value->property." = '".$value->value."'" );
				break;
		}

	}
	if ( count ( $output['conditions'] )){
		$output ['string'] = 'where '.join(' and ', $output['conditions']);
	}
	return $output;
}
function where ( ){
	
}
 /* array(
  * conditions =>array(
  * 1 => 'a.a DESC',
  * 2 => 'b.c'
  * ),
  * string => 'order by a.a, b.c DESC'
  * )
  */
function orderby( $params , $translation) {
		global $paramConfig;
  // $translation  = array('type' => 'cvt.name' );
	$filter = $params[ 'sort' ];
	// echo print_r($paramConfig);
	$filter = json_decode( $filter );
	$output  = array(
		'conditions' => array( ),
		'order' =>'',
		'string' => ''
	);
	foreach ($filter as $key => $value) {
				$colName = $value->property;
				if ( $translation && $translation [ $colName ]){
					$colName = $translation [ $colName ];
				}
				// echo $translation [ $colName ];
				array_push( $output['conditions'] , $colName." ".$value->direction );
	}
	if ( count ( $output['conditions'] )){
		$output ['string'] = 'order by '.join(' , ', $output['conditions'] );
	}
	return $output;
}
 /* array(
  * conditions =>array(
  * 1 => 'a.a',
  * 2 => 'b.c'
  * ),
  * order =>'DESC',
  * string => 'order by a.a, b.c DESC'
  * )
  */
function groupby() {
	
}

function paging ( $params ) {
	global $paramConfig;
  	// $translation  = array('type' => 'cvt.name' );
	$filter = $params[ 'sort' ];
	// echo print_r($paramConfig);
	$filter = json_decode( $filter );
	$str ='';
	$offset = $params['start'];
	$limit = $params['limit'];
	// if ( count ( $output['conditions'] )){
	$str = "limit $limit offset $offset";
	// }
	return $str;
}
function cloning ( $old ) {
	// $new = array();
	// foreach ($old as $k => $v) {
	    // $new[$k] = clone $v;
	// }
	return array_merge(array(), $old);
}
/**
 * short hack for demo.
 * TODO: this function should remove underscore, capitalize first letter
 */
function processData ( $trans  ){
	$translate  = array(
	'EC'=>'Enzyme Classification',
	'KEGG_PATHWAY'=>'Pathway',
	'molecular_function'=>'Molecular function',
	'biological_process'=>'Biological process',
	'cellular_component'=>'Cellular component',
	'sequence'=>'Sequence',
	'dbxref'=>'Database cross reference',
	'blast'=>'BLAST'
	);
	foreach ($trans as $key => $value) {
		// echo print_r($value);
		$value['title'] = $translate[ $value['name'] ];
		// echo $value['title'];
		$trans[$key] = $value;
		// echo print_r($value);
	}
	return $trans;
}
function getSequence ( $featureId , $db) {
	$db = $db? $db:'chado';
	if ( $featureId ){
		$sql = "select feature_id  , residues , uniquename from feature where feature_id = $featureId";
		$result = query_execute($db, $sql , null);
		$sequence = $result[0]['residues'];
		return $sequence;
	} else {
		return "Please provide feature id";
	}
}
function getFeature ( $featureId , $dsid) {
	require 'SqlQueries.inc';
	if ( $featureId ){
		$sql = sprintf( $sqlQueries['nucleotides'], $dsid, $featureId );
		$result = query_execute( null, $sql , null);
		if( isset ( $result )){
			$result = $result[0];
		}
		return $result;
	} else {
		return "Please provide feature id";
	}
}
/**
 * iterates thorugh a list of features and adds all libraries they are associated with.
 */
function addLibraries($data) {
	foreach ($data as $key => $row) {
		$featureid = $row['feature_id'];
		$libSql = "select lib.library_id, lib.name as library_name from library_feature libf join library lib on lib.library_id = libf.library_id where libf.feature_id = $featureid";
		$result = query_execute('chado', $libSql, null);
		$row['libraries'] = $result;
		$data[$key] = $row;
	}
	return $data;
}
/**
 * iterates thorugh a list of features and adds all features that use it as a source feature.
 */
function addSourceFeature($data) {
	foreach ($data as $key => $row) {
		$srcSql = "select fs.uniquename , loc.srcfeature_id as feature_id from featureLoc loc join feature fs on loc.srcfeature_id = fs.feature_id where loc.feature_id = $featureid";
		$result = query_execute('chado', $srcSql, null);
		$row['sources'] = $result;
		$data[$key] = $row;
	}
	return $data;
}
function getRowsFromExplain ( $sql , $table , $db){
	if( ! preg_match('/[Ee]xplain/g', $subject)){
		$sql = 'Explain '.$sql;
	}
	$result = query_execute( $db , $sql, null);
	$row;
	foreach ($result as $key => $v) {
		$value = $v ['QUERY PLAN'];
		if( preg_match( '/'.$table.'/' , $value) ){
			preg_match( '/rows=(\d+)\s/' , $value , &$row );
			break;
		}			
	}
	if( isset( $row )){
		return $row[1];
	}
	return;
}
function countSql( $sql ){
	return "SELECT COUNT(*) FROM ( $sql ) AS F";	
}

function query_execute($db = NULL, $sql = NULL, $variables = NULL,$reconnect=TRUE) {
  require_once 'connection.inc';
  $return_array = array();
  $res = pg_query($sql);
  while ($data=pg_fetch_array($res, NULL , PGSQL_ASSOC)){
    $return_array[]=$data;
  }
  return $return_array;
}
function addProperty( $data , $prop , $pValue){
	foreach ($data as $key => $value) {
		// $temp = $value[$prop];
		// if( !isset($temp) ){
			// $temp = array(); 
		// }
		// $temp = array_merge($temp , $pValue);
		$value[$prop] = $pValue;
		$data[$key] = $value;
		// $value[$prop] = $temp;
		// $data[$key] = $value;
	}
	return $data;
}

/*
 * get sequence length
 * $seq - string
 * @returns
 * integer
 */
function seqLen($seq)
{
	if( $seq ){
		return mb_strlen($seq);
	}else {
		return 0;
	}
}

/**
 * return a value for a particular array
 * @parameters
 * $arr - array 
 * $key - key value to return
 */
 function getValue( $arr , $k='value'){
 	// echo print_r($arr);
	// echo $k;
 	return $arr[$k];
 }
 
 /**
  * parse id to extract dataset id and gene or transcript id.
  * @parameters
  * id - dataset id
  * 	example format - dataset_18.m.1  
  */
  function datasetType( $id )
  {
	  require('SqlQueries.inc');
	  $datasetType = '';
	  $result = array();
	  // echo $id;
	  preg_match('/^dataset_([^.]+)\.(.*)$/', $id, $ids);
	  
	  if( count( $ids ) > 1 ){
	  	$datasetId = $ids[1];
		$id = $ids[2];
		$result['id'] = $id;
		$result['dataset_id'] = $datasetId;
		$sql = sprintf($sqlQueries['checkGene'], $datasetId, $id);
		$resSql = query_execute( null, $sql,null);
		if( count ( $resSql ) > 0){
			$result['type'] = Type::gene;
			$result['transcriptName'] = $resSql[0]['tuname']; 
		} else {
			$sql = sprintf($sqlQueries['checkTranscript'], $datasetId, $id);
			$resSql = query_execute( null, $sql, null);
			if( count($resSql) > 0){
				$result['type'] = Type::transcript;
			}
		}
	  }
	  return $result;
  }
/**
 * html format a link
 * @parameters
 * $text - text to be display
 * $href - url that should be linked 
 */
function ahref( $text , $href){
	return "<a href='$href'>$text</a>";
}

 /**
  * 
  */
  function flattenTwoD ( $twoD , $keyName='key',$valueName='value', $additionalInfoName,$additionalInfoValue){
  	$thin = array();
  	foreach ($twoD as $key => $value) {
	  	$thin = array_merge( $thin , flattenArray($value, $keyName, $valueName , $additionalInfoName, $additionalInfoValue ) );
	  }
	return $thin;
  }

/**
 * takes an associative array and converts it into an array of values.
 * example: array ( 'y'=>'x','c'=>'l')
 * output:  array ( array('key'=>'y','value'=>'x'), array('key'=>'c','value'=>'l') ) 
 */
 function flattenArray( $fat , $keyName='key',$valueName='value', $addInfoName, $addInfoValue ){
 	$thin = array();
	foreach ($fat as $key => $value) {
		if( $addInfoName ){
			array_push( $thin, array( $keyName=>$key,$valueName=>$value ,$addInfoName=>$fat[$addInfoValue]) );
		} else {
			array_push( $thin, array( $keyName=>$key,$valueName=>$value ) );
		}
	}
	return $thin;
}

?>
