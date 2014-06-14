Ext.define('CV.view.feature.Notes', {
	extend : 'Ext.panel.Panel',
	alias : 'widget.notespanel',
	requires : [ 'CV.store.Notes' ],
	store : 'CV.store.Notes',
	title : 'Notes',
	layout : 'fit',
	emptyText : 'No notes found',
	tooltip : 'Any notes that may have been saved for this gene',
	initComponent : function() {
		if (typeof (this.store) == 'string') {
			this.store = Ext.create(this.store, {});
			this.store.load();
			this.bindStore(this.store);
		}
		this.callParent(arguments);
	},
	bindStore : function(store) {
		var that = this;
		store = store || this.store;
		if (store) {
			store.addListener('load', function(store, records, success) {
				if (success) {
					if (records.length > 0) {
						var text = '<h3>Notes from community</h3><ul>';
						for (index = 0; index < records.length; ++index) {
							text += '<li>' + records[index].get('note')
									+ '</li>';
						}
						text += '</ul>'
						that.update(text);
					}
				}
				that.setLoading(false);
			}, this);
			store.addListener('clear', this.onClear, this);
		}
	},
	onClear : function() {
		this.update('');
	}
});