Ext.define('CV.view.library.View', {
  extend : 'CV.view.View',
  alias : 'widget.libraryview',
  requires:['CV.config.ChadoViewer'],
  initComponent : function() {
   var me = this;
   this.dsConfig = CV.config.ChadoViewer.self.library;
   me.callParent(arguments);
  }
}); 