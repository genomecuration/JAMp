<?php
require_once 'utils.inc';
function expTreeView(){
	$exps = getExperiments();
	$tree = treeView($exps);
	return $tree;
}
function getExperiments(  ){
	require("SqlQueries.inc");
	$sql = $sqlQueries['de']['experiments'];
	$data = query_execute(null, $sql , null );
	return $data;	
}
function treeView( $flat )
{
	$children = basicView($flat);
	$children = groupExperiments( $children );
	return array( 'expanded'=>TRUE, 'text'=>'Experiments','pid'=>1,'children'=> $children);
	
}
function groupExperiments( $data ) {
	$intrim = array();
	$temp = null;
	$row = null;
	$childrenVar = 'children';
	$organismVar = 'pid';
	// organize organism according to organism_id
	foreach ($data as $key => $value) {
		$row = $value;
		if (!$intrim[$value[$organismVar]]) {
			$temp = array();
		} else {
			$temp = $intrim[$value[$organismVar]];
		}
		array_push($temp, $row);
		$intrim[$value[$organismVar]] = $temp;
	}
	$result = array();
	// trim data to the necessary level and format
	foreach ($intrim as $key => $value) {
		$children = array();
		$temp = createNode($value[0]);
		foreach ($value as $id => $leaf) {
			$children[] = $leaf;
		}
		$temp[$childrenVar] = $children;
		$result[] = $temp;
	}
	return $result;
}
function createNode($data) {
	$node = array('text' => null, 'leaf' => false, 'children' => null);
	$node['text'] = $data['text'];
	$node['type'] = 'experiment';
	$node['pid'] = $data['pid'];
	return $node;
}
function basicView($data) {
	$result = array();
	foreach ($data as $key => $value) {
		$result[] = organismLeaf($value);
	}
	return $result;
}
function organismLeaf($data) {
	$node = array('pid' => null,'gid' => null,  'leaf' => null);

	foreach ($node as $key => $value) {
		$node[$key] = $data[$key];
	}
	$node['text'] = $data['text'];
	$node['type'] = $data['type'];
	return $node;
}
function getGraphData( $pid, $gid ){
	require("SqlQueries.inc");
	$sql = sprintf( $sqlQueries['de']['graphdata'], pg_escape_string($gid) ,pg_escape_string( $pid));
	$data = query_execute(null, $sql , null );
	$json = $data[0]['json'];
	$text = json_decode( $json );
	$config;
	$configHeatmap = json_decode('{
      "graphType" : "Heatmap",
      "showVarDendrogram" : true,
      "showSmpDendrogram" : true,
      "showSampleNames" : false,
      "smpTitle" : "Treatments",
      "showVariableNames" : false,
      "indicatorWidth": 3
    }');
	$configScatter = json_decode('{
      "graphType": "Scatter2D",
      "yAxis": ["logFC"],
      "xAxis": ["logCPM"],
      "setMaxX": 20,
      "setMinX": 0,
      "setMaxY": 20,
      "setMinY": -20,
      "yAxisTitle": "logFC (M)",
      "xAxisTitle": "logCPM (A)",
      "sizeBy": "-log(qvalue)",
      "colorBy": "-log(qvalue)",
      "indicatorWidth": 3,
      "legendPosition": "bottom",
      "indicatorsPosition": "right"
    }');
	$configScatter3d = json_decode('{
      "graphType": "Scatter3D",
      "yAxis": ["logFC"],
      "xAxis": ["logCPM"],
      "zAxis":["-log(qvalue)"],
      "setMaxX": 20,
      "setMinX": 0,
      "setMaxY": 20,
      "setMinY": -20,
      "yAxisTitle": "logFC (M)",
      "xAxisTitle": "logCPM (A)",
      "zAxisTitle": "FDR (-log)",
      "sizeBy": "-log(qvalue)",
      "colorBy": "-log(qvalue)",
      "indicatorWidth": 3,
      "legendPosition": "bottom",
      "indicatorsPosition": "right",
      "scatterType": false
    }');
	// echo print_r( $data[0] );
	switch ( $data[0]['type'] ) {
		case 'heatmap':
			$config = $configHeatmap;
			break;
		case 'scatter2d':
			$config = $configScatter;
			break;
		case 'scatter3d':
			$config = $configScatter3d;
			break;
	}
	// echo print_r($text);
	return array( 'datapoints'=>$text, 'config'=>$config );
}
?>