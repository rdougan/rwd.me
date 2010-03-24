Ext.onReady(function() {
  RWD.onLaunch();
});

//SyntaxHighlighter
SyntaxHighlighter.config.clipboardSwf = 'vendor/syntaxhighlighter/js/clipboard.swf';
SyntaxHighlighter.defaults['toolbar'] = false;
SyntaxHighlighter.all("pre");