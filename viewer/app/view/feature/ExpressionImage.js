Ext.define("CV.view.feature.ExpressionImage",{
  extend:'Ext.panel.Panel',
  alias:'widget.expressionimage',
  requires:['CV.store.Expression'],
  title:'Expression figure',
  store:'CV.store.Expression',
  tooltip:'Expression figures',
  name:'expressionimage',
  region:'center',
  width:"100%",
  height:'100%',
  html:'Please choose an image from the list on left',
  initComponent:function (){
	  if ( typeof( this.store ) == 'string'){
		  var that = this;
		  this.store = Ext.create(this.store,{
			  listeners: {
			          clear:this.onClear,
			          scope:this,
				      load: function(store, records, success) {
				    	if( success ){
				            var html_data = records[0].get( 'imageData' );
				            
				         // this is not the right way but i couldn't understand it otherwise.
				         // probably needs containers etc...
				            if (html_data.length > 50 ){
				            	that.update(html_data);
				            }
				          }
				    }
			  }
			  
		  });
	    }
	  
	    this.callParent( arguments );
   },
  clear:function(){
    this.msg = 'clearing';
    this.store.removeAll();
  },
  onClear:function(){
    this.update('');
  }
});

