class Post < ActiveRecord::Base
  acts_as_taggable
  
  validates_presence_of :title, :body
  
  # def to_json(args = {})
  #   super({:include => {:tags => {}}}.merge(args))
  # end
end
