Ext.define('CV.store.Fasta',{
  extend:'CV.store.Base',
  fields:['fasta'],
  requires:['CV.store.Base'],
  autoLoad:false,
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'fasta',
        feature_id : 0
    },
    reader:{
      type:'json'
    }
  }
});