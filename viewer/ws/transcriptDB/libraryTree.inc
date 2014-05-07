<?PHP
require_once 'utils.inc';
class View {
	// returns all libraries as a simple tree structure
	const basic = 1;
	// returns libraries organised according to organism
	const organism = 2;
}

// TODO to delete this. not used anywhere
$config = array('organismVar' => 'organism_id');

/**
 * webservice name: ws/libraryTree
 *      return tree in json format understood by extjs treestore
 * parameters
 *      view (integer)- a number showing the view to format the result in.
 *                              It is possible to organize the tree according to genus
 *                              and species by choosing organism view. you can add ur own view by first declaring a const in view class above
 */

function listLibraryTree() {
	include 'connection.inc';
	require('SqlQueries.inc');
	require_once ( 'const.inc' );
	global $own;
	// default view
	$view = View::organism;
	//   $view = View::basic;
	if (isset($_REQUEST['view'])) {
		$view = $_REQUEST['view'];
	}

	$librarySql = sprintf( $sqlQueries['library']['tree'], $own );
	$children = query_execute($db, $librarySql);
	$tree = array();
	switch ( $view ) {
		case View::basic :
			$tree = $children;
			break;
		case View::organism :
			$tree = organismView($children);
			// $tree = addUnCategorised($tree);
			break;
	}
	$libTree = array('text' => 'Library',
	// 'expanded' => true,
	'children' => $tree);
	$libTree = addId($libTree);
	return $libTree;
}

function basicView($data) {
	$result = array();
	foreach ($data as $key => $value) {
		$result[] = organismLeaf($value);
	}
	return $result;
}

function organismView($data) {
	global $config;
	$intrim = array();
	$temp = null;
	$row = null;
	$childrenVar = 'children';
	$genus = 'genus';
	$species = 'species';
	$organismVar = 'organism_id';
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
		$temp = organismNode($value[0]);
		foreach ($value as $id => $leaf) {
			$children[] = organismLeaf($leaf);
		}
		$temp[$childrenVar] = $children;
		$result[] = $temp;
	}
	return $result;
}

function organismLeaf($data) {
	$node = array('id' => null, 'text' => null, 'leaf' => null);

	foreach ($node as $key => $value) {
		$node[$key] = $data[$key];
		$node['type'] = 'library';
	}
	return $node;
}

function organismNode($data) {
	$node = array('text' => null, 'leaf' => false, 'children' => null);
	$genus = 'genus';
	$species = 'species';
	$textVar = 'text';
	$childrenVar = 'children';
	$text = $data[$genus] . ' ' . $data[$species];
	$node[$textVar] = $text;
	$node['type'] = 'species';
	$node['id'] = $data['organism_id'];
	return $node;
}

function addUnCategorised($tree) {
	// echo print_r($tree);
	foreach ($tree as $key => $species) {
		if ($species['type'] == 'species') {

			if (isset($species['children'])) {
				array_push($species['children'], array(
				'text' => 'Unknown',
				'type' => 'library',
				'leaf' => 'true',
				'id' => -1*$species['id']
				));

				$tree[$key] = $species;
			}
		}
	}
	return $tree;
}
function addId( $ds , &$id = 1, $idProp = 'pid', $childrenProp = 'children'){
	$ds[$idProp] = $id;
	if (!empty($ds[ $childrenProp ])){
		foreach ( $ds[ $childrenProp ] as $key => $value ) {
			$id ++;
			$ds[ $childrenProp ][$key] = addId( $value , $id );
		}
	}
	return $ds;
}
?>
