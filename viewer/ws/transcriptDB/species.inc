<?php
function refineSQL( $id , $filters , $facets ){
	$sql = array();	
	
	// filter features by library & a particular type( EST, polypeptide, contig etc...)
	// select feature_id from feature where feature_id in ( select feature_id from library_feature where library_id = 821) and  type_id in ( select cvterm_id from cvterm where name like '%EST%' );
		// library_feature
		// select feature_id from library_feature where library_id = 788
		// feature
		// select feature_id from feature natural join library_feature where type_id in ( select cvterm_id from cvterm where name like '%EST%' ) and library_id = 788
			//cvterm_id
			// type_id( EST, polypeptide, contig etc...)
			// select cvterm_id from cvterm where name like '%EST%';
	// filter features by library & cvterm_idS
	// library_feature_cvterms_mat
	
	if( $filters ){
		$intersectCvterm = array();
		foreach ($filters as $key => $cvterm) {
			if ( $cvterm->property == 'type' ){
				array_push( $sql  , "SELECT feature_id FROM feature WHERE feature_id IN (  SELECT DISTINCT l.feature_id FROM library_feature_cvterm_mat l WHERE l.library_id = ".pg_escape_string($id).") AND type_id IN ( SELECT cvterm_id FROM cvterm WHERE name LIKE '%".pg_escape_string($cvterm->value)."%' )" );
			}
		}
	} else {
		// array_push( $sql  , "select distinct l.feature_id from library_feature_cvterm_mat l where l.library_id = $id" );
	}
	if ( $facets ){
		$intersectCvterm = array();
		foreach ($facets as $key => $cvterm) {
			array_push( $sql , "SELECT feature_id FROM cvterm_organism_mat WHERE cvterm_id=".pg_escape_string($cvterm->value)." and organism_id=".pg_escape_string($id));
		}
	}
	return implode( ' intersect ' , $sql );
}
?>
