# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = %q{flickr_fu}
  s.version = "0.3.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Ben Wyrosdick", "Maciej Bilas"]
  s.date = %q{2009-05-19}
  s.description = %q{Provides a ruby interface to flickr via the REST api}
  s.email = %q{ben@commonthread.com}
  s.extra_rdoc_files = [
    "README"
  ]
  s.files = [
    ".gitignore",
     "LICENSE",
     "README",
     "Rakefile",
     "VERSION.yml",
     "flickr_fu.gemspec",
     "lib/flickr/auth.rb",
     "lib/flickr/base.rb",
     "lib/flickr/comment.rb",
     "lib/flickr/contact.rb",
     "lib/flickr/contacts.rb",
     "lib/flickr/errors.rb",
     "lib/flickr/geo.rb",
     "lib/flickr/license.rb",
     "lib/flickr/location.rb",
     "lib/flickr/note.rb",
     "lib/flickr/people.rb",
     "lib/flickr/person.rb",
     "lib/flickr/photo.rb",
     "lib/flickr/photo_response.rb",
     "lib/flickr/photos.rb",
     "lib/flickr/photoset.rb",
     "lib/flickr/photosets.rb",
     "lib/flickr/size.rb",
     "lib/flickr/status.rb",
     "lib/flickr/test.rb",
     "lib/flickr/token.rb",
     "lib/flickr/uploader.rb",
     "lib/flickr/urls.rb",
     "lib/flickr_fu.rb",
     "spec/fixtures/flickr/contacts/get_list-fail-99.xml",
     "spec/fixtures/flickr/contacts/get_public_list-0.xml",
     "spec/fixtures/flickr/photos/geo/get_location-0.xml",
     "spec/fixtures/flickr/photos/geo/get_location-fail-2.xml",
     "spec/fixtures/flickr/photos/get_info-0.xml",
     "spec/fixtures/flickr/photos/get_info-1.xml",
     "spec/fixtures/flickr/photos/get_sizes-0.xml",
     "spec/fixtures/flickr/photos/get_sizes-1.xml",
     "spec/fixtures/flickr/photos/licenses/get_info.xml",
     "spec/fixtures/flickr/photosets/get_list-0.xml",
     "spec/fixtures/flickr/photosets/get_photos-0.xml",
     "spec/fixtures/flickr/test/echo-0.xml",
     "spec/fixtures/flickr/test/null-fail-99.xml",
     "spec/fixtures/flickr/urls/get_group-0.xml",
     "spec/fixtures/flickr/urls/get_group-fail-1.xml",
     "spec/fixtures/flickr/urls/get_user_photos-0.xml",
     "spec/fixtures/flickr/urls/get_user_photos-fail-1.xml",
     "spec/fixtures/flickr/urls/get_user_photos-fail-2.xml",
     "spec/fixtures/flickr/urls/get_user_profile-0.xml",
     "spec/fixtures/flickr/urls/get_user_profile-fail-1.xml",
     "spec/fixtures/flickr/urls/get_user_profile-fail-2.xml",
     "spec/fixtures/flickr/urls/lookup_group-0.xml",
     "spec/fixtures/flickr/urls/lookup_group-fail-1.xml",
     "spec/fixtures/flickr/urls/lookup_user-0.xml",
     "spec/fixtures/flickr/videos/get_info-0.xml",
     "spec/fixtures/flickr/videos/get_sizes-0.xml",
     "spec/flickr/base_spec.rb",
     "spec/flickr/contacts_spec.rb",
     "spec/flickr/errors_spec.rb",
     "spec/flickr/geo_spec.rb",
     "spec/flickr/photo_spec.rb",
     "spec/flickr/photos_spec.rb",
     "spec/flickr/photosets_spec.rb",
     "spec/flickr/test_spec.rb",
     "spec/flickr/urls_spec.rb",
     "spec/spec.opts",
     "spec/spec_helper.rb"
  ]
  s.homepage = %q{http://github.com/commonthread/flickr_fu}
  s.rdoc_options = ["--main", "README"]
  s.require_paths = ["lib"]
  s.rubygems_version = %q{1.3.3}
  s.summary = %q{Provides a ruby interface to flickr via the REST api}
  s.test_files = [
    "spec/spec_helper.rb",
     "spec/flickr/test_spec.rb",
     "spec/flickr/geo_spec.rb",
     "spec/flickr/contacts_spec.rb",
     "spec/flickr/urls_spec.rb",
     "spec/flickr/errors_spec.rb",
     "spec/flickr/base_spec.rb",
     "spec/flickr/photo_spec.rb",
     "spec/flickr/photosets_spec.rb",
     "spec/flickr/photos_spec.rb"
  ]

  if s.respond_to? :specification_version then
    current_version = Gem::Specification::CURRENT_SPECIFICATION_VERSION
    s.specification_version = 3

    if Gem::Version.new(Gem::RubyGemsVersion) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<mime-types>, ["> 0.0.0"])
      s.add_runtime_dependency(%q<xml-magic>, ["> 0.0.0"])
    else
      s.add_dependency(%q<mime-types>, ["> 0.0.0"])
      s.add_dependency(%q<xml-magic>, ["> 0.0.0"])
    end
  else
    s.add_dependency(%q<mime-types>, ["> 0.0.0"])
    s.add_dependency(%q<xml-magic>, ["> 0.0.0"])
  end
end
