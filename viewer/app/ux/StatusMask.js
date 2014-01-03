/**
 * Status Mask is used to display important messages on a component. These messages can be
 * * loading status
 * * reload message with appropriate icon and mouse pointer
 * *
 * *
 */
Ext.define('CV.ux.StatusMask', {
  // extend:'Ext.LoadMask',
  requires : ['CV.ux.RetryLoader', 'Ext.data.TreeStore', 'CV.ux.InformationLoader'],
  alias : 'plugin.statusmask',
  owner : null,
  msg : 'loading.. please wait :-)',
  useTargetEl : true,
  msgCls : 'customLoading',
  // success:true,
  // loader:null,
  loadFn : null,
  constructor : function(cfg) {
    if (cfg) {
      Ext.apply(this, cfg);
    }
    this.loadFn = this.store instanceof Ext.data.TreeStore ? this.treeLoad : this.gridLoad;

    this.callParent(arguments);
  },
  init : function(owner) {
    var store = this.store, comp = owner;
    // this.loaderConfig.linkedStore = this.store;
    this.owner = comp;

    this.store && this.store.on({
      beforeload : this.setLoading,
      load : this.loadFn,
      scope : this
    });

    // this.loader = Ext.loader()
    // this.bindComponent( comp );
    /**
     * a short circuit to fix a bug in ext js. collapse hierarchy event will now fire.
     */
    comp.addListener('beforecollapse', function() {
      var pCollapse = this.placeholderCollapse;
      if (this.isPlaceHolderCollapse()) {
        this.placeholderCollapse = function() {
          pCollapse.apply(this, arguments);
          this.getHierarchyState().collapsed = true;
          this.fireHierarchyEvent('collapse');
          this.placeholderCollapse = pCollapse;
        }
      }
    }, comp);

    comp.addListener('beforeexpand', function() {
      var pExpand = this.placeholderExpand;
      if (this.isPlaceHolderCollapse()) {
        this.placeholderExpand = function() {
          pExpand.apply(this, arguments);
          this.afterExpand.apply(this, arguments);
          this.placeholderExpand = pExpand;
        }
      }
    }, comp);

    comp.addListener('beforedestroy', this.beforeDestroy, this);
    // this.callParent( arguments );

    // this.owner = owner;

    // this.bindStore( store );

    // // add events
    // owner.addEvents( {
    // 'hideMask' : true,
    // 'displayMask':true
    // });
    //
    // this.loader = new CV.ux.RetryLoader( owner , this.loaderConfig );
    // this.loader.addListener( 'elementscreated' , this.bindLoader , this );
    // // add listeners to grid
    // owner.on({
    // hideMask:this.hide,
    // displayMask:this.displayMsg,
    // collapse:this.hide,
    // expand:this.displayMsg,
    // scope:this
    // });
    // // this.owner.addListener( 'show' , this.displayMsg , this );
    // // this.owner.on({
    // // // collapse:this.displayMsg,
    // // // // cannot use expand as component is not drawn          .
    // // // expand:this.displayMsg,
    // // // // expand: this.onShow,
    // // // afterrender:this.displayMsg,
    // // scope: this
    // // });
  },
  beforeDestroy : function() {
    if (this.owner) {
      this.store.removeListener('beforeload', this.setLoading, this);
      this.store.removeListener('load', this.loadFn, this);
    }
    this.loader && this.loader.destroy();
    // this.callParent ( arguments );
  },
  setLoading : function() {
    this.loader && this.loader.destroy();
    this.owner && this.owner.setLoading(true);
    this.loader = this.owner.loadMask;
  },
  bindComponent : function(comp) {
    if (!comp) {
      return;
    }
    this.callParent(arguments);
  },
  treeLoad : function(store, records, success, treeSuccess) {
    this.storeLoadMsg(treeSuccess);
  },
  gridLoad : function(store, records, success) {
    this.storeLoadMsg(success);
  },
  storeLoadMsg : function(success) {
    this.success = success;
    this.loader && this.loader.destroy();
    if (!success) {
      // this.loaderConfig.msg = 'Grid loading failed!!';
      this.msg = null;
      this.displayMsg();
    } else {
      this.isEmpty();
    }
  },
  isEmpty : function() {
    var empty = false;
    if (this.store) {
      switch ( this.store instanceof Ext.data.TreeStore ) {
        case true:
          if (!this.store.getRootNode().hasChildNodes()) {
            empty = true;
          }
          break;
        case false:
          if (!this.store.getCount()) {
            empty = true;
          }
          break;
      }
      if (empty) {
        this.msg = 'The data set is empty';
        this.showMsg();
      }
    }
  },
  // retry:function( store , records , success, treeSuccess ){
  // this.success = success;
  // // a hack for tree store. success is the forth param!!!
  // if ( success === null && !treeSuccess){
  // this.success = treeSuccess;
  // }
  // this.displayMsg();
  // },
  showMsg : function() {
    this.loader && this.loader.destroy();
    this.loader = new CV.ux.InformationLoader(this.owner, {
      msg : this.msg,
      useTargetEl : true
    });
    this.loader.show();
  },
  displayMsg : function() {
    var config;
    if (!this.success) {
      config = {};
      config.linkedStore = this.store;
      config.useTargetEl = this.useTargetEl;
      this.msg ? config.msg = this.msg : null;
      this.loader = new CV.ux.RetryLoader(this.owner, config);
      this.loader.show();
    }
  },
  reload : function() {
    this.loader && this.loader.destroy();
    this.owner.store.load();
  },
  hide : function() {
    this.loader && this.loader.hide();
  },
  show : function() {
    this.loader && this.loader.show();
    this.callParent(arguments);
  }//,
  // bindLoader:function(){
  // var el = this.loader.getTargetEl();
  // el && el.on({
  // click:this.reload,
  // scope: this
  // });
  // }
});
