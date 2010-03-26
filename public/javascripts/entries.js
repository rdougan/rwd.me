/**
 * 
 */
RWD.ux.EntryManager = function() {
  RWD.ux.EntryManager.superclass.constructor.call(this);
  
  this.initEvents();
  this.initEntries();
};
Ext.extend(RWD.ux.EntryManager, Ext.util.Observable, {
  /**
   * 
   */
  entries: null,
  
  /**
   * 
   */
  activeCls: 'active',
  
  /**
   * 
   */
  defaultAnimationDuration: .3,
  
  /**
   * 
   */
  initEvents: function() {
    this.addEvents(
      'before-init',
      'init',
      'found-entry',
      'entry-click'
    );
  },
  
  /**
   * 
   */
  initEntries: function() {
    this.fireEvent('before-init', this);
    
    //find all the entries for the entry manager
    this.findEntries();
    
    //setup entry listeners
    this.initEntryListeners();
    
    this.fireEvent('init', this);
  },
  
  /**
   * 
   */
  findEntries: function() {
    //get the entries
    this.entries = Ext.getBody().select('div.entry');
  },
   
  /**
   * 
   */
  initEntryListeners: function() {
    this.entries.each(function(entry) {
      var entry = Ext.get(entry.dom);
      entry.setVisibilityMode(Ext.Element.DISPLAY);
      
      var content = entry.last();
      if (content) {
        content.setVisibilityMode(Ext.Element.DISPLAY);
        content.hide();
      }
      
      entry.on('click', function(e, dom) {
        var el = Ext.get(dom).parent('.entry');
        if (el) this.onClick(el);
      }, this);
    }, this);
  },
  
  /**
   * 
   */
  onClick: function(entry) {
    this.expandEntry(entry);
  },
  
  hideAll: function(name) {
    this.entries.each(function(e) {
      if (e.getAttribute("type..") == name) {
        e.removeClass('expanded');
        this.collapseEntry(e);
      };
    }, this);
  },
  
  /**
   * 
   */
  collapseEntry: function(entry) {
    var content = entry.last();
    if (!content) return;
    if (!content.isVisible()) return;
    
    // content.hide();
    content.slideOut('t', {duration:this.defaultAnimationDuration, scope:this});
  },
  
  /**
   * 
   */
  expandEntry: function(entry, lol) {
    var content = entry.last();
    if (!content || content.isVisible()) return;
    
    this.hideAll(entry.getAttribute("type"));
    
    if (lol) content.show();
    else content.slideIn('t', {duration:this.defaultAnimationDuration, scope:this});
    
    entry.addClass('expanded');
    
    if (entry.getAttribute("type") == 'blog') {
      var hash = "blog";
      RWD.historyManager.set(hash + "/" + entry.getAttribute('ref'));
    } else {
      RWD.historyManager.set("flickr");
    };
  },
  
  activateFirst: function(name, id) {
    if (!name) return;
    
    var selected = false;
    
    this.entries.each(function(e) {
      var e = Ext.get(e.dom),
          r = e.getAttribute('ref'),
          i = (r) ? r.split('/')[0] : null;
      
      if (id && id == i) {
        this.expandEntry(e, true);
        selected = true;
        return false;
      };
    }, this);
    
    if (!selected) {
      this.entries.each(function(e) {
        var e = Ext.get(e.dom);

        if (e.getAttribute('type') == name) {
          this.expandEntry(e, true);
          return false;
        };
      }, this);
    };
  }
});