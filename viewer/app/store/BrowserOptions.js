Ext.define('CV.store.BrowserOptions', {
  requires:['CV.model.BrowserOption'],
  extend:'Ext.data.Store',
  pageSize: 10,
  model: 'CV.model.BrowserOption',
  proxy: {
      type: 'ajax',
      extraParams:{
        type:'config',
        id:null
      }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.genomeviewer.url
    });
    this.callParent( arguments );
  }
});