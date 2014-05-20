Ext.define('CV.store.ExpressionImageList',{
  extend : 'Ext.data.TreeStore',
  fields:['id','type','format','expressionid','text'],
  proxy : {
    type : 'ajax',
    extraParams : {
      ds : 'feature',
      type : 'expression',
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
