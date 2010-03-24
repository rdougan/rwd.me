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