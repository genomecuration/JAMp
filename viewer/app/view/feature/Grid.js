Ext.define('CV.view.feature.Grid', {
  extend : 'Ext.grid.Panel',
  alias : 'widget.featuregrid',
  requires:['CV.store.Features'],
  hideHeaders : false,
  title : 'Features',
  store : 'CV.store.Features',
  columnLines : true,
  requires : ['CV.ux.HeaderFilters','CV.store.Features','Ext.window.MessageBox'],
  // width:'70%',
  emptyText: 'No transcripts found',
  height:250,
  displayInfo:true,
  layout : 'fit',
  initComponent : function() {
    var that = this;
    if ( typeof this.store === 'string') {
      this.store = Ext.create(this.store);
    }
    Ext.apply(this, {
      events:['clearfilter'],
      plugins : [
        // Ext.create('CV.ux.HeaderFilters', {
          // reloadOnChange : false
        // })
        // ,
        Ext.create('CV.ux.Retry',{})
      ],
      bbar : [{
        xtype : 'pagingtoolbar',
        store : this.store,
        displayInfo:true ,
        inputItemWidth:80
      }],
      tbar : [{
        text:'Search',
        tooltip:'Search using transcript identifier', 
        handler:function(){
          Ext.Msg.prompt('Search', 'Please enter a transcript or gene identifier:', function(btn, text){
            if (btn == 'ok' && text){
                // process text value and close...
                that.store.clearFilter(true);
                that.store.filter('name',text);
            }
          });
        }
      },{
        text : 'Clear',
        tooltip:'Clear current transcript or gene selection',
        handler : function(button) {
          var grid = button.up('grid');
          that.store.clearFilter();
          grid.fireEvent('clearfilter');
        }
      }
      ]
    });
    this.callParent(arguments);
  },
  columns : [{
    text : 'Feature id',
    dataIndex : 'feature_id',
    // filter : {
      // xtype : 'numberfield'
    // },
    hidden : true,
    // flex:1
    type : 'numeric'
  }, {
    text : 'Name',
    dataIndex : 'name',
    filter : {
      xtype : 'textfield'
    },
    flex : 1,    
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        msg = '<a href="#feature/' + record.get('feature_id') + '">' + value + '</a> ';
      }
      return msg;
    }
    // type:'string'
  }, {
    text : 'Unique name',
    dataIndex : 'uniquename',
    // filter : {
      // xtype : 'textfield'
    // },
    hidden : true
    // flex:1
    // type:'string'
  }, {
    text : 'Type',
    dataIndex : 'type',
    filter : {
      xtype : 'textfield'
    },
    flex:1
    // type:'string'
  }, {
    text : 'Category/Species',
    dataIndex : 'species',
    filter : {
      xtype : 'textfield'
    },
     flex:1,
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        var filter = [{"id":record.get('organism_id'),"type":"species","text":value}];
        msg = '<a href="#library/' + encodeURI( JSON.stringify(filter)) + '">' + value + '</a> ';
      }
      return msg;
    }
  },{
    text:'Sequence Length',
    flex:1,
    dataIndex:'seqlen',
    sortable:false
  }
  ,{
    text : 'Dataset name',
    dataIndex : 'libraries',
    sortable : false,
    filter : {
      xtype : 'textfield'
    },
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        var filter = [{"id":record.get('library_id'),"type":"library","text":value}];
        msg = '<a href="#library/' + encodeURI( JSON.stringify(filter)) + '" onclick="return false">' + value + '</a> ';
      }
      return '<div style="white-space:normal !important;">'+ msg+'</div>';
    },
    flex : 1
    // type:'string'
  }, {
    text : 'Source feature',
    sortable : false,
    dataIndex : 'srcuniquename',
    filter : {
      xtype : 'textfield'
    },
    flex : 1
    // type:'string'
  }]//,
  // tbar:[{
  // // dock: 'bottom',
  // text: 'Filters Selected',
  // tooltip: 'Display all active filters',
  // handler: function (button) {
  // var grid = button.up('grid'),
  // data = grid.store.filters,
  // i, name, list = [],
  // msg = '';
  // Ext.Msg.alert('Filter Column Values', list.join(','));
  // }
  // },
  // {
  // // dock: 'bottom',
  // text: 'Clear Filters',
  // handler: function (button) {
  // var grid = button.up('grid');
  // grid.store.clearFilter();
  // }
  // }]
}); 
