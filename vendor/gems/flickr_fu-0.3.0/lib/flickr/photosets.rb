class Flickr::Photosets < Flickr::Base
  def initialize(flickr)
    @flickr = flickr
  end
  
  # Get the authorized user's contact list.
  # 
  def get_list(options={})
    rsp = @flickr.send_request('flickr.photosets.getList', options)
    collect_photosets(rsp)
  end
    
  protected  
    def collect_photosets(rsp)
      photosets = []
      return photosets unless rsp
      if rsp.photosets.photoset
        rsp.photosets.photoset.each do |photoset|
          attributes = create_attributes(photoset)
          photosets << Photoset.new(@flickr, attributes)
        end
      end
      return photosets
    end
  
    def create_attributes(photoset)
      # comment by : smeevil
      #
      # for some reason it was needed to call to_s on photoset.title and photoset.description
      # without this it will not set the value correctly
      {
        :id => photoset[:id], 
        :num_photos => photoset[:photos],
        :title => photoset.title.to_s,
        :description => photoset.description.to_s
       }
    end
  
end