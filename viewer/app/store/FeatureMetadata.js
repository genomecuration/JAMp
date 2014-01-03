Ext.define('CV.store.FeatureMetadata', {
  extend : 'Ext.data.Store',
  model : 'CV.model.CvTerm',
  requires:['CV.config.ChadoViewer','CV.model.CvTerm'],
  autoLoad:false,
  groupField:'gr',
  proxy : {
    type : 'ajax',
    extraParams:{
      ds:'feature',
      type:'cv',
      feature_id:0
    },
    reader : {
      type : 'json',
      root : 'root',
      successProperty : false,
      totalProperty : false
    }
  },
  constructor:function(){
    Ext.Object.merge(this.proxy , {
      url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});
