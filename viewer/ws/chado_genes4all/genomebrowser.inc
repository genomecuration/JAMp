<?php
//global $database_adaptor;// = $database_adaptor ? $database_adaptor : 'chado_genes4all';
require_once( 'utils.inc' );
function canvasTrack($id, $db = 'chado') {
	$res = sourceFeatures($id, $db);
	$tracks = canvasTransform($res, $id, $db);
	return $tracks;
}

function tracksTransform($result) {
	$tracks = new stdClass;
	foreach ($result as $key => $value) {
		$name = $value['name'];
		if (!isset($tracks -> $name)) {
			$tracks -> $name = array();
		}
		// using coersion to convert to integer. This seems to be the fastest way to do it.
		array_push($tracks -> $name, array((0 + $value['fmin']), (0 + $value['fmax'])));
		// array_push($tracks -> $name, array((0 + $value['fmin']), (0 + $value['fmax'])));
	}
	// transform the above result
	$tracksOrg = $tracks;
	$tracks = array();
	foreach ($tracksOrg as $key => $value) {
		$track = array( 'id'=>$key, 'type'=>'box' , dir=>'right','data' => array() );
		foreach ($value as $index => $loc) {
			$result = array('id' => ($key . $index), 'data' => array ( $loc ));
			array_push( $track['data'] , $result );
		}
		array_push($tracks , $track);
	}
	// array_push( $tracks, $result );	
	return $tracks;
}

function sourceFeatures($id, $db) {
        global $database_adaptor;
	$db = $db ? $db : 'chado';
	require $database_adaptor . '/SqlQueries.inc';
	$sql = sprintf( $sqlQueries['gb']['sourceFeatures'], $id );
	$result = query_execute($db, $sql, null);
	return $result;
}

function canvasTransform($result, $id , $db ) {
	$tracks = tracksTransform($result);
	$ref = addReferenceSequence(  $id , $db );
	// echo print_r ( $ref['subtype'] );
	switch ( $ref['subtype']){
		case 'Protein':
			$tracks = enlargeBox( $tracks );
			break;
	}
	$tracks = array_merge ( array( $ref ) , $tracks );  
	// $tracks = array ( $ref );
	// $tracks =  $ref ;
	// $tracks = array( 'tracks' =>array ( $tracks ) );
		$tracks = array( 'tracks' => $tracks  );
	return $tracks;
}
function enlargeBox( $tracks ){
	// echo print_r( $tracks );
	foreach ($tracks as $key => $value) {
				// echo print_r( $value['type'] );
		switch ($value['type']) {
			case 'box':
				$box = $value['data'][0]['data'];
				foreach ($box as $index => $dim) {
					$dim = array_map(create_function('$el', 'return $el * 3;'), $dim);
					// echo print_r( $dim );
					$tracks[$key]['data'][0]['data'][$index] = $dim;
				}
				break;
			
			default:
				
				break;
		}	
	}
	return $tracks;
}
function addReferenceSequence( $id, $db ) {
	$seq = getFeature($id, $db);
	// echo print_r( $seq);
	$dna = array ( 'name' => 'Sequence', 'type' =>'sequence' , 'subtype'=>'DNA','data'=>array( array( 'id' =>'Sequence' , 'sequence' =>  $seq['residues'] , 'fill' => 'rgb(255,255,51)', 'outline' => 'rgb(0,0,0)', 
                                                    'dir'=> 'right',
                                                    'offset'=> 1
	 ,'translate' => array(-3, -2, -1, 1, 2, 3)	) ));
	 $polypeptide = array ( 'name' => 'Protein Sequence', 'type' =>'sequence' , 'subtype'=>'Protein','data'=>array( array( 'id' =>'Sequence' , 'sequence' =>  $seq['residues'] , 'fill' => 'rgb(255,255,51)', 'outline' => 'rgb(0,0,0)', 
                                                    // 'dir'=> 'right',
                                                    'offset'=> 1
	 ) ));
	 $result = $dna;
	 switch ($seq['subtype']) {
		 case 'polypeptide':
			 $result = $polypeptide;
			 break;
	 }
	return $result;
}
?>
