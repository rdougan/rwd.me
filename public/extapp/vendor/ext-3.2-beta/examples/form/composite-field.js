/*!
 * Ext JS Library 3.2.0
 * Copyright(c) 2006-2010 Ext JS, LLC
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.onReady(function() {
    Ext.QuickTips.init();
    
    var form = new Ext.form.FormPanel({
        renderTo: 'docbody',
        title   : 'Composite Fields',
        height  : 150,
        width   : 600,
        
        bodyStyle: 'padding: 5px',
        defaults: {
            anchor: '0'
        },
        items   : [
            {
                xtype     : 'textfield',
                name      : 'email',
                fieldLabel: 'Email Address'
            },
            {
                xtype: 'compositefield',
                items: [
                    {
                        //the width of this field in the HBox layout is set directly
                        //the other 2 items are given flex: 1, so will share the rest of the space
                        width:          50,
                        
                        
                        xtype:          'combo',
                        mode:           'local',
                        value:          'mrs',
                        triggerAction:  'all',
                        forceSelection: true,
                        editable:       false,
                        fieldLabel:     'Title',
                        name:           'title',
                        hiddenName:     'title',
                        displayField:   'name',
                        valueField:     'value',
                        store:          new Ext.data.JsonStore({
                            fields : ['name', 'value'],
                            data   : [
                                {name : 'Mr',   value: 'mr'},
                                {name : 'Mrs',  value: 'mrs'},
                                {name : 'Miss', value: 'miss'}
                            ]
                        })
                    },
                    {
                        xtype: 'textfield',
                        flex : 1,
                        name : 'firstName',
                        fieldLabel: 'First',
                        allowBlank: false
                        
                    },
                    {
                        xtype: 'textfield',
                        flex : 1,
                        name : 'lastName',
                        fieldLabel: 'Last',
                        allowBlank: false
                        
                    }
                ]
            },
            {
                xtype: 'compositefield',
                fieldLabel: 'Date Range',
                msgTarget: 'side',
                defaults: {
                    flex: 1
                },
                items: [
                    {
                        xtype     : 'datefield',
                        name      : 'startDate',
                        fieldLabel: 'Start'
                    },
                    {
                        xtype     : 'datefield',
                        name      : 'endDate',
                        fieldLabel: 'End'
                    }
                ]
            }
        ],
        buttons: [
            {
                text   : 'Load test data',
                handler: function() {
                    var Record = Ext.data.Record.create([
                       {name: 'email',     type: 'string'},
                       {name: 'title',     type: 'string'},
                       {name: 'firstName', type: 'string'},
                       {name: 'lastName',  type: 'string'},
                       {name: 'startDate', type: 'date'},
                       {name: 'endDate',   type: 'date'}
                    ]);
                    
                    form.form.loadRecord(new Record({
                        email    : 'ed@extjs.com',
                        title    : 'mr',
                        firstName: 'Abraham',
                        lastName : 'Elias',
                        startDate: '01/10/2003',
                        endDate  : '12/11/2009'
                    }));
                }
            },
            {
                text   : 'Save',
                handler: function() {
                    if (form.form.isValid()) {
                        var s = '';
                    
                        Ext.iterate(form.form.getValues(), function(key, value) {
                            s += String.format("{0} = {1}<br />", key, value);
                        }, this);
                    
                        Ext.example.msg('Form Values', s);                        
                    }
                }
            },
            
            {
                text   : 'Reset',
                handler: function() {
                    form.form.reset();
                }
            }
        ]
    });
});