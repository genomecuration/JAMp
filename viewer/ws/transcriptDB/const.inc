<?PHP
$controlledVocabularies = array(array( "cv_id"=>"1",
								  				"name"=>"Molecular Function",
								  				"title"=>"Molecular Function",
								  				"dsid"=>"344",
								  				"get"=>"cv_term"
								  		),array( "cv_id"=>"2",
								  				"name"=>"Biological Process",
								  				"title"=>"Biological Process",
								  				"dsid"=>"344",
								  				"get"=>"cv_term"
								  		),array( "cv_id"=>"3",
								  				"name"=>"Cellular Component",
								  				"title"=>"Cellular Component",
								  				"dsid"=>"344",
								  				"get"=>"cv_term"
								  		),array( "cv_id"=>"4",
								  				"name"=>"KEGG_PATHWAY",
								  				"title"=>"Pathway",
								  				"dsid"=>"344",
								  				"get"=>"cv_term"
								  		),array( "cv_id"=>"5",
								  				"name"=>"Enzyme",
								  				"title"=>"Enzyme",
								  				"dsid"=>"344",
								  				"get"=>"cv_term"
								  		),array( "cv_id"=>"6",
								  				"name"=>"Eggnog",
								  				"title"=>"Eggnog",
								  				"dsid"=>"344",
								  				"get"=>"cv_term"
								  		),array( "cv_id"=>"7",
								  				"name"=>"KO",
								  				"title"=>"KO",
								  				"dsid"=>"344",
								  				"get"=>"cv_term"
								  		));
global $own;
$own = 'demo';
class Type{
  // returns all libraries as a simple tree structure
  const gene = 1;
  // returns libraries organised according to organism
  const transcript = 2;
} 
?>