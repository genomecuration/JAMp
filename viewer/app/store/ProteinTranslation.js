Ext.define('CV.store.ProteinTranslation', {
  extend:'CV.store.Base',
  fields:['fasta'],
  requires:['CV.store.Base'],
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'translate',
        feature_id : 0,
        geneticCode: 1
    },
    reader:{
      type:'json'
    }
  },
  autoLoad:false
});