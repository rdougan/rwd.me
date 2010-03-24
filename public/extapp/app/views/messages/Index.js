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