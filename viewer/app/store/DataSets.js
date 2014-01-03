Ext.define('CV.store.DataSets', {
  extend:'Ext.data.Store',
  autoLoad : true,
  model:'CV.model.DataSet',
  root : {
    text : 'ds'
  }
});