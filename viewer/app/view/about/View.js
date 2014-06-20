Ext.define('CV.view.about.View',{
  extend:'Ext.panel.Panel',
  requires:['CV.store.About'],
  alias:'widget.aboutview',
  html:'Loading...',
  store: 'CV.store.About',
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
