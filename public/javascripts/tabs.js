/**
 * 
 */
RWD.ux.TabManager = function() {
  RWD.ux.TabManager.superclass.constructor.call(this);
  
  this.initEvents();
  this.initTabs();
  this.activateTab();
};
Ext.extend(RWD.ux.TabManager, Ext.util.Observable, {
  /**
   * 
   */
  tabs: null,
  
  /**
   * 
   */
  activeCls: 'active',
  
  /**
   * 
   */
  initEvents: function() {
    this.addEvents(
      'before-init',
      'init',
      'found-tab',
      'tab-click'
    );
  },
  
  /**
   * 
   */
  initTabs: function() {
    this.fireEvent('before-init', this);
    
    //find all the tabs for the tab manager
    this.findTabs();
    
    //setup tab listeners
    this.initTabListeners();
    
    this.fireEvent('init', this);
  },
  
  /**
   * 
   */
  findTabs: function() {
    //tabs container
    var ct = Ext.getBody().child('#menu');
    if (!ct) return;
    
    //get the tabs
    this.tabs = ct.select('span');

    //loop through them all and fire an event
    this.tabs.each(function(tab) {
     //get the name
     var name = this.getName(tab);
     
     //fire off the event
     this.fireEvent('found-tab', tab, name);
    }, this);
  },
   
  /**
   * 
   */
  initTabListeners: function() {
    this.tabs.each(function(tab) {
      var tab = Ext.get(tab.dom);
      
      //get the name
      var name = this.getName(tab);
      
      tab.on('click', function() {
        this.onClick(tab, name);
      }, this);
    }, this);
  },
  
  /**
   * Find and returns a tab depending on its name
   */
  findTabByName: function(str) {
    if (!this.tabs) return;
    
    var r   = null,
        str = str.replace(' ', '');
    
    //loop through them all and hide them
    this.tabs.each(function(tab) {
      var name = this.getName(tab);
      if (name == str) r = tab.dom;
    }, this);
    
    return Ext.get(r);
  },
  
  /**
   * 
   */
  activateTab: function() {
    //hash
    var hash = RWD.historyManager.get();
    if (!hash) return;
    
    var tab = this.findTabByName(hash);
    if (tab) this.setActiveFromName(tab);
  },
  
  /**
   * Returns the name of the tab
   */
  getName: function(tab) {
    if (!tab) return;
    
    return tab.getAttribute('ref');
  },
  
  /**
   * 
   */
  onClick: function(tab, name) {
    this.fireEvent('tab-click', tab, name);
    
    if (name == "blog") {
      RWD.historyManager.set(RWD.entryManager.currentHash || "blog");
    } else {
      RWD.historyManager.set(name);
    };
    
    //set the active tab
    this.setActive(tab);
  },
  
  /**
   * Removes the active state from all tabs
   */
  clearActive: function() {
    this.tabs.each(function(tab) {
      tab.removeClass(this.activeCls);
    }, this);
  },
  
  /**
   * Adds the active class to the specifed tab
   */
  setActive: function(tab) {
    if (!tab) return;
    
    this.clearActive();
    tab.addClass(this.activeCls);
  },
  
  /**
   * Adds the active class to the specifed tab with a name
   */
  setActiveFromName: function(tab) {
    if (!tab) return;
    
    this.clearActive();
    tab.addClass(this.activeCls);
  }
});