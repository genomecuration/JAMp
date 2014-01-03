Ext.define('CV.store.GenomeTracks', {
  extend:'CV.store.GenomeBase',
  requires:['CV.store.GenomeBase'],
  fields:[{
    name:'tracks',
    type:'object'
  }],
  proxy:{
    type:'ajax',
    reader:{
      type:'json'
    },
    extraParams:{
      type: 'track',
      id: null
    }
  }
});