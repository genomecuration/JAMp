Ext.define('CV.ux.Retry',{
  requires:['CV.ux.RetryLoader'],
  ptype : 'retry',
  owner : null,
  success:true,
  loader:null,
  messages:{
    401:{
      msgCls:'retry',
      msg:'Unauthorized access',
      useTargetEl:true
    },
    'default':{
      msgCls:'customLoading',
      msg:'Loading was unsuccessful. Tap here to retry.',
      useTargetEl:true
    }
  },
  loaderConfig: {
    // autoShow: true,
    msgCls:'customLoading',
    msg:'Loading was unsuccessful. Tap here to retry.',
    useTargetEl:true
  },
  constructor: function( cfg ){
   if(cfg){
    Ext.apply(this,cfg);
   }
  },
  init:function( owner ){
    var store = owner.store;
    this.owner = owner;
    
    // add events
    owner.addEvents( {
     'hideMask' : true,
     'displayMask':true
    });
    
    store && store.on({
      load:this.loadHide,
      scope: this
    });
    store && store.getProxy().on({
      exception:this.onException,
      scope: this
    });
    this.loader = new CV.ux.RetryLoader( owner , this.loaderConfig );
    this.loader.addListener( 'elementscreated' , this.bindLoader , this );
    // add listeners to grid
    owner.on({
      hideMask:this.hide,
      displayMask:this.displayMsg,
      collapse:this.hide,
      expand:this.displayMsg,
      scope:this
    });
  },
  onException:function( proxy, except, operation){
    var resp;
    switch( except.status ){
      case 401:
        this.loaderConfig = this.messages['401'];
      break;
      default: 
        this.loaderConfig = this.messages['default'];
    }
    this.success = false;
    this.displayMsg();
  },
  loadHide:function( store , records , success, treeSuccess ){
    this.success = success;
    // a hack for tree store. success is the forth param!!!
    if ( success === null && !treeSuccess){
      this.success = treeSuccess;
    }
    if( this.success ){
      this.hide();
    }
  },
  displayMsg:function(){
    if( !this.success ){
      this.loader = this.owner.setLoading( this.loaderConfig );
      this.loader && this.bindLoader();
    } else {
      this.owner.setLoading(false);
    }
  },  
  reload:function(){
    this.loader && this.loader.hide();
    this.owner.store.load();
  },
  hide:function(){
    this.loader && this.loader.hide();
  },
  show:function(){
   this.loader && this.loader.show();
  },
  bindLoader:function(){
    // this.loader.show();
    var el = this.loader.getTargetEl();
    el && el.on({
       click:this.reload,
       scope: this
    });
  }
});
