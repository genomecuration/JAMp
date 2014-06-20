/**
 * The main application viewport, which displays the whole application
 * @extends Ext.Viewport
 */
Ext.define('CV.view.Viewport', {
    extend: 'Ext.Viewport',
    layout: 'fit',
    requires: ['CV.controller.Library','CV.controller.Feature','CV.controller.Help','CV.controller.About','CV.view.about.View','CV.view.help.View','Ext.layout.container.Border','Ext.resizer.Splitter','CV.ux.Router'],
    initComponent: function() {
      var me = this, treeStore, treePanel, gridPanel, gridStore, btns = [], btnTmp = {
        text: '',
        uri: '',
        id: 'Btn'
      };
      
      btns.push( me.createButtonConfig( CV.controller.Library ) );
      btns.push( me.createButtonConfig( CV.controller.Feature ) );
      // do for 
      btns.push( {xtype:'tbfill'} ); 
      btns.push( this.createButtonConfig( CV.controller.About ) );
      btns.push( this.createButtonConfig( CV.controller.Help ) );

      
      Ext.apply(me, {
        hideBorders: true,
        layout:'border',
        
        deferredRender: true,

        items: [ 
          {
            xtype: 'radiogroup',
            region : 'north',
            layout:'hbox',
            width: 127,
            defaultType:'button',
            defaults: {
                scope: this,
                handler: this.onMenuItemClick,
                toggleGroup:'header',
                enableToggle: true,
                allowDepress: false
            },
            items:btns
            // items: [{
                // text: 'Species',
                // uri: 'species',
                // id: 'speciesBtn'
            // },{
                // text: 'Library',
                // uri: 'library',
                // id : 'libraryBtn'
            // }]
        },{
            xtype: 'panel',
            id: 'main_tabpanel',
            region: 'center',
            layout:'card',
            defaults: {closable: true}
            // ,
            // items:['CV.view.library.View','CV.view.species.View']
        }
        ]
      });
      me.callParent(arguments);
    },
    createButtonConfig:function( value ) {
        var btn = {
          text: '',
          uri: '',
          id: 'Btn'
        };
        value = value.prototype;
        btn.name = value.name;
        btn.text = value.text;
        btn.uri = value.uri;
        btn.id = value.uri + btn.id;
        btn.tooltip = value.btnTooltip;
        return btn
    },
    autoLoad : false,
    //listeners 
    onMenuItemClick: function(item)
    {
        CV.ux.Router.redirect(item.uri);
    }
});
