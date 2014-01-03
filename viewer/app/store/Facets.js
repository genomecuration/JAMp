Ext.define('CV.store.Facets',{
  requires:['CV.model.Facet'],
  extend:'Ext.data.Store',
  model:'CV.model.Facet',
  idProperty:'cvterm_id',
  getFacets:function(){
    var facets=[];
    this.each(function( item ){
      facets.push({property:'cvterm_id',value:item.get('cvterm_id'),'cv_id':item.get('cv_id')});
    });
    return facets;
  }
});
