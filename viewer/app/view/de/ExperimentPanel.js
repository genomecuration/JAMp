Ext.define( 'CV.view.de.ExperimentPanel' , {
  extend:'Ext.tree.Panel',
  alias:'widget.experimentpanel',
  title: 'Experiments',
  store:'CV.store.Experiments',
  collapsible : true,
  closeable : true,
  // selModel:{
    // mode:'MULTI'
  // },
  // loading message
  // viewConfig:{
    // loadMask:true
  // },
//   store : treeStore,
  region : 'west',
  width:250,
  height:"100%",
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
    this.addPlugin({
      ptype:'statusmask',
      owner: this,
      store: this.store
    });
    
    this.callParent( arguments );
  },
  afterRender:function (  ) {
    // Ext.Object.merge(this.store.proxy , {
      // extraParams : this.ownerCt.dsConfig.tree.extraParams
    // });
    this.store.load();
    this.callParent( arguments );
  },
  clear:function(){
    this.getSelectionModel().deselectAll();
  }
});