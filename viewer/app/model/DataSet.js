Ext.define('CV.model.DataSet' , {
  extend: 'Ext.data.TreeStore',
  requires:['CV.config.ChadoViewer'],
  fields : ['text', 'id'],
  constructor: function ( cfg ){
    this.proxy = {
      url : CV.config.CV.getBaseUrl(),
      // extraParams: CV.config.CV.getLibrary().tree.extraParams,
      type : 'ajax'
    };
    this.initConfig ( cfg );
  }
});