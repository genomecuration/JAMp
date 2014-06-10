Ext.define('CV.view.GenomeBrowser', {
  extend : 'Ext.panel.Panel',
  alias : 'widget.genomebrowser',
  requires:['CV.store.BrowserOptions','CV.store.GenomeTracks'],
  title: 'Sequence Browser',
  tooltip:'Shows relationship between a gene, transcripts and uniprot hits',
  gheight: 500,
  gwidth: 600,
  canvasXpressPadding:10,
  /**
   * this is the id of canvas div element for this panel.
   */
  canvasId:null,
  canvasData:null,
  canvasOptions:null,
  /**
   * canvasxpress instance
   */
  canvasXpress:null,
  /**
   * store that gets linkouts for this dataset.
   */
  optionsStore: null,
  /**
   * linkout options
   */
  linkoutOptions : null,
  store:'CV.store.GenomeTracks',
  linkOut: true,
  errorMsg:"<b>Error: sequence not provided</b>",
  events:{
    nodeclick:true,
    newoptions:true,
    trackclick:true
  },
  /**
   * canvasxpress options
   */
  options:{
    graphType : 'Genome',
    useFlashIE : true,
    backgroundType : 'gradient',
    colorScheme: "user",
    backgroundGradient1Color : 'rgb(0,183,217)',
    backgroundGradient2Color : 'rgb(4,112,174)',
    oddColor : 'rgb(220,220,220)',
    evenColor : 'rgb(250,250,250)',
    missingDataColor : 'rgb(220,220,220)'
  },
  initComponent : function() {
    var canvasId = this.id + 'GenomeBrowser';
    
    if( typeof( this.store ) == 'string'){
      this.store = Ext.create( this.store, {});
      this.bindStore( this.store );
    }
    
    Ext.apply(this , {
      canvasId: canvasId,
      plugins:[Ext.create('CV.ux.Retry')],
      html: '<canvas id="'+canvasId+'"  width="'+this.getGWidth() +'" height="'+ this.getGHeight() + '" ></canvas>'     
    });
    this.addListener('render', this.renderCanvas, this );
    this.addListener('resize', this.resizeHandler, this );
    this.addListener('newoptions', this.addOptions, this );
    this.optionsStore = Ext.create('CV.store.BrowserOptions',{
      listeners:{
        load:this.createOptions,
        scope: this
      }
    });
    // bo.load();
    this.callParent(arguments);
    // this.height = this.getHeight();
    // this.width = this.getWidth();
  },
  bindStore: function( store ){
    if( store ){
      this.store = store;
      store.addListener('load', this.onload, this );
    }
  },
  /**
   * this function creates linkout datastructure as understood by canvasxpress
   */
  createOptions:function(){
    var options = {}, flag = false;
    this.optionsStore.each(function( item ){
      var option = item.getData();
      options[ option.name ] = option;
      flag = true;
    });
    this.linkoutOptions = options;
    flag? this.fireEvent( 'newoptions' ):null;
  },
  /**
   * add linkout information to already rendered canvasxpress instances
   */
  addOptions:function(){
    if( this.canvasXpress ){
      this.canvasXpress.data.links = this.linkoutOptions;
    }
  },
  updateHtml:function(){
    this.update('<canvas id="'+this.canvasId+'"  width="'+this.getGWidth() +'" height="'+ this.getGHeight() + '" ></canvas>');
  },
  load:function( id ){
    if ( id ){
      this.store.getProxy().setExtraParam('id',id);
      this.store.load();
    }
  },
  onload:function(store , records, success){
    if( success ){
      var record = records[0];
      this.canvasData = record.get('tracks');
      this.canvasOptions = this.options;
      this.loadCanvas();
    }
  },  
  renderCanvas : function() {
    // this.updateSize();  
    // if( this.canvasData && this.canvasData.tracks[0].data[0].sequence ){
      var that = this;
      if( this.canvasData && this.rendered ){
        this.canvasData.links = {};
        this.canvasData.links = this.linkoutOptions ? this.linkoutOptions : {};
        // this.canvasData.links.uniprot = {
          // url: 'http://www.uniprot.org/uniprot/$GENE$',
          // name: 'Uniprot',
          // title: 'Uniprot',
          // icon: 'http://www.uniprot.org/images/logo_small.gif'
        // };
       this.canvasXpress && this.canvasXpress.destroy( this.canvasXpress );
       this.updateHtml();
       this.canvasXpress = new CanvasXpress( this.canvasId , this.canvasData, this.canvasOptions,
         {
           click:function(o, e, t){
             var links=[],link, params, uniprot;
             that.fireEvent( 'nodeclick', o );
             if( o && (o.length == 1) ){
               switch(o[0].type){
                 case 'box': 
                  that.fireEvent( 'trackclick', o[0] );
                  break;
               }
             }
             if( that.linkOut ){
               uniprot = o[0].id;
               for( var name in that.canvasXpress.data.links ){
                 link = that.canvasXpress.data.links[ name ];
                  if ( link.type == o[0].metaname ){
                    params = {};
                    params[ link.placeholder ] = o[0].id;
                    if ( that.isUniprot( uniprot ) ){
                      links.push({
                         source : link.name,
                         params : params
                      });
                    }
                  }
               }
               links.length && t.showLinkDiv(e, links, 'link');
             }
           }
         });
         if( this.canvasOptions.dataset_id ) {
           this.optionsStore.getProxy().setExtraParam('id' , this.canvasOptions.dataset_id );
           this.optionsStore.load();
         } 
      }
  },
  isUniprot:function( name ){
    var matches;
    name = name || '';
    matches = name.match( /^[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]$/ );
    if( matches && matches.length == 1 ){
      return true;
    }
    return false;
  },  
  loadCanvas:function(){
    this.renderCanvas();
  },
  updateSize:function( width , height ){
    var canvas = Ext.get( this.canvasId );
    canvas.setWidth( width );
    canvas.setHeight( height );
  },
  resizeHandler: function ( ) {
    if( this.rendered ){
      var pRight = this.body.getPadding ( 'r'), pBottom = this.body.getPadding('b');
      this.canvasXpress && this.canvasXpress.draw( this.getWidth() - 2*pRight - 2*this.canvasXpressPadding , this.getHeight() - 2*pBottom - 2*this.canvasXpressPadding);
    }
  },
  getGWidth:function(){
    var pRight = this.body?this.body.getPadding ( 'r'):this.canvasXpressPadding;
    return this.gwidth - 2*pRight - 2*this.canvasXpressPadding;
  },
  getGHeight:function(){
    var pBottom = this.body?this.body.getPadding('b'):this.canvasXpressPadding;
    return this.gheight - 2*pBottom - 2*this.canvasXpressPadding;
  }
});
