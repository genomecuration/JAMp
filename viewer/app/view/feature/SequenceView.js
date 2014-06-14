Ext.define('CV.view.feature.SequenceView', {
  extend : 'Ext.tab.Panel',
  alias : 'widget.sequenceview',
  requires : ['CV.view.feature.Fasta', 'CV.view.feature.NetworkPanel','CV.view.feature.ExpressionPanel','CV.view.feature.Notes', 'CV.store.Translations','CV.store.ProteinTranslation'],
  height : '100%',
  width : '80%',
  defaults : {
    // applied to each contained panel
    bodyStyle : 'padding:15px',
    overflowY : 'auto'
  },
  initComponent : function() {
    var store = Ext.create('CV.store.Translations', {
      listeners : {
        load : this.initialiseCombobox,
        scope : this
      }
    });
    this.addListener('beforerender', this.setActive, this);
    Ext.apply(this, {
      items : [{
        xtype : 'panel',
        title : 'Sequence',
        tooltip:'View nucleotide and protein sequences',
        layout : {
          type : 'accordion',
          titleCollapse : true,
          animate : true
        },
        items : [
        {
            xtype : 'fastacontainer',
            title : 'gene',
            id : 'gene',
            seqtype: 'gene',
            autoScroll: true,
	    collapsed : true,
            downloadId : 'downloadgene'
          }, {
            xtype : 'fastacontainer',
            title : 'mRNA',
            id : 'mrna',
            seqtype: 'mrna',
            autoScroll: true,
	    collapsed : true,
            downloadId : 'downloadmRNA'
          }, {
          xtype : 'fastacontainer',
          title : 'CDS',
          id : 'cds',
          seqtype: 'cds',
	  collapsed : true,
          autoScroll: true,
          downloadId : 'downloadCDS'
        }, {
          xtype : 'fastacontainer',
          store : 'CV.store.ProteinTranslation',
          title : 'Protein',
          collapsed : true,
	  id : 'proteintranslation',
          autoScroll: true,
          downloadId : 'downloadProtein',
          dockedItems : [{
            xtype : 'combobox',
            store : store,
            name : 'translation',
            seqtype: 'proteintranslation',
            valueField : 'id',
            displayField : 'name',
            fieldLabel : 'Protein Translation Table:',
            labelWidth : 150,
            matchFieldWidth : false,
            queryMode : 'local',
            forceSelection : true,
            enableRegEx : true,
            minWidth : 300,
            maxWidth : 400
          }]
        }]
      }, {
        xtype : 'networkpanel'
      }, {
        xtype : 'expressionpanel'
      }, {
        xtype : 'notespanel'
      }, {
        xtype : 'genomebrowser'
      }]
    });
    this.callParent(arguments);
  },
  setActive : function(data, options) {
    var defaultTab = this.down('genomebrowser'); //AP currently only works with genomebrowser, needs to be fixed
    this.setActiveTab(defaultTab);
  },
  initialiseCombobox : function() {
    var p = this.down('fastacontainer[id=proteintranslation]'), combo = p.down('combobox'), id;
    id = p.store.getProxy().extraParams.geneticCode;
    combo.setValue(id);
  }
});
