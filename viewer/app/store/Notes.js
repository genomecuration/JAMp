Ext.define('CV.store.Notes', {
	extend : 'Ext.data.Store',
	requires : [ 'CV.config.ChadoViewer' ],
	fields : [ 'note' ],
	autoLoad : false,
	proxy : {
		type : 'ajax',
		extraParams : {
			type : 'note',
			ds : 'feature',
			feature_id : 0
		}
	},
	constructor : function(config) {
		Ext.Object.merge(this.proxy, {
			url : CV.config.ChadoViewer.self.baseUrl
		});
		this.callParent(arguments);
	}
});