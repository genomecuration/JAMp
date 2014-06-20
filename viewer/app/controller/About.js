Ext.define('CV.controller.About', {
  extend : 'Ext.app.Controller',
  requires:['CV.config.ChadoViewer','CV.view.about.View','CV.ux.Router'],
  views : ['CV.view.about.View'],
  refs:[{
    ref : 'about',
    selector : 'aboutview'
  }],
  // config
  name: 'About',
  uri : 'about',
  text: 'About',
  init : function() {
    var treeView, gridView;
    gridView = Ext.create('CV.view.about.View');
    gridView.show();
    this.control({
      'viewport > radiogroup > button[text=About]' : {
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
    var view = this.getAbout();
    this.render( view );
  }
}); 
