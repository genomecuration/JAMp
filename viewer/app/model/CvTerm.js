Ext.define('CV.model.CvTerm',{
  extend: 'Ext.data.Model',
  requires:['CV.config.ChadoViewer'],
  fields : [
    "dsid",
    "term",
    "vocabulary",
    "value",
    "selection",
    'gr'
  ]
});