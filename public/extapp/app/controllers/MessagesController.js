/**
 * @class RWD.controllers.MessagesController
 * @extends RWD.controllers.ApplicationController
 * 
 */
ExtMVC.registerController("messages", {
  extend: 'crud',
  model : ExtMVC.getModel("Message")
});
