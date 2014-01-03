/**
 * The store used for feature
 */
Ext.define('CV.store.SpeciesTree', {
  extend : 'Ext.data.TreeStore',
  requires : ['CV.config.ChadoViewer'],
  fields : ['text', 'organism_id'],
  autoLoad : true,
  proxy : {
    url : CV.config.ChadoViewer.self.baseUrl,
    type : 'ajax',
    reader : 'json',
    extraParams : {
      type : 'tree',
      ds : 'species'
    }
  },
  root : {
    text : 'Species',
    expanded : true
  }
}); 