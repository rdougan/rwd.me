/**
 * @class RWD.controllers.PostsController
 * @extends RWD.controllers.ApplicationController
 * CRUD controller for Addresses
 */
ExtMVC.registerController("posts", {
  extend: 'crud',
  model : ExtMVC.getModel("Post")
});
