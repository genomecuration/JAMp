Ext.application({
    name: 'CV',
    paths:{
      'CV': 'app',
      'Ext': 'extjs/src',
      'Ext.ux': 'extjs/examples/ux',
      'CV.ux.Router': 'app/ux/Router.js'
    },
    appFolder: 'app',
    controllers: [
        'Library',
        'Feature',
        'Help'//,
        // 'DE'
    ],
    requires:[
      'CV.controller.Feature',
      'CV.controller.Help',
      'CV.controller.Library',
      'CV.controller.DE'
    ],
    autoCreateViewport: true,
    /**
     * flag used to determine if faceting needs to be switched on.
     */
    facets:true,
    launch:function(){
      /* 
        * Override Ext.app.Controller to provide render capability. I believe each application
        * will handle rendering task different (some will render into a viewport, some in tabs, etc...), 
        * so I didn't put this role into Ext.ux.Route responsability.
        */
      Ext.override(Ext.app.Controller, {
          render: function(view)
          {
              // console.profile();
              //take viewport
              var tab, target = Ext.getCmp('main_tabpanel');

              target.setLoading( true );
              // make sure header is highlighted. Important during initialization.
              this.header.toggle( true , false );
              //load view
              if (Ext.isString(view)) {
                  view = this.getView(view).create();
              }
              //hide event to make sure all the modal messages are hidden.
              target.fireHierarchyEvent('hide');
              
              if( target.items.getAt(0) !== view ){
                //if it already exists, remove
                // setting autoDestroy param to false, since we want to reuse the view.
                target.removeAll( false );
                // target.removeAll( true );
  
                //add to viewport
                target.add( view );                
              }              
              target.setLoading( false );
              // console.profileEnd();
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
          beforedispatch: function(uri, match, params)
          {
              console.log('beforedispatch ' + uri);
          },
          dispatch: function(uri, match, params, controller)
          {
              console.log('dispatch ' + uri);
              //TIP: you could automize rendering task here, inside dispatch event
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
      'de':'DE#show'
    }
});