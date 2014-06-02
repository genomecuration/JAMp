Ext.define('CV.store.Datasets', {
  extend : 'Ext.data.TreeStore',
  autoLoad : false,
  requires:['CV.model.Dataset'],
  model : 'CV.model.Dataset',
  root : {
    text : 'root',
    hidden : true,
    expanded: true,
    children:[]
  },
  proxy:{
    type : 'ajax',
    extraParams : {
          ds : 'library',
          type : 'tree'
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
}); 