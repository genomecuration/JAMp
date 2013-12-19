/**
JAMPS Viewer

Authors

 Temi Varghese and Alexie Papanicolaou

        CSIRO Ecosystem Sciences
        temi.varghese@csiro.au
        alexie.papanicolaou@csiro.au

Copyright 2012-2014 the Commonwealth Scientific and Industrial Research Organization.
This software is released under the Mozilla Public License v.2.

*/
Ext.define('CV.config.ChadoViewer', {
  singleton : true,
  statics : {
    drupalBase : '',
    baseUrl : 'ws/database.php',
    genomeviewer : {
      url : 'ws/genome.php'
    },
    selectedIds : undefined,
    currentUri : undefined,
    countField: 'total',
    library : {
      tree : {
        extraParams : {
          ds : 'library',
          type : 'tree'
        },
        view : {

        }
      },
      cv : {
        extraParams : {
          ds : 'library',
          type : 'cv',
          id : 0,
          ids: undefined
        },
        ds : 'library'
      },
      graph : {
        vocabulary : {
          id : 0,
          get : 'cv',
          ds : 'library',
          type : 'graph',
          facets : null
        },
        cvterm : {
          id : 0,
          get : 'cv_term',
          cv_id : 0,
          ds : 'library',
          type : 'graph',
          cv_name : '',
          facets : null,
          ids : null
        },
        ds : 'library'
      },
      feature : {
        extraParams : {
          ds : 'library',
          type : 'feature',
          id : 0,
          facets : null
        },
        ds : 'library'
      }
    },
    species : {
      tree : {
        extraParams : {
          ds : 'species',
          type : 'tree'
        }
      },
      cv : {
        extraParams : {
          ds : 'species',
          type : 'cv',
          id : 0
        },
        ds : 'species'
      },
      graph : {
        vocabulary : {
          id : 0,
          get : 'cv',
          ds : 'species',
          type : 'graph',
          facets : null
        },
        cvterm : {
          id : 0,
          get : 'cv_term',
          cv_id : 0,
          cv_name : '',
          ds : 'species',
          type : 'graph',
          facets : null
        },
        ds : ''
      },
      feature : {
        extraParams : {
          ds : 'species',
          type : 'feature',
          id : 0,
          facets : null
        },
        ds : 'species'
      }
    },
    feature : {
      fasta : {
        ds : 'feature',
        type : 'fasta',
        feature_id : 0
      }
    },
    rawColumns : [{
      dataIndex : 'name',
      text : 'Classification',
      type : 'string',
      flex: 1
    }, {
      dataIndex : 'total',
      text : 'Total',
      type : 'integer',
      flex: 1
    }]
  },
  /**
   * @return
   * [20,120]
   */
  getOnlyIds:function(){
    var ids = this.self.selectedIds,
    selected = [] , id;
    // transform: get the selected ids from config
    if ( ids ){
      for( id in ids ){
        selected.push( ids[id].id );
      }
    }
    return selected;
  },
  /**
   * @return
   * ['ae0025','B.anynana_head_nosize']
   */
  getIdsText: function(){
    var ids = this.self.selectedIds,
    selected = [] , id;
    // transform: get the selected ids from config
    if ( ids ){
      for( id in ids ){
        selected.push( ids[id].text );
      }
    }
    return selected;
  },
  /**
   * @return
   * '[{"id":"359","type":"library","text":"AE0025"},{"id":"30","type":"library","text":"B.anynana_wing.0-3d_2-10kb"}]'
   */
  getComaIds:function(){
    var selected = this.getOnlyIds();
    return JSON.stringify( selected ); 
  },
  /*
   * @return
   * { 359: "AE0025",30: "B.anynana_wing.0-3d_2-10kb"}
   */
  getHigherNames:function(){
    var highernames = {}, i, ids = this.self.selectedIds;
    for ( i in  ids ){
      highernames[ ids[i].id ] = ids[i].text; 
    }
    return highernames;
  }
});

/**
 * Plugin that enable filters on the grid header.<br>
 * The header filters are integrated with new Ext4 <code>Ext.data.Store</code> filters.<br>
 * It enables:
 * <ul>
 * <li>Instances of <code>Ext.form.field.Field</code> subclasses that can be used as filter fields into column header</li>
 * <li>New grid methods to control header filters (get values, update, apply)</li>
 * <li>New grid events to intercept plugin and filters events</li>
 * </ul>
 * 
 * The plugins also enables the stateful feature for header filters so filter values are stored with grid status if grid is stateful.<br>
 * 
 * # Enable filters on grid columns
 * The plugin checks the <code>filter</code> attribute that can be included into each column configuration.
 * The value of this attribute can be a <code>Ext.form.field.Field</code> configuration or an array of field configurations to enable more
 * than one filter on a single column.<br>
 * Field <code>readOnly</code> and <code>disabled</code> attributes are managed by the plugin to avoid filter update or filter apply.
 * The filter field configuration also supports some special attributes to control filter configuration:
 * <ul>
 * <li>
 *     <code>filterName</code>: the name of the filter that will be used when the filter is applied to store filters (as <code>property</code> of <code>Ext.util.Filter</code> attribute).
 *     If this attribute is not specified the column <code>dataIndex</code> will be used. <b>NOTE</b>: The filter name must be unique in a grid header. The plugin doesn't support correctly filters
 *     with same name.
 * </li>
 * </ul>
 * On the grid configuration the {@link #headerFilters} attribute is supported. The value must be an object with name-values pairs for filters to initialize. 
 * It can be used to initialize header filters in grid configuration.
 * 
 * # Plugin configuration
 * The plugin supports also some configuration attributes that can be specified when the plugin is created (with <code>Ext.create</code>).
 * These parameters are:
 * <ul>
 * <li>{@link #stateful}: Enables filters save and load when grid status is managed by <code>Ext.state.Manager</code>. If the grid is not stateful this parameter has no effects</li>
 * <li>{@link #reloadOnChange}: Intercepts the special {@link #headerfilterchange} plugin-enabled grid event and automatically reload or refresh grid Store. Default true</li>
 * <li>{@link #ensureFilteredVisible}: If one filter on column is active, the plugin ensures that this column is not hidden (if can be made visible).</li>
 * <li>{@link #enableTooltip}: Enable active filters description tootip on grid header</li>
 * </ul>
 * 
 * # Enabled grid methods
 * <ul>
 *     <li><code>setHeaderFilter(name, value, reset)</code>: Set a single filter value</li>
 *     <li><code>setHeaderFilters(filters, reset)</code>: Set header filters</li>
 *     <li><code>getHeaderFilters()</code>: Set header filters</li>
 *     <li><code>getHeaderFilterField(filterName)</code>: To access filter field</li>
 *     <li><code>resetHeaderFilters()</code>: Resets filter fields calling reset() method of each one</li>
 *     <li><code>clearHeaderFilters()</code>: Clears filter fields</li>
 *     <li><code>applyHeaderFilters()</code>: Applies filters values to Grid Store. The store will be also refreshed or reloaded if {@link #reloadOnChange} is true</li>
 * </ul>
 * 
 * # Enabled grid events
 * <ul>
 *     <li>{@link #headerfilterchange} : fired by Grid when some header filter changes value</li>
 *     <li>{@link #headerfiltersrender} : fired by Grid when header filters are rendered</li>
 *     <li>{@link #beforeheaderfiltersapply} : fired before filters are applied to Grid Store</li>
 *     <li>{@link #headerfiltersapply} : fired after filters are applied to Grid Store</li>
 * </ul>
 * 
 * @author Damiano Zucconi - http://www.isipc.it
 * @version 0.2.0
 */
Ext.define('CV.ux.HeaderFilters',{
    
    ptype: 'gridheaderfilters',
    
    alternateClassName: ['CV.ux.grid.HeaderFilters', 'CV.ux.grid.header.Filters'],
    
               
                                  
                         
      




    grid: null,
    
    fields: null,
    
    containers: null,
    
    storeLoaded: false,
    
    filterFieldCls: 'x-gridheaderfilters-filter-field',
    
    filterContainerCls: 'x-gridheaderfilters-filter-container',
    
    filterRoot: 'data',
    
    tooltipTpl: '{[Ext.isEmpty(values.filters) ? this.text.noFilter : "<b>"+this.text.activeFilters+"</b>"]}<br><tpl for="filters"><tpl if="value != \'\'">{[values.label ? values.label : values.property]} = {value}<br></tpl></tpl>',
    
    lastApplyFilters: null,
    
    bundle: {
        activeFilters: 'Active filters',
        noFilter: 'No filter'
    },
    
  /**
  * @cfg {Boolean} stateful
  * Specifies if headerFilters values are saved into grid status when filters changes.
  * This configuration can be overridden from grid configuration parameter <code>statefulHeaderFilters</code> (if defined).
  * Used only if grid <b>is stateful</b>. Default = true.
  * 
  */
  stateful: true,
    
   /**
   * @cfg {Boolean} reloadOnChange
   * Specifies if the grid store will be auto-reloaded when filters change. The store
   * will be reloaded only if is was already loaded. If the store is local or it doesn't has remote filters
   * the store will be always updated on filters change.
   * 
   */
   reloadOnChange: true,
        
  /**
   * @cfg {Boolean} ensureFilteredVisible
   * If the column on wich the filter is set is hidden and can be made visible, the
   * plugin makes the column visible.
   */
  ensureFilteredVisible: true,
        
  /**
  * @cfg {Boolean} enableTooltip
  * If a tooltip with active filters description must be enabled on the grid header
  */
  enableTooltip: true,
  
  statusProperty: 'headerFilters',
  
  rendered: false,
    
   constructor: function(cfg) 
   {
       if(cfg)
       {
        Ext.apply(this,cfg);
       }
   },
    
   init: function(grid)
   {
     this.grid = grid;
        
        /*var storeProxy = this.grid.getStore().getProxy();
        if(storeProxy && storeProxy.getReader())
        {
            var reader = storeProxy.getReader();
            this.filterRoot = reader.root ? reader.root : undefined;
        }*/
        /**
         * @cfg {Object} headerFilters
         * <b>Configuration attribute for grid</b>
         * Allows to initialize header filters values from grid configuration.
         * This object must have filter names as keys and filter values as values.
         * If this plugin has {@link #stateful} enabled, the saved filters have priority and override these filters.
         * Use {@link #ignoreSavedHeaderFilters} to ignore current status and apply these filters directly.
         */
     if(!grid.headerFilters)
       grid.headerFilters = {};
        
        
     if(Ext.isBoolean(grid.statefulHeaderFilters))
       {
       this.setStateful(grid.statefulHeaderFilters);
       }
        
    this.grid.addEvents(
      /**
        * @event headerfilterchange
        * <b>Event enabled on the Grid</b>: fired when at least one filter is updated after apply.
        * @param {Ext.grid.Panel} grid The grid
        * @param {Ext.util.MixedCollection} filters The applied filters (after apply). Ext.util.Filter objects.
        * @param {Ext.util.MixedCollection} prevFilters The old applied filters (before apply). Ext.util.Filter objects.
        * @param {Number} active Number of active filters (not empty)
        * @param {Ext.data.Store} store Current grid store
        */    
        'headerfilterchange',
        /**
         * @event headerfiltersrender
         * <b>Event enabled on the Grid</b>: fired when filters are rendered
         * @param {Ext.grid.Panel} grid The grid
         * @param {Object} fields The filter fields rendered. The object has for keys the filters names and for value Ext.form.field.Field objects.
         * @param {Object} filters Current header filters. The object has for keys the filters names and for value the filters values.
        */
      'headerfiltersrender',
          /**
         * @event beforeheaderfiltersapply
         * <b>Event enabled on the Grid</b>: fired before filters are confirmed. If the handler returns false no filter apply occurs.
         * @param {Ext.grid.Panel} grid The grid
         * @param {Object} filters Current header filters. The object has for keys the filters names and for value the filters values.
         * @param {Ext.data.Store} store Current grid store
         */
        'beforeheaderfiltersapply',
        /**
         * @event headerfiltersapply
         *<b>Event enabled on the Grid</b>: fired when filters are confirmed.
         * @param {Ext.grid.Panel} grid The grid
         * @param {Object} filters Current header filters. The object has for keys the filters names and for value the filters values.
         * @param {Number} active Number of active filters (not empty)
         * @param {Ext.data.Store} store Current grid store
         */
        'headerfiltersapply'
        );
        
        this.grid.on({
          scope: this,
            columnresize: this.resizeFilterContainer,
            beforedestroy: this.onDestroy,
            beforestatesave: this.saveFilters,
            afterlayout: this.adjustFilterWidth
        });
        
        this.grid.headerCt.on({
            scope: this,
            afterrender: this.renderFilters
        });
        
        this.grid.getStore().on({
            scope: this,
            load: this.onStoreLoad
        });
        
        if(this.reloadOnChange)
        {
            this.grid.on('headerfilterchange',this.reloadStore, this);
        }
        
        if(this.stateful)
        {
            this.grid.addStateEvents('headerfilterchange');
        }
        
        //Enable new grid methods
        Ext.apply(this.grid, 
        {
            headerFilterPlugin: this,
            setHeaderFilter: function(sName, sValue)
            {
                if(!this.headerFilterPlugin)
                    return;
                var fd = {};
                fd[sName] = sValue;
                this.headerFilterPlugin.setFilters(fd);
            },
            /**
             * Returns a collection of filters corresponding to enabled header filters.
             * If a filter field is disabled, the filter is not included.
             * <b>This method is enabled on Grid</b>.
             * @method
             * @return {Array[Ext.util.Filter]} An array of Ext.util.Filter
             */
            getHeaderFilters: function()
            {
                if(!this.headerFilterPlugin)
                    return null;
                return this.headerFilterPlugin.getFilters();
            },
            /**
             * Set header filter values
             * <b>Method enabled on Grid</b>
             * @method
             * @param {Object or Array[Object]} filters An object with key/value pairs or an array of Ext.util.Filter objects (or corresponding configuration).
             * Only filters that matches with header filters names will be set
             */
            setHeaderFilters: function(obj)
            {
                if(!this.headerFilterPlugin)
                    return;
                this.headerFilterPlugin.setFilters(obj);
            },
            getHeaderFilterField: function(fn)
            {
                if(!this.headerFilterPlugin)
                    return;
                if(this.headerFilterPlugin.fields[fn])
                    return this.headerFilterPlugin.fields[fn];
                else
                    return null;
            },
            resetHeaderFilters: function()
            {
                if(!this.headerFilterPlugin)
                    return;
                this.headerFilterPlugin.resetFilters();
            },
            clearHeaderFilters: function()
            {
                if(!this.headerFilterPlugin)
                    return;
                this.headerFilterPlugin.clearFilters();
            },
            applyHeaderFilters: function()
            {
                if(!this.headerFilterPlugin)
                    return;
                this.headerFilterPlugin.applyFilters();
            }
        });
   },
    
   
    
  saveFilters: function(grid, status)
  {
    status[this.statusProperty] = (this.stateful && this.rendered) ? this.parseFilters() : grid[this.statusProperty];
  },
    
    setFieldValue: function(field, value)
    {
      var column = field.column;
        if(!Ext.isEmpty(value))
        {
            field.setValue(value);
            if(!Ext.isEmpty(value) && column.hideable && !column.isVisible() && !field.isDisabled() && this.ensureFilteredVisible)
            {
              column.setVisible(true);
            }
        }
        else
        {
          field.setValue('');
        }
    },
    
    renderFilters: function()
    {
        this.destroyFilters();
        
        this.fields = {};
        this.containers = {};




        var filters = this.grid.headerFilters;
        
        /**
         * @cfg {Boolean} ignoreSavedHeaderFilters
         * <b>Configuration parameter for grid</b>
         * Allows to ignore saved filter status when {@link #stateful} is enabled.
         * This can be useful to use {@link #headerFilters} configuration directly and ignore status.
         * The state will still be saved if {@link #stateful} is enabled.
         */
        if(this.stateful && this.grid[this.statusProperty] && !this.grid.ignoreSavedHeaderFilters)
        {
            Ext.apply(filters, this.grid[this.statusProperty]);
        }
        
        var storeFilters = this.parseStoreFilters();
        filters = Ext.apply(storeFilters, filters);
        
        var columns = this.grid.headerCt.getGridColumns(true);
        for(var c=0; c < columns.length; c++)
        {
            var column = columns[c];
            if(column.filter)
            {
                var filterContainerConfig = {
                    itemId: column.id + '-filtersContainer',
                    cls: this.filterContainerCls,
                    layout: 'anchor',
                    bodyStyle: {'background-color': 'transparent'},
                    border: false,
                    width: column.getWidth(),
                    listeners: {
                        scope: this,
                        element: 'el',
                        mousedown: function(e)
                        {
                            e.stopPropagation();
                        },
                        click: function(e)
                        {
                            e.stopPropagation();
                        },
                        keydown: function(e){
                             e.stopPropagation();
                        },
                        keypress: function(e){
                             e.stopPropagation();
                             if(e.getKey() == Ext.EventObject.ENTER)
                             {
                                 this.onFilterContainerEnter();
                             }
                        },
                        keyup: function(e){
                             e.stopPropagation();
                        }
                    },
                    items: []
                }
                
                var fca = [].concat(column.filter);
                    
                for(var ci = 0; ci < fca.length; ci++)
                {
                    var fc = fca[ci];
                    Ext.applyIf(fc, {
                        filterName: column.dataIndex,
                        fieldLabel: column.text || column.header,
                        hideLabel: fca.length == 1
                    });
                    var initValue = Ext.isEmpty(filters[fc.filterName]) ? null : filters[fc.filterName];
                    Ext.apply(fc, {
                        cls: this.filterFieldCls,
                        itemId: fc.filterName,
                        anchor: '-1'
                    });
                    var filterField = Ext.ComponentManager.create(fc);
                    filterField.column = column;
                    this.setFieldValue(filterField, initValue);
                    this.fields[filterField.filterName] = filterField;
                    filterContainerConfig.items.push(filterField);
                }
                
                var filterContainer = Ext.create('Ext.container.Container', filterContainerConfig);
                filterContainer.render(column.el);
                this.containers[column.id] = filterContainer;
                column.setPadding = Ext.Function.createInterceptor(column.setPadding, function(h){return false});
            }
        }
        
        if(this.enableTooltip)
        {
            this.tooltipTpl = new Ext.XTemplate(this.tooltipTpl,{text: this.bundle});
            this.tooltip = Ext.create('Ext.tip.ToolTip',{
                target: this.grid.headerCt.el,
                //delegate: '.'+this.filterContainerCls,
                renderTo: Ext.getBody(),
                html: this.tooltipTpl.apply({filters: []})
            });        
            this.grid.on('headerfilterchange',function(grid, filters)
            {
                var sf = filters.filterBy(function(filt){
                    return !Ext.isEmpty(filt.value);
                });
                this.tooltip.update(this.tooltipTpl.apply({filters: sf.getRange()}));
            },this);
        }
        
        this.applyFilters();
        this.rendered = true;
        this.grid.fireEvent('headerfiltersrender',this.grid,this.fields,this.parseFilters());
    },
    
    onStoreLoad: function()
    {
        this.storeLoaded = true;
    },
    
    onFilterContainerEnter: function()
    {
        this.applyFilters();
    },
    
    resizeFilterContainer: function(headerCt,column,w,opts)
    {
         if(!this.containers)             return;
        var cnt = this.containers[column.id];
        if(cnt)
        {
            cnt.setWidth(w);
            cnt.doLayout();
        }
    },
    
    destroyFilters: function()
    {
      this.rendered = false;
       if(this.fields)
       {
           for(var f in this.fields)
               Ext.destroy(this.fields[f]);
           delete this.fields;
       }
   
       if(this.containers)
       {
           for(var c in this.containers)
               Ext.destroy(this.containers[c]);
           delete this.containers;
       }
    },
    
    onDestroy: function()
    {
        this.destroyFilters();
        Ext.destroy(this.tooltip, this.tooltipTpl);
    },
    
   adjustFilterWidth: function() 
    {
      if(!this.containers) return;
    var columns = this.grid.headerCt.getGridColumns(true);        
    for(var c=0; c < columns.length; c++) 
    {           
      var column = columns[c];            
      if (column.filter && column.flex) 
      {               
        this.containers[column.id].setWidth(column.getWidth()-1);            
      }
      }
   },
   
    resetFilters: function()
    {
        if(!this.fields)
            return;
        for(var fn in this.fields)
        {
            var f = this.fields[fn];
            if(!f.isDisabled() && !f.readOnly && Ext.isFunction(f.reset))
                f.reset();
        }
        this.applyFilters();
    },
    
    clearFilters: function()
    {
        if(!this.fields)
            return;
        for(var fn in this.fields)
        {
            var f = this.fields[fn];
            if(!f.isDisabled() && !f.readOnly)
                f.setValue('');
        }
        this.applyFilters();
    },
    
    setFilters: function(filters)
    {
        if(!filters)
            return;
        
        if(Ext.isArray(filters))
        {
            var conv = {};
            Ext.each(filters, function(filter){
                if(filter.property)
                {
                    conv[filter.property] = filter.value; 
                }
            });
            filters = conv;
        }
        else if(!Ext.isObject(filters))
        {
            return;
        }




        this.initFilterFields(filters);
        this.applyFilters();
    },
    
    getFilters: function()
    {
        var filters = this.parseFilters();
        var res = new Ext.util.MixedCollection();
        for(var fn in filters)
        {
            var value = filters[fn];
            var field = this.fields[fn];
            res.add(new Ext.util.Filter({
                property: fn,
                value: value,
                root: this.filterRoot,
                label: field.fieldLabel
            }));
        }
        return res;
    },
    
    parseFilters: function()
    {
        var filters = {};
        if(!this.fields)
            return filters;
        for(var fn in this.fields)
        {
            var field = this.fields[fn];
            if(!field.isDisabled() && field.isValid())
                filters[field.filterName] = field.getSubmitValue();
        }
        return filters;
    },
    
    initFilterFields: function(filters)
    {
        if(!this.fields)
            return;




        for(var fn in  filters)
        {
            var value = filters[fn];
            var field = this.fields[fn];
            if(field)
            {
                this.setFieldValue(field, value);
            }
        }
    },
    
    countActiveFilters: function()
    {
        var fv = this.parseFilters();
        var af = 0;
        for(var fn in fv)
        {
            if(!Ext.isEmpty(fv[fn]))
                af ++;
        }
        return af;
    },
    
    parseStoreFilters: function()
    {
        var sf = this.grid.getStore().filters;
        var res = {};
        sf.each(function(filter){
            var name = filter.property;
            var value = filter.value;
            if(name && value)
            {
                res[name] = value;            
            }
        });
        return res;
    },
    
    applyFilters: function()
    {
        var filters = this.parseFilters();
        if(this.grid.fireEvent('beforeheaderfiltersapply', this.grid, filters, this.grid.getStore()) !== false)
        {
            var storeFilters = this.grid.getStore().filters;
            var exFilters = storeFilters.clone();
            var change = false;
            var active = 0;
            for(var fn in filters)
            {
                var value = filters[fn];
                
                var sf = storeFilters.findBy(function(filter){
                    return filter.property == fn;
                });
                
                if(Ext.isEmpty(value))
                {
                    if(sf)
                    {
                        storeFilters.remove(sf);
                        change = true;
                    }
                }
                else
                {
                    var field = this.fields[fn];
                    if(!sf || sf.value != filters[fn])
                    {
                        var newSf = new Ext.util.Filter({
                            root: this.filterRoot,
                            property: fn,
                            value: filters[fn],
                            label: field.fieldLabel
                        });
                        if(sf)
                        {
                            storeFilters.remove(sf);
                        }
                        storeFilters.add(newSf);
                        change = true;
                    }
                    active ++;
                }
            }
            
            this.grid.fireEvent('headerfiltersapply', this.grid, filters, active, this.grid.getStore());
            if(change)
            {
                var curFilters = this.getFilters();
                this.grid.fireEvent('headerfilterchange', this.grid, curFilters, this.lastApplyFilters, active, this.grid.getStore());
                this.lastApplyFilters = curFilters;
            }
        }
    },
    
  reloadStore: function()
  {
    var gs = this.grid.getStore();
    if(this.grid.getStore().remoteFilter)
    {
      if(this.storeLoaded)
      {
        gs.currentPage = 1;
        gs.load();
      }
    }
    else
      {
      if(gs.filters.getCount()) 
         {
        if(!gs.snapshot)
          gs.snapshot = gs.data.clone();
        else
        {
          gs.currentPage = 1;
        }
            gs.data = gs.snapshot.filter(gs.filters.getRange());
            var doLocalSort = gs.sortOnFilter && !gs.remoteSort;
            if(doLocalSort)
        {
          gs.sort();
        }
            // fire datachanged event if it hasn't already been fired by doSort
            if (!doLocalSort || gs.sorters.length < 1) 
            {
              gs.fireEvent('datachanged', gs);
        }
      }
       else
       {
        if(gs.snapshot)
        {
          gs.currentPage = 1;
          gs.data = gs.snapshot.clone();
             delete gs.snapshot;
             gs.fireEvent('datachanged', gs);
        }
      }
    }
  }
});
Ext.define('CV.ux.StoreUtil',{
  changeExtraParams:function( extraParams ){
    if( extraParams ){
      this.getProxy().extraParams = Ext.clone( extraParams );
    }
  }
});

Ext.define('CV.model.Feature', {
  extend :  Ext.data.Model ,
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
Ext.define('CV.store.Features',{
  extend: Ext.data.Store ,
  model:'CV.model.Feature',
                                                                          
  // mixins:['CV.ux.StoreUtil'],
  idProperty:'feature_id',
  autoLoad:false,
  remoteFilter:true,
  remoteSort:true,
  pageSize:35,
  proxy:{
    // url:CV.config.ChadoViewer.baseUrl,
    type:'ajax',
    extraParams:{
      type:'list',
      view:'feature',
      ds:'feature',
      id:null,
      facets:null
    },
    reader:{
      type:'json',
      root:'data'
    }
  },
  constructor:function(){
    Ext.Object.merge(this.proxy , {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  },
  changeExtraParams:function( extraParams ){
    if( extraParams.feature.extraParams ){
      this.getProxy().extraParams = Ext.clone( extraParams.feature.extraParams );
    }
  }
});

Ext.define('CV.view.feature.Grid', {
  extend :  Ext.grid.Panel ,
  alias : 'widget.featuregrid',
  hideHeaders : false,
  title : 'Features',
  store : 'CV.store.Features',
  columnLines : true,
                                                                                 
  // width:'70%',
  emptyText: 'No transcripts found',
  height:250,
  displayInfo:true,
  layout : 'fit',
  initComponent : function() {
    var that = this;
    if ( typeof this.store === 'string') {
      this.store = Ext.create(this.store);
    }
    Ext.apply(this, {
      events:['clearfilter'],
      plugins : [
        // Ext.create('CV.ux.HeaderFilters', {
          // reloadOnChange : false
        // })
        // ,
        Ext.create('CV.ux.Retry',{})
      ],
      bbar : [{
        xtype : 'pagingtoolbar',
        store : this.store,
        displayInfo:true ,
        inputItemWidth:80
      }],
      tbar : [{
        text:'Search',
        tooltip:'Search using transcript identifier', 
        handler:function(){
          Ext.Msg.prompt('Search', 'Please enter a transcript or gene identifier:', function(btn, text){
            if (btn == 'ok' && text){
                // process text value and close...
                that.store.clearFilter(true);
                that.store.filter('name',text);
            }
          });
        }
      },{
        text : 'Clear',
        tooltip:'Clear current transcript or gene selection',
        handler : function(button) {
          var grid = button.up('grid');
          that.store.clearFilter();
          grid.fireEvent('clearfilter');
        }
      }
      ]
    });
    this.callParent(arguments);
  },
  columns : [{
    text : 'Feature id',
    dataIndex : 'feature_id',
    // filter : {
      // xtype : 'numberfield'
    // },
    hidden : true,
    // flex:1
    type : 'numeric'
  }, {
    text : 'Name',
    dataIndex : 'name',
    filter : {
      xtype : 'textfield'
    },
    flex : 1,    
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        msg = '<a href="#feature/' + record.get('feature_id') + '">' + value + '</a> ';
      }
      return msg;
    }
    // type:'string'
  }, {
    text : 'Unique name',
    dataIndex : 'uniquename',
    // filter : {
      // xtype : 'textfield'
    // },
    hidden : true
    // flex:1
    // type:'string'
  }, {
    text : 'Type',
    dataIndex : 'type',
    filter : {
      xtype : 'textfield'
    }
    // flex:1
    // type:'string'
  }, {
    text : 'Genus',
    dataIndex : 'genus',
    filter : {
      xtype : 'textfield'
    },
    // flex:1,
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        var filter = [{"id":record.get('organism_id'),"type":"species","text":value}];
        msg = '<a href="#library/' + encodeURI( JSON.stringify(filter) ) + '">' + value + '</a> ';
      }
      return msg;
    }
  }, {
    text : 'Species',
    dataIndex : 'species',
    filter : {
      xtype : 'textfield'
    },
    // flex:1,
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        var filter = [{"id":record.get('organism_id'),"type":"species","text":value}];
        msg = '<a href="#library/' + encodeURI( JSON.stringify(filter)) + '">' + value + '</a> ';
      }
      return msg;
    }
  },{
    text:'Sequence Length',
    dataIndex:'seqlen',
    sortable:false
  }
  // {
  // text:'Genus',
  // dataIndex:'genus',
  // // flex:1
  // // type:'string'
  // },{
  // text:'Species',
  // dataIndex:'species',
  // renderer:function( value , meta , record ){
  // return '<a href="#species/'+record.get('organism_id')+'"">'+value+'</a> ';
  // }
  // flex:1
  // type:'string'
  // }
  ,{
    text : 'Library name',
    dataIndex : 'libraries',
    sortable : false,
    filter : {
      xtype : 'textfield'
    },
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        var filter = [{"id":record.get('library_id'),"type":"library","text":value}];
        msg = '<a href="#library/' + encodeURI( JSON.stringify(filter)) + '" onclick="return false">' + value + '</a> ';
      }
      return '<div style="white-space:normal !important;">'+ msg+'</div>';
    },
    flex : 1
    // type:'string'
  }, {
    text : 'Source feature',
    sortable : false,
    dataIndex : 'srcuniquename',
    filter : {
      xtype : 'textfield'
    },
    flex : 1
    // type:'string'
  }]//,
  // tbar:[{
  // // dock: 'bottom',
  // text: 'Filters Selected',
  // tooltip: 'Display all active filters',
  // handler: function (button) {
  // var grid = button.up('grid'),
  // data = grid.store.filters,
  // i, name, list = [],
  // msg = '';
  // Ext.Msg.alert('Filter Column Values', list.join(','));
  // }
  // },
  // {
  // // dock: 'bottom',
  // text: 'Clear Filters',
  // handler: function (button) {
  // var grid = button.up('grid');
  // grid.store.clearFilter();
  // }
  // }]
}); 
Ext.define("CV.model.BrowserOption", {
  extend:  Ext.data.Model ,
  fields: [
      {name:'id',mapping: 'linkout_id', type:'integer'},
      {name:'name'},
      {name:'title', mapping:'name'},
      {name: 'description'},
      {name: 'dataset_id'},
      {name: 'type'},
      {name: 'url'},
      {name: 'placeholder'}
  ]
});
Ext.define('CV.store.BrowserOptions', {
                                      
  extend: Ext.data.Store ,
  pageSize: 10,
  model: 'CV.model.BrowserOption',
  proxy: {
      type: 'ajax',
      extraParams:{
        type:'config',
        id:null
      }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.genomeviewer.url
    });
    this.callParent( arguments );
  }
});
Ext.define('CV.view.GenomeBrowser', {
  extend :  Ext.panel.Panel ,
  alias : 'widget.genomebrowser',
                                       
  title: 'Sequence Browser',
  tooltip:'Shows relationship between a gene, transcripts and uniprot hits',
  gheight: 500,
  gwidth: 600,
  canvasXpressPadding:10,
  /**
   * this is the id of canvas div element for this panel.
   */
  canvasId:null,
  canvasData:null,
  canvasOptions:null,
  /**
   * canvasxpress instance
   */
  canvasXpress:null,
  /**
   * store that gets linkouts for this dataset.
   */
  optionsStore: null,
  /**
   * linkout options
   */
  linkoutOptions : null,
  store:'CV.store.GenomeTracks',
  linkOut: true,
  errorMsg:"<b>Error: sequence not provided</b>",
  events:{
    nodeclick:true,
    newoptions:true,
    trackclick:true
  },
  /**
   * canvasxpress options
   */
  options:{
    graphType : 'Genome',
    useFlashIE : true,
    backgroundType : 'gradient',
    backgroundGradient1Color : 'rgb(0,183,217)',
    backgroundGradient2Color : 'rgb(4,112,174)',
    oddColor : 'rgb(220,220,220)',
    evenColor : 'rgb(250,250,250)',
    missingDataColor : 'rgb(220,220,220)'
  },
  initComponent : function() {
    var canvasId = this.id + 'GenomeBrowser';
    
    if( typeof( this.store ) == 'string'){
      this.store = Ext.create( this.store, {});
      this.bindStore( this.store );
    }
    
    Ext.apply(this , {
      canvasId: canvasId,
      plugins:[Ext.create('CV.ux.Retry')],
      html: '<canvas id="'+canvasId+'"  width="'+this.getGWidth() +'" height="'+ this.getGHeight() + '" ></canvas>'     
    });
    this.addListener('render', this.renderCanvas, this );
    this.addListener('resize', this.resizeHandler, this );
    this.addListener('newoptions', this.addOptions, this );
    this.optionsStore = Ext.create('CV.store.BrowserOptions',{
      listeners:{
        load:this.createOptions,
        scope: this
      }
    });
    // bo.load();
    this.callParent(arguments);
    // this.height = this.getHeight();
    // this.width = this.getWidth();
  },
  bindStore: function( store ){
    if( store ){
      this.store = store;
      store.addListener('load', this.onload, this );
    }
  },
  /**
   * this function creates linkout datastructure as understood by canvasxpress
   */
  createOptions:function(){
    var options = {}, flag = false;
    this.optionsStore.each(function( item ){
      var option = item.getData();
      options[ option.name ] = option;
      flag = true;
    });
    this.linkoutOptions = options;
    flag? this.fireEvent( 'newoptions' ):null;
  },
  /**
   * add linkout information to already rendered canvasxpress instances
   */
  addOptions:function(){
    if( this.canvasXpress ){
      this.canvasXpress.data.links = this.linkoutOptions;
    }
  },
  updateHtml:function(){
    this.update('<canvas id="'+this.canvasId+'"  width="'+this.getGWidth() +'" height="'+ this.getGHeight() + '" ></canvas>');
  },
  load:function( id ){
    if ( id ){
      this.store.getProxy().setExtraParam('id',id);
      this.store.load();
    }
  },
  onload:function(store , records, success){
    if( success ){
      var record = records[0];
      this.canvasData = record.get('tracks');
      this.canvasOptions = this.options;
      this.loadCanvas();
    }
  },  
  renderCanvas : function() {
    // this.updateSize();  
    // if( this.canvasData && this.canvasData.tracks[0].data[0].sequence ){
      var that = this;
      if( this.canvasData && this.rendered ){
        this.canvasData.links = {};
        this.canvasData.links = this.linkoutOptions ? this.linkoutOptions : {};
        // this.canvasData.links.uniprot = {
          // url: 'http://www.uniprot.org/uniprot/$GENE$',
          // name: 'Uniprot',
          // title: 'Uniprot',
          // icon: 'http://www.uniprot.org/images/logo_small.gif'
        // };
       this.canvasXpress && this.canvasXpress.destroy( this.canvasXpress );
       this.updateHtml();
       this.canvasXpress = new CanvasXpress( this.canvasId , this.canvasData, this.canvasOptions,
         {
           click:function(o, e, t){
             var links=[],link, params, uniprot;
             that.fireEvent( 'nodeclick', o );
             if( o && (o.length == 1) ){
               switch(o[0].type){
                 case 'box': 
                  that.fireEvent( 'trackclick', o[0] );
                  break;
               }
             }
             if( that.linkOut ){
               uniprot = o[0].id;
               for( var name in that.canvasXpress.data.links ){
                 link = that.canvasXpress.data.links[ name ];
                  if ( link.type == o[0].metaname ){
                    params = {};
                    params[ link.placeholder ] = o[0].id;
                    if ( that.isUniprot( uniprot ) ){
                      links.push({
                         source : link.name,
                         params : params
                      });
                    }
                  }
               }
               links.length && t.showLinkDiv(e, links, 'link');
             }
           }
         });
         if( this.canvasOptions.dataset_id ) {
           this.optionsStore.getProxy().setExtraParam('id' , this.canvasOptions.dataset_id );
           this.optionsStore.load();
         } 
      }
  },
  isUniprot:function( name ){
    var matches;
    name = name || '';
    matches = name.match( /^[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]$/ );
    if( matches && matches.length == 1 ){
      return true;
    }
    return false;
  },  
  loadCanvas:function(){
    this.renderCanvas();
  },
  updateSize:function( width , height ){
    var canvas = Ext.get( this.canvasId );
    canvas.setWidth( width );
    canvas.setHeight( height );
  },
  resizeHandler: function ( ) {
    if( this.rendered ){
      var pRight = this.body.getPadding ( 'r'), pBottom = this.body.getPadding('b');
      this.canvasXpress && this.canvasXpress.draw( this.getWidth() - 2*pRight - 2*this.canvasXpressPadding , this.getHeight() - 2*pBottom - 2*this.canvasXpressPadding);
    }
  },
  getGWidth:function(){
    var pRight = this.body?this.body.getPadding ( 'r'):this.canvasXpressPadding;
    return this.gwidth - 2*pRight - 2*this.canvasXpressPadding;
  },
  getGHeight:function(){
    var pBottom = this.body?this.body.getPadding('b'):this.canvasXpressPadding;
    return this.gheight - 2*pBottom - 2*this.canvasXpressPadding;
  }
});

Ext.define('CV.store.Base', {
  extend: Ext.data.Store ,
  constructor : function(config) {
    this.proxy = this.proxy || {};
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});
Ext.define('CV.store.Fasta',{
  extend: CV.store.Base ,
  fields:['fasta'],
                             
  autoLoad:false,
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'fasta',
        feature_id : 0
    },
    reader:{
      type:'json'
    }
  }
});
Ext.define('CV.view.feature.Fasta',{
  extend: Ext.panel.Panel ,
  alias:'widget.fastacontainer',
                              
  // region:'east',
  title:'Sequence',
  // url to get the fasta file from
  url:null,
  layout:'fit',
  downloadId : 'downloadFasta',
  store: 'CV.store.Fasta',
  // extra params to sent to the server
  extraParams:null,
  /**
   * feature id 
   */
  feature_id : null,
  initComponent:function (){
    this.url = CV.config.ChadoViewer.self.baseUrl;
    this.extraParams = CV.config.ChadoViewer.self.feature.fasta;
    this.get();
    if( typeof ( this.store ) =='string' ){
      this.store = Ext.create(this.store, {});
      this.bindStore( this.store );
    }
    Ext.apply( this , {
      plugins:[Ext.create('CV.ux.Retry')],
      bbar:[{
        xtype: 'box',
        id:this.downloadId,
        autoEl: {tag: 'a', href: this.getQueryString() , html: 'Download'},
        listeners:{
          boxready:this.setDownload,
          scope:this
        }
      }]
    });

    
    this.callParent( arguments );
  },
  
  getQueryString :function() {
    return this.url + '?text=plain&' + Ext.Object.toQueryString( this.store.getProxy().extraParams );
  },
  setDownload:function () {
    var download = Ext.get( this.downloadId );
    download && download.set({ href: this.getQueryString() });
  },
  get:function(){
    if ( this.extraParams.feature_id ){
      Ext.Ajax.request({
        url: this.url ,
        params: this.extraParams,
        success:function( resp ){
          var fasta = resp.responseText;
          this.setFasta( fasta );
        },
        scope:this
      });
    }
  },
  setFasta:function( fasta ){
    this.update( '<pre>'+fasta+'</pre>' );
  },
  load:function( id , gCode ){
    var store = this.store;
    this.feature_id = id;
    
    id && store.getProxy().setExtraParam( 'feature_id', id );
    gCode && store.getProxy().setExtraParam( 'geneticCode', gCode );
    this.setLoading( true );
    store.load();
    this.setDownload();
  },
  getFeature:function( ){
    return this.extraParams.feature_id;
  },
  bindStore:function( store ){
    var that = this;
    store = store || this.store;
    if( store ){
      store.addListener( 'load', function( store, records, success ){
        if( success ){
          var record = records[0];
          that.setFasta( record.get( 'fasta' ) );
        }
        that.setLoading( false );
      }, this );
      store.addListener( 'clear', this.onClear, this );
    }
  },
  onClear: function(  ){
    this.update('');
  }
});
Ext.define('CV.store.Networks',{
  extend :  Ext.data.TreeStore ,
  fields:['text','networkid'],
  proxy : {
    type : 'ajax',
    extraParams : {
      ds : 'feature',
      type : 'network',
      feature_id : ''
    }
  },
  autoLoad:true,
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
      url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent(arguments);
  }
});

Ext.define('CV.view.feature.NetworkList',{
  extend: Ext.tree.Panel ,
                                 
  alias:'widget.networklist',
  store:'CV.store.Networks',
  region:'west',
  split:true,
  width:200,
  height:'100%',
  rootVisible:false,
  collapsed:false,
  expandable:true,
  title:'List of networks',
  emptyText:'No networks found',
  initComponent:function(  ){
    if(typeof ( this.store ) == 'string'){
      this.store = Ext.create(this.store,{});
      this.store.load();
    }
    this.callParent( arguments );
  }
});

Ext.define('CV.view.feature.NetworkCanvas', {
  extend :  Ext.panel.Panel ,
  region:'center',
  alias:'widget.networkcanvas',
  width:"100%",
  height:'100%',
  gheight: 500,
  gwidth: 500,
  canvasXpressPadding:10,
  store:'CV.store.NetworkJson',
  title:'Network diagram',
  html:'Please choose a network id from the list on left',
  /**
   * this is the id of canvas div element for this panel.
   */
  canvasId:null,
  canvasData:null,
  canvasOptions:{
    'backgroundGradient1Color': 'rgb(112,179,222)',
    'backgroundGradient2Color': 'rgb(226,236,248)',
    'gradient': true,
    'graphType': 'Network',
    'nodeFontColor': 'rgb(29,34,43)',
    'showAnimation': true
  },
  /**
   * canvasxpress instance
   */
  canvasXpress:null,
  /**
   * store that gets linkouts for this dataset.
   */
  optionsStore: null,
  /**
   * linkout options
   */
  linkoutOptions : null,
  msg: 'creating',
  linkOut: true,
  errorMsg:"<b>Error: sequence not provided</b>",
  events:{
    nodeclick:true,
    networkempty: true
  },
  initComponent : function() {
    var canvasId = this.id + 'networkcanvas';
    if ( typeof( this.store ) == 'string'){
      this.store = Ext.create(this.store , {
        listeners:{
          load:this.createNetwork,
          clear:this.onClear,
          scope:this
        }
      });
      this.store.load();
    }
    Ext.apply(this , {
      canvasId: canvasId
    });
    this.addListener('render', this.renderCanvas, this );
    this.addListener('resize', this.resizeHandler, this );
    this.callParent(arguments);
  },
  /**
   * this function creates linkout datastructure as understood by canvasxpress
   */
  createOptions:function(){
    var options = {}, flag = false;
    this.optionsStore.each(function( item ){
      var option = item.getData();
      options[ option.name ] = option;
      flag = true;
    });
    this.linkoutOptions = options;
    flag? this.fireEvent( 'newoptions' ):null;
  },
  updateHtml:function(){
    this.update('<canvas id="'+this.canvasId+'"  width="'+this.getGWidth() +'" height="'+ this.getGHeight() + '" ></canvas>');
  },
  renderCanvas : function() {
      var that = this;
      if( this.canvasData  ){
       this.canvasXpress && this.canvasXpress.destroy( this.canvasXpress );
       this.canvasXpress = new CanvasXpress( this.canvasId, this.canvasData, this.canvasOptions ,{
         click:function(o, e, t){
           var id = o.nodes[0]['id'];
           that.fireEvent( 'nodeclick', id );
         }
       });
      }
  },
  loadCanvas:function(){
    this.updateHtml();
    this.renderCanvas();
  },
  updateSize:function( width , height ){
    var canvas = Ext.get( this.canvasId );
    canvas.setWidth( width );
    canvas.setHeight( height );
  },
  resizeHandler: function ( ) {
    if( this.rendered ){
      var pRight = this.body.getPadding ( 'r'), pBottom = this.body.getPadding('b');
      this.canvasXpress && this.canvasXpress.draw( this.getWidth() - 2*pRight - 2*this.canvasXpressPadding , this.getHeight() - 2*pBottom - 2*this.canvasXpressPadding);
    }
  },
  getGWidth:function(){
    var pRight = this.body?this.body.getPadding ( 'r'):this.canvasXpressPadding;
    return this.getWidth() - 2*pRight - 2*this.canvasXpressPadding;
  },
  getGHeight:function(){
    var pBottom = this.body?this.body.getPadding('b'):this.canvasXpressPadding;
    return this.getHeight() - 2*pBottom - 2*this.canvasXpressPadding;
  },
  createNetwork:function( records ){
    var rec = records.getAt(0), network;
    if ( rec ){
      network = rec.get( 'json' );
      if( network ){
        this.canvasData = JSON.parse( network );
        this.rendered && this.loadCanvas(); 
      } else {
        this.update( "<h3>Network too large to display on canvas.</h3>");
        this.fireEvent('networkempty');
      }
    }
  },
  clear:function(){
    this.msg = 'clearing';
    this.store.removeAll();
  },
  onClear:function(){
    this.canvasXpress && this.canvasXpress.destroy( this.canvasXpress );
    this.update('');
  }
});
Ext.define('CV.store.Transcripts', {
  extend: CV.store.Base ,
  fields:['name','dataset_id'],
                             
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'networktranscripts',
        dataset_id: null,
        network_id: null
    },
    reader:{
      type:'json'
    }
  },
  autoLoad:false
});
Ext.define('CV.view.feature.TranscriptList',{
                                    
  extend: Ext.grid.Panel ,
  alias : 'widget.transcriptlist',
  store: 'CV.store.Transcripts',
  title:'Raw data',
  columns:[{
    dataIndex : 'name',
    text : 'Name',
    flex: 1,
    renderer:function( id, grid , model ){
      var dataset_id = model.get('dataset_id');
      return "<a href='#feature/dataset_"+dataset_id+'.'+id+"'>"+ id +"</a>";
    }
  }],
  initComponent:function(){
    if ( typeof this.store == 'string'){
      this.store = Ext.create(this.store);
    }
    this.callParent( arguments );
  }
});
Ext.define("CV.view.feature.NetworkPanel",{
  extend: Ext.container.Container ,
  alias:'widget.networkpanel',
                                                                                                            
  title:'Network',
  layout:'border',
  tooltip:'Shows similar transcripts using a network',
  items:[
    {
      xtype:'networklist'
      
    },{
      xtype:'panel',
      name:'networkviews',
      region:'center',
      layout:{
        type:'accordion'
      },
      items:[
        {
          xtype:'networkcanvas'
        },{
          xtype:'transcriptlist'
        }
      ]
    }
  ]
});
Ext.define('CV.store.Translations', {
  extend: CV.store.Base ,
  fields:['id','name'],
                             
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'translationtable'
    },
    reader:{
      type:'json'
    }
  },
  autoLoad:true
});
Ext.define('CV.view.feature.SequenceView', {
  extend :  Ext.tab.Panel ,
  alias : 'widget.sequenceview',
                                                                                                
  height : '100%',
  width : '80%',
  defaults : {
    // applied to each contained panel
    bodyStyle : 'padding:15px',
    overflowY : 'auto'
  },
  initComponent : function() {
    var store = Ext.create('CV.store.Translations', {
      listeners : {
        load : this.initialiseCombobox,
        scope : this
      }
    });
    this.addListener('beforerender', this.setActive, this);
    Ext.apply(this, {
      items : [{
        xtype : 'panel',
        title : 'Sequence',
        tooltip:'View nucleotide and protein sequence',
        layout : {
          type : 'accordion',
          titleCollapse : true,
          animate : true,
          multi : true
        },
        items : [{
          xtype : 'fastacontainer',
          title : 'Nucleotide',
          id : 'nucleotide',
          downloadId : 'downloadFasta'
        }, {
          xtype : 'fastacontainer',
          store : 'CV.store.ProteinTranslation',
          title : 'Protein',
          id : 'proteintranslation',
          downloadId : 'downloadProtein',
          dockedItems : [{
            xtype : 'combobox',
            store : store,
            name : 'translation',
            valueField : 'id',
            displayField : 'name',
            fieldLabel : 'Protein Translation Table:',
            labelWidth : 150,
            matchFieldWidth : false,
            queryMode : 'local',
            forceSelection : true,
            enableRegEx : true,
            minWidth : 300,
            maxWidth : 400
          }]
        }]
      }, {
        xtype : 'networkpanel'
      }, {
        xtype : 'genomebrowser'
      }]
    });
    this.callParent(arguments);
  },
  setActive : function(data, options) {
    var genomebrowser = this.down('genomebrowser');
    this.setActiveTab(genomebrowser);
  },
  initialiseCombobox : function() {
    var p = this.down('fastacontainer[id=proteintranslation]'), combo = p.down('combobox'), id;
    id = p.store.getProxy().extraParams.geneticCode;
    combo.setValue(id);
  }
});

Ext.define("CV.model.Annotation", {
  extend:  Ext.data.Model ,
  fields: [
      {name: 'cvid'},
      {name: 'cvtermid'},
      {name: 'cvname'},
      {name: 'cvtermname'}
  ]
});
Ext.define('CV.store.Annotations', {
                                   
  extend: Ext.data.Store ,
  pageSize: 10,
  model: 'CV.model.Annotation',
  proxy: {
      type: 'ajax',
      reader: {
          type: 'json',
          root: 'topics',
          totalProperty: 'totalCount'
      },
      extraParams:{
        ds:'annotations',
        ids: null
      }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});
Ext.define('CV.view.feature.Annotations', {
                                    
  extend :  Ext.form.field.ComboBox ,
  alias:'widget.autoannotations',
  store : 'CV.store.Annotations',
  displayField : 'title',
  typeAhead : false,
  hideLabel : true,
  hideTrigger : true,
  minChars:2,
  width:350,
  listConfig : {
    loadingText : 'Searching...',
    emptyText : 'No matching posts found.',

    // Custom rendering template for each item
    getInnerTpl : function() {
      return '<div class="search-item">' + '{cvtermname} <i>{cvtermid}</i>' + '<b style="float:right">{cvname}</b>' + '</div>';
    }
  },
  initComponent:function(){
    if( typeof(this.store) == 'string' ){
      this.store = Ext.create( this.store );
    }
    this.callParent( arguments );
  }
}); 
Ext.define('CV.store.FeatureAnnotations', {
  extend :  Ext.data.TreeStore ,
  proxy : {
    type : 'ajax',
    extraParams : {
      ds : 'feature',
      type : 'annotations',
      feature_id : ''
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
      url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent(arguments);
  }
}); 
Ext.define('CV.view.feature.FeatureAnnotations',{
  extend: Ext.tree.Panel ,
  alias:'widget.featureannotations',
                                           
  title:'Annotations',
  emptyText:'No annotations found',
  expandable:true,
  rootVisible:false,
  collapsed:false,
  bodyStyle:'white-space:normal !important;'
});
Ext.define('CV.view.feature.View', {
  extend :  Ext.container.Container ,
  alias : 'widget.featureview',
                                                                                                                                                                                                                 
  region : 'center',
  layout : 'border',
  hideBorders : true,
  initComponent : function() {
    var store = Ext.create('CV.store.Features'), metaStore, sequenceView, genomeBrowser, combo, treestore;
    var grid = Ext.create('CV.view.feature.Grid', {
      store : store,
      region : 'north',
      split:true
    });
    metaStore = Ext.create('CV.store.FeatureMetadata');
    var metadataPanel = Ext.create('CV.view.feature.CvTermsGrid', {
      store : metaStore
    });
    // fastaView = Ext.create ( 'CV.view.feature.Fasta');
    sequenceView = Ext.create('CV.view.feature.SequenceView', {
      region : 'center',
      disabled : true,
      split:true
    });
    treestore = Ext.create('CV.store.FeatureAnnotations', {

    });
    // treestore.load();
    // combo = Ext.create('CV.view.feature.Annotations',{region:'south'});
    Ext.apply(this, {
      items : [grid, {
        xtype : 'panel',
        region : 'east',
        title:'Metadata',
        collapsible : true,
        closeable : true,
        split:true,
        width:200,
        layout : {
          // layout-specific configs go here
          type : 'accordion',
          titleCollapse : true,
          animate : true,
          activeOnTop : false,
          multi : true
        },
        items : [metadataPanel, {
          xtype : 'featureannotations',
          store : treestore
        }]
      }, sequenceView]
    });
    this.callParent(arguments);
  },
  addGenomeBrowser : function(data, options) {
    var genomeBrowser = Ext.create('CV.view.GenomeBrowser', {
      region : 'south',
      canvasData : data,
      canvasOptions : options
    });
    this.add(genomeBrowser);
  },
  onRemoved : function() {
    this.callParent(arguments);
    var comps = this.query('component'), i;
    for ( i = 0; i < comps.length; i++) {
      comps[i].events.hideMask && comps[i].fireEvent('hideMask');
    }
  },
  onAdded : function() {
    this.callParent(arguments);
    var comps = this.query('component'), i;
    for ( i = 0; i < comps.length; i++) {
      comps[i].events.hideMask && comps[i].fireEvent('displayMask');
    }
  }
});
/*!
 * CV.ux.Router
 * http://github.com/brunotavares/CV.ux.Router
 *
 * Copyright 2012 Bruno Tavares
 * Released under the MIT license
 * Check MIT-LICENSE.txt
 */
 /*
 * @class CV.ux.Router
 * @extend Ext.app.Controller
 * 
 * Enables routing engine for Ext JS 4 MVC architecture. Responsible for parsing URI Token and fire a dispatch action 
 * process. Uses Ext.History internally to detect URI Token changes, providing browser history navigation capabilities.
 * 
 *      Ext.application({
 *          name: 'MyApp',
 *          ...
 *          paths: {
 *              'CV.ux': 'app/ux'
 *          },
 *          routes: {
 *              '/': 'home#index',
 *              'users': 'users#list',
 *              'users/:id/edit': 'users#edit'
 *          }
 *      });
 * 
 * Given the routing example above, we would develop controllers specifying their correspondents actions.
 * 
 *      Ext.define('AM.controller.Users', {
 *          extend: 'Ext.app.Controller',
 *          views: ['user.List', 'user.Edit'],
 *          stores: ['Users'],
 *          models: ['User'],
 *
 *      //actions
 *          list: function()
 *          {
 *              //TODO: show users list
 *          },
 *
 *          edit: function(params)
 *          {
 *              //TODO: show user form
 *          }
 *      });
 *
 * @docauthor Bruno Tavares
 */
Ext.define('CV.ux.Router', {
    singleton: true,
    alternateClassName: 'Ext.Router',
    mixins: {
        observable:  Ext.util.Observable 
    },
               
                            
                             
      
    
    // @private
    constructor: function() {
        var me = this;
        me.ready = false;
        me.routes = [];
        me.mixins.observable.constructor.call(me);
    },
    
    /**
     * Processes the routes for the given app and initializes Ext.History. Also parses
     * the initial token, generally main, home, index, etc.
     * @private
     */
    init: function(app) {
        var me = this,
            history = Ext.History;
        
        if (!app || !app.routes) {
            return;
        }
        
        me.processRoutes(app);
            
        if (me.ready) {
            return;
        }
        me.ready = true;
        
        me.addEvents(
            /**
             * @event routemissed
             * Fires when no route is found for a given URI Token
             * @param {String} uri The URI Token
             */
            'routemissed', 
        
            /**
             * @event beforedispatch
             * Fires before loading controller and calling its action.  Handlers can return false to cancel the dispatch
             * process.
             * @param {String} uri URI Token.
             * @param {Object} match Route that matched the URI Token.
             * @param {Object} params The params appended to the URI Token.
             */
            'beforedispatch', 
        
            /**
            * @event dispatch
            * Fires after loading controller and calling its action.
            * @param {String} uri URI Token.
            * @param {Object} match Route that matched the URI Token.
            * @param {Object} params The params appended to the URI Token.
            * @param {Object} controller The controller handling the action.
            */
            'dispatch'
        );
        
        history.init();
		history.on('change', me.parse, me);
		
        Ext.onReady(function() {
            me.parse(history.getToken());
        });
    },

    /**
     * Convert routes string definied in Ext.Application into structures objects.
     * @private
     */
    processRoutes: function(app) {
        var key,
            appRoutes = app.routes;
        
        for (key in appRoutes) {
            if (appRoutes.hasOwnProperty(key)) {
                this.routeMatcher(app, key, appRoutes[key]);
            }
        }
    },

    /**
     * Creates a matcher for a route config, based on 
     * {@link https://github.com/cowboy/javascript-route-matcher javascript-route-matcher}
     * @private
     */ 
    routeMatcher: function(app, route, rules) {
        var routeObj, action,
            me      = this,
            routes  = me.routes,
            reRoute = route,
            reParam = /([:*])(\w+)/g,
            reEscape= /([-.+?\^${}()|\[\]\/\\])/g,
            names   = [];

        if (rules.regex) {
            routeObj = {
                app         : app,
                route       : route,
                regex       : rules.regex,
                controller  : rules.controller,
                action      : rules.action
            };
            
            delete rules.controller;
            delete rules.action;
            routeObj.rules = rules;
        }
        else {
            reRoute = reRoute.replace(reEscape, "\\$1").replace(reParam, function(_, mode, name) {
                names.push(name);
                return mode === ":" ? "([^/]*)" : "(.*)";
            });
            
            routeObj = {
                app         : app,
                route       : route,
                names       : names,
                matcher     : new RegExp("^" + reRoute + "$"),
                manageArgs  : route.indexOf('?') !== -1
            };
            
            if (Ext.isString(rules)) {
                action = rules.split('#');
                
                routeObj.controller = action[0];
                routeObj.action     = action[1];
                routeObj.rules      = undefined;
            }
            else {
                routeObj.controller = rules.controller;
                routeObj.action     = rules.action;
                
                delete rules.controller;
                delete rules.action;
                routeObj.rules = rules;
            }
        }
        
        //<debug error>
        if (!routeObj.controller && Ext.isDefined(Ext.global.console)) {
            Ext.global.console.error("[CV.ux.Router] Config 'controller' can't be undefined", route, rules);
        }
    
        if (!routeObj.action && Ext.isDefined(Ext.global.console)) {
            Ext.global.console.error("[CV.ux.Router] Config 'action' can't be undefined", route, rules);
        }
        //</debug>
        
        routes.push(routeObj);
    },

    /**
     * Receives a url token and goes trough each of of the defined route objects searching
     * for a match.
     * @private
     */
    parse: function(token) {
        var route, matches, params, names, j, param, value, rules,
            tokenArgs, tokenWithoutArgs,
            me      = this,
            routes  = me.routes,
            i       = 0,
            len     = routes.length;

        token            = token||"";
        tokenWithoutArgs = token.split('?');
        tokenArgs        = tokenWithoutArgs[1];
        tokenWithoutArgs = tokenWithoutArgs[0];
        
        for (; i < len; i++) {
            route = routes[i];
            
            if (route.regex) {
                matches = token.match(route.regex);
                
                if (matches) {
                    matches = matches.slice(1);
                    
                    if (me.dispatch(token, route, matches)) {
                        return { captures: matches };
                    }
                }
            }
            else {
                matches = route.manageArgs ? token.match(route.matcher) : tokenWithoutArgs.match(route.matcher);
                
                // special index rule
                if (tokenWithoutArgs === '' && route.route === '/' || tokenWithoutArgs === '/' && route.route === '') {
                    matches = [];
                }
                
                if (matches) {
                    params  = {};
                    names   = route.names;
                    rules   = route.rules;
                    j       = 0;
                    
                    while (j < names.length) {
                        param = names[j++];
                        value = matches[j];
          
                        if (rules && param in rules && !this.validateRule(rules[param], value)) {
                            matches = false;
                            break;
                        }
                        
                        params[param] = value;
                    }
                    
                    if (tokenArgs && !route.manageArgs) {
                        params = Ext.applyIf(params, Ext.Object.fromQueryString(tokenArgs));
                    }
                    
                    if (matches && me.dispatch(token, route, params)) {
                        return params;
                    }
                }
            }
        }
        
        me.fireEvent('routemissed', token);
        return false;
    },
    
    /**
     * Each route can have rules, and this function ensures these rules. They could be Functions,
     * Regular Expressions or simple string strong comparisson.
     * @private
     */
    validateRule: function(rule, value) {
        if (Ext.isFunction(rule)) {
            return rule(value);
        }
        else if (Ext.isFunction(rule.test)) {
            return rule.test(value);
        }
        
        return rule === value;
    },
    
    /**
     * Tries to dispatch a route to the controller action. Fires the 'beforedispatch' and 
     * 'dispatch' events.
     * @private
     */    
    dispatch: function(token, route, params) {
        var controller,
            me = this;
        
        if (me.fireEvent('beforedispatch', token, route, params) === false) {
            return false;
        }
        
        controller = me.getController(route);
        
        if (!controller) {
            return false;
        }
        
        //<debug error>
        if (!controller[route.action] && Ext.isDefined(Ext.global.console)) {
            Ext.global.console.error("[CV.ux.Router] Controller action not found ", route.controller, route.action);
            return false;
        }
        //</debug>
        
        controller[route.action].call(controller, params, token, route);
        me.fireEvent('dispatch', token, route, params, controller);
        
        return true;
    },
    
    /**
     * Redirects the page to other URI.
     * @param {String} uri URI Token
     * @param {Boolean} [preventDuplicates=true] When true, if the passed token matches the current token
     * it will not save a new history step. Set to false if the same state can be saved more than once
     * at the same history stack location.
     */
    redirect: function(token, preventDup) {
        var history = Ext.History;
        
        if (preventDup !== false && history.getToken() === token) {
            this.parse(token);
        }
        else {
            history.add(token);
        }
    },
    
    /**
     * Utility method that receives a route and returns the  controller instance. 
     * Controller name could be either the regular name (e.g. UserSettings), a 
     * string to be capitalized (e.g. userSettings -> UserSettings) or even separated
     * by namespace  (e.g. user.Settings).
     */
    getController: function(route) {
        var controllerFullName, controllerCapitalized,
            app         = route.app,
            classMgr    = Ext.ClassManager,
            controller  = route.controller;

        // try regular name
        controllerFullName = app.getModuleClassName(controller, 'controller');
        
        if (!classMgr.get(controllerFullName)) {
            
            // try capitalized
            controller          = Ext.String.capitalize(controller);
            controllerFullName  = app.getModuleClassName(controller, 'controller');
            
            if (!classMgr.get(controllerFullName)) {
                
                //<debug>
                if (Ext.isDefined(Ext.global.console)) {
                    Ext.global.console.warn("[CV.ux.Router] Controller not found ", route.controller);
                }
                //</debug>
                
                return false;
            }

            // fix controller name
            route.controller = controller;
        }
        
        return app.getController(controller);
    }
},
function() {
    /*
     * Patch Ext.Application to auto-initialize Router
     */
    Ext.override(Ext.app.Application, {
        enableRouter: true,
        onBeforeLaunch: function() {
            this.callOverridden();
        
            if(this.enableRouter){
                CV.ux.Router.init(this);
            }
        }
    });
});

Ext.define('CV.controller.Feature', {
  extend :  Ext.app.Controller ,
  models : ['CV.model.Feature'],
                                                                                                  
  // stores : ['CV.store.Features'],
  views : ['CV.view.feature.View','CV.view.feature.Grid'],
  // references to views that are controlled by this controller
  refs : [{
    ref : 'feature',
    selector : 'featureview'
  },{
    ref : 'featureGrid',
    selector : 'featureview featuregrid'
  },{
    ref : 'metadataPanel',
    selector : 'featureview cvtermsgrid'
  },{
    ref:'fastaPanel',
    selector :'featureview fastacontainer[id=nucleotide]'
  },{
    ref:'proteinPanel',
    selector :'featureview fastacontainer[id=proteintranslation]'
  },{
    ref:'genomePanel',
    selector :'featureview genomebrowser'
  },{
    ref:'sequencePanel',
    selector :'featureview sequenceview'
  },{
    ref:'annotations',
    selector : 'featureview featureannotations'
  },{
    ref:'networkcanvas',
    selector: 'featureview networkcanvas'
  },{
    ref:'networklist',
    selector: 'featureview networklist'
  },{
    ref:'translation',
    selector:'featureview combobox[name=translation]'
  },{
    ref:'transcriptlist',
    selector: 'featureview transcriptlist'
  },{
    ref:'networkviews',
    selector: 'featureview networkpanel panel[name=networkviews]'
  }],
  // config
  name:'Feature',
  uri : 'feature',
  text:'Gene Details',
  featureId : 'id',
  filterProperty:'name',
  featureIdProp:'feature_id',
  btnTooltip: 'Get all transcripts from the database',
  //   this config decides if tree elements need to be selected
  item : null,
  /**
   * stores dataset id 
   */
  dataset: null,
  /**
   * 
   */
  store: 'CV.store.GenomeTracks',  
  init : function() {
    var treeView, gridView;
    gridView = Ext.create('CV.view.feature.View');
    gridView.show();
    this.control({
      'featureview featuregrid' : {
        //select:this.gridSelect,
        headerfilterchange : this.updateFilter,
        clearfilter: this.clearSelection,
        scope:this
      },
      'viewport > radiogroup > button[name=Feature]' : {
        render : this.headerInit,
        scope : this
      },
      'featureview genomebrowser':{
        trackclick: this.showUniprotGroup,
        nodeclick: this.findTrackId,
        scope: this
      },
      'featureview networklist':{
        select: this.transformSelection,
        scope: this
      },
      'featureview networkcanvas':{
        nodeclick: this.showDetails,
        networkempty: this.rawdataFocus,
        scope: this
      },
      'featureview combobox[name=translation]':{
        select: this.translate
      }
    });
  },
  options:{
    graphType : 'Genome',
    useFlashIE : true,
    backgroundType : 'gradient',
    backgroundGradient1Color : 'rgb(0,183,217)',
    backgroundGradient2Color : 'rgb(4,112,174)',
    oddColor : 'rgb(220,220,220)',
    evenColor : 'rgb(250,250,250)',
    missingDataColor : 'rgb(220,220,220)'//,
    // the below params prevents zoom out
    // setMin : 0,
    // setMax : 30
  },
  /*
   * this config is used to store the button connected to this controller. In this case library. It can later be used to toggle button during render at init.
   */
  header : undefined,
  headerInit : function(btn) {
    this.header = btn;
  },
  show : function(params) {
    var view = this.getFeature(), id = params.id, name = params.name, filter;
    // if ( view.create ){
      // view = view.create();
    // }
    this.render( view );
    // to make a selection
    // if ( typeof id !== 'undefined') {
      switch ( id ){
        case 'filter':
          filter = JSON.parse( decodeURIComponent( name ));
          this.setFilters ( filter.items );
        break;
        default:
          this.treeSelect( id , name);
        break;
      }
    // }
  },
  gridSelect:function( grid , record ){
    // this.treeSelect( record.get('feature_id') , record.get('name'));
    this.updateSelection( record.get('feature_id') , record.get('name') );
  },
  setFilters : function   ( filter ) {
    var grid = this.getFeatureGrid();
    grid.headerFilterPlugin.setFilters( filter );
    grid.store.load();
  },
  updateFilter : function( grid , filters) {
    var jsonFilter = JSON.stringify( filters ), url = this.uri + '/filter/' + jsonFilter;
    CV.ux.Router.redirect(url);
    return false;
  },
  clearSelection:function( id , name ){
    this.getSequencePanel().disable();
    this.updateSelection( id , name);
  },
  updateSelection : function( id, name ) {
    var url = this.uri;
    if( id && name ){
      url += '/' + id;
    }
    CV.ux.Router.redirect(url);
  },
  treeSelect : function(item , name) {
    var grid, panel, filter={}, metadataPanel, fasta, section, annot,nl, protein;
    section = item? 'details': 'start';
    grid = this.getFeatureGrid();
    metadataPanel = this.getMetadataPanel();
    fasta = this.getFastaPanel();
    annot = this.getAnnotations();
    protein = this.getProteinPanel();
    // make sure this is set since it will decide if the node is selected on tree panel.
    // It had to be done this way as some times tree takes long time to load. Hence search returns null.
    this.item = item;
    /**
     * disable network view panel
     */
    this.disableTranscriptNetworkVisualizer();

    this.clear();
    switch( section ){
      case 'details':
          this.getSequencePanel().enable();
          grid.store.clearFilter( true );
          grid.store.filter( this.featureIdProp , item );          

          metadataPanel.store.getProxy().setExtraParam( this.featureIdProp , item );
          metadataPanel.store.load();
          
          annot.store.getProxy().setExtraParam(this.featureIdProp, item);
          annot.store.load();
          
          nl = this.getNetworklist();
          nl.store.getProxy().setExtraParam('dataset_id', this.dataset );
          nl.store.getProxy().setExtraParam('feature_id', item);
          nl.store.load();
          //add track
          this.loadTracks( item );
          
          fasta.load( item );
          protein.load ( item );
      break;
      case 'start':
          grid.store.clearFilter( true );
          grid.store.load();
          metadataPanel.store.removeAll();
          fasta.setFasta('');
      break;
    }
  },
  loadTracks:function( id ){
    var gp = this.getGenomePanel();
    gp.load( id );
  },
  renderTracks:function( tracks  ){
    this.getSequencePanel().addGenomeBrowser(  tracks , this.options );
  },
  showUniprotGroup:function( track ){
    var mp;
    mp = this.getMetadataPanel();
    if( track.grpName && mp.grpFeature && mp.store.count() ){
      mp.grpFeature.collapseAll();
      mp.grpFeature.expand(track.grpName, true);
    }
  },
  transformSelection:function( tree , record ){
    this.loadNetwork( undefined, [ record ] );
  },
  loadNetwork:function(rm, records){
    var rec, id, networkid ;
    if( records.length ){
      networkid = records[0].get('networkid');
      id = this.item;
      if( networkid ){
        this.enableTranscriptNetworkVisualizer();
        this.getNetworklist().getSelectionModel().deselectAll();
        // canvasxpress
        this.getNetworkcanvas().store.getProxy().setExtraParam('network_id', networkid);
        this.getNetworkcanvas().store.getProxy().setExtraParam('dataset_id', id);
        this.getNetworkcanvas().store.load();
        
        // transcript data grid
        this.getTranscriptlist().store.getProxy().setExtraParam('network_id', networkid);
        this.getTranscriptlist().store.getProxy().setExtraParam('dataset_id', id);
        this.getTranscriptlist().store.load();
      }
    }
  },
  showDetails : function( id, dataset ){
    var newItem;
    dataset = dataset || this.dataset;
    dataset = dataset || this.getDataset( this.item );
    newItem = dataset +'.' + id;
    // dataset && this.treeSelect( dataset +'.' + id );
    if( newItem !== this.item ){
      dataset && this.updateSelection( newItem , dataset); 
    }
  },
  getDataset: function( id ){
    var dataset, match;
    id = id || '';
    if ( id ){
      match = id.match(/dataset_([0-9]+)/);
      dataset = match && match[0];
      this.dataset = dataset;
    }
    return dataset;
  },
  translate:function(combo , recs ){
    var pPanel = this.getProteinPanel(), rec = recs[0];
    pPanel.load( null, rec.get('id') );
  },
  /**
   * this function is used to clear all panel of their respective data.
   */
  clear: function(){
    var ncanvas = this.getNetworkcanvas(),
      annotations = this.getAnnotations(),
      nlist = this.getNetworklist(),
      fpanel = this.getFastaPanel(),
      ppanel = this.getProteinPanel(),
      rawdata = this.getTranscriptlist();
    ncanvas.store.removeAll();
    nlist.store.getRootNode().removeAll();
    fpanel.store.removeAll(),
    ppanel.store.removeAll();
    rawdata.store.removeAll();
    /**
     * if childnodes are null extjs 4.2 crashes
     */
    annotations.store.getRootNode().removeAll();
  },
  /**
   * 
   */
  findTrackId:function( track ){
    if ( track[0].type == 'box' ){
      switch( track[0].metaname ){
        case 'transcript':
        case 'gene':
          this.showDetails( track[0].id );
          break;
      }
    }
  },
  rawdataFocus:function(){
    var views = this.getNetworkviews(),
      comp = this.getTranscriptlist();
    comp.rendered && comp.expand();
  },
  disableTranscriptNetworkVisualizer:function(){
    var nv = this.getNetworkviews();
    nv.disable();
  },
  enableTranscriptNetworkVisualizer:function(){
    var nv = this.getNetworkviews();
    nv.enable();
  }
}); 
Ext.define('CV.store.Help',{
  extend: CV.store.Base ,
  fields:['text'],
                             
  autoLoad:false,
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'help'
    },
    reader:{
      type:'json'
    }
  }
});
Ext.define('CV.view.help.View',{
  extend: Ext.panel.Panel ,
                             
  alias:'widget.helpview',
  html:'Loading help...',
  store: 'CV.store.Help',
  autoScroll: true,
  overflowY: 'auto',
  bodyStyle: 'padding:5px',
  initComponent:function(){
    if( typeof ( this.store ) =='string' ){
      this.store = Ext.create(this.store);
      this.store.addListener('load', this.load, this);
      this.store.load();
    }
    this.callParent( arguments );
  },
  load:function( ){
    var html = this.store.getAt(0).get('text');
    this.update( html );
  }
});

Ext.define('CV.controller.Help', {
  extend :  Ext.app.Controller ,
                                                                        
  views : ['CV.view.help.View'],
  refs:[{
    ref : 'help',
    selector : 'helpview'
  }],
  // config
  name:'Help',
  uri : 'help',
  text:'Help',
  init : function() {
    var treeView, gridView;
    gridView = Ext.create('CV.view.help.View');
    gridView.show();
    this.control({
      'viewport > radiogroup > button[text=Help]' : {
        render : this.headerInit,
        scope : this
      }
    });
  },
  /*
   * this config is used to store the button connected to this controller. In this case library. It can later be used to toggle button during render at init.
   */
  header : undefined,
  headerInit : function(btn) {
    this.header = btn;
  },
  show : function(params) {
    var view = this.getHelp();
    this.render( view );
  }
}); 
/**
 * The store used for feature
 */
Ext.define('CV.store.FeatureCount', {
    extend:  Ext.data.Store ,
                                       
    // fields:[],
    // fields:[
    // // {
    	// // name: 'id',
    	// // type: 'integer'
    // // },
    // {
      // name: 'cvterm_id',
      // type: 'integer'
    // },
      // {
        // name:'name' ,
        // type: 'string'
      // },{
        // name: 'total',
        // type: 'integer'
      // },{
        // name: 'c2',
        // type: 'integer'
      // },{
        // name: 'c75',
        // type: 'integer'
      // }
    // ],
    constructor:function( config ){
      Ext.apply( this , config );
      this.addEvents({
        beforedestroy:true
      });
      this.proxy.model = undefined;
      this.callParent( arguments );
    },
    idProperty: 'cvterm_id',
    autoLoad: false,
    autoDestroy:true,
    proxy : {
      url: null,
      extraParams:{
        id:0,
        get:'cv_term',
        cv_id:0,
        filters:undefined,
        facets:undefined
      },
      type:'ajax',
      reader: 'json'
    }//,
    // remoteFilter:true
    // constructor : function ( cfg ){
      // this.proxy ={
      // url: CV.config.CV.baseUrl,
      // extraParams:{
        // id:0,
        // get:'cv_term',
        // cv_id:0
      // },
      // type:'ajax',
      // reader: 'json'
    // };
    // this.initConfig ( cfg );
    // this.callParent( cfg );
    // return this;
  // }
});

Ext.define('CV.model.Facet',{
  extend: Ext.data.Model ,
  fields:['property','cvterm_id','name','cv_id'],
  idProperty:'cvterm_id'
});

Ext.define('CV.store.Facets',{
                              
  extend: Ext.data.Store ,
  model:'CV.model.Facet',
  idProperty:'cvterm_id',
  getFacets:function(){
    var facets=[];
    this.each(function( item ){
      facets.push({property:'cvterm_id',value:item.get('cvterm_id'),'cv_id':item.get('cv_id')});
    });
    return facets;
  }
});

Ext.define('CV.model.CvTerm',{
  extend:  Ext.data.Model ,
                                     
  fields : [
    "dsid",
    "term",
    "vocabulary",
    "value",
    "selection",
    'gr'
  ]
});
Ext.define('CV.store.CvTerms', {
  extend :  Ext.data.Store ,
  model : 'CV.model.CvTerm',
                                                       
  autoLoad:false,
  proxy : {
    type : 'ajax',
    reader : {
      type : 'json',
      successProperty : false,
      totalProperty : false
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this, {
      proxy : {
        url : CV.config.ChadoViewer.self.baseUrl,
        type : 'ajax'
      }
    });
    this.callParent( arguments );
  },
  changeExtraParams:function( extraParams ){
    if( extraParams.cv.extraParams ){
      this.getProxy().extraParams = Ext.clone( extraParams.cv.extraParams );
    }
  }
});

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
      if( r.get('name') != 'Others'){
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

/**
 * TagCloud view makes uses of d3, http://d3js.org/ , and d3 tag cloud created by Jason Davies, http://www.jasondavies.com/word-cloud/.
 * scirpt to add
 * <script src="http://d3js.org/d3.v3.min.js"></script>
 * <script src="lib/d3.layout.cloud.js" ></script>
 */

Ext.define('CV.view.TagCloud',{
  extend: Ext.container.Container ,
  menuTitle:'Tag Cloud',
  alias:'widget.tagcloud',
  mixins:[ CV.ux.ThresholdFinder ],
  // id of the div element containing svg tag of tag cloud
  svgId:null,
  // font size of the smallest tag
  baseSize: 10,
  layout:'fit',
  initialMaxSize : 30,
  countField : 'total',
  /**
   * a flag used to tell if the previous max size calculation was aborted since tag cloud was hidden.
   */
  delayedMaxCalc: false,
  // max font size permitted
  maxSize: 30,
  height:'100%',
  width:'100%',
  /*
   * this variable is used to control the categories rendered on the panel. 
   * If the number of categories are more than maxCategories value, then 
   * rendering is prevented and replaced by a mask.
   * 
   */
  maxCategories:Number.MAX_VALUE,
  /*
   * this variable is checked to see if the component should be redrawnn
   */
  redrawn: true,
  /**
   * a flag to specify if the tag cloud needs redrawing
   */
  delayedRefresh : false,
  /**
   * a flag to specify if the tag cloud needs redrawing
   * TODO: change name of this flag.
   */
  filter:false,
  styleHtmlContent : true,
  initComponent:function( ){
    var max;
    this.svgId = this.id+'svg';
    this.clear();
    this.addEvents('itemclicked');
    // this.addListener('show', this.checkChanged, this);
    this.addListener('show', this.checkAndDraw, this);
    this.addListener('activate', this.delayDraw, this);
    this.addListener('afterrender', this.checkAndDraw , this);
    // this.store.addListener( 'load', this.calcMaxSize , this );
    
    // removed since show event is fired on activation of the component
    // this.addListener( 'activate' , this.delayDraw , this)
    this.callParent( arguments );
    

  },
  calcMaxSize:function(){
    var max;
    //calculate max point\
    if ( !this.isHidden() && this.rendered ){
      max = Math.sqrt( (this.getHeight() * this.getWidth() )/this.totalLetters());
      if( max < this.initialMaxSize ){
        this.maxSize = max;
      }
      this.delayedMaxCalc = false;
    }  else {
      this.delayedMaxCalc = true;
    }  
  },
  totalLetters: function(){
    var words = this.transform( this.getAllRecords( this.store ) ),
      totalLetters = 0;
    Ext.each( words , function ( word ) {
      var letters = 0;
      if( word.text ){
        letters = word.text.length;        
      }
      totalLetters += letters;
    });
    return totalLetters;
  },
  averageWordSize:function(){
    var total = this.totalLetters(),
      count = this.store.getCount();
    return total / count;
  },
  /*
   * call checkandDraw function after a certain delay. this is so that the component is rendered first.
   */  
  delayDraw:function(){
    // var task = new Ext.util.DelayedTask( this.checkAndDraw, this );
    // task.delay( 500 );
    this.delayedMaxCalc = true;
    this.checkAndDraw();
  },
  draw:function(){
    this.setRedrawn();
    this.checkAndDraw();
  },
  setRedrawn:function(){
    this.redrawn = true;
  },  
  checkAndDraw:function(){
    // to check if the this or any of the parent components are hidden.
    if ( this.filter && !( this.isHierarchicallyHidden() || this.isHidden() ) ) {
      this.delayedMaxCalc && this.calcMaxCategory();
      this.drawTags();
      this.filter = false;
    }
  },
  clear:function(){
    this.update('<div id="'+ this.svgId +'" ></div>');
  },
  drawTags:function(){
    var words = this.getAllRecords( this.store ), 
      that = this,  
      fill = d3.scale.category20(),
      width = that.getWidth(), 
      height = that.getHeight();
    this.clear();
    var draw = function( w ){
        d3.select( '#'+that.svgId )
        .append("svg")
        .attr("viewBox","0 0 "+ width +" "+ height)
        .attr("height",height)
        .attr("width",width)
        .append("g")
        .attr("transform", "translate("+width/2+','+height/2+")")
        .selectAll("text")
        .data(w)
        .enter()
        .append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "serif")
        .style("fill", function(d, i) { return fill(i); })
        .style('cursor','pointer')
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")";
        })
        .on('click',function(d){ that.fireEvent('itemclicked', d.storeItem); })
        .text(function(d) { return d.text; });
    };

    words = this.transform ( words, true );
    words = this.normalizeSize( words );

    d3.layout.cloud()
    .size([  this.getWidth() , this.getHeight()])
    .words( words )
    .rotate(function() { return 0; })
    .font("serif")
    .fontSize( function(d) { return d.size; } )
    .on("end", draw)
    .start()
    ;
  },
  getAllRecords:function( store ){
    var arr = [];
    store.each(function(rec) {
          arr.push(rec);
    });
    return arr;
  },
  /**
   * transform name and count to text and size respectively and 
   * only includes top N words, where N is the maximum number of words 
   * that can be displayed 
   */
  transform:function( words, topN ){
    var result=[], key , value, word;
    topN = topN || false;
    for( key in words ){
        value = words [ key ];
        // var word = { text: value.get('name') , size: value.get('count') , storeItem: value };
        word = { text: value.get('name') , size: value.get(this.countField) , storeItem: value };
        result.push ( word );
    }
    result = topN? result.splice( 0 , this.maxCategories) : result ;
    return result;
  },
  /**
   * this function will traverse all the element sizes and normalize it
   */
  normalizeSize:function( words ){
    var max = 0, min = Number.MAX_VALUE, that = this,  normalize = function( item ){
      var normsize;
      // log (0) = infinity and log (1) = 0
      if( item != 0 &&  max != 1 ) {
        return Math.round( that.baseSize + (Math.log(item)/Math.log(max))*that.maxSize ); 
      } else {
        if ( !item ){
          return item;
        } else if ( max ){
          return that.maxSize;
        }
        // return item * ;
        // if ( max != min ){
          // normsize = ( item / (max - min) ) * that.maxSize ; 
        // } else {
          // normsize = that.maxSize ;
        // }
        // return normsize < that.baseSize ? that.baseSize : normSize;
      }
    };
    Ext.each( words , function( item ) {
      if( max < item.size ){
        max = item.size;
      }
      if( min > item.size ){
        min = item.size
      }
    });
    Ext.each( words , function( item ) {
        item.size = normalize( item.size , min );
    });
    return words;    
  },
  setThreshold:function( chadopanel ){
    this.calcMaxCategory();
    this.mixins['CV.ux.ThresholdFinder'].setThreshold.apply( this, [chadopanel] );
    // chadopanel.setThreshold( 1 );
  },
  calcMaxCategory:function(){
        var max;
    //calculate max point\
    if ( !this.isHidden() && this.rendered ){
      this.maxCategories = Math.round( Math.sqrt( (this.getHeight() * this.getWidth() )/ ( this.averageWordSize() * ( this.maxSize/2 + this.baseSize/2 ) ) ) );
      this.delayedMaxCalc = false;
    }  else {
      this.delayedMaxCalc = true;
    }
  }
});
Ext.define('CV.ux.RetryLoader',{
  extend: Ext.LoadMask ,
  msgCls:'customLoading',
  msg:'Connection error! Click here to retry.',
  events:[
    'elementscreated'
  ],
  /**
   * store that is reloaded on click
   */
  linkedStore : null,
  tapLoad:function(){
    this.linkedStore && this.linkedStore.reload();
  },  
  afterRender:function(){
    var el;
    this.callParent( arguments );
    if ( this.rendered ){
      el = this.getTargetEl();
      el && el.on({
         click:this.tapLoad,
         scope: this
      });
    }
  }
});

Ext.define('CV.ux.Retry',{
                                 
  ptype : 'retry',
  owner : null,
  success:true,
  loader:null,
  messages:{
    401:{
      msgCls:'retry',
      msg:'Unauthorized access',
      useTargetEl:true
    },
    'default':{
      msgCls:'customLoading',
      msg:'Loading was unsuccessful. Tap here to retry.',
      useTargetEl:true
    }
  },
  loaderConfig: {
    // autoShow: true,
    msgCls:'customLoading',
    msg:'Loading was unsuccessful. Tap here to retry.',
    useTargetEl:true
  },
  constructor: function( cfg ){
   if(cfg){
    Ext.apply(this,cfg);
   }
  },
  init:function( owner ){
    var store = owner.store;
    this.owner = owner;
    
    // add events
    owner.addEvents( {
     'hideMask' : true,
     'displayMask':true
    });
    
    store && store.on({
      load:this.loadHide,
      scope: this
    });
    store && store.getProxy().on({
      exception:this.onException,
      scope: this
    });
    this.loader = new CV.ux.RetryLoader( owner , this.loaderConfig );
    this.loader.addListener( 'elementscreated' , this.bindLoader , this );
    // add listeners to grid
    owner.on({
      hideMask:this.hide,
      displayMask:this.displayMsg,
      collapse:this.hide,
      expand:this.displayMsg,
      scope:this
    });
  },
  onException:function( proxy, except, operation){
    var resp;
    switch( except.status ){
      case 401:
        this.loaderConfig = this.messages['401'];
      break;
      default: 
        this.loaderConfig = this.messages.default;
    }
    this.success = false;
    this.displayMsg();
  },
  loadHide:function( store , records , success, treeSuccess ){
    this.success = success;
    // a hack for tree store. success is the forth param!!!
    if ( success === null && !treeSuccess){
      this.success = treeSuccess;
    }
    if( this.success ){
      this.hide();
    }
  },
  displayMsg:function(){
    if( !this.success ){
      this.loader = this.owner.setLoading( this.loaderConfig );
      this.loader && this.bindLoader();
    } else {
      this.owner.setLoading(false);
    }
  },  
  reload:function(){
    this.loader && this.loader.hide();
    this.owner.store.load();
  },
  hide:function(){
    this.loader && this.loader.hide();
  },
  show:function(){
   this.loader && this.loader.show();
  },
  bindLoader:function(){
    // this.loader.show();
    var el = this.loader.getTargetEl();
    el && el.on({
       click:this.reload,
       scope: this
    });
  }
});
Ext.define('CV.view.FeatureGrid', {
  extend :  Ext.grid.Panel ,
  alias : 'widget.sequencesgrid',
  hideHeaders : false,
  split : true,
  title : 'Sequences',
  store : 'CV.store.Features',
  columnLines : true,
                                                                        
  initComponent : function() {
    if ( typeof this.store === 'string') {
      this.store = Ext.create(this.store);
    }
    var pagingtoolbar = Ext.create('Ext.toolbar.Paging',{
        store : this.store,
        displayInfo:false,
        inputItemWidth:80
    });
    // this will make paging toolbar update when store records are removed using removeAll function.
    this.store.addListener( 'clear' , pagingtoolbar.onLoad , pagingtoolbar );
    // this.store.on({
      // load:this.retry,
      // scope:this
    // });
    Ext.apply(this, {
      events : ['clearfilter'],
      plugins : [
        Ext.create('CV.ux.Retry',{
          store:this.store
        })
      ],
      bbar : [pagingtoolbar]
    });
    this.callParent(arguments);
  },
  columns : [{
    text : 'Feature id',
    dataIndex : 'feature_id',
    filter : {
      xtype : 'numberfield'
    },
    hidden : true,
    // flex:1,
    // width:100,
    type : 'numeric'
  }, {
    text : 'Name',
    dataIndex : 'name',
    // filter : {
      // xtype : 'textfield'
    // },
    flex : 1,
    renderer : function(value, meta, record) {
      var msg = '';
      if (value) {
        msg = '<a href="#feature/' + record.get('feature_id') + '">' + value + '</a> ';
      }
      return msg;
    }
  } 
  ],
  clear:function(){
    if ( this.store ){
      this.store.removeAll();
    } 
  }
});

Ext.define('CV.view.PieChart', {
  extend: Ext.chart.Chart ,
  alias:'widget.pieview',
  mixins:[ CV.ux.ThresholdFinder ],
  menuTitle : 'Pie Chart',
  animate : true,
  theme : 'Base:gradients',
  height : 400,
  width : 600,
  countField:'total',
  legend : {
    position : 'left'
  },
  initComponent: function(){
  /*
   * this event is fired when a slice is clicked.
   * @@parameter
   * @storeItem
   * model instance of the slice clicked
   */
    this.addEvents('itemclicked');
    this.callParent( arguments );
  },
  // events:[
  // /*
   // * this event is fired when a slice is clicked.
   // * @@parameter
   // * @storeItem
   // * model instance of the slice clicked
   // */
    // 'click'
  // ],
    // autoRender:true,
  overflowY:'auto',
    /*
   * this variable is used to control the categories rendered on the panel. 
   * If the number of categories are more than maxCategories value, then 
   * rendering is prevented and replaced by a mask.
   * 
   */
  maxCategories:10,
  series : [{
    type : 'pie',
    field : 'total',
    showInLegend : true,
    tips : {
      trackMouse : true,
      minWidth: 250,
      renderer : function(storeItem, item) {
        this.setTitle(storeItem.get('name') + ' : ' + storeItem.get(item.series.field));
      }
    },
    highlight : {
      segment : {
        margin : 20
      }
    },
    listeners:{
      itemclick:function( slice ){
        this.chart.fireEvent('itemclicked', slice.storeItem);
      }
    }    
  }]
});
Ext.define('CV.ux.InformationLoader',{
  extend: Ext.LoadMask ,
  msgCls:'information-loader',
  msg:undefined
});

/**
 * Status Mask is used to display important messages on a component. These messages can be
 * * loading status
 * * reload message with appropriate icon and mouse pointer
 * *
 * *
 */
Ext.define('CV.ux.StatusMask', {
  // extend:'Ext.LoadMask',
                                                                                    
  alias : 'plugin.statusmask',
  owner : null,
  msg : 'loading.. please wait :-)',
  useTargetEl : true,
  msgCls : 'customLoading',
  // success:true,
  // loader:null,
  loadFn : null,
  constructor : function(cfg) {
    if (cfg) {
      Ext.apply(this, cfg);
    }
    this.loadFn = this.store instanceof Ext.data.TreeStore ? this.treeLoad : this.gridLoad;

    this.callParent(arguments);
  },
  init : function(owner) {
    var store = this.store, comp = owner;
    // this.loaderConfig.linkedStore = this.store;
    this.owner = comp;

    this.store && this.store.on({
      beforeload : this.setLoading,
      load : this.loadFn,
      scope : this
    });

    // this.loader = Ext.loader()
    // this.bindComponent( comp );
    /**
     * a short circuit to fix a bug in ext js. collapse hierarchy event will now fire.
     */
    comp.addListener('beforecollapse', function() {
      var pCollapse = this.placeholderCollapse;
      if (this.isPlaceHolderCollapse()) {
        this.placeholderCollapse = function() {
          pCollapse.apply(this, arguments);
          this.getHierarchyState().collapsed = true;
          this.fireHierarchyEvent('collapse');
          this.placeholderCollapse = pCollapse;
        }
      }
    }, comp);

    comp.addListener('beforeexpand', function() {
      var pExpand = this.placeholderExpand;
      if (this.isPlaceHolderCollapse()) {
        this.placeholderExpand = function() {
          pExpand.apply(this, arguments);
          this.afterExpand.apply(this, arguments);
          this.placeholderExpand = pExpand;
        }
      }
    }, comp);

    comp.addListener('beforedestroy', this.beforeDestroy, this);
    // this.callParent( arguments );

    // this.owner = owner;

    // this.bindStore( store );

    // // add events
    // owner.addEvents( {
    // 'hideMask' : true,
    // 'displayMask':true
    // });
    //
    // this.loader = new CV.ux.RetryLoader( owner , this.loaderConfig );
    // this.loader.addListener( 'elementscreated' , this.bindLoader , this );
    // // add listeners to grid
    // owner.on({
    // hideMask:this.hide,
    // displayMask:this.displayMsg,
    // collapse:this.hide,
    // expand:this.displayMsg,
    // scope:this
    // });
    // // this.owner.addListener( 'show' , this.displayMsg , this );
    // // this.owner.on({
    // // // collapse:this.displayMsg,
    // // // // cannot use expand as component is not drawn          .
    // // // expand:this.displayMsg,
    // // // // expand: this.onShow,
    // // // afterrender:this.displayMsg,
    // // scope: this
    // // });
  },
  beforeDestroy : function() {
    if (this.owner) {
      this.store.removeListener('beforeload', this.setLoading, this);
      this.store.removeListener('load', this.loadFn, this);
    }
    this.loader && this.loader.destroy();
    // this.callParent ( arguments );
  },
  setLoading : function() {
    this.loader && this.loader.destroy();
    this.owner && this.owner.setLoading(true);
    this.loader = this.owner.loadMask;
  },
  bindComponent : function(comp) {
    if (!comp) {
      return;
    }
    this.callParent(arguments);
  },
  treeLoad : function(store, records, success, treeSuccess) {
    this.storeLoadMsg(treeSuccess);
  },
  gridLoad : function(store, records, success) {
    this.storeLoadMsg(success);
  },
  storeLoadMsg : function(success) {
    this.success = success;
    this.loader && this.loader.destroy();
    if (!success) {
      // this.loaderConfig.msg = 'Grid loading failed!!';
      this.msg = null;
      this.displayMsg();
    } else {
      this.isEmpty();
    }
  },
  isEmpty : function() {
    var empty = false;
    if (this.store) {
      switch ( this.store instanceof Ext.data.TreeStore ) {
        case true:
          if (!this.store.getRootNode().hasChildNodes()) {
            empty = true;
          }
          break;
        case false:
          if (!this.store.getCount()) {
            empty = true;
          }
          break;
      }
      if (empty) {
        this.msg = 'The data set is empty';
        this.showMsg();
      }
    }
  },
  // retry:function( store , records , success, treeSuccess ){
  // this.success = success;
  // // a hack for tree store. success is the forth param!!!
  // if ( success === null && !treeSuccess){
  // this.success = treeSuccess;
  // }
  // this.displayMsg();
  // },
  showMsg : function() {
    this.loader && this.loader.destroy();
    this.loader = new CV.ux.InformationLoader(this.owner, {
      msg : this.msg,
      useTargetEl : true
    });
    this.loader.show();
  },
  displayMsg : function() {
    var config;
    if (!this.success) {
      config = {};
      config.linkedStore = this.store;
      config.useTargetEl = this.useTargetEl;
      this.msg ? config.msg = this.msg : null;
      this.loader = new CV.ux.RetryLoader(this.owner, config);
      this.loader.show();
    }
  },
  reload : function() {
    this.loader && this.loader.destroy();
    this.owner.store.load();
  },
  hide : function() {
    this.loader && this.loader.hide();
  },
  show : function() {
    this.loader && this.loader.show();
    this.callParent(arguments);
  }//,
  // bindLoader:function(){
  // var el = this.loader.getTargetEl();
  // el && el.on({
  // click:this.reload,
  // scope: this
  // });
  // }
});

Ext.define('CV.model.Library' , {
  extend:  Ext.data.Model ,
  fields : ['text', 'id','type'],
                                     
  idProperty:'pid'
});
Ext.define('CV.store.Libraries', {
  extend :  Ext.data.TreeStore ,
  autoLoad : false,
                                
  model : 'CV.model.Library',
  root : {
    text : 'root',
    hidden : true,
    expanded: true,
    children:[]
  },
  proxy:{
    type : 'ajax',
    extraParams : {
          ds : 'library',
          type : 'tree'
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
}); 
Ext.define( 'CV.view.Tree' , {
  extend: Ext.tree.Panel ,
  alias:'widget.dstree',
                                  
  title: 'Catalogue',
  store:'CV.store.Libraries',
  collapsible : true,
  closeable : true,
  selModel:{
    mode:'MULTI'
  },
  split: true,
  // loading message
  // viewConfig:{
    // loadMask:true
  // },
//   store : treeStore,
  region : 'west',
  width:250,
  height:500,
  rootVisible : false,
  expandable:true,
  constructor:function(){
    if( typeof this.store === 'string' ) {
      this.store = Ext.create( this.store );
    }
    // add plugin
    this.callParent( arguments );
  },
  initComponent:function(){
    this.addPlugin(Ext.create('CV.ux.Retry',{
      owner: this,
      store: this.store
    }));
    
    this.callParent( arguments );
  },
  afterRender:function (  ) {
    Ext.Object.merge(this.store.proxy , {
      extraParams : this.ownerCt.dsConfig.tree.extraParams
    });
    this.store.load();
    this.callParent( arguments );
  },
  clear:function(){
    this.getSelectionModel().deselectAll();
  }
});
Ext.define( 'CV.view.CvTabs', {
  extend: Ext.tab.Panel ,
  alias:'widget.cvtabs',
  title:'Summary',
  collapsible:true,
  split:true,
  height:'60%',
  activeItem:0,
  items : [],
  tooltip:'Transcript summary generated with different controlled vocabularies',
  listeners:{
    /**
     * this listener reloads the tab when it becomes active provided the flag is set to true 
     */
    tabchange:function( tabpanel , newTab , oldTab ){
      if ( newTab.reloadStore ) {
        newTab.reload();
        newTab.reloadStore = false;
      }
    }
  },
  clear:function(){
    var i, rev;
    // destroying the items in reverse order since it is likely that unrendered chadopanels will trigger store load when rendered for the first time. 
    for ( i = this.items.items.length ; i > 0 ; i-- ){
      rev = this.items.items[i - 1];
      rev.store.fireEvent( 'beforedestroy' , rev.store );
      rev.destroy();
    }
  },
  /**
   * load store of active tab and delay activatio of others
   */
  reload:function(){
    var active = this.getActiveTab();
    this.items.each(function ( item ) {
      if ( active === item ){
        item.reload();
      }
    });
  },
  constructor:function(){
    this.callParent( arguments );
  },
  initComponent:function(){
    this.addEvents(
      {
        'tabcollapse':true,
        'tabexpand':true
      }
    );
   this.callParent( arguments ); 
  }  
});
Ext.define('CV.view.MetaData', {
  extend :  Ext.grid.Panel ,
  alias : 'widget.metadatapanel',
  title : 'Metadata',
  region : 'center',
  columnLines: true,
  tooltip:'Metadata of selected library or species',
  // height : 400,
  store : 'CV.store.CvTerms',
  columns : [{
    text : 'Key',
    dataIndex : "vocabulary",
    type : 'string',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
  }, {
    text : 'Value',
    dataIndex : "term",
    type : 'string',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
    },{
    text : 'Selection',
    dataIndex : "selection",
    type : 'string',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
  }],
  constructor:function(){
    var store = this.store ;
    if ( Ext.isString(store) ) {
      store = this.store = Ext.create( store );
    }
    // else if ( !store || Ext.isObject ( store )){
//       
    // }
    Ext.Object.merge( this.store.proxy , {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  },  
  afterRender : function() {
    var owner = this.up('dsview'), 
      proxy = this.store.getProxy();
    Ext.Object.merge( this.store.proxy , {
      extraParams : owner.dsConfig.cv.extraParams
    });
    this.callParent( arguments );
    // proxy.buildUrl( CV.config.ChadoViewer.baseUrl );
    // Ext.apply( proxy , {
      // proxy : {
        // extraParams : Ext.clone( owner.dsConfig.cv.extraParams )
      // }
    // });
    // this.store.setProxy({
// 
      // extraParams : Ext.clone( owner.dsConfig.cv.extraParams ),
    // });
  },
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
  filter : function(id, value) {
    if (!this.features || !id) {
      return;
    }
    var features = this.features[0], filter, hash = {};

    filter = this.filters.getFilter(id);
    if (!filter) {
      features.createFilters();
      filter = this.filters.getFilter(id);
      if (!filter) {
        return;
      }
    }
    hash['eq'] = value;
    filter.setValue(hash);
    filter.setActive(true);
  },
  clear : function() {
    this.store.removeAll();
  }
}); 
/**
 * FiltersFeature is a grid {@link Ext.grid.feature.Feature feature} that allows for a slightly more
 * robust representation of filtering than what is provided by the default store.
 *
 * Filtering is adjusted by the user using the grid's column header menu (this menu can be
 * disabled through configuration). Through this menu users can configure, enable, and
 * disable filters for each column.
 *
 * #Features#
 *
 * ##Filtering implementations:##
 *
 * Default filtering for Strings, Numeric Ranges, Date Ranges, Lists (which can be backed by a
 * {@link Ext.data.Store}), and Boolean. Additional custom filter types and menus are easily
 * created by extending {@link Ext.ux.grid.filter.Filter}.
 *
 * ##Graphical Indicators:##
 *
 * Columns that are filtered have {@link #filterCls a configurable css class} applied to the column headers.
 *
 * ##Automatic Reconfiguration:##
 *
 * Filters automatically reconfigure when the grid 'reconfigure' event fires.
 *
 * ##Stateful:##
 *
 * Filter information will be persisted across page loads by specifying a `stateId`
 * in the Grid configuration.
 *
 * The filter collection binds to the {@link Ext.grid.Panel#beforestaterestore beforestaterestore}
 * and {@link Ext.grid.Panel#beforestatesave beforestatesave} events in order to be stateful.
 *
 * ##GridPanel Changes:##
 *
 * - A `filters` property is added to the GridPanel using this feature.
 * - A `filterupdate` event is added to the GridPanel and is fired upon onStateChange completion.
 *
 * ##Server side code examples:##
 *
 * - [PHP](http://www.vinylfox.com/extjs/grid-filter-php-backend-code.php) - (Thanks VinylFox)
 * - [Ruby on Rails](http://extjs.com/forum/showthread.php?p=77326#post77326) - (Thanks Zyclops)
 * - [Ruby on Rails](http://extjs.com/forum/showthread.php?p=176596#post176596) - (Thanks Rotomaul)
 *
 * #Example usage:#
 *
 *     var store = Ext.create('Ext.data.Store', {
 *         pageSize: 15
 *         ...
 *     });
 *
 *     var filtersCfg = {
 *         ftype: 'filters',
 *         autoReload: false, //don't reload automatically
 *         local: true, //only filter locally
 *         // filters may be configured through the plugin,
 *         // or in the column definition within the headers configuration
 *         filters: [{
 *             type: 'numeric',
 *             dataIndex: 'id'
 *         }, {
 *             type: 'string',
 *             dataIndex: 'name'
 *         }, {
 *             type: 'numeric',
 *             dataIndex: 'price'
 *         }, {
 *             type: 'date',
 *             dataIndex: 'dateAdded'
 *         }, {
 *             type: 'list',
 *             dataIndex: 'size',
 *             options: ['extra small', 'small', 'medium', 'large', 'extra large'],
 *             phpMode: true
 *         }, {
 *             type: 'boolean',
 *             dataIndex: 'visible'
 *         }]
 *     };
 *
 *     var grid = Ext.create('Ext.grid.Panel', {
 *          store: store,
 *          columns: ...,
 *          features: [filtersCfg],
 *          height: 400,
 *          width: 700,
 *          bbar: Ext.create('Ext.PagingToolbar', {
 *              store: store
 *          })
 *     });
 *
 *     // a filters property is added to the GridPanel
 *     grid.filters
 */
Ext.define('Ext.ux.grid.FiltersFeature', {
    extend:  Ext.grid.feature.Feature ,
    alias: 'feature.filters',
           
                                    
                                     
                                           
                                        
                                            
                                        
                                           
                                         
      

    /**
     * @cfg {Boolean} autoReload
     * Defaults to true, reloading the datasource when a filter change happens.
     * Set this to false to prevent the datastore from being reloaded if there
     * are changes to the filters.  See <code>{@link #updateBuffer}</code>.
     */
    autoReload : true,
    /**
     * @cfg {Boolean} encode
     * Specify true for {@link #buildQuery} to use Ext.util.JSON.encode to
     * encode the filter query parameter sent with a remote request.
     * Defaults to false.
     */
    /**
     * @cfg {Array} filters
     * An Array of filters config objects. Refer to each filter type class for
     * configuration details specific to each filter type. Filters for Strings,
     * Numeric Ranges, Date Ranges, Lists, and Boolean are the standard filters
     * available.
     */
    /**
     * @cfg {String} filterCls
     * The css class to be applied to column headers with active filters.
     * Defaults to <tt>'ux-filterd-column'</tt>.
     */
    filterCls : 'ux-filtered-column',
    /**
     * @cfg {Boolean} local
     * <tt>true</tt> to use Ext.data.Store filter functions (local filtering)
     * instead of the default (<tt>false</tt>) server side filtering.
     */
    local : false,
    /**
     * @cfg {String} menuFilterText
     * defaults to <tt>'Filters'</tt>.
     */
    menuFilterText : 'Filters',
    /**
     * @cfg {String} paramPrefix
     * The url parameter prefix for the filters.
     * Defaults to <tt>'filter'</tt>.
     */
    paramPrefix : 'filter',
    /**
     * @cfg {Boolean} showMenu
     * Defaults to true, including a filter submenu in the default header menu.
     */
    showMenu : true,
    /**
     * @cfg {String} stateId
     * Name of the value to be used to store state information.
     */
    stateId : undefined,
    /**
     * @cfg {Number} updateBuffer
     * Number of milliseconds to defer store updates since the last filter change.
     */
    updateBuffer : 500,

    // doesn't handle grid body events
    hasFeatureEvent: false,


    /** @private */
    constructor : function (config) {
        var me = this;

        me.callParent(arguments);

        me.deferredUpdate = Ext.create('Ext.util.DelayedTask', me.reload, me);

        // Init filters
        me.filters = me.createFiltersCollection();
        me.filterConfigs = config.filters;
    },

    init: function(grid) {
        var me = this,
            view = me.view,
            headerCt = view.headerCt;

        me.bindStore(view.getStore(), true);

        // Listen for header menu being created
        headerCt.on('menucreate', me.onMenuCreate, me);

        view.on('refresh', me.onRefresh, me);
        grid.on({
            scope: me,
            beforestaterestore: me.applyState,
            beforestatesave: me.saveState,
            beforedestroy: me.destroy
        });

        // Add event and filters shortcut on grid panel
        grid.filters = me;
        grid.addEvents('filterupdate');
    },

    createFiltersCollection: function () {
        return Ext.create('Ext.util.MixedCollection', false, function (o) {
            return o ? o.dataIndex : null;
        });
    },

    /**
     * @private Create the Filter objects for the current configuration, destroying any existing ones first.
     */
    createFilters: function() {
        var me = this,
            hadFilters = me.filters.getCount(),
            grid = me.getGridPanel(),
            filters = me.createFiltersCollection(),
            model = grid.store.model,
            fields = model.prototype.fields,
            field,
            filter,
            state;

        if (hadFilters) {
            state = {};
            me.saveState(null, state);
        }

        function add (dataIndex, config, filterable) {
            if (dataIndex && (filterable || config)) {
                field = fields.get(dataIndex);
                filter = {
                    dataIndex: dataIndex,
                    type: (field && field.type && field.type.type) || 'auto'
                };

                if (Ext.isObject(config)) {
                    Ext.apply(filter, config);
                }

                filters.replace(filter);
            }
        }

        // We start with filters from our config
        Ext.Array.each(me.filterConfigs, function (filterConfig) {
            add(filterConfig.dataIndex, filterConfig);
        });

        // Then we merge on filters from the columns in the grid. The columns' filters take precedence.
        Ext.Array.each(grid.columnManager.getColumns(), function (column) {
            if (column.filterable === false) {
                filters.removeAtKey(column.dataIndex);
            } else {
                add(column.dataIndex, column.filter, column.filterable);
            }
        });
        

        me.removeAll();
        if (filters.items) {
            me.initializeFilters(filters.items);
        }

        if (hadFilters) {
            me.applyState(null, state);
        }
    },

    /**
     * @private
     */
    initializeFilters: function(filters) {
        var me = this,
            filtersLength = filters.length,
            i, filter, FilterClass;

        for (i = 0; i < filtersLength; i++) {
            filter = filters[i];
            if (filter) {
                FilterClass = me.getFilterClass(filter.type);
                filter = filter.menu ? filter : new FilterClass(Ext.apply({
                    grid: me.grid
                }, filter));
                me.filters.add(filter);
                Ext.util.Observable.capture(filter, this.onStateChange, this);
            }
        }
    },

    /**
     * @private Handle creation of the grid's header menu. Initializes the filters and listens
     * for the menu being shown.
     */
    onMenuCreate: function(headerCt, menu) {
        var me = this;
        me.createFilters();
        menu.on('beforeshow', me.onMenuBeforeShow, me);
    },

    /**
     * @private Handle showing of the grid's header menu. Sets up the filter item and menu
     * appropriate for the target column.
     */
    onMenuBeforeShow: function(menu) {
        var me = this,
            menuItem, filter;

        if (me.showMenu) {
            menuItem = me.menuItem;
            if (!menuItem || menuItem.isDestroyed) {
                me.createMenuItem(menu);
                menuItem = me.menuItem;
            }

            filter = me.getMenuFilter();

            if (filter) {
                menuItem.setMenu(filter.menu, false);
                menuItem.setChecked(filter.active);
                // disable the menu if filter.disabled explicitly set to true
                menuItem.setDisabled(filter.disabled === true);
            }
            menuItem.setVisible(!!filter);
            this.sep.setVisible(!!filter);
        }
    },


    createMenuItem: function(menu) {
        var me = this;
        me.sep  = menu.add('-');
        me.menuItem = menu.add({
            checked: false,
            itemId: 'filters',
            text: me.menuFilterText,
            listeners: {
                scope: me,
                checkchange: me.onCheckChange,
                beforecheckchange: me.onBeforeCheck
            }
        });
    },

    getGridPanel: function() {
        return this.view.up('gridpanel');
    },

    /**
     * @private
     * Handler for the grid's beforestaterestore event (fires before the state of the
     * grid is restored).
     * @param {Object} grid The grid object
     * @param {Object} state The hash of state values returned from the StateProvider.
     */
    applyState : function (grid, state) {
        var me = this,
            key, filter;
        me.applyingState = true;
        me.clearFilters();
        if (state.filters) {
            for (key in state.filters) {
                if (state.filters.hasOwnProperty(key)) {
                    filter = me.filters.get(key);
                    if (filter) {
                        filter.setValue(state.filters[key]);
                        filter.setActive(true);
                    }
                }
            }
        }
        me.deferredUpdate.cancel();
        if (me.local) {
            me.reload();
        }
        delete me.applyingState;
        delete state.filters;
    },

    /**
     * Saves the state of all active filters
     * @param {Object} grid
     * @param {Object} state
     * @return {Boolean}
     */
    saveState : function (grid, state) {
        var filters = {};
        this.filters.each(function (filter) {
            if (filter.active) {
                filters[filter.dataIndex] = filter.getValue();
            }
        });
        return (state.filters = filters);
    },

    /**
     * @private
     * Handler called by the grid 'beforedestroy' event
     */
    destroy : function () {
        var me = this;
        Ext.destroyMembers(me, 'menuItem', 'sep');
        me.removeAll();
        me.clearListeners();
    },

    /**
     * Remove all filters, permanently destroying them.
     */
    removeAll : function () {
        if(this.filters){
            Ext.destroy.apply(Ext, this.filters.items);
            // remove all items from the collection
            this.filters.clear();
        }
    },


    /**
     * Changes the data store bound to this view and refreshes it.
     * @param {Ext.data.Store} store The store to bind to this view
     */
    bindStore : function(store) {
        var me = this;

        // Unbind from the old Store
        if (me.store && me.storeListeners) {
            me.store.un(me.storeListeners);
        }

        // Set up correct listeners
        if (store) {
            me.storeListeners = {
                scope: me
            };
            if (me.local) {
                me.storeListeners.load = me.onLoad;
            } else {
                me.storeListeners['before' + (store.buffered ? 'prefetch' : 'load')] = me.onBeforeLoad;
            }
            store.on(me.storeListeners);
        } else {
            delete me.storeListeners;
        }
        me.store = store;
    },

    /**
     * @private
     * Get the filter menu from the filters MixedCollection based on the clicked header
     */
    getMenuFilter : function () {
        var header = this.view.headerCt.getMenu().activeHeader;
        return header ? this.filters.get(header.dataIndex) : null;
    },

    /** @private */
    onCheckChange : function (item, value) {
        this.getMenuFilter().setActive(value);
    },

    /** @private */
    onBeforeCheck : function (check, value) {
        return !value || this.getMenuFilter().isActivatable();
    },

    /**
     * @private
     * Handler for all events on filters.
     * @param {String} event Event name
     * @param {Object} filter Standard signature of the event before the event is fired
     */
    onStateChange : function (event, filter) {
        if (event !== 'serialize') {
            var me = this,
                grid = me.getGridPanel();

            if (filter == me.getMenuFilter()) {
                me.menuItem.setChecked(filter.active, false);
            }

            if ((me.autoReload || me.local) && !me.applyingState) {
                me.deferredUpdate.delay(me.updateBuffer);
            }
            me.updateColumnHeadings();

            if (!me.applyingState) {
                grid.saveState();
            }
            grid.fireEvent('filterupdate', me, filter);
        }
    },

    /**
     * @private
     * Handler for store's beforeload event when configured for remote filtering
     * @param {Object} store
     * @param {Object} options
     */
    onBeforeLoad : function (store, options) {
        options.params = options.params || {};
        this.cleanParams(options.params);
        var params = this.buildQuery(this.getFilterData());
        Ext.apply(options.params, params);
    },

    /**
     * @private
     * Handler for store's load event when configured for local filtering
     * @param {Object} store
     */
    onLoad : function (store) {
        store.filterBy(this.getRecordFilter());
    },

    /**
     * @private
     * Handler called when the grid's view is refreshed
     */
    onRefresh : function () {
        this.updateColumnHeadings();
    },

    /**
     * Update the styles for the header row based on the active filters
     */
    updateColumnHeadings : function () {
        var me = this,
            headerCt = me.view.headerCt;
        if (headerCt) {
            headerCt.items.each(function(header) {
                var filter = me.getFilter(header.dataIndex);
                header[filter && filter.active ? 'addCls' : 'removeCls'](me.filterCls);
            });
        }
    },

    /** @private */
    reload : function () {
        var me = this,
            store = me.view.getStore();

        if (me.local) {
            store.clearFilter(true);
            store.filterBy(me.getRecordFilter());
            store.sort();
        } else {
            me.deferredUpdate.cancel();
            if (store.buffered) {
                store.data.clear();
            }
            store.loadPage(1);
        }
    },

    /**
     * Method factory that generates a record validator for the filters active at the time
     * of invokation.
     * @private
     */
    getRecordFilter : function () {
        var f = [], len, i,
            lockingPartner = this.lockingPartner;

        this.filters.each(function (filter) {
            if (filter.active) {
                f.push(filter);
            }
        });

        // Be sure to check the active filters on a locking partner as well.
        if (lockingPartner) {
            lockingPartner.filters.each(function (filter) {
                if (filter.active) {
                    f.push(filter);
                }
            });
        }

        len = f.length;
        return function (record) {
            for (i = 0; i < len; i++) {
                if (!f[i].validateRecord(record)) {
                    return false;
                }
            }
            return true;
        };
    },

    /**
     * Adds a filter to the collection and observes it for state change.
     * @param {Object/Ext.ux.grid.filter.Filter} config A filter configuration or a filter object.
     * @return {Ext.ux.grid.filter.Filter} The existing or newly created filter object.
     */
    addFilter : function (config) {
        var me = this,
            columns = me.getGridPanel().columnManager.getColumns(),
            i, columnsLength, column, filtersLength, filter;

        
        for (i = 0, columnsLength = columns.length; i < columnsLength; i++) {
            column = columns[i];
            if (column.dataIndex === config.dataIndex) {
                column.filter = config;
            }
        }
        
        if (me.view.headerCt.menu) {
            me.createFilters();
        } else {
            // Call getMenu() to ensure the menu is created, and so, also are the filters. We cannot call
            // createFilters() withouth having a menu because it will cause in a recursion to applyState()
            // that ends up to clear all the filter values. This is likely to happen when we reorder a column
            // and then add a new filter before the menu is recreated.
            me.view.headerCt.getMenu();
        }
        
        for (i = 0, filtersLength = me.filters.items.length; i < filtersLength; i++) {
            filter = me.filters.items[i];
            if (filter.dataIndex === config.dataIndex) {
                return filter;
            }
        }
    },

    /**
     * Adds filters to the collection.
     * @param {Array} filters An Array of filter configuration objects.
     */
    addFilters : function (filters) {
        if (filters) {
            var me = this,
                i, filtersLength;
            for (i = 0, filtersLength = filters.length; i < filtersLength; i++) {
                me.addFilter(filters[i]);
            }
        }
    },

    /**
     * Returns a filter for the given dataIndex, if one exists.
     * @param {String} dataIndex The dataIndex of the desired filter object.
     * @return {Ext.ux.grid.filter.Filter}
     */
    getFilter : function (dataIndex) {
        return this.filters.get(dataIndex);
    },

    /**
     * Turns all filters off. This does not clear the configuration information
     * (see {@link #removeAll}).
     */
    clearFilters : function () {
        this.filters.each(function (filter) {
            filter.setActive(false);
        });
    },

    getFilterItems: function () {
        var me = this;

        // If there's a locked grid then we must get the filter items for each grid.
        if (me.lockingPartner) {
            return me.filters.items.concat(me.lockingPartner.filters.items);
        }

        return me.filters.items;
    },

    /**
     * Returns an Array of the currently active filters.
     * @return {Array} filters Array of the currently active filters.
     */
    getFilterData : function () {
        var items = this.getFilterItems(),
            filters = [],
            n, nlen, item, d, i, len;

        for (n = 0, nlen = items.length; n < nlen; n++) {
            item = items[n];
            if (item.active) {
                d = [].concat(item.serialize());
                for (i = 0, len = d.length; i < len; i++) {
                    filters.push({
                        field: item.dataIndex,
                        data: d[i]
                    });
                }
            }
        }
        return filters;
    },

    /**
     * Function to take the active filters data and build it into a query.
     * The format of the query depends on the {@link #encode} configuration:
     *
     *   - `false` (Default) :
     *     Flatten into query string of the form (assuming <code>{@link #paramPrefix}='filters'</code>:
     *
     *         filters[0][field]="someDataIndex"&
     *         filters[0][data][comparison]="someValue1"&
     *         filters[0][data][type]="someValue2"&
     *         filters[0][data][value]="someValue3"&
     *
     *
     *   - `true` :
     *     JSON encode the filter data
     *
     *         {filters:[{"field":"someDataIndex","comparison":"someValue1","type":"someValue2","value":"someValue3"}]}
     *
     * Override this method to customize the format of the filter query for remote requests.
     *
     * @param {Array} filters A collection of objects representing active filters and their configuration.
     * Each element will take the form of {field: dataIndex, data: filterConf}. dataIndex is not assured
     * to be unique as any one filter may be a composite of more basic filters for the same dataIndex.
     *
     * @return {Object} Query keys and values
     */
    buildQuery : function (filters) {
        var p = {}, i, f, root, dataPrefix, key, tmp,
            len = filters.length;

        if (!this.encode){
            for (i = 0; i < len; i++) {
                f = filters[i];
                root = [this.paramPrefix, '[', i, ']'].join('');
                p[root + '[field]'] = f.field;

                dataPrefix = root + '[data]';
                for (key in f.data) {
                    p[[dataPrefix, '[', key, ']'].join('')] = f.data[key];
                }
            }
        } else {
            tmp = [];
            for (i = 0; i < len; i++) {
                f = filters[i];
                tmp.push(Ext.apply(
                    {},
                    {field: f.field},
                    f.data
                ));
            }
            // only build if there is active filter
            if (tmp.length > 0){
                p[this.paramPrefix] = Ext.JSON.encode(tmp);
            }
        }
        return p;
    },

    /**
     * Removes filter related query parameters from the provided object.
     * @param {Object} p Query parameters that may contain filter related fields.
     */
    cleanParams : function (p) {
        // if encoding just delete the property
        if (this.encode) {
            delete p[this.paramPrefix];
        // otherwise scrub the object of filter data
        } else {
            var regex, key;
            regex = new RegExp('^' + this.paramPrefix + '\[[0-9]+\]');
            for (key in p) {
                if (regex.test(key)) {
                    delete p[key];
                }
            }
        }
    },

    /**
     * Function for locating filter classes, overwrite this with your favorite
     * loader to provide dynamic filter loading.
     * @param {String} type The type of filter to load ('Filter' is automatically
     * appended to the passed type; eg, 'string' becomes 'StringFilter').
     * @return {Function} The Ext.ux.grid.filter.Class
     */
    getFilterClass : function (type) {
        // map the supported Ext.data.Field type values into a supported filter
        switch(type) {
            case 'auto':
              type = 'string';
              break;
            case 'int':
            case 'float':
              type = 'numeric';
              break;
            case 'bool':
              type = 'boolean';
              break;
        }
        return Ext.ClassManager.getByAlias('gridfilter.' + type);
    }
});

Ext.define('CV.view.Facets',{
  extend: Ext.grid.Panel ,
  alias:'widget.facetsgrid',
                               
  title:'Facets',
  collapsed:false,
  collapsible:true,
  height:'50%', 
  // width:300,
  region:'east',
  store:'CV.store.Facets',
  columns:[
  {
    text:'Name',
    dataIndex:'name',
    flex:3
  },{
        xtype:'actioncolumn',
        text:'Action',
        flex:1,
        // width:25,
        align:'center',
        items: [{
            icon: 'css/images/delete.png', 
            tooltip: 'Delete',
            handler: function(grid, rowIndex, colIndex) {
                grid.getStore().removeAt(rowIndex);
            }
        }]
    }
  /**
   * removed since it was not possible to get value for this field. this happened after moving the facet event handler to controller from dsview.
   */
  // ,{
    // text:'Vocabulary',
    // dataIndex:'cv',
    // flex:1
  // }
  ]
});

Ext.define('CV.view.View', {
  extend :  Ext.container.Container ,
  alias : 'widget.dsview',
                                                                                                                                                                                                                                                                                                                                   
  layout : 'border',
  // important params
  treeStore : null,
  vStore : null,
  graphPanel : null,
  dsConfig : null,
  gridStore : null,
  treePanel : null,
  treeid : null,
  /**
   * setting it to true prevents firing of facetchanged event. this is used by contoller when facet grid needs to be cleared.
   */
  changeDataSet : false,
  fieldPath : 'text',
  /*
   * used to store facets
   */
  facets : [],
  /**
   * an instance of CV.store.Facets
   */
  facetsStore : null,
  /**
   * grid that dispalys facets
   */
  facetsGrid : null,
  /**
   * array of all stores that has facet parameters
   */
  facetsParamArray : undefined,
  /**
   * array of the controlled vocabulary panels
   */
  cvPanels : [],
  /**
   * used to store filters
   */
  filters : [],
  events : ['facetschanged', 'configchanged'],

  initComponent : function() {
    this.vStore = Ext.create('CV.store.ControlledVocabularies', {
      autoLoad : false
    });

    Ext.apply(this, {
      items : [{
        xtype : 'dstree',
        region : 'west'
      }, {
        xtype : 'tabpanel',
        region : 'center',
        name: 'annotationpanel',
        items : [{
          xtype : 'cvtabs',
          store: this.vStore,
          plugins : [Ext.create('CV.ux.Retry',{
            store : this.vStore
          })]
        }, {
          xtype : 'metadatapanel'
        }]
      }, {
        xtype : 'panel',
        name: 'statuspanel',
        title:'Status',
        split : true,
        region : 'east',
        width : 400,
        collapsible:true,
        layout : {
          type : 'accordion',
          titleCollapse : true,
          animate : true,
          multi : true
        },
        items : [{
          xtype : 'sequencesgrid',
          collapsed : false
        }, {
          xtype : 'panel',
          title : 'Search terms',
          collapsed : false,
          bodyStyle : 'padding:15px',
          items : [{
            xtype : 'autoannotations',
            store : 'CV.store.Annotations'//,
          }]
        }, {
          xtype : 'facetsgrid',
          store : 'CV.store.Facets'
        }]
      }]
    });
    this.callParent(arguments);
    this.facetsParamArray = new Ext.util.MixedCollection();
  },
  afterRender : function() {
    var me = this, treeStore, treePanel, gridPanel, gridStore, bioStore, vStore, rec, graphPanel, sequencePanel = this.down('sequencesgrid'), metadataPanel = this.down('metadatapanel');
    //
    vStore = this.vStore;
    this.graphPanel = this.down('cvtabs');
    vStore.getProxy().url = CV.config.ChadoViewer.self.baseUrl;
    vStore.getProxy().extraParams = this.dsConfig.graph.vocabulary;
    this.vStore = vStore;
    vStore.addListener('load', function(store, records, success) {
      if (success) {
        me.addPanel();
      }
    });
    this.treePanel = this.down('dstree');
    this.treeStore = this.treePanel.store;
    this.gridStore = metadataPanel.store;
    this.facetsParamArray.add(sequencePanel.store);
    this.addListener('configchanged', sequencePanel.store.changeExtraParams, sequencePanel.store);
    this.addListener('configchanged', vStore.changeExtraParams, vStore);
    this.addListener('configchanged', this.gridStore.changeExtraParams, this.gridStore);

    this.facetsStore = this.down('facetsgrid').store;
    this.facetsStore.addListener({
      load : this.facetsUpdate,
      datachanged : this.facetsUpdate,
      clear : function() {
        this.updateFacetsParam();
        !this.changeDataSet && this.fireEvent('facetschanged');
      },
      scope : this
    });
    this.facetsGrid = this.down('facetsgrid');
    this.facetsGrid.addDocked({
      xtype : 'button',
      text : 'Clear Facets',
      dock : 'bottom',
      handler : me.clearSelection,
      scope : me
    });
    me.callParent(arguments);
  },
  facetsUpdate : function(store, records, success) {
    this.updateFacetsParam();
    !this.changeDataSet && this.fireEvent('facetschanged');
  },
  refine : function() {
    this.vStore.getProxy().setExtraParam('filters', JSON.stringify(this.filters));
    this.vStore.getProxy().setExtraParam('facets', JSON.stringify(this.facets));
    this.vStore.load();

  },
  removeFacetStore : function(store) {
    this.facetsParamArray.remove(store);
  },
  updateExtraParam : function(param, value, stores) {
    stores.each(function(item) {
      var proxy = item.getProxy();
      proxy && proxy.setExtraParam(param, value);
    });
  },
  updateFacetsParam : function() {
    this.updateExtraParam('facets', JSON.stringify(this.facetsStore.getFacets()), this.facetsParamArray);
  },
  updateFilter : function(grid, newFilters) {
    this.filters = grid.getStore().filters.items;
    this.refine();
  },
  clearSelection : function() {
    this.clearFacets();
  },
  clearFacets : function(silent) {
    silent = silent || false;
    this.facetsStore.removeAll();
  },
  select : function(id) {
    if ( typeof id === "undefined") {
      return;
    }
  },
  selectNode : function() {
    var node;
    node = this.treeStore.getById(this.treeid);
    if (node) {
      this.treePanel.expandPath(node.getPath(this.fieldPath), this.fieldPath);
      this.treePanel.getSelectionModel().select(node);

      this.treeStore.hasListener('load') && this.treeStore.removeListener('load', this.selectNode, this);
    }
  },
  setConfig : function(config) {
    if (config) {
      this.dsConfig = config;
      // fire event?
      this.fireEvent('configchanged', config);
    }
  },
  setDS : function(id) {
    var node;

    id = this.convertToInt(id);
    this.treeid = id;

    if (!this.treeStore.isLoading()) {
    } else {
    }

    // load grid store
    this.gridStore.getProxy().setExtraParam('id', id);
    this.gridStore.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());
    this.gridStore.load();

    this.vStore.removeAll();
    this.vStore.getProxy().setExtraParam('id', id);
    this.vStore.load();

  },
  convertToInt : function(id) {
    if (!isNaN(id)) {
      return parseInt(id);
    }
  },
  loadStore : function(facetsStore) {
    this.getProxy().setExtraParam('facets', Ext.JSON.encode(facetsStore.getFacets()));
    this.load();
  },
  clearGraphPanel : function() {
    var tempStore = this.graphPanel.items.getAt(0), tempStore = tempStore ? tempStore.store : null;
    this.graphPanel.disable();
    this.graphPanel.removeAll(true);
    this.graphPanel.enable();
  },
  visibleColumns : function(fields) {
    var columns = Ext.clone(CV.config.ChadoViewer.self.rawColumns), i, field;
    for (i in fields ) {
      field = fields[i];
      columns.splice(1, 0, {
        dataIndex : field['id'] + ' proportion',
        text : field['text'] + ' proportion',
        flex : 1
      });
      columns.splice(1, 0, {
        dataIndex : field['id'] + ' count',
        text : field['text'],
        flex : 1
      });
    }
    return columns;
  },
  addPanel : function() {
    var tabs = [], prev;
    this.clearGraphPanel();
    // cv

    this.vStore.each(function(rec, index) {
      var s, dataPanel, proxy, fields = [{
        name : 'cvterm_id',
        type : 'auto'
      }, {
        name : 'name',
        type : 'string'
      }, {
        name : 'total',
        type : 'integer'
      }, {
        name : 'highername',
        type : 'object',
        defaultValue : CV.config.ChadoViewer.getHigherNames()
      }, {
        name : 'cv_id',
        type : 'auto'
      }], selected = CV.config.ChadoViewer.getOnlyIds(), id, columnSchema = {
        name : undefined,
        type : 'integer',
        text : undefined
      }, column;
      this.newFields = [];
      for (id in selected ) {
        column = Ext.clone(columnSchema);
        column.name = selected[id] + " count";
        this.newFields.push(column);
        fields.push(column);

        column = Ext.clone(columnSchema);
        column.name = selected[id] + " proportion";
        column.type = 'number';
        this.newFields.push(column);
        fields.push(column);
      }
      s = Ext.create('CV.store.FeatureCount', {
        fields : fields,
        listeners : {
          beforedestroy : this.removeFacetStore,
          scope : this
        }
      });
      //update facetArrayParam
      this.facetsParamArray.add(s);
      s.getProxy().url = CV.config.ChadoViewer.self.baseUrl;
      // this is done since extra params instance is same for all store instances CV.store.FeatureCount.
      s.getProxy().extraParams = Ext.clone(this.dsConfig.graph.cvterm);
      s.getProxy().setExtraParam('id', rec.get('dsid'));
      s.getProxy().setExtraParam('cv_id', rec.get('cv_id'));
      s.getProxy().setExtraParam('cv_name', rec.get('name'));
      s.getProxy().setExtraParam('get', rec.get('get'));
      s.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());
      dataPanel = this.createTab(s, rec);

      tabs.push(dataPanel);
    }, this);
    this.graphPanel.add(tabs);
    this.graphPanel.setActiveTab(0);
    this.cvPanels = tabs;
  },
  loadingOn : function() {
    this.setLoading(true);
  },
  loadingOff : function(store, records, success) {
    this.setLoading(false);
  },
  refreshDsview : function() {
    var that = this;
    this.graphPanel.items.each(function(item) {
      item.active.reloadStore = false;
      item.items.each(function(i) {
        if (i != item.active) {
          i.reloadStore = true;
        }
      });
    });
  },
  isDefferedLoad : function() {
    var active = this.graphPanel.getActiveTab();
    this.graphPanel.items.each(function(item) {
      if (active != item) {
        item.reloadStore = true;
      } else {
        item.reloadStore = false;
      }
    });
  },
  createTab : function(bioStore, rec) {
    var columns, tab, titles=[],title, oldTitles, index, tag = Ext.create('CV.view.TagCloud', {
      store : bioStore,
      listeners : {
        beforeshow : function() {
          this.setThreshold(tab);
        }
      }
    });
    /**
     * gets titles and adds proportions
     */
    oldTitles =CV.config.ChadoViewer.getIdsText();
    for( index in oldTitles ){
      title = oldTitles[ index ];
      titles.push(title+' (count)');
      titles.push(title + ' (percentage)');
    }
    columns = this.visibleColumns(CV.config.ChadoViewer.self.selectedIds);
    var filtersCfg = {
      ftype : 'filters',
      autoReload : false,
      local : true,
      filters : [{
        type : 'string',
        dataIndex : 'name'
      }]
    };
    columns[0].filter = {
      xtype : 'textfield'
    };
    if (!this.flag) {
      this.flag = true;
    }

    tab = Ext.create('CV.view.ChadoPanel', {
      title : rec.get('title'),
      layout : 'fit',
      record : rec,
      store : bioStore,
      height : 400,
      plugins : [Ext.create('CV.ux.Retry', {
        store : bioStore
      })],
      listeners : {
        setthreshold : function() {
          this.active.setThreshold(this);
        }
      },
      autoDestroy : false,
      items : [tag, Ext.create('CV.view.BarChart', {
        store : bioStore,
        yField : CV.config.ChadoViewer.getOnlyIds(),
        titles : titles,
        listeners : {
          beforeactivate : function() {
            this.setThreshold(tab);
          }
        }
      }), Ext.create('CV.view.PieChart', {
        xtype : 'pieview',
        store : bioStore,
        listeners : {
          beforeactivate : function() {
            this.setThreshold(tab);
          }
        }
      }), Ext.create('CV.view.RawData', {
        xtype : 'rawdata',
        store : bioStore,
        columns : columns,
        features : [filtersCfg],
        listeners : {
          /**
           * added this code in controller. faceting now can be switched on or off.
           */
          beforeactivate : function() {
            this.setThreshold(tab);
          }
        },
        setThreshold : function(chadopanel) {
          chadopanel.setThreshold(chadopanel.minValue);
        }
      })]
    });
    return tab;
  },
  onRemoved : function() {
    this.callParent(arguments);
    var comps = this.query('component'), i;
    for ( i = 0; i < comps.length; i++) {
      comps[i].events.hideMask && comps[i].fireEvent('hideMask');
    }
  },
  onAdded : function() {
    this.callParent(arguments);
    var comps = this.query('component'), i;
    for ( i = 0; i < comps.length; i++) {
      comps[i].events.hideMask && comps[i].fireEvent('displayMask');
    }
  }
});
Ext.define('CV.view.library.View', {
  extend :  CV.view.View ,
  alias : 'widget.libraryview',
                                     
  initComponent : function() {
   var me = this;
   this.dsConfig = CV.config.ChadoViewer.self.library;
   me.callParent(arguments);
  }
}); 
Ext.define('CV.controller.Library', {
  extend :  Ext.app.Controller ,
  models : [],
  stores : ['CV.store.FeatureCount', 'CV.store.Facets', 'CV.store.CvTerms', 'CV.store.Features'],
  views : ['CV.view.library.View'],
                                                                                                                                                                 
  /*
   * libraryView will store the instance of the library view
   */
  libraryView : 'CV.view.library.View',
  // references to views that are controlled by this controller
  refs : [{
    ref : 'lib',
    selector : 'libraryview'//,
    //autoCreate : true
  }, {
    ref : 'tree',
    selector : 'libraryview dstree'
  }, {
    ref : 'sequencesGrid',
    selector : 'libraryview sequencesgrid'//,
    //autoCreate : true
  }, {
    ref : 'graphPanel',
    selector : 'libraryview cvtabs'
  }, {
    ref : 'metadataPanel',
    selector : 'libraryview metadatapanel'//,
    //autoCreate : true
  }, {
    ref : 'dsview',
    selector : 'libraryview dsview'//,
    // autoCreate : true
  }, {
    ref : 'cvtabs',
    selector : 'libraryview cvtabs'
  }, {
    ref : 'statuspanel',
    selector : 'libraryview panel[name=statuspanel]'
  }, {
    ref : 'annotationpanel',
    selector : 'libraryview tabpanel[name=annotationpanel]'
  },{
    ref: 'autoannotations',
    selector:'libraryview autoannotations'
  }],
  // config
  name : 'Library',
  text:'Protein Annotations',
  uri : 'library',
  libraryId : 'id',
  btnTooltip: 'Get a summary of transcripts based on experiments',
  //   this config decides if tree elements need to be selected
  item : null,
  init : function() {
    var treeView, gridView, controller = this;
    this.control({
      'libraryview dstree' : {
        // select:this.treeSelect,
        selectionchange: this.multiSelectUri,
        // select : this.updateUri,
        // load : this.selectNode
        load : this.selectNodes
      },
      'viewport radiogroup button[name=Library]' : {
        render : this.headerInit,
        scope : this
      },
      // 'libraryview rawdatapanel' : {
        // selectionchange : this.cvtermFilter,
        // scope : this
      // },
      'libraryview' : {
        facetschanged : this.onFacetsChanged
      },
      'libraryview chadopanel' : {
        filtercomplete : this.onFilterComplete
      }
    });
    if (CV.app.facets) {
      this.control({
        'libraryview rawdatapanel' : {
          selectionchange : function(rowmodel, recs) {
            if (recs.length) {
              controller.graphSelection(recs[0]);
            }
          }
        },
        'libraryview pieview' : {
          itemclicked : this.graphSelection,
          scope : this
        },
        'libraryview libraryBar' : {
          itemclicked : this.graphSelection,
          scope : this
        },
        'libraryview tagcloud' : {
          itemclicked : this.graphSelection,
          scope : this
        },
        'libraryview autoannotations':{
          select: this.autoSelect,
          scope: this
        }
      });
    }
    // Ext.create('CV.view.library.View');
  },
  /*
   * this config is used to store the button connected to this controller. In this case library. It can later be used to toggle button during render at init.
   */
  header : undefined,
  headerInit : function(btn) {
    this.header = btn;
  },
  show : function(params) {
    var view = this.getLib(), idList = params.id && JSON.parse(decodeURI(params.id));
    CV.config.ChadoViewer.self.selectedIds = idList;
    if (Ext.isString(this.libraryView)) {
      this.libraryView = this.getView(this.libraryView).create();
    }
    this.render(this.libraryView);
    this.clearSelection();
    if (idList && idList[0]) {
      this.enable();
      switch ( idList[0].type ) {
        case 'library':
          id = idList[0].id;
          // to make a selection
          this.libraryView.setConfig(CV.config.ChadoViewer.self.library);
          if ( typeof id !== 'undefined') {
            this.treeSelect(id, idList);
          }
          break;
        case 'species':
          id = idList[0].id;
          // change ds value in extra param
          this.libraryView.setConfig(CV.config.ChadoViewer.self.species);

          // tree select id
          if ( typeof id !== 'undefined') {
            this.treeSelect(id);
          }
          break;
      } 
    } else {
        this.disable();
    }
  },
  onFilterComplete : function() {
    var cvtabs = this.getCvtabs(), activeTab = cvtabs.getActiveTab(), cloud = activeTab && activeTab.down('tagcloud');
    cloud && cloud.draw();
  },
  onFacetsChanged : function() {
    var seqGrid = this.getSequencesGrid(), lib = this.getLib(), tabpanel = this.getCvtabs();
    seqGrid.getStore().loadPage(1);
    // load the graph( summary ) panels.
    // Ext.each( lib.facetsParamArray , function( store ){
    // store.load();
    // });
    // lib.refreshDsview();
    lib.isDefferedLoad();
    tabpanel.reload();
    // Ext.each( lib.cvPanels , function( tab ){
    // tab.reload();
    // });
  },
  graphSelection : function(slice) {
    var dsview = this.getLib(), tab = dsview.down('cvtabs').getActiveTab();
    if ( tab && ( tab.othersRec !== slice )) {
      dsview.facetsStore.loadData([{
        'cvterm_id' : slice.get('cvterm_id'),
        'name' : slice.get('name'),
        'cv_id' : slice.get('cv_id')
      }], true);

    }
  },
  multiSelectUri:function( rm, records, index ){
    var items = [], item, i, validate;
    if ( records.length ){
      for( i in records ) {
        record = records[i];
        item = {
          id : record.get(this.libraryId),
          type : record.get('type'),
          text : record.get('text')
        };
        items.push( item );
      }
      // item.id = record.get(this.libraryId),
      // item.type = 'library',
      
      url = this.uri + '/' + JSON.stringify(items);
      CV.config.ChadoViewer.self.currentUri = url;
      validate = this.validateSelection( items );
      if( validate ) {
        CV.ux.Router.redirect( url );
      }
    }
  },
  validateSelection: function( items ){
    var validate, item,i;
    validate = this.validateSameType( items );
    validate = validate && this.validateJustUnknow( items );
    return validate;
  },
  validateSameType:function( items ){
    var item, valid = true, prev;
    for( i in items ){
      item = items[i];
      prev = prev ? prev : items[0];
      valid &= ( item.type == prev.type );
      prev = item;
      if( !valid ){
        Ext.Msg.show({
          title:'Error!',
          msg:'Selection must be of the same type i.e. either all species or library.'
        });
        break;
      }
    }
    return valid;
  },
  validateJustUnknow:function( items ){
    var item, valid = true, isUnknown= false;
    for( i in items ){
      item = items[i];
      if( item.id < 0 ){
        isUnknown = true;
        break;
      }
    }
    if ( isUnknown && items.length > 1 ){
      valid = false;
      Ext.Msg.show({
        title:'Error!',
        msg:'Multiple selection cannot be made with Unknow'
      });
    }
    return valid;
  },
  updateUri : function(rm, record, index) {
    var item = {
      id : record.get(this.libraryId),
      type : record.get('type'),
      name : record.get('name')
    },
    url = this.uri + '/' + JSON.stringify([item]);
    CV.ux.Router.redirect(url);
  },
  treeSelect : function(item, idList) {
    var id, 
      value, 
      grid, 
      graph,
      graphStore,
      gridStore,
      itemRecord,
      panel,
      tree = this.getTree(), 
      sm = tree.getSelectionModel(), 
      view = this.getLib(),
      annot = this.getAutoannotations();

    panel = this.getLib();
    // panel.clearFacets(true);
    // make sure this is set since it will decide if the node is selected on tree panel.
    // It had to be done this way as some times tree takes long time to load. Hence search returns null.
    this.item = item;
    
    // this.selectNode();
    this.selectNodes( idList );
    grid = this.getSequencesGrid();

    grid.store.getProxy().setExtraParam('id', item);
    grid.store.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());

    annot.store.getProxy().setExtraParam('ids', CV.config.ChadoViewer.getComaIds());
    
    panel.setDS(item);

    //set page number to one on changing library
    grid.store.loadPage(1);

  },
  selectNode : function() {
    var store = this.getTree().store, sm;
    store && this.treeLoaded(store);
    if (this.item !== null) {
      var itemRecord,
      //         view = this.getLib(),
      tree = this.getTree(), sm = tree.getSelectionModel();
      itemRecord = tree.getStore().getRootNode().findChild(this.libraryId, this.item, true);
      itemRecord && itemRecord.parentNode.expand(true);
      itemRecord && sm.select(itemRecord, false, true);
      this.item = null;
    }
  },
  selectNodes:function( ){
    var store = this.getTree().store, sm, i, node, records=[], 
      nodes = CV.config.ChadoViewer.self.selectedIds,findFn;
    findFn = function( item ){
      if( (item.get('type') == node.type) && (item.get('id') == node.id) ){
        return true;
      }
    };
    if (nodes && nodes.length ) {
      var itemRecord,
      tree = this.getTree(), sm = tree.getSelectionModel();
      for ( i in nodes ){
        node = nodes[i];
        itemRecord = tree.getStore().getRootNode().findChildBy( findFn, this, true );
        itemRecord && itemRecord.parentNode.expand( true );
        itemRecord && records.push( itemRecord );
      }
      records && sm.select( records, false, true );
    }
  },
  /*
   * specify the action to be taken when tree is loaded
   */
  treeLoaded : function(store) {
    // store.getRootNode().expand();
  },
  cvtermFilter : function(rowmodel, recs) {
    var i, filters = [];
    // for ( i = 0; i < recs.length; i++ ) {
    // filters.push(Ext.create('Ext.util.Filter', {
    // property : 'cvterm_id',
    // value : recs[i].get('id')
    // }));
    // };
    this.getSequencesGrid().store.filter(filters);
  },
  clearSelection : function() {
    var treePanel = this.getTree(), 
      gridSeq = this.getSequencesGrid(), 
      graph = this.getGraphPanel(), 
      gridMeta = this.getMetadataPanel(), 
      lib = this.getLib();
    treePanel && treePanel.clear();
    gridSeq.clear();
    gridMeta.clear();
    graph.clear();
    lib.changeDataSet = true;
    lib.clearFacets(true);
    lib.changeDataSet = false;
  },
  autoSelect:function(combo, selection) {
    var dsview = this.getLib(), slice = selection[0];
    dsview.facetsStore.loadData([{
      'cvterm_id' : slice.get('cvtermid'),
      'name' : slice.get('cvtermname'),
      'cv_id' : slice.get('cvid')
    }], true);

  },
  /**
   * disable views when library or species are not selected
   */
  disable:function(){
    var tab = this.getAnnotationpanel(), accordion = this.getStatuspanel();
    tab && tab.disable();
    accordion && accordion.disable();
  },
  /**
   * enable views when library or species are selected
   */
  enable:function(){
    var tab = this.getAnnotationpanel(), accordion = this.getStatuspanel();
    tab && tab.enable();
    accordion && accordion.enable();
  }
});

Ext.define( 'CV.view.de.ExperimentPanel' , {
  extend: Ext.tree.Panel ,
  alias:'widget.experimentpanel',
  title: 'Experiments',
  store:'CV.store.Experiments',
  collapsible : true,
  closeable : true,
  // selModel:{
    // mode:'MULTI'
  // },
  // loading message
  // viewConfig:{
    // loadMask:true
  // },
//   store : treeStore,
  region : 'west',
  width:250,
  height:"100%",
  rootVisible : false,
  expandable:true,
  constructor:function(){
    if( typeof this.store === 'string' ) {
      this.store = Ext.create( this.store );
    }
    // add plugin
    this.callParent( arguments );
  },
  initComponent:function(){
    this.addPlugin({
      ptype:'statusmask',
      owner: this,
      store: this.store
    });
    
    this.callParent( arguments );
  },
  afterRender:function (  ) {
    // Ext.Object.merge(this.store.proxy , {
      // extraParams : this.ownerCt.dsConfig.tree.extraParams
    // });
    this.store.load();
    this.callParent( arguments );
  },
  clear:function(){
    this.getSelectionModel().deselectAll();
  }
});
Ext.define('CV.model.Depoint',{
  extend: Ext.data.Model ,
  fields:['name'],
  idProperty:'name'
});

Ext.define('CV.store.Depoints',{
                                
  extend: Ext.data.Store ,
  model:'CV.model.Depoint',
  constructor:function(){
    // Ext.Object.merge(this.proxy, {
        // url : CV.config.ChadoViewer.self.baseUrl
    // });
    this.callParent( arguments );
  }//,
  // setExtraParam:function( name , value){
    // this.proxy && this.proxy.setExtraParam(name, value);
  // }
})

Ext.define('CV.view.de.Chosen', {
  extend :  Ext.grid.Panel ,
  alias : 'widget.chosenpanel',
  title : 'Datapoints',
  store : 'CV.store.Depoints',
  columnLines : true,
                                   
  width:300,
  height:'100%',
  initComponent : function() {
    if ( typeof this.store === 'string') {
      this.store = Ext.create(this.store);
    }
    // this will make paging toolbar update when store records are removed using removeAll function.
    this.callParent(arguments);
  },
  columns : [{
    text:'Name',
    dataIndex: 'name',
    renderer:function( rec ){
      return "<a href='#feature/dataset_16."+rec+"'>"+rec+"</a>";
    }
  }],
  clear:function(){
    if ( this.store ){
      this.store.removeAll();
    } 
  }
});

Ext.define('CV.view.de.View',{
  extend: Ext.container.Container ,
  alias:'widget.deview',
                                                                                      
  height:'100%',
  width:'100%',
  layout:'border',
  store:'CV.store.GraphData',
  items:[{
    xtype:'experimentpanel',
    region:'west'
  }
  ,{
    xtype:'genomebrowser',
    region:'center',
    title:'Graphics'
  },{
    xtype : 'chosenpanel',
    region : 'east',
    title : 'Chosen points'
  }
  ],
  events:[
  /**
   * fired when canvas express should be rendered.
   */
    'drawcanvas'
  ],
  
  /**
   * configs needed for plotting canvasXpress
   */
  canvasData : null,
  canvasOptions : null,
  
  initComponent:function(){
    this.listeners= {
      drawcanvas:this.renderHeatmap,
      scope:this
    };
    if( typeof (this.store) =='string' ){
      this.store = Ext.create(this.store);
    }
    this.store.addListener('load', this.processRecords , this);
    this.callParent( arguments );
  },
  processRecords:function( store , data , success ){
    if( success ) {
      var record = data[0];
      if(record){
        this.canvasData = record.get('datapoints');
        this.canvasOptions = record.get('config');
        this.fireEvent('drawcanvas');
      }
    }
  },
  renderHeatmap:function( store, data , success ){
    var gb = this.down('genomebrowser');
      if( this.canvasData && this.canvasOptions ){
        gb.canvasData = this.canvasData;
        gb.canvasOptions = this.canvasOptions;
        gb.loadCanvas();
      }
  }
});

Ext.define('CV.controller.DE', {
  extend :  Ext.app.Controller ,
                                                                      
  views : ['CV.view.de.View'],
  refs:[{
    ref : 'DE',
    selector : 'deview'
  },{
    ref:'Chosen',
    selector: 'chosenpanel'
  },{
    ref : 'CX',
    selector : 'genomebrowser'
  }],
  // config
  name:'DE',
  uri : 'de',
  text:'DE',
  /**
   * configs used by controller
   */
  /**
   * store instance having the graph datapoints
   */
  graphStore:null,
  
  init : function() {
    var treeView, gridView;
    gridView = Ext.create('CV.view.de.View');
    gridView.show();
    this.control({
       'viewport > radiogroup > button[name=DE]' : {
        render : this.headerInit,
        scope : this
      },
      'experimentpanel':{
        selectionchange:this.loadStore,
        scope:this
      },
      'deview':{
        afterrender : this.linkStore,
        scope: this
      },
      'deview genomebrowser':{
        nodeclick : this.addNode,
        scope: this
      }
      ,'deview grid':{
          selectionchange:function(rm , records){
            var i,j,k, cx ,selections , count = 0, record;
            for ( j in CanvasXpress.references ){
              selections = [];
              cx = CanvasXpress.references[j];
              for ( i in cx.data.y.vars ){
                for( k in records ){
                  record = records[k];
                  if( cx.data.y.vars[i] == record.get('Checksum')){
                    selections[i] = true;
                    count ++;
                  }
                }
              }
              if( count ){
                cx.selectDataPoint = selections;
                cx.isSelectDataPoints = count;
                cx.draw();
              }
            }
          }
        }
    });
  },
  /**
   * this config is used to store the button connected to this controller. In this case library. It can later be used to toggle button during render at init.
   */
  header : undefined,
  headerInit : function(btn) {
    this.header = btn;
  },
  show : function(params) {
    var view = this.getDE();
    this.render( view );
  },
  linkStore:function( deview ){
    this.graphStore = deview.store;
  },
  loadStore:function( store , selected){
    if( this.graphStore ){
      selected = selected[0];
      var gid = selected.get('gid')||1, deid = selected.get('pid')||1;
      this.graphStore.setExtraParam('pid', deid);
      this.graphStore.setExtraParam('gid', gid);
      this.graphStore.load(); 
    }
  },
  addNode:function( point ){
    var chosen = this.getChosen(), name = point.z.aliases[0], selections = [], cx ;
    chosen && chosen.store.loadData( [{ name : name }], true);    
    chosen.store.each(function( rec ){
      selections.push( rec.get('name') );
    });
    cx = this.getCX().canvasXpress;
    if( selections.length ){
      cx.selectDataPoint = selections;
      cx.isSelectDataPoints = selections.length;
      cx.draw();
    }
  }
}); 
/**
 * The main application viewport, which displays the whole application
 * @extends Ext.Viewport
 */
Ext.define('CV.view.Viewport', {
    extend:  Ext.Viewport ,
    layout: 'fit',
               
                            
                                      
                              
      
    initComponent: function() {
      var me = this, treeStore, treePanel, gridPanel, gridStore, btns = [], btnTmp = {
        text: '',
        uri: '',
        id: 'Btn'
      };
      
      // Ext.iterate( CV.controller , function ( key , value ) {
        // if ( value.name !== 'Help'){
          // btns.push( me.createButtonConfig( value ) );
        // }
      // });
      btns.push( me.createButtonConfig( CV.controller.Library ) );
      btns.push( me.createButtonConfig( CV.controller.Feature ) );
      // do for 
      btns.push( {xtype:'tbfill'} ); 
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
Ext.define('CV.view.species.View', {
  extend :  CV.view.View ,
  alias : 'widget.speciesview',
                                     
  initComponent : function() {
   var me = this;
   this.dsConfig = CV.config.ChadoViewer.self.species;
    me.callParent(arguments);
  }
}); 
Ext.define('CV.model.ControlledVocabulary', {
  extend:  Ext.data.Model ,
  fields : ['name', 'cv_id', 'dsid', 'title','get']
}); 
Ext.define('CV.model.DataSet' , {
  extend:  Ext.data.TreeStore ,
                                     
  fields : ['text', 'id'],
  constructor: function ( cfg ){
    this.proxy = {
      url : CV.config.CV.getBaseUrl(),
      // extraParams: CV.config.CV.getLibrary().tree.extraParams,
      type : 'ajax'
    };
    this.initConfig ( cfg );
  }
});
Ext.define('CV.model.Experiment' , {
  extend:  Ext.data.Model ,
  fields : ['text', 'pid','type','gid'],
                                    //,
  // idProperty:'pid'
});
Ext.define('CV.model.FeatureMetadatum',{
  fields:[
    'key',
    'value'
  ]
});

Ext.define('CV.model.GraphDatum',{
  extend: Ext.data.Model ,
  fields:['datapoints','config']
});

Ext.define( 'CV.store.ControlledVocabularies' , {
  extend: Ext.data.Store ,
                                                                     
  model:'CV.model.ControlledVocabulary',
  proxy :  {
    type: 'ajax',
    reader: {
      type: 'json'
    },
    extraParams:{
      filters:null,
      facets:null
    }
  },
  constructor:function(){
    Ext.Object.merge(this , {proxy:{
      url : CV.config.ChadoViewer.self.baseUrl
    }});
    this.callParent( arguments );
  },
  changeExtraParams:function( extraParams ){
    if( extraParams.graph.vocabulary ){
      this.getProxy().extraParams = Ext.clone( extraParams.graph.vocabulary );
    }
  }
})

Ext.define('CV.store.DataSets', {
  extend: Ext.data.Store ,
  autoLoad : true,
  model:'CV.model.DataSet',
  root : {
    text : 'ds'
  }
});
Ext.define('CV.store.Experiments', {
  extend :  Ext.data.TreeStore ,
  autoLoad : false,
  model : 'CV.model.Experiment',
  root : {
    text : 'root',
    hidden : true,
    expanded: true,
    children:[]
  },
  proxy:{
    type : 'ajax',
    extraParams : {
          ds : 'de',
          type : 'experiments',
          view:'tree'
    }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});
Ext.define('CV.store.FeatureMetadata', {
  extend :  Ext.data.Store ,
  model : 'CV.model.CvTerm',
                                                       
  autoLoad:false,
  groupField:'gr',
  proxy : {
    type : 'ajax',
    extraParams:{
      ds:'feature',
      type:'cv',
      feature_id:0
    },
    reader : {
      type : 'json',
      root : 'root',
      successProperty : false,
      totalProperty : false
    }
  },
  constructor:function(){
    Ext.Object.merge(this.proxy , {
      url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});

Ext.define('CV.store.GenomeBase', {
  extend: Ext.data.Store ,
  constructor : function(config) {
    var url = CV.config.ChadoViewer.self.drupalBase + CV.config.ChadoViewer.self.genomeviewer.url;
    this.proxy = this.proxy || {};
    Ext.Object.merge(this.proxy, {
        url : url
    });
    this.callParent( arguments );
  }
});
Ext.define('CV.store.GenomeTracks', {
  extend: CV.store.GenomeBase ,
                                   
  fields:[{
    name:'tracks',
    type:'object'
  }],
  proxy:{
    type:'ajax',
    reader:{
      type:'json'
    },
    extraParams:{
      type: 'track',
      id: null
    }
  }
});
Ext.define('CV.store.GraphData',{
  extend: Ext.data.Store ,
  model:'CV.model.GraphDatum',
  autoLoad:false,
  proxy:{
    type:'ajax',
    extraParams:{
      ds:'de',
      type:'graphdata',
      deid:null,
      gid:null
    }
  },
  constructor:function(){
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  },
  setExtraParam:function( name , value){
    this.proxy && this.proxy.setExtraParam(name, value);
  }
})

Ext.define('CV.store.NetworkJson', {
  extend: Ext.data.Store ,
  pageSize: 10,
  fields:['network_id','json'],
  proxy: {
      type: 'ajax',
      extraParams:{
        type:'networkjson',
        ds : 'feature',
        network_id:null,
        dataset_id:null
      }
  },
  constructor : function(config) {
    Ext.Object.merge(this.proxy, {
        url : CV.config.ChadoViewer.self.baseUrl
    });
    this.callParent( arguments );
  }
});
Ext.define('CV.store.ProteinTranslation', {
  extend: CV.store.Base ,
  fields:['fasta'],
                             
  proxy:{
    type:'ajax',
    extraParams:{
        ds : 'feature',
        type : 'translate',
        feature_id : 0,
        geneticCode: 1
    },
    reader:{
      type:'json'
    }
  },
  autoLoad:false
});
/**
 * The store used for feature
 */
Ext.define('CV.store.SpeciesTree', {
  extend :  Ext.data.TreeStore ,
                                       
  fields : ['text', 'organism_id'],
  autoLoad : true,
  proxy : {
    url : CV.config.ChadoViewer.self.baseUrl,
    type : 'ajax',
    reader : 'json',
    extraParams : {
      type : 'tree',
      ds : 'species'
    }
  },
  root : {
    text : 'Species',
    expanded : true
  }
}); 
Ext.define('CV.view.BarChart', {
  extend :  Ext.chart.Chart ,
  alias : 'widget.libraryBar',
  mixins : [ CV.ux.ThresholdFinder ],
  // i18n properties
  bottomAxeTitleText : "Terms",
  leftAxeTitleText : "Count & Percentage",
  menuTitle : 'Bar Chart',
  legend : {
    position : 'top'
  },
  /*
   * this variable is used to control the categories rendered on the panel.
   * If the number of categories are more than maxCategories value, then
   * rendering is prevented and replaced by a mask.
   *
   */
  maxCategories : 20,
  /*
   * list all the title names that need to appear on legend box.
   */
  titles: null,
  onBindStore : function(store) {
    //     var that = this;
    if (store) {
      store.addListener({
        // beforeload: this.loadingOn,
        // load: this.loadingOff,
        // scope: this
      });
    }
  },
  onUnbindStore : function(store) {
    if (store) {
      store.removeListener({
        // beforeload: this.loadingOn,
        // load: this.loadingOff
      });
    }
  },
  autoDestroy : false,
  loadingOn : function() {
    this.setLoading(true);
  },
  loadingOff : function() {
    // this.redraw();
    this.setLoading(false);
  },
  initComponent : function() {
    // create y fields
    var yFields = [], i, yField, ids={}, count , prop;
    for( i in this.yField ){
      yField = this.yField[i];
      count = yField + ' count';
      prop = yField + ' proportion';
      yFields.push( count );
      yFields.push( prop );
      ids [ count ] = yField;
      ids [ prop ] = yField;
    }
    Ext.apply(this, {
      region : 'south',
      height : 400,
      //       id: 'featureBar',
      //       store : 'CV.store.FeatureCount',
      axes : [{
        type : 'Numeric',
        position : 'left',
        // fields : ['2', '68'],
        title : this.leftAxeTitleText,
        grid : true,
        minimum : 0//,
        // TODO: not implemented in 4.2. ideally if others column number is large, logarithmic scaling should be used.
        //scale:'logarithmic'
      }
      // ,{
        // type : 'Numeric',
        // position : 'right',
        // label : {
          // renderer : Ext.util.Format.numberRenderer('0,0')
        // },
        // title : 'Proportion',
        // grid : false,
        // minimum : 0,
        // maximum : 100
        // // TODO: not implemented in 4.2. ideally if others column number is large, logarithmic scaling should be used.
        // //scale:'logarithmic'
      // }
      , {
        type : 'Category',
        position : 'bottom',
        fields : ['name'],
        title : this.bottomAxeTitleText,
        label : {
          // we do not want to display catergory value
          renderer : function() {
            return '';
          }
        }
      }],
      series : [{
        type : 'column',
        axis : 'left',
        highlight : true,
        showInLegend: true,
        tips : {
          trackMouse : true,
          minWidth: 250,
          renderer : function(storeItem, item) {
            this.setTitle(storeItem.get('name') + ' - ' + storeItem.get( item.yField ) +' <br/><i>('+storeItem.get('highername')[item.series.yFieldIds[item.yField]]+')</i>');
          }
        },
        label : {
          display : 'insideEnd',
          field : 'left',
          renderer : Ext.util.Format.numberRenderer('0'),
          orientation : 'horizontal',
          'text-anchor' : 'middle'
        },
        xField : 'name',
        yField : yFields,
        libraryId : this.yField,
        yFieldIds : ids,
        title: this.titles,
        listeners : {
          itemclick : function(slice) {
            this.chart.fireEvent('itemclicked', slice.storeItem);
          }
        }
      }
      ]
    });
    // delete this.yField;
    this.addEvents('itemclicked');
    this.callParent(arguments);
  }
}); 
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
  extend :  Ext.panel.Panel ,
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
Ext.define('CV.view.InputSlider', {
  extend: Ext.slider.Single ,
  // isFormField: true,
  /**
   * the number field containing
   */ 
  sliderField: null,
  initComponent: function() {
    // this.originalValue = this.value;
    // this.width += 80;
    this.callParent( arguments );
  }
  ,
  onRender: function(){
    this.callParent( arguments );
    Ext.DomHelper.insertAfter(this.el,{
        tag: 'div',
        id: this.id +'_slidertextdiv',
        style: 'position: relative; float:right;width:60px;height:20px;margin-left:5px;margin-right:90px'
    });

    this.sliderField = new Ext.form.field.Text({
        // renderTo:this.inputEl,
        renderTo: this.id +'_slidertextdiv',
        // applyTo:this.id +'_slidertextdiv',
        id: this.id +'_slidertext',
        name: this.name +'_slidertext',
        value: this.value,
        enableKeyEvents:true,
        width:60,
 //       minValue:this.minValue,
   //     maxValue:this.maxValue ,

        scope:this,
        listeners: {
            change : function() {
                this.adjustValue( this );
            },
            keyup:function(text , e){
              e.stopPropagation();
              // this.adjustValue( this );
            },
            scope:this
        }
    });
  },
  adjustValue : function(){
    // if(this.sliderField.getValue()==""){
         // this.setValue(this.sliderField.minValue);
    // } else {
        Ext.getDom( this.id +'_slidertext' ).value = v;
        this.setValue(this.sliderField.getValue());
    // }
    this.sliderField.clearInvalid();
  },
  setValue: function(v) {
    this.callParent ( arguments );
    // v = parseInt(v);
    
    if(this.rendered){
      // if(v<=0){
        // Ext.getDom(this.id +'_slidertext').value=0;
      // } else {
        Ext.getDom( this.id +'_slidertext' ).value = v;
//        this.sliderField.value = this.getValue();
      // }
      
    }
  }
  // // reset: function() {
    // // this.setValue(this.originalValue);
    // // this.clearInvalid();
  // // },
  // // getName: function() {
    // // return this.name;
  // // },
  // // validate: function() {
    // // return true;
  // // },
  // setMinValue : function(minValue){
    // this.callParent( arguments );
    // // this.minValue = minValue;
    // this.sliderField.setMinValue( minValue ) ;
    // return minValue;
  // },
  // setMaxValue : function(maxValue){
    // this.callParent( arguments );
    // // this.maxValue = maxValue;
    // this.sliderField.setMaxValue( maxValue );
    // return maxValue
  // }
  // // ,
  // // markInvalid: Ext.emptyFn,
  // // clearInvalid: Ext.emptyFn
});
Ext.define('CV.view.ChadoPanel', {
  extend :  CV.view.MultiViewPanel ,
                                   
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
        msg:'I cannot display more than '+this.maxCategories+' categories. Please increase the threshold value using the above slider or change to a different view.'
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
Ext.define('CV.view.Chart', {
  extend: Ext.chart.Chart ,
  alias:'widget.libraryBar',
  // i18n properties
  bottomAxeTitleText: "Terms",
  leftAxeTitleText: "Count",
  onBindStore : function ( store ) {
//     var that = this;
    if ( store ) {
      store.addListener({
        beforeload: this.loadingOn,
        load: this.loadingOff,
        scope: this
      });
    }
  },
  onUnbindStore: function ( store ) {
    if ( store ) {
      store.removeListener({
        // beforeload: this.loadingOn,
        // load: this.loadingOff
      });
    }
  },
  autoDestroy: false,
  loadingOn: function () {
    this.setLoading( true );
  },
  loadingOff: function () {
    this.redraw();
    this.setLoading ( false );
  },
  initComponent:function () {
    Ext.apply ( this , {
      region: 'south',
      height:400,
//       id: 'featureBar',
//       store : 'CV.store.FeatureCount',
      axes: [{
        type: 'Numeric',
        position: 'left',
        fields: ['count'],
        label: {
            renderer: Ext.util.Format.numberRenderer('0,0')
        },
        title: this.leftAxeTitleText,
        grid: true,
        minimum: 0
      }, {
        type: 'Category',
        position: 'bottom',
        fields: ['name'],
        title: this.bottomAxeTitleText,
        label:{
          // we do not want to display catergory value
          renderer : function() {
            return '';
          }
        }
      }],
      series: [{
        type: 'column',
        axis: 'left',
        highlight: true,
        tips: {
          trackMouse: true,
          width: 140,
//           height: 28,
          renderer: function(storeItem, item) {
            this.setTitle(storeItem.get('name') + ': ' + storeItem.get('count'));
          }
        },
        label: {
          display: 'insideEnd',
            field: 'left',
            renderer: Ext.util.Format.numberRenderer('0'),
            orientation: 'horizontal',
            color: '#333',
            'text-anchor': 'middle'
        },
        xField: 'name',
        yField: 'count'
      }]
    });
    this.callParent ( arguments );
  }
});
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
  extend: Ext.panel.Panel ,
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
Ext.define('CV.view.RawData', {
  extend: Ext.grid.Panel ,
  alias:'widget.rawdatapanel',
  menuTitle : 'Raw data',
                                     
    /*
   * this variable is used to control the categories rendered on the panel. 
   * If the number of categories are more than maxCategories value, then 
   * rendering is prevented and replaced by a mask.
   * 
   */
  maxCategories:Number.MAX_VALUE,
  viewConfig:{
    /**
     * since chadopanel has a loading mask showing.
     */
     loadMask:false 
  },
  columnLines: true,
  // plugins: 'bufferedrenderer',
  columns : [],
  setThreshold:function( chadopanel ){
    chadopanel.setThreshold( 1 );
  },
  listeners:{
    // render:function(){
    // },
    // beforerender:function(){
//       
    // }
  },
  initComponent:function(){
    // Ext.apply(this,{
      // plugins : [
        // Ext.create('CV.ux.HeaderFilters', {
          // reloadOnChange : false
        // })]
    // });
    this.callParent( this );
  }
});
Ext.define('CV.view.feature.CvTermsGrid', {
                                         
  extend: Ext.grid.Panel ,
  alias:'widget.cvtermsgrid',
  store:'CV.store.FeatureMetadata',
  // removed since load mask is giving issues when the grid is collapsed.
  // consider re doing retry  plugin
  // collapsible:true,
  // collapsed:true,
  split:true,
  /**
   * property that stores group feature instance.
   */
  grpFeature:null,
  title : 'Metadata',
  columnLines:true,
  columns : [{
    text : 'Key',
    dataIndex : 'term',
    flex : 1,
    renderer : function(val) {
      return '<div style="white-space:normal !important;">' + val + '</div>';
    }
  }, {
    text : 'Value',
    dataIndex : 'value',
    flex : 1,
    renderer : function( msg ){
      return '<div style="white-space:normal !important;">'+ msg+'</div>';
    }    
  }],
  initComponent:function(){
    var grp = Ext.create('Ext.grid.feature.Grouping',{   groupHeaderTpl: 'Group: {name} ({rows.length})' });
    Ext.apply(this, {
     plugins:[Ext.create('CV.ux.Retry')],
     features:[grp],
     grpFeature: grp
    });
    this.callParent(arguments); 
  }  
});
Ext.define('CV.view.library.Chart', {
  extend: Ext.chart.Chart ,
  alias:'widget.libraryBar',
  // i18n properties
  bottomAxeTitleText: "Function summary",
  leftAxeTitleText: "Count",
  onBindStore : function ( store ) {
//     var that = this;
    if ( store ) {
      store.addListener({
        beforeload: this.loadingOn,
        load: this.loadingOff,
        scope: this
      });
    }
  },
  onUnbindStore: function ( store ) {
    if ( store ) {
      store.removeListener({
        // beforeload: this.loadingOn,
        // load: this.loadingOff
      });
    }
  },
  autoDestroy: false,
  loadingOn: function () {
    this.setLoading( true );
  },
  loadingOff: function () {
    this.redraw();
    this.setLoading ( false );
  },
  initComponent:function () {
    Ext.apply ( this , {
      region: 'south',
      height:400,
//       id: 'featureBar',
//       store : 'CV.store.FeatureCount',
      axes: [{
        type: 'Numeric',
        position: 'left',
        fields: ['count'],
        label: {
            renderer: Ext.util.Format.numberRenderer('0,0')
        },
        title: this.leftAxeTitleText,
        grid: true,
        minimum: 0
      }, {
        type: 'Category',
        position: 'bottom',
        fields: ['name'],
        title: this.bottomAxeTitleText,
        label:{
          // we do not want to display catergory value
          renderer : function() {
            return '';
          }
        }
      }],
      series: [{
        type: 'column',
        axis: 'left',
        highlight: true,
        tips: {
          trackMouse: true,
          width: 140,
//           height: 28,
          renderer: function(storeItem, item) {
            this.setTitle(storeItem.get('name') + ': ' + storeItem.get('count'));
          }
        },
        label: {
          display: 'insideEnd',
            field: 'left',
            renderer: Ext.util.Format.numberRenderer('0'),
            orientation: 'horizontal',
            color: '#333',
            'text-anchor': 'middle'
        },
        xField: 'name',
        yField: 'count'
      }]
    });
    this.callParent ( arguments );
  }
});
Ext.define( 'CV.view.library.Grid',{
  extend: Ext.grid.Panel ,
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
Ext.define('CV.view.library.RawData', {
  extend: Ext.grid.Panel ,
  title : 'Raw data',
  columns : [{
    text : 'name',
    dataIndex : 'name',
    flex : 1
  }, {
    text : 'count',
    dataIndex : 'count',
    flex : 1
  }]
})
Ext.define( 'CV.view.library.Tree' , {
  extend: Ext.tree.Panel ,
  alias:'widget.libraryTree',
  title: 'Library Tree',
//   store : treeStore,
  region : 'west',
  width:400,
  rootVisible : true,
  initComponent:function (  ) {
    this.callParent( arguments );
  },
  clear:function(){
    this.store.getSelectionModel().deselectAll();
  }
});
Ext.define('CV.view.species.Chart', {
  extend: Ext.chart.Chart ,
  alias:'widget.speciesBar',
  // i18n properties
  bottomAxeTitleText: "Function summary",
  leftAxeTitleText: "Count",
  onBindStore : function ( store ) {
//     var that = this;
    if ( store ) {
      store.addListener({
       beforeload: this.loadingOn,
       load: this.loadingOff,
        scope: this
      });
    }
  },
  loadingOn: function () {
    this.setLoading( true );
  },
  loadingOff: function () {
    this.setLoading ( false );
  },
  initComponent:function () {
    Ext.apply ( this , {
      region: 'south',
      height:400,
//       id: 'featureBar',
      store : 'CV.store.FeatureCount',
      axes: [{
        type: 'Numeric',
        position: 'left',
        fields: ['count'],
        label: {
            renderer: Ext.util.Format.numberRenderer('0,0')
        },
        title: this.leftAxeTitleText,
        grid: true,
        minimum: 0
      }, {
        type: 'Category',
        position: 'bottom',
        fields: ['name'],
        title: this.bottomAxeTitleText,
        label:{
          // we do not want to display catergory value
          renderer : function() {
            return '';
          }
        }
      }],
      series: [{
        type: 'column',
        axis: 'left',
        highlight: true,
        tips: {
          trackMouse: true,
          width: 140,
          height: 28,
          renderer: function(storeItem, item) {
            this.setTitle(storeItem.get('name') + ': ' + storeItem.get('count'));
          }
        },
        label: {
          display: 'insideEnd',
            field: 'left',
            renderer: Ext.util.Format.numberRenderer('0'),
            orientation: 'horizontal',
            color: '#333',
            'text-anchor': 'middle'
        },
        xField: 'name',
        yField: 'count'
      }]
    });
    this.callParent ( arguments );
  }
});
Ext.define( 'CV.view.species.Grid',{
  extend: Ext.grid.Panel ,
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
Ext.define( 'CV.view.species.TreePanel' , {
  extend: Ext.tree.Panel ,
  alias:'widget.speciesTree',
  title: 'Species List',
  store: 'CV.store.SpeciesTree',
  region : 'west',
  width:400,
  rootVisible : true,
  initComponent:function (  ) {
    this.callParent( arguments );
  },
  clear:function(){
    this.store.getSelectionModel().deselectAll();
  }
});
/**
 * A Grid which creates itself from an existing HTML table element.
 */
Ext.define('Ext.ux.grid.TransformGrid', {
    extend:  Ext.grid.Panel ,

    /**
     * Creates the grid from HTML table element.
     * @param {String/HTMLElement/Ext.Element} table The table element from which this grid will be created -
     * The table MUST have some type of size defined for the grid to fill. The container will be
     * automatically set to position relative if it isn't already.
     * @param {Object} [config] A config object that sets properties on this grid and has two additional (optional)
     * properties: fields and columns which allow for customizing data fields and columns for this grid.
     */
    constructor: function(table, config) {
        config = Ext.apply({}, config);
        table = this.table = Ext.get(table);

        var configFields = config.fields || [],
            configColumns = config.columns || [],
            fields = [],
            cols = [],
            headers = table.query("thead th"),
            i = 0,
            len = headers.length,
            data = table.dom,
            width,
            height,
            store,
            col,
            text,
            name;

        for (; i < len; ++i) {
            col = headers[i];

            text = col.innerHTML;
            name = 'tcol-' + i;

            fields.push(Ext.applyIf(configFields[i] || {}, {
                name: name,
                mapping: 'td:nth(' + (i + 1) + ')/@innerHTML'
            }));

            cols.push(Ext.applyIf(configColumns[i] || {}, {
                text: text,
                dataIndex: name,
                width: col.offsetWidth,
                tooltip: col.title,
                sortable: true
            }));
        }

        if (config.width) {
            width = config.width;
        } else {
            width = table.getWidth() + 1;
        }

        if (config.height) {
            height = config.height;
        }

        Ext.applyIf(config, {
            store: {
                data: data,
                fields: fields,
                proxy: {
                    type: 'memory',
                    reader: {
                        record: 'tbody tr',
                        type: 'xml'
                    }
                }
            },
            columns: cols,
            width: width,
            height: height
        });
        this.callParent([config]);
        
        if (config.remove !== false) {
            // Don't use table.remove() as that destroys the row/cell data in the table in
            // IE6-7 so it cannot be read by the data reader.
            data.parentNode.removeChild(data);
        }
    },

    onDestroy: function() {
        this.callParent();
        this.table.remove();
        delete this.table;
    }
});
/**
 * Abstract base class for filter implementations.
 */
Ext.define('Ext.ux.grid.filter.Filter', {
    extend:  Ext.util.Observable ,

    /**
     * @cfg {Boolean} active
     * Indicates the initial status of the filter (defaults to false).
     */
    active : false,
    /**
     * True if this filter is active.  Use setActive() to alter after configuration.
     * @type Boolean
     * @property active
     */
    /**
     * @cfg {String} dataIndex
     * The {@link Ext.data.Store} dataIndex of the field this filter represents.
     * The dataIndex does not actually have to exist in the store.
     */
    dataIndex : null,
    /**
     * The filter configuration menu that will be installed into the filter submenu of a column menu.
     * @type Ext.menu.Menu
     * @property
     */
    menu : null,
    /**
     * @cfg {Number} updateBuffer
     * Number of milliseconds to wait after user interaction to fire an update. Only supported
     * by filters: 'list', 'numeric', and 'string'. Defaults to 500.
     */
    updateBuffer : 500,

    constructor : function (config) {
        Ext.apply(this, config);

        this.addEvents(
            /**
             * @event activate
             * Fires when an inactive filter becomes active
             * @param {Ext.ux.grid.filter.Filter} this
             */
            'activate',
            /**
             * @event deactivate
             * Fires when an active filter becomes inactive
             * @param {Ext.ux.grid.filter.Filter} this
             */
            'deactivate',
            /**
             * @event serialize
             * Fires after the serialization process. Use this to attach additional parameters to serialization
             * data before it is encoded and sent to the server.
             * @param {Array/Object} data A map or collection of maps representing the current filter configuration.
             * @param {Ext.ux.grid.filter.Filter} filter The filter being serialized.
             */
            'serialize',
            /**
             * @event update
             * Fires when a filter configuration has changed
             * @param {Ext.ux.grid.filter.Filter} this The filter object.
             */
            'update'
        );
        Ext.ux.grid.filter.Filter.superclass.constructor.call(this);

        this.menu = this.createMenu(config);
        this.init(config);
        if(config && config.value){
            this.setValue(config.value);
            this.setActive(config.active !== false, true);
            delete config.value;
        }
    },

    /**
     * Destroys this filter by purging any event listeners, and removing any menus.
     */
    destroy : function(){
        if (this.menu){
            this.menu.destroy();
        }
        this.clearListeners();
    },

    /**
     * Template method to be implemented by all subclasses that is to
     * initialize the filter and install required menu items.
     * Defaults to Ext.emptyFn.
     */
    init : Ext.emptyFn,

    /**
     * @private @override
     * Creates the Menu for this filter.
     * @param {Object} config Filter configuration
     * @return {Ext.menu.Menu}
     */
    createMenu: function(config) {
        config.plain = true;
        return Ext.create('Ext.menu.Menu', config);
    },

    /**
     * Template method to be implemented by all subclasses that is to
     * get and return the value of the filter.
     * Defaults to Ext.emptyFn.
     * @return {Object} The 'serialized' form of this filter
     * @template
     */
    getValue : Ext.emptyFn,

    /**
     * Template method to be implemented by all subclasses that is to
     * set the value of the filter and fire the 'update' event.
     * Defaults to Ext.emptyFn.
     * @param {Object} data The value to set the filter
     * @template
     */
    setValue : Ext.emptyFn,

    /**
     * Template method to be implemented by all subclasses that is to
     * return <tt>true</tt> if the filter has enough configuration information to be activated.
     * Defaults to <tt>return true</tt>.
     * @return {Boolean}
     */
    isActivatable : function(){
        return true;
    },

    /**
     * Template method to be implemented by all subclasses that is to
     * get and return serialized filter data for transmission to the server.
     * Defaults to Ext.emptyFn.
     */
    getSerialArgs : Ext.emptyFn,

    /**
     * Template method to be implemented by all subclasses that is to
     * validates the provided Ext.data.Record against the filters configuration.
     * Defaults to <tt>return true</tt>.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord : function(){
        return true;
    },

    /**
     * Returns the serialized filter data for transmission to the server
     * and fires the 'serialize' event.
     * @return {Object/Array} An object or collection of objects containing
     * key value pairs representing the current configuration of the filter.
     */
    serialize : function(){
        var args = this.getSerialArgs();
        this.fireEvent('serialize', args, this);
        return args;
    },

    /** @private */
    fireUpdate : function(){
        if (this.active) {
            this.fireEvent('update', this);
        }
        this.setActive(this.isActivatable());
    },

    /**
     * Sets the status of the filter and fires the appropriate events.
     * @param {Boolean} active        The new filter state.
     * @param {Boolean} suppressEvent True to prevent events from being fired.
     */
    setActive : function(active, suppressEvent){
        if(this.active != active){
            this.active = active;
            if (suppressEvent !== true) {
                this.fireEvent(active ? 'activate' : 'deactivate', this);
            }
        }
    }
});

/**
 * Boolean filters use unique radio group IDs (so you can have more than one!)
 * <p><b><u>Example Usage:</u></b></p>
 * <pre><code>
var filters = Ext.create('Ext.ux.grid.GridFilters', {
    ...
    filters: [{
        // required configs
        type: 'boolean',
        dataIndex: 'visible'

        // optional configs
        defaultValue: null, // leave unselected (false selected by default)
        yesText: 'Yes',     // default
        noText: 'No'        // default
    }]
});
 * </code></pre>
 */
Ext.define('Ext.ux.grid.filter.BooleanFilter', {
    extend:  Ext.ux.grid.filter.Filter ,
    alias: 'gridfilter.boolean',

	/**
	 * @cfg {Boolean} defaultValue
	 * Set this to null if you do not want either option to be checked by default. Defaults to false.
	 */
	defaultValue : false,
	/**
	 * @cfg {String} yesText
	 * Defaults to 'Yes'.
	 */
	yesText : 'Yes',
	/**
	 * @cfg {String} noText
	 * Defaults to 'No'.
	 */
	noText : 'No',

    /**
     * @private
     * Template method that is to initialize the filter and install required menu items.
     */
    init : function (config) {
        var gId = Ext.id();
		this.options = [
			Ext.create('Ext.menu.CheckItem', {text: this.yesText, group: gId, checked: this.defaultValue === true}),
			Ext.create('Ext.menu.CheckItem', {text: this.noText, group: gId, checked: this.defaultValue === false})];

		this.menu.add(this.options[0], this.options[1]);

		for(var i=0; i<this.options.length; i++){
			this.options[i].on('click', this.fireUpdate, this);
			this.options[i].on('checkchange', this.fireUpdate, this);
		}
	},

    /**
     * @private
     * Template method that is to get and return the value of the filter.
     * @return {String} The value of this filter
     */
    getValue : function () {
		return this.options[0].checked;
	},

    /**
     * @private
     * Template method that is to set the value of the filter.
     * @param {Object} value The value to set the filter
     */
	setValue : function (value) {
		this.options[value ? 0 : 1].setChecked(true);
	},

    /**
     * @private
     * Template method that is to get and return serialized filter data for
     * transmission to the server.
     * @return {Object/Array} An object or collection of objects containing
     * key value pairs representing the current configuration of the filter.
     */
    getSerialArgs : function () {
		var args = {type: 'boolean', value: this.getValue()};
		return args;
	},

    /**
     * Template method that is to validate the provided Ext.data.Record
     * against the filters configuration.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord : function (record) {
		return record.get(this.dataIndex) == this.getValue();
	}
});

/**
 * Filter by a configurable Ext.picker.DatePicker menu
 *
 * Example Usage:
 *
 *     var filters = Ext.create('Ext.ux.grid.GridFilters', {
 *         ...
 *         filters: [{
 *             // required configs
 *             type: 'date',
 *             dataIndex: 'dateAdded',
 *      
 *             // optional configs
 *             dateFormat: 'm/d/Y',  // default
 *             beforeText: 'Before', // default
 *             afterText: 'After',   // default
 *             onText: 'On',         // default
 *             pickerOpts: {
 *                 // any DatePicker configs
 *             },
 *      
 *             active: true // default is false
 *         }]
 *     });
 */
Ext.define('Ext.ux.grid.filter.DateFilter', {
    extend:  Ext.ux.grid.filter.Filter ,
    alias: 'gridfilter.date',
                                               

    /**
     * @cfg {String} afterText
     * Defaults to 'After'.
     */
    afterText : 'After',
    /**
     * @cfg {String} beforeText
     * Defaults to 'Before'.
     */
    beforeText : 'Before',
    /**
     * @cfg {Object} compareMap
     * Map for assigning the comparison values used in serialization.
     */
    compareMap : {
        before: 'lt',
        after:  'gt',
        on:     'eq'
    },
    /**
     * @cfg {String} dateFormat
     * The date format to return when using getValue.
     * Defaults to 'm/d/Y'.
     */
    dateFormat : 'm/d/Y',

    /**
     * @cfg {Date} maxDate
     * Allowable date as passed to the Ext.DatePicker
     * Defaults to undefined.
     */
    /**
     * @cfg {Date} minDate
     * Allowable date as passed to the Ext.DatePicker
     * Defaults to undefined.
     */
    /**
     * @cfg {Array} menuItems
     * The items to be shown in this menu
     * Defaults to:<pre>
     * menuItems : ['before', 'after', '-', 'on'],
     * </pre>
     */
    menuItems : ['before', 'after', '-', 'on'],

    /**
     * @cfg {Object} menuItemCfgs
     * Default configuration options for each menu item
     */
    menuItemCfgs : {
        selectOnFocus: true,
        width: 125
    },

    /**
     * @cfg {String} onText
     * Defaults to 'On'.
     */
    onText : 'On',

    /**
     * @cfg {Object} pickerOpts
     * Configuration options for the date picker associated with each field.
     */
    pickerOpts : {},

    /**
     * @private
     * Template method that is to initialize the filter and install required menu items.
     */
    init : function (config) {
        var me = this,
            pickerCfg, i, len, item, cfg;

        pickerCfg = Ext.apply(me.pickerOpts, {
            xtype: 'datepicker',
            minDate: me.minDate,
            maxDate: me.maxDate,
            format:  me.dateFormat,
            listeners: {
                scope: me,
                select: me.onMenuSelect
            }
        });

        me.fields = {};
        for (i = 0, len = me.menuItems.length; i < len; i++) {
            item = me.menuItems[i];
            if (item !== '-') {
                cfg = {
                    itemId: 'range-' + item,
                    text: me[item + 'Text'],
                    menu: Ext.create('Ext.menu.Menu', {
                        plain: true,
                        items: [
                            Ext.apply(pickerCfg, {
                                itemId: item,
                                listeners: {
                                    select: me.onPickerSelect,
                                    scope: me
                                }
                            })
                        ]
                    }),
                    listeners: {
                        scope: me,
                        checkchange: me.onCheckChange
                    }
                };
                item = me.fields[item] = Ext.create('Ext.menu.CheckItem', cfg);
            }
            //me.add(item);
            me.menu.add(item);
        }
        me.values = {};
    },

    onCheckChange : function (item, checked) {
        var me = this,
            picker = item.menu.items.first(),
            itemId = picker.itemId,
            values = me.values;

        if (checked) {
            values[itemId] = picker.getValue();
        } else {
            delete values[itemId]
        }
        me.setActive(me.isActivatable());
        me.fireEvent('update', me);
    },

    /**
     * @private
     * Handler method called when there is a keyup event on an input
     * item of this menu.
     */
    onInputKeyUp : function (field, e) {
        var k = e.getKey();
        if (k == e.RETURN && field.isValid()) {
            e.stopEvent();
            this.menu.hide();
        }
    },

    /**
     * Handler for when the DatePicker for a field fires the 'select' event
     * @param {Ext.picker.Date} picker
     * @param {Object} date
     */
    onMenuSelect : function (picker, date) {
        var fields = this.fields,
            field = this.fields[picker.itemId];

        field.setChecked(true);

        if (field == fields.on) {
            fields.before.setChecked(false, true);
            fields.after.setChecked(false, true);
        } else {
            fields.on.setChecked(false, true);
            if (field == fields.after && this.getFieldValue('before') < date) {
                fields.before.setChecked(false, true);
            } else if (field == fields.before && this.getFieldValue('after') > date) {
                fields.after.setChecked(false, true);
            }
        }
        this.fireEvent('update', this);

        picker.up('menu').hide();
    },

    /**
     * @private
     * Template method that is to get and return the value of the filter.
     * @return {String} The value of this filter
     */
    getValue : function () {
        var key, result = {};
        for (key in this.fields) {
            if (this.fields[key].checked) {
                result[key] = this.getFieldValue(key);
            }
        }
        return result;
    },

    /**
     * @private
     * Template method that is to set the value of the filter.
     * @param {Object} value The value to set the filter
     * @param {Boolean} preserve true to preserve the checked status
     * of the other fields.  Defaults to false, unchecking the
     * other fields
     */
    setValue : function (value, preserve) {
        var key;
        for (key in this.fields) {
            if(value[key]){
                this.getPicker(key).setValue(value[key]);
                this.fields[key].setChecked(true);
            } else if (!preserve) {
                this.fields[key].setChecked(false);
            }
        }
        this.fireEvent('update', this);
    },

    /**
     * Template method that is to return <tt>true</tt> if the filter
     * has enough configuration information to be activated.
     * @return {Boolean}
     */
    isActivatable : function () {
        var key;
        for (key in this.fields) {
            if (this.fields[key].checked) {
                return true;
            }
        }
        return false;
    },

    /**
     * @private
     * Template method that is to get and return serialized filter data for
     * transmission to the server.
     * @return {Object/Array} An object or collection of objects containing
     * key value pairs representing the current configuration of the filter.
     */
    getSerialArgs : function () {
        var args = [];
        for (var key in this.fields) {
            if(this.fields[key].checked){
                args.push({
                    type: 'date',
                    comparison: this.compareMap[key],
                    value: Ext.Date.format(this.getFieldValue(key), this.dateFormat)
                });
            }
        }
        return args;
    },

    /**
     * Get and return the date menu picker value
     * @param {String} item The field identifier ('before', 'after', 'on')
     * @return {Date} Gets the current selected value of the date field
     */
    getFieldValue : function(item){
        return this.values[item];
    },

    /**
     * Gets the menu picker associated with the passed field
     * @param {String} item The field identifier ('before', 'after', 'on')
     * @return {Object} The menu picker
     */
    getPicker : function(item){
        return this.fields[item].menu.items.first();
    },

    /**
     * Template method that is to validate the provided Ext.data.Record
     * against the filters configuration.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord : function (record) {
        var key,
            pickerValue,
            val = record.get(this.dataIndex),
            clearTime = Ext.Date.clearTime;

        if(!Ext.isDate(val)){
            return false;
        }
        val = clearTime(val, true).getTime();

        for (key in this.fields) {
            if (this.fields[key].checked) {
                pickerValue = clearTime(this.getFieldValue(key), true).getTime();
                if (key == 'before' && pickerValue <= val) {
                    return false;
                }
                if (key == 'after' && pickerValue >= val) {
                    return false;
                }
                if (key == 'on' && pickerValue != val) {
                    return false;
                }
            }
        }
        return true;
    },

    onPickerSelect: function(picker, date) {
        // keep track of the picker value separately because the menu gets destroyed
        // when columns order changes.  We return this value from getValue() instead
        // of picker.getValue()
        this.values[picker.itemId] = date;
        this.fireEvent('update', this);
    }
});

/**
 * Filter by a configurable Ext.picker.DatePicker menu
 *
 * This filter allows for the following configurations:
 *
 * - Any of the normal configs will be passed through to either component.
 * - There can be a docked config.
 * - The timepicker can be on the right or left (datepicker, too, of course).
 * - Choose which component will initiate the filtering, i.e., the event can be
 *   configured to be bound to either the datepicker or the timepicker, or if
 *   there is a docked config it be automatically have the handler bound to it.
 *
 * Although not shown here, this class accepts all configuration options
 * for {@link Ext.picker.Date} and {@link Ext.picker.Time}.
 *
 * In the case that a custom dockedItems config is passed in, the
 * class will handle binding the default listener to it so the
 * developer need not worry about having to do it.
 *
 * The default dockedItems position and the toolbar's
 * button text can be passed a config for convenience, i.e.,:
 *
 *     dock: {
 *        buttonText: 'Click to Filter',
 *        dock: 'left'
 *     }
 *
 * Or, pass in a full dockedItems config:
 *
 *     dock: {
 *        dockedItems: {
 *            xtype: 'toolbar',
 *            dock: 'bottom',
 *            ...
 *        }
 *     }
 *
 * Or, give a value of `true` to accept dock defaults:
 *
 *     dock: true
 *
 * But, it must be one or the other.
 *
 * Example Usage:
 *
 *     var filters = Ext.create('Ext.ux.grid.GridFilters', {
 *         ...
 *         filters: [{
 *             // required configs
 *             type: 'datetime',
 *             dataIndex: 'date',
 *
 *             // optional configs
 *             positionDatepickerFirst: false,
 *             //selectDateToFilter: false, // this is overridden b/c of the presence of the dock cfg object
 *
 *             date: {
 *                 format: 'm/d/Y',
 *             },
 *
 *             time: {
 *                 format: 'H:i:s A',
 *                 increment: 1
 *             },
 *
 *             dock: {
 *                 buttonText: 'Click to Filter',
 *                 dock: 'left'
 *
 *                 // allows for custom dockedItems cfg
 *                 //dockedItems: {}
 *             }
 *         }]
 *     });
 *
 * In the above example, note that the filter is being passed a {@link #date} config object,
 * a {@link #time} config object and a {@link #dock} config. These are all optional.
 *
 * As for positioning, the datepicker will be on the right, the timepicker on the left
 * and the docked items will be docked on the left. In addition, since there's a {@link #dock}
 * config, clicking the button in the dock will trigger the filtering.
 */
Ext.define('Ext.ux.grid.filter.DateTimeFilter', {
    extend:  Ext.ux.grid.filter.DateFilter ,
    alias: 'gridfilter.datetime',

    /**
     * @private
     */
    dateDefaults: {
        xtype: 'datepicker',
        format: 'm/d/Y'
    },

    /**
     * @private
     */
    timeDefaults: {
        xtype: 'timepicker',
        width: 100,
        height: 200,
        format: 'g:i A'
    },

    /**
     * @private
     */
    dockDefaults: {
        dock: 'top',
        buttonText: 'Filter'
    },

    /**
     * @cfg {Object} date
     * A {@link Ext.picker.Date} can be configured here.
     * Uses {@link #dateDefaults} by default.
     */

    /**
     * @cfg {Object} time
     * A {@link Ext.picker.Time} can be configured here.
     * Uses {@link #timeDefaults} by default.
     */

    /**
     * @cfg {Boolean/Object} dock
     * A {@link Ext.panel.AbstractPanel#cfg-dockedItems} can be configured here.
     * A `true` value will use the {@link #dockDefaults} default configuration.
     * If present, the button in the docked items will initiate the filtering.
     */

    /**
     * @cfg {Boolean} [selectDateToFilter=true]
     * By default, the datepicker has the default event listener bound to it.
     * Setting to `false` will bind it to the timepicker.
     *
     * The config will be ignored if there is a `dock` config.
     */
    selectDateToFilter: true,

    /**
     * @cfg {Boolean} [positionDatepickerFirst=true]
     * Positions the datepicker within its container.
     * A `true` value will place it on the left in the container.
     * Set to `false` if the timepicker should be placed on the left.
     * Defaults to `true`.
     */
    positionDatepickerFirst: true,

    reTime: /\s(am|pm)/i,
    reItemId: /\w*-(\w*)$/,

    /**
     * Replaces the selected value of the timepicker with the default 00:00:00.
     * @private
     * @param {Object} date
     * @param {Ext.picker.Time} timepicker
     * @return Date object
     */
    addTimeSelection: function (date, timepicker) {
        var me = this,
            selection = timepicker.getSelectionModel().getSelection(),
            time, len, fn, val,
            i = 0,
            arr = [],
            timeFns = ['setHours', 'setMinutes', 'setSeconds', 'setMilliseconds'];


        if (selection.length) {
            time = selection[0].get('disp');

            // Loop through all of the splits and add the time values.
            arr = time.replace(me.reTime, '').split(':');

            for (len = arr.length; i < len; i++) {
                fn = timeFns[i];
                val = arr[i];

                if (val) {
                    date[fn](parseInt(val, 10));
                }
            }
        }

        return date;
    },

    /**
     * @private
     * Template method that is to initialize the filter and install required menu items.
     */
    init: function (config) {
        var me = this,
            dateCfg = Ext.applyIf(me.date || {}, me.dateDefaults),
            timeCfg = Ext.applyIf(me.time || {}, me.timeDefaults),
            dockCfg = me.dock, // should not default to empty object
            defaultListeners = {
                click: {
                    scope: me,
                    click: me.onMenuSelect
                },
                select: {
                    scope: me,
                    select: me.onMenuSelect
                }
            },
            pickerCtnCfg, i, len, item, cfg,
            items = [dateCfg, timeCfg],

            // we need to know the datepicker's position in the items array
            // for when the itemId name is bound to it before adding to the menu
            datepickerPosition = 0;

        if (!me.positionDatepickerFirst) {
            items = items.reverse();
            datepickerPosition = 1;
        }

        pickerCtnCfg = Ext.apply(me.pickerOpts, {
            xtype: !dockCfg ? 'container' : 'panel',
            layout: 'hbox',
            items: items
        });

        // If there's no dock config then bind the default listener to the desired picker.
        if (!dockCfg) {
            if (me.selectDateToFilter) {
                dateCfg.listeners = defaultListeners.select;
            } else {
                timeCfg.listeners = defaultListeners.select;
            }
        } else if (dockCfg) {
            me.selectDateToFilter = null;

            if (dockCfg.dockedItems) {
                pickerCtnCfg.dockedItems = dockCfg.dockedItems;
                // TODO: allow config that will tell which item to bind the listener to
                // right now, it's using the first item
                pickerCtnCfg.dockedItems.items[dockCfg.bindToItem || 0].listeners = defaultListeners.click;
            } else {
                // dockCfg can be `true` if button text and dock position defaults are wanted
                if (Ext.isBoolean(dockCfg)) {
                    dockCfg = {};
                }
                dockCfg = Ext.applyIf(dockCfg, me.dockDefaults);
                pickerCtnCfg.dockedItems = {
                    xtype: 'toolbar',
                    dock: dockCfg.dock,
                    items: [
                        {
                            xtype: 'button',
                            text: dockCfg.buttonText,
                            flex: 1,
                            listeners: defaultListeners.click
                        }
                    ]   
                };
            }
        }

        me.fields = {};
        for (i = 0, len = me.menuItems.length; i < len; i++) {
            item = me.menuItems[i];
            if (item !== '-') {
                pickerCtnCfg.items[datepickerPosition].itemId = item;

                cfg = {
                    itemId: 'range-' + item,
                    text: me[item + 'Text'],
                    menu: Ext.create('Ext.menu.Menu', {
                        items: pickerCtnCfg
                    }),
                    listeners: {
                        scope: me,
                        checkchange: me.onCheckChange
                    }
                };
                item = me.fields[item] = Ext.create('Ext.menu.CheckItem', cfg);
            }
            me.menu.add(item);
        }
        me.values = {};
    },

    /**
     * @private
     */
    onCheckChange: function (item, checked) {
        var me = this,
            menu = item.menu,
            timepicker = menu.down('timepicker'),
            datepicker = menu.down('datepicker'),
            itemId = datepicker.itemId,
            values = me.values;

        if (checked) {
            values[itemId] = me.addTimeSelection(datepicker.value, timepicker);
        } else {
            delete values[itemId];
        }
        me.setActive(me.isActivatable());
        me.fireEvent('update', me);
    },

    /** 
     * Handler for when the DatePicker for a field fires the 'select' event
     * @param {Ext.picker.Date} picker
     * @param {Object} date
     */
    onMenuSelect: function (picker, date) {
        // NOTE: we need to redefine the picker.
        var me = this,
            menu = me.menu,
            checkItemId = menu.getFocusEl().itemId.replace(me.reItemId, '$1'),
            fields = me.fields,
            field;

        picker = menu.queryById(checkItemId);
        field = me.fields[picker.itemId];
        field.setChecked(true);

        if (field == fields.on) {
            fields.before.setChecked(false, true);
            fields.after.setChecked(false, true);
        } else {
            fields.on.setChecked(false, true);
            if (field == fields.after && me.getFieldValue('before') < date) {
                fields.before.setChecked(false, true);
            } else if (field == fields.before && me.getFieldValue('after') > date) {
                fields.after.setChecked(false, true);
            }   
        }   
        me.fireEvent('update', me);

        // The timepicker's getBubbleTarget() returns the boundlist's implementation,
        // so it doesn't look up ownerCt chain (it looks up this.pickerField).
        // This is a problem :)
        // This can be fixed by just walking up the ownerCt chain
        // (same thing, but confusing without comment).
        picker.ownerCt.ownerCt.hide();
    },

    /**
     * @private
     * Template method that is to get and return serialized filter data for
     * transmission to the server.
     * @return {Object/Array} An object or collection of objects containing
     * key value pairs representing the current configuration of the filter.
     */
    getSerialArgs: function () {
        var me = this,
            key,
            fields = me.fields,
            args = [];

        for (key in fields) {
            if (fields[key].checked) {
                args.push({
                    type: 'datetime',
                    comparison: me.compareMap[key],
                    value: Ext.Date.format(me.getFieldValue(key), (me.date.format || me.dateDefaults.format) + ' ' + (me.time.format || me.timeDefaults.format))
                });
            }
        }
        return args;
    },

    /**
     * @private
     * Template method that is to set the value of the filter.
     * @param {Object} value The value to set the filter
     * @param {Boolean} preserve true to preserve the checked status
     * of the other fields.  Defaults to false, unchecking the
     * other fields
     */
    setValue: function (value, preserve) {
        var me = this,
            fields = me.fields,
            key,
            val,
            datepicker;

        for (key in fields) {
            val = value[key];
            if (val) {
                datepicker = me.menu.down('datepicker[itemId="' + key + '"]');
                // Note that calling the Ext.picker.Date:setValue() calls Ext.Date.clearTime(),
                // which we don't want, so just call update() instead and set the value on the component.
                datepicker.update(val);
                datepicker.value = val;

                fields[key].setChecked(true);
            } else if (!preserve) {
                fields[key].setChecked(false);
            }
        }
        me.fireEvent('update', me);
    },

    /**
     * Template method that is to validate the provided Ext.data.Record
     * against the filters configuration.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord: function (record) {
        // remove calls to Ext.Date.clearTime
        var me = this,
            key,
            pickerValue,
            val = record.get(me.dataIndex);

        if(!Ext.isDate(val)){
            return false;
        }

        val = val.getTime();

        for (key in me.fields) {
            if (me.fields[key].checked) {
                pickerValue = me.getFieldValue(key).getTime();
                if (key == 'before' && pickerValue <= val) {
                    return false;
                }
                if (key == 'after' && pickerValue >= val) {
                    return false;
                }
                if (key == 'on' && pickerValue != val) {
                    return false;
                }
            }
        }
        return true;
    }
});

/**
 * List filters are able to be preloaded/backed by an Ext.data.Store to load
 * their options the first time they are shown. ListFilter utilizes the
 * {@link Ext.ux.grid.menu.ListMenu} component.
 *
 * List filters are also able to create their own list of values from  all unique values of
 * the specified {@link #dataIndex} field in the store at first time of filter invocation.
 *
 * Although not shown here, this class accepts all configuration options
 * for {@link Ext.ux.grid.menu.ListMenu}.
 *
 * Example Usage:
 *
 *     var filters = Ext.create('Ext.ux.grid.GridFilters', {
 *         ...
 *         filters: [{
 *             type: 'list',
 *             dataIndex: 'size',
 *             phpMode: true,
 *             // options will be used as data to implicitly creates an ArrayStore
 *             options: ['extra small', 'small', 'medium', 'large', 'extra large']
 *         }]
 *     });
 *
 */
Ext.define('Ext.ux.grid.filter.ListFilter', {
    extend:  Ext.ux.grid.filter.Filter ,
    alias: 'gridfilter.list',

    /**
     * @cfg {Array} [options]
     * `data` to be used to implicitly create a data store
     * to back this list when the data source is **local**. If the
     * data for the list is remote, use the {@link #store}
     * config instead.
     *
     * If neither store nor {@link #options} is specified, then the choices list is automatically
     * populated from all unique values of the specified {@link #dataIndex} field in the store at first
     * time of filter invocation.
     *
     * Each item within the provided array may be in one of the
     * following formats:
     *
     *   - **Array** :
     *
     *         options: [
     *             [11, 'extra small'],
     *             [18, 'small'],
     *             [22, 'medium'],
     *             [35, 'large'],
     *             [44, 'extra large']
     *         ]
     *
     *   - **Object** :
     *
     *         labelField: 'name', // override default of 'text'
     *         options: [
     *             {id: 11, name:'extra small'},
     *             {id: 18, name:'small'},
     *             {id: 22, name:'medium'},
     *             {id: 35, name:'large'},
     *             {id: 44, name:'extra large'}
     *         ]
     * 
     *   - **String** :
     *
     *         options: ['extra small', 'small', 'medium', 'large', 'extra large']
     *
     */
    /**
     * @cfg {Boolean} phpMode
     * Adjust the format of this filter. Defaults to false.
     *
     * When GridFilters `@cfg encode = false` (default):
     *
     *     // phpMode == false (default):
     *     filter[0][data][type] list
     *     filter[0][data][value] value1
     *     filter[0][data][value] value2
     *     filter[0][field] prod
     *
     *     // phpMode == true:
     *     filter[0][data][type] list
     *     filter[0][data][value] value1, value2
     *     filter[0][field] prod
     *
     * When GridFilters `@cfg encode = true`:
     *
     *     // phpMode == false (default):
     *     filter : [{"type":"list","value":["small","medium"],"field":"size"}]
     *
     *     // phpMode == true:
     *     filter : [{"type":"list","value":"small,medium","field":"size"}]
     *
     */
    phpMode : false,
    /**
     * @cfg {Ext.data.Store} [store]
     * The {@link Ext.data.Store} this list should use as its data source
     * when the data source is **remote**. If the data for the list
     * is local, use the {@link #options} config instead.
     *
     * If neither store nor {@link #options} is specified, then the choices list is automatically
     * populated from all unique values of the specified {@link #dataIndex} field in the store at first
     * time of filter invocation.
     */

    /**
     * @private
     * Template method that is to initialize the filter.
     * @param {Object} config
     */
    init : function (config) {
        this.dt = Ext.create('Ext.util.DelayedTask', this.fireUpdate, this);
    },

    /**
     * @private @override
     * Creates the Menu for this filter.
     * @param {Object} config Filter configuration
     * @return {Ext.menu.Menu}
     */
    createMenu: function(config) {
        var menu = Ext.create('Ext.ux.grid.menu.ListMenu', config);
        menu.on('checkchange', this.onCheckChange, this);
        return menu;
    },

    /**
     * @private
     * Template method that is to get and return the value of the filter.
     * @return {String} The value of this filter
     */
    getValue : function () {
        return this.menu.getSelected();
    },
    /**
     * @private
     * Template method that is to set the value of the filter.
     * @param {Object} value The value to set the filter
     */
    setValue : function (value) {
        this.menu.setSelected(value);
        this.fireEvent('update', this);
    },

    /**
     * Template method that is to return true if the filter
     * has enough configuration information to be activated.
     * @return {Boolean}
     */
    isActivatable : function () {
        return this.getValue().length > 0;
    },

    /**
     * @private
     * Template method that is to get and return serialized filter data for
     * transmission to the server.
     * @return {Object/Array} An object or collection of objects containing
     * key value pairs representing the current configuration of the filter.
     */
    getSerialArgs : function () {
        return {type: 'list', value: this.phpMode ? this.getValue().join(',') : this.getValue()};
    },

    /** @private */
    onCheckChange : function(){
        this.dt.delay(this.updateBuffer);
    },


    /**
     * Template method that is to validate the provided Ext.data.Record
     * against the filters configuration.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord : function (record) {
        var valuesArray = this.getValue();
        return Ext.Array.indexOf(valuesArray, record.get(this.dataIndex)) > -1;
    }
});

/**
 * Filters using an Ext.ux.grid.menu.RangeMenu.
 * <p><b><u>Example Usage:</u></b></p>
 * <pre><code>
var filters = Ext.create('Ext.ux.grid.GridFilters', {
    ...
    filters: [{
        type: 'numeric',
        dataIndex: 'price'
    }]
});
 * </code></pre>
 * <p>Any of the configuration options for {@link Ext.ux.grid.menu.RangeMenu} can also be specified as
 * configurations to NumericFilter, and will be copied over to the internal menu instance automatically.</p>
 */
Ext.define('Ext.ux.grid.filter.NumericFilter', {
    extend:  Ext.ux.grid.filter.Filter ,
    alias: 'gridfilter.numeric',
                                    

    /**
     * @private @override
     * Creates the Menu for this filter.
     * @param {Object} config Filter configuration
     * @return {Ext.menu.Menu}
     */
    createMenu: function(config) {
        var me = this,
            menu;
        menu = Ext.create('Ext.ux.grid.menu.RangeMenu', config);
        menu.on('update', me.fireUpdate, me);
        return menu;
    },

    /**
     * @private
     * Template method that is to get and return the value of the filter.
     * @return {String} The value of this filter
     */
    getValue : function () {
        return this.menu.getValue();
    },

    /**
     * @private
     * Template method that is to set the value of the filter.
     * @param {Object} value The value to set the filter
     */
    setValue : function (value) {
        this.menu.setValue(value);
    },

    /**
     * Template method that is to return <tt>true</tt> if the filter
     * has enough configuration information to be activated.
     * @return {Boolean}
     */
    isActivatable : function () {
        var values = this.getValue(),
            key;
        for (key in values) {
            if (values[key] !== undefined) {
                return true;
            }
        }
        return false;
    },

    /**
     * @private
     * Template method that is to get and return serialized filter data for
     * transmission to the server.
     * @return {Object/Array} An object or collection of objects containing
     * key value pairs representing the current configuration of the filter.
     */
    getSerialArgs : function () {
        var key,
            args = [],
            values = this.menu.getValue();
        for (key in values) {
            args.push({
                type: 'numeric',
                comparison: key,
                value: values[key]
            });
        }
        return args;
    },

    /**
     * Template method that is to validate the provided Ext.data.Record
     * against the filters configuration.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord : function (record) {
        var val = record.get(this.dataIndex),
            values = this.getValue(),
            isNumber = Ext.isNumber;
        if (isNumber(values.eq) && val != values.eq) {
            return false;
        }
        if (isNumber(values.lt) && val >= values.lt) {
            return false;
        }
        if (isNumber(values.gt) && val <= values.gt) {
            return false;
        }
        return true;
    }
});

/**
 * Filter by a configurable Ext.form.field.Text
 * <p><b><u>Example Usage:</u></b></p>
 * <pre><code>
var filters = Ext.create('Ext.ux.grid.GridFilters', {
    ...
    filters: [{
        // required configs
        type: 'string',
        dataIndex: 'name',

        // optional configs
        value: 'foo',
        active: true, // default is false
        iconCls: 'ux-gridfilter-text-icon' // default
        // any Ext.form.field.Text configs accepted
    }]
});
 * </code></pre>
 */
Ext.define('Ext.ux.grid.filter.StringFilter', {
    extend:  Ext.ux.grid.filter.Filter ,
    alias: 'gridfilter.string',

    /**
     * @cfg {String} iconCls
     * The iconCls to be applied to the menu item.
     * Defaults to <tt>'ux-gridfilter-text-icon'</tt>.
     */
    iconCls : 'ux-gridfilter-text-icon',

    emptyText: 'Enter Filter Text...',
    selectOnFocus: true,
    width: 125,

    /**
     * @private
     * Template method that is to initialize the filter and install required menu items.
     */
    init : function (config) {
        Ext.applyIf(config, {
            enableKeyEvents: true,
            labelCls: 'ux-rangemenu-icon ' + this.iconCls,
            hideEmptyLabel: false,
            labelSeparator: '',
            labelWidth: 29,
            listeners: {
                scope: this,
                keyup: this.onInputKeyUp,
                el: {
                    click: function(e) {
                        e.stopPropagation();
                    }
                }
            }
        });

        this.inputItem = Ext.create('Ext.form.field.Text', config);
        this.menu.add(this.inputItem);
        this.menu.showSeparator = false;
        this.updateTask = Ext.create('Ext.util.DelayedTask', this.fireUpdate, this);
    },

    /**
     * @private
     * Template method that is to get and return the value of the filter.
     * @return {String} The value of this filter
     */
    getValue : function () {
        return this.inputItem.getValue();
    },

    /**
     * @private
     * Template method that is to set the value of the filter.
     * @param {Object} value The value to set the filter
     */
    setValue : function (value) {
        this.inputItem.setValue(value);
        this.fireEvent('update', this);
    },

    /**
     * Template method that is to return <tt>true</tt> if the filter
     * has enough configuration information to be activated.
     * @return {Boolean}
     */
    isActivatable : function () {
        return this.inputItem.getValue().length > 0;
    },

    /**
     * @private
     * Template method that is to get and return serialized filter data for
     * transmission to the server.
     * @return {Object/Array} An object or collection of objects containing
     * key value pairs representing the current configuration of the filter.
     */
    getSerialArgs : function () {
        return {type: 'string', value: this.getValue()};
    },

    /**
     * Template method that is to validate the provided Ext.data.Record
     * against the filters configuration.
     * @param {Ext.data.Record} record The record to validate
     * @return {Boolean} true if the record is valid within the bounds
     * of the filter, false otherwise.
     */
    validateRecord : function (record) {
        var val = record.get(this.dataIndex);

        if(typeof val != 'string') {
            return (this.getValue().length === 0);
        }

        return val.toLowerCase().indexOf(this.getValue().toLowerCase()) > -1;
    },

    /**
     * @private
     * Handler method called when there is a keyup event on this.inputItem
     */
    onInputKeyUp : function (field, e) {
        var k = e.getKey();
        if (k == e.RETURN && field.isValid()) {
            e.stopEvent();
            this.menu.hide();
            return;
        }
        // restart the timer
        this.updateTask.delay(this.updateBuffer);
    }
});

/**
 * This is a supporting class for {@link Ext.ux.grid.filter.ListFilter}.
 * Although not listed as configuration options for this class, this class
 * also accepts all configuration options from {@link Ext.ux.grid.filter.ListFilter}.
 */
Ext.define('Ext.ux.grid.menu.ListMenu', {
    extend:  Ext.menu.Menu ,
    
    /**
     * @cfg {String} idField
     * Defaults to 'id'.
     */
    idField :  'id',

    /**
     * @cfg {String} labelField
     * Defaults to 'text'.
     */
    labelField :  'text',
    /**
     * @cfg {String} paramPrefix
     * Defaults to 'Loading...'.
     */
    loadingText : 'Loading...',
    /**
     * @cfg {Boolean} loadOnShow
     * Defaults to true.
     */
    loadOnShow : true,
    /**
     * @cfg {Boolean} single
     * Specify true to group all items in this list into a single-select
     * radio button group. Defaults to false.
     */
    single : false,

    plain: true,

    constructor : function (cfg) {
        var me = this,
            options,
            i,
            len,
            value;
            
        me.selected = [];
        me.addEvents(
            /**
             * @event checkchange
             * Fires when there is a change in checked items from this list
             * @param {Object} item Ext.menu.CheckItem
             * @param {Object} checked The checked value that was set
             */
            'checkchange'
        );

        me.callParent(arguments);

        // A ListMenu which is completely unconfigured acquires its store from the unique values of its field in the store
        if (!me.store && !me.options) {
            me.options = me.grid.store.collect(me.dataIndex, false, true);
        }

        if (!me.store && me.options) {
            options = [];
            for(i = 0, len = me.options.length; i < len; i++) {
                value = me.options[i];
                switch (Ext.type(value)) {
                    case 'array': 
                        options.push(value);
                        break;
                    case 'object':
                        options.push([value[me.idField], value[me.labelField]]);
                        break;
                    default:
                        if (value != null) {
                            options.push([value, value]);
                        }
                }
            }

            me.store = Ext.create('Ext.data.ArrayStore', {
                fields: [me.idField, me.labelField],
                data:   options,
                listeners: {
                    load: me.onLoad,
                    scope:  me
                }
            });
            me.loaded = true;
            me.autoStore = true;
        } else {
            me.add({
                text: me.loadingText,
                iconCls: 'loading-indicator'
            });
            me.store.on('load', me.onLoad, me);
        }
    },

    destroy : function () {
        var me = this,
            store = me.store;
            
        if (store) {
            if (me.autoStore) {
                store.destroyStore();
            } else {
                store.un('unload', me.onLoad, me);
            }
        }
        me.callParent();
    },

    /**
     * Lists will initially show a 'loading' item while the data is retrieved from the store.
     * In some cases the loaded data will result in a list that goes off the screen to the
     * right (as placement calculations were done with the loading item). This adapter will
     * allow show to be called with no arguments to show with the previous arguments and
     * thus recalculate the width and potentially hang the menu from the left.
     */
    show : function () {
        var me = this;
        if (me.loadOnShow && !me.loaded && !me.store.loading) {
            me.store.load();
        }
        me.callParent();
    },

    /** @private */
    onLoad : function (store, records) {
        var me = this,
            gid, itemValue, i, len,
            listeners = {
                checkchange: me.checkChange,
                scope: me
            };

        Ext.suspendLayouts();
        me.removeAll(true);
        gid = me.single ? Ext.id() : null;
        for (i = 0, len = records.length; i < len; i++) {
            itemValue = records[i].get(me.idField);
            me.add(Ext.create('Ext.menu.CheckItem', {
                text: records[i].get(me.labelField),
                group: gid,
                checked: Ext.Array.contains(me.selected, itemValue),
                hideOnClick: false,
                value: itemValue,
                listeners: listeners
            }));
        }

        me.loaded = true;
        Ext.resumeLayouts(true);
        me.fireEvent('load', me, records);
    },

    /**
     * Get the selected items.
     * @return {Array} selected
     */
    getSelected : function () {
        return this.selected;
    },

    /** @private */
    setSelected : function (value) {
        value = this.selected = [].concat(value);

        if (this.loaded) {
            this.items.each(function(item){
                item.setChecked(false, true);
                for (var i = 0, len = value.length; i < len; i++) {
                    if (item.value == value[i]) {
                        item.setChecked(true, true);
                    }
                }
            });
        }
    },

    /**
     * Handler for the 'checkchange' event from an check item in this menu
     * @param {Object} item Ext.menu.CheckItem
     * @param {Object} checked The checked value that was set
     */
    checkChange : function (item, checked) {
        var value = [];
        this.items.each(function(item){
            if (item.checked) {
                value.push(item.value);
            }
        });
        this.selected = value;

        this.fireEvent('checkchange', item, checked);
    }
});

/**
 * Custom implementation of {@link Ext.menu.Menu} that has preconfigured items for entering numeric
 * range comparison values: less-than, greater-than, and equal-to. This is used internally
 * by {@link Ext.ux.grid.filter.NumericFilter} to create its menu.
 */
Ext.define('Ext.ux.grid.menu.RangeMenu', {
    extend:  Ext.menu.Menu ,

    /**
     * @cfg {String} fieldCls
     * The Class to use to construct each field item within this menu
     * Defaults to:<pre>
     * fieldCls : Ext.form.field.Number
     * </pre>
     */
    fieldCls : 'Ext.form.field.Number',

    /**
     * @cfg {Object} fieldCfg
     * The default configuration options for any field item unless superseded
     * by the <code>{@link #fields}</code> configuration.
     * Defaults to:<pre>
     * fieldCfg : {}
     * </pre>
     * Example usage:
     * <pre><code>
fieldCfg : {
    width: 150,
},
     * </code></pre>
     */

    /**
     * @cfg {Object} fields
     * The field items may be configured individually
     * Defaults to <tt>undefined</tt>.
     * Example usage:
     * <pre><code>
fields : {
    gt: { // override fieldCfg options
        width: 200,
        fieldCls: Ext.ux.form.CustomNumberField // to override default {@link #fieldCls}
    }
},
     * </code></pre>
     */

    /**
     * @cfg {Object} itemIconCls
     * The itemIconCls to be applied to each comparator field item.
     * Defaults to:<pre>
itemIconCls : {
    gt : 'ux-rangemenu-gt',
    lt : 'ux-rangemenu-lt',
    eq : 'ux-rangemenu-eq'
}
     * </pre>
     */
    itemIconCls : {
        gt : 'ux-rangemenu-gt',
        lt : 'ux-rangemenu-lt',
        eq : 'ux-rangemenu-eq'
    },

    /**
     * @cfg {Object} fieldLabels
     * Accessible label text for each comparator field item. Can be overridden by localization
     * files. Defaults to:<pre>
fieldLabels : {
     gt: 'Greater Than',
     lt: 'Less Than',
     eq: 'Equal To'
}</pre>
     */
    fieldLabels: {
        gt: 'Greater Than',
        lt: 'Less Than',
        eq: 'Equal To'
    },

    /**
     * @cfg {Object} menuItemCfgs
     * Default configuration options for each menu item
     * Defaults to:<pre>
menuItemCfgs : {
    emptyText: 'Enter Filter Text...',
    selectOnFocus: true,
    width: 125
}
     * </pre>
     */
    menuItemCfgs : {
        emptyText: 'Enter Number...',
        selectOnFocus: false,
        width: 155
    },

    /**
     * @cfg {Array} menuItems
     * The items to be shown in this menu.  Items are added to the menu
     * according to their position within this array. Defaults to:<pre>
     * menuItems : ['lt','gt','-','eq']
     * </pre>
     */
    menuItems : ['lt', 'gt', '-', 'eq'],

    plain: true,

    constructor : function (config) {
        var me = this,
            fields, fieldCfg, i, len, item, cfg, Cls;

        me.callParent(arguments);

        fields = me.fields = me.fields || {};
        fieldCfg = me.fieldCfg = me.fieldCfg || {};
        
        me.addEvents(
            /**
             * @event update
             * Fires when a filter configuration has changed
             * @param {Ext.ux.grid.filter.Filter} this The filter object.
             */
            'update'
        );
      
        me.updateTask = Ext.create('Ext.util.DelayedTask', me.fireUpdate, me);
    
        for (i = 0, len = me.menuItems.length; i < len; i++) {
            item = me.menuItems[i];
            if (item !== '-') {
                // defaults
                cfg = {
                    itemId: 'range-' + item,
                    enableKeyEvents: true,
                    hideEmptyLabel: false,
                    labelCls: 'ux-rangemenu-icon ' + me.itemIconCls[item],
                    labelSeparator: '',
                    labelWidth: 29,
                    listeners: {
                        scope: me,
                        change: me.onInputChange,
                        keyup: me.onInputKeyUp,
                        el: {
                            click: this.stopFn
                        }
                    },
                    activate: Ext.emptyFn,
                    deactivate: Ext.emptyFn
                };
                Ext.apply(
                    cfg,
                    // custom configs
                    Ext.applyIf(fields[item] || {}, fieldCfg[item]),
                    // configurable defaults
                    me.menuItemCfgs
                );
                Cls = cfg.fieldCls || me.fieldCls;
                item = fields[item] = Ext.create(Cls, cfg);
            }
            me.add(item);
        }
    },
    
    stopFn: function(e) {
        e.stopPropagation();
    },

    /**
     * @private
     * called by this.updateTask
     */
    fireUpdate : function () {
        this.fireEvent('update', this);
    },
    
    /**
     * Get and return the value of the filter.
     * @return {String} The value of this filter
     */
    getValue : function () {
        var result = {},
            fields = this.fields, 
            key, field;
            
        for (key in fields) {
            if (fields.hasOwnProperty(key)) {
                field = fields[key];
                if (field.isValid() && field.getValue() !== null) {
                    result[key] = field.getValue();
                }
            }
        }
        return result;
    },
  
    /**
     * Set the value of this menu and fires the 'update' event.
     * @param {Object} data The data to assign to this menu
     */	
    setValue : function (data) {
        var me = this,
            fields = me.fields,
            key,
            field;

        for (key in fields) {
            if (fields.hasOwnProperty(key)) {
                // Prevent field's change event from tiggering a Store filter. The final upate event will do that
                field =fields[key];
                field.suspendEvents();
                field.setValue(key in data ? data[key] : '');
                field.resumeEvents();
            }
        }

        // Trigger the filering of the Store
        me.fireEvent('update', me);
    },

    /**  
     * @private
     * Handler method called when there is a keyup event on an input
     * item of this menu.
     */
    onInputKeyUp: function(field, e) {
        if (e.getKey() === e.RETURN && field.isValid()) {
            e.stopEvent();
            this.hide();
        }
    },

    /**
     * @private
     * Handler method called when the user changes the value of one of the input
     * items in this menu.
     */
    onInputChange: function(field) {
        var me = this,
            fields = me.fields,
            eq = fields.eq,
            gt = fields.gt,
            lt = fields.lt;

        if (field == eq) {
            if (gt) {
                gt.setValue(null);
            }
            if (lt) {
                lt.setValue(null);
            }
        }
        else {
            eq.setValue(null);
        }

        // restart the timer
        this.updateTask.delay(this.updateBuffer);
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

Commercial Usage
Licensees holding valid commercial licenses may use this file in accordance with the Commercial
Software License Agreement provided with the Software or, alternatively, in accordance with the
terms contained in a written agreement between you and Sencha.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
//
// Definitions of enums referenced in documentation.
//

/**
 * @enum [Ext.enums.Layout=layout.*]
 * Enumeration of all layout types.
 */

/**
 * @enum [Ext.enums.Widget=widget.*]
 * Enumeration of all xtypes.
 */

/**
 * @enum [Ext.enums.Plugin=plugin.*]
 * Enumeration of all ptypes.
 */

/**
 * @enum [Ext.enums.Feature=feature.*]
 * Enumeration of all ftypes.
 */


