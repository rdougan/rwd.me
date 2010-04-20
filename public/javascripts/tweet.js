/**
 * 
 */
RWD.TweetManager = function() {
  RWD.TweetManager.superclass.constructor.call(this);
  
  this.initTweet();
};
Ext.extend(RWD.TweetManager, Ext.util.Observable, {
  /**
   * 
   */
  initTweet: function() {
    this.getTweet();
  },

  /**
   * 
   */
  getTweet: function() {
    Ext.Ajax.request({
      url    : '/tweets',
      success: this.onGetTweetSuccess,
      failure: this.onGetTweetFailure,
      scope  : this
    });
  },

  /**
   * 
   */
  onGetTweetSuccess: function(response) {
    var json = Ext.util.JSON.decode(response.responseText);
    
    if (json.success) this.showTweets(json.tweets);
  },

  /**
   * 
   */
  onGetTweetFailure: function() {
    
  },
  
  /**
   * 
   */
  showTweets: function(tweets) {
    Ext.fly('tweet').update('');
    
    Ext.each(tweets, function(tweet) {
      var obj = {
        index: " " + this.a,
        text : tweet
      };
      
      this.showTweet(obj);
    }, this);
  },
   
  /**
   * 
   */
  currentTweet: 1,
  
  a: 0,
   
  /**
   * 
   */
  showTweet: function(tweet) {
    this.a = parseFloat(tweet.index) + 1;
    
    var tpl = new Ext.Template('<div id="tweet-{index}" class="message">{text}</div>');
    tpl.append('tweet', {index:this.a.toString(), text:tweet.text});
    
    if (this.currentTweet == 1 && this.a.toString() != 1) {
      var el = Ext.fly('tweet-' + this.a.toString());
      if (el) {
        el.setVisibilityMode(Ext.Element.DISPLAY);
        el.hide();
      };
    } else {
      Ext.fly('social').fadeIn();
      // this.startTweets();
    };
  }
});
