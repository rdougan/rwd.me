require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr::Contacts do
  
  before :each do
    @flickr = SpecHelper.flickr
  end
  
  describe ".get_public_list" do
    before :all do
      @public_list_xml = File.read(File.dirname(__FILE__) +
          "/../fixtures/flickr/contacts/get_public_list-0.xml")
    end
    
    it "should call flickr.contacts.getPublicList" do
      bogus_user_id = "12334@N00"
      @flickr.should_receive(:send_request).with("flickr.contacts.getPublicList",
                                                 {:user_id=>bogus_user_id})
      @flickr.contacts.get_public_list(bogus_user_id)
    end    
    
    it "should return public contacts for the given user" do
      bogus_user_id = "12334@N00"
      @flickr.stub!(:request_over_http).and_return(@public_list_xml)      
      contacts = @flickr.contacts.get_public_list(bogus_user_id)
      contacts.size.should == 2
      contacts.first.username.should == "kooop"
      contacts.first.nsid.should == "40718771@N00"
      contacts.first.iconserver.should == "2"
      contacts.first.iconfarm.should == "1"
    end    
  end
    
  describe ".get_list" do
    it "should call flickr.contacts.getList" do
      @flickr.should_receive(:send_request).with("flickr.contacts.getList", {})       
      @flickr.contacts.get_list
    end
    
    it "should raise flickr error 99: Insufficient permissions" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/contacts/get_list-fail-99.xml")
      @flickr.stub!(:request_over_http).and_return(xml)
      lambda { @flickr.contacts.get_list }.should raise_error(Flickr::Error, /^99:/)
    end
  end
  
end
