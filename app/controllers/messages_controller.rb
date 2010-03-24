class MessagesController < ApplicationController
  before_filter :find_message, :only => [:show, :update, :destroy]
  before_filter :ensure_logged_in, :only => [:index, :show, :find_message, :update, :destroy]
  
  def index
    @messages = Message.all
    
    respond_to do |format|
      format.json { render :json => {"messages" => @messages} }
    end
  rescue
    failure_response
  end
  
  def show
    @message = Message.find(params[:id])
    success_response @message
  end
  
  def create
    @message = Message.new(params[:message])
    
    if @message.save
      success_response
    else
      failure_response @message.errors
    end
  rescue ActiveRecord::RecordInvalid => e
    failure_response @message.errors
  end
  
  def update
    if @message.update_attributes(params[:message])
      success_response
    else
      failure_response @message.errors
    end
  rescue ActiveRecord::RecordInvalid => e
    failure_response @message.errors 
  end
  
  def destroy
    @message.destroy
    
    success_response
  end
  
  def find_message
    @message = Message.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    failure_response ['The message could not be found'], 404
  end
end
