<?PHP
require_once("utils.inc");

class View{
  // returns all libraries as a simple tree structure
  const basic = 1;
  // returns libraries organised according to organism
  const organism = 2;
}
// TODO to delete this. not used anywhere
$config = array ( 'organismVar' => 'organism_id' );

/**
 * webservice name: ws/libraryTree
 *      return tree in json format understood by extjs treestore
 * parameters
 *      view (integer)- a number showing the view to format the result in. 
 *                              It is possible to organize the tree according to genus 
 *                              and species by choosing organism view. you can add ur own view by first declaring a const in view class above
 */

function listSpeciesTree () {
	require 'SqlQueries.inc';
  // default view
//   $view = View::organism;
  $view = View::basic;
  if ( isset ( $_REQUEST['view'] ) ) {
    $view = $_REQUEST['view'];
  }
  
  // $librarySql = "select organism_id as id, genus, species, 'true' as leaf from organism order by genus, species";
  $librarySql = $sqlQueries['species']['tree'];
  $children = query_execute('chado', $librarySql , null);
  $tree = array();
  switch ( $view ) {
    case View::basic:
      $tree = basicView ( $children );
      break;
	  // todo: it makes no difference. remove it.
    case View::organism:
      $tree = organismView ( $children );
      break;
  }
  
  $orgTree = array (
    'text' =>'Species',
    // 'expanded' => true,
    'children' => $tree
  );
  // header('Content-Type: application/json');
  // echo json_encode( $orgTree );
  return $orgTree;
}

function basicView ( $data ) {
  $result = array();
  foreach ( $data as $key => $value ) {
    $result[] = organismLeaf( $value);
  }
  return $result;
}

//TODO: This makes no difference . remove it
function organismView ( $data ) {
  global $config;
  $intrim = array();
  $temp = null;
  $row = null;
  $childrenVar = 'children';
  $genus = 'genus';
  $species = 'species';
  $organismVar = 'id';
  // organize organism according to organism_id
  foreach ( $data as $key => $value ) {
    $row = $value;
    if ( !$intrim[ $value[ $organismVar ] ]  ) {
      $temp =  array();
    } else {
      $temp = $intrim[ $value[ $organismVar ] ];
    }
    array_push ( $temp , $row );
    $intrim[ $value[ $organismVar ] ] = $temp;
  }
  $result = array();
  // trim data to the necessary level and format
  foreach( $intrim as $key => $value ) {
    $children = array();
    $temp = organismNode( $value[0] );
    foreach( $value as $id => $leaf){
      $children[] = organismLeaf ( $leaf );
    }
    $temp[ $childrenVar ] = $children;
    $result[] = $temp;
  }
  return $result;
}
function organismLeaf ( $data ) {
  $node = array ( 'id' => null , 'text' => null, 'leaf' => null);
  
  foreach ( $node as $key => $value )  {
    $node [ $key ] = $data [ $key ];
  }
  
  $node ['text'] = $data['genus'].' '.$data['species'];
  return $node;
}
function organismNode ( $data ) {
  $node = array ( 'text' => null, 'leaf' => false, 'children'=>null);
  $genus = 'genus';
  $species = 'species';
  $textVar  = 'text';
  $childrenVar = 'children';
  $text = $data[ $genus ] .' '.$data[ $species ];
  $node[$textVar] = $text;
//   $node [ $childrenVar ] =  $data [ $childrenVar ] ;
  return $node;
}
?>