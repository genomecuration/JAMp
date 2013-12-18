<?php
require_once( "utils.inc" );
function autocomplete( $value, $ids ){
	require "SqlQueries.inc";
	$data = array();
	$uniprotHits = array();
	foreach ($ids as $key => $id) {
		array_push( $uniprotHits, sprintf($sqlQueries['annotations']['uniprotHits'], $id ) );
	}
	$uniprotHits = join(' union ', $uniprotHits );	
	array_push( $data,  goAutoComplete( $value, $uniprotHits ));
	array_push( $data,  koAutoComplete( $value, $uniprotHits ));
	array_push( $data,  eggnogAutoComplete( $value, $uniprotHits ));
	array_push( $data,  enzymeAutoComplete( $value , $uniprotHits ));
	array_push( $data,  pathwayAutoComplete( $value , $uniprotHits ));
	return topX( $data, 10);
}
function goAutoComplete($value='', $uniprotHits)
{
	require "SqlQueries.inc";
	$number = "";
	if( is_numeric($value) ){
		$number = "known_proteins.go.go_id = $value";
	} else {
		$number = "name ilike '%$value%'";
	}
	
	$sql = sprintf( $sqlQueries['annotations']['goauto'], $number, $uniprotHits );
	$data = query_execute( null, $sql, null );
	return $data; 
}
function koAutoComplete( $value, $uniprotHits ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['koauto'], $value, $uniprotHits );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function eggnogAutoComplete( $value, $uniprotHits ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['eggnogauto'], $value, $uniprotHits );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function enzymeAutoComplete( $value, $uniprotHits ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['enzymeauto'], $value, $uniprotHits );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function pathwayAutoComplete( $value, $uniprotHits ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['pathwayauto'], $value, $uniprotHits );
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
		$maxIndex = ( $maxLength / $length ) * count( $value );
		$maxIndex = max($maxIndex, $min);
		$result = array_merge($result , array_slice($value, 0, $maxIndex ));
	}
	return $result;
}
?>