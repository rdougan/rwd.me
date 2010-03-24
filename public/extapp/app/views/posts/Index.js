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
        sortable : true,
        renderer : Ext.util.Format.dateRenderer('m/d/Y H:s')
      }
    ];
  }
});