Ext.define('CV.store.Libraries', {
  extend : 'Ext.data.TreeStore',
  autoLoad : false,
  requires:['CV.model.Library'],
  model : 'CV.model.Library',
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