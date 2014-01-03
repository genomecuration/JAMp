Ext.define('CV.view.feature.CvTermsGrid', {
  requires:['Ext.grid.feature.Grouping'],
  extend:'Ext.grid.Panel',
  alias:'widget.cvtermsgrid',
  store:'CV.store.FeatureMetadata',
  // removed since load mask is giving issues when the grid is collapsed.
  // consider re doing retry  plugin
  // collapsible:true,
  // collapsed:true,
  split:true,
  /**
   * property that stores group feature instance.
   */
  grpFeature:null,
  title : 'Metadata',
  columnLines:true,
  columns : [{
    text : 'Key',
    dataIndex : 'term',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
  }, {
    text : 'Value',
    dataIndex : 'value',
    flex : 1,
    renderer : function( msg ){
      return '<div style="white-space:normal !important;">'+ msg+'</div>';
    }    
  }],
  initComponent:function(){
    var grp = Ext.create('Ext.grid.feature.Grouping',{   groupHeaderTpl: 'Group: {name} ({rows.length})' });
    Ext.apply(this, {
     plugins:[Ext.create('CV.ux.Retry')],
     features:[grp],
     grpFeature: grp
    });
    this.callParent(arguments); 
  }  
});