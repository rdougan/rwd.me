class Flickr::Contacts < Flickr::Base
  def initialize(flickr)
    @flickr = flickr
  end

  # Get a user's public contact list.
  # 
  # Params
  # * id (Required)
  #     the nsid of the user to get information for
  # 
  def get_public_list(id, options={})
    options.merge!({:user_id => id})
    rsp = @flickr.send_request('flickr.contacts.getPublicList', options)
    collect_contacts(rsp)
  end
    
  
  # Get the authorized user's contact list.
  # 
  def get_list(options={})
    rsp = @flickr.send_request('flickr.contacts.getList', options)
    collect_contacts(rsp)
  end
  
  
  protected
  def collect_contacts(rsp)
    contacts = []
    return contacts unless rsp
    if rsp.contacts.contact
      rsp.contacts.contact.each do |contact|
        attributes = create_attributes(contact)
        contacts << Contact.new(attributes)
      end
    end
    return contacts
  end
  
  def create_attributes(contact)
    {
      :nsid => contact[:nsid], 
      :path_alias => contact[:path_alias],
      :username => contact[:username],
      :iconfarm => contact[:iconfarm],
      :iconserver => contact[:iconserver],
      :ignored => contact[:ignored],
      :friend => contact[:friend],
      :family => contact[:family],
      :realname => contact[:realname],
      :location => contact[:location]
     }
  end
  
end
