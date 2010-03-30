require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr::Errors, ".error_for" do
  it "should raise a RuntimeError with an \"Internal message\" message if either code or message is blank" do
    lambda { Flickr::Errors.error_for(nil, nil) }.should raise_error(RuntimeError, /^Internal error/)
    lambda { Flickr::Errors.error_for(20, nil) }.should raise_error(RuntimeError, /^Internal error/)
    lambda { Flickr::Errors.error_for(nil, "foo") }.should raise_error(RuntimeError, /^Internal error/)
  end
  
  it "should raise a RuntimeError with an \"Internal error\" message if code is not an integer" do
    lambda { Flickr::Errors.error_for("a", "foo")}.should raise_error(RuntimeError, /^Internal error/)
  end
  
  it "should raise a valid error if parameters are valid" do
    lambda { Flickr::Errors.error_for(96, "Invalid signature")}.should raise_error(Flickr::Error)
  end
  
  it "should return an error with a message starting with the error code" do
    lambda { Flickr::Errors.error_for(97, "Missing signature")}.should raise_error(Flickr::Error, /^97/)
  end
end