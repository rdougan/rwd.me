Ext.ns('RWD', 'RWD.ux');

RWD.onLaunch = function() {
  RWD.historyManager = new Ext.ux.History();
  
  RWD.tabManager   = new RWD.ux.TabManager();
  RWD.entryManager = new RWD.ux.EntryManager();
  RWD.sliceManager = new RWD.ux.SliceManager();
};
Ext.extend(RWD, Ext.util.Observable);