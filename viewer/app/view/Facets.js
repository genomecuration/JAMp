Ext.define('CV.view.Facets',{
  extend:'Ext.grid.Panel',
  alias:'widget.facetsgrid',
  requires:['CV.store.Facets'],
  title:'Facets',
  collapsed:false,
  collapsible:true,
  height:'50%', 
  // width:300,
  region:'east',
  store:'CV.store.Facets',
  columns:[
  {
    text:'Name',
    dataIndex:'name',
    flex:3
  },{
        xtype:'actioncolumn',
        text:'Action',
        flex:1,
        // width:25,
        align:'center',
        items: [{
            icon: 'css/images/delete.png', 
            tooltip: 'Delete',
            handler: function(grid, rowIndex, colIndex) {
                grid.getStore().removeAt(rowIndex);
            }
        }]
    }
  /**
   * removed since it was not possible to get value for this field. this happened after moving the facet event handler to controller from dsview.
   */
  // ,{
    // text:'Vocabulary',
    // dataIndex:'cv',
    // flex:1
  // }
  ]
});
