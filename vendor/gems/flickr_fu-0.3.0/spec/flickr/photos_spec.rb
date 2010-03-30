require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr::Photos do
  
  before :each do
    @flickr = SpecHelper.flickr
  end
  
  describe ".licenses" do
    before :all do
      @licenses_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/photos/licenses/get_info.xml")
      @valid_licenses = {
        0 => Flickr::Photos::License.new(:id => 0, :name => "All Rights Reserved", :url => ""),
        4 => Flickr::Photos::License.new(:id => 4, :name => "Attribution License", :url => "http://creativecommons.org/licenses/by/2.0/"),
        6 => Flickr::Photos::License.new(:id => 6, :name => "Attribution-NoDerivs License", :url => "http://creativecommons.org/licenses/by-nd/2.0/"),
        3 => Flickr::Photos::License.new(:id => 3, :name => "Attribution-NonCommercial-NoDerivs License", :url => "http://creativecommons.org/licenses/by-nc-nd/2.0/"),
        2 => Flickr::Photos::License.new(:id => 2, :name => "Attribution-NonCommercial License", :url => "http://creativecommons.org/licenses/by-nc/2.0/"),
        1 => Flickr::Photos::License.new(:id => 1, :name => "Attribution-NonCommercial-ShareAlike License", :url => "http://creativecommons.org/licenses/by-nc-sa/2.0/"),
        5 => Flickr::Photos::License.new(:id => 5, :name => "Attribution-ShareAlike License", :url => "http://creativecommons.org/licenses/by-sa/2.0/")
      }
    end
    
    it "should return all valid licenses" do
      @flickr.should_receive(:request_over_http).and_return(@licenses_xml)
      @flickr.photos.licenses.should == @valid_licenses
    end
    
    it "should not not call Flickr API more than once" do
      @flickr.should_receive(:request_over_http).once.and_return(@licenses_xml)
      @flickr.photos.licenses
      @flickr.photos.licenses
    end
  end
  
  describe ".find_by_id" do
    it "should return a photo when a valid id is given" do
      photo_id = 2984637736
      #photo_upload_date = 1225297614
      info_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/photos/get_info-0.xml")
      @flickr.should_receive(:request_over_http).and_return(info_xml)
      
      photo = @flickr.photos.find_by_id(photo_id)
      photo.id.should == photo_id
    end
    
    it "should raise an error when no id is given"
    
    it "should raise an error when the photo does not exist"
  end
end