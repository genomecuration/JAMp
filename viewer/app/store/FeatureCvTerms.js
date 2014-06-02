Ext.define('CV.store.FeatureCvTerms', {
  extend : 'Ext.data.Store',
  fields : ["term","value"],
  requires:['CV.config.ChadoViewer'],
  autoLoad:false,
  proxy : {
    type : 'ajax',
    extraParams:{
      ds:'feature',
      type:'expression_data',
      feature_id:0
    },
  },
  constructor:function(){
    Ext.Object.merge(this.proxy , {
      url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});
