<?php
$database_adaptor = 'native';
$scriptDirBase = dirname(__FILE__).'/'.$database_adaptor;
function getIds( $selections ){
	$ids = array();
	foreach ($selections as $key => $value) {
		array_push( $ids , $value['id'] );
	}
	return $ids;
}
function mergeCvTermsSum( $merge , $ids){
	$result = array();
	foreach( $merge as $key => $library){
		foreach ($library as $index => $term) {
			$temp = $result[ $term[ 'cvterm_id' ] ];
			if( !$temp ){
				$temp = array_fill_keys($ids, 0);
			}
			$temp [$key] = isset($term['count'])?$term['count']:'0';
			unset ( $term['count'] );
			foreach ($term as $columnName => $value) {
				if(is_array($value )){
					if( !isset( $temp[ $columnName ] ) ){
						$temp[ $columnName ] = array();					
					}
					$temp[ $columnName ] =  $temp[ $columnName ] + $value ;
				} else {
					$temp[ $columnName ] = $value;	
				}
				
			}
			$result[ $term[ 'cvterm_id' ] ] =  $temp ;
		}
	}
	return array_values( $result );
}
function sumColumns( $rows , $columns ){
	foreach ($rows as $index => $row) {
		$total = 0;
		foreach ($columns as $key => $column) {
			$total += $row[$column];
		}
		$row['total'] = $total;
		$rows[$index] = $row;
	}
	return $rows;
}
function chadoviewer() {
	global $scriptDirBase;
	$ds = $_REQUEST['ds'];
	$data;
	$selectedLibraries = array( array( 'type'=>'library','id'=>75) , array('type'=>'library','id'=>2) );
	$selectedIds = json_decode( $_REQUEST['ids'] );
 	$selectedSpecies = array( array( 'type'=>'species','id'=>$_REQUEST['id']) , array('type'=>'species','id'=>171) );
	$id = $_REQUEST['id'];
	header('Content-Type: application/json');
	switch ( $ds ) {
		case 'library' :
			$type = $_REQUEST['type'];
			switch ( $type ) {
				case 'tree' :
					require_once (dirname(__FILE__) . '/native/libraryTree.inc');
					
					$data = listLibraryTree();					
					break;
				case 'cv' :
					require_once (dirname(__FILE__) . '/native/library.inc');
					
					 $data = array();
					foreach ( $selectedIds as $key => $value ) {
					  $data = array_merge( $data , listLibrary( $value ) );
					}
					break;
				case 'graph' :
					require_once (dirname(__FILE__) . '/native/libraryGraph.inc');
					$id = $_REQUEST['id'];
					$cv_id = $_REQUEST['cv_id'];
					$get = $_REQUEST['get'];
					$filters = json_decode($_REQUEST['filters']);
					$facets = json_decode($_REQUEST['facets']);
					$db = 'chado';
					if (isset($get)) {
						// default value
						switch ( $get ) {
							case 'cv' :
								
								$data = cv( $id, $db, $selectedIds );
								break;
							case 'cv_term' :
								
								$cvTermsSumList = array();

								foreach ( $selectedIds as $key => $value ) {
								  $cvTermsSumList[ $value ] = cvTermSummary( $value , $cv_id );								
								}
								$data = mergeCvTermsSum( $cvTermsSumList );
								$data = sumColumns( $data, $selectedIds );
								break;
							case 'dbxref' :
								
								$data = dbxref($id);
								break;
							case 'blast' :
								
								$data = blast($id);
								break;
						}
						break;
					}
					$data = 'Get parameter is mandatory. check manual.';
					break;
				case 'feature' :
					require_once (dirname(__FILE__) . '/native/library.inc');
					if( $selectedIds[0] > 0 ){
						$data = featureLibraryList( $selectedIds );
					} else{
						$data = getUncategorisedFeatures( $selectedIds );
					}
					break;
				default :
					echo "error";
					break;
			}
			break;
		case 'species' :
			$type = $_REQUEST['type'];
			switch ( $type ) {
				case 'tree' :
					require_once (dirname(__FILE__) . '/native/speciesTree.inc');
					
					$data = listSpeciesTree();
					break;
				case 'cv' :
					require_once (dirname(__FILE__) . '/native/speciesTerms.inc');
					
					$data = array();
					foreach ($selectedIds as $key => $value) {
						$data = array_merge( $data , listTerms( $value ) );
					}
					break;
				case 'graph' :
					require_once (dirname(__FILE__) . '/native/speciesGraph.inc');
					  $id = $_REQUEST['id'];
					  $cv_id = $_REQUEST['cv_id'];
					  $get = $_REQUEST['get'];
					  $cv_name = $_REQUEST['cv_name'];
					  if ( isset ( $get ) ) {
						  switch ( $get ){
						  	case 'cv':
								
								$data = speciescv( $id , $ids);
							  break;
							case 'cv_term':
								
								$cvTermsSumList = array();
								foreach ( $selectedIds as $key => $value ) {
								  $cvTermsSumList[ $value ] = speciescvTermSummary( $value , $cv_id , $cv_name );								
								}
								$data = mergeCvTermsSum( $cvTermsSumList );
								$data = sumColumns( $data, $selectedIds );
								break;
							case 'dbxref':
								
								$data = speciesdbxref( $id );
								break;
							case 'blast':
								
								$data = speciesblast( $id );
								break;
						  }
						  
						  break;
					  }
					  $data = 'Get parameter is mandatory. check manual.';
					break;
				case 'feature' :
					require_once (dirname(__FILE__) . '/native/speciesTerms.inc');
					
					$data = featureSpeciesList( $selectedIds );
					break;
				default :
					echo "error";
					break;
			}
			break;
		case 'feature' :
			$type = $_REQUEST['type'];
			require_once (dirname(__FILE__) . '/native/feature.inc');
			switch ($type) {
				case 'list' :
					

					$data = featureList();
					break;
				case 'cv' :
					
					$data = featureCV();
					break;
				case 'fasta' :
					
					$data = featureFasta();
					break;
				default :
					break;
			}
			break;
	}
  if( is_object( $data ) || is_array( $data )){
  	echo json_encode( $data );
  } else {
  	echo $data;
  }
}
chadoviewer();
?>
