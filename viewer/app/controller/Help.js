Ext.define('CV.controller.Help', {
  extend : 'Ext.app.Controller',
  requires:['CV.config.ChadoViewer','CV.view.help.View','CV.ux.Router'],
  views : ['CV.view.help.View'],
  refs:[{
    ref : 'help',
    selector : 'helpview'
  }],
  // config
  name:'Help',
  uri : 'help',
  text:'Help',
  init : function() {
    var treeView, gridView;
    gridView = Ext.create('CV.view.help.View');
    gridView.show();
    this.control({
      'viewport > radiogroup > button[text=Help]' : {
        render : this.headerInit,
        scope : this
      }
    });
  },
  /*
   * this config is used to store the button connected to this controller. In this case library. It can later be used to toggle button during render at init.
   */
  header : undefined,
  headerInit : function(btn) {
    this.header = btn;
  },
  show : function(params) {
    var view = this.getHelp();
    this.render( view );
  }
}); 