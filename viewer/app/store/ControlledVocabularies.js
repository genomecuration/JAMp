Ext.define( 'CV.store.ControlledVocabularies' , {
  extend:'Ext.data.Store',
  requires:['CV.config.ChadoViewer','CV.model.ControlledVocabulary'],
  model:'CV.model.ControlledVocabulary',
  proxy :  {
    type: 'ajax',
    reader: {
      type: 'json'
    },
    extraParams:{
      filters:null,
      facets:null
    }
  },
  constructor:function(){
    Ext.Object.merge(this , {proxy:{
      url : CV.config.ChadoViewer.self.baseUrl
    }});
    this.callParent( arguments );
  },
  changeExtraParams:function( extraParams ){
    if( extraParams.graph.vocabulary ){
      this.getProxy().extraParams = Ext.clone( extraParams.graph.vocabulary );
    }
  }
})
