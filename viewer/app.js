Ext.application({
    name: 'CV',
//    paths:{
//      'CV': 'app',
//      'Ext': 'ext/src',
//      'Ext.ux': 'ext/src/ux',
//      'CV.ux.Router': 'app/ux/Router.js'
//    },
    appFolder: 'app',
    controllers: [        'Library',        'Feature',        'Help',        'About'    ],
    requires:[      'CV.controller.Feature',      'CV.controller.Help','CV.controller.About',      'CV.controller.Library',      'CV.ux.Router'    ],
    autoCreateViewport: true,
    /**
     * flag used to determine if faceting needs to be switched on.
     */
    facets:true,
    launch:function(){
	Ext.override(Ext.data.Connection, {
	    timeout: 120000
	});
	Ext.Ajax.timeout = 120000;
	Ext.override(Ext.data.proxy.Ajax, { timeout: 120000 });
	Ext.override(Ext.form.action.Action, { timeout: 120 });

      /* 
        * Override Ext.app.Controller to provide render capability. I believe each application
        * will handle rendering task different (some will render into a viewport, some in tabs, etc...), 
        * so I didn't put this role into Ext.ux.Route responsability.
        */
      Ext.override(Ext.app.Controller, {
          render: function(view)
          {
              var tab, target = Ext.getCmp('main_tabpanel');

              target.setLoading( true );
              this.header.toggle( true , false );
              if (Ext.isString(view)) {
                  view = this.getView(view).create();
              }
              target.fireHierarchyEvent('hide');
              
              if( target.items.getAt(0) !== view ){
                target.removeAll( false );
                target.add( view );                
              }              
              target.setLoading( false );
          }
      });

      /* 
        * Ext.ux.Router provides some events for better controlling
        * dispatch flow
        */ 
      CV.ux.Router.on({
          routemissed: function(uri)
          {
              Ext.Msg.show({
                  title:'Error 404',
                  msg: 'Route not found: ' + uri,
                  buttons: Ext.Msg.OK,
                  icon: Ext.Msg.ERROR
              });
          },
          beforedispatch: function(uri, match, params){},
          dispatch: function(uri, match, params, controller){
//     console.log('dispatch ' + uri);
          }
      });
    },
    routes:{
      '/':'library#show',
      'library/:id':'library#show',
      'library':'library#show',
      'feature':'feature#show',
      'feature/:id':'feature#show',
      'feature/:id/:name':'feature#show',
      'help':'help#show',
      'about':'about#show'
    }
});
