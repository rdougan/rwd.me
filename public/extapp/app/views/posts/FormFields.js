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