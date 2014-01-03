Ext.define('CV.view.RawData', {
  extend:'Ext.grid.Panel',
  alias:'widget.rawdatapanel',
  menuTitle : 'Raw data',
  requires : ['CV.ux.HeaderFilters'],
    /*
   * this variable is used to control the categories rendered on the panel. 
   * If the number of categories are more than maxCategories value, then 
   * rendering is prevented and replaced by a mask.
   * 
   */
  maxCategories:Number.MAX_VALUE,
  viewConfig:{
    /**
     * since chadopanel has a loading mask showing.
     */
     loadMask:false 
  },
  columnLines: true,
  // plugins: 'bufferedrenderer',
  columns : [],
  setThreshold:function( chadopanel ){
    chadopanel.setThreshold( 1 );
  },
  listeners:{
    // render:function(){
    // },
    // beforerender:function(){
//       
    // }
  },
  initComponent:function(){
    // Ext.apply(this,{
      // plugins : [
        // Ext.create('CV.ux.HeaderFilters', {
          // reloadOnChange : false
        // })]
    // });
    this.callParent( this );
  }
});