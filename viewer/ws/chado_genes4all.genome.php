<?php
$database_adaptor = 'chado_genes4all';
genomeviewer();
function genomeviewer ( ){
        global $database_adaptor; // = $database_adaptor ? $database_adaptor : 'chado_genes4all';
        $type = $_REQUEST ['type'];
        $id = $_REQUEST ['id'];
        switch ( $type ){
                case 'sequence':
                        require_once( $database_adaptor . '/utils.inc' );
                        header('Content-Type: text/plain');
                        echo getSequence( $id );
                        break;
                case 'track':
                        require_once( $database_adaptor .  '/genomebrowser.inc' );
                        header('Content-Type: application/JSON');
                        echo json_encode( canvasTrack( $id ) );
                        break;
        }
}
?>
