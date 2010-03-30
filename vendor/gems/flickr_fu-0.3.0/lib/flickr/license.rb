class Flickr::Photos::License
  attr_accessor :id, :name, :url

  # create a new instance of a flickr photo license.
  # 
  # Params
  # * attributes (Required)
  #     a hash of attributes used to set the initial values of the license object
  def initialize(attributes)
    attributes.each do |k,v|
      send("#{k}=", v)
    end
  end
  
  def == o
    return false unless o.respond_to?(:id) && o.respond_to?(:name) && o.respond_to?(:url)
    return true if id == o.id && name == o.name && url == o.url
    false
  end
  
  def eql? o
    return self == o
  end
end