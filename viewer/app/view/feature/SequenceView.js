Ext.define('CV.view.feature.SequenceView', {
  extend : 'Ext.tab.Panel',
  alias : 'widget.sequenceview',
  requires : ['CV.view.feature.Fasta', 'CV.view.feature.NetworkPanel', 'CV.store.Translations'],
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
        tooltip:'View nucleotide and protein sequence',
        layout : {
          type : 'accordion',
          titleCollapse : true,
          animate : true,
          multi : true
        },
        items : [{
          xtype : 'fastacontainer',
          title : 'Nucleotide',
          id : 'nucleotide',
          downloadId : 'downloadFasta'
        }, {
          xtype : 'fastacontainer',
          store : 'CV.store.ProteinTranslation',
          title : 'Protein',
          id : 'proteintranslation',
          downloadId : 'downloadProtein',
          dockedItems : [{
            xtype : 'combobox',
            store : store,
            name : 'translation',
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
        xtype : 'genomebrowser'
      }]
    });
    this.callParent(arguments);
  },
  setActive : function(data, options) {
    var genomebrowser = this.down('genomebrowser');
    this.setActiveTab(genomebrowser);
  },
  initialiseCombobox : function() {
    var p = this.down('fastacontainer[id=proteintranslation]'), combo = p.down('combobox'), id;
    id = p.store.getProxy().extraParams.geneticCode;
    combo.setValue(id);
  }
});
