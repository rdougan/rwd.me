# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  helper :all # include all helpers, all the time
  protect_from_forgery # See ActionController::RequestForgeryProtection for details
  
  include AuthenticatedSystem
  
  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password
  
  # Reusable default success response for a json request
  def success_response args = {}
    respond_to do |format|
      format.json do
        render({:json => {:success => true}}.merge(args))
      end
    end
  end
  
  # Reusable error response for json.  Supply this with an optional array of error strings,
  # which can also be something like @bookmark.errors if a model was invalid
  def failure_response errors = [], status = 403, args = {}
    resp = errors.empty? ? {:success => false} : {:success => false, :errors => errors}
    respond_to do |format|
      format.json do
        render({:json => resp, :status => status}.merge(args))
      end
    end
  end
  
  def ensure_logged_in
    unless is_admin?
      redirect_to "/"
    end
  end
  
  def is_admin?
    logged_in? && current_user.login == "rdougan"
  end
end
