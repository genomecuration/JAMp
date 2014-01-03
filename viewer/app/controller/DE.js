Ext.define('CV.controller.DE', {
  extend : 'Ext.app.Controller',
  requires:['CV.config.ChadoViewer','CV.view.de.View','CV.ux.Router'],
  views : ['CV.view.de.View'],
  refs:[{
    ref : 'DE',
    selector : 'deview'
  },{
    ref:'Chosen',
    selector: 'chosenpanel'
  },{
    ref : 'CX',
    selector : 'genomebrowser'
  }],
  // config
  name:'DE',
  uri : 'de',
  text:'DE',
  /**
   * configs used by controller
   */
  /**
   * store instance having the graph datapoints
   */
  graphStore:null,
  
  init : function() {
    var treeView, gridView;
    gridView = Ext.create('CV.view.de.View');
    gridView.show();
    this.control({
       'viewport > radiogroup > button[name=DE]' : {
        render : this.headerInit,
        scope : this
      },
      'experimentpanel':{
        selectionchange:this.loadStore,
        scope:this
      },
      'deview':{
        afterrender : this.linkStore,
        scope: this
      },
      'deview genomebrowser':{
        nodeclick : this.addNode,
        scope: this
      }
      ,'deview grid':{
          selectionchange:function(rm , records){
            var i,j,k, cx ,selections , count = 0, record;
            for ( j in CanvasXpress.references ){
              selections = [];
              cx = CanvasXpress.references[j];
              for ( i in cx.data.y.vars ){
                for( k in records ){
                  record = records[k];
                  if( cx.data.y.vars[i] == record.get('Checksum')){
                    selections[i] = true;
                    count ++;
                  }
                }
              }
              if( count ){
                cx.selectDataPoint = selections;
                cx.isSelectDataPoints = count;
                cx.draw();
              }
            }
          }
        }
    });
  },
  /**
   * this config is used to store the button connected to this controller. In this case library. It can later be used to toggle button during render at init.
   */
  header : undefined,
  headerInit : function(btn) {
    this.header = btn;
  },
  show : function(params) {
    var view = this.getDE();
    this.render( view );
  },
  linkStore:function( deview ){
    this.graphStore = deview.store;
  },
  loadStore:function( store , selected){
    if( this.graphStore ){
      selected = selected[0];
      var gid = selected.get('gid')||1, deid = selected.get('pid')||1;
      this.graphStore.setExtraParam('pid', deid);
      this.graphStore.setExtraParam('gid', gid);
      this.graphStore.load(); 
    }
  },
  addNode:function( point ){
    var chosen = this.getChosen(), name = point.z.aliases[0], selections = [], cx ;
    chosen && chosen.store.loadData( [{ name : name }], true);    
    chosen.store.each(function( rec ){
      selections.push( rec.get('name') );
    });
    cx = this.getCX().canvasXpress;
    if( selections.length ){
      cx.selectDataPoint = selections;
      cx.isSelectDataPoints = selections.length;
      cx.draw();
    }
  }
}); 