/**
 * 
 */
RWD.ux.SliceManager = function() {
  RWD.ux.SliceManager.superclass.constructor.call(this);
  
  this.initEvents();
  this.initListeners();
  this.initSlices();
};
Ext.extend(RWD.ux.SliceManager, Ext.util.Observable, {
  /**
   * 
   */
  slices: null,
  
  /**
   * 
   */
  activeSlice: null,
  
  /**
   * 
   */
  defaultAnimationDuration: 0.2,
  
  /**
   * 
   */
  first: true,
  
  /**
   * 
   */
  initEvents: function() {
    this.addEvents(
      'before-init',
      'init',
      'found-slice',
      'before-slice-activated',
      'slice-activated'
    );
  },
  
  /**
   * 
   */
  initListeners: function() {
    this.on('before-slice-activated', this.hideSlices, this);
    RWD.tabManager.on('tab-click', this.onTabClick, this);
  },
  
  /**
   * 
   */
  initSlices: function() {
    this.fireEvent('before-init', this);
    
    //find all the slices for the slice manager
    this.findSlices();
    
    //active the default slice
    this.activateDefaultSlice();
    
    this.fireEvent('init', this);
  },
  
  /**
   * 
   */
  findSlices: function() {
    //slices
    this.slices = Ext.getBody().select('#content > div');

    //loop through them all and fire an event
    this.slices.each(function(slice) {
      //get the name
      var name = this.getName(slice);
      
      //fire off the event
      this.fireEvent('found-slice', slice, name);
    }, this);
  },
  
  /**
   * Find and returns a slice depending on its name
   */
  findSliceByName: function(str) {
    if (!this.slices) return;
    
    var r   = null,
        str = str.replace(' ', '');
    
    //loop through them all and hide them
    this.slices.each(function(slice) {
      var name = this.getName(slice);
      if (name == str) r = slice.dom;
    }, this);
    
    return Ext.get(r);
  },
  
  /**
   * Returns the name of the slice
   */
  getName: function(slice) {
    if (!slice) return;
    
    var cls = slice.dom.className;
    if (!cls) return;
    
    cls = cls.replace(' ', '');
    
    return cls;
    // return slice.dom.className.replace('slice', '').replace('hidden', '').trim();
  },
  
  /**
   * 
   */
  hideSlices: function(slice, animate) {
    if (!this.slices) return;
    
    var animate = true;
    
    //loop through them all and hide them
    this.slices.each(function(slice) {
      slice.setVisibilityMode(Ext.Element.DISPLAY);
      if (animate === true) slice.fadeOut({duration:this.defaultAnimationDuration,scope:this});
      else slice.hide();
    }, this);
  },
  
  /**
   * 
   */
  activateDefaultSlice: function() {
    var slice = null,
        basic = RWD.historyManager.get().split('/')[0],
        id    = RWD.historyManager.get().split('/')[1],
        gogo  = false;
    
    //check for entries
    if (basic == "blog" && id) {
      var els = Ext.getBody().select('.entry.blog');
      els.each(function(e) {
        var el = Ext.get(e.dom),
            i  = el.getAttribute('ref').split('/')[0];
        
        if (id == i) {
          gogo = el;
          return false;
        };
      }, this);
    };
    
    //check what the default slice is
    if (gogo) slice = this.findSliceByName('blog');
    else if (!RWD.historyManager.get()) slice = this.findSliceByName('blog');
    else slice = this.findSliceByName(RWD.historyManager.get());
    
    //active the slice
    if (!slice) return;
    this.activateSlice(slice, null, id);
  },
  
  /**
   * 
   */
  activateSlice: function(slice, animate, gogo) {
    var animate = true;
    
    if (!slice) return;
    if (this.getName(slice) == this.activeSlice) return;
    
    this.fireEvent('before-slice-activated', slice, animate);
    
    //show the slice
    if (animate === true) {
      if (this.first) slice.slideIn('t', {duration:this.defaultAnimationDuration, scope:this});
      else slice.fadeIn({duration:this.defaultAnimationDuration, scope:this});
      
      this.first = false;
    } else {
      slice.show();
    };
    
    this.activeSlice = this.getName(slice);
    
    //update the history
    // RWD.historyManager.set(this.activeSlice);
    
    //scroll to top
    // window.scroll('t', 0);
    
    // var top = document.body.scrollTop;
    // if (top == 0 && window.scrollY != 0) top = window.scrollY;
    // 
    // this.msgs    = Ext.get('msgs');
    // this.black   = Ext.get('highlight');
    // this.content = Ext.get('content');
    // this.menu    = Ext.get('contentNav');
    // 
    // //get the total height of the elements
    // var height = this.msgs.getHeight() + this.black.getHeight();
    // 
    // if (top < height && window.document.height - window.innerHeight == top) {
    //   this.msgs.hide();
    //   this.black.hide();
    // };
    
    RWD.entryManager.activateFirst(this.activeSlice, gogo);
    
    this.fireEvent('activated', slice, this.activeSlice);
  },
  
  /**
   * 
   */
  onTabClick: function(el, name) {
    var slice = this.findSliceByName(name);
    if (!slice) return;
    
    this.activateSlice(slice, true);
  }
});
