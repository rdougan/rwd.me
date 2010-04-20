class IndexController < ApplicationController
  # render index.rhtml
  def index
    @posts = Post.all(:conditions => ['published = ?', true], :order => ["created_at DESC"])
    # @tweet = Twitter::Search.new.from('rdougan').first.text
    # @tweet = @tweet.gsub(/(^|\s)@(\w+)/, '<span class="username">\0</span>')
    
    # flickr = Flickr.new(File.join(RAILS_ROOT, 'config', 'flickr.yml'))
    # @photos = flickr.photos.search(:user_id => '27969974@N08', 'per_page' => 25)
  rescue
    @posts = Post.all(:conditions => ['published = ?', true], :order => ["created_at DESC"])
  end
  
  def tweets
    @tweets = []
    
    Twitter::Search.new.from('rdougan').each do |t|
      t = t.text
      t = t.gsub(/(^|\s)@(\w+)/, '<span class="username">\0</span>')
      t = t.gsub(/(^|\s)#(\w+)/, '<span class="hash">\0</span>')
      @tweets << t
    end
    
    respond_to do |format|
      format.json { render :json => {"tweets" => @tweets, :success => true} }
    end
  rescue
    respond_to do |format|
      format.json { render :json => {:success => false} }
    end
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
