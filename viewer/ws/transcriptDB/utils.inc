<?php
require_once 'const.inc';
/*
 * filtering
 * ordering
 * grouping
 */
 
 /* array(
  * conditions =>array(
  * 1 => 'a.a = b.a',
  * 2 => 'a.c = 'a''
  * ),
  * string => 'where a.a = b.a and a.c = 'a''
  * )
  */
  
  $paramConfig=array(
  	'filterParam' => 'filter',
  	'orderParam' => 'order',
  	'groupParam' => 'group'
  );
/*
 *parameters
 * params - $_REQUEST
 * filter - format - Array( 0 => array( 'data'='VALUEIFNUMBER','property'=>'PROPERTYVALUE','value'=>'FIELDVALUEIFSTRING'));
 * translation - an array that can translate filter property to appropriate sql names
 * searchType - values -( 'all','end', 'beginning')
 */
function filter( $filter , $translation , $searchType ){
	global $paramConfig;
  // $translation  = array('type' => 'cvt.name' );
	// $filter = $params[ 'filter' ];
	// echo print_r($paramConfig);
	// $filter = json_decode( $filter );
	$output  = array(
		'conditions' => array( ),
		'string' => ''
	);
	foreach ($filter as $key => $value) {
		$type = $value->data ? 'comparison':'regex';
		$colName = $value->property;
		if ( $translation && $translation [ $colName ]){
			$colName = $translation [ $colName ];
			if( is_array( $colName ) ){
				if ( $colName['type'] == 'number' ){
					$type = 'comparison';
				}
				$colName = $colName['name'];
			}
		}
		switch ($type) {
			case 'comparison':
				array_push( $output['conditions'] , $colName." = ".$value->value );
			break;
			case 'regex':
				// echo $translation [ $colName ];
				switch ( $searchType) {
					case 'end':
						array_push($output['conditions'] , $colName." like '".$value->value ."%'");
						break;
					case 'beginning':
						array_push($output['conditions'] , $colName." like '%".$value->value ."'");
						break;
					case 'all':
						array_push($output['conditions'] , $colName." like '%".$value->value ."%'");
					default:
						array_push($output['conditions'] , $colName." = '".$value->value ."'");
						break;
				}
				
			break;	
		}
	}
	if ( count ( $output['conditions'] )){
		$output ['string'] = 'where '.join(' and ', $output['conditions']);
	}
	return $output;
}
/*
 *parameters
 * params - $_REQUEST
 * filter - format - Array( 0 => array( 'data'='VALUEIFNUMBER','property'=>'PROPERTYVALUE','value'=>'FIELDVALUEIFSTRING'));
 * translation - an array that can translate filter property to appropriate sql names
 * searchType - values -( 'all','end', 'beginning')
 */
function filterWithSubQuery( $filter , $translation , $searchType ){
	global $paramConfig;
  // $translation  = array('type' => 'cvt.name' );
	// $filter = $params[ 'filter' ];
	// echo print_r($paramConfig);
	// $filter = json_decode( $filter );
	$output  = array(
		'conditions' => array( ),
		'string' => ''
	);
	foreach ($filter as $key => $value) {
		// echo print_r($value);
		$type = $value->data ? 'comparison':'regex';
		$colName = $value->property;
		if ( $translation && $translation [ $colName ]){
			$colName = $translation [ $colName ];
			if( is_array( $colName ) ){
				if ( $colName['type'] == 'number' ){
					$type = 'comparison';
				}
				$colName = $colName['name'];
				$value->property = $colName;
			}
		}
		// removing regex search as it is taking too much time
		// echo $value->property;
		switch( $value->property ){
			// case 'type':
				// array_push($output['conditions'] ,"type_id in (select cvterm_id from cvterm where name = '".$value->value."')" );
				// break;
			// case 'genus':
				// array_push($output['conditions'] , "organism_id in (select organism_id from organism where genus = '".$value->value."')" );
				// break;
			// case 'species':
				// array_push($output['conditions'] , "organism_id in (select organism_id from organism where species = '".$value->value."')" );
				// break;
			// case 'name':
				// array_push($output['conditions'] , "f.name like '".$value->value."%'" );
				// break;
			case 't.uname':
				array_push( $output['conditions'], $value->property." = '".$value->value."'" );
				break;
		}

	}
	if ( count ( $output['conditions'] )){
		$output ['string'] = 'where '.join(' and ', $output['conditions']);
	}
	return $output;
}
function where ( ){
	
}
 /* array(
  * conditions =>array(
  * 1 => 'a.a DESC',
  * 2 => 'b.c'
  * ),
  * string => 'order by a.a, b.c DESC'
  * )
  */
function orderby( $params , $translation) {
		global $paramConfig;
  // $translation  = array('type' => 'cvt.name' );
	$filter = $params[ 'sort' ];
	// echo print_r($paramConfig);
	$filter = json_decode( $filter );
	$output  = array(
		'conditions' => array( ),
		'order' =>'',
		'string' => ''
	);
	foreach ($filter as $key => $value) {
				$colName = $value->property;
				if ( $translation && $translation [ $colName ]){
					$colName = $translation [ $colName ];
				}
				// echo $translation [ $colName ];
				array_push( $output['conditions'] , $colName." ".$value->direction );
	}
	if ( count ( $output['conditions'] )){
		$output ['string'] = 'order by '.join(' , ', $output['conditions'] );
	}
	return $output;
}
 /* array(
  * conditions =>array(
  * 1 => 'a.a',
  * 2 => 'b.c'
  * ),
  * order =>'DESC',
  * string => 'order by a.a, b.c DESC'
  * )
  */
function groupby() {
	
}

function paging ( $params ) {
	global $paramConfig;
  	// $translation  = array('type' => 'cvt.name' );
	$filter = $params[ 'sort' ];
	// echo print_r($paramConfig);
	$filter = json_decode( $filter );
	$str ='';
	$offset = $params['start'];
	$limit = $params['limit'];
	// if ( count ( $output['conditions'] )){
	$str = "limit $limit offset $offset";
	// }
	return $str;
}
function cloning ( $old ) {
	// $new = array();
	// foreach ($old as $k => $v) {
	    // $new[$k] = clone $v;
	// }
	return array_merge(array(), $old);
}
/**
 * short hack for demo.
 * TODO: this function should remove underscore, capitalize first letter
 */
function processData ( $trans  ){
	$translate  = array(
	'EC'=>'Enzyme Classification',
	'KEGG_PATHWAY'=>'Pathway',
	'molecular_function'=>'Molecular function',
	'biological_process'=>'Biological process',
	'cellular_component'=>'Cellular component',
	'sequence'=>'Sequence',
	'dbxref'=>'Database cross reference',
	'blast'=>'BLAST'
	);
	foreach ($trans as $key => $value) {
		// echo print_r($value);
		$value['title'] = $translate[ $value['name'] ];
		// echo $value['title'];
		$trans[$key] = $value;
		// echo print_r($value);
	}
	return $trans;
}
function getSequence ( $featureId , $db) {
	$db = $db? $db:'chado';
	if ( $featureId ){
		$sql = "select feature_id  , residues , uniquename from feature where feature_id = $featureId";
		$result = query_execute($db, $sql , null);
		$sequence = $result[0]['residues'];
		return $sequence;
	} else {
		return "Please provide feature id";
	}
}
function getFeature ( $featureId , $dsid) {
	require 'SqlQueries.inc';
	if ( $featureId ){
		$sql = sprintf( $sqlQueries['nucleotides'], $dsid, $featureId );
		$result = query_execute( null, $sql , null);
		if( isset ( $result )){
			$result = $result[0];
		}
		return $result;
	} else {
		return "Please provide feature id";
	}
}
/**
 * iterates thorugh a list of features and adds all libraries they are associated with.
 */
function addLibraries($data) {
	foreach ($data as $key => $row) {
		$featureid = $row['feature_id'];
		$libSql = "select lib.library_id, lib.name as library_name from library_feature libf join library lib on lib.library_id = libf.library_id where libf.feature_id = $featureid";
		$result = query_execute('chado', $libSql, null);
		$row['libraries'] = $result;
		$data[$key] = $row;
	}
	return $data;
}
/**
 * iterates thorugh a list of features and adds all features that use it as a source feature.
 */
function addSourceFeature($data) {
	foreach ($data as $key => $row) {
		$srcSql = "select fs.uniquename , loc.srcfeature_id as feature_id from featureLoc loc join feature fs on loc.srcfeature_id = fs.feature_id where loc.feature_id = $featureid";
		$result = query_execute('chado', $srcSql, null);
		$row['sources'] = $result;
		$data[$key] = $row;
	}
	return $data;
}
function getRowsFromExplain ( $sql , $table , $db){
	if( ! preg_match('/[Ee]xplain/g', $subject)){
		$sql = 'Explain '.$sql;
	}
	$result = query_execute( $db , $sql, null);
	$row;
	foreach ($result as $key => $v) {
		$value = $v ['QUERY PLAN'];
		if( preg_match( '/'.$table.'/' , $value) ){
			preg_match( '/rows=(\d+)\s/' , $value , &$row );
			break;
		}			
	}
	if( isset( $row )){
		return $row[1];
	}
	return;
}
function countSql( $sql ){
	return "SELECT COUNT(*) FROM ( $sql ) AS F";	
}

function query_execute($db = NULL, $sql = NULL, $variables = NULL,$reconnect=TRUE) {
  require_once 'connection.inc';
  $return_array = array();
  $res = pg_query($sql);
  while ($data=pg_fetch_array($res, NULL , PGSQL_ASSOC)){
    $return_array[]=$data;
  }
  return $return_array;
}
function addProperty( $data , $prop , $pValue){
	foreach ($data as $key => $value) {
		// $temp = $value[$prop];
		// if( !isset($temp) ){
			// $temp = array(); 
		// }
		// $temp = array_merge($temp , $pValue);
		$value[$prop] = $pValue;
		$data[$key] = $value;
		// $value[$prop] = $temp;
		// $data[$key] = $value;
	}
	return $data;
}

/*
 * get sequence length
 * $seq - string
 * @returns
 * integer
 */
function seqLen($seq)
{
	if( $seq ){
		return mb_strlen($seq);
	}else {
		return 0;
	}
}

/**
 * return a value for a particular array
 * @parameters
 * $arr - array 
 * $key - key value to return
 */
 function getValue( $arr , $k='value'){
 	// echo print_r($arr);
	// echo $k;
 	return $arr[$k];
 }
 
 /**
  * parse id to extract dataset id and gene or transcript id.
  * @parameters
  * id - dataset id
  * 	example format - dataset_18.m.1  
  */
  function datasetType( $id )
  {
	  require('SqlQueries.inc');
	  $datasetType = '';
	  $result = array();
	  // echo $id;
	  preg_match('/^dataset_([^.]+)\.(.*)$/', $id, $ids);
	  
	  if( count( $ids ) > 1 ){
	  	$datasetId = $ids[1];
		$id = $ids[2];
		$result['id'] = $id;
		$result['dataset_id'] = $datasetId;
		$sql = sprintf($sqlQueries['checkGene'], $datasetId, $id);
		$resSql = query_execute( null, $sql,null);
		if( count ( $resSql ) > 0){
			$result['type'] = Type::gene;
			$result['transcriptName'] = $resSql[0]['tuname']; 
		} else {
			$sql = sprintf($sqlQueries['checkTranscript'], $datasetId, $id);
			$resSql = query_execute( null, $sql, null);
			if( count($resSql) > 0){
				$result['type'] = Type::transcript;
			}
		}
	  }
	  return $result;
  }
/**
 * html format a link
 * @parameters
 * $text - text to be display
 * $href - url that should be linked 
 */
function ahref( $text , $href){
	return "<a href='$href' target='_blank'>$text</a>";
}

 /**
  * 
  */
  function flattenTwoD ( $twoD , $keyName='key',$valueName='value', $additionalInfoName,$additionalInfoValue){
  	$thin = array();
  	foreach ($twoD as $key => $value) {
	  	$thin = array_merge( $thin , flattenArray($value, $keyName, $valueName , $additionalInfoName, $additionalInfoValue ) );
	  }
	return $thin;
  }

/**
 * takes an associative array and converts it into an array of values.
 * example: array ( 'y'=>'x','c'=>'l')
 * output:  array ( array('key'=>'y','value'=>'x'), array('key'=>'c','value'=>'l') ) 
 */
 function flattenArray( $fat , $keyName='key',$valueName='value', $addInfoName, $addInfoValue ){
 	$thin = array();
	foreach ($fat as $key => $value) {
		if( $addInfoName ){
			array_push( $thin, array( $keyName=>$key,$valueName=>$value ,$addInfoName=>$fat[$addInfoValue]) );
		} else {
			array_push( $thin, array( $keyName=>$key,$valueName=>$value ) );
		}
	}
	return $thin;
}
/**
 * get the total number of transcripts in a library
 */
 function totalTranscripts( $dsId ){
	require('SqlQueries.inc');
	$sql = sprintf($sqlQueries['library']['itemsCount'], $dsId,'');
	$counts = query_execute(null, $sql);
	return $counts[0]['count'];
 }
 /**
  * get total number of transcripts per species
  */
  function totalTrancsriptsSpecies( $species ){
	require('SqlQueries.inc');
	$total = 0;
	$sql = sprintf( $sqlQueries['species']['datasets'], $species );
	$result = query_execute( null, $sql, null );
	foreach ($result as $key => $value) {
		$total += totalTranscripts($value['dataset_id']);
	}
	return $total;
  }
  /**
   * does the owner has access to the given datasets. 
   * return
   * true - yes access granted
   * false - no access 
   */
function hasAccess( $test ){
	/**
	 * check for a single id 
	 */
 	$access = TRUE;
	if( is_numeric( $test) ){
		$access &= idsAccess( $test );
	} elseif (is_array( $test )) {
		if( is_numeric( $test[0] ) ){
			$access &= idsAccess( $test );
		}
	} else {
		$access &= featureIdAccess( $test );
	}
	return $access;
}
/**
 * 
 */
function idsAccess( $ids ){
	require('SqlQueries.inc');
	global $own;
	if( is_array( $ids ) ){
		
	} else {
		$ids = array( $ids );
	}
	$idsString = '('.join( ',', $ids ).')';
	$sql = sprintf( $sqlQueries['getOwner'], $idsString );
	$owners = query_execute( null, $sql);
	foreach ($owners as $key => $owner) {
		if( $owner['owner'] != $own) {
			return FALSE;
		}
	}
	return TRUE;
}
function featureIdAccess( $featureId ){
	if( isset( $featureId )){
		$idDs = datasetType( $featureId );
		$id = $idDs['dataset_id'];
	} else {
		return FALSE;
	}
	return idsAccess( $id );
}
/**
 * get the dataset id value from array of key value pairs.
 */
function filterId	( $filters ){
	$ids = array();
	if( isset( $filters ) ){
		foreach ( $filters as $key => $filter ) {
			if( $filter['property'] == 'feature_id' ){
				$ds = datasetType($filter['value']);
				array_push( $ids ,  $ds['dataset_id'] );
			}			
		}
	}
	return $ids;
}
/**
 * translate nucleotide to protein
 * 
 * author    Joseba Bikandi
 * license   GNU GPL v2
 * source code available at  biophp.org
 */
 function translate_DNA_to_protein($seq,$genetic_code){

        // $aminoacids is the array of aminoacids
        $aminoacids=array("F","L","I","M","V","S","P","T","A","Y","*","H","Q","N","K","D","E","C","W","R","G","X");

        // $triplets is the array containning the genetic codes
        // Info has been extracted from http://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi?mode

        // Standard genetic code
        $triplets[1]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG |TGA )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Vertebrate Mitochondrial
        $triplets[2]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG |AGA |AGG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. )","(GG. )","(\S\S\S )");
        // Yeast Mitochondrial
        $triplets[3]=array("(TTT |TTC )","(TTA |TTG )","(ATT |ATC )","(ATG |ATA )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. |CT. )","(GC. )","(TAT |TAC )","(TAA |TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Mold, Protozoan and Coelenterate Mitochondrial. Mycoplasma, Spiroplasma
        $triplets[4]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Invertebrate Mitochondrial
        $triplets[5]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC )","(ATG |ATA )","(GT. )","(TC. |AG. )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. )","(GG. )","(\S\S\S )");
        // Ciliate Nuclear; Dasycladacean Nuclear; Hexamita Nuclear
        $triplets[6]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TGA )","(CAT |CAC )",
                        "(CAA |CAG |TAA |TAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Echinoderm Mitochondrial
        $triplets[9]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AG. )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAA |AAT |AAC )","(AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. )","(GG. )","(\S\S\S )");
        // Euplotid Nuclear
        $triplets[10]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC |TGA )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Bacterial and Plant Plastid
        $triplets[11]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG |TGA )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Alternative Yeast Nuclear
        $triplets[12]=array("(TTT |TTC )","(TTA |TTG |CTA |CTT |CTC )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC |CTG )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG |TGA )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Ascidian Mitochondrial
        $triplets[13]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC )","(ATG |ATA )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. )","(GG. |AGA |AGG )","(\S\S\S )");
        // Flatworm Mitochondrial
        $triplets[14]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AG. )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC |TAA )","(TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC |AAA )","(AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. )","(GG. )","(\S\S\S )");
        // Blepharisma Macronuclear
        $triplets[15]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TGA )","(CAT |CAC )",
                        "(CAA |CAG |TAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Chlorophycean Mitochondrial
        $triplets[16]=array("(TTT |TTC )","(TTA |TTG |CT. |TAG )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TGA )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Trematode Mitochondrial
        $triplets[21]=array("(TTT |TTC )","(TTA |TTG |CT. )","(ATT |ATC )","(ATG |ATA )","(GT. )","(TC. |AG. )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TAG )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC |AAA )","(AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG |TGA )","(CG. )","(GG. )","(\S\S\S )");
        // Scenedesmus obliquus mitochondrial
        $triplets[22]=array("(TTT |TTC )","(TTA |TTG |CT. |TAG )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TCT |TCC |TCG |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TAA |TGA |TCA )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");
        // Thraustochytrium mitochondrial code
        $triplets[23]=array("(TTT |TTC )","(TTG |CT. )","(ATT |ATC |ATA )","(ATG )","(GT. )","(TC. |AGT |AGC )",
                        "(CC. )","(AC. )","(GC. )","(TAT |TAC )","(TTA |TAA |TAG |TGA )","(CAT |CAC )",
                        "(CAA |CAG )","(AAT |AAC )","(AAA |AAG )","(GAT |GAC )","(GAA |GAG )","(TGT |TGC )",
                        "(TGG )","(CG. |AGA |AGG )","(GG. )","(\S\S\S )");

        // place a space after each triplete in the sequence
        $temp = chunk_split($seq,3,' ');

        // replace triplets by corresponding amnoacid
        $peptide = preg_replace ($triplets[$genetic_code], $aminoacids, $temp);

        // return peptide sequence
        return $peptide;
}
?>