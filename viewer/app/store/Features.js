Ext.define('CV.store.Features',{
  extend:'Ext.data.Store',
  model:'CV.model.Feature',
  requires:['CV.config.ChadoViewer','CV.ux.StoreUtil','CV.model.Feature'],
  // mixins:['CV.ux.StoreUtil'],
  idProperty:'feature_id',
  autoLoad:false,
  remoteFilter:true,
  remoteSort:true,
  pageSize:1000,
  proxy:{
    // url:CV.config.ChadoViewer.baseUrl,
    type:'ajax',
    extraParams:{
      type:'list',
      view:'feature',
      ds:'feature',
      id:null,
      facets:null
    },
    reader:{
      type:'json',
      root:'data'
    }
  },
  constructor:function(){
    Ext.Object.merge(this.proxy , {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  },
  changeExtraParams:function( extraParams ){
    if( extraParams.feature.extraParams ){
      this.getProxy().extraParams = Ext.clone( extraParams.feature.extraParams );
    }
  }
});
