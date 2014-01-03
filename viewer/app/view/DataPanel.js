/**
 * A specialized panel which cycles different components on selection from drop down list. 
 * Example usage:
 *
 *     @example
 *     Ext.create('CV.view.DataPanel', {
 *       prependText:'View: ',
 *       items:[{ xtype:'panel',title:'panel1',html:'<h1>This is awesome</h2>'},{ xtype:'panel',title:'panel2'}]
 *     });
 * make sure title property of items objects are set as it is used to display the friendly name.
 */
Ext.define('CV.view.DataPanel',{
  extend:'Ext.panel.Panel',
  alias:'widget.datapanel',
  slider:null,
  countField: 'total',
  initComponent: function () {
    var items = [], menu = { items:[]}, 
     that = this, item, index, title, cycle, handler, focusItem,
     prependText, slider;
    
    // get all components and their human friendly names
    if ( this.items ) {
      for ( index = 0 ; index < this.items.length; index ++ ) {
        item = this.items [ index ];
        title = item.title ;
        handler = this.addComp ( item );
        menu.items.push  ( { text:title , handle: handler  });
        
        delete item.title;
      }
      
      // get the first item and make them appear on panel and menu
      menu.items[0].checked = true;
      focusItem = this.items[0];
    }
//     this.listComp = this.items;
//     delete this.items;

    prependText = this.prependText || 'View: ';
    delete this.prependText;
    
    cycle = Ext.create ( 'Ext.button.Cycle' , {
      prependText : prependText ,
      showText:true,
      menu: menu,
      changeHandler : this.changeHandler
    });

    slider = Ext.create('Ext.slider.Single', {
      width: 200,
      value: 200,
      fieldLabel:'Slider',
      increment: 1
    });
    this.slider = slider;
    // top toolbar
   if ( !this.tbar ) {
     // if tbar is not initilized
     this.tbar = [];
   } else if( !this.tbar.hasOwnProperty('length') ) {
     // if tbar is not an array but a single item
     this.tbar = [ this.tbar ];
   }
   this.tbar.push ( cycle ) ;
   this.tbar.push ( slider ) ;
   
   // add listeners for store
   this.store.addListener( 'load' , this.setSlider , this );
   
    Ext.apply ( this , {
      autoDestroy : false,
      items: [ focusItem ],
      layout:'card'
    });
    this.callParent( arguments );
  },
  // done since we need a local copy of item / comp
  addComp: function ( comp ) {
    var that = this;
    return function () {
      // no need to set autoDestroy to false since container's value is used and is set to false
//       that.removeAll ( );
//       comp.getStore().clearListeners();
//       comp.bindStore ( that.store , true );
//       comp.refresh && comp.refresh();
      that.layout.setActiveItem( comp );
      that.doLayout();
//       comp.redraw && comp.redraw();
    }
  },
  changeHandler : function ( button , menuItem ) {
    menuItem.handle ();
  },
  setSlider: function () {
    var max , min , store, slider = this.slider;
    myStore = this.store ;
    if (myStore.getCount() > 0)
    {
      min = max = myStore.getAt(0).get( this.countField ); // initialise to the first record's id value.
      myStore.each(function(rec) // go through all the records
      {
        max = Math.max(max, rec.get( this.countField ));
        min = Math.min ( min , rec.get( this.countField ));
      });
    }
    slider.setMinValue ( min );
    slider.setMaxValue ( max ); 
  }
})