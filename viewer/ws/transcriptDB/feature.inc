<?php
require_once ('utils.inc');
require_once ('const.inc');
function featureList() {
  /*
   * user wants:
   * for every feature
   * 1 feature)	tell me what organism it is
   * 1)	what type it is
   * 1) what name, uniquename
   *
   * 2) what library (if any)
   * 3) what sourcefeature (featureloc) if any
   *
   *
   */
  require ('SqlQueries.inc');
  require_once ('const.inc');
  global $own;
  $translation = array('feature_id' => array('name' => 'uname', 'type' => 'number'), 'name' => array('name' => 'uname', 'type' => 'number'));

  // iterate through datasets table
  // union of all dataset schema
  // limit offset
  $filterArray = json_decode($_REQUEST['filter']);

  foreach ($filterArray as $key => $filterParam) {
    if ($filterParam -> property == 'feature_id') {
      $dsType = datasetType($filterParam -> value);
      $filterParam -> value = $dsType['id'];
      $filterParam -> type = $dsType['type'];
      $filterParam -> dataset_id = $dsType['dataset_id'];
    }
  }
  $filter = filterWithSubQuery($filterArray, $translation, 'end');
  // not used $params = datasetType($_REQUEST['feature_id']);
  $datasetsSql = sprintf($sqlQueries['datasets'], pg_escape_string($own));
  $datasets = query_execute(null, $datasetsSql);

  $page = paging($_REQUEST);
  $dsQueries = array();
  $totalQueries = array();
  $libraries = array();
  // var_dump($datasets);
  foreach ($datasets as $key => $ds) {
    $id = $ds['dataset_id'];
    $libraries[$id] = $ds;
    // echo $ds['organism_id'];
    if (count($filterArray) == 0) {
      array_push($dsQueries, sprintf($sqlQueries['feature']['transcriptFilter'], pg_escape_string($id), $filter['string'], pg_escape_string($ds['species_name'])));
      array_push($totalQueries, sprintf($sqlQueries['feature']['countTranscript'], pg_escape_string($id), $filter['string']));
    } else {
      if ($id == $filterArray[0] -> dataset_id) {
        switch ($filterArray[0]->type) {
          case Type::gene :
            array_push($dsQueries, sprintf($sqlQueries['feature']['geneFilter'], pg_escape_string($id), $filter['string'], pg_escape_string($ds['species_name'])));
            array_push($totalQueries, sprintf($sqlQueries['feature']['countGene'], pg_escape_string($id), $filter['string']));
            break;
          case Type::transcript :
            array_push($dsQueries, sprintf($sqlQueries['feature']['transcriptFilter'], pg_escape_string($id), $filter['string'], pg_escape_string($ds['species_name'])));
            array_push($totalQueries, sprintf($sqlQueries['feature']['countTranscript'], pg_escape_string($id), $filter['string']));
            break;
          default :
            break;
        }
      } else if (!$filterArray[0] -> dataset_id) {
        array_push($dsQueries, sprintf($sqlQueries['feature']['transcriptFilter'], pg_escape_string($id), $filter['string'], pg_escape_string($ds['species_name'])));
        array_push($totalQueries, sprintf($sqlQueries['feature']['countTranscript'], pg_escape_string($id), $filter['string']));
      }
    }
    // echo $filterParam->{0}->type." <br/>";
  }
  $union_query = join(' union ', $dsQueries);

  if (!empty($union_query)){
    // don't pg_escape_string whole queries
    $sql = sprintf($sqlQueries['feature']['unionQuery'], $union_query, $page);
    // echo print_r($dsQueries);
    // 	echo $sql;
    $data = query_execute(null, $sql);
  }
  foreach ($data as $key => $value) {
    if ($value['nuc_sequence']) {
      // get sequence length
      $data[$key]['seqlen'] = seqLen($value['nuc_sequence']);
      unset($data[$key]['nuc_sequence']);
      switch ($filterArray[0]->type) {
        case Type::gene :
          break;
        case Type::transcript :
          $dataset_data=array();
          preg_match('/^dataset_([^.]+)\..*$/', $value['feature_id'], $dataset_data);
          $gene_sql = sprintf($sqlQueries['getgene'], pg_escape_string($dataset_data[1]), pg_escape_string($value['uniquename']));
          $gene_res = query_execute(null, $gene_sql, null);
          if (!empty($gene_res[0]['gene_uname'])){
            $data[$key]['sources'] = array( array('feature_id' => 'dataset_'.$dataset_data[1].'.'.$gene_res[0]['gene_uname'], 'uniquename' => $gene_res[0]['gene_uname']));
          }
          break;
      }
      // add library
      $data[$key]['libraries'] = array( array('library_id' => $libraries[$data[$key]['datasetid']]['dataset_id'], 'library_name' => $libraries[$data[$key]['datasetid']]['description']));
      unset($data[$key]['datasetid']);
      $data[$key]['species'] = $data[$key]['organism_id'];

    }
  }

  $joined_queries = join(' union all ', $totalQueries);
  $total_count = 0;
  if (!empty($joined_queries)){
    $totalSql = sprintf($sqlQueries['feature']['unionCount'], $joined_queries);
    // echo $totalSql;
    $total = query_execute(null, $totalSql);
    $total_count = $total[0]['count'];
  }
  $result = array('data' => $data, 'total' => $total_count);
  return $result;
}

function feature_details() {
  $sql = "SELECT column_name from information_schema.columns WHERE table_name='feature'";
}

function featureController() {
  $view = $_REQUEST['view'];
  switch ($view) {
    default :
    case 'feature' :
      featureList();
      break;
    case 'species' :
      featureSpeciesList();
      break;
    case 'library' :
      featureLibraryList();
      break;
  }
}

function feature_expression_metadata($id){
  require ('SqlQueries.inc');
  $parsed = datasetType($id);
  $id = $parsed['id'];
  $dsId = $parsed['dataset_id'];
  $return_array = array();
  if ($parsed['type'] == Type::gene){
    $transcripts_sql = sprintf($sqlQueries['gettranscripts'],pg_escape_string($dsId), pg_escape_string($id));
    $transcript_results = query_execute(null, $transcripts_sql, null);
    if (!empty($transcript_results)){
      // sum over all transcripts
      $transcript_expression_sum = array();
      foreach ($transcript_results as $transcript){
        $sql = sprintf($sqlQueries['feature']['get_expression_data'],pg_escape_string($dsId), pg_escape_string($transcript['name']));
        $transcript_expression = query_execute(null, $sql);
        if (!empty($transcript_expression)){
          foreach ($transcript_expression as $data_array){
            $library_name = $data_array['library_uname'];
            foreach ($data_array as $key=>$value){
              if (empty($value) || $key === 'library_uname' || $key === 'transcript_expression_library_id' || $key === 'transcript_uname'){continue;}
              $key =  $key.':'.$library_name;
              $transcript_expression_sum[$key]+=$value;
            }
          }
        }
      }
      if (!empty($transcript_expression_sum)){
        foreach ($transcript_expression_sum as $key=>$value){
          $return_array[] = array('term'=>$key,'value'=>$value);
        }
      }
    }
  }else{
    $sql = sprintf($sqlQueries['feature']['get_expression_data'],pg_escape_string($dsId), pg_escape_string($id));
    $results = query_execute(null, $sql, null);
    if (!empty($results)){
      foreach ($results as $data_array){
        $library_name = $data_array['library_uname'];
        foreach ($data_array as $key=>$value){
          if (empty($value) || $key === 'library_uname' || $key === 'transcript_expression_library_id' || $key === 'transcript_uname'){continue;}
          $key =  $key.':'.$library_name;
          $return_array[] = array('term'=>$key,'value'=>$value);
        }
      }
    }
  }

   
  return $return_array;
}


/*
 * root": [

    {
        "term": "uniprot",
        "value": "<a href='http://www.uniprot.org/uniprot/Q9Y7N6' target='_blank'>Q9Y7N6</a>",
        "fmin": 1,
        "fmax": 2019,
        "gr": "Coord. 1 - 2019"
    },
    {
 */
function featureCV($id) {
  // this really isn't CV (controlled vocab) but linkouts such as database cross-referencing
  require ('SqlQueries.inc');
// TODO add linkouts
  $tSql = $sqlQueries['feature']['UniprotUrl'];
  $uniprot_url = query_execute(null, $tSql, null);
  $uniprot_url = $uniprot_url[0]['urlprefix'];
  if (empty($uniprot_url)){
    $uniprot_url='http://www.uniprot.org/uniprot/';
  }

  $minmax = '';
  
  // CV terms such as uniprot hits etc relate to the lower level transcript
  $parsed = datasetType($id);
  $id = $parsed['id'];
  $dsId = $parsed['dataset_id'];
  $return_array = array();
  
  //AP: if it is a gene, then we can get the transcript name and transverse.
  if ($parsed['type'] == Type::gene){
    // add linkouts for 'gene' and 'genome'
    $linkout_sql_gene = sprintf($sqlQueries['feature']['linkout_type'],pg_escape_string($dsId), 'gene');
    $linkout_sql_gene_res = query_execute(null,$linkout_sql_gene);
    if (!empty($linkout_sql_gene_res)){
      foreach ($linkout_sql_gene_res as $res){
        $url_linkout = "<a href='".$res['urlprefix'].$id."' target='_blank'>$id</a>";
        $return_array[] = array('term'=>$res['name'],'value'=>$url_linkout,'gr'=>'-Linkouts');
      }
    }
    $linkout_sql_genome = sprintf($sqlQueries['feature']['linkout_type'],pg_escape_string($dsId), 'genome');
    $linkout_sql_genome_res = query_execute(null,$linkout_sql_genome);
    if (!empty($linkout_sql_genome_res )){
      foreach ($linkout_sql_genome_res  as $res){
        $url_linkout = "<a href='".$res['urlprefix'].$id."' target='_blank'>$id</a>";
        $return_array[] = array('term'=>$res['name'],'value'=>$url_linkout,'gr'=>'-Linkouts');
      }
    }
    
    // add dbxref for gene 
    $dbxref_sql = sprintf($sqlQueries['feature']['dbxref_gene'],pg_escape_string($dsId), pg_escape_string($id));
    $dbxref_sql_res = query_execute(null,$dbxref_sql);
    if (!empty($dbxref_sql_res)){
      foreach ($dbxref_sql_res as $res){
        $url_linkout = "<a href='".$res['urlprefix'].$res['accession']."' target='_blank'>".$res['accession']."</a>";
        $return_array[] = array('term'=>$res['db_name'],'value'=>$url_linkout,'gr'=>'-Cross reference');
      }
    }
    
    
    // get any UniProt linkouts originating from transcripts.
    $transcripts_sql = sprintf($sqlQueries['gettranscripts'],pg_escape_string($dsId), pg_escape_string($id));
    $transcript_results = query_execute(null, $transcripts_sql, null);
    if (!empty($transcript_results)){
      foreach ($transcript_results as $transcript){
        $uniprot_hits = knownProteinHits(pg_escape_string($dsId), $transcript,$parsed['type']);
        if (!empty($uniprot_hits)){
          //merge
          $return_array = array_merge($return_array,uniprot_grouping($uniprot_hits,$uniprot_url));
        }
      }
    }
  }else{
    // add linkouts for CDS
    $linkout_sql_gene = sprintf($sqlQueries['feature']['linkout_type'],pg_escape_string($dsId), 'CDS');
    $linkout_sql_gene_res = query_execute(null,$linkout_sql_gene);
    if (!empty($linkout_sql_gene_res)){
      foreach ($linkout_sql_gene_res as $res){
        $url_linkout = "<a href='".$res['urlprefix'].$id."' target='_blank'>$id</a>";
        $return_array[] = array('term'=>$res['name'],'value'=>$url_linkout,'gr'=>'-Linkouts');
      }
    }
   	// add dbxref for transcript 
   	$dbxref_sql = sprintf($sqlQueries['feature']['dbxref_transcript'],pg_escape_string($dsId), pg_escape_string($id));
    $dbxref_sql_res = query_execute(null,$dbxref_sql);
    if (!empty($dbxref_sql_res)){
      foreach ($dbxref_sql_res as $res){
        $url_linkout = "<a href='".$res['urlprefix'].$res['accession']."' target='_blank'>".$res['accession']."</a>";
        $return_array[] = array('term'=>$res['db_name'],'value'=>$url_linkout,'gr'=>'-Cross reference');
      }
    }
    
    // uniprot hits for transcript
    $uniprot_hits = knownProteinHits($dsId,array('name'=>$id),$parsed['type']);
    if (!empty($uniprot_hits)){
      $return_array = array_merge($return_array,uniprot_grouping($uniprot_hits,$uniprot_url));
    }
  }
  if (empty($return_array)){
    return array('root'=>null);
  }else{
    return array('root'=>$return_array);
  }
  
}

function get_note($id){
  require ('SqlQueries.inc');
  $parsed = datasetType($id);
  $id = $parsed['id'];
  $dsId = $parsed['dataset_id'];
  $note_sql  = '';
  $notes_array = array();
  if ($parsed['type'] == Type::gene){
    $note_sql = sprintf($sqlQueries['feature']['gene_notes'],pg_escape_string($dsId), pg_escape_string($id));
  }else{
    $note_sql = sprintf($sqlQueries['feature']['transcript_notes'],pg_escape_string($dsId), pg_escape_string($id));
  }
  //var_dump($note_sql );
    $notes_array = query_execute(null, $note_sql);
  return $notes_array;
}


function uniprot_grouping($uniprot_hits,$uniprot_url){
  $return_array = array();
  foreach ($uniprot_hits as $hit){
    $start = $hit['fmin'];
    $stop = $hit['fmax'];
     
    if (!empty($hit['list'])){
      $list = explode(',',$hit['list']);
      foreach ($list as $single_hit){
        $return_array[] = array(
							'term' => "uniprot",
    						"value" => "<a href='$uniprot_url".$single_hit."' target='_blank'>".$single_hit."</a>",
    						"fmin" => $start,
    						"fmax" => $stop,
							"gr" => "Coord. $start - $stop"
        );
      }
    }else{
      $return_array[] = array(
						'term' => "uniprot",
    					"value" => "<a href='$uniprot_url".$hit['name']."' target='_blank'>".$hit['name']."</a>",
    					"fmin" => $start,
    					"fmax" => $stop,
						"gr" => "Coord. $start - $stop"
      );
    }
  }
  return $return_array;
}

/*
 * Helper function of featureFasta to get the
 * sequence of a feature (transcript or gene)
 * @author Alexie
 */
function get_featureFasta($feature_id, $seqtype=NULL){
  if (empty($feature_id)){return;}
  if (empty($seqtype) && !empty($_REQUEST['seqtype'])){
    $seqtype = $_REQUEST['seqtype'];
  }
  require ('SqlQueries.inc');
  $params = datasetType( $feature_id );
  $return_array = array();

  switch ($params['type']) {
    case Type::gene :
      if ($seqtype === 'gene'){
        $sql = sprintf($sqlQueries['fastaGene'], pg_escape_string($params['dataset_id']), pg_escape_string($params['id']));
        $result = query_execute(null, $sql, null);
        $result[0] = array_replace($result[0], array('residues' => $result[0]['residues']));
        $return_array[] = format_fasta_request($params['dataset_id'],$result[0]);
         
      }else{
        $get_transcripts_sql = sprintf($sqlQueries['gettranscripts'], pg_escape_string($params['dataset_id']), pg_escape_string($params['id']));
        $transcripts_res = query_execute(null, $get_transcripts_sql, null);
        if (!empty($transcripts_res)){
          foreach ($transcripts_res as $transcript_data){
            $transcript_id = $transcript_data['name'];
            switch ($seqtype){
              case 'mrna' :
                $sql = sprintf($sqlQueries['fastaTranscript'], pg_escape_string($params['dataset_id']), pg_escape_string($transcript_id));
                $result = query_execute(null, $sql, null);
                $result[0] = array_replace($result[0], array('residues' => $result[0]['residues']));
                $return_array[] = format_fasta_request($params['dataset_id'],$result[0]);
                break;
              case 'cds' :
                $sql = sprintf($sqlQueries['fastaCDS'], pg_escape_string($params['dataset_id']), pg_escape_string($transcript_id));
                $result = query_execute(null, $sql, null);
                $start = $result[0]['cds_start'] - 1;
                $stop = ($result[0]['cds_stop'] - 1);
                $len = $stop - $start + 1;
                $cds_sequence = substr($result[0]['residues'], $start, $len);
                $result[0] = array_replace($result[0], array('residues' => $cds_sequence));
                $return_array[] = format_fasta_request($params['dataset_id'],$result[0]);
                break;
            }
          }
        }

      }
      break;
    case Type::transcript :
      switch ($seqtype){
        case 'gene' :
          $gene_sql = sprintf($sqlQueries['getgene'], pg_escape_string($params['dataset_id']), pg_escape_string($params['id']));
          $gene_res = query_execute(null, $gene_sql, null);
          if (!empty($gene_res)){
            $sql = sprintf($sqlQueries['fastaGene'], pg_escape_string($params['dataset_id']), pg_escape_string($gene_res[0]['gene_uname']));
            $result = query_execute(null, $sql, null);
            $result[0] = array_replace($result[0], array('residues' => $result[0]['residues']));
            $return_array[] = format_fasta_request($params['dataset_id'],$result[0]);
          }
          break;
        case 'mrna' :
          $sql = sprintf($sqlQueries['fastaTranscript'], pg_escape_string($params['dataset_id']), pg_escape_string($params['id']));
          $result = query_execute(null, $sql, null);
          $result[0] = array_replace($result[0], array('residues' => $result[0]['residues']));
          $return_array[] = format_fasta_request($params['dataset_id'],$result[0]);
          break;
        case 'cds' :
          $sql = sprintf($sqlQueries['fastaCDS'], pg_escape_string($params['dataset_id']), pg_escape_string($params['id']));
          $result = query_execute(null, $sql, null);
          $start = $result[0]['cds_start'] - 1;
          $stop = ($result[0]['cds_stop'] - 1);
          $len = $stop - $start + 1;
          $cds_sequence = substr($result[0]['residues'], $start, $len);
          $result[0] = array_replace($result[0], array('residues' => $cds_sequence));
          $return_array[] = format_fasta_request($params['dataset_id'],$result[0]);
          break;
      }
  }
  return $return_array;
}

function format_fasta_request($dataset_id,$request){
  $name = $request['uniquename'];
  $fasta_out = '';
  if (!empty($request['residues'])){
    $link_name = "<a href='" . "#feature/dataset_$dataset_id.$name'>$name</a>";
    $fasta_out = ">$link_name\n".chunk_split($request['residues'], 80, "\n");
  }
  return array('data'=>$request,'fasta'=>$fasta_out);
}

/*
 * get fasta as an attachment or text
 * cf view/feature/Fasta.js
 */
function featureFasta( $id,$seqtype = NULL) {
  if (empty($seqtype) && !empty($_REQUEST['seqtype'])){
    $seqtype = $_REQUEST['seqtype'];
  }
  $return_array = array();
  if (!empty($id )) {
    $fasta_data = get_featureFasta($id,$seqtype);
    if (empty($fasta_data)){
      $return_array['fasta'] = "No data found";
    }else{
      foreach ($fasta_data as $data){
        $return_array['fasta'] .= $data['fasta'];
        $return_array['feature_data'][] = $data['data'];
      }
    }
  } else {
    $return_array[ 'fasta' ] = "Please provide feature id";
  }

  return $return_array;
}

/*
 * Like featureFasta but multiple IDs
 * expects either an array or json or string delimited by ; (in that order)
 * @author Alexie
 */
function get_multiple_featureFasta($feature_ids,$seqtype=NULL){
  if (empty($seqtype) && !empty($_REQUEST['seqtype'])){
    $seqtype = $_REQUEST['seqtype'];
  }
  $return_fasta = '';
  if (empty($feature_ids)){return $return_fasta;}
  if (!is_array($feature_ids)){
    $feature_ids = json_decode($feature_ids);
    // still not an array? delimit by;
    if (!is_array($feature_ids)){
      $feature_ids = explode(';',$feature_ids);
    }
  }

  foreach ($feature_ids as $id){
    $fasta_data = get_featureFasta($id,$seqtype);
    if (empty($fasta_data)){
      $return_fasta = "No sequences found\n";
    }else{
      foreach ($fasta_data as $data){
        $return_fasta .= $data['fasta'];
      }
    }
 	}
 	if (empty($return_fasta)){
 	  $return_fasta = "No sequences found\n";
 	}
 	return $return_fasta;
}


function getAnnotations($id) {
  //AP: if it is a gene, then we can get the transcript name and transverse.
  $result = array('text' => 'Vocabularies', 'children' => array());
  $parsed = datasetType(id);
   
  $go = array();
  $kegg = array();
  $ko = array();
  $enzyme = array();
  $eggnog = array();

  $go = annotations($id, 'getGO');
  $kegg = annotations($id, 'getKEGG');
  $ko = annotations($id, 'getKO');
  $enzyme = annotations($id, 'getENZYME');
  $eggnog = annotations($id, 'getEGGNOG');

  if (count($go) > 0) {
    array_push($result['children'], array('text' => 'GO', 'expanded' => 'true', 'children' => $go));
  }
  if (count($kegg) > 0) {
    array_push($result['children'], array('text' => 'KEGG', 'expanded' => 'true', 'children' => $kegg));
  }
  if (count($ko) > 0) {
    array_push($result['children'], array('text' => 'KO', 'expanded' => 'true', 'children' => $ko));
  }
  if (count($enzyme) > 0) {
    array_push($result['children'], array('text' => 'ENZYME', 'expanded' => 'true', 'children' => $enzyme));
  }
  if (count($eggnog) > 0) {
    array_push($result['children'], array('text' => 'EGGNOG', 'expanded' => 'true', 'children' => $eggnog));
  }
  // $result= array( 'root' => $result );
  return json_encode($result);
}

function annotations($id, $cv) {
  require ('SqlQueries.inc');
  $idDs = datasetType($id);
  $result = array();
  switch ( $idDs['type'] ) {
    case Type::gene :
      if (!empty($idDs['transcriptName'])){
        foreach ($idDs['transcriptName'] as $transcript_data){
          $sql = sprintf($sqlQueries['library'][$cv], pg_escape_string($idDs['dataset_id']), pg_escape_string($transcript_data));
          $result = array_merge($result,query_execute(null, $sql, null));
        }
      }
      break;
    case Type::transcript :
      $sql = sprintf($sqlQueries['library'][$cv], pg_escape_string($idDs['dataset_id']), pg_escape_string($idDs['id']));
      $result = query_execute(null, $sql, null);
      break;
  }
  // echo $sql."\n";



  foreach ($result as $key => $value) {
    if( $value['href'] ){
      $value['href'] = $value['href'] . $value['id'];
      $value['hrefTarget'] = '_blank';
    }
    // print_r( $value );
    if( empty( $value['msg'] )){
      $value['text'] = $value['id']. $value['text'];
    }
    $result[$key] = $value;
  }
  return $result;
}

function getNetworkTree($id) {
  require ('SqlQueries.inc');
  $idDs = datasetType($id);
  $return_array = array();
  switch ( $idDs['type'] ) {
    case Type::gene :
      $sql = sprintf($sqlQueries['gettranscripts'], pg_escape_string($idDs['dataset_id']), pg_escape_string($idDs['id']));
      $transcripts = query_execute(null, $sql);
      foreach ($transcripts as $key => $transcript) {
        $transcript_network = getAllTranscriptNetworks($transcript['name'], $idDs['dataset_id']);
        if( !empty( $transcript_network ) ){
          $return_array = array_merge($return_array, $transcript_network);
        }
      }
      break;
    case Type::transcript :
      $return_array = getAllTranscriptNetworks($idDs['id'], $idDs['dataset_id']);
      break;
  }
  return array('text'=>'root', 'expanded'=>'true','children'=>group_treelist($return_array));
}

function group_treelist($ungrouped_data){
  if (empty($ungrouped_data)){return null;}
  $tree_array = array();
  $return_array = array();
  foreach ($ungrouped_data as $data){
    $tree_array[$data['type']][] = $data;
  }
  foreach ($tree_array as $type=>$type_data){
    $return_array[] = array(
		'text' => $type,
		'leaf' => false,
		'children' => $type_data
    );
  }
  return $return_array;
}

/**
 * get all networks for a given transcript
 */
function getAllTranscriptNetworks($id, $dsId) {
  require ('SqlQueries.inc');
  $sql = sprintf($sqlQueries['feature']['networkTree'], pg_escape_string($id), pg_escape_string($dsId));
  $res = query_execute(null, $sql);
  return $res;
}

function getNetworkJson($id, $dsId) {
  require ('SqlQueries.inc');
  if (!empty($id) && !empty($dsId)){
    $dsId = datasetType($dsId);
    if (!empty($dsId)){
      $sql = sprintf($sqlQueries['feature']['networkJson'], pg_escape_string($id), pg_escape_string($dsId['dataset_id']));
      $res = query_execute(null, $sql);
    }
  }
  return $res[0]['json'];
}

function getNetworkTranscripts($id, $dsId) {
  require ('SqlQueries.inc');
  $dsId = datasetType($dsId);
  $sql = sprintf($sqlQueries['feature']['networkcds'], pg_escape_string($dsId['dataset_id']), pg_escape_string($id));
  $res = query_execute(null, $sql);
  return $res;
}

function get_expression_picture($dsId,$graph_type){
  require ('SqlQueries.inc');
  $dsId = datasetType($dsId);
  $return_array = array();
  $sql = sprintf($sqlQueries['feature']['get_expression_picture'], pg_escape_string($dsId['dataset_id']),pg_escape_string($dsId['id']),pg_escape_string($graph_type));
  // Some databases (e.g. morgan) are before Pgsql 9.0 which added hex and made it the default.
  query_execute(null, "SET bytea_output = 'escape'");
  $result = query_execute(null, $sql);
  if (!empty($result)){
    // only one picture per type
    // we expect escaped data, not HEX.
    $return_array['imageData'] = pg_unescape_bytea($result[0]['image_data']); // postgres column names are case insensitive, hates camel case
    $return_array['transcript_uname'] = $result[0]['transcript_uname'];
    $return_array['timeloaded'] = $result[0]['timeloaded'];
    if ($result[0]['format']==='svg'){
      $return_array['format'] = $result[0]['format'].'+xml';
    }else{
      $return_array['format'] = $result[0]['format'];
    }
  }

  return $return_array;
}

function get_one_expression_picture($dsId,$image_id){
  require ('SqlQueries.inc');
  if (empty($image_id)){return;}
  $dsId = datasetType($dsId);
  $return_array = array();
  $sql = sprintf($sqlQueries['feature']['get_one_expression_picture'], pg_escape_string($dsId['dataset_id']),pg_escape_string($image_id));
  // Some databases (e.g. morgan) are before Pgsql 9.0 which added hex and made it the default.
  query_execute(null, "SET bytea_output = 'escape'");
  $result = query_execute(null, $sql);
  if (!empty($result)){
    // only one picture per type
    // we expect escaped data, not HEX.
    $return_array['imageData'] = pg_unescape_bytea($result[0]['image_data']); // postgres column names are case insensitive, hates camel case
    $return_array['transcript_uname'] = $result[0]['transcript_uname'];
    $return_array['timeloaded'] = $result[0]['timeloaded'];
    if ($result[0]['format']==='svg'){
      $return_array['format'] = $result[0]['format'].'+xml';
    }else{
      $return_array['format'] = $result[0]['format'];
    }
  }

  return $return_array;
}

function list_expression_pictures($dsId){
  require ('SqlQueries.inc');
  $dsId = datasetType($dsId);
  $sql = '';
  $return_array = array();
  switch ($dsId['type']){
    case Type::gene:
      if (!empty($dsId['transcriptName'])){
        $dsId['transcriptName'] = array_map('pg_escape_string',$dsId['transcriptName']);
        $transcripts_joined = "'" . implode("','",$dsId['transcriptName'])."'";
        $sql = sprintf($sqlQueries['feature']['list_expression_pictures_genes'], pg_escape_string($dsId['dataset_id']),pg_escape_string($dsId['id']),$transcripts_joined);
      }
      break;
    case Type::transcript :
      $sql = sprintf($sqlQueries['feature']['list_expression_pictures'], pg_escape_string($dsId['dataset_id']),pg_escape_string($dsId['id']));
      break;
  }
  if (!empty($sql)){
    $return_array = query_execute(null, $sql);
  }
  return array('text'=>'root', 'expanded'=>'true','children'=>group_treelist($return_array));
}
?>
