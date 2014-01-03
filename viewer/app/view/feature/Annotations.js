Ext.define('CV.view.feature.Annotations', {
  requires:['CV.store.Annotations'],
  extend : 'Ext.form.field.ComboBox',
  alias:'widget.autoannotations',
  store : 'CV.store.Annotations',
  displayField : 'title',
  typeAhead : false,
  hideLabel : true,
  hideTrigger : true,
  minChars:2,
  width:350,
  listConfig : {
    loadingText : 'Searching...',
    emptyText : 'No matching posts found.',

    // Custom rendering template for each item
    getInnerTpl : function() {
      return '<div class="search-item">' + '{cvtermname} <i>{cvtermid}</i>' + '<b style="float:right">{cvname}</b>' + '</div>';
    }
  },
  initComponent:function(){
    if( typeof(this.store) == 'string' ){
      this.store = Ext.create( this.store );
    }
    this.callParent( arguments );
  }
}); 