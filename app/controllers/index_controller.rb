class IndexController < ApplicationController
  # render index.rhtml
  def index
    @posts = Post.all(:conditions => { :published => 1 })
  end
  
  def admin
    if !logged_in?
      redirect_to "/"
    else
      respond_to do |format|
        format.html
      end
    end
  end
end
