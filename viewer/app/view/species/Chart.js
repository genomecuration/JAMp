Ext.define('CV.view.species.Chart', {
  extend:'Ext.chart.Chart',
  alias:'widget.speciesBar',
  // i18n properties
  bottomAxeTitleText: "Function summary",
  leftAxeTitleText: "Count",
  onBindStore : function ( store ) {
//     var that = this;
    if ( store ) {
      store.addListener({
       beforeload: this.loadingOn,
       load: this.loadingOff,
        scope: this
      });
    }
  },
  loadingOn: function () {
    this.setLoading( true );
  },
  loadingOff: function () {
    this.setLoading ( false );
  },
  initComponent:function () {
    Ext.apply ( this , {
      region: 'south',
      height:400,
//       id: 'featureBar',
      store : 'CV.store.FeatureCount',
      axes: [{
        type: 'Numeric',
        position: 'left',
        fields: ['count'],
        label: {
            renderer: Ext.util.Format.numberRenderer('0,0')
        },
        title: this.leftAxeTitleText,
        grid: true,
        minimum: 0
      }, {
        type: 'Category',
        position: 'bottom',
        fields: ['name'],
        title: this.bottomAxeTitleText,
        label:{
          // we do not want to display catergory value
          renderer : function() {
            return '';
          }
        }
      }],
      series: [{
        type: 'column',
        axis: 'left',
        highlight: true,
        tips: {
          trackMouse: true,
          width: 140,
          height: 28,
          renderer: function(storeItem, item) {
            this.setTitle(storeItem.get('name') + ': ' + storeItem.get('count'));
          }
        },
        label: {
          display: 'insideEnd',
            field: 'left',
            renderer: Ext.util.Format.numberRenderer('0'),
            orientation: 'horizontal',
            color: '#333',
            'text-anchor': 'middle'
        },
        xField: 'name',
        yField: 'count'
      }]
    });
    this.callParent ( arguments );
  }
});