Ext.define('CV.view.feature.NetworkCanvas', {
  extend : 'Ext.panel.Panel',
  requires:['CV.store.NetworkJson'],
  region:'center',
  alias:'widget.networkcanvas',
  width:"100%",
  height:'100%',
  gheight: 500,
  gwidth: 500,
  canvasXpressPadding:10,
  store:'CV.store.NetworkJson',
  title:'Network diagram',
  html:'Please choose a network id from the list on left',
  /**
   * this is the id of canvas div element for this panel.
   */
  canvasId:null,
  canvasData:null,
  canvasOptions:{
    'backgroundGradient1Color': 'rgb(112,179,222)',
    'backgroundGradient2Color': 'rgb(226,236,248)',
    'gradient': true,
    'graphType': 'Network',
    'nodeFontColor': 'rgb(29,34,43)',
    'showAnimation': true
  },
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
  msg: 'creating',
  linkOut: true,
  errorMsg:"<b>Error: sequence not provided</b>",
  events:{
    nodeclick:true,
    networkempty: true
  },
  initComponent : function() {
    var canvasId = this.id + 'networkcanvas';
    if ( typeof( this.store ) == 'string'){
      this.store = Ext.create(this.store , {
        listeners:{
          load:this.createNetwork,
          clear:this.onClear,
          scope:this
        }
      });
      this.store.load();
    }
    Ext.apply(this , {
      canvasId: canvasId
    });
    this.addListener('render', this.renderCanvas, this );
    this.addListener('resize', this.resizeHandler, this );
    this.callParent(arguments);
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
  updateHtml:function(){
    this.update('<canvas id="'+this.canvasId+'"  width="'+this.getGWidth() +'" height="'+ this.getGHeight() + '" ></canvas>');
  },
  renderCanvas : function() {
      var that = this;
      if( this.canvasData  ){
       this.canvasXpress && this.canvasXpress.destroy( this.canvasXpress );
       this.canvasXpress = new CanvasXpress( this.canvasId, this.canvasData, this.canvasOptions ,{
         click:function(o, e, t){
           var id = o.nodes[0]['id'];
           that.fireEvent( 'nodeclick', id );
         }
       });
      }
  },
  loadCanvas:function(){
    this.updateHtml();
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
    return this.getWidth() - 2*pRight - 2*this.canvasXpressPadding;
  },
  getGHeight:function(){
    var pBottom = this.body?this.body.getPadding('b'):this.canvasXpressPadding;
    return this.getHeight() - 2*pBottom - 2*this.canvasXpressPadding;
  },
  createNetwork:function( records ){
    var rec = records.getAt(0), network;
    if ( rec ){
      network = rec.get( 'json' );
      if( network ){
        this.canvasData = JSON.parse( network );
        this.rendered && this.loadCanvas(); 
      } else {
        this.update( "<h3>Network absent or too large/complex to display meaningfully.</h3>");
        this.fireEvent('networkempty');
      }
    }
  },
  clear:function(){
    this.msg = 'clearing';
    this.store.removeAll();
  },
  onClear:function(){
    this.canvasXpress && this.canvasXpress.destroy( this.canvasXpress );
    this.update('');
  }
});
