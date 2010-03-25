# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_rwd_session',
  :secret      => '1788452ee2a53f67266cd022437c080d0542045f12539660781f8d7f47be8b9706c5890cfe4c563ca58354dcf9fd2292d8ed5ddbe3b37264ac0cff1c256361b4'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
