Ext.define('CV.view.feature.View', {
  extend : 'Ext.container.Container',
  alias : 'widget.featureview',
  requires : ['CV.view.feature.Grid',
              'CV.view.GenomeBrowser',
              'CV.view.feature.SequenceView',
              'CV.store.Features',
              'CV.store.Annotations',
              'CV.view.feature.Annotations',
              'CV.view.feature.FeatureAnnotations',
              'CV.view.feature.Notes'
              ],
  region : 'center',
  layout : 'border',
  hideBorders : true,
  initComponent : function() {
    var store = Ext.create('CV.store.Features'), metaStore,notesStore, expression_metadataStore,sequenceView, genomeBrowser, combo, treestore;
    var grid = Ext.create('CV.view.feature.Grid', {
      store : store,
      region : 'north',
      split:true
    });
    metaStore = Ext.create('CV.store.FeatureMetadata');
    var metadataPanel = Ext.create('CV.view.feature.DbXrefs', {
      store : metaStore
    });

    notesStore = Ext.create('CV.store.Notes');
    var notesPanel = Ext.create('CV.view.feature.Notes', {
    	region : 'center',
        store : notesStore
      });
    
    expression_metadataStore = Ext.create('CV.store.FeatureCvTerms');
    var expression_metadataPanel = Ext.create('CV.view.feature.CvTerms', {
      store : expression_metadataStore
    });
    
    sequenceView = Ext.create('CV.view.feature.SequenceView', {
      region : 'center',
      disabled : true,
      split:true
    });
    treestore = Ext.create('CV.store.FeatureAnnotations', {});
    Ext.apply(this, {
      items : [grid, {
        xtype : 'panel',
        region : 'east',
        title:'Feature metadata',
        collapsible : true,
        closeable : true,
        split:true,
        width:600,
        layout : {
          // layout-specific configs go here
          type : 'accordion',
          titleCollapse : true,
          animate : true,
          activeOnTop : false,
          multi : true
        },
        items : [
          metadataPanel, {
            xtype : 'featureannotations',
            store : treestore
          },expression_metadataPanel
          ]
         }, sequenceView
        ]
    });
    this.callParent(arguments);
  },
  addGenomeBrowser : function(data, options) {
    var genomeBrowser = Ext.create('CV.view.GenomeBrowser', {
      region : 'south',
      canvasData : data,
      canvasOptions : options
    });
    this.add(genomeBrowser);
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
