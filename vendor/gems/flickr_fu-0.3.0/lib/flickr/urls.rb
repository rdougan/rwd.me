# Wrapping class that holds methods in the flickr.urls namespace
class Flickr::Urls < Flickr::Base
  def initialize(flickr)
    @flickr = flickr
  end

  def get_group group_id
    rsp = @flickr.send_request('flickr.urls.getGroup', {:group_id => group_id})
    rsp.group[:url]
  end

  def get_user_photos user_id
    rsp = @flickr.send_request('flickr.urls.getUserPhotos', {:user_id => user_id})
    rsp.user[:url]
  end

  def get_user_profile user_id
    rsp = @flickr.send_request('flickr.urls.getUserProfile', {:user_id => user_id})
    rsp.user[:url]
  end

  def lookup_group url #, options = {}
    #options.symbolize_keys!
    #options.reverse_merge!({:include_groupname => false})
    rsp = @flickr.send_request('flickr.urls.lookupGroup', {:url => url})
    #if options[:include_groupname]
    #[rsp.group[:id], {:groupname => rsp.group.groupname}]
    #else
    rsp.group[:id]
    #end
  end

  def lookup_user url
    rsp = @flickr.send_request('flickr.urls.lookupUser', {:url => url})
    user_id = UserLookupResult.new(rsp.user[:id])
    user_id.username = rsp.user.username
    user_id
  end

  class UserLookupResult < String
    attr_accessor :username
  end
  
end