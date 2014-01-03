Ext.define('CV.store.Base', {
  extend:'Ext.data.Store',
  constructor : function(config) {
    this.proxy = this.proxy || {};
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});