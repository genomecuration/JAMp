Ext.define('CV.config.ChadoViewer', {
  singleton : true,
  statics : {
    drupalBase : '',
    baseUrl : 'ws/database.php',
    genomeviewer : {
      url : 'ws/genome.php'
    },
    selectedIds : undefined,
    currentUri : undefined,
    countField: 'total',
    picture : {
      expression : {
          ds : 'picture',
          type : 'expression',
          image_id: 0
      }
    },
    library : {
      tree : {
        extraParams : {
          ds : 'library',
          type : 'tree'
        },
        view : {

        }
      },
      cv : {
        extraParams : {
          ds : 'library',
          type : 'cv',
          id : 0,
          ids: undefined
        },
        ds : 'library'
      },
      graph : {
        vocabulary : {
          id : 0,
          get : 'cv',
          ds : 'library',
          type : 'graph',
          facets : null
        },
        cvterm : {
          id : 0,
          get : 'cv_term',
          cv_id : 0,
          ds : 'library',
          type : 'graph',
          cv_name : '',
          facets : null,
          ids : null
        },
        ds : 'library'
      },
      feature : {
        extraParams : {
          ds : 'library',
          type : 'feature',
          id : 0,
          facets : null
        },
        ds : 'library'
      }
    },
    species : {
      tree : {
        extraParams : {
          ds : 'species',
          type : 'tree'
        }
      },
      cv : {
        extraParams : {
          ds : 'species',
          type : 'cv',
          id : 0
        },
        ds : 'species'
      },
      graph : {
        vocabulary : {
          id : 0,
          get : 'cv',
          ds : 'species',
          type : 'graph',
          facets : null
        },
        cvterm : {
          id : 0,
          get : 'cv_term',
          cv_id : 0,
          cv_name : '',
          ds : 'species',
          type : 'graph',
          facets : null
        },
        ds : ''
      },
      feature : {
        extraParams : {
          ds : 'species',
          type : 'feature',
          id : 0,
          facets : null
        },
        ds : 'species'
      }
    },expression_library : {
        tree : {
            extraParams : {
              ds : 'expression_library',
              type : 'tree'
            }
          },
          cv : {
            extraParams : {
              ds : 'expression_library',
              type : 'cv',
              id : ''
            },
            ds : 'species'
          },
          graph : {
            vocabulary : {
              id : '',
              get : 'cv',
              ds : 'expression_library',
              type : 'graph',
              facets : null
            },
            cvterm : {
              id : '',
              get : 'cv_term',
              cv_id : 0,
              cv_name : '',
              ds : 'expression_library',
              type : 'graph',
              facets : null
            },
            ds : ''
          },
          feature : {
            extraParams : {
              ds : 'expression_library',
              type : 'feature',
              id : '',
              facets : null
            },
            ds : 'expression_library'
          }
        },
    feature : {
      fasta : {
        ds : 'feature',
        type : 'fasta',
        seqtype : '',
        feature_id : 0
      }
    },
    rawColumns : [{
      dataIndex : 'name',
      text : 'Classification',
      type : 'string',
      flex: 1
    }, {
      dataIndex : 'total',
      text : 'Total',
      type : 'integer',
      flex: 1
    }]
  },
  /**
   * @return
   * [20,120]
   */
  getOnlyIds:function(){
    var ids = this.self.selectedIds,
    selected = [] , id;
    // transform: get the selected ids from config
    if ( ids ){
      for( id in ids ){
    	if (ids[id].dsid){
    		// is expression. what to do?
    		selected.push( ids[id].id );
    	}else{
    		selected.push( ids[id].id );
    	}
      }
    }
    return selected;
  },
  /**
   * @return
   * ['ae0025','B.anynana_head_nosize']
   */
  getIdsText: function(){
    var ids = this.self.selectedIds,
    selected = [] , id;
    // transform: get the selected ids from config
    if ( ids ){
      for( id in ids ){
        selected.push( ids[id].text );
      }
    }
    return selected;
  },
  /**
   * @return
   * '[{"id":"359","type":"library","text":"AE0025"},{"id":"30","type":"library","text":"B.anynana_wing.0-3d_2-10kb"}]'
   */
  getCommaIds:function(){
    var selected = this.getOnlyIds();
    return JSON.stringify( selected ); 
  },
  /*
   * @return
   * { 359: "AE0025",30: "B.anynana_wing.0-3d_2-10kb"}
   */
  getHigherNames:function(){
    var highernames = {}, i, ids = this.self.selectedIds;
    for ( i in  ids ){
      highernames[ ids[i].id ] = ids[i].text; 
    }
    return highernames;
  },
  expression_library_purge:function(data){
      id = data.id || '';
      if ( id ){
    	var justlibrary, match;
        match = id.match(/^(.+)\^(.+)/);
        dsid = match && match[1];
        justlibrary = match && match[2];
        data.library_name = justlibrary;
        data.dsid = dsid;
   //    data.id =justlibrary;
      }
      return data; // is that how to do it?
}
});
