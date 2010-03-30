require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr::Photosets do
  before :all do
    @get_list_xml = File.read(File.dirname(__FILE__) +
        "/../fixtures/flickr/photosets/get_list-0.xml")
    @get_photos_xml = File.read(File.dirname(__FILE__) +
        "/../fixtures/flickr/photosets/get_photos-0.xml")
  end
    
  before :each do
    @flickr = SpecHelper.flickr
  end

  
  describe ".get_list" do
    it "should call flickr.photosets.getList" do
      @flickr.should_receive(:send_request).with("flickr.photosets.getList", {})       
      @flickr.photosets.get_list
    end
    
    it "should return an array of photoset objects" do
      @flickr.stub!(:request_over_http).and_return(@get_list_xml)  
      photosets = @flickr.photosets.get_list
      
      photosets[0].should be_an_instance_of(Flickr::Photosets::Photoset)      
      photosets[0].title.should == 'Test'
    end
  end
  
  describe ".get_photos" do
    before :each do
      @photoset = Flickr::Photosets::Photoset.new(@flickr,{:id=>4})
    end
    
    it "should call flickr.photosets.getPhotos" do
      @flickr.should_receive(:send_request).with("flickr.photosets.getPhotos",{:photoset_id=>4})       
      @photoset.get_photos
    end
    
    it "should return an array of photo objects" do
      @flickr.stub!(:request_over_http).and_return(@get_photos_xml)  
      photos = @photoset.get_photos
      
      photos.should_not be_nil
      photos[0].should be_an_instance_of(Flickr::Photos::Photo)    
    end
  end
end