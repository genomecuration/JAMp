Ext.define('CV.view.help.View',{
  extend:'Ext.panel.Panel',
  requires:['CV.store.Help'],
  alias:'widget.helpview',
  html:'Loading help...',
  store: 'CV.store.Help',
  autoScroll: true,
  overflowY: 'auto',
  bodyStyle: 'padding:5px',
  initComponent:function(){
    if( typeof ( this.store ) =='string' ){
      this.store = Ext.create(this.store);
      this.store.addListener('load', this.load, this);
      this.store.load();
    }
    this.callParent( arguments );
  },
  load:function( ){
    var html = this.store.getAt(0).get('text');
    this.update( html );
  }
});
