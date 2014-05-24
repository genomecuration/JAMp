Ext.define('CV.view.ChadoPanel', {
  extend : 'CV.view.MultiViewPanel',
  requires:['CV.view.InputSlider'],
  // extend : 'Ext.panel.Panel',
  alias : 'widget.chadopanel',
  // fieldValue : 'Cutoff :',
  threshold : Number.MIN_VALUE,
  // othersId : 10,
  // this parameter will store the summary of all records below the threshold value
  othersRec : null,
  // field that will store the summary value , default count
  // countField : 'count',
  countField : 'total',
  // name of the others record
  othersName : 'Others',
  othersObj : {
    'cvterm_id':0
  },
  // name field
  nameField : 'name',
  minValue : null,
  maxValue : null,
  // the underlying store that links all the views 
  store : null,
  slider: null,
  sliderNumberField : null,
  initComponent : function() {

    var slider,  that = this;
    // othersObj,
    
    // add events
    this.addEvents({
      // fires when filtering is complete
      'filtercomplete':true,
      'setthreshold':true,
      'processed':true
    }
    );
    
    slider = Ext.create('Ext.slider.Single', {
      width : 200,
     // value : 200,
      tooltip : 'Set cutoff using the slider',
      fieldLabel : this.fieldValue,
      increment : 1,
      listeners : {
        changecomplete : this.setValue,
        scope : this
      }
    });
    // slider = Ext.create('CV.view.InputSlider', {
      // width : 200,
      // fieldLabel : this.fieldValue,
      // increment : 1,
      // listeners : {
        // changecomplete : this.setFieldLabel,
        // scope : this
      // }
    // }); 
    this.slider = slider;
    this.sliderNumberField = Ext.create( 'Ext.form.field.Number' , {
        padding: '5 5 0 5',
        width:30,
        hideTrigger:true,
        tooltip:'Set cutoff to a specific value',
        listeners:{
          change : this.setValue,
          scope : this
        }
    });
    // if (!this.tbar) {
      // // if tbar is not initilized
      // this.tbar = [];
    // } else if (!this.tbar.hasOwnProperty('length')) {
      // // if tbar is not an array but a single item
      // this.tbar = [this.tbar];
    // }
    // this.tbar.push({
      // xtype:'buttongroup',
      // title:'Cutoff',
      // items:[slider , this.sliderNumberField ]
    // });
    // // this.tbar.push(slider);
    // this.tbar.push( {
      // xtype:'textfield',
      // width:10,
      // value:''
    // });
    // add listeners for store
    // this.store.addListener('load', this.addOthers , this);
    // this.store.addListener('load', this.setMessage , this);
    this.store.addListener( 'load', this.setSlider, this );
    this.store.addListener( 'beforeload', this.loadingOn, this );
    this.addListener( 'processed', this.loadingOff, this );
    // this.store.addListener('load', this.setSlider, this);
    // this.store.addListener('load', this.filter , this);
    
    // add listerners to slider
    // this.slider.addListener( 'filtercomplete' , this.loadingOn , this);
    // this.on({ filtercomplete : this.loadingOff, scope: this });
    // this.slider.addListener( 'changecomplete' , this.filter , this);
    // this for the other record
    // othersObj = {
      // 'cvterm_id':0
      // // id : this.othersId
    // };
    this.othersObj[this.countField] = 0;
    this.othersObj[this.nameField] = this.othersName;
    this.othersRec = this.store.getProxy().getModel().create(this.othersObj);
    
    // add filter prop to all items so that the refresh function is not called unless the store is loaded
    for ( i = 0 ; i < this.items.length ; i ++ ){
      var item = this.items[i];
      // this.items.each( function( item ) {
        item.filter = false;
        if ( item.addListener ){
          // item.addListener ( 'beforerefresh' , that.shouldRefresh , item);
          // make sure charts refreshes itself
          item.refresh && item.addListener ( 'beforeshow' , item.refresh , item );
          item.addListener ( 'show' , that.checkCategories , item );
          item.addListener ( 'beforerefresh' , that.checkCategories , item );
          
          //hide loading when component is hidden. problem with laoding on changing view to feature.
          // item.addListener('hide', this.loadingOff , item );
          
        } else {
          item.listeners = item.listeners || {};
          item.listeners.show = that.checkCategories;
          item.listeners.beforerefresh = that.checkCategories;
          item.scope = item;
        }
      // });
     }


    this.listeners = this.listeners || {};
    Ext.apply( this.listeners , {
          render:function ( comp ) {
            comp.store && comp.store.load();
          },
          filtercomplete: function (){
            this.items.each( function( item ) {
              item.filter = true;
            });
          }
    });
 
    Ext.apply(this, {
      tbar:[{
      xtype:'buttongroup',
      title:'Cutoff',
      items:[slider , this.sliderNumberField ,{
      xtype:'button',
      text:'Optimize',
      tooltip:'Set cutoff to minimum permissible level of the current visualization',
      handler:function(){
       that.active.setThreshold( that ); 
      }      
    }]
    }]
      // filter: false
    });

    this.callParent(arguments);
    // this.addPlugin( {
      // ptype:'statusmask',
      // owner: this,
      // store: this.store
    // }
      // Ext.create('CV.ux.StatusMask',{
        // owner: this,
        // store: this.store        
      // }) 
    // );
  },
  loadingOn: function () {
    this.setLoading( true );
  },
  loadingOff: function () {
    // this.redraw();
    this.setLoading ( false );
  },
  // this on the function are individual items of chadopanel 
  shouldRefresh : function ( ){
    if ( !this.filter ) {
      return false;
    }
    return true;
  },
  /*
   * arguments: 
   * item [this] - the children of this container.
   */
  checkCategories: function () {
    if ( this.maxCategories < this.store.getCount() ) {
      this.setLoading( {
        msgCls:'customLoading',
        msg:'I\'m a pie chart and I don\'t see the point of displaying more than '+this.maxCategories+' categories. Please increase the threshold value using the above slider or use the bar graph.'
      } , true);
      // do not render
      return false;
    }
    this.setLoading(false);
    return true;
  },
  addOthers: function ( store, records , success ){
    if ( success ){
      this.store.loadRecords( [ this.othersRec ], {
        addRecords : true
      });
    }
  },
  setFieldLabel : function(slider, newValue) {
    this.threshold = newValue;
    // slider.setFieldLabel(this.fieldValue + newValue);
  },
  setSlider : function( store , records, success ) {
    var max, min, store, slider = this.slider, mid, that = this, myStore;
    if ( success ){
      myStore = this.store;
      myStore.clearFilter(true);
      myStore.remove( [ this.othersRec ] );
      this.othersRec = this.othersRec = this.store.getProxy().getModel().create(this.othersObj);
      if (myStore.getCount() > 0) {
        min = max = myStore.getAt(0).get(this.countField);
        // initialise to the first record's id value.
        myStore.each(function(rec)// go through all the records
        {
            max = Math.max(max, rec.get(that.countField));
            min = Math.min(min, rec.get(that.countField));
        });
        mid = Math.round((min + max ) / 2);
        
        this.setMinValue(min);
        this.setMaxValue(max);
        this.fireEvent('setthreshold');
      }
    }
  },
  filter : function() {
    
    var store = this.store, othersRec = this.othersRec, thresh = this.threshold, that = this, counter = 0, counters = {},ids, i;
    ids = CV.config.ChadoViewer.getOnlyIds();
    
    // initialize counters
    for( i in ids ){
      counters[ ids[i]+' count' ] = 0;
      counters[ ids[i]+' proportion' ] = 0;
    }
    // ids.push( that.countField );
    counters[ that.countField ] = 0;
    // counters[ that.countField ] = 0;
    store.suspendEvents( true );
    // this.loadingOn();
    // othersRec.set(this.countField, 0);
    store.clearFilter(true);
    // console.profile();
    store.filter(function(rec) {
      var count = rec.get(that.countField);
      // if others then display
      if (rec.get(that.nameField) === that.othersName) {
        return true;
      }

      if (count < thresh) {
        for( i in counters ){
           counters[ i ] += rec.get( i );
        }
        // counter += count ;
        return false;
      }
      // console.profileEnd();
      return true;
    });
    // console.profileEnd();
    for( i in counters ){
      othersRec.set( i, Ext.util.Format.number(counters[i],'0.00' ));
    }
    // othersRec.set(that.countField, counter);
    store.add( [ this.othersRec ]);
    store.resumeEvents( );
    // store.fireEvent( 'refresh', store );
    // this.loadingOff();
    this.fireEvent( 'filtercomplete' );

  },
  /**
   * set threshold and re run store filter
   * @param {Object} value
   */
  setThreshold:function( newThres ){
    var value;
    if( newThres !== undefined ){
      this.slider.setValue(newThres);
      value = this.slider.getValue();
      // if(  newThres != this.threshold ) {
        this.setFieldLabel( this.slider , value );
        this.sliderNumberField.suspendEvents();
        this.sliderNumberField.setValue( value );
        this.sliderNumberField.resumeEvents();
        this.filter();
      // }
      this.fireEvent('processed');
    }
  },
  clear:function(){
    this.store.removeAll();
  },
  setValue:function( slider , value ){
    if( value >= this.slider.minValue  ){
      this.setThreshold( value );
    }
  },
  setMaxValue:function( max ){
    this.maxValue = max;
    this.slider.setMaxValue( max );
    this.sliderNumberField.setMaxValue( max );
  },
  setMinValue:function( min ){
    this.minValue = min;
    this.slider.setMinValue( min );
    this.sliderNumberField.setMinValue( min );
  },
  /**
   * reload store
   */
  reload: function( ){
    this.store && this.store.load();
    // propogate reload to child items. Mainly because of Tag Cloud.
    this.items.each(function( item ){
      item.filter = true;
    });
    
  },
  /**
   * show a message if the store is empty
   */
  setMessage:function(){
    if( this.store.count() == 0 ){
      this.el.mask('No entry found in database!','x-mask-loading');
    } else {
      this.el && this.el.unmask();
    }
  }
});