Ext.define('CV.ux.RetryLoader',{
  extend:'Ext.LoadMask',
  msgCls:'customLoading',
  msg:'Connection error! Click here to retry.',
  events:[
    'elementscreated'
  ],
  /**
   * store that is reloaded on click
   */
  linkedStore : null,
  tapLoad:function(){
    this.linkedStore && this.linkedStore.reload();
  },  
  afterRender:function(){
    var el;
    this.callParent( arguments );
    if ( this.rendered ){
      el = this.getTargetEl();
      el && el.on({
         click:this.tapLoad,
         scope: this
      });
    }
  }
});
