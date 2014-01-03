Ext.define('CV.store.GenomeBase', {
  extend:'Ext.data.Store',
  constructor : function(config) {
    var url = CV.config.ChadoViewer.self.drupalBase + CV.config.ChadoViewer.self.genomeviewer.url;
    this.proxy = this.proxy || {};
    Ext.Object.merge(this.proxy, {
        url : url
    });
    this.callParent( arguments );
  }
});