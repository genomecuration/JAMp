<?php
require "utils.inc";
function autocomplete( $value ){
	$data = array();
	array_push( $data,  goAutoComplete( $value ));
	array_push( $data,  koAutoComplete( $value ));
	array_push( $data,  eggnogAutoComplete( $value ));
	array_push( $data,  enzymeAutoComplete( $value ));
	array_push( $data,  pathwayAutoComplete( $value ));
	return topX( $data, 10);
}
function goAutoComplete($value='')
{
	require "SqlQueries.inc";
	$number = 'NULL';
	if(is_numeric($value)){
		$number = $value;
	}
	$sql = sprintf($sqlQueries['annotations']['goauto'], $value , $number );
	$data = query_execute( null, $sql, null );
	return $data; 
}
function koAutoComplete( $value ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['koauto'], $value );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function eggnogAutoComplete( $value ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['eggnogauto'], $value );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function enzymeAutoComplete( $value ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['enzymeauto'], $value );
	$data = query_execute( null, $sql, null );
	return $data; 	
}
function pathwayAutoComplete( $value ){
	require "SqlQueries.inc";
	$sql = sprintf($sqlQueries['annotations']['pathwayauto'], $value );
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