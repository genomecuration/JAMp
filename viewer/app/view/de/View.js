Ext.define('CV.view.de.View',{
  extend:'Ext.container.Container',
  alias:'widget.deview',
  requires:['CV.view.de.ExperimentPanel','CV.view.GenomeBrowser','CV.view.de.Chosen'],
  height:'100%',
  width:'100%',
  layout:'border',
  store:'CV.store.GraphData',
  items:[{
    xtype:'experimentpanel',
    region:'west'
  }
  ,{
    xtype:'genomebrowser',
    region:'center',
    title:'Graphics'
  },{
    xtype : 'chosenpanel',
    region : 'east',
    title : 'Chosen points'
  }
  ],
  events:[
  /**
   * fired when canvas express should be rendered.
   */
    'drawcanvas'
  ],
  
  /**
   * configs needed for plotting canvasXpress
   */
  canvasData : null,
  canvasOptions : null,
  
  initComponent:function(){
    this.listeners= {
      drawcanvas:this.renderHeatmap,
      scope:this
    };
    if( typeof (this.store) =='string' ){
      this.store = Ext.create(this.store);
    }
    this.store.addListener('load', this.processRecords , this);
    this.callParent( arguments );
  },
  processRecords:function( store , data , success ){
    if( success ) {
      var record = data[0];
      if(record){
        this.canvasData = record.get('datapoints');
        this.canvasOptions = record.get('config');
        this.fireEvent('drawcanvas');
      }
    }
  },
  renderHeatmap:function( store, data , success ){
    var gb = this.down('genomebrowser');
      if( this.canvasData && this.canvasOptions ){
        gb.canvasData = this.canvasData;
        gb.canvasOptions = this.canvasOptions;
        gb.loadCanvas();
      }
  }
});
