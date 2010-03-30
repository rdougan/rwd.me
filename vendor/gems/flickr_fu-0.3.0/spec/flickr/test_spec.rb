require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr::Test do
  
  # Before all should be sufficient here. If not it should be safe to change it to
  # before :each
  before :all do
    @flickr = SpecHelper.flickr
  end
  
  describe ".echo" do
    it "should return all parameters back in the response" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/test/echo-0.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      actual = @flickr.test.echo("foo" => "bar")
      actual.strip_api_params!
      actual.should == {:method => "flickr.test.echo", "foo" => "bar"}
    end
  end
  
  # FIXME Hm... we should have a better way of testing if a user is authenticated or not after all
  describe ".null" do
    it "should fail if not authenticated with read permissions" do
      xml = File.read(File.dirname(__FILE__) + "/../fixtures/flickr/test/null-fail-99.xml")
      @flickr.should_receive(:request_over_http).and_return(xml)
      lambda { @flickr.test.null }.should raise_error(Flickr::Error, /^99:/)
    end
    
    it "should return true unless there is an error" do
      @flickr.should_receive(:request_over_http).and_return("")
      @flickr.test.null.should == true
    end
  end
end