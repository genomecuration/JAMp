Ext.define('CV.view.BarChart', {
  extend : 'Ext.chart.Chart',
  alias : 'widget.libraryBar',
  mixins : ['CV.ux.ThresholdFinder'],
  // i18n properties
  bottomAxeTitleText : "Terms",
  leftAxeTitleText : "Count or Percentage",
  menuTitle : 'Bar Chart',
  legend : {
    position : 'right'
  },
  /*
   * this variable is used to control the categories rendered on the panel.
   * If the number of categories are more than maxCategories value, then
   * rendering is prevented and replaced by a mask.
   *
   */
  maxCategories : 50,
  /*
   * list all the title names that need to appear on legend box.
   */
  titles: null,
  onBindStore : function(store) {
    //     var that = this;
    if (store) {
      store.addListener({
        // beforeload: this.loadingOn,
        // load: this.loadingOff,
        // scope: this
      });
    }
  },
  onUnbindStore : function(store) {
    if (store) {
      store.removeListener({
        // beforeload: this.loadingOn,
        // load: this.loadingOff
      });
    }
  },
  autoDestroy : false,
  loadingOn : function() {
    this.setLoading(true);
  },
  
  loadingOff : function() {
    // this.redraw();
    this.setLoading(false);
  },
  
  initComponent : function() {
	  // this is called dozens of times...
    // create y fields
	  
    var yFields = [], i, yField, ids={}, count , prop;
    for( i in this.yField ){
      yField = this.yField[i];
      //yField = this.expression_library_purge(yField);
      count = yField + ' count';
      prop = yField + ' proportion';
      yFields.push( count );
      yFields.push( prop );
      ids [ count ] = yField;
      ids [ prop ] = yField;
    }
    Ext.apply(this, {
      region : 'south',
      height : 400,
      axes : [{
        type : 'Numeric',
        position : 'left',
        // fields : ['2', '68'],
        title : this.leftAxeTitleText,
        grid : true,
        grid: {
            odd: {
                opacity: 1,
                fill: '#ddd',
                stroke: '#bbb',
                'stroke-width': 1
            }
        },
//        maximum : 50,
        adjustMaximumByMajorUnit: 1,
        adjustMinimumByMajorUnit: 1,
        minimum : 0        //,
        // TODO: not implemented in 4.2. ideally if others column number is large, logarithmic scaling should be used.
        //scale:'logarithmic'
      }
      // ,{
        // type : 'Numeric',
        // position : 'right',
        // label : {
          // renderer : Ext.util.Format.numberRenderer('0,0')
        // },
        // title : 'Proportion',
        // grid : false,
        // minimum : 0,
        // maximum : 100
        // // TODO: not implemented in 4.2. ideally if others column number is large, logarithmic scaling should be used.
        // //scale:'logarithmic'
      // }
      , {
        type : 'Category',
        position : 'bottom',
        fields : ['name'],
        title : this.bottomAxeTitleText,
        label : {
          // we do not want to display catergory value
          renderer : function() {
            return '';
          }
        }
      }],
      series : [{
        type : 'column',
        axis : 'left',
        highlight : true,
        showInLegend: true,
        tips : {
          trackMouse : true,
          minWidth: 250,
          fontSize: 11,
          renderer : function(storeItem, item) {
            var len;
            
            this.setTitle(storeItem.get('name') + ' - ' + storeItem.get( item.yField ) +' <br/><i>('+storeItem.get('highername')[item.series.yFieldIds[item.yField]]+')</i>');
            len = (this.title || '' ).length;
            // fontsize is a parameter given at tooltip creation
            this.setWidth( len*this.fontSize/2 );
          }
        },
        label : {
          display : 'insideEnd',
          field : 'left',
          renderer : Ext.util.Format.numberRenderer('0'),
          orientation : 'horizontal',
          'text-anchor' : 'middle'
        },
        xField : 'name',
        yField : yFields,
        libraryId : this.yField,
        yFieldIds : ids,
        title: this.titles,
        listeners : {
          itemclick : function(slice) {
            this.chart.fireEvent('itemclicked', slice.storeItem);
          }
        }
      }
      ]
    });
    // delete this.yField;
    this.addEvents('itemclicked');
    this.callParent(arguments);
  }
}); 
