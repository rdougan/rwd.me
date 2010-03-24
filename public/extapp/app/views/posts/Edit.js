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