Ext.define( 'CV.view.Tree' , {
  extend:'Ext.tree.Panel',
  alias:'widget.dstree',
  requires:['CV.store.Datasets'],
  title: 'Catalogue',
  store:'CV.store.Datasets',
  collapsible : true,
  closeable : true,
  selModel:{
    mode:'MULTI'
  },
  split: true,
  // loading message
  // viewConfig:{
    // loadMask:true
  // },
//   store : treeStore,
  region : 'west',
  width:250,
  height:500,
  rootVisible : false,
  expandable:true,
  constructor:function(){
    if( typeof this.store === 'string' ) {
      this.store = Ext.create( this.store );
    }
    // add plugin
    this.callParent( arguments );
  },
  initComponent:function(){
    this.addPlugin(Ext.create('CV.ux.Retry',{
      owner: this,
      store: this.store
    }));
    
    this.callParent( arguments );
  },
  afterRender:function (  ) {
    Ext.Object.merge(this.store.proxy , {
      extraParams : this.ownerCt.dsConfig.tree.extraParams
    });
    this.store.load();
    this.callParent( arguments );
  },
  clear:function(){
    this.getSelectionModel().deselectAll();
  }
});