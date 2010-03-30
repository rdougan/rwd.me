require File.dirname(__FILE__) + '/../spec_helper'

module PhotoSpecHelper
  def valid_photo_attributes
    {
      :id => 2984637736,
      :owner => "80755658@N00",
      :secret => "9e5762e027",
      :server => 3180,
      :farm => 4,
      :title => "Demolition of Hotel Rzeszów",
      :is_public => 1,
      :is_friend => 0,
      :is_family => 0
    }
  end
end

describe Flickr::Photos::Photo do
  
  include PhotoSpecHelper
  
  before :all do
    @info_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/photos/get_info-0.xml")
    @sizes_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/photos/get_sizes-0.xml")
  end
  
  before :each do
    @flickr = SpecHelper.flickr
    #@flickr.stub!(:request_over_http).and_return(info_xml)
    @photo = Flickr::Photos::Photo.new(@flickr, valid_photo_attributes)
  end
  
  describe ".description" do
    it "should return the description" do
      @flickr.should_receive(:request_over_http).and_return(@info_xml)
      @photo.description.should == 
        "The last picture from a quite old event. The demolition of the best known hotel in Rzeszów called Hotel Rzeszów."
    end
  end

  describe ".photo_size" do
    it "should return the appropriate Flickr::Photos::Size instance when requested by symbol" do
	  @photo.photo_size(:square).class.should == Flickr::Photos::Size
	  @photo.photo_size(:square).label.should == "Square"
    end

    it "should return the appropriate Flickr::Photos::Size instance when requested by string" do
	  @photo.photo_size('square').class.should == Flickr::Photos::Size
	  @photo.photo_size('square').label.should == "Square"
    end

    it "should return the :medium Flickr::Photos::Size instance invalidly requested" do
	  @photo.photo_size(:doubleplusbig).class.should == Flickr::Photos::Size
	  @photo.photo_size(:doubleplusbig).label.should == "Medium"
    end
  end

  describe ".image_url" do
    it "should return all standard sizes (thumbnail, square, small, medium and large) when requested" do
	  @photo.image_url(:square).should == "http://farm4.static.flickr.com/3180/2984637736_9e5762e027_s.jpg"
      @photo.image_url(:thumbnail).should == "http://farm4.static.flickr.com/3180/2984637736_9e5762e027_t.jpg"
      @photo.image_url(:small).should == "http://farm4.static.flickr.com/3180/2984637736_9e5762e027_m.jpg"
	  @photo.image_url(:medium).should == "http://farm4.static.flickr.com/3180/2984637736_9e5762e027.jpg"
	  @photo.image_url(:large).should == "http://farm4.static.flickr.com/3180/2984637736_9e5762e027_b.jpg"
    end

	it "should return the same image even if you pass a string as an argument" do
	  @photo.image_url("square").should == @photo.image_url(:square)
	  @photo.image_url("large").should == @photo.image_url(:large)
	end

	it "should not call getSizes if not requested the url of the original image" do
	  @flickr.should_not_receive(:request_over_http)
	  @photo.image_url :square
	  @photo.image_url :thumbnail
	  @photo.image_url :small
	  @photo.image_url :medium
	  @photo.image_url :large
	end

	it "should call getSizes if requested the url of the original image" do
	  @flickr.should_receive(:request_over_http).and_return(@sizes_xml)
	  @photo.image_url :original
	end

	it "should return nil if original image url not available" do
	  @flickr.should_receive(:request_over_http).and_return(@sizes_xml)
	  @photo.image_url(:original).should == nil
	end
  end

  describe ".video_url" do
    it "should return nil, since it's not a video" do
      @flickr.should_receive(:request_over_http).and_return(@sizes_xml)
      @photo.video_url.should == nil
    end
  end

  describe ".location" do
    it "should return the picture location as specified in flickr.photos.geo.getLocation" do
      location_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/photos/geo/get_location-0.xml")
      @flickr.should_receive(:request_over_http).twice.and_return(location_xml)
      expected_loc = @flickr.photos.geo.get_location(@photo.id)
      acctual_loc = @photo.location
      # Checking by latitude and longitude is enough for us
      acctual_loc.latitude.should == expected_loc.latitude
      acctual_loc.longitude.should == expected_loc.longitude
    end

    it "should return nil if picture is not geo-tagged" do
      no_location_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/photos/geo/get_location-fail-2.xml")
      @flickr.should_receive(:request_over_http).and_return(no_location_xml)
      @photo.location.should be_nil
    end
  end

  describe Flickr::Photos::Photo, "but it's really a video" do

    include PhotoSpecHelper
  
    before :all do
      @info_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/videos/get_info-0.xml")
      @sizes_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/videos/get_sizes-0.xml")
    end
  
    before :each do
      @flickr = SpecHelper.flickr
      #@flickr.stub!(:request_over_http).and_return(info_xml)
      @photo = Flickr::Photos::Photo.new(@flickr, valid_photo_attributes)
    end

    describe ".video_url" do
      it "should return something sane" do
        @flickr.should_receive(:request_over_http).and_return(@sizes_xml)
        @photo.video_url.should == "http://www.flickr.com/apps/video/stewart.swf?v=63881&photo_id=2729556270&photo_secret=eee23fb14a"
      end
    end
  end
end
