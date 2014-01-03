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
Ext.define('CV.view.MultiViewPanel', {
  extend : 'Ext.panel.Panel',
  alias : 'widget.multiviewpanel',
  active:null,
  initComponent : function() {
    var items = [], menu = {
      items : []
    }, that = this, item, index, title, cycle, handler, focusItem, prependText, slider;

    // get all components and their human friendly names
    if (this.items) {
      for ( index = 0; index < this.items.length; index++) {
        item = this.items[index];
        title = item.menuTitle;
        handler = this.addComp(item);
        menu.items.push({
          text : title,
          handle : handler
        });
        delete item.title;
      }

      // get the first item and make them appear on panel and menu
      menu.items[0].checked = true;
      focusItem = this.items[0];
    }

    prependText = this.prependText || 'View: ';
    delete this.prependText;

    cycle = Ext.create('Ext.button.Cycle', {
      tooltip:'Display the data in different visualization methods',
      prependText : prependText,
      showText : true,
      menu : menu,
      changeHandler : this.changeHandler
    });

    // top toolbar
    if (!this.tbar) {
      // if tbar is not initilized
      this.tbar = [];
    } else if (!this.tbar.hasOwnProperty('length')) {
      // if tbar is not an array but a single item
      this.tbar = [this.tbar];
    }
    this.tbar.push(cycle);

    Ext.apply(this, {
      autoDestroy : false,
      items : [focusItem],
      layout : 'card',
      active: this.items[0]
    });

    this.callParent(arguments);
  },
  // done since we need a local copy of item / comp
  addComp : function(comp) {
    var that = this;
    return function() {
      that.active = comp;
      that.layout.setActiveItem(comp);
      // comp.fireEvent('activate');
    }
  },
  changeHandler : function(button, menuItem) {
    menuItem.handle();
  }
});