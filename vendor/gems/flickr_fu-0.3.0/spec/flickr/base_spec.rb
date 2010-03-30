require File.dirname(__FILE__) + '/../spec_helper'

describe Flickr do

  before :all do
    @token = Flickr::Auth::Token.new(:permissions => "write", :token => "foo", :user_id => "80755658@N00",
      :user_real_name => "Maciej Bilas", :username => "Maciej Bilas")
    @api_key = "foo"
    @api_secret = "bar"
    @yaml_hash = {"key" => @api_key, "secret" => @api_secret}
  end

  describe ".new" do

    describe "with no environment option specified" do
      it "should inititialize Flickr from a Hash" do
        # AFAIK there is no spec on how the key and secret look like
        # so we can test with simple values
        init_hash = {:key => @api_key, :secret => @api_secret}
        flickr = Flickr.new(init_hash)
        flickr.api_key.should == @api_key
        flickr.api_secret.should == @api_secret

        init_hash_with_token = init_hash.merge(:token => @token)
        flickr = Flickr.new(init_hash_with_token)
        flickr.token.should == @token
      end

      it "should initialize Flickr from a YAML file" do
        YAML.should_receive(:load_file).once.and_return(@yaml_hash)
        flickr = Flickr.new("flickr.yml")
        flickr.api_key.should == @api_key
        flickr.api_secret.should == @api_secret
      end

      it "should fail if API key or secret value is absent" do
        invalid_hash = {:key => @api_key}
        lambda { Flickr.new(invalid_hash) }.should raise_error
        invalid_hash = {:secret => @api_secret}
        lambda { Flickr.new(invalid_hash) }.should raise_error
      end

    end

    describe "with an environment option specified" do
      before :all do
        @environment_specified = "development"
      end

      it "should initialize Flickr from a YAML file" do
        yaml_hash = {@environment_specified => {"key" => @api_key, "secret" => @api_secret}}
        YAML.should_receive(:load_file).once.and_return(yaml_hash)
        flickr = Flickr.new("flickr.yml", :environment => @environment_specified)
        flickr.api_key.should == @api_key
        flickr.api_secret.should == @api_secret
      end
    end

    describe "when token_cache is passed (only with a YAML file)" do

      before :all do
        @expected_token_cache = "token_cache.yml"
      end

      # For backward compatibility
      it "should initialize Flickr with token_cache when passed as the second parameter" do
        YAML.should_receive(:load_file).once.and_return(@yaml_hash)
        flickr = Flickr.new("flickr.yml", @expected_token_cache)
        flickr.token_cache.should == @expected_token_cache
      end

      it "should initialize Flickr with token_cache when passed as an option" do
        YAML.should_receive(:load_file).once.and_return(@yaml_hash)
        flickr = Flickr.new("flickr.yml", :token_cache => @expected_token_cache)
        flickr.token_cache.should == @expected_token_cache
      end
    end

    describe "when token is passed as an options (only with a YAML file)" do

      it "should initialize Flickr with a token if passed" do
        YAML.should_receive(:load_file).once.and_return(@yaml_hash)
        flickr = Flickr.new("flickr.yml", :token => @token)
        flickr.token.should == @token
      end

    end

    describe "when both token and token_cache are passed" do
      it "should raise an error" do
        YAML.should_receive(:load_file).once.and_return(@yaml_hash)
        lambda { Flickr.new("flickr.yml", {:token => @token, :token_cache => "token_cache.yml"})}.should raise_error
      end
    end
    
  end
end