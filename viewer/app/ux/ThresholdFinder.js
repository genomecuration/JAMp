Ext.define('CV.ux.ThresholdFinder',{
  countField : 'total',
  getThreshold:function( chadopanel ){
    // if ( this.store.getCount() > this.maxCategories ) {
      return this.getNewThreshold();
    // }
  },
  getNewThreshold:function(){
    var newThres = Number.MAX_VALUE, prevThres, that = this, records=[], clonedStore = this.cloneStore();
    clonedStore.sort(this.countField,'DESC');
    clonedStore.clearFilter();
    clonedStore.each (function( item ){
      records.push( item );
    });
    Ext.each( records,function( item ){
      prevThres = newThres;
      newThres = item.get(that.countField);
      if( newThres != prevThres ){
        clonedStore.filterBy( that.filterFn( newThres ) , that );
        // max -1 since other record needs to be counted
        if( clonedStore.getCount() >= that.maxCategories ){
          newThres = prevThres;
          return false;
        }
        clonedStore.clearFilter();        
      }
    });
    return newThres;
  },
  filterFn : function( thres ){
    return function( item ){
      return item.get(this.countField) >= thres;
    };    
  },  
  setThreshold:function( chadopanel ){
    var thres = this.getThreshold();
    this.store.suspendEvents();
    this.store.filterBy( this.filterFn(chadopanel.threshold) );
    this.store.resumeEvents();
    thres && chadopanel.setThreshold( thres );
    this.refresh && this.refresh();
  },
  cloneStore:function(){
    var records = [];
    this.store.clearFilter( true );
    this.store.each(function(r){
      if( r.get('name') != '-Other terms below count cutoff' || r.get('name') != '-No results found' || r.get('name') != '-No hit'){
       records.push(r.copy());
      }
    });
    
    var store2 = new Ext.data.Store({
      model: this.store.model
    });
    store2.add(records);
    return store2;  
  }
});
