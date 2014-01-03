Ext.define('CV.view.library.RawData', {
  extend:'Ext.grid.Panel',
  title : 'Raw data',
  columns : [{
    text : 'name',
    dataIndex : 'name',
    flex : 1
  }, {
    text : 'count',
    dataIndex : 'count',
    flex : 1
  }]
})