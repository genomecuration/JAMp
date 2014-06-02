Ext.define('CV.model.Dataset' , {
  extend: 'Ext.data.Model',
  fields : ['text', 'id','type','dsid'],
  requires:['CV.config.ChadoViewer'],
  idProperty:'pid'
});