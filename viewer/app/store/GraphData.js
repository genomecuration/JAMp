Ext.define('CV.store.GraphData',{
  extend:'Ext.data.Store',
  model:'CV.model.GraphDatum',
  autoLoad:false,
  proxy:{
    type:'ajax',
    extraParams:{
      ds:'de',
      type:'graphdata',
      deid:null,
      gid:null
    }
  },
  constructor:function(){
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  },
  setExtraParam:function( name , value){
    this.proxy && this.proxy.setExtraParam(name, value);
  }
})
