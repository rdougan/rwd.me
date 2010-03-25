class PostsController < ApplicationController
  before_filter :find_post, :only => [:show, :update, :destroy]
  before_filter :ensure_logged_in, :only => [:create, :update, :destroy]
  
  def index
    @posts = Post.all
    
    respond_to do |format|
      format.json { render :json => {"posts" => @posts} }
    end
  rescue
    failure_response
  end
  
  def show
    @post = Post.find(params[:id])
    success_response @post
  end
  
  def create
    @post = Post.new(params[:post])
    
    if @post.save
      success_response
    else
      failure_response @post.errors
    end
  rescue ActiveRecord::RecordInvalid => e
    failure_response @post.errors
  end
  
  def update
    if @post.update_attributes(params[:post])
      success_response
    else
      failure_response @post.errors
    end
  rescue ActiveRecord::RecordInvalid => e
    failure_response @post.errors 
  end
  
  def destroy
    @post.destroy
    
    success_response
  end
  
  def find_post
    @post = Post.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    failure_response ['The post could not be found'], 404
  end
end
