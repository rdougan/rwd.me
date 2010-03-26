/**
 * Adds attachControllerListeners and detachControllerListeners to all Ext.Component subclasses.
 * Specify this.controllerListeners and attach them like this:
 * this.controllerListeners: = {
   'purchaseOrders': {
     'sent'  : this.refreshIfSameInstance,
     'closed': this.refreshIfSameInstance,
     'delete': this.close
   },
   'purchaseOrderLines': {
     'create' : this.refreshAfterPOLCreate,
     'update' : this.refreshAfterPOLCreate,
     'destroy': this.refreshAfterPOLCreate
   },
   'purchaseOrderLineCopies': {
     'create' : this.refreshAfterPOLCCreate,
     'update' : this.refreshAfterPOLCCreate,
     'destroy': this.refreshAfterPOLCCreate
   },
   'purchaseOrderLineCopyFunds': {
     'update': this.refreshIfSameInstance
   }
 };
 * 
 * controllerListeners are automatically attached and detached if present
 * 
 */
(function() {
  var originalDestroy       = Ext.Component.prototype.destroy,
      originalInitComponent = Ext.Component.prototype.initComponent;
  
  Ext.override(Ext.Component, {
    /**
     * Adds all listeners from this.controllerListeners.
     * @param {Boolean} detach Set to true to detach instead of attach (defaults to false)
     */
    attachControllerListeners: function(detach) {
      var method = detach === true ? 'un' : 'on';

      if (this.controllerListeners == undefined) return;

      for (var controllerName in this.controllerListeners) {
        var controller = ExtMVC.getController(controllerName),
            listeners  = this.controllerListeners[controllerName];

        for (eventName in listeners) {
          controller[method](eventName, listeners[eventName], this);
        }
      }
    },

    /**
     * Removes all attached controller listeners attached with this.attachControllerListeners
     */
    detachControllerListeners: function() {
      this.attachControllerListeners(true);
    },
    
    /**
     * Calls attachControllerListeners after normal init component
     */
    initComponent: function() {
      originalInitComponent.apply(this, arguments);
      
      this.attachControllerListeners();
    },
    
    /**
     * Calls detachControllerListeners before normal destroy operation
     */
    destroy: function() {
      this.detachControllerListeners();
      
      originalDestroy.apply(this, arguments);
    }
  });
})();

/**
 * @class RWD.App
 * @extends ExtMVC.App
 * The RWD application.
 */
ExtMVC.App.define({
  name       : "RWD",
  
  /**
   * Sets up the application's Viewport
   */
  launch: function() {
    Ext.QuickTips.init();
    
    this.menu = ExtMVC.buildView('layout', 'menu', {
      region   : 'west',
      width    : 240,
      listeners: {
        scope: this,
        click: function(node) {
          var attrs = node.attributes;
          
          if (attrs.controller != undefined) {
            ExtMVC.dispatch({controller: attrs.controller, action: attrs.action});
          }          
        }
      }
    });
    
    /**
     * @property main
     * @type Ext.Panel
     * A container into which views are rendered
     */
    this.main = new Ext.TabPanel({
      region: 'center',
      plain : true,
      cls   : 'mainPanel',
      
      enableTabScroll: true,
      listeners : {
        tabchange: function(tabPanel, tab){
          // Ext.History.add(tab.url);
        }
      }
    });
    
    this.viewport = new Ext.Viewport({
      layout: 'border',
      items:  [this.menu, this.main]
    });
    
    this.fireEvent('launched');
    
    ExtMVC.dispatch('posts', 'index');
    
    Ext.get('loading').remove();  
    Ext.get('loading-mask').fadeOut({remove:true});  
  }
});

/**
 * Defines all routes required for this application
 */
ExtMVC.router.Router.defineRoutes = function(map) {
  /**
   * Sets up REST-like urls for a given model or models:
   * 
   * map.resources('users');
   * 
   * Is equivalent to:
   * map.connect("users",           {controller: 'users', action: 'index'}); // #users
   * map.connect("users/new",       {controller: 'users', action: 'new'  }); // #users/new
   * map.connect("users/:id/edit/", {controller: 'users', action: 'edit' }); // #users/1/edit
   * map.connect("users/:id",       {controller: 'users', action: 'show' }); // #users/1
   * 
   * You can pass more than one model to a map.resources call, e.g.:
   *
   * map.resources('users', 'comments', 'pages', 'products');
   */
  
  //set up default routes
  map.connect(":controller/:action");
  map.connect(":controller/:action/:id");
  
  //if no url, should a default
  map.root({controller: 'posts', action: 'index'});
};

/**
 * @class Post
 * @extends ExtMVC.model.Base
 */
ExtMVC.registerModel("Post", {
  fields:    [
    {name: 'id',        type: 'float', virtual: true},
    {name: 'title',     type: 'string'},
    {name: 'body',      type: 'string'},
    {name: 'published', type: 'boolean'},
    // {name: 'tags',     virtual: true},
    
    // {
    //   name   : 'tag_list',
    //   convert: function(v, r) {
    //     r.tags.join(', ');
    //   }
    // },
    
    {name: 'created_at', type: 'string', virtual: true},
    {name: 'updated_at', type: 'string', virtual: true}
  ]
});

/**
 * @class Message
 * @extends ExtMVC.model.Base
 */
ExtMVC.registerModel("Message", {
  fields:    [
    {name: 'id',        type: 'float', virtual: true},
    {name: 'name',      type: 'string'},
    {name: 'email',     type: 'string'},
    {name: 'body',      type: 'string'},
    
    {name: 'created_at', type: 'date', virtual: true},
    {name: 'updated_at', type: 'date', virtual: true}
  ]
});

/**
 * @class RWD.controllers.ApplicationController
 * @extends ExtMVC.controller.CrudController
 * Shared application-wide controller. Place any application-specific code here that needs
 * to be shared amongst other application controllers, and make the other controllers in the
 * application extend this one
 */
ExtMVC.registerController("application", {
  extend: "controller"
});

/**
 * @class RWD.controllers.IndexController
 * @extends RWD.controllers.ApplicationController
 * Default root controller
 */
ExtMVC.registerController("index", {
  index: function() {
    this.render('index');
  }
});

/**
 * @class RWD.controllers.PostsController
 * @extends RWD.controllers.ApplicationController
 * CRUD controller for Addresses
 */
ExtMVC.registerController("posts", {
  extend: 'crud',
  model : ExtMVC.getModel("Post")
});

/**
 * @class RWD.controllers.MessagesController
 * @extends RWD.controllers.ApplicationController
 * 
 */
ExtMVC.registerController("messages", {
  extend: 'crud',
  model : ExtMVC.getModel("Message")
});

ExtMVC.registerView('posts', 'index', {
  xtype: 'scaffold_grid',
  
  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      store: ExtMVC.getModel("Post").find({}, {autoLoad: false}),
      model: ExtMVC.getModel("Post"),
      controllerListeners: {
        'posts': {
          'create': this.refresh,
          'update': this.refresh,
          'delete': this.refresh
        }
      }
    });
    
    ExtMVC.getView("scaffold", "index").prototype.constructor.call(this, config);
    
    this.on('activate', this.refresh, this);
  },
  
  refresh: function() {
    this.store.reload();
  },
  
  buildColumns: function() {
    return [
      {
        dataIndex: "id",
        header   : "#",
        sortable : true
      },
      {
        id       : 'title',
        dataIndex: "title",
        header   : "Title",
        sortable : true
      },
      {
        header   : "Published",
        dataIndex: "published",
        sortable : true
      },
      {
        header   : 'Created At',
        dataIndex: 'created_at',
        sortable : true
      }
    ];
  }
});

ExtMVC.registerView('posts', 'new', {
  xtype    : 'formwindow',
  title    : "New Post",
  height   : 450,
  width    : 700,
  border   : false,
  resizable: false,
  
  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      model: ExtMVC.getModel("Post")
    });
    
    ExtMVC.getView("extmvc", "formwindow").prototype.constructor.call(this, config);
  },
  
  initComponent: function() {
    ExtMVC.getView("extmvc", "formwindow").prototype.initComponent.apply(this, arguments);
    
    //closes this tab when creation was successful
    ExtMVC.getController('posts').on({
      scope : this,
      'create': function() {
        this.destroy();
      },
      'create-failed': function() {
        this.el.unmask();
      }
    });
  },
  
  /**
   * Creates and returns a FormPanel instance to go inside the window. Override this yourself
   * @return {Ext.form.FormPanel} The form panel
   */
  buildForm: function() {
    return new Ext.form.FormPanel({
      items   : ExtMVC.getFields('posts'),
      bodyStyle: "padding:10px 5px 10px 10px",
      defaults: {
        xtype : 'textfield',
        anchor: "-5"
      }
    });
  }
});

ExtMVC.registerView('posts', 'edit', {
  xtype    : 'formwindow',
  title    : "Edit Post",
  height   : 450,
  width    : 700,
  border   : false,
  resizable: false,
  
  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      model: ExtMVC.getModel("Post")
    });
    
    ExtMVC.getView("extmvc", "formwindow").prototype.constructor.call(this, config);
  },
  
  initComponent: function() {
    ExtMVC.getView("extmvc", "formwindow").prototype.initComponent.apply(this, arguments);
    
    //closes this tab when creation was successful
    ExtMVC.getController('posts').on({
      scope : this,
      'update': function() {
        this.destroy();
      },
      'update-failed': function() {
        this.el.unmask();
      }
    });
  },
  
  /**
   * Creates and returns a FormPanel instance to go inside the window. Override this yourself
   * @return {Ext.form.FormPanel} The form panel
   */
  buildForm: function() {
    return new Ext.form.FormPanel({
      items   : ExtMVC.getFields('posts'),
      bodyStyle: "padding:10px 5px 10px 10px",
      defaults: {
        xtype : 'textfield',
        anchor: "-5"
      }
    });
  }
});

/**
 * Form fields used in both New and Edit forms.  These are automatically loaded into the
 * scaffold views if defined.  To fall back to the scaffolds, comment out or delete this file
 */
ExtMVC.registerFields('posts', [
  {
    xtype     : 'textfield',
    fieldLabel: 'Title',
    name      : 'title'
  },
  {
    xtype         : "combo",
    forceSelection: true,
    editable      : false,
    mode          : 'local',
    triggerAction : 'all',
    fieldLabel    : "Published",
    name          : 'published',
    displayField  : 'value',
    store         : new Ext.data.SimpleStore({
      fields: ['value'],
      data  : [[true], [false]]
    })
  },
  {
    xtype     : 'textarea',
    fieldLabel: 'Body',
    height    : 310,
    name      : 'body'
  }
]);

ExtMVC.registerView('messages', 'index', {
  xtype: 'scaffold_grid',
  
  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      store: ExtMVC.getModel("Message").find({}, {autoLoad: false}),
      model: ExtMVC.getModel("Message"),
      controllerListeners: {
        'messages': {
          'create' : this.refresh,
          'update' : this.refresh,
          'destroy': this.refresh
        }
      }
    });
    
    ExtMVC.getView("scaffold", "index").prototype.constructor.call(this, config);
    
    this.on('activate', this.refresh, this);
  },
  
  refresh: function() {
    this.store.reload();
  },
  
  buildColumns: function() {
    return [
      {
        dataIndex: "id",
        header   : "#",
        sortable : true
      },
      {
        dataIndex: "name",
        header   : "Name",
        sortable : true
      },
      {
        header   : "Email",
        dataIndex: "email",
        sortable : true
      },
      {
        header   : 'Created At',
        dataIndex: 'created_at',
        sortable : true,
        renderer : Ext.util.Format.dateRenderer('m/d/Y H:s')
      }
    ];
  }
});

ExtMVC.registerView('layout', 'menu', {
  xtype      : 'treepanel',
  title      : 'Menu',
  collapsible: true,
  
  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      root: {
        text    : 'Menu',
        id      : 'menu',
        nodeType: 'async',
        expanded: true,
        children: [
          {
            text       : 'Posts',
            expanded   : true,
            controller : 'posts',
            action     : 'index',
            children   : []
          },
          {
            text       : 'Messages',
            expanded   : true,
            controller : 'messages',
            action     : 'index',
            children   : []
          }
        ]
      }
    });
    
    Ext.tree.TreePanel.prototype.constructor.call(this, config);
  }
});

/**
 * @class RWD.views.index.Index
 * @extends Ext.Panel
 * Default Welcome to Ext MVC Panel - replace this with your own thing
 */
ExtMVC.registerView('index', 'index', {
  xtype: 'panel',
  
  initComponent: function() {
    Ext.applyIf(this, {
      title: "Welcome to Ext MVC",
      html:  "This is the default template, which is found in app/views/index/Index.js.  This is being displayed because your config/routes.js file has a map.root setting telling it to use the Index view of the IndexController"
    });
    
    Ext.Panel.prototype.initComponent.apply(this, arguments);
  }
});

