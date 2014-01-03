Ext.define('CV.store.Translations', {
  extend:'CV.store.Base',
  fields:['id','name'],
  requires:['CV.store.Base'],
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'translationtable'
    },
    reader:{
      type:'json'
    }
  },
  autoLoad:true
});