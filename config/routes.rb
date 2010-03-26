ActionController::Routing::Routes.draw do |map|
  map.logout '/logout', :controller => 'sessions', :action => 'destroy'
  map.login '/login', :controller => 'sessions', :action => 'new'
  # map.register '/register', :controller => 'users', :action => 'create'
  # map.signup '/signup', :controller => 'users', :action => 'new'
  # map.resources :users

  map.resource :session

  map.resources :posts, :collection => {:rss => :get}
  map.resources :messages
  
  map.admin '/extapp/public/admin', :controller => 'index', :action => 'admin'
  
  map.root :controller => 'index', :action => 'index'
  
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
end
