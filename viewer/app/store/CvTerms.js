Ext.define('CV.store.CvTerms', {
  extend : 'Ext.data.Store',
  model : 'CV.model.CvTerm',
  requires:['CV.config.ChadoViewer','CV.model.CvTerm'],
  autoLoad:false,
  proxy : {
    type : 'ajax',
    reader : {
      type : 'json',
      successProperty : false,
      totalProperty : false
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this, {
      proxy : {
        url : CV.config.ChadoViewer.self.baseUrl,
        type : 'ajax'
      }
    });
    this.callParent( arguments );
  },
  changeExtraParams:function( extraParams ){
    if( extraParams.cv.extraParams ){
      this.getProxy().extraParams = Ext.clone( extraParams.cv.extraParams );
    }
  }
});
