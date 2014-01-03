Ext.define('CV.store.Networks',{
  extend : 'Ext.data.TreeStore',
  fields:['text','networkid'],
  proxy : {
    type : 'ajax',
    extraParams : {
      ds : 'feature',
      type : 'network',
      feature_id : ''
    }
  },
  autoLoad:true,
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
      url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent(arguments);
  }
});
