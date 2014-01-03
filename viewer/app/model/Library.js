Ext.define('CV.model.Library' , {
  extend: 'Ext.data.Model',
  fields : ['text', 'id','type'],
  requires:['CV.config.ChadoViewer'],
  idProperty:'pid'
});