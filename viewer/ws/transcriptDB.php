<?php
$database_adaptor = 'transcriptDB';
$scriptDirBase = dirname(__FILE__).'/'.$database_adaptor;
require($scriptDirBase.'/utils.inc');


function getIds( $selections ){
  $ids = array();
  foreach ($selections as $key => $value) {
    array_push( $ids , $value['id'] );
  }
  return $ids;
}
function mergeCvTermsSum( $merge  , $ids = NULL, $cProp = 'count'){
  $result = array();
  foreach( $merge as $key => $library){
    foreach ($library as $index => $term) {
      $temp = $result[ $term[ 'cvterm_id' ] ];
      if( empty($temp) && !empty($ids)){
        $temp = array_fill_keys($ids, 0);
      }
      $count = isset($term[$cProp])?$term[$cProp]:'0';
      $prop = isset($term['proportion'])?$term['proportion']:'0';
      $temp ["$key count"] = $count;
      $temp ["$key proportion"] = $prop;
      unset ( $term['count'] );
      unset ( $term['proportion'] );
      foreach ($term as $columnName => $value) {
        if(is_array( $value )){
          if( !isset( $temp[ $columnName ] ) ){
            $temp[ $columnName ] = array();
          }
          $temp[ $columnName ] =  $temp[ $columnName ] + $value ;
        } else {
          $temp[ $columnName ] = $value;
        }
        // echo print_r($temp);
      }
      $result[ $term[ 'cvterm_id' ] ] =  $temp ;
    }
  }
  // echo print_r($result);
  return array_values( $result );
}
function sumColumns( $rows , $columns , $aggColumn = 'total'){
  foreach ($rows as $index => $row) {
    $total = 0;
    foreach ($columns as $key => $column) {
      $total += $row[$column.' count'];
    }
    $row[$aggColumn] = $total;
    $rows[$index] = $row;
  }
  return $rows;
}

function chadoviewer() {
  global $scriptDirBase;
  $ds = $_REQUEST['ds'];
  $data;
  $selectedLibraries = array( array( 'type'=>'library','id'=>75) , array('type'=>'library','id'=>2) );
  $selectedIds = json_decode( $_REQUEST['ids'] );  // multiple ids as an array
  $selectedSpecies = array( array( 'type'=>'species','id'=>$_REQUEST['id']) , array('type'=>'species','id'=>171) );
  $get = $_REQUEST['get'];
  $id = $_REQUEST['id'];
  $idFeature = $_REQUEST['feature_id'];
  if (empty($ds) && empty($id) && empty($idFeature) && empty($get)){echo null; exit;}

  $idParsed = datasetType( $idFeature );
  $idDataset = $_REQUEST['dataset_id'];
  $idFilter = json_decode( $_REQUEST['filter'], TRUE );
  $type = $_REQUEST['type'];
  $cv_id = $_REQUEST['cv_id'];
  $format = $_REQUEST['format'];
  $cv_name = $_REQUEST['cv_name'];
  $network_id = $_REQUEST['network_id'];

  header('Content-Type: application/json');
  /**
   * check for ownership here. if true proceed otherwise sent 401 error code.
   */
  $access = TRUE;
  if(!empty( $id )){
    $access &= hasAccess( $id );
  }
  if(!empty( $selectedIds )){
    switch( $ds ){
      case 'species':
        //AP: this needs to be fixed
        break;
      case 'library':
        $access &= hasAccess( $selectedIds );
        break;
    }
  }
  if(!empty( $idFeature )){
    $access &= hasAccess( $idFeature );
  }
  if(!empty( $idDataset )){
    $access &= hasAccess( $idDataset );
  }
  if(!empty( $idFilter )){
    $idF = filterId( $idFilter );
    $access &= hasAccess( $idF );
  }
  if( !$access ){
    header('HTTP/1.0 401');
    echo "{ msg:'You are not Authorized!'}";
    exit;
  }
  switch ( $ds ) {
    case 'expression_library':
      // this relates to expression_libraries
      switch ( $type ) {
        case 'cv' :
          // this populates the metadata panel for the selected tree item
          require_once ($scriptDirBase . '/library.inc');
          $data = array();
          // expression_library unique name
          $data  = get_fortree_expression_library_metadata( $selectedIds );
          $stats = add_expression_library_stats($selectedIds );
          $data = array_merge( $data,$stats);
          break;
        case 'graph' :
          require_once ($scriptDirBase . '/libraryGraph.inc');
          require_once ($scriptDirBase . '/const.inc');
          $filters = json_decode($_REQUEST['filters']);
          $facets = json_decode($_REQUEST['facets']);
          if (isset($get)) {
            // default value
            switch ( $get ) {
              case 'cv' :
                global $controlledVocabularies;
                $data = $controlledVocabularies;
                break;
              case 'cv_term' :
                $cvTermsSumList = array();
                $expression_library_ids_data = convert_expression_lib_ids_to_id_array($selectedIds);
                $expression_library_ids = array();
                $expression_library_dataset_and_ids = array();
                foreach ( $expression_library_ids_data as $lib_id => $expression_lib_data ) {
                  $dsid = $expression_lib_data['dsid'];
                  $lib_name  = $expression_lib_data['uname'];
                  $expression_library_ids[] = $lib_name;
                  $expression_library_dataset_and_ids[] = $lib_id;
                  // now we have to decide how to return the data.
                  $cvTermsSumList[ $lib_id ] = cvSummary_expression( $dsid, $cv_id, $lib_name );
                  //$total = totalTranscriptsExpression( $dsid,$lib_name );
                  $cvTermsSumList[ $lib_id ] = addProportion( $cvTermsSumList[ $lib_id ]);
                }
                if (!empty($cvTermsSumList)){
                	$data = mergeCvTermsSum( $cvTermsSumList );
                	$data = sumColumns( $data, $expression_library_dataset_and_ids );
                }
                break;
            }
            break;
          }
          $data = 'Get parameter is mandatory. check manual.';
          break;
        case 'feature' :
          require_once ($scriptDirBase . '/library.inc');
          if( $selectedIds[0] > 0 ){
            $data = expression_library_get_features( $selectedIds );
          }
          break;
        default :
          break;
      }
      break;
    case 'picture':
      require_once ($scriptDirBase . '/feature.inc');
      $image_id = $_REQUEST['image_id'];
      switch($type){
        case 'expression':
          $image_data = get_one_expression_picture($idDataset,$image_id);
          break;
        default:
          break;
      }
      switch($format){
        case 'download':
          if (!empty($image_data)){
            header('Content-Type: image/'.$image_data['format']);
            header('Content-Disposition: attachment; filename=picture.'.$image_data['format']);
            $data = $image_data['imageData'];
          }else{
            header('Content-Type: text/plain');
            $data = 'No graph available for this request';
          }
          break;
        case 'show':
          if (!empty($image_data)){
            header('Content-Type: text/html;charset=utf-8');
            $data = '<img src=\'data:image/'.$image_data['format'].';base64,' . base64_encode($image_data['imageData']) . '\' />';
          }else{
            header('Content-Type: text/plain');
            $data = 'No graph available for this request';
          }
          break;
        default:
          if (!empty($image_data)){
            $data = array('imageData'=>'<img src=\'data:image/'.$image_data['format'].';base64,' . base64_encode($image_data['imageData']) . '\' />');
          }else{
            $data = array('imageData'=>'');
          }
          break;
      }
      break;
    case 'multidownload' :
      if (!empty($format) && $format == 'download'){
        header('Content-Type: text/plain;');
      }
      switch($type){
        case 'fasta' :
          require_once ($scriptDirBase . '/feature.inc');
          $data = get_multiple_featureFasta( $idFeature,'cds' );
          if (empty($format) || $format != 'download'){
            $data = array( array( 'fasta' => $data ) );
          }else{
            header('Content-Disposition: attachment; filename=multidownload.fasta');
            $data = strip_tags($data);
          }
          break;
        case 'cvterm' :
          if (!empty($format) && $format == 'download'){
            header('Content-Disposition: attachment; filename=multidownload.csv');
            $cv_data = (array) json_decode($_REQUEST['data']);
            $data = '';
            $headers = (array) json_decode($_REQUEST['headers']);
            $headers_check_expression_library = convert_expression_lib_ids_to_id_array($headers);
            if (!empty($headers_check_expression_library)){
              $headers = array();
              foreach ($headers_check_expression_library as $long_id=>$lib_data){
                $ds_meta = dataset_id2string($lib_data['dsid']);
                $lib_name  = $lib_data['uname'];
                $headers[] = $ds_meta.'|'.$lib_name;
              }
            }
            // convert to CSV
            $return = "CV_name\t". implode("\t",$headers)."\tTotal\n";
            foreach ($cv_data as $cv=>$value_array){
              $return .= "$cv\t";
              $return .= implode("\t",$value_array);
              $return .= "\n";
            }
            $data .= $return;
          }
          else{
            $data = (array) json_decode($_REQUEST['data']);
          }
          break;
      }
      break;
    case 'library' :
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
           * 							"value":"t",
           * 							"selection":"libraryName"
           * 						},
           * 						.....
           * 					]
           * 		}
           *
           */
          $data = array();
          foreach ( $selectedIds as $key => $value ) {
            $meta = listLibrary( $value );
            $data = array_merge( $data, $meta );
            $stats = array();
            if(count($meta)){
              $stats =addLibraryStats( $value , $meta[0]['selection'] );
              $data = array_merge( $data, $stats );
            }
          }
          break;
        case 'graph' :
          require_once ($scriptDirBase . '/libraryGraph.inc');
          require_once ($scriptDirBase . '/const.inc');
          $filters = json_decode($_REQUEST['filters']);
          $facets = json_decode($_REQUEST['facets']);
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
                // $data = cv( $id, $db, $selectedIds );
                global $controlledVocabularies;
                $data = $controlledVocabularies;
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
                  $result = cvSummary( $value, $cv_id );
                  $cvTermsSumList[ $value ] = $result;
                  //$total = totalTranscripts( $value );
                  $cvTermsSumList[ $value ] = addProportion( $cvTermsSumList[ $value ]);
                }
                if (!empty($cvTermsSumList)){
                	$data = mergeCvTermsSum( $cvTermsSumList );
                	$data = sumColumns( $data, $selectedIds );
                }
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
          }
          break;
        default :
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
          $data = get_cv_from_species($selectedIds);
          break;
        case 'graph' :
          require_once ($scriptDirBase . '/speciesGraph.inc');
          require_once ($scriptDirBase . '/const.inc');
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
                global $controlledVocabularies;
                $data = $controlledVocabularies;
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
                  //$total = totalTrancsriptsSpecies( $value );
                  $cvTermsSumList[ $value ] = addProportion( $cvTermsSumList[ $value ], $value." count" );
                }
                if (!empty($cvTermsSumList)){
                	$data = mergeCvTermsSum( $cvTermsSumList );
                	$data = sumColumns( $data, $selectedIds );
                }
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
          break;
      }
      break;
    case 'feature' :
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
        case 'expression_data':
			    $data = feature_expression_metadata($idFeature);
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
          $data = featureCV( $idFeature );
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
           * @param text
           * 	values = [null , 'plain']
           * 	plain - returns only fasta text
           * 	null - returns json formatted fasta text
           *
           * @return
           * 	text - plain
           * 	output format-
           * >IC7539AbApep21683
           * SFVTFCNQCLRNLEKMLEFTTSRDGLLQIEDDVLCSVVQRESISSVYDVDKTPLGRGKYATVCRAVHKKTGTSYAAKFVK
           * KRRRNVDQMKEIIHEIAVLMQCKSTNRVIRLHEVYESVSEMVLVLELAAGGELQHILDGGQCLGEVEARKAMKQILEGVA
           * YLHDRNIAHLDLKPQNLLLSVQDCCDDIKLCDFGISKVLLPGVSVREILGTVDYVAPEVLSYEPIGLSTDIWSIGVLGYV
           * LLSGFSPFGADDKQQTFLNISKCSLSFEPEHFEDVSSAAIDFIKSALVIDPRNRPTIREMLDHPWISLKSNLLPALTSKP
           * SEHQTSNNLTPKSTPISQRKSFSCITDTPKSAQRKTFCADTLNGSFTDTTLRTYTVSNNCLCSQCGTTCRHITHTPVSKT
           * TITIDRGILC
           *
           * or
           * text - null
           * [{fasta: ">IC7539AbApep21683
           SFVTFCNQCLRNLEKMLEFTTSRDGLLQIEDDVLCSVVQRESISSVYDVDKTPLGRGKYATVCRAVHKKTGTSYAAKFVK
           KRRRNVDQMKEIIHEIAVLMQCKSTNRVIRLHEVYESVSEMVLVLELAAGGELQHILDGGQCLGEVEARKAMKQILEGVA
           YLHDRNIAHLDLKPQNLLLSVQDCCDDIKLCDFGISKVLLPGVSVREILGTVDYVAPEVLSYEPIGLSTDIWSIGVLGYV
           LLSGFSPFGADDKQQTFLNISKCSLSFEPEHFEDVSSAAIDFIKSALVIDPRNRPTIREMLDHPWISLKSNLLPALTSKP
           SEHQTSNNLTPKSTPISQRKSFSCITDTPKSAQRKTFCADTLNGSFTDTTLRTYTVSNNCLCSQCGTTCRHITHTPVSKT
           TITIDRGILC"}]
           */
          $data = featureFasta( $idFeature );
          if (!empty($_REQUEST['format']) && $_REQUEST['format'] == 'download'){
            header('Content-Type: text/plain;');
            header('Content-Disposition: attachment; filename=' . $idFeature . '.txt');
            $data = strip_tags($data['fasta']);
          }else{
            $data = array(  $data  );
          }
          break;
        case 'annotations':
          /**
           * get all annotations for the current gene / transcript
           * @param $id
           * name of id
           * @return
           *  format - tree format
           *  output format:
           * 	[
           * 		'',
           * 		''
           * 	]
           */
          $data = getAnnotations($idFeature);
          break;
        case 'network':
          $data = getNetworkTree( $idFeature );
          break;
        case 'networkjson':
          $data = getNetworkJson( $network_id, $idDataset );
          $data = array('network_id'=>$network_id, 'json'=>$data);
          break;
        case 'networktranscripts':
          $data = getNetworkTranscripts( $network_id, $idDataset );
          break;
        case 'translate':
          $gCode = $_REQUEST['geneticCode'];
          if( empty( $gCode )){
            $gCode = 1;
          }
          $data = featureFasta( $idFeature,'cds' );
          $fasta_sequence = '';
          foreach ($data['feature_data'] as $feature){
            $feature['residues'] = translate_DNA_to_protein( $feature['residues'], $gCode );
            $translation_data = format_fasta_request($idDataset,$feature);
            $fasta_sequence .= $translation_data['fasta'];
          }
          if (!empty($_REQUEST['format']) && $_REQUEST['format'] == 'download'){
            header('Content-Type: text/plain;');
            header('Content-Disposition: attachment; filename=' . $idFeature . '.txt');
            $data = strip_tags($fasta_sequence);
          }else{
            $data = array(array(  'fasta' => $fasta_sequence  ));
          }
          break;
        case 'translationtable':
          global $proteinMapping;
          $data = $proteinMapping;
          break;
        case 'expression' :
          // give list of images for the feature
          $data = list_expression_pictures($idFeature);
          break;

        case 'note' :
          //return any notes that may be available 
          $data = get_note($idFeature);
        default :
          break;
      }
      break;
    case 'de':
      require($scriptDirBase . '/de.inc');
      $type = $_REQUEST['type'];
      switch( $type ){
        case 'experiments':
          $view = $_REQUEST['view'];

          switch($view){
            case 'tree':
              /*
               * get the experiment list in tree format
               * output format:
               *  	array( 'expanded'=>TRUE,
               * 			 'text'=>'Experiments',
               * 			 'pid'=>1,
               * 			 'children'=>array(
               * 					array( "id" => "2",
               * 					"text" => "ApAL3SD",
               * 					"leaf" => "true",
               * 					"organism_id"=> "146",
               * 					"genus"=> "Acyrthosiphon",
               * 					"species"=> "pisum",
               * 					"pid"=>2
               * 			)))
               */
              $data = expTreeView();
              break;
          }
          break;
        case 'graphdata':
          $deid = $_REQUEST['pid'];
          $gid = $_REQUEST['gid'];
          $data = getGraphData( $deid , $gid);
          break;
      }
      break;
    case 'annotations':
      require_once ( $scriptDirBase . '/annotations.inc' );
      // $data = array(
      // array( 'cvid'=>1,'cvtermid'=>2,'title'=>'excellent work','cvname'=>'GO','cvtermname'=>'gpase'),
      // array('cvid'=>1,'cvtermid'=>5,'title'=>'excellent work','cvname'=>'GO','cvtermname'=>'cellular')
      // );
      $data = autocomplete( $_GET['query'], $selectedIds );
      break;
    case 'help':
      $html = file_get_contents($scriptDirBase.'/help.inc');
      $data = array(array('text'=>$html));
      break;
    case 'about':
      $html = file_get_contents($scriptDirBase.'/about.inc');
      $data = array(array('text'=>$html));
      break;
    case 'test':
      $data = array(array('text'=>'test'));
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
