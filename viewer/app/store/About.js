Ext.define('CV.store.About',{
  extend:'CV.store.Base',
  fields:['text'],
  requires:['CV.store.Base'],
  autoLoad:false,
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'about'
    },
    reader:{
      type:'json'
    }
  }
});
