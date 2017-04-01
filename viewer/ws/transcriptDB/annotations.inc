<?php
require_once( "utils.inc" );
function autocomplete( $value, $ids,$top_max = 10 ){
	require "SqlQueries.inc";
	require "library.inc";
	$data = array();
	$uniprotHits = array();
	
	$cds_hit_search_sql = $sqlQueries['annotations']['uniprotHits'];
	// if an expression library
	$libs = convert_expression_lib_ids_to_id_array($ids);
	if (!empty($libs) && !empty($libs[0]['dsid'])){
	  $ids = array();
	  foreach ($libs as $data){
	    //$ids[] = $data['dsid']; // and $data['uname']
	    $cds_hit_search_sql .= ' WHERE cds_uname IN (SELECT transcript_uname FROM dataset_%1$d.transcript_expression WHERE '
	    					  .'expression_library_experiment_id IN '.
	                           '(SELECT expression_library_experiment_id FROM expression_library_experiment WHERE library_uname=\'%2$s\') ) ';

	    array_push( $uniprotHits, sprintf($cds_hit_search_sql, pg_escape_string($data['dsid']),pg_escape_string($data['uname']) ) );
	  }
	}else{
	  foreach ($ids as $key => $id) {
		array_push( $uniprotHits, sprintf($cds_hit_search_sql, pg_escape_string($id) ) );
	  }
	}
	$uniprotHits = join(' union ', $uniprotHits );	
	array_push( $data,  goAutoComplete( $value, $uniprotHits,$top_max ));
	
	if(count($data[0])>=$top_max){
	  return topX( $data, $top_max);
	}
	array_push( $data,  koAutoComplete( $value, $uniprotHits,$top_max ));
    if(count($data[0]) + count($data[1]) >=$top_max){
	  return topX( $data, $top_max);
	}
	array_push( $data,  eggnogAutoComplete( $value, $uniprotHits,$top_max ));
    if(count($data[0]) + count($data[1]) + count($data[2] ) >=$top_max){
	  return topX( $data, $top_max);
	}
	array_push( $data,  enzymeAutoComplete( $value , $uniprotHits,$top_max ));
    if(count($data[0]) + count($data[1]) + count($data[2]) + count($data[3]) >=$top_max){
	  return topX( $data, $top_max);
	}
	array_push( $data,  pathwayAutoComplete( $value , $uniprotHits,$top_max ));
	return topX( $data, $top_max);
}
function goAutoComplete($value='', $uniprotHits,$top_max){
	require "SqlQueries.inc";
	$number = "";
	if( is_numeric($value) ){
		$number = "known_proteins.go.go_id = ".pg_escape_string($value);
	} else {
		$number = "name ILIKE '%".pg_escape_string($value)."%'";
	}
	
	$sql = sprintf( $sqlQueries['annotations']['goauto'], $number, $uniprotHits,$top_max );
	$data = query_execute( null, $sql, null );
	return $data; 
}
function koAutoComplete( $value, $uniprotHits,$top_max ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['koauto'], pg_escape_string($value), $uniprotHits,$top_max );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function eggnogAutoComplete( $value, $uniprotHits,$top_max ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['eggnogauto'], pg_escape_string($value), $uniprotHits,$top_max );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function enzymeAutoComplete( $value, $uniprotHits,$top_max ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['enzymeauto'], pg_escape_string($value), $uniprotHits,$top_max );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function pathwayAutoComplete( $value, $uniprotHits,$top_max ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['pathwayauto'], pg_escape_string($value), $uniprotHits,$top_max );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function topX( $data , $maxLength, $min = 2 ){
	$length = 0;
	$maxIndex = 0;
	$result = array();
	foreach ($data as $key => $value) {
		$length += count($value);
	}
	foreach ($data as $key => $value) {
	    //show min number from each CV; but slow due sqls taking too long
		//$maxIndex = ( $maxLength / $length ) * count( $value );
		//$maxIndex = max($maxIndex, $min);
		//$result = array_merge($result , array_slice($value, 0, $maxIndex ));
		//faster
		$result = array_merge($result , $value);
	}
	return $result;
}
?>
