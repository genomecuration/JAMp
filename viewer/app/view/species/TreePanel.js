Ext.define( 'CV.view.species.TreePanel' , {
  extend:'Ext.tree.Panel',
  alias:'widget.speciesTree',
  title: 'Species List',
  store: 'CV.store.SpeciesTree',
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