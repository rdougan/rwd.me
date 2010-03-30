# wrapping class to hold a flickr contact
# 
class Flickr::Contacts::Contact
  attr_accessor :nsid, :friend, :family, :iconfarm, :iconserver, :location, :username, :ignored, :realname, :path_alias
  
  # create a new instance of a flickr note.
  # 
  # Params
  # * attributes (Required)
  #     a hash of attributes used to set the initial values of the contact object
  def initialize(attributes)
    attributes.each do |k,v|
      send("#{k}=", v)
    end
  end
end