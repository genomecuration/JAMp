Ext.define('CV.store.NetworkJson', {
  extend:'Ext.data.Store',
  pageSize: 10,
  fields:['network_id','json'],
  proxy: {
      type: 'ajax',
      extraParams:{
        type:'networkjson',
        ds : 'feature',
        network_id:null,
        dataset_id:null
      }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});