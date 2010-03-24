/**
 * @class RWD.controllers.IndexController
 * @extends RWD.controllers.ApplicationController
 * Default root controller
 */
ExtMVC.registerController("index", {
  index: function() {
    this.render('index');
  }
});