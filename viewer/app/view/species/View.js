Ext.define('CV.view.species.View', {
  extend : 'CV.view.View',
  alias : 'widget.speciesview',
  requires:['CV.config.ChadoViewer'],
  initComponent : function() {
   var me = this;
   this.dsConfig = CV.config.ChadoViewer.self.species;
    me.callParent(arguments);
  }
}); 