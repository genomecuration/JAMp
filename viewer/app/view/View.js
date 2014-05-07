Ext.define('CV.view.View', {
  extend : 'Ext.container.Container',
  alias : 'widget.dsview',
  requires : ['CV.config.ChadoViewer', 'CV.view.TagCloud', 'CV.view.FeatureGrid', 'CV.view.PieChart', 'CV.store.Facets', 'CV.ux.StatusMask', 'CV.view.Tree', 'CV.view.CvTabs', 'CV.view.MetaData', 'Ext.ux.grid.FiltersFeature', 'CV.view.Facets', 'CV.store.FeatureCount', 'CV.store.Annotations', 'CV.view.feature.Annotations'],
  layout : 'border',
  // important params
  treeStore : null,
  vStore : null,
  graphPanel : null,
  dsConfig : null,
  gridStore : null,
  treePanel : null,
  treeid : null,
  /**
   * setting it to true prevents firing of facetchanged event. this is used by contoller when facet grid needs to be cleared.
   */
  changeDataSet : false,
  fieldPath : 'text',
  /*
   * used to store facets
   */
  facets : [],
  /**
   * an instance of CV.store.Facets
   */
  facetsStore : null,
  /**
   * grid that dispalys facets
   */
  facetsGrid : null,
  /**
   * array of all stores that has facet parameters
   */
  facetsParamArray : undefined,
  /**
   * array of the controlled vocabulary panels
   */
  cvPanels : [],
  /**
   * used to store filters
   */
  filters : [],
  events : ['facetschanged', 'configchanged'],

  initComponent : function() {
    this.vStore = Ext.create('CV.store.ControlledVocabularies', {
      autoLoad : false
    });

    Ext.apply(this, {
      items : [{
        xtype : 'dstree',
        region : 'west'
      }, {
        xtype : 'tabpanel',
        region : 'center',
        items : [{
          xtype : 'cvtabs',
          store: this.vStore,
          plugins : [Ext.create('CV.ux.Retry',{
            store : this.vStore
          })]
        }, {
          xtype : 'metadatapanel'
        }]
      }, {
        xtype : 'panel',
        split : true,
        region : 'east',
        width : 400,
        layout : {
          type : 'accordion',
          titleCollapse : true,
          animate : true,
          multi : true
        },
        items : [{
          xtype : 'sequencesgrid',
          collapsed : false
        }, {
          xtype : 'panel',
          title : 'Search terms',
          collapsed : false,
          bodyStyle : 'padding:15px',
          items : [{
            xtype : 'autoannotations',
            store : 'CV.store.Annotations'//,
          }]
        }, {
          xtype : 'facetsgrid',
          store : 'CV.store.Facets'
        }]
      }]
    });
    this.callParent(arguments);
    this.facetsParamArray = new Ext.util.MixedCollection();
  },
  afterRender : function() {
    var me = this, treeStore, treePanel, gridPanel, gridStore, bioStore, vStore, rec, graphPanel, sequencePanel = this.down('sequencesgrid'), metadataPanel = this.down('metadatapanel');
    //
    vStore = this.vStore;
    this.graphPanel = this.down('cvtabs');
    // this.graphPanel.addPlugin({
      // store : vStore,
      // ptype : 'retry'
    // });

    // // console.log ( dsConfig );
    vStore.getProxy().url = CV.config.ChadoViewer.self.baseUrl;
    vStore.getProxy().extraParams = this.dsConfig.graph.vocabulary;
    this.vStore = vStore;
    vStore.addListener('load', function(store, records, success) {
      if (success) {
        me.addPanel();
      }
    });
    //
    // // create tree store
    // this.treeStore = Ext.create('CV.store.Libraries', {
    // proxy : {
    // url : CV.config.ChadoViewer.baseUrl,
    // extraParams : this.dsConfig.tree.extraParams,
    // type : 'ajax'
    // }
    // });
    // this.treeStore.getProxy().url = CV.config.ChadoViewer.baseUrl;
    // this.treeStore.load();
    //
    // // treePanel = Ext.create('CV.view.Tree', {
    // // // id : 'libraryTreeView',
    // // // plugins:[{ptype:'statusmask', owner:treePanel}],
    // // store : this.treeStore,
    // // collapsible : true,
    // // closeable : true
    // // });
    this.treePanel = this.down('dstree');
    this.treeStore = this.treePanel.store;
    // // treePanel = Ext.ComponentQuery.query('dstree' , this );
    //
    // this.treePanel = treePanel;
    // // grid store
    this.gridStore = metadataPanel.store;
    // this.gridStore = Ext.create('CV.store.CvTerms', {
    // proxy : {
    // type : 'ajax',
    // url : CV.config.ChadoViewer.baseUrl,
    // extraParams : Ext.clone(this.dsConfig.cv.extraParams),
    // reader : {
    // type : 'json',
    // root : 'root',
    // successProperty : false,
    // totalProperty : false
    // }
    // }
    // });
    // stores.push(this.gridStore);
    // sequencePanel = Ext.create('CV.view.FeatureGrid', {
    // // region:'center',
    // listeners : {
    // headerfilterchange : this.updateFilter,
    // scope : this
    // }
    // });

    // this.facetsParamArray.push(sequencePanel.store);
    this.facetsParamArray.add(sequencePanel.store);
    this.addListener('configchanged', sequencePanel.store.changeExtraParams, sequencePanel.store);
    this.addListener('configchanged', vStore.changeExtraParams, vStore);
    this.addListener('configchanged', this.gridStore.changeExtraParams, this.gridStore);
    console.log('store');
    console.log(sequencePanel.store);
    //AP: button to download all sequences in store (all pages in pager)
    // first make a hidden form because AJAX doesn't allow POST.
    var downloadhiddenForm = Ext.create('Ext.form.Panel', {
    	  title:'hiddenForm',
    	  standardSubmit: true,
    	  method: 'POST',
    	  url: CV.config.ChadoViewer.self.baseUrl ,
    	  height:0,
    	  width: 0,
    	  hidden:true,
          defaultType: 'textfield',
    	  items:[
    	    {xtype:'hiddenField', name:'ds'},
    	    {xtype:'hiddenField', name:'type'},
    	    {xtype:'hiddenField', name:'feature_id'},
    	    {xtype:'hiddenField', name:'format'}
    	  ]
    	});
    
    //TODO add parameter 'feature_id' with value as: an array of feature ids from the store
    // not as straightforward as the store doesn't have all the data...
    // for the time being the page is set at 1,000 records.
    sequencePanel.addDocked({
	      xtype : 'button',
	      text : 'Download this page (up to 1000)',
	      dock : 'bottom',
	      handler: function() {
	    	  var feature_ids = new Array();
	    	  
	    	  //var allsequence_records = sequencePanel.store.snapshot || sequencePanel.store.data;
	    	  sequencePanel.store.each(function(rec) {
	    		  feature_ids.push(rec.get('feature_id'));
              });
	    	  console.log(feature_ids.length);
	    	  feature_ids = Ext.encode(feature_ids);
	    	  
   			  downloadhiddenForm.getForm().submit(
   					  {
   						  params: {
   			    			  ds: 'multidownload',
   			    		      type: 'fasta',
   			    		      feature_id: feature_ids,
   			    		      format: 'download'
   			    		  }
   			            }	  
   			  
   			  );
	      },
	      scope : me   // ?
	    });
    
    
    //
    // metadataPanel = Ext.create('CV.view.Grid', {
    // store : this.gridStore
    // })
    // gridPanel = Ext.create('Ext.panel.Panel', {
    // region : 'center',
    // layout : 'accordion',
    // items : [sequencePanel, metadataPanel],
    // clear : function() {
    // // var metadataPanel = this.down( 'metadatapanel' ), sequencePanel = this.down('sequencesgrid');
    // this.items.each(function(item) {
    // item.clear();
    // });
    // // sequencePanel.clear();
    // // metadataPanel.clear();
    // }
    // });
    // // this.addListener( 'facetschanged' , this.loadStore , sequencePanel.store );
    // // create graph
    // // graphPanel = Ext.create('CV.view.CvTabs', {
    // // });
    //

    this.facetsStore = this.down('facetsgrid').store;
    this.facetsStore.addListener({
      load : this.facetsUpdate,
      datachanged : this.facetsUpdate,
      clear : function() {
        this.updateFacetsParam();
        !this.changeDataSet && this.fireEvent('facetschanged');
      },
      scope : this
    });
    // this.facetsStore = Ext.create('CV.store.Facets', {
    // listeners : {
    // // load: this.facetsUpdate,
    // datachanged : this.facetsUpdate,
    // clear : function() {
    // this.updateFacetsParam();
    // this.fireEvent('facetschanged');
    // },
    // scope : this
    // }
    // });
    this.facetsGrid = this.down('facetsgrid');
    this.facetsGrid.addDocked({
      xtype : 'button',
      text : 'Clear Facets',
      dock : 'bottom',
      handler : me.clearSelection,
      scope : me
    });
    // // this.facetsGrid = Ext.create('CV.view.Facets', {
    // // store : this.facetsStore,
    // // bbar : [{
    // // xtype : 'button',
    // // text : 'Clear Facets',
    // // handler : me.clearSelection,
    // // scope : me
    // // }]
    // // });
    // Ext.apply(this, {
    // hideBorders : true,
    // layout : 'border',
    // region : 'center',
    // deferredRender : false,
    // items : [gridPanel, graphPanel, this.facetsGrid]
    // });
    me.callParent(arguments);
    //
    // treePanel.addPlugin({
    // ptype : 'statusmask',
    // owner : treePanel,
    // store : this.treeStore
    // });
  },
  facetsUpdate : function(store, records, success) {
    // if ( success ){
    // this.facetsGrid.expand(true);
    this.updateFacetsParam();
    !this.changeDataSet && this.fireEvent('facetschanged');
    // this.fireEvent('facetschanged', this.facetsStore );
    // }
  },
  refine : function() {
    // reload controlled vocabulary store and repopulate the graphs
    // console.log(this.filters)
    this.vStore.getProxy().setExtraParam('filters', JSON.stringify(this.filters));
    this.vStore.getProxy().setExtraParam('facets', JSON.stringify(this.facets));
    this.vStore.load();

  },
  removeFacetStore : function(store) {
    this.facetsParamArray.remove(store);
  },
  updateExtraParam : function(param, value, stores) {
    stores.each(function(item) {
      var proxy = item.getProxy();
      proxy && proxy.setExtraParam(param, value);
    });
    // stores[0].load();
  },
  updateFacetsParam : function() {
    this.updateExtraParam('facets', JSON.stringify(this.facetsStore.getFacets()), this.facetsParamArray);
  },
  updateFilter : function(grid, newFilters) {
    this.filters = grid.getStore().filters.items;
    this.refine();
  },
  clearSelection : function() {
    // var silent = false;
    this.clearFacets();
  },
  clearFacets : function(silent) {
    silent = silent || false;
    // this.facets= [];
    // this.facetsStore.removeAll(silent);
    this.facetsStore.removeAll();
    // !silent && this.fireEvent('facetschanged', this.facets );
  },
  // setFacets:function( facets ){
  // // this.facets = facets;
  // // this.fireEvent( 'facetschanged' , facets );
  // },
  select : function(id) {
    if ( typeof id === "undefined") {
      return;
    }
  },
  selectNode : function() {
    var node;
    node = this.treeStore.getById(this.treeid);
    // this.treePanel.expandNode ( node );
    if (node) {
      this.treePanel.expandPath(node.getPath(this.fieldPath), this.fieldPath);
      this.treePanel.getSelectionModel().select(node);

      this.treeStore.hasListener('load') && this.treeStore.removeListener('load', this.selectNode, this);
    }
  },
  setConfig : function(config) {
    if (config) {
      this.dsConfig = config;
      // fire event?
      this.fireEvent('configchanged', config);
    }
  },
  setDS : function(id) {
    var node;

    id = this.convertToInt(id);
    this.treeid = id;

    if (!this.treeStore.isLoading()) {
      // this.selectNode();
    } else {
      // this.treeStore.addListener('load', this.selectNode, this);
    }
    // node && node.parentNode.expand();

    // load grid store
    this.gridStore.getProxy().setExtraParam('id', id);
    this.gridStore.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());
    // console.log(this.gridStore.getProxy());
    this.gridStore.load();

    this.vStore.removeAll();
    this.vStore.getProxy().setExtraParam('id', id);
    this.vStore.load();

    // this.addDbxref( id );
    // this.addBlast( id );
  },
  convertToInt : function(id) {
    if (!isNaN(id)) {
      return parseInt(id);
    }
  },
  loadStore : function(facetsStore) {
    this.getProxy().setExtraParam('facets', Ext.JSON.encode(facetsStore.getFacets()));
    this.load();
  },
  clearGraphPanel : function() {
    var tempStore = this.graphPanel.items.getAt(0), tempStore = tempStore ? tempStore.store : null;
    this.graphPanel.disable();
    // console.log(this.graphPanel);
    // tempStore && console.log( tempStore.model );
    this.graphPanel.removeAll(true);
    // console.log('after');
    // tempStore && console.log( tempStore.model )
    // console.log(this.graphPanel);
    this.graphPanel.enable();
  },
  visibleColumns : function(fields) {
    var columns = Ext.clone(CV.config.ChadoViewer.self.rawColumns), i, field;
    for (i in fields ) {
      field = fields[i];
      columns.splice(1, 0, {
        dataIndex : field['id'] + ' proportion',
        text : field['text'] + ' proportion',
        flex : 1
      });
      columns.splice(1, 0, {
        dataIndex : field['id'] + ' count',
        text : field['text'],
        flex : 1
      });
    }
    return columns;
  },
  addPanel : function() {
    var tabs = [], prev;
    this.clearGraphPanel();
    // cv

    this.vStore.each(function(rec, index) {
      var s, dataPanel, proxy, fields = [{
        name : 'cvterm_id',
        type : 'auto'
      }, {
        name : 'name',
        type : 'string'
      }, {
        name : 'total',
        type : 'integer'
      }, {
        name : 'highername',
        type : 'object',
        defaultValue : CV.config.ChadoViewer.getHigherNames()
      }, {
        name : 'cv_id',
        type : 'auto'
      }], selected = CV.config.ChadoViewer.getOnlyIds(), id, columnSchema = {
        name : undefined,
        type : 'integer',
        text : undefined
      }, column;
      this.newFields = [];
      for (id in selected ) {
        column = Ext.clone(columnSchema);
        column.name = selected[id] + " count";
        this.newFields.push(column);
        fields.push(column);

        column = Ext.clone(columnSchema);
        column.name = selected[id] + " proportion";
        column.type = 'numeric';
        this.newFields.push(column);
        fields.push(column);
      }
      s = Ext.create('CV.store.FeatureCount', {
        fields : fields,
        listeners : {
          beforedestroy : this.removeFacetStore,
          scope : this
        }
        // fields:[{
        // name: 'cvterm_id',
        // type: 'integer'
        // },{
        // name:'name' ,
        // type: 'string'
        // },{
        // name: 'total',
        // type: 'integer'
        // },{
        // name:'68',
        // type:'integer'
        // }]
      });
      //update facetArrayParam
      // this.facetsParamArray.push(s);
      this.facetsParamArray.add(s);
      s.getProxy().url = CV.config.ChadoViewer.self.baseUrl;
      // this is done since extra params instance is same for all store instances CV.store.FeatureCount.
      s.getProxy().extraParams = Ext.clone(this.dsConfig.graph.cvterm);
      s.getProxy().setExtraParam('id', rec.get('dsid'));
      s.getProxy().setExtraParam('cv_id', rec.get('cv_id'));
      s.getProxy().setExtraParam('cv_name', rec.get('name'));
      s.getProxy().setExtraParam('get', rec.get('get'));
      s.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());
      // // store.load();
      dataPanel = this.createTab(s, rec);

      // this.addListener( 'facetschanged', this.refreshDsview , this );

      // this.graphPanel.add( dataPanel );
      tabs.push(dataPanel);
    }, this);
    // console.log(tabs);
    this.graphPanel.add(tabs);
    this.graphPanel.setActiveTab(0);
    // new Ext.LoadMask( tabs[0] , { store : tabs[0].store , useTargetEl : true});
    this.cvPanels = tabs;
  },
  loadingOn : function() {
    this.setLoading(true);
  },
  loadingOff : function(store, records, success) {
    this.setLoading(false);
  },
  refreshDsview : function() {
    var that = this;
    // this.graphPanel.active.store.load();
    this.graphPanel.items.each(function(item) {
      item.active.reloadStore = false;
      item.items.each(function(i) {
        if (i != item.active) {
          i.reloadStore = true;
        }
      });
    });
  },
  isDefferedLoad : function() {
    var active = this.graphPanel.getActiveTab();
    this.graphPanel.items.each(function(item) {
      if (active != item) {
        item.reloadStore = true;
      } else {
        item.reloadStore = false;
      }
    });
  },
  createTab : function(bioStore, rec) {
    var columns, tab, tag = Ext.create('CV.view.TagCloud', {
      store : bioStore,
      listeners : {
        beforeshow : function() {
          this.setThreshold(tab);
          // if( this.isVisible( true )){
          // console.log('activate event');
          // tab.setThreshold( 1 );
          // hack to set redraw tag panel
          // tag.draw();
          // }
        }
      }
      // setThreshold : function(chadopanel) {
      // // chadopanel.setThreshold(chadopanel.minValue);
      // chadopanel.setThreshold(200);
      // }
    });
    columns = this.visibleColumns(CV.config.ChadoViewer.self.selectedIds);
    var filtersCfg = {
      ftype : 'filters',
      autoReload : false,
      local : true,
      filters : [{
        type : 'string',
        dataIndex : 'name'
      }]
    };
    columns[0].filter = {
      xtype : 'textfield'
    };
    if (!this.flag) {
      // this.graphPanel.addPlugin({ ptype:'statusmask',owner: this.graphPanel , cmp : this.graphPanel , store:bioStore });
      this.flag = true;
    }
    //,
    // shouldRefresh = function ( ){
    // if ( !this.filter ) {
    // return false;
    // }
    // return true;
    // }
    // ;

    tab = Ext.create('CV.view.ChadoPanel', {
      title : rec.get('title'),
      layout : 'fit',
      record : rec,
      store : bioStore,
      height : 400,
      plugins : [Ext.create('CV.ux.Retry', {
        store : bioStore
      })],
      listeners : {
        // beforedestroy : function() {
        // var dsview = Ext.ComponentQuery.query( 'libraryview' )[0];
        // // dsview.removeListener( 'facetschanged' , dsview.loadStore , this.store );
        // },
        setthreshold : function() {
          // console.profile();
          this.active.setThreshold(this);
          // console.profileEnd();
        }
        //
        // activate:function(){
        // this.addListener('filtercomplete', tag.draw, tag);
        // }
      },
      // afterRender:function(){
      // this.addListener('filtercomplete', tag.draw, tag);
      // // this.callParent ( arguments );
      // },
      // defaults : {
      // hideMode : 'display'
      // },
      // listeners:{
      // render:function ( comp ) {
      // comp.store.load();
      // },
      // filtercomplete: function (){
      // this.items.each( function( item ) {
      // item.filter = true;
      // item.refresh();
      // });
      // }
      // },
      autoDestroy : false,
      // bindStoreToComp:function(){
      // var that = this;
      // this.items.each( function( item ) {
      // item.bindStore( that.store );
      // });
      // },
      items : [tag, Ext.create('CV.view.BarChart', {
        store : bioStore,
        yField : CV.config.ChadoViewer.getOnlyIds(),
        titles : CV.config.ChadoViewer.getIdsText(),
        listeners : {
          beforeactivate : function() {
            // console.profile();
            this.setThreshold(tab);
            // console.profileEnd();
          }
        }
      }), Ext.create('CV.view.PieChart', {
        xtype : 'pieview',
        store : bioStore,
        listeners : {
          beforeactivate : function() {
            this.setThreshold(tab);
          }
        }
      }), Ext.create('CV.view.RawData', {
        xtype : 'rawdata',
        store : bioStore,
        columns : columns,
        features : [filtersCfg],
        listeners : {
          /**
           * added this code in controller. faceting now can be switched on or off.
           */
          // selectionchange: function( rowmodel , recs ) {
          // var i , dsview = this.up('dsview'),  facets = dsview.facets || [],grid = dsview.down('sequencesgrid');
          // if(  recs.length ) {
          // facets.push({ property:'cvterm_id', value:recs[0].get('cvterm_id')});
          // dsview.facetsStore.loadData([{'cvterm_id':recs[0].get('cvterm_id'),'name':recs[0].get('name'),'cv':tab.title}], true)
          // // dsview.setFacets( facets );
          // }
          // },
          // render:function(){
          // console.log('raw data rendered');
          // console.log( this.store , this.store.model , this.store.proxy.model );
          // },
          beforeactivate : function() {
            this.setThreshold(tab);
          }
        },
        setThreshold : function(chadopanel) {
          chadopanel.setThreshold(chadopanel.minValue);
        }
      })]
    });
    // this.graphPanel.add( tab );
    // tab.addPlugin({
    // ptype : 'statusmask',
    // owner : tab,
    // store : bioStore
    // });
    // tab.addListener('filtercomplete', tag.draw, tag);
    // bioStore.addListener('load' , tab.bindStoreToComp , tab );
    return tab;
  },
  onRemoved : function() {
    this.callParent(arguments);
    var comps = this.query('component'), i;
    for ( i = 0; i < comps.length; i++) {
      comps[i].events.hideMask && comps[i].fireEvent('hideMask');
    }
  },
  onAdded : function() {
    this.callParent(arguments);
    var comps = this.query('component'), i;
    for ( i = 0; i < comps.length; i++) {
      comps[i].events.hideMask && comps[i].fireEvent('displayMask');
    }
  }
});
