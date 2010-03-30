require 'rake'
require 'rake/rdoctask'

# Gem building
begin
  begin
    require 'jeweler'
  rescue LoadError
    require 'rubygems'
    require 'jeweler'
  end
  Jeweler::Tasks.new do |s|
    s.name = "flickr_fu"
    s.summary = "Provides a ruby interface to flickr via the REST api"
    s.email = "ben@commonthread.com"
    s.homepage = "http://github.com/commonthread/flickr_fu"
    s.description = "Provides a ruby interface to flickr via the REST api"
    s.authors = ["Ben Wyrosdick", "Maciej Bilas"]
    s.rdoc_options = ["--main", "README"]
    s.extra_rdoc_files = ["README"]
    s.add_dependency("mime-types", ["> 0.0.0"])
    s.add_dependency("xml-magic", ["> 0.0.0"])
	s.files.exclude("spec/spec.local.opts")
  end
rescue LoadError
  puts "Jeweler not available. Install it with: sudo gem install technicalpickles-jeweler -s http://gems.github.com"
end

desc 'Generate documentation for flickr_fu.'
Rake::RDocTask.new(:rdoc) do |rdoc|
  rdoc.rdoc_dir = 'rdoc'
  rdoc.title    = 'flickr_fu'
  rdoc.options << '--line-numbers' << '--inline-source'
  rdoc.rdoc_files.include('README')
  rdoc.rdoc_files.include('lib/**/*.rb')
end

# RSpec support
begin
  require 'spec'
rescue LoadError
  require 'rubygems'
  require 'spec'
end
begin
  require 'spec/rake/spectask'
rescue LoadError
  puts <<-EOS
	  To use rspec for testing you must install rspec gem:
	  gem install rspec
  EOS
  exit(0)
end

task :default => :spec

spec_common = Proc.new do |t|
  t.spec_opts = ['--options', "spec/spec.opts"]
  t.spec_opts << ['--options', "spec/spec.local.opts" ] if File.exist?(File.dirname(__FILE__) + "/spec/spec.local.opts")
  t.spec_files = FileList['spec/**/*_spec.rb']
end

desc "Run the specs under spec/models"
Spec::Rake::SpecTask.new do |t|
  spec_common.call(t)
end

desc "Analyze code coverage with tests"
Spec::Rake::SpecTask.new("rcov") do |t|
  spec_common.call(t)
  t.rcov = true
  t.rcov_opts = ["-x", "/var/lib", "-x", "spec/", "-T"]
end
