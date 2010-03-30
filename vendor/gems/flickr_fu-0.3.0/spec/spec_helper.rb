require 'rubygems'
gem 'rspec'
require 'spec'
 
$:.unshift(File.dirname(__FILE__) + '/../lib')
require 'flickr_fu'

class SpecHelper
  def self.flickr
    Flickr.new(:key => "2f7bf3aceba0ca2f11f9ad46e7552459", :secret => "17b59864beb29370")
  end
end

class Hash
  def strip_api_params!
    delete :api_sig
    delete :api_key
    delete :api_token
  end
end