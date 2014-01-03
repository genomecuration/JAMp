Ext.define('CV.store.Help',{
  extend:'CV.store.Base',
  fields:['text'],
  requires:['CV.store.Base'],
  autoLoad:false,
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'help'
    },
    reader:{
      type:'json'
    }
  }
});