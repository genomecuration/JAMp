Ext.define('CV.view.feature.Fasta',{
  extend:'Ext.panel.Panel',
  alias:'widget.fastacontainer',
  requires:['CV.store.Fasta'],
  // region:'east',
  title:'Sequence',
  // url to get the fasta file from
  url:null,
  layout:'fit',
  downloadId : 'downloadFasta',
  store: 'CV.store.Fasta',
  // extra params to sent to the server
  extraParams:null,
  /**
   * feature id 
   */
  feature_id : null,
  initComponent:function (){
    this.url = CV.config.ChadoViewer.self.baseUrl;
    this.extraParams = CV.config.ChadoViewer.self.feature.fasta;
    this.get();
    if( typeof ( this.store ) =='string' ){
      this.store = Ext.create(this.store, {});
      this.bindStore( this.store );
    }
    Ext.apply( this , {
      plugins:[Ext.create('CV.ux.Retry')],
      bbar:[{
        xtype: 'box',
        id:this.downloadId,
        autoEl: {tag: 'a', href: this.getQueryString() , html: 'Download'},
        listeners:{
          boxready:this.setDownload,
          scope:this
        }
      }]
    });

    
    this.callParent( arguments );
  },
  
  getQueryString :function() {
    return this.url + '?text=plain&' + Ext.Object.toQueryString( this.store.getProxy().extraParams );
  },
  setDownload:function () {
    var download = Ext.get( this.downloadId );
    download && download.set({ href: this.getQueryString() });
  },
  get:function(){
    if ( this.extraParams.feature_id ){
      Ext.Ajax.request({
        url: this.url ,
        params: this.extraParams,
        success:function( resp ){
          var fasta = resp.responseText;
          this.setFasta( fasta );
        },
        scope:this
      });
    }
  },
  setFasta:function( fasta ){
    this.update( '<pre>'+fasta+'</pre>' );
  },
  load:function( id , gCode ){
    var store = this.store;
    this.feature_id = id;
    
    id && store.getProxy().setExtraParam( 'feature_id', id );
    gCode && store.getProxy().setExtraParam( 'geneticCode', gCode );
    this.setLoading( true );
    store.load();
    this.setDownload();
  },
  getFeature:function( ){
    return this.extraParams.feature_id;
  },
  bindStore:function( store ){
    var that = this;
    store = store || this.store;
    if( store ){
      store.addListener( 'load', function( store, records, success ){
        if( success ){
          var record = records[0];
          that.setFasta( record.get( 'fasta' ) );
        }
        that.setLoading( false );
      }, this );
      store.addListener( 'clear', this.onClear, this );
    }
  },
  onClear: function(  ){
    this.update('');
  }
});