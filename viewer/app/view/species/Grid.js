Ext.define( 'CV.view.species.Grid',{
  extend:'Ext.grid.Panel',
  title:'Grid',
  region : 'center',
  height: 400,
  columns:[{
    text: 'Organism Name',
    dataIndex: "organism_name",
    type:'string',
    flex: 1
  }, {
    text: 'Term',
    dataIndex: "vocabulary",
    type:'string',
    flex: 1
  }, {
    text: 'Value',
    dataIndex: "term",
    type:'string',
    flex: 1
  }],
  // for filter 
//   features: Ext.create ( 'Ext.ux.grid.FiltersFeature' , {
//     encode: true,
//     local: true,
//     filters: [Ext.create ( 'Ext.ux.grid.filter.NumericFilter', {
//       dataIndex: 'organism_id'
//     })]
//   }),
  
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