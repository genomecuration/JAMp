Ext.define('CV.store.Expression', {
  extend:'Ext.data.Store',
//AP if we want to move into model
  fields:[{
	  name: 'transcript_uname', type: 'string',
	  name: 'timeloaded', type: 'string',
	  name: 'type', type: 'string',
	  name: 'imageData', type: 'string'
		  }],
  autoLoad:false,
  proxy: {
      type: 'ajax',
      extraParams:{
          ds : 'picture',
          type : 'expression',
          image_id : null,
          dataset_id : null
      }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  },
});
