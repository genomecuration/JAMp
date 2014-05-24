Ext.define('CV.controller.Species', {
  extend: 'Ext.app.Controller',
//   viewport : null,
  views:['CV.view.species.View'],
//   models: [],
  name:'Species',
  uri:'species',
  stores : ['CV.store.FeatureCount','CV.store.Facets','CV.store.CvTerms','CV.store.Features'],
  requires:['CV.config.ChadoViewer','CV.store.Features','CV.store.FeatureCount','CV.store.Facets','CV.store.CvTerms','CV.view.species.View'],
  refs:[{
    ref: 'sp',
    selector: 'speciesview',
    autoCreate: true
  },{
    ref: 'sequencesGrid',
    selector: 'speciesview sequencesgrid',
    autoCreate: true
  },{
    ref:'treePanel',
    selector:'speciesview treepanel'
  },{
    ref:'graphPanel',
    selector :'speciesview tabpanel'    
  },{
    ref : 'metadataPanel',
    selector : 'speciesview metadatapanel',
    autoCreate : true
  }],
  organismId : 'id',
  init:function () {
    var treeView, gridView;
//     treeView = Ext.getCmp ( 'treeView' );
//     gridView = Ext.getCmp ( 'gridView' );
//     this.viewport = Ext.create ( 'CV.view.Viewport' );
//     this.viewport.show();
    this.control({
      'speciesview > treepanel' : {
        select : this.updateUri,
        load: this.treeLoaded,
        scope : this
       },
      'viewport > treepanel':{
        select:this.treeSelect
      },
      'viewport button[text=Species]':{
        render : this.headerInit
      }//,
    });
    // Ext.create ('CV.view.species.View');
//     this.header = Ext.getCmp ( 'speciesBtn' );
  },
  updateUri : function(rm, record, index) {
    var item = record.get( this.organismId ), url = this.uri + '/' + item;
    CV.ux.Router.redirect(url);
  },
  /*
   * this config is used to store the button connected to this controller. In this case library. It can later be used to toggle button during render at init.
   */
  header : undefined,
  headerInit : function ( btn ) {
    this.header = btn;
  },
  show:function( params ){
    // this.render( this.getSp() );
    
    var view = this.getSp(), id = params.id;
    this.render(view);
    this.clearSelection();
    // to make a selection
    if ( typeof id !== 'undefined') {
      this.treeSelect(id);
    }
  },
  /*
   * specify the action to be taken when tree is loaded
   */
  treeLoaded:function(){
    this.getTreePanel().expandAll();
  },
    treeSelect:function ( item ) {
      var id , value, grid, graph, graphStore, gridStore,panel;
      panel = this.getSp();
      panel.clearFacets( true );
    // reload store with species parameters
    grid = this.getSequencesGrid();
    grid.store.getProxy().extraParams = CV.config.ChadoViewer.self.species.feature.extraParams;
    grid.store.getProxy().setExtraParam('id', item);
    grid.store.load();
    
    
    panel.setDS( item );

    
  },
  clearSelection:function(){
    var treePanel = this.getTreePanel(), gridSeq = this.getSequencesGrid(), graph = this.getGraphPanel(), gridMeta = this.getMetadataPanel();
    treePanel.clear(); 
    gridSeq.clear();
    gridMeta.clear();
    graph.clear();
  }
});