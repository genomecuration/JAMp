Ext.define('CV.view.feature.ExpressionList',{
  extend:'Ext.tree.Panel',
  requires:['CV.store.ExpressionImageList'],
  alias:'widget.expressionlist',
  store:'CV.store.ExpressionImageList',
  region:'west',
  split:true,
  width:200,
  height:'100%',
  rootVisible:false,
  collapsed:false,
  collapsible:true,
  expandable:true,
  title:'Available images',
  emptyText:'No Expression images found',
  initComponent:function(  ){
    if(typeof ( this.store ) == 'string'){
      this.store = Ext.create(this.store,{});
      this.store.load();
    }
    this.callParent( arguments );
  }
});
