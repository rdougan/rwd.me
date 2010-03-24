class AddFieldsToPost < ActiveRecord::Migration
  def self.up
    add_column :posts, :title, :text
    add_column :posts, :body, :text
  end

  def self.down
    remove_column :posts, :title
    remove_column :posts, :body
  end
end
