Ext.define('CV.view.FeatureGrid', {
  extend : 'Ext.grid.Panel',
  requires : ['CV.ux.HeaderFilters', 'CV.ux.Retry','CV.store.Features'],
  alias : 'widget.sequencesgrid',
  hideHeaders : false,
  split : true,
  title : 'Transcripts',
  store : 'CV.store.Features',
  columnLines : true,
  initComponent : function() {
    if ( typeof this.store === 'string') {
      this.store = Ext.create(this.store);
    }
    var pagingtoolbar = Ext.create('Ext.toolbar.Paging',{
        store : this.store,
        displayInfo:false,
        inputItemWidth:80
    });
    // this will make paging toolbar update when store records are removed using removeAll function.
    this.store.addListener( 'clear' , pagingtoolbar.onLoad , pagingtoolbar );
    // this.store.on({
      // load:this.retry,
      // scope:this
    // });
    Ext.apply(this, {
      events : ['clearfilter'],
      plugins : [
        Ext.create('CV.ux.Retry',{
          store:this.store
        })
      ],
      bbar : [pagingtoolbar]
    });
    this.callParent(arguments);
  },
  columns : [{
    text : 'Feature id',
    dataIndex : 'feature_id',
    filter : {
      xtype : 'numberfield'
    },
    hidden : true,
    // flex:1,
    // width:100,
    type : 'numeric'
  }, {
    text : 'Name',
    dataIndex : 'name',
    // filter : {
      // xtype : 'textfield'
    // },
    flex : 1,
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        msg = '<a href="#feature/' + record.get('feature_id') + '">' + value + '</a> ';
      }
      return msg;
    }
  } 
  ],
  clear:function(){
    if ( this.store ){
      this.store.removeAll();
    } 
  }
});
