Ext.define('CV.store.FeatureAnnotations', {
  extend : 'Ext.data.TreeStore',
  proxy : {
    type : 'ajax',
    extraParams : {
      ds : 'feature',
      type : 'annotations',
      feature_id : ''
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
      url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent(arguments);
  }
}); 