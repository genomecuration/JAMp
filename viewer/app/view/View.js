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
        name: 'annotationpanel',
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
        name: 'statuspanel',
        title:'Status',
        split : true,
        region : 'east',
        width : 400,
        collapsible:true,
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
    vStore.getProxy().url = CV.config.ChadoViewer.self.baseUrl;
    vStore.getProxy().extraParams = this.dsConfig.graph.vocabulary;
    this.vStore = vStore;
    vStore.addListener('load', function(store, records, success) {
      if (success) {
        me.addPanel();
      }
    });
    this.treePanel = this.down('dstree');
    this.treeStore = this.treePanel.store;
    this.gridStore = metadataPanel.store;
    this.facetsParamArray.add(sequencePanel.store);
    this.addListener('configchanged', sequencePanel.store.changeExtraParams, sequencePanel.store);
    this.addListener('configchanged', vStore.changeExtraParams, vStore);
    this.addListener('configchanged', this.gridStore.changeExtraParams, this.gridStore);

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
    this.facetsGrid = this.down('facetsgrid');
    this.facetsGrid.addDocked({
      xtype : 'button',
      text : 'Clear Facets',
      dock : 'bottom',
      handler : me.clearSelection,
      scope : me
    });
    me.callParent(arguments);
  },
  facetsUpdate : function(store, records, success) {
    this.updateFacetsParam();
    !this.changeDataSet && this.fireEvent('facetschanged');
  },
  refine : function() {
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
  },
  updateFacetsParam : function() {
    this.updateExtraParam('facets', JSON.stringify(this.facetsStore.getFacets()), this.facetsParamArray);
  },
  updateFilter : function(grid, newFilters) {
    this.filters = grid.getStore().filters.items;
    this.refine();
  },
  clearSelection : function() {
    this.clearFacets();
  },
  clearFacets : function(silent) {
    silent = silent || false;
    this.facetsStore.removeAll();
  },
  select : function(id) {
    if ( typeof id === "undefined") {
      return;
    }
  },
  selectNode : function() {
    var node;
    node = this.treeStore.getById(this.treeid);
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
    } else {
    }

    // load grid store
    this.gridStore.getProxy().setExtraParam('id', id);
    this.gridStore.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());
    this.gridStore.load();

    this.vStore.removeAll();
    this.vStore.getProxy().setExtraParam('id', id);
    this.vStore.load();

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
    this.graphPanel.removeAll(true);
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
        column.type = 'number';
        this.newFields.push(column);
        fields.push(column);
      }
      s = Ext.create('CV.store.FeatureCount', {
        fields : fields,
        listeners : {
          beforedestroy : this.removeFacetStore,
          scope : this
        }
      });
      //update facetArrayParam
      this.facetsParamArray.add(s);
      s.getProxy().url = CV.config.ChadoViewer.self.baseUrl;
      // this is done since extra params instance is same for all store instances CV.store.FeatureCount.
      s.getProxy().extraParams = Ext.clone(this.dsConfig.graph.cvterm);
      s.getProxy().setExtraParam('id', rec.get('dsid'));
      s.getProxy().setExtraParam('cv_id', rec.get('cv_id'));
      s.getProxy().setExtraParam('cv_name', rec.get('name'));
      s.getProxy().setExtraParam('get', rec.get('get'));
      s.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());
      dataPanel = this.createTab(s, rec);

      tabs.push(dataPanel);
    }, this);
    this.graphPanel.add(tabs);
    this.graphPanel.setActiveTab(0);
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
    var columns, tab, titles=[],title, oldTitles, index, tag = Ext.create('CV.view.TagCloud', {
      store : bioStore,
      listeners : {
        beforeshow : function() {
          this.setThreshold(tab);
        }
      }
    });
    /**
     * gets titles and adds proportions
     */
    oldTitles =CV.config.ChadoViewer.getIdsText();
    for( index in oldTitles ){
      title = oldTitles[ index ];
      titles.push(title+' (count)');
      titles.push(title + ' (percentage)');
    }
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
      this.flag = true;
    }

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
        setthreshold : function() {
          this.active.setThreshold(this);
        }
      },
      autoDestroy : false,
      items : [tag, Ext.create('CV.view.BarChart', {
        store : bioStore,
        yField : CV.config.ChadoViewer.getOnlyIds(),
        titles : titles,
        listeners : {
          beforeactivate : function() {
            this.setThreshold(tab);
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
          beforeactivate : function() {
            this.setThreshold(tab);
          }
        },
        setThreshold : function(chadopanel) {
          chadopanel.setThreshold(chadopanel.minValue);
        }
      })]
    });
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