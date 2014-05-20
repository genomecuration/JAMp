Ext.define('CV.view.MetaData', {
  extend : 'Ext.grid.Panel',
  alias : 'widget.metadatapanel',
  title : 'Metadata',
  region : 'center',
  columnLines: true,
  tooltip:'Metadata of selected library or species',
  // height : 400,
  store : 'CV.store.CvTerms',
  columns : [{
    text : 'Vocabulary',
    dataIndex : "vocabulary",
    type : 'string',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
  }, {
    text : 'Term',
    dataIndex : "term",
    type : 'string',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
    },{
    text : 'Selection',
    dataIndex : "selection",
    type : 'string',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
  }],
  constructor:function(){
    var store = this.store ;
    if ( Ext.isString(store) ) {
      store = this.store = Ext.create( store );
    }
    // else if ( !store || Ext.isObject ( store )){
//       
    // }
    Ext.Object.merge( this.store.proxy , {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  },  
  afterRender : function() {
    var owner = this.up('dsview'), 
      proxy = this.store.getProxy();
    Ext.Object.merge( this.store.proxy , {
      extraParams : owner.dsConfig.cv.extraParams
    });
    this.callParent( arguments );
    // proxy.buildUrl( CV.config.ChadoViewer.baseUrl );
    // Ext.apply( proxy , {
      // proxy : {
        // extraParams : Ext.clone( owner.dsConfig.cv.extraParams )
      // }
    // });
    // this.store.setProxy({
// 
      // extraParams : Ext.clone( owner.dsConfig.cv.extraParams ),
    // });
  },
  // for filter
  // features: Ext.create ( 'Ext.ux.grid.FiltersFeature' , {
  // encode: true,
  // local: true,
  // filters: [Ext.create ( 'Ext.ux.grid.filter.NumericFilter', {
  // dataIndex: 'library_id'
  // })/*,{
  // type:'string',
  // dataIndex:'library_name'
  // }*/]
  // }),

  // facilitates interaction between tree and grid though controller
  filter : function(id, value) {
    if (!this.features || !id) {
      return;
    }
    var features = this.features[0], filter, hash = {};

    filter = this.filters.getFilter(id);
    if (!filter) {
      features.createFilters();
      filter = this.filters.getFilter(id);
      if (!filter) {
        return;
      }
    }
    hash['eq'] = value;
    filter.setValue(hash);
    filter.setActive(true);
  },
  clear : function() {
    this.store.removeAll();
  }
}); 