Ext.define('CV.store.Transcripts', {
  extend:'CV.store.Base',
  fields:['name','dataset_id'],
  requires:['CV.store.Base'],
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'networktranscripts',
        dataset_id: null,
        network_id: null
    },
    reader:{
      type:'json'
    }
  },
  autoLoad:false
});