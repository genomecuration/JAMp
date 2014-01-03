Ext.define('CV.ux.StoreUtil',{
  changeExtraParams:function( extraParams ){
    if( extraParams ){
      this.getProxy().extraParams = Ext.clone( extraParams );
    }
  }
});
