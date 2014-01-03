Ext.define('CV.view.feature.FeatureAnnotations',{
  extend:'Ext.tree.Panel',
  alias:'widget.featureannotations',
  requires:['CV.store.FeatureAnnotations'],
  title:'Annotations',
  emptyText:'No annotations found',
  expandable:true,
  rootVisible:false,
  collapsed:false,
  bodyStyle:'white-space:normal !important;'
});