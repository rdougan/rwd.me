class Flickr::Photos::Geo < Flickr::Base

  def initialize(flickr)
    @flickr = flickr
  end

  # Get the geo data (latitude and longitude and the accuracy level) of a photo.
  #
  # Params
  # * photo_id (Required)
  #
  # Returns Flickr::Photos::Location object containing photo location
  # or nil if photo is not geotagged.
  def get_location(photo_id)
    # begin
    rsp = @flickr.send_request('flickr.photos.geo.getLocation', {:photo_id => photo_id})
    Flickr::Photos::Location.new(:latitude => rsp.photo.location[:latitude].to_f,
      :longitude => rsp.photo.location[:longitude].to_f, :accuracy => rsp.photo.location[:accuracy].to_i)
  end

  # Sets the geo data(latitude and longitude and the accuracy level) of a photo.
  #
  # Params
  # * photo_id (Required)
  # * latittude (Requried)
  # * longitude (Required)
  # * accuracy (Optional)
  #
  # Returns true if successful, raises an error otherwise.
  def set_location(photo_id, lat, lon, accuracy = nil)
    request_options = {:photo_id => photo_id, :lat => lat, :lon => lon}
    request_options[:accuracy] = accuracy if !accuracy.nil?
    @flickr.send_request('flickr.photos.geo.setLocation', request_options, :post)
    true
  end

  def remove_location(photo_id)
    request_options = {:photo_id => photo_id}
    @flickr.send_request('flickr.photos.geo.removeLocation', request_options, :post)
    true
  end
end