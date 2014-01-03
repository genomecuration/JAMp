Ext.define('CV.store.Experiments', {
  extend : 'Ext.data.TreeStore',
  autoLoad : false,
  model : 'CV.model.Experiment',
  root : {
    text : 'root',
    hidden : true,
    expanded: true,
    children:[]
  },
  proxy:{
    type : 'ajax',
    extraParams : {
          ds : 'de',
          type : 'experiments',
          view:'tree'
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});