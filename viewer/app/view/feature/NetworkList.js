Ext.define('CV.view.feature.NetworkList',{
  extend:'Ext.tree.Panel',
  requires:['CV.store.Networks'],
  alias:'widget.networklist',
  store:'CV.store.Networks',
  region:'west',
  split:true,
  width:200,
  height:'100%',
  rootVisible:false,
  collapsed:false,
  collapsible:true,
  expandable:true,
  title:'Available networks',
  emptyText:'No networks found',
  initComponent:function(  ){
    if(typeof ( this.store ) == 'string'){
      this.store = Ext.create(this.store,{});
      this.store.load();
    }
    this.callParent( arguments );
  }
});
