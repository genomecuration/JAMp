<?php

$database_adaptor = 'transcriptDB';
require_once(  $database_adaptor . '/utils.inc' );
genomeviewer();
function genomeviewer ( ){
	
    global $database_adaptor; // = $database_adaptor ? $database_adaptor : 'chado_genes4all';
	$type = $_REQUEST ['type'];
	$id = $_REQUEST ['id'];
	$ds = datasetType($id);
	$id  = $ds['id'];
	$dataset = $ds['dataset_id'];
	
		/**
	 * check for ownership here. if true proceed otherwise sent 401 error code.
	 */
	$access = TRUE;
	if(isset( $dataset )){
		$access &= hasAccess( $dataset );
	}
	if( !$access ){
		header('HTTP/1.0 401');
		header('Content-Type: application/JSON');
		echo "{ msg:'You are not Authorized!'}";
		exit;
	}
	
	// echo print_r($type);
	switch ( $type ){
		case 'sequence':
			$data = getSequence( $id , $ds['dataset_id']);
			break;
		case 'track':
			require_once( $database_adaptor. '/genomebrowser.inc' );
			$data =  canvasTrack( $id, $ds );
			$data = array( array( 'tracks' => $data ) );
			break;
		case 'config':
			require_once( $database_adaptor. '/genomebrowser.inc' );
			$data = linkout ($ds['dataset_id']);
			break;
	}
  	if( is_object( $data ) || is_array( $data )){
		header('Content-Type: application/JSON');
	  	echo json_encode( $data );
	} else {
		header('Content-Type: text/plain');
  		echo $data;
	}
}
?>
