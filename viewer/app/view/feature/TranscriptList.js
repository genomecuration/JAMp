Ext.define('CV.view.feature.TranscriptList',{
  requires:['CV.store.Transcripts'],
  extend:'Ext.grid.Panel',
  alias : 'widget.transcriptlist',
  store: 'CV.store.Transcripts',
  title:'Transcript members',
  columns:[{
    dataIndex : 'name',
    text : 'Name',
    flex: 1,
    renderer:function( id, grid , model ){
      var dataset_id = model.get('dataset_id');
      return "<a href='#feature/dataset_"+dataset_id+'.'+id+"'>"+ id +"</a>";
    }
  }],
  initComponent:function(){
    if ( typeof this.store == 'string'){
      this.store = Ext.create(this.store);
    }
    this.callParent( arguments );
  }
});