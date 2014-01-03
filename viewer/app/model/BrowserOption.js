Ext.define("CV.model.BrowserOption", {
  extend: 'Ext.data.Model',
  fields: [
      {name:'id',mapping: 'linkout_id', type:'integer'},
      {name:'name'},
      {name:'title', mapping:'name'},
      {name: 'description'},
      {name: 'dataset_id'},
      {name: 'type'},
      {name: 'url'},
      {name: 'placeholder'}
  ]
});