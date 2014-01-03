Ext.define( 'CV.view.CvTabs', {
  extend:'Ext.tab.Panel',
  alias:'widget.cvtabs',
  title:'Summary',
  collapsible:true,
  split:true,
  height:'60%',
  activeItem:0,
  items : [],
  tooltip:'Transcript summary generated with different controlled vocabularies',
  listeners:{
    /**
     * this listener reloads the tab when it becomes active provided the flag is set to true 
     */
    tabchange:function( tabpanel , newTab , oldTab ){
      if ( newTab.reloadStore ) {
        newTab.reload();
        newTab.reloadStore = false;
      }
    }
  },
  clear:function(){
    var i, rev;
    // destroying the items in reverse order since it is likely that unrendered chadopanels will trigger store load when rendered for the first time. 
    for ( i = this.items.items.length ; i > 0 ; i-- ){
      rev = this.items.items[i - 1];
      rev.store.fireEvent( 'beforedestroy' , rev.store );
      rev.destroy();
    }
  },
  /**
   * load store of active tab and delay activatio of others
   */
  reload:function(){
    var active = this.getActiveTab();
    this.items.each(function ( item ) {
      if ( active === item ){
        item.reload();
      }
    });
  },
  constructor:function(){
    this.callParent( arguments );
  },
  initComponent:function(){
    this.addEvents(
      {
        'tabcollapse':true,
        'tabexpand':true
      }
    );
   this.callParent( arguments ); 
  }  
});