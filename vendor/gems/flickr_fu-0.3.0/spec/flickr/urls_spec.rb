require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr::Urls do
  before :all do
    @flickr = SpecHelper.flickr
  end

  
  describe ".get_group" do
    it "should return the url to a group's page if the group_id is valid" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_group-0.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      @flickr.urls.get_group("34427469792@N01").should == "http://www.flickr.com/groups/central/"
    end

    it "should raise an error if the group_id is not valid (Group not found error raised)" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_group-fail-1.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      lambda { @flickr.urls.get_group("foo") }.should raise_error(Flickr::Error, /^1:/)
    end
  end

  describe ".get_user_photos" do
    it "should return the url to a user's photos if the user_id is valid" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_user_photos-0.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      @flickr.urls.get_user_photos("80755658@N00").should == "http://www.flickr.com/photos/lvizard/"
    end

    it "should raise an error if the user_id is not valid (User not found error raised)" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_user_photos-fail-1.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      lambda { @flickr.urls.get_user_photos("foo") }.should raise_error(Flickr::Error, /^1:/)
    end

    it "should raise an error if the user_id is not specified (No user specified error raised)" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_user_photos-fail-2.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      lambda { @flickr.urls.get_user_photos(nil) }.should raise_error(Flickr::Error, /^2:/)
    end
  end

  describe ".get_user_profile" do
    it "should return the url to a user's profile if the user_id is valid" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_user_profile-0.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      @flickr.urls.get_user_profile("80755658@N00").should == "http://www.flickr.com/people/lvizard/"
    end

    it "should raise an error if the user_id is not valid (User not found error raised)" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_user_profile-fail-1.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      lambda { @flickr.urls.get_user_profile("foo") }.should raise_error(Flickr::Error, /^1:/)
    end

    it "should raise an error if the user_id is not specified (No user specified error raised)" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/get_user_profile-fail-2.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      lambda { @flickr.urls.get_user_profile(nil) }.should raise_error(Flickr::Error, /^2:/)
    end
  end

  describe ".lookup_group" do
    it "should return a group NSID, given the url to a group's page"

    it "should return a group NSID, given the url to a group's photo pool"

    it "should raise an error if the group_id is not valid (Group not found error raised)"
  end

  describe ".lookup_user" do
    it "should return a user NSID, given the url to a user's photos"

    it "should return a user NSID, given the url to a user's profile"

    it "should raise an error if the user_id is not valid (User not found error raised)"

    it "should raise an error if the user_id is not specified (No user specified error raised)"

    describe "valid return value" do
      before :all do
        @valid_lookup_user_xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/lookup_user-0.xml")
      end


      it "should be kind of a String" do
        @flickr.should_receive(:request_over_http).and_return(@valid_lookup_user_xml)
        @flickr.urls.lookup_user("htp://www.flickr.com/photos/lvizard").should be_kind_of String
      end

      it "should have a username attribute containing the user's name" do
        xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/urls/lookup_user-0.xml")
        @flickr.should_receive(:request_over_http).and_return(@valid_lookup_user_xml)
        @flickr.urls.lookup_user("htp://www.flickr.com/photos/lvizard").username.should == "Maciej Biłas"
      end
    end
  end

end