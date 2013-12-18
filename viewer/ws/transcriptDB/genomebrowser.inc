<?php
//global $database_adaptor;// = $database_adaptor ? $database_adaptor : 'chado_genes4all';
require_once( 'const.inc' );
require_once( 'utils.inc' );

function canvasTrack($id, $idMeta) {
	require  'SqlQueries.inc';
	$datasetId = $idMeta['dataset_id'];
	switch ($idMeta['type']) {
		case Type::transcript:
			$geneSql = sprintf($sqlQueries['gene'],$datasetId,$id);
			$gene = query_execute(null, $geneSql , null);
			$id = $gene[0]['gene_uname'];
			break;
	}
	$res = sourceFeatures($id, $datasetId);
	$merge = array();
	foreach ($res as $key => $transcirpt) {
		$transcirpt['metaname'] = 'transcript';
		$merge[]= $transcirpt;
		$knownProteins = knownProteinHits($datasetId, $transcirpt);
		// echo print_r($knownProteins);
		$merge = array_merge( $merge , $knownProteins );
	}
	// echo print_r( $merge );
	$tracks = canvasTransform($merge, $id, $datasetId);
	return $tracks;
}
function knownProteinHits($datasetId, $transcript){
	require  'SqlQueries.inc';
	$sql = sprintf( $sqlQueries['gb']['knownProteinHits'], $datasetId,$transcript['name']);
	$result = query_execute(null, $sql, null);
	foreach ($result as $key => $value) {
		$start = (($value['fmin']-1)*3) + $transcript['fmin'];
		$stop =  ($value['fmax']*3) + $transcript['fmin'];
		if( preg_match ( '/,/' , $value['name'] ) ){
			$value['list'] = $value['name'];
			$value['name'] = "Many Hits ($start - $stop)";
		}
		$result[$key] = array_replace($value, array('fmin'=>$start, 'fmax'=>$stop,'metaname'=>'hit', 'grpName'=>"$start - $stop"));
	}
	return $result;
}
function tracksTransform($result) {
	$tracks = new stdClass;
	foreach ($result as $key => $value) {
		$name = $value['name'];
		if (!isset($tracks -> $name)) {
			$tracks -> $name = array();
		}
		// using coersion to convert to integer. This seems to be the fastest way to do it.
		array_push( $tracks -> $name, array((0 + $value['fmin']), (0 + $value['fmax']),'score'=>$value['score'],'metaname' => $value['metaname'],'grpName'=>$value['grpName']) );
		// array_push($tracks -> $name, array((0 + $value['fmin']), (0 + $value['fmax'])));
	}
	// transform the above result
	$tracksOrg = $tracks;
	$tracks = array();
	foreach ($tracksOrg as $key => $value) {
		$fill ="rgb(255,0,0)";
		$score = $value[0]['score'];
		unset( $value[0]['score']);
		$metaname = $value[0]['metaname'];
		$grpName = $value[0]['grpName'];
		unset( $value[0]['metaname'] );
		switch ($metaname) {
			case 'hit':
				$fill = "rgb(256,256,256)";
				break;
		}
		// if( $score ){
			// $red = intval($score * (255 / 100) );
			// $fill = "rgb($red,$red,$red)";
		// }
		$track = array( 'id'=>$key, 'type'=>'box' , 'dir'=>'right','data' => array() , 'fill'=>$fill, 'metaname'=>$metaname, 'grpName' => $grpName );
		foreach ($value as $index => $loc) {
			$result = array('id' => ($key), 'data' => array ( $loc ));
			array_push( $track['data'] , $result );
		}
		array_push($tracks , $track);
	}
	// array_push( $tracks, $result );	
	return $tracks;
}

function sourceFeatures($id, $datasetId) {
	require  'SqlQueries.inc';
	$sql = sprintf( $sqlQueries['gb']['sourceFeatures'], $datasetId,$id );
	$result = query_execute(null, $sql, null);
	// echo print_r($result);
	return $result;
}

function canvasTransform($result, $id , $db ) {
	$tracks = tracksTransform($result);
	$ref = addReferenceSequence(  $id , $db );
	// echo print_r ( $ref['subtype'] );
	// switch ( $ref['subtype']){
		// case 'Protein':
			// $tracks = enlargeBox( $tracks );
			// break;
	// }
	$tracks = array_merge ( $ref  , $tracks );  
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
	$len = strlen( $seq['nuc_sequence']);
	$dna = array(array ( 'name' => $id, 'type' =>'sequence' , 'subtype'=>'DNA','data'=>array( array( 'id' =>$id , 'sequence' =>  $seq['nuc_sequence'] , 'fill' => 'rgb(255,255,51)', 'outline' => 'rgb(0,0,0)', 
                                                    'dir'=> 'right',
                                                    'offset'=> 1
	 ,'translate' => array(-3, -2, -1, 1, 2, 3)	) ) ), array('id'=>$id, 'type'=>'box' , 'dir'=>'right','data' => array(array('data'=>array(array( 1, $len ) ),'id'=>$id)), 'fill'=>'rgb(255,255,51)', 'metaname'=>'gene'));
	 // $polypeptide = array ( 'name' => 'Protein Sequence', 'type' =>'sequence' , 'subtype'=>'Protein','data'=>array( array( 'id' =>'Sequence' , 'sequence' =>  $seq['residues'] , 'fill' => 'rgb(255,255,51)', 'outline' => 'rgb(0,0,0)', 
                                                    // // 'dir'=> 'right',
                                                    // 'offset'=> 1
	 // ) ));
	 $result = $dna;
	 // switch ($seq['subtype']) {
		 // case 'polypeptide':
			 // $result = $polypeptide;
			 // break;
	 // }
	return $result;
}
function linkout( $id ){
	require('SqlQueries.inc');
	$sql = sprintf( $sqlQueries['config']['linkout'], $id );
	$data = query_execute( null , $sql , null );
	return $data;
}
?>
