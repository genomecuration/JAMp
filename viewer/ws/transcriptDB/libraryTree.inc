<?PHP
require_once 'utils.inc';
class View {
  // returns all libraries as a simple tree structure
  const basic = 1;
  // returns dataset/libraries organised according to organism
  const organism = 2;
  // as 2 plus a 3rd layer of expression_libraries (aka readset)
  const expression_library = 3;
}

// TODO to delete this. not used anywhere
$config = array('organismVar' => 'organism_id');

/**
 * webservice name: ws/libraryTree
 *      return tree in json format understood by extjs treestore
 * parameters
 *      view (integer)- a number showing the view to format the result in.
 *  It is possible to organize the tree according to
 * 	speciesname by choosing organism view. you can add ur own view by first declaring a const in view class above
 */

function listLibraryTree() {
  require('SqlQueries.inc');
  require_once ( 'const.inc' );
  global $own;
  // default view
  $view = View::expression_library;
  //  $view = View::organism;
  //   $view = View::basic;
  if (isset($_REQUEST['view'])) {
    $view = $_REQUEST['view'];
  }

  $librarySql = sprintf( $sqlQueries['library']['tree'], pg_escape_string($own) );

  $children = query_execute($db, $librarySql);
  $tree = array();
  switch ( $view ) {
    case View::basic :
      $tree = $children;
      break;
    case View::organism :
      $tree = organismView($children);
      break;
    case View::expression_library :
      $species = organismView($children);
      foreach ($species as &$species_data){
        foreach ($species_data["children"] as &$dataset){
          add_expressionView($dataset);
        }
      }
      $tree = $species;
      break;
  }
  $libTree = array('text' => 'Library',
  // 'expanded' => true,
	'children' => $tree);
  $libTree = addId($libTree);
  return $libTree;
}

function add_expressionView(&$data){
  if (empty($data) || empty($data['type']) || $data['type']!=='library'){return;}
  require_once 'library.inc';
  $dataset_id = $data['id'];
  $expression_library_data = get_expression_libraries($dataset_id);
  if (!empty($expression_library_data)){
    $data['leaf']= false;
    $data['children'][] = array('id'=>$dataset_id.'^All','text'=>'All','type'=>'expression_library','qtip'=>'All expression libraries','leaf'=>true,'dsid'=>$dataset_id);
    foreach ($expression_library_data as $library_data){
      if (!empty($library_data['description'])){
        $data['children'][] = array('id'=>$dataset_id.'^'.$library_data['uname'],'text'=>$library_data['uname'],'type'=>'expression_library','qtip'=>$library_data['description'],'leaf'=>true,'dsid'=>$dataset_id);
      }else{
        $data['children'][] = array('id'=>$dataset_id.'^'.$library_data['uname'],'text'=>$library_data['uname'],'type'=>'expression_library','leaf'=>true,'dsid'=>$dataset_id);
      }
    }
  }
  return $data;
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
  $species = 'species';
  $textVar = 'text';
  $childrenVar = 'children';
  $text = $data[$species];
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
