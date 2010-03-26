/**
 * @class Post
 * @extends ExtMVC.model.Base
 */
ExtMVC.registerModel("Post", {
  fields:    [
    {name: 'id',        type: 'float', virtual: true},
    {name: 'title',     type: 'string'},
    {name: 'body',      type: 'string'},
    {name: 'published', type: 'boolean'},
    // {name: 'tags',     virtual: true},
    
    // {
    //   name   : 'tag_list',
    //   convert: function(v, r) {
    //     r.tags.join(', ');
    //   }
    // },
    
    {name: 'created_at', type: 'string', virtual: true},
    {name: 'updated_at', type: 'string', virtual: true}
  ]
});
