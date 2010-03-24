/**
 * @class Message
 * @extends ExtMVC.model.Base
 */
ExtMVC.registerModel("Message", {
  fields:    [
    {name: 'id',        type: 'float', virtual: true},
    {name: 'name',      type: 'string'},
    {name: 'email',     type: 'string'},
    {name: 'body',      type: 'string'},
    
    {name: 'created_at', type: 'date', virtual: true},
    {name: 'updated_at', type: 'date', virtual: true}
  ]
});
