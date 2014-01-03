Ext.define('CV.model.Experiment' , {
  extend: 'Ext.data.Model',
  fields : ['text', 'pid','type','gid'],
  requires:['CV.config.ChadoViewer']//,
  // idProperty:'pid'
});