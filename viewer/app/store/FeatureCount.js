/**
 * The store used for feature
 */
Ext.define('CV.store.FeatureCount', {
    extend: 'Ext.data.Store',
    requires:['CV.config.ChadoViewer'],
    // fields:[],
    // fields:[
    // // {
    	// // name: 'id',
    	// // type: 'integer'
    // // },
    // {
      // name: 'cvterm_id',
      // type: 'integer'
    // },
      // {
        // name:'name' ,
        // type: 'string'
      // },{
        // name: 'total',
        // type: 'integer'
      // },{
        // name: 'c2',
        // type: 'integer'
      // },{
        // name: 'c75',
        // type: 'integer'
      // }
    // ],
    constructor:function( config ){
      Ext.apply( this , config );
      this.addEvents({
        beforedestroy:true
      });
      this.proxy.model = undefined;
      this.callParent( arguments );
    },
    idProperty: 'cvterm_id',
    autoLoad: false,
    autoDestroy:true,
    proxy : {
      url: null,
      extraParams:{
        id:0,
        get:'cv_term',
        cv_id:0,
        filters:undefined,
        facets:undefined
      },
      type:'ajax',
      reader: 'json'
    }//,
    // remoteFilter:true
    // constructor : function ( cfg ){
      // this.proxy ={
      // url: CV.config.CV.baseUrl,
      // extraParams:{
        // id:0,
        // get:'cv_term',
        // cv_id:0
      // },
      // type:'ajax',
      // reader: 'json'
    // };
    // this.initConfig ( cfg );
    // this.callParent( cfg );
    // return this;
  // }
});
