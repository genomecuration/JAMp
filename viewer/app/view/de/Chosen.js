Ext.define('CV.view.de.Chosen', {
  extend : 'Ext.grid.Panel',
  alias : 'widget.chosenpanel',
  title : 'Datapoints',
  store : 'CV.store.Depoints',
  columnLines : true,
  requires : ['CV.store.Depoints'],
  width:300,
  height:'100%',
  initComponent : function() {
    if ( typeof this.store === 'string') {
      this.store = Ext.create(this.store);
    }
    // this will make paging toolbar update when store records are removed using removeAll function.
    this.callParent(arguments);
  },
  columns : [{
    text:'Name',
    dataIndex: 'name',
    renderer:function( rec ){
      return "<a href='#feature/dataset_16."+rec+"'>"+rec+"</a>";
    }
  }],
  clear:function(){
    if ( this.store ){
      this.store.removeAll();
    } 
  }
});
