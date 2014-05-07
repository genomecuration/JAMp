<?php
$database_adaptor = 'chado_genes4all';
$scriptDirBase = dirname(__FILE__).'/'.$database_adaptor;



function getIds( $selections ){
	$ids = array();
	foreach ($selections as $key => $value) {
		array_push( $ids , $value['id'] );
	}
	return $ids;
}
function mergeCvTermsSum( $merge , $ids = NULL){
	$result = array();
	foreach( $merge as $key => $library){
		foreach ($library as $index => $term) {
			$temp = $result[ $term[ 'cvterm_id' ] ];
			if( !$temp && !empty($ids)){
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
	if (empty($id)){
		$id = $_REQUEST['feature_id'];
	}
	header('Content-Type: application/json');
	switch ( $ds ) {
		case 'multidownload' :
		     $type = $_REQUEST['type'];
		     require_once ($scriptDirBase . '/feature.inc');
			 switch($type){
			 	case 'fasta' :
			 		$feature_ids = $_REQUEST['feature_id'];
			 		$data = get_multiple_featureFasta( $feature_ids );
			 		if (!empty($_REQUEST['format']) && $_REQUEST['format'] == 'download'){
		 				header('Content-Type: text/plain;');
		 				header('Content-Disposition: attachment; filename=' . $idFeature . '.txt');
					}else{
						$data = array( array( 'fasta' => $data['out'] ) );
					}
				break;
			}
		     break;
		case 'library' :
			$type = $_REQUEST['type'];
			switch ( $type ) {
				case 'tree' :
					require_once ($scriptDirBase . '/libraryTree.inc');
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * get the list of all libraries in the database. Output it in tree format
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
					 * 	tree - query relates to library with output in tree format 
					 * @param view [ 1, 2 ]
					 * 	Selection to control output format.
					 * 	the hierarchial tree structure is formatted using this parameter. Two supported views are:
					 * 	1 => list only libraries
					 * 	2 => group libraries on organism name
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-	
					 * 	view 1:
					 * 		{
					 * 			expanded:true,
					 * 			text: "Library"
					 * 			pid:1
					 * 			children:[{
					 * 			    "id": "2",
					 * 			    "text": "ApAL3SD",
					 * 				"leaf": "true",
					 * 			    "organism_id": "146",
					 * 			    "genus": "Acyrthosiphon",
					 * 			    "species": "pisum"
					 * 				"pid":2
					 * 			}]
					 * 		}
					 * 	view 2:
					 * 		{
					 *     		"text": "Library",
					 * 		    "expanded": true,
					 * 			"pid":1
					 * 		    "children": [{
					 *             "text": "Acyrthosiphon pisum",
					 *             "leaf": false,
					 * 			   "type": "species",
					 * 				"id": 146,
					 * 				"pid":2
					 *             "children": [{
					 *                     "id": "2",
					 *                     "text": "ApAL3SD",
					 *                     "leaf": "true",
					 * 						"pid":3
					 *                 },{
					 *                    "id": "68",
					 *                    "text": "ApHL3SD",
					 *                    "leaf": "true",
					 * 					  "type": "library"
					 * 				      "pid": 4
					 *                 }]
					 * 			}]
					 * 		}
					 */
					$data = listLibraryTree();					
					break;
				case 'cv' :
					require_once ($scriptDirBase . '/library.inc');
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * 	get metadata of a library.
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * 	library - query relates to library
					 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
					 * 	cv - to return metadata of a library
					 * @param id
					 * 	library identifier.
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-
					 * 		{
					 * 			"root":[
					 * 						{
					 * 							"dsid":"344",
					 * 							"term":"Sanger",
					 * 							"vocabulary":"sequencing_technology",
					 * 							"value":"t"
					 * 						},
					 * 						.....
					 * 					]
					 * 		}
					 *
					 */
					 $data = array();
					foreach ( $selectedIds as $key => $value ) {
					  $data = array_merge( $data , listLibrary( $value ) );
					}
					break;
				case 'graph' :
					require_once ($scriptDirBase . '/libraryGraph.inc');
					$cv_id = $_REQUEST['cv_id'];
					$get = $_REQUEST['get'];
					$filters = json_decode($_REQUEST['filters']);
					$facets = json_decode($_REQUEST['facets']);
					$db = 'chado';
					if (isset($get)) {
						// default value
						switch ( $get ) {
							case 'cv' :
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get all valid (non empty) controlled vocabularies for this library.
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	library - query relates to library
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for a library
								 * @param id
								 * 	library identifier.
								 * @param get ['cv','cv_term','dbxref','blast']
								 * 	cv - get all controlled vocabularies for a library
								 * @param db
								 * 	TODO: pass database to do query
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 * 		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"name":"KEGG_PATHWAY",
								 * 				"title":"Pathway",
								 * 				"dsid":"344",
								 * 				"get":"cv_term"
								 * 			}
								 * 		]
								 */
								$data = cv( $id, $db, $selectedIds );
								break;
							case 'cv_term' :
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get controlled vocabulary terms associated with the sequences of this library.
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	library - query relates to library
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for a library
								 * @param id
								 * 	library identifier.
								 * @param get ['cv','cv_term','dbxref','blast']
								 * 	cv_term - dbxref selector
								 * @param cv_id
								 * 	id of controlled vocabulary
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 *		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"cvterm_id":"34266",
								 * 				"name":"Ribosome",
								 * 				"577":"133",
								 * 				"highername" : { "577" : "ApAL3SD" },
								 * 				"total" : 133
								 * 			}
								 * 		]
								 */
								$cvTermsSumList = array();

								foreach ( $selectedIds as $key => $value ) {
								  $cvTermsSumList[ $value ] = cvTermSummary( $value , $cv_id );								
								}
								$data = mergeCvTermsSum( $cvTermsSumList );
								$data = sumColumns( $data, $selectedIds );
								break;
							case 'dbxref' :
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get dbxref terms associated with the sequences of this library.
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	library - query relates to library
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for a library
								 * @param get ['cv','cv_term','dbxref','blast']
								 * 	dbxref - dbxref selector
								 * @param id
								 * 	library identifier.
								 * @param db
								 * 	TODO: pass database to do query
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 *		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"cvterm_id":"34266",
								 * 				"name":"Ribosome",
								 * 				"count":"133"
								 * 			}
								 * 		]
								 */
								$data = dbxref($id);
								break;
							case 'blast' :
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get blast terms associated with the sequences of this library.
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	library - query relates to library
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for a library
								 * @param id
								 * 	library identifier.
								 * @param db
								 * 	TODO: pass database to do query
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 * 		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"name":"KEGG_PATHWAY",
								 * 				"title":"Pathway",
								 * 				"dsid":"344",
								 * 				"get":"cv_term"
								 * 			}
								 * 		]
								 */
								$data = blast($id);
								break;
						}
						break;
					}
					$data = 'Get parameter is mandatory. check manual.';
					break;
				case 'feature' :
					require_once ($scriptDirBase . '/library.inc');
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * 	get all features associated with a library.
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * 	library - query relates to library
					 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
					 * 	feature - feature selector
					 * @param id
					 * 	library identifier.
					 * @param filter
					 * 	json encoded string representing filter applied
					 * @param facets
					 * 	json encoded string representing facets applied
					 * @param page
					 * 	page number
					 * @param limit
					 * 	number of features per page
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-
					 * 		{
					 * 			"data":[
					 * 						{
					 * 							"feature_id":"13588459",
					 * 							"name":"IC7029AaApep7403",
					 * 							"uniquename":"IC7029AaApep7403",
					 * 							"cvterm_id":"190",
					 * 							"type":"polypeptide"
					 * 						},
					 * 						.....
					 * 					],
					 * 			"total":"1492"
					 * 		}
					 */
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
					require_once ($scriptDirBase . '/speciesTree.inc');
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * get the list of all species in the database. Output it in hierarchial format( tree ).
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 *  species - query relates to organism
					 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
					 * 	tree - query relates to organism listing
					 * @param view [ 1 ]
					 * 	the hierarchial tree structure is formatted using this parameter. Two supported views are:
					 * 	1 => list only organism
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-
					 * 	view 1:
					 * 		{
					 * 			expanded:true,
					 * 			text: "Species"
					 * 			children:[{
					 * 			    "id": "146",
					 * 			    "text": "Acyrthosiphon pisum",
					 * 			    "leaf": "true"
					 * 			}]
					 * 		}
					 */
					$data = listSpeciesTree();
					break;
				case 'cv' :
					require_once ($scriptDirBase . '/speciesTerms.inc');
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * 	get metadata of an organism.
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * 	species - query relates to species
					 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
					 * 	cv - to return metadata of an organism
					 * @param id
					 * 	organism identifier.
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-
					 * 		{
					 * 			"root":[
					 * 						{
					 * 							"dsid":"344",
					 * 							"term":"Sanger",
					 * 							"vocabulary":"sequencing_technology",
					 * 							"value":"t"
					 * 						},
					 * 						.....
					 * 					]
					 * 		}
					 *
					 */
					$data = array();
					foreach ($selectedIds as $key => $value) {
						$data = array_merge( $data , listTerms( $value ) );
					}
					break;
				case 'graph' :
					require_once ($scriptDirBase . '/speciesGraph.inc');
					  $cv_id = $_REQUEST['cv_id'];
					  $get = $_REQUEST['get'];
					  $cv_name = $_REQUEST['cv_name'];
					  if ( isset ( $get ) ) {
						  switch ( $get ){
						  	case 'cv':
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get all valid (non empty) controlled vocabularies for this organism.
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	species - query relates to an organism
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for an organism
								 * @param id
								 * 	organism identifier.
								 * @param get ['cv','cv_term','dbxref','blast']
								 * 	cv - get all controlled vocabularies for an organism
								 * @param db
								 * 	TODO: pass database to do query
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 * 		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"name":"KEGG_PATHWAY",
								 * 				"title":"Pathway",
								 * 				"dsid":"344",
								 * 				"get":"cv_term"
								 * 			}
								 * 		]
								 */
								$data = speciescv( $id , $ids);
							  break;
							case 'cv_term':
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get terms from a controlled vocabulary for an organism.
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	library - query relates to library
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for a library
								 * @param id
								 * 	library identifier.
								 * @param get ['cv','cv_term','dbxref','blast']
								 * 	cv_term - get cv terms
								 * @param cv_id
								 * 	id of controlled vocabulary
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 *		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"cvterm_id":"34266",
								 * 				"name":"Ribosome",
								 * 				"count":"133"
								 * 			}
								 * 		]
								 */
								$cvTermsSumList = array();
								foreach ( $selectedIds as $key => $value ) {
								  $cvTermsSumList[ $value ] = speciescvTermSummary( $value , $cv_id , $cv_name );								
								}
								$data = mergeCvTermsSum( $cvTermsSumList );
								$data = sumColumns( $data, $selectedIds );
								break;
							case 'dbxref':
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get dbxref terms associated with the sequences of an organism.
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	species - query relates to species
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for a species
								 * @param get ['cv','cv_term','dbxref','blast']
								 * 	dbxref - dbxref selector
								 * @param id
								 * 	library identifier.
								 * @param db
								 * 	TODO: pass database to do query
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 *		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"cvterm_id":"34266",
								 * 				"name":"Ribosome",
								 * 				"count":"133"
								 * 			}
								 * 		]
								 */
								$data = speciesdbxref( $id );
								break;
							case 'blast':
								/**
								 * webservice base url - ws/chadoviewer
								 *
								 * 	get blast metadata for an organism 
								 *
								 * @param ds [ 'library' , 'species' , 'feature' ]
								 * 	species - query relates to an organism
								 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
								 * 	graph - query relates to making graph for an organism
								 * @param id
								 * 	organism identifier.
								 * @param db
								 * 	TODO: pass database to do query
								 *
								 * @return
								 * 	format - JSON
								 * 	output JSON format-
								 * 		[
								 * 			{
								 * 				"cv_id":"30",
								 * 				"name":"KEGG_PATHWAY",
								 * 				"title":"Pathway",
								 * 				"dsid":"344",
								 * 				"get":"cv_term"
								 * 			}
								 * 		]
								 */
								$data = speciesblast( $id );
								break;
						  }
						  
						  break;
					  }
					  $data = 'Get parameter is mandatory. check manual.';
					break;
				case 'feature' :
					require_once ($scriptDirBase . '/speciesTerms.inc');
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * 	get all features associated with an organism.
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * 	species - query relates to organism
					 * @param type [ 'tree' , 'cv' , 'graph' , 'feature' ]
					 * 	feature - feature selector
					 * @param id
					 * 	organism identifier.
					 * @param filter
					 * 	json encoded string representing filter applied
					 * @param facets
					 * 	json encoded string representing facets applied
					 * @param page
					 * 	page number
					 * @param limit
					 * 	number of features per page
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-
					 * 		{
					 * 			"data":[
					 * 						{
					 * 							"feature_id":"13588459",
					 * 							"name":"IC7029AaApep7403",
					 * 							"uniquename":"IC7029AaApep7403",
					 * 							"cvterm_id":"190",
					 * 							"type":"polypeptide"
					 * 						},
					 * 						.....
					 * 					],
					 * 			"total":"1492"
					 * 		}
					 */
					$data = featureSpeciesList( $selectedIds );
					break;
				default :
					echo "error";
					break;
			}
			break;
		case 'feature' :
			$type = $_REQUEST['type'];
			require_once ($scriptDirBase . '/feature.inc');
			switch ($type) {
				case 'list' :
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * 	get all features from the database
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * 	feature - query relates to features
					 * @param type [ 'list' , 'cv' , 'fasta' ]
					 * 	list - query related to listing all features
					 * @param filter
					 * 	json encoded string representing filter applied
					 * @param page
					 * 	page number
					 * @param limit
					 * 	number of features per page
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-
					 * 		{
					 * 			"data":[
					 * 						{
					 * 							"feature_id":"37160598",
					 * 							"name":"IC7539AbApep21692",
					 * 							"uniquename":"IC7539AbApep21692",
					 * 							"organism_id":"310",
					 * 							"cvterm_id":"190",
					 * 							"type":"polypeptide",
					 * 							"genus":"Leptinotarsa",
					 * 							"species":"decemlineata",
					 * 							"seqlen": "546",
					 * 							"libraries":[],
					 * 							// libraries that this feature belongs
					 * 							"sources":[]
					 * 							// features that use this feature as source feature
					 *						 }
					 * 						.....
					 * 					],
					 * 			"total":"1492" 
					 * 			// total number of features in table
					 * 		}
					 */

					$data = featureList();
					break;
				case 'cv' :
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * 	get metadata of a feature
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * 	feature - query relates to features
					 * @param type [ 'list' , 'cv' , 'fasta' ]
					 * 	cv - query related to getting metadata of a feature
					 * @param feature_id
					 * 	query relates to this feature id
					 * @param filter
					 * 	json encoded string representing filter applied
					 * @param page
					 * 	page number
					 * @param limit
					 * 	number of features per page
					 *
					 * @return
					 * 	format - JSON
					 * 	output JSON format-
					 * 		{
					 * 			"root":[{
					 * 						"dsid":"37151170",
			 		 * 						"term":"Calcium\/calmodulin-dependentproteinkinase.",
				 	 *						"vocabulary":"EC",
					 * 						"value":"t"
					 * 					}]
					 *  	}
					 */
					$data = featureCV();
					break;
				case 'fasta' :
					/**
					 * webservice base url - ws/chadoviewer
					 *
					 * 	get feature sequence in fasta format
					 *
					 * @param ds [ 'library' , 'species' , 'feature' ]
					 * 	feature - query relates to features
					 * @param type [ 'list' , 'cv' , 'fasta' ]
					 * 	cv - query related to getting metadata of a feature
					 * @param feature_id
					 * 	query relates to this feature id
					 * @param filter
					 * 	json encoded string representing filter applied
					 * @param page
					 * 	page number
					 * @param limit
					 * 	number of features per page
					 *
					 * @return
					 * 	format - fasta
					 * 	output format-
					 * >IC7539AbApep21683
					 * SFVTFCNQCLRNLEKMLEFTTSRDGLLQIEDDVLCSVVQRESISSVYDVDKTPLGRGKYATVCRAVHKKTGTSYAAKFVK
					 * KRRRNVDQMKEIIHEIAVLMQCKSTNRVIRLHEVYESVSEMVLVLELAAGGELQHILDGGQCLGEVEARKAMKQILEGVA
					 * YLHDRNIAHLDLKPQNLLLSVQDCCDDIKLCDFGISKVLLPGVSVREILGTVDYVAPEVLSYEPIGLSTDIWSIGVLGYV
					 * LLSGFSPFGADDKQQTFLNISKCSLSFEPEHFEDVSSAAIDFIKSALVIDPRNRPTIREMLDHPWISLKSNLLPALTSKP
					 * SEHQTSNNLTPKSTPISQRKSFSCITDTPKSAQRKTFCADTLNGSFTDTTLRTYTVSNNCLCSQCGTTCRHITHTPVSKT
					 * TITIDRGILC
					 */
					$data = featureFasta($id);
					if (!empty($_REQUEST['format']) && $_REQUEST['format'] == 'download'){
		 				header('Content-Type: text/plain;');
		 				header('Content-Disposition: attachment; filename=' . $idFeature . '.txt');
					}else{
						//$data = array( array( 'fasta' => $data ) );
						$data = array( array( 'fasta' => $data['out'] ) );
						//$data = $data['out']; 
					}
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
