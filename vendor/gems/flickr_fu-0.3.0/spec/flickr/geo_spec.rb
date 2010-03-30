require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr::Photos::Geo do

  before :each do
    @flickr = SpecHelper.flickr
  end
  
  describe ".get_location" do
    it "should return the geo data (latitude and longitude and the accuracy level) for a photo" do
      location_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/photos/geo/get_location-0.xml")
      @flickr.should_receive(:request_over_http).and_return(location_xml)
      acctual_loc = @flickr.photos.geo.get_location(2984637736)
      acctual_loc.latitude.should == 50.041376
      acctual_loc.longitude.should == 21.999006
      acctual_loc.accuracy.should == 16
    end
  end
  
end