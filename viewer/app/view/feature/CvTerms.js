Ext.define('CV.view.feature.CvTerms', {
  extend:'Ext.grid.Panel',
  alias:'widget.cvterms',
  store:'CV.store.FeatureCvTerms',
  split:true,
  title : 'Expression data',
  columnLines:true,
  columns : [{
    text : 'Name',
    dataIndex : 'term',
    flex : 1,
  }, {
    text : 'Value',
    dataIndex : 'value',
    flex : 1,
  }],
  initComponent:function(){
	  if(typeof ( this.store ) == 'string'){
	      this.store = Ext.create(this.store,{});
	      this.store.load();
	    }
	  
	 this.callParent(arguments); 
  }  
});