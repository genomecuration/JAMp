<?PHP
global $controlledVocabularies;
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
/**
 * show data for this owner only
 */
global $own;
$own = 'demo';
/**
 * an enumeration of id types
 */
class Type{
   // upper level hierarchy (aka contig). if gene from genome, may contain introns 
  const gene = 1;
  // transcript sequence (aka mRNA aka cDNA)
  const transcript = 2;
}
/**
 * 
 */
 class CV{
 	
 	const nothit = 8;
 }
 
 /**
  * protein translation mapping data.
  */
global $proteinMapping;
$proteinMapping = array(
	array( "id"=>1,"name"=>"Standard genetic code"),
	array("id"=>2,"name"=>"Vertebrate Mitochondrial"),
	array("id"=>3,"name"=>"Yeast Mitochondrial"),
	array("id"=>4, "name"=>"Mold, Protozoan and Coelenterate Mitochondrial. Mycoplasma, Spiroplasma"),
	array("id"=>5, "name"=>"Invertebrate Mitochondrial"),
	array("id"=>6, "name"=>"Ciliate Nuclear; Dasycladacean Nuclear; Hexamita Nuclear"),
	array("id"=>9, "name"=>"Echinoderm Mitochondrial"),
	array("id"=>10, "name"=>"Euplotid Nuclear"),
	array("id"=>11, "name"=>"Bacterial and Plant Plastid"),
	array("id"=>12, "name"=>"Alternative Yeast Nuclear"),
	array("id"=>13, "name"=>"Ascidian Mitochondrial"),
	array("id"=>14, "name"=>"Flatworm Mitochondrial"),
	array("id"=>15, "name"=>"Blepharisma Macronuclear"),
	array("id"=>16, "name"=>"Chlorophycean Mitochondrial"),
	array("id"=>21, "name"=>"Trematode Mitochondrial"),
	array("id"=>22, "name"=>"Scenedesmus obliquus mitochondrial"),
	array("id"=>23, "name" => "Thraustochytrium mitochondrial")
);
?>
