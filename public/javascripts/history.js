Ext.ns('Ext.ux');

/**
 * 
 */
Ext.ux.History = function() {
  Ext.ux.History.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.History, Ext.util.Observable, {
  set: function(url) {
    window.location.hash = url;
  },
  
  get: function() {
    return window.location.hash.split('#')[1];
  }
});
