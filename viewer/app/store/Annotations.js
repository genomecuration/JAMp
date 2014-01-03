Ext.define('CV.store.Annotations', {
  requires:['CV.model.Annotation'],
  extend:'Ext.data.Store',
  pageSize: 10,
  model: 'CV.model.Annotation',
  proxy: {
      type: 'ajax',
      reader: {
          type: 'json',
          root: 'topics',
          totalProperty: 'totalCount'
      },
      extraParams:{
        ds:'annotations',
        ids: null
      }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});