Ext.define('CV.store.Depoints',{
  requires:['CV.model.Depoint'],
  extend:'Ext.data.Store',
  model:'CV.model.Depoint',
  constructor:function(){
    // Ext.Object.merge(this.proxy, {
        // url : CV.config.ChadoViewer.self.baseUrl
    // });
    this.callParent( arguments );
  }//,
  // setExtraParam:function( name , value){
    // this.proxy && this.proxy.setExtraParam(name, value);
  // }
})
