Ext.define( 'CV.view.library.Grid',{
  extend:'Ext.grid.Panel',
  title:'Library Grid',
  region : 'center',
  height:400,
  columns:[/*{
    text: 'libarary id',
    dataIndex: "library_id",
    type:'number',
    flex: 1
  } ,*/ {
    text: 'Vocabulary',
    dataIndex: "vocabulary",
    type:'string',
    flex: 1
  }, {
    text: 'Term',
    dataIndex: "term",
    type:'string',
    flex: 1
  }],
  // for filter 
  // features: Ext.create ( 'Ext.ux.grid.FiltersFeature' , {
    // encode: true,
    // local: true,
    // filters: [Ext.create ( 'Ext.ux.grid.filter.NumericFilter', {
      // dataIndex: 'library_id'
    // })/*,{
      // type:'string',
      // dataIndex:'library_name'
    // }*/]
  // }),
  
  // facilitates interaction between tree and grid though controller
  filter:function ( id , value ) {
    if ( !this.features || !id ) {
      return;
    }
    var features = this.features[0], filter, hash = {};
    
    filter = this.filters.getFilter ( id );
    if ( !filter ) {
      features.createFilters ();
      filter = this.filters.getFilter ( id );
      if ( !filter ) {
        return;
      }
    }
    hash['eq'] = value;
    filter.setValue ( hash );
    filter.setActive ( true  );
  }
});