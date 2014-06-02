Ext.define('CV.view.feature.DbXrefs', {
  requires:['Ext.grid.feature.Grouping'],
  extend:'Ext.grid.Panel',
  alias:'widget.dbxrefs',
  store:'CV.store.FeatureMetadata',
  split:true,
  /**
   * property that stores group feature instance.
   */
  grpFeature:null,
  title : 'Cross-references',
  columnLines:true,
  columns : [{
    text : 'Database',
    dataIndex : 'term',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
  }, {
    text : 'Accession',
    dataIndex : 'value',
    flex : 1,
    renderer : function( msg ){
      return '<div style="white-space:normal !important;">'+ msg+'</div>';
    }    
  }],
  initComponent:function(){
	var grp = Ext.create('Ext.grid.feature.Grouping',{   groupHeaderTpl: 'Links: {name} ({rows.length})' });
    Ext.apply(this, {
     plugins:[Ext.create('CV.ux.Retry')],
     features:[grp],
     grpFeature: grp
    });
    this.callParent(arguments); 
    //AP. will this work always or give issues as noted by temi above?
    this.grpFeature.startCollapsed = true;
  }  
});