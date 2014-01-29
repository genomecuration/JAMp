Ext.define('CV.view.PieChart', {
  extend:'Ext.chart.Chart',
  alias:'widget.pieview',
  mixins:['CV.ux.ThresholdFinder'],
  menuTitle : 'Pie Chart',
  animate : true,
  theme : 'Base:gradients',
  height : 400,
  width : 600,
  countField:'total',
  legend : {
    position : 'left'
  },
  initComponent: function(){
  /*
   * this event is fired when a slice is clicked.
   * @@parameter
   * @storeItem
   * model instance of the slice clicked
   */
    this.addEvents('itemclicked');
    this.callParent( arguments );
  },
  // events:[
  // /*
   // * this event is fired when a slice is clicked.
   // * @@parameter
   // * @storeItem
   // * model instance of the slice clicked
   // */
    // 'click'
  // ],
    // autoRender:true,
  overflowY:'auto',
    /*
   * this variable is used to control the categories rendered on the panel. 
   * If the number of categories are more than maxCategories value, then 
   * rendering is prevented and replaced by a mask.
   * 
   */
  maxCategories:10,
  series : [{
    type : 'pie',
    field : 'total',
    showInLegend : true,
    tips : {
      trackMouse : true,
      // minWidth: 250,
      fontSize: 11,
      renderer : function(storeItem, item) {
        var len;
        this.setTitle(storeItem.get('name') + ' : ' + storeItem.get(item.series.field));
        len = (this.title || '' ).length;
        // fontsize is a parameter given at tooltip creation
        this.setWidth( len*this.fontSize );
      }
    },
    highlight : {
      segment : {
        margin : 20
      }
    },
    listeners:{
      itemclick:function( slice ){
        this.chart.fireEvent('itemclicked', slice.storeItem);
      }
    }    
  }]
});