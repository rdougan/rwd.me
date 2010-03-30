# require 'flickr'

class IndexController < ApplicationController
  # render index.rhtml
  def index
    @posts = Post.all(:conditions => ['published = ?', true], :order => ["created_at DESC"])
    
    # flickr = Flickr.new(File.join(RAILS_ROOT, 'config', 'flickr.yml'))
    # @photos = flickr.photos.search(:user_id => '27969974@N08', 'per_page' => 25)
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
