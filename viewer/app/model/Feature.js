Ext.define('CV.model.Feature', {
  extend : 'Ext.data.Model',
  fields : [{
    name:'feature_id',
    type:'auto'
  }, 'name', 'uniquename', 'dbxref_id', 'dbxref_name', 'organism_id', 'organism_name','seqlen', 'cvterm_id', 'type', 'genus', 'species',{
   name:'libraries',
   type:'string',
   convert:function( value , record ){
     var str = '' , libs = record.raw.libraries, i, links=[], lib;
     if ( libs ){
       for ( i = 0 ;i < libs.length ; i  ++ ){
         lib = libs[i];
         var filter = [{"id":lib.library_id,"type":"library","text":lib.library_name}];
         
         links.push ( '<a href="#library/'+encodeURI( JSON.stringify(filter))+'">'+lib.library_name+'</a>');
       }
     }
     return links.join ( ' , ');
   } 
  },{
   name:'srcuniquename',
   type:'string',
   convert:function( value , record ){
     var str = '' , srcs = record.raw.sources, i, links=[], src;
     if ( srcs ){
       for ( i = 0 ;i < srcs.length ; i  ++ ){
         src = srcs[i];
         links.push ( '<a href="#feature/'+src.feature_id + '/' +src.uniquename+'">'+src.uniquename+'</a>');
       }
     }
     return links.join ( ' , ');
   } 
  }]
});