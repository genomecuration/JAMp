Ext.define( 'CV.view.library.Tree' , {
  extend:'Ext.tree.Panel',
  alias:'widget.libraryTree',
  title: 'Library Tree',
//   store : treeStore,
  region : 'west',
  width:400,
  rootVisible : true,
  initComponent:function (  ) {
    this.callParent( arguments );
  },
  clear:function(){
    this.store.getSelectionModel().deselectAll();
  }
});