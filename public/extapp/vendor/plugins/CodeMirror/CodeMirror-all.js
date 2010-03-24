/* 
 Simple parser for LUA 
 Written for Lua 5.1, based on parsecss and other parsers. 
 features: highlights keywords, strings, comments (no leveling supported! ("[==[")),tokens, basic indenting

 to make this parser highlight your special functions pass table with this functions names to parserConfig argument of creator,
	
 parserConfig: ["myfunction1","myfunction2"],
 */

 
function findFirstRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")", "i");
}

function matchRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
}


 
var luaCustomFunctions= matchRegexp([]);
 
function configureLUA(parserConfig){
	if(parserConfig)
	luaCustomFunctions= matchRegexp(parserConfig);
}


//long list of standard functions from lua manual
var luaStdFunctions = matchRegexp([
"_G","_VERSION","assert","collectgarbage","dofile","error","getfenv","getmetatable","ipairs","load","loadfile","loadstring","module","next","pairs","pcall","print","rawequal","rawget","rawset","require","select","setfenv","setmetatable","tonumber","tostring","type","unpack","xpcall",

"coroutine.create","coroutine.resume","coroutine.running","coroutine.status","coroutine.wrap","coroutine.yield",

"debug.debug","debug.getfenv","debug.gethook","debug.getinfo","debug.getlocal","debug.getmetatable","debug.getregistry","debug.getupvalue","debug.setfenv","debug.sethook","debug.setlocal","debug.setmetatable","debug.setupvalue","debug.traceback",

"close","flush","lines","read","seek","setvbuf","write",

"io.close","io.flush","io.input","io.lines","io.open","io.output","io.popen","io.read","io.stderr","io.stdin","io.stdout","io.tmpfile","io.type","io.write",

"math.abs","math.acos","math.asin","math.atan","math.atan2","math.ceil","math.cos","math.cosh","math.deg","math.exp","math.floor","math.fmod","math.frexp","math.huge","math.ldexp","math.log","math.log10","math.max","math.min","math.modf","math.pi","math.pow","math.rad","math.random","math.randomseed","math.sin","math.sinh","math.sqrt","math.tan","math.tanh",

"os.clock","os.date","os.difftime","os.execute","os.exit","os.getenv","os.remove","os.rename","os.setlocale","os.time","os.tmpname",

"package.cpath","package.loaded","package.loaders","package.loadlib","package.path","package.preload","package.seeall",

"string.byte","string.char","string.dump","string.find","string.format","string.gmatch","string.gsub","string.len","string.lower","string.match","string.rep","string.reverse","string.sub","string.upper",

"table.concat","table.insert","table.maxn","table.remove","table.sort"
]);



 var luaKeywords = matchRegexp(["and","break","elseif","false","nil","not","or","return",
				"true","function", "end", "if", "then", "else", "do", 
				"while", "repeat", "until", "for", "in", "local" ]);

 var luaIndentKeys = matchRegexp(["function", "if","repeat","for","while", "[\(]", "{"]);
 var luaUnindentKeys = matchRegexp(["end", "until", "[\)]", "}"]);

 var luaUnindentKeys2 = findFirstRegexp(["end", "until", "[\)]", "}"]);
 var luaMiddleKeys = findFirstRegexp(["else","elseif"]);



var LUAParser = Editor.Parser = (function() {
  var tokenizeLUA = (function() {
    function normal(source, setState) {
      var ch = source.next();

   if (ch == "-" && source.equals("-")) {
        source.next();
 		setState(inSLComment);
        return null;
      } 
	else if (ch == "\"" || ch == "'") {
        setState(inString(ch));
        return null;
      }
    if (ch == "[" && (source.equals("[") || source.equals("="))) {
        var level = 0;
		while(source.equals("=")){
			level ++;
			source.next();
		}
		if(! source.equals("[") )
			return "lua-error";		
		setState(inMLSomething(level,"lua-string"));
        return null;
      } 
	    
      else if (ch == "=") {
	if (source.equals("="))
		source.next();
        return "lua-token";
      }
  	
      else if (ch == ".") {
	if (source.equals("."))
		source.next();
	if (source.equals("."))
		source.next();
        return "lua-token";
      }
     
      else if (ch == "+" || ch == "-" || ch == "*" || ch == "/" || ch == "%" || ch == "^" || ch == "#" ) {
        return "lua-token";
      }
      else if (ch == ">" || ch == "<" || ch == "(" || ch == ")" || ch == "{" || ch == "}" || ch == "[" ) {
        return "lua-token";
      }
      else if (ch == "]" || ch == ";" || ch == ":" || ch == ",") {
        return "lua-token";
      }
      else if (source.equals("=") && (ch == "~" || ch == "<" || ch == ">")) {
        source.next();
        return "lua-token";
      }

     else if (/\d/.test(ch)) {
        source.nextWhileMatches(/[\w.%]/);
        return "lua-number";
      }
      else {
        source.nextWhileMatches(/[\w\\\-_.]/);
        return "lua-identifier";
      }
    }
 
function inSLComment(source, setState) {
      var start = true;
	var count=0;
      while (!source.endOfLine()) {
	 	var ch = source.next();
		var level = 0;
		if ((ch =="[") && start)
			while(source.equals("=")){
			source.next();
			level++;
			}
			if (source.equals("[")){
       				setState(inMLSomething(level,"lua-comment"));
        			return null;
  				}
		 start = false;	
	}
	setState(normal);      		
     return "lua-comment";
	
    }

    function inMLSomething(level,what) {
	//wat sholud be "lua-string" or "lua-comment", level is the number of "=" in opening mark.
	return function(source, setState){
      var dashes = 0;
      while (!source.endOfLine()) {
        var ch = source.next();
        if (dashes == level+1 && ch == "]" ) {
          setState(normal);
          break;
        }
		if (dashes == 0) 
			dashes = (ch == "]") ? 1:0;
		else
 			dashes = (ch == "=") ? dashes + 1 : 0;
        }
      return what;
	 }
    }


    function inString(quote) {
      return function(source, setState) {
        var escaped = false;
        while (!source.endOfLine()) {
          var ch = source.next();
          if (ch == quote && !escaped)
            break;
          escaped = !escaped && ch == "\\";
        }
        if (!escaped)
          setState(normal);
        return "lua-string";
      };
    }

    return function(source, startState) {
      return tokenizer(source, startState || normal);
    };
  })();

  function indentLUA(indentDepth, base) {
    return function(nextChars) {

      var closing = (luaUnindentKeys2.test(nextChars) || luaMiddleKeys.test(nextChars));

 	
	return base + ( indentUnit * (indentDepth - (closing?1:0)) );
    };
  }

  
function parseLUA(source,basecolumn) {
     basecolumn = basecolumn || 0;
    
	var tokens = tokenizeLUA(source);
    var indentDepth = 0;

    var iter = {
      next: function() {
        var token = tokens.next(), style = token.style, content = token.content;

 
	
	if (style == "lua-identifier" && luaKeywords.test(content)){
	  token.style = "lua-keyword";
	}	
	if (style == "lua-identifier" && luaStdFunctions.test(content)){
	  token.style = "lua-stdfunc";
	}
	if (style == "lua-identifier" && luaCustomFunctions.test(content)){
	  token.style = "lua-customfunc";
	}

	if (luaIndentKeys.test(content))
    	indentDepth++;
	else if (luaUnindentKeys.test(content))
		indentDepth--;
        

        if (content == "\n")
          token.indentation = indentLUA( indentDepth, basecolumn);

        return token;
      },

      copy: function() {
        var  _tokenState = tokens.state, _indentDepth = indentDepth;
        return function(source) {
          tokens = tokenizeLUA(source, _tokenState);
      
	  indentDepth = _indentDepth;
          return iter;
        };
      }
    };
    return iter;
  }

  return {make: parseLUA, configure:configureLUA, electricChars: "delf})"};   //en[d] els[e] unti[l] elsei[f]  // this should be taken from Keys keywords
})();


/*
Copyright (c) 2008-2009 Yahoo! Inc. All rights reserved.
The copyrights embodied in the content of this file are licensed by
Yahoo! Inc. under the BSD (revised) open source license

@author Dan Vlad Dascalescu <dandv@yahoo-inc.com>


Parse function for PHP. Makes use of the tokenizer from tokenizephp.js.
Based on parsejavascript.js by Marijn Haverbeke.


Features:
 + special "deprecated" style for PHP4 keywords like 'var'
 + support for PHP 5.3 keywords: 'namespace', 'use'
 + 911 predefined constants, 1301 predefined functions, 105 predeclared classes
   from a typical PHP installation in a LAMP environment
 + new feature: syntax error flagging, thus enabling strict parsing of:
   + function definitions with explicitly or implicitly typed arguments and default values
   + modifiers (public, static etc.) applied to method and member definitions
   + foreach(array_expression as $key [=> $value]) loops
 + differentiation between single-quoted strings and double-quoted interpolating strings

*/


// add the Array.indexOf method for JS engines that don't support it (e.g. IE)
// code from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/IndexOf
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}


var PHPParser = Editor.Parser = (function() {
  // Token types that can be considered to be atoms, part of operator expressions
  var atomicTypes = {
    "atom": true, "number": true, "variable": true, "string": true
  };
  // Constructor for the lexical context objects.
  function PHPLexical(indented, column, type, align, prev, info) {
    // indentation at start of this line
    this.indented = indented;
    // column at which this scope was opened
    this.column = column;
    // type of scope ('stat' (statement), 'form' (special form), '[', '{', or '(')
    this.type = type;
    // '[', '{', or '(' blocks that have any text after their opening
    // character are said to be 'aligned' -- any lines below are
    // indented all the way to the opening character.
    if (align != null)
      this.align = align;
    // Parent scope, if any.
    this.prev = prev;
    this.info = info;
  }

  // PHP indentation rules
  function indentPHP(lexical) {
    return function(firstChars) {
      var firstChar = firstChars && firstChars.charAt(0), type = lexical.type;
      var closing = firstChar == type;
      if (type == "form" && firstChar == "{")
        return lexical.indented;
      else if (type == "stat" || type == "form")
        return lexical.indented + indentUnit;
      else if (lexical.info == "switch" && !closing)
        return lexical.indented + (/^(?:case|default)\b/.test(firstChars) ? indentUnit : 2 * indentUnit);
      else if (lexical.align)
        return lexical.column - (closing ? 1 : 0);
      else
        return lexical.indented + (closing ? 0 : indentUnit);
    };
  }

  // The parser-iterator-producing function itself.
  function parsePHP(input, basecolumn) {
    // Wrap the input in a token stream
    var tokens = tokenizePHP(input);
    // The parser state. cc is a stack of actions that have to be
    // performed to finish the current statement. For example we might
    // know that we still need to find a closing parenthesis and a
    // semicolon. Actions at the end of the stack go first. It is
    // initialized with an infinitely looping action that consumes
    // whole statements.
    var cc = [statements];
    // The lexical scope, used mostly for indentation.
    var lexical = new PHPLexical((basecolumn || 0) - indentUnit, 0, "block", false);
    // Current column, and the indentation at the start of the current
    // line. Used to create lexical scope objects.
    var column = 0;
    var indented = 0;
    // Variables which are used by the mark, cont, and pass functions
    // below to communicate with the driver loop in the 'next' function.
    var consume, marked;

    // The iterator object.
    var parser = {next: next, copy: copy};

    // parsing is accomplished by calling next() repeatedly
    function next(){
      // Start by performing any 'lexical' actions (adjusting the
      // lexical variable), or the operations below will be working
      // with the wrong lexical state.
      while(cc[cc.length - 1].lex)
        cc.pop()();

      // Fetch the next token.
      var token = tokens.next();

      // Adjust column and indented.
      if (token.type == "whitespace" && column == 0)
        indented = token.value.length;
      column += token.value.length;
      if (token.content == "\n"){
        indented = column = 0;
        // If the lexical scope's align property is still undefined at
        // the end of the line, it is an un-aligned scope.
        if (!("align" in lexical))
          lexical.align = false;
        // Newline tokens get an indentation function associated with
        // them.
        token.indentation = indentPHP(lexical);
      }
      // No more processing for meaningless tokens.
      if (token.type == "whitespace" || token.type == "comment"
        || token.type == "string_not_terminated" )
        return token;
      // When a meaningful token is found and the lexical scope's
      // align is undefined, it is an aligned scope.
      if (!("align" in lexical))
        lexical.align = true;

      // Execute actions until one 'consumes' the token and we can
      // return it. 'marked' is used to change the style of the current token.
      while(true) {
        consume = marked = false;
        // Take and execute the topmost action.
        var action = cc.pop();
        action(token);

        if (consume){
          if (marked)
            token.style = marked;
          // Here we differentiate between local and global variables.
          return token;
        }
      }
      return 1; // Firebug workaround for http://code.google.com/p/fbug/issues/detail?id=1239#c1
    }

    // This makes a copy of the parser state. It stores all the
    // stateful variables in a closure, and returns a function that
    // will restore them when called with a new input stream. Note
    // that the cc array has to be copied, because it is contantly
    // being modified. Lexical objects are not mutated, so they can
    // be shared between runs of the parser.
    function copy(){
      var _lexical = lexical, _cc = cc.concat([]), _tokenState = tokens.state;

      return function copyParser(input){
        lexical = _lexical;
        cc = _cc.concat([]); // copies the array
        column = indented = 0;
        tokens = tokenizePHP(input, _tokenState);
        return parser;
      };
    }

    // Helper function for pushing a number of actions onto the cc
    // stack in reverse order.
    function push(fs){
      for (var i = fs.length - 1; i >= 0; i--)
        cc.push(fs[i]);
    }
    // cont and pass are used by the action functions to add other
    // actions to the stack. cont will cause the current token to be
    // consumed, pass will leave it for the next action.
    function cont(){
      push(arguments);
      consume = true;
    }
    function pass(){
      push(arguments);
      consume = false;
    }
    // Used to change the style of the current token.
    function mark(style){
      marked = style;
    }
    // Add a lyer of style to the current token, for example syntax-error
    function mark_add(style){
      marked = marked + ' ' + style;
    }

    // Push a new lexical context of the given type.
    function pushlex(type, info) {
      var result = function pushlexing() {
        lexical = new PHPLexical(indented, column, type, null, lexical, info)
      };
      result.lex = true;
      return result;
    }
    // Pop off the current lexical context.
    function poplex(){
      lexical = lexical.prev;
    }
    poplex.lex = true;
    // The 'lex' flag on these actions is used by the 'next' function
    // to know they can (and have to) be ran before moving on to the
    // next token.

    // Creates an action that discards tokens until it finds one of
    // the given type. This will ignore (and recover from) syntax errors.
    function expect(wanted){
      return function expecting(token){
        if (token.type == wanted) cont();  // consume the token
        else {
          cont(arguments.callee);  // continue expecting() - call itself
        }
      };
    }

    // Require a specific token type, or one of the tokens passed in the 'wanted' array
    // Used to detect blatant syntax errors. 'execute' is used to pass extra code
    // to be executed if the token is matched. For example, a '(' match could
    // 'execute' a cont( compasep(funcarg), require(")") )
    function require(wanted, execute){
      return function requiring(token){
        var ok;
        var type = token.type;
        if (typeof(wanted) == "string")
          ok = (type == wanted) -1;
        else
          ok = wanted.indexOf(type);
        if (ok >= 0) {
          if (execute && typeof(execute[ok]) == "function")
            execute[ok](token);
            cont();  // just consume the token
        }
        else {
          if (!marked) mark(token.style);
          mark_add("syntax-error");
          cont(arguments.callee);
        }
      };
    }

    // Looks for a statement, and then calls itself.
    function statements(token){
      return pass(statement, statements);
    }
    // Dispatches various types of statements based on the type of the current token.
    function statement(token){
      var type = token.type;
      if (type == "keyword a") cont(pushlex("form"), expression, statement, poplex);
      else if (type == "keyword b") cont(pushlex("form"), statement, poplex);
      else if (type == "{") cont(pushlex("}"), block, poplex);
      else if (type == "function") funcdef();
      // technically, "class implode {...}" is correct, but we'll flag that as an error because it overrides a predefined function
      else if (type == "class") cont(require("t_string"), expect("{"), pushlex("}"), block, poplex);
      else if (type == "foreach") cont(pushlex("form"), require("("), pushlex(")"), expression, require("as"), require("variable"), /* => $value */ expect(")"), poplex, statement, poplex);
      else if (type == "for") cont(pushlex("form"), require("("), pushlex(")"), expression, require(";"), expression, require(";"), expression, require(")"), poplex, statement, poplex);
      // public final function foo(), protected static $bar;
      else if (type == "modifier") cont(require(["modifier", "variable", "function"], [null, null, funcdef]));
      else if (type == "switch") cont(pushlex("form"), require("("), expression, require(")"), pushlex("}", "switch"), require([":", "{"]), block, poplex, poplex);
      else if (type == "case") cont(expression, require(":"));
      else if (type == "default") cont(require(":"));
      else if (type == "catch") cont(pushlex("form"), require("("), require("t_string"), require("variable"), require(")"), statement, poplex);
      else if (type == "const") cont(require("t_string"));  // 'const static x=5' is a syntax error
      // technically, "namespace implode {...}" is correct, but we'll flag that as an error because it overrides a predefined function
      else if (type == "namespace") cont(namespacedef, require(";"));
      // $variables may be followed by operators, () for variable function calls, or [] subscripts
      else pass(pushlex("stat"), expression, require(";"), poplex);
    }
    // Dispatch expression types.
    function expression(token){
      var type = token.type;
      if (atomicTypes.hasOwnProperty(type)) cont(maybeoperator);
      else if (type == "<<<") cont(require("string"), maybeoperator);  // heredoc/nowdoc
      else if (type == "t_string") cont(maybe_double_colon, maybeoperator);
      else if (type == "keyword c") cont(expression);
      // function call or parenthesized expression: $a = ($b + 1) * 2;
      else if (type == "(") cont(pushlex(")"), commasep(expression), require(")"), poplex, maybeoperator);
      else if (type == "operator") cont(expression);
    }
    // Called for places where operators, function calls, or subscripts are
    // valid. Will skip on to the next action if none is found.
    function maybeoperator(token){
      var type = token.type;
      if (type == "operator") {
        if (token.content == "?") cont(expression, require(":"), expression);  // ternary operator
        else cont(expression);
      }
      else if (type == "(") cont(pushlex(")"), expression, commasep(expression), require(")"), poplex, maybeoperator /* $varfunc() + 3 */);
      else if (type == "[") cont(pushlex("]"), expression, require("]"), maybeoperator /* for multidimensional arrays, or $func[$i]() */, poplex);
    }
    // A regular use of the double colon to specify a class, as in self::func() or myclass::$var;
    // Differs from `namespace` or `use` in that only one class can be the parent; chains (A::B::$var) are a syntax error.
    function maybe_double_colon(token) {
      if (token.type == "t_double_colon")
        // A::$var, A::func(), A::const
        cont(require(["t_string", "variable"]), maybeoperator);
      else {
        // a t_string wasn't followed by ::, such as in a function call: foo()
        pass(expression)
      }
    }
    // the declaration or definition of a function
    function funcdef() {
      cont(require("t_string"), require("("), pushlex(")"), commasep(funcarg), require(")"), poplex, block);
    }
    // Parses a comma-separated list of the things that are recognized
    // by the 'what' argument.
    function commasep(what){
      function proceed(token) {
        if (token.type == ",") cont(what, proceed);
      }
      return function commaSeparated() {
        pass(what, proceed);
      };
    }
    // Look for statements until a closing brace is found.
    function block(token) {
      if (token.type == "}") cont();
      else pass(statement, block);
    }
    function maybedefaultparameter(token){
      if (token.content == "=") cont(expression);
    }
    // support for default arguments: http://us.php.net/manual/en/functions.arguments.php#functions.arguments.default
    function funcarg(token){
      // function foo(myclass $obj) {...}
      if (token.type == "t_string") cont(require("variable"), maybedefaultparameter);
      // function foo($string) {...}
      else if (token.type == "variable") cont(maybedefaultparameter);
    }

    // A namespace definition or use
    function maybe_double_colon_def(token) {
      if (token.type == "t_double_colon")
        cont(namespacedef);
    }
    function namespacedef(token) {
      pass(require("t_string"), maybe_double_colon_def);
    }

    return parser;
  }

  return {make: parsePHP, electricChars: "{}:"};

})();

/*
Copyright (c) 2008-2009 Yahoo! Inc. All rights reserved.
The copyrights embodied in the content of this file are licensed by
Yahoo! Inc. under the BSD (revised) open source license

@author Dan Vlad Dascalescu <dandv@yahoo-inc.com>

Based on parsehtmlmixed.js by Marijn Haverbeke.
*/

var PHPHTMLMixedParser = Editor.Parser = (function() {
  if (!(PHPParser && CSSParser && JSParser && XMLParser))
    throw new Error("PHP, CSS, JS, and XML parsers must be loaded for PHP+HTML mixed mode to work.");
  XMLParser.configure({useHTMLKludges: true});

  function parseMixed(stream) {
    var htmlParser = XMLParser.make(stream), localParser = null, inTag = false, phpParserState = null;
    var iter = {next: top, copy: copy};

    function top() {
      var token = htmlParser.next();
      if (token.content == "<")
        inTag = true;
      else if (token.style == "xml-tagname" && inTag === true)
        inTag = token.content.toLowerCase();
      else if (token.type == "xml-processing") {
        // dispatch on PHP
        if (token.content == "<?php")
          iter.next = local(PHPParser, "?>");
      }
      // "xml-processing" tokens are ignored, because they should be handled by a specific local parser
      else if (token.content == ">") {
        if (inTag == "script")
          iter.next = local(JSParser, "</script");
        else if (inTag == "style")
          iter.next = local(CSSParser, "</style");
        inTag = false;
      }
      return token;
    }
    function local(parser, tag) {
      var baseIndent = htmlParser.indentation();
      if (parser == PHPParser && phpParserState)
        localParser = phpParserState(stream);
      else
        localParser = parser.make(stream, baseIndent + indentUnit);

      return function() {
        if (stream.lookAhead(tag, false, false, true)) {
          if (parser == PHPParser) phpParserState = localParser.copy();
          localParser = null;
          iter.next = top;
          return top();  // pass the ending tag to the enclosing parser
        }

        var token = localParser.next();
        var lt = token.value.lastIndexOf("<"), sz = Math.min(token.value.length - lt, tag.length);
        if (lt != -1 && token.value.slice(lt, lt + sz).toLowerCase() == tag.slice(0, sz) &&
            stream.lookAhead(tag.slice(sz), false, false, true)) {
          stream.push(token.value.slice(lt));
          token.value = token.value.slice(0, lt);
        }

        if (token.indentation) {
          var oldIndent = token.indentation;
          token.indentation = function(chars) {
            if (chars == "</")
              return baseIndent;
            else
              return oldIndent(chars);
          }
        }

        return token;
      };
    }

    function copy() {
      var _html = htmlParser.copy(), _local = localParser && localParser.copy(),
          _next = iter.next, _inTag = inTag, _php = phpParserState;
      return function(_stream) {
        stream = _stream;
        htmlParser = _html(_stream);
        localParser = _local && _local(_stream);
        phpParserState = _php;
        iter.next = _next;
        inTag = _inTag;
        return iter;
      };
    }
    return iter;
  }

  return {make: parseMixed, electricChars: "{}/:"};

})();

/*
Copyright (c) 2008-2009 Yahoo! Inc.  All rights reserved.
The copyrights embodied in the content of this file are licensed by
Yahoo! Inc. under the BSD (revised) open source license

@author Vlad Dan Dascalescu <dandv@yahoo-inc.com>


Tokenizer for PHP code

References:
  + http://php.net/manual/en/reserved.php
  + http://php.net/tokens
  + get_defined_constants(), get_defined_functions(), get_declared_classes()
      executed on a realistic (not vanilla) PHP installation with typical LAMP modules.
      Specifically, the PHP bundled with the Uniform Web Server (www.uniformserver.com).

*/


// add the forEach method for JS engines that don't support it (e.g. IE)
// code from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference:Objects:Array:forEach
if (!Array.prototype.forEach)
{
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}


var tokenizePHP = (function() {
  /* A map of PHP's reserved words (keywords, predefined classes, functions and
     constants. Each token has a type ('keyword', 'operator' etc.) and a style.
     The style corresponds to the CSS span class in phpcolors.css.

     Keywords can be of three types:
     a - takes an expression and forms a statement - e.g. if
     b - takes just a statement - e.g. else
     c - takes an optinoal expression, but no statement - e.g. return
     This distinction gives the parser enough information to parse
     correct code correctly (we don't care that much how we parse
     incorrect code).

     Reference: http://us.php.net/manual/en/reserved.php
  */
  var keywords = function(){
    function token(type, style){
      return {type: type, style: style};
    }
    var result = {};

    // for each(var element in ["...", "..."]) can pick up elements added to
    // Array.prototype, so we'll use the loop structure below. See also
    // http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Statements/for_each...in

    // keywords that take an expression and form a statement
    ["if", "elseif", "while", "declare"].forEach(function(element, index, array) {
      result[element] = token("keyword a", "php-keyword");
    });

    // keywords that take just a statement
    ["do", "else", "try" ].forEach(function(element, index, array) {
      result[element] = token("keyword b", "php-keyword");
    });

    // keywords that take an optional expression, but no statement
    ["return", "break", "continue",  // the expression is optional
      "new", "clone", "throw"  // the expression is mandatory
    ].forEach(function(element, index, array) {
      result[element] = token("keyword c", "php-keyword");
    });

    ["__CLASS__", "__DIR__", "__FILE__", "__FUNCTION__", "__METHOD__", "__NAMESPACE__"].forEach(function(element, index, array) {
      result[element] = token("atom", "php-compile-time-constant");
    });

    ["true", "false", "null"].forEach(function(element, index, array) {
      result[element] = token("atom", "php-atom");
    });

    ["and", "or", "xor", "instanceof"].forEach(function(element, index, array) {
      result[element] = token("operator", "php-keyword php-operator");
    });

    ["class", "interface"].forEach(function(element, index, array) {
      result[element] = token("class", "php-keyword");
    });
    ["namespace", "use", "extends", "implements"].forEach(function(element, index, array) {
      result[element] = token("namespace", "php-keyword");
    });

    // reserved "language constructs"... http://php.net/manual/en/reserved.php
    [ "die", "echo", "empty", "exit", "eval", "include", "include_once", "isset",
      "list", "require", "require_once", "return", "print", "unset",
      "array" // a keyword rather, but mandates a parenthesized parameter list
    ].forEach(function(element, index, array) {
      result[element] = token("t_string", "php-reserved-language-construct");
    });

    result["switch"] = token("switch", "php-keyword");
    result["case"] = token("case", "php-keyword");
    result["default"] = token("default", "php-keyword");
    result["catch"] = token("catch", "php-keyword");
    result["function"] = token("function", "php-keyword");

    // http://php.net/manual/en/control-structures.alternative-syntax.php must be followed by a ':'
    ["endif", "endwhile", "endfor", "endforeach", "endswitch", "enddeclare"].forEach(function(element, index, array) {
      result[element] = token("default", "php-keyword");
    });

    result["const"] = token("const", "php-keyword");

    ["abstract", "final", "private", "protected", "public", "global", "static"].forEach(function(element, index, array) {
      result[element] = token("modifier", "php-keyword");
    });
    result["var"] = token("modifier", "php-keyword deprecated");

    result["foreach"] = token("foreach", "php-keyword");
    result["as"] = token("as", "php-keyword");
    result["for"] = token("for", "php-keyword");

    // PHP built-in functions - output of get_defined_functions()["internal"]
    [ "zend_version", "func_num_args", "func_get_arg", "func_get_args", "strlen",
      "strcmp", "strncmp", "strcasecmp", "strncasecmp", "each", "error_reporting",
      "define", "defined", "get_class", "get_parent_class", "method_exists",
      "property_exists", "class_exists", "interface_exists", "function_exists",
      "get_included_files", "get_required_files", "is_subclass_of", "is_a",
      "get_class_vars", "get_object_vars", "get_class_methods", "trigger_error",
      "user_error", "set_error_handler", "restore_error_handler",
      "set_exception_handler", "restore_exception_handler", "get_declared_classes",
      "get_declared_interfaces", "get_defined_functions", "get_defined_vars",
      "create_function", "get_resource_type", "get_loaded_extensions",
      "extension_loaded", "get_extension_funcs", "get_defined_constants",
      "debug_backtrace", "debug_print_backtrace", "bcadd", "bcsub", "bcmul", "bcdiv",
      "bcmod", "bcpow", "bcsqrt", "bcscale", "bccomp", "bcpowmod", "jdtogregorian",
      "gregoriantojd", "jdtojulian", "juliantojd", "jdtojewish", "jewishtojd",
      "jdtofrench", "frenchtojd", "jddayofweek", "jdmonthname", "easter_date",
      "easter_days", "unixtojd", "jdtounix", "cal_to_jd", "cal_from_jd",
      "cal_days_in_month", "cal_info", "variant_set", "variant_add", "variant_cat",
      "variant_sub", "variant_mul", "variant_and", "variant_div", "variant_eqv",
      "variant_idiv", "variant_imp", "variant_mod", "variant_or", "variant_pow",
      "variant_xor", "variant_abs", "variant_fix", "variant_int", "variant_neg",
      "variant_not", "variant_round", "variant_cmp", "variant_date_to_timestamp",
      "variant_date_from_timestamp", "variant_get_type", "variant_set_type",
      "variant_cast", "com_create_guid", "com_event_sink", "com_print_typeinfo",
      "com_message_pump", "com_load_typelib", "com_get_active_object", "ctype_alnum",
      "ctype_alpha", "ctype_cntrl", "ctype_digit", "ctype_lower", "ctype_graph",
      "ctype_print", "ctype_punct", "ctype_space", "ctype_upper", "ctype_xdigit",
      "strtotime", "date", "idate", "gmdate", "mktime", "gmmktime", "checkdate",
      "strftime", "gmstrftime", "time", "localtime", "getdate", "date_create",
      "date_parse", "date_format", "date_modify", "date_timezone_get",
      "date_timezone_set", "date_offset_get", "date_time_set", "date_date_set",
      "date_isodate_set", "timezone_open", "timezone_name_get",
      "timezone_name_from_abbr", "timezone_offset_get", "timezone_transitions_get",
      "timezone_identifiers_list", "timezone_abbreviations_list",
      "date_default_timezone_set", "date_default_timezone_get", "date_sunrise",
      "date_sunset", "date_sun_info", "filter_input", "filter_var",
      "filter_input_array", "filter_var_array", "filter_list", "filter_has_var",
      "filter_id", "ftp_connect", "ftp_login", "ftp_pwd", "ftp_cdup", "ftp_chdir",
      "ftp_exec", "ftp_raw", "ftp_mkdir", "ftp_rmdir", "ftp_chmod", "ftp_alloc",
      "ftp_nlist", "ftp_rawlist", "ftp_systype", "ftp_pasv", "ftp_get", "ftp_fget",
      "ftp_put", "ftp_fput", "ftp_size", "ftp_mdtm", "ftp_rename", "ftp_delete",
      "ftp_site", "ftp_close", "ftp_set_option", "ftp_get_option", "ftp_nb_fget",
      "ftp_nb_get", "ftp_nb_continue", "ftp_nb_put", "ftp_nb_fput", "ftp_quit",
      "hash", "hash_file", "hash_hmac", "hash_hmac_file", "hash_init", "hash_update",
      "hash_update_stream", "hash_update_file", "hash_final", "hash_algos", "iconv",
      "ob_iconv_handler", "iconv_get_encoding", "iconv_set_encoding", "iconv_strlen",
      "iconv_substr", "iconv_strpos", "iconv_strrpos", "iconv_mime_encode",
      "iconv_mime_decode", "iconv_mime_decode_headers", "json_encode", "json_decode",
      "odbc_autocommit", "odbc_binmode", "odbc_close", "odbc_close_all",
      "odbc_columns", "odbc_commit", "odbc_connect", "odbc_cursor",
      "odbc_data_source", "odbc_execute", "odbc_error", "odbc_errormsg", "odbc_exec",
      "odbc_fetch_array", "odbc_fetch_object", "odbc_fetch_row", "odbc_fetch_into",
      "odbc_field_len", "odbc_field_scale", "odbc_field_name", "odbc_field_type",
      "odbc_field_num", "odbc_free_result", "odbc_gettypeinfo", "odbc_longreadlen",
      "odbc_next_result", "odbc_num_fields", "odbc_num_rows", "odbc_pconnect",
      "odbc_prepare", "odbc_result", "odbc_result_all", "odbc_rollback",
      "odbc_setoption", "odbc_specialcolumns", "odbc_statistics", "odbc_tables",
      "odbc_primarykeys", "odbc_columnprivileges", "odbc_tableprivileges",
      "odbc_foreignkeys", "odbc_procedures", "odbc_procedurecolumns", "odbc_do",
      "odbc_field_precision", "preg_match", "preg_match_all", "preg_replace",
      "preg_replace_callback", "preg_split", "preg_quote", "preg_grep",
      "preg_last_error", "session_name", "session_module_name", "session_save_path",
      "session_id", "session_regenerate_id", "session_decode", "session_register",
      "session_unregister", "session_is_registered", "session_encode",
      "session_start", "session_destroy", "session_unset",
      "session_set_save_handler", "session_cache_limiter", "session_cache_expire",
      "session_set_cookie_params", "session_get_cookie_params",
      "session_write_close", "session_commit", "spl_classes", "spl_autoload",
      "spl_autoload_extensions", "spl_autoload_register", "spl_autoload_unregister",
      "spl_autoload_functions", "spl_autoload_call", "class_parents",
      "class_implements", "spl_object_hash", "iterator_to_array", "iterator_count",
      "iterator_apply", "constant", "bin2hex", "sleep", "usleep", "flush",
      "wordwrap", "htmlspecialchars", "htmlentities", "html_entity_decode",
      "htmlspecialchars_decode", "get_html_translation_table", "sha1", "sha1_file",
      "md5", "md5_file", "crc32", "iptcparse", "iptcembed", "getimagesize",
      "image_type_to_mime_type", "image_type_to_extension", "phpinfo", "phpversion",
      "phpcredits", "php_logo_guid", "php_real_logo_guid", "php_egg_logo_guid",
      "zend_logo_guid", "php_sapi_name", "php_uname", "php_ini_scanned_files",
      "strnatcmp", "strnatcasecmp", "substr_count", "strspn", "strcspn", "strtok",
      "strtoupper", "strtolower", "strpos", "stripos", "strrpos", "strripos",
      "strrev", "hebrev", "hebrevc", "nl2br", "basename", "dirname", "pathinfo",
      "stripslashes", "stripcslashes", "strstr", "stristr", "strrchr", "str_shuffle",
      "str_word_count", "str_split", "strpbrk", "substr_compare", "strcoll",
      "substr", "substr_replace", "quotemeta", "ucfirst", "ucwords", "strtr",
      "addslashes", "addcslashes", "rtrim", "str_replace", "str_ireplace",
      "str_repeat", "count_chars", "chunk_split", "trim", "ltrim", "strip_tags",
      "similar_text", "explode", "implode", "setlocale", "localeconv", "soundex",
      "levenshtein", "chr", "ord", "parse_str", "str_pad", "chop", "strchr",
      "sprintf", "printf", "vprintf", "vsprintf", "fprintf", "vfprintf", "sscanf",
      "fscanf", "parse_url", "urlencode", "urldecode", "rawurlencode",
      "rawurldecode", "http_build_query", "unlink", "exec", "system",
      "escapeshellcmd", "escapeshellarg", "passthru", "shell_exec", "proc_open",
      "proc_close", "proc_terminate", "proc_get_status", "rand", "srand",
      "getrandmax", "mt_rand", "mt_srand", "mt_getrandmax", "getservbyname",
      "getservbyport", "getprotobyname", "getprotobynumber", "getmyuid", "getmygid",
      "getmypid", "getmyinode", "getlastmod", "base64_decode", "base64_encode",
      "convert_uuencode", "convert_uudecode", "abs", "ceil", "floor", "round", "sin",
      "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "pi",
      "is_finite", "is_nan", "is_infinite", "pow", "exp", "log", "log10", "sqrt",
      "hypot", "deg2rad", "rad2deg", "bindec", "hexdec", "octdec", "decbin",
      "decoct", "dechex", "base_convert", "number_format", "fmod", "ip2long",
      "long2ip", "getenv", "putenv", "microtime", "gettimeofday", "uniqid",
      "quoted_printable_decode", "convert_cyr_string", "get_current_user",
      "set_time_limit", "get_cfg_var", "magic_quotes_runtime",
      "set_magic_quotes_runtime", "get_magic_quotes_gpc", "get_magic_quotes_runtime",
      "import_request_variables", "error_log", "error_get_last", "call_user_func",
      "call_user_func_array", "call_user_method", "call_user_method_array",
      "serialize", "unserialize", "var_dump", "var_export", "debug_zval_dump",
      "print_r", "memory_get_usage", "memory_get_peak_usage",
      "register_shutdown_function", "register_tick_function",
      "unregister_tick_function", "highlight_file", "show_source",
      "highlight_string", "php_strip_whitespace", "ini_get", "ini_get_all",
      "ini_set", "ini_alter", "ini_restore", "get_include_path", "set_include_path",
      "restore_include_path", "setcookie", "setrawcookie", "header", "headers_sent",
      "headers_list", "connection_aborted", "connection_status", "ignore_user_abort",
      "parse_ini_file", "is_uploaded_file", "move_uploaded_file", "gethostbyaddr",
      "gethostbyname", "gethostbynamel", "intval", "floatval", "doubleval", "strval",
      "gettype", "settype", "is_null", "is_resource", "is_bool", "is_long",
      "is_float", "is_int", "is_integer", "is_double", "is_real", "is_numeric",
      "is_string", "is_array", "is_object", "is_scalar", "is_callable", "ereg",
      "ereg_replace", "eregi", "eregi_replace", "split", "spliti", "join",
      "sql_regcase", "dl", "pclose", "popen", "readfile", "rewind", "rmdir", "umask",
      "fclose", "feof", "fgetc", "fgets", "fgetss", "fread", "fopen", "fpassthru",
      "ftruncate", "fstat", "fseek", "ftell", "fflush", "fwrite", "fputs", "mkdir",
      "rename", "copy", "tempnam", "tmpfile", "file", "file_get_contents",
      "file_put_contents", "stream_select", "stream_context_create",
      "stream_context_set_params", "stream_context_set_option",
      "stream_context_get_options", "stream_context_get_default",
      "stream_filter_prepend", "stream_filter_append", "stream_filter_remove",
      "stream_socket_client", "stream_socket_server", "stream_socket_accept",
      "stream_socket_get_name", "stream_socket_recvfrom", "stream_socket_sendto",
      "stream_socket_enable_crypto", "stream_socket_shutdown",
      "stream_copy_to_stream", "stream_get_contents", "fgetcsv", "fputcsv", "flock",
      "get_meta_tags", "stream_set_write_buffer", "set_file_buffer",
      "set_socket_blocking", "stream_set_blocking", "socket_set_blocking",
      "stream_get_meta_data", "stream_get_line", "stream_wrapper_register",
      "stream_register_wrapper", "stream_wrapper_unregister",
      "stream_wrapper_restore", "stream_get_wrappers", "stream_get_transports",
      "get_headers", "stream_set_timeout", "socket_set_timeout", "socket_get_status",
      "realpath", "fsockopen", "pfsockopen", "pack", "unpack", "get_browser",
      "crypt", "opendir", "closedir", "chdir", "getcwd", "rewinddir", "readdir",
      "dir", "scandir", "glob", "fileatime", "filectime", "filegroup", "fileinode",
      "filemtime", "fileowner", "fileperms", "filesize", "filetype", "file_exists",
      "is_writable", "is_writeable", "is_readable", "is_executable", "is_file",
      "is_dir", "is_link", "stat", "lstat", "chown", "chgrp", "chmod", "touch",
      "clearstatcache", "disk_total_space", "disk_free_space", "diskfreespace",
      "mail", "ezmlm_hash", "openlog", "syslog", "closelog",
      "define_syslog_variables", "lcg_value", "metaphone", "ob_start", "ob_flush",
      "ob_clean", "ob_end_flush", "ob_end_clean", "ob_get_flush", "ob_get_clean",
      "ob_get_length", "ob_get_level", "ob_get_status", "ob_get_contents",
      "ob_implicit_flush", "ob_list_handlers", "ksort", "krsort", "natsort",
      "natcasesort", "asort", "arsort", "sort", "rsort", "usort", "uasort", "uksort",
      "shuffle", "array_walk", "array_walk_recursive", "count", "end", "prev",
      "next", "reset", "current", "key", "min", "max", "in_array", "array_search",
      "extract", "compact", "array_fill", "array_fill_keys", "range",
      "array_multisort", "array_push", "array_pop", "array_shift", "array_unshift",
      "array_splice", "array_slice", "array_merge", "array_merge_recursive",
      "array_keys", "array_values", "array_count_values", "array_reverse",
      "array_reduce", "array_pad", "array_flip", "array_change_key_case",
      "array_rand", "array_unique", "array_intersect", "array_intersect_key",
      "array_intersect_ukey", "array_uintersect", "array_intersect_assoc",
      "array_uintersect_assoc", "array_intersect_uassoc", "array_uintersect_uassoc",
      "array_diff", "array_diff_key", "array_diff_ukey", "array_udiff",
      "array_diff_assoc", "array_udiff_assoc", "array_diff_uassoc",
      "array_udiff_uassoc", "array_sum", "array_product", "array_filter",
      "array_map", "array_chunk", "array_combine", "array_key_exists", "pos",
      "sizeof", "key_exists", "assert", "assert_options", "version_compare",
      "str_rot13", "stream_get_filters", "stream_filter_register",
      "stream_bucket_make_writeable", "stream_bucket_prepend",
      "stream_bucket_append", "stream_bucket_new", "output_add_rewrite_var",
      "output_reset_rewrite_vars", "sys_get_temp_dir", "token_get_all", "token_name",
      "readgzfile", "gzrewind", "gzclose", "gzeof", "gzgetc", "gzgets", "gzgetss",
      "gzread", "gzopen", "gzpassthru", "gzseek", "gztell", "gzwrite", "gzputs",
      "gzfile", "gzcompress", "gzuncompress", "gzdeflate", "gzinflate", "gzencode",
      "ob_gzhandler", "zlib_get_coding_type", "libxml_set_streams_context",
      "libxml_use_internal_errors", "libxml_get_last_error", "libxml_clear_errors",
      "libxml_get_errors", "dom_import_simplexml", "simplexml_load_file",
      "simplexml_load_string", "simplexml_import_dom", "wddx_serialize_value",
      "wddx_serialize_vars", "wddx_packet_start", "wddx_packet_end", "wddx_add_vars",
      "wddx_deserialize", "xml_parser_create", "xml_parser_create_ns",
      "xml_set_object", "xml_set_element_handler", "xml_set_character_data_handler",
      "xml_set_processing_instruction_handler", "xml_set_default_handler",
      "xml_set_unparsed_entity_decl_handler", "xml_set_notation_decl_handler",
      "xml_set_external_entity_ref_handler", "xml_set_start_namespace_decl_handler",
      "xml_set_end_namespace_decl_handler", "xml_parse", "xml_parse_into_struct",
      "xml_get_error_code", "xml_error_string", "xml_get_current_line_number",
      "xml_get_current_column_number", "xml_get_current_byte_index",
      "xml_parser_free", "xml_parser_set_option", "xml_parser_get_option",
      "utf8_encode", "utf8_decode", "xmlwriter_open_uri", "xmlwriter_open_memory",
      "xmlwriter_set_indent", "xmlwriter_set_indent_string",
      "xmlwriter_start_comment", "xmlwriter_end_comment",
      "xmlwriter_start_attribute", "xmlwriter_end_attribute",
      "xmlwriter_write_attribute", "xmlwriter_start_attribute_ns",
      "xmlwriter_write_attribute_ns", "xmlwriter_start_element",
      "xmlwriter_end_element", "xmlwriter_full_end_element",
      "xmlwriter_start_element_ns", "xmlwriter_write_element",
      "xmlwriter_write_element_ns", "xmlwriter_start_pi", "xmlwriter_end_pi",
      "xmlwriter_write_pi", "xmlwriter_start_cdata", "xmlwriter_end_cdata",
      "xmlwriter_write_cdata", "xmlwriter_text", "xmlwriter_write_raw",
      "xmlwriter_start_document", "xmlwriter_end_document",
      "xmlwriter_write_comment", "xmlwriter_start_dtd", "xmlwriter_end_dtd",
      "xmlwriter_write_dtd", "xmlwriter_start_dtd_element",
      "xmlwriter_end_dtd_element", "xmlwriter_write_dtd_element",
      "xmlwriter_start_dtd_attlist", "xmlwriter_end_dtd_attlist",
      "xmlwriter_write_dtd_attlist", "xmlwriter_start_dtd_entity",
      "xmlwriter_end_dtd_entity", "xmlwriter_write_dtd_entity",
      "xmlwriter_output_memory", "xmlwriter_flush", "gd_info", "imagearc",
      "imageellipse", "imagechar", "imagecharup", "imagecolorat",
      "imagecolorallocate", "imagepalettecopy", "imagecreatefromstring",
      "imagecolorclosest", "imagecolordeallocate", "imagecolorresolve",
      "imagecolorexact", "imagecolorset", "imagecolortransparent",
      "imagecolorstotal", "imagecolorsforindex", "imagecopy", "imagecopymerge",
      "imagecopymergegray", "imagecopyresized", "imagecreate",
      "imagecreatetruecolor", "imageistruecolor", "imagetruecolortopalette",
      "imagesetthickness", "imagefilledarc", "imagefilledellipse",
      "imagealphablending", "imagesavealpha", "imagecolorallocatealpha",
      "imagecolorresolvealpha", "imagecolorclosestalpha", "imagecolorexactalpha",
      "imagecopyresampled", "imagegrabwindow", "imagegrabscreen", "imagerotate",
      "imageantialias", "imagesettile", "imagesetbrush", "imagesetstyle",
      "imagecreatefrompng", "imagecreatefromgif", "imagecreatefromjpeg",
      "imagecreatefromwbmp", "imagecreatefromxbm", "imagecreatefromgd",
      "imagecreatefromgd2", "imagecreatefromgd2part", "imagepng", "imagegif",
      "imagejpeg", "imagewbmp", "imagegd", "imagegd2", "imagedestroy",
      "imagegammacorrect", "imagefill", "imagefilledpolygon", "imagefilledrectangle",
      "imagefilltoborder", "imagefontwidth", "imagefontheight", "imageinterlace",
      "imageline", "imageloadfont", "imagepolygon", "imagerectangle",
      "imagesetpixel", "imagestring", "imagestringup", "imagesx", "imagesy",
      "imagedashedline", "imagettfbbox", "imagettftext", "imageftbbox",
      "imagefttext", "imagepsloadfont", "imagepsfreefont", "imagepsencodefont",
      "imagepsextendfont", "imagepsslantfont", "imagepstext", "imagepsbbox",
      "imagetypes", "jpeg2wbmp", "png2wbmp", "image2wbmp", "imagelayereffect",
      "imagecolormatch", "imagexbm", "imagefilter", "imageconvolution",
      "mb_convert_case", "mb_strtoupper", "mb_strtolower", "mb_language",
      "mb_internal_encoding", "mb_http_input", "mb_http_output", "mb_detect_order",
      "mb_substitute_character", "mb_parse_str", "mb_output_handler",
      "mb_preferred_mime_name", "mb_strlen", "mb_strpos", "mb_strrpos", "mb_stripos",
      "mb_strripos", "mb_strstr", "mb_strrchr", "mb_stristr", "mb_strrichr",
      "mb_substr_count", "mb_substr", "mb_strcut", "mb_strwidth", "mb_strimwidth",
      "mb_convert_encoding", "mb_detect_encoding", "mb_list_encodings",
      "mb_convert_kana", "mb_encode_mimeheader", "mb_decode_mimeheader",
      "mb_convert_variables", "mb_encode_numericentity", "mb_decode_numericentity",
      "mb_send_mail", "mb_get_info", "mb_check_encoding", "mb_regex_encoding",
      "mb_regex_set_options", "mb_ereg", "mb_eregi", "mb_ereg_replace",
      "mb_eregi_replace", "mb_split", "mb_ereg_match", "mb_ereg_search",
      "mb_ereg_search_pos", "mb_ereg_search_regs", "mb_ereg_search_init",
      "mb_ereg_search_getregs", "mb_ereg_search_getpos", "mb_ereg_search_setpos",
      "mbregex_encoding", "mbereg", "mberegi", "mbereg_replace", "mberegi_replace",
      "mbsplit", "mbereg_match", "mbereg_search", "mbereg_search_pos",
      "mbereg_search_regs", "mbereg_search_init", "mbereg_search_getregs",
      "mbereg_search_getpos", "mbereg_search_setpos", "mysql_connect",
      "mysql_pconnect", "mysql_close", "mysql_select_db", "mysql_query",
      "mysql_unbuffered_query", "mysql_db_query", "mysql_list_dbs",
      "mysql_list_tables", "mysql_list_fields", "mysql_list_processes",
      "mysql_error", "mysql_errno", "mysql_affected_rows", "mysql_insert_id",
      "mysql_result", "mysql_num_rows", "mysql_num_fields", "mysql_fetch_row",
      "mysql_fetch_array", "mysql_fetch_assoc", "mysql_fetch_object",
      "mysql_data_seek", "mysql_fetch_lengths", "mysql_fetch_field",
      "mysql_field_seek", "mysql_free_result", "mysql_field_name",
      "mysql_field_table", "mysql_field_len", "mysql_field_type",
      "mysql_field_flags", "mysql_escape_string", "mysql_real_escape_string",
      "mysql_stat", "mysql_thread_id", "mysql_client_encoding", "mysql_ping",
      "mysql_get_client_info", "mysql_get_host_info", "mysql_get_proto_info",
      "mysql_get_server_info", "mysql_info", "mysql_set_charset", "mysql",
      "mysql_fieldname", "mysql_fieldtable", "mysql_fieldlen", "mysql_fieldtype",
      "mysql_fieldflags", "mysql_selectdb", "mysql_freeresult", "mysql_numfields",
      "mysql_numrows", "mysql_listdbs", "mysql_listtables", "mysql_listfields",
      "mysql_db_name", "mysql_dbname", "mysql_tablename", "mysql_table_name",
      "mysqli_affected_rows", "mysqli_autocommit", "mysqli_change_user",
      "mysqli_character_set_name", "mysqli_close", "mysqli_commit", "mysqli_connect",
      "mysqli_connect_errno", "mysqli_connect_error", "mysqli_data_seek",
      "mysqli_debug", "mysqli_disable_reads_from_master", "mysqli_disable_rpl_parse",
      "mysqli_dump_debug_info", "mysqli_enable_reads_from_master",
      "mysqli_enable_rpl_parse", "mysqli_embedded_server_end",
      "mysqli_embedded_server_start", "mysqli_errno", "mysqli_error",
      "mysqli_stmt_execute", "mysqli_execute", "mysqli_fetch_field",
      "mysqli_fetch_fields", "mysqli_fetch_field_direct", "mysqli_fetch_lengths",
      "mysqli_fetch_array", "mysqli_fetch_assoc", "mysqli_fetch_object",
      "mysqli_fetch_row", "mysqli_field_count", "mysqli_field_seek",
      "mysqli_field_tell", "mysqli_free_result", "mysqli_get_charset",
      "mysqli_get_client_info", "mysqli_get_client_version", "mysqli_get_host_info",
      "mysqli_get_proto_info", "mysqli_get_server_info", "mysqli_get_server_version",
      "mysqli_get_warnings", "mysqli_init", "mysqli_info", "mysqli_insert_id",
      "mysqli_kill", "mysqli_set_local_infile_default",
      "mysqli_set_local_infile_handler", "mysqli_master_query",
      "mysqli_more_results", "mysqli_multi_query", "mysqli_next_result",
      "mysqli_num_fields", "mysqli_num_rows", "mysqli_options", "mysqli_ping",
      "mysqli_prepare", "mysqli_report", "mysqli_query", "mysqli_real_connect",
      "mysqli_real_escape_string", "mysqli_real_query", "mysqli_rollback",
      "mysqli_rpl_parse_enabled", "mysqli_rpl_probe", "mysqli_rpl_query_type",
      "mysqli_select_db", "mysqli_set_charset", "mysqli_stmt_attr_get",
      "mysqli_stmt_attr_set", "mysqli_stmt_field_count", "mysqli_stmt_init",
      "mysqli_stmt_prepare", "mysqli_stmt_result_metadata",
      "mysqli_stmt_send_long_data", "mysqli_stmt_bind_param",
      "mysqli_stmt_bind_result", "mysqli_stmt_fetch", "mysqli_stmt_free_result",
      "mysqli_stmt_get_warnings", "mysqli_stmt_insert_id", "mysqli_stmt_reset",
      "mysqli_stmt_param_count", "mysqli_send_query", "mysqli_slave_query",
      "mysqli_sqlstate", "mysqli_ssl_set", "mysqli_stat",
      "mysqli_stmt_affected_rows", "mysqli_stmt_close", "mysqli_stmt_data_seek",
      "mysqli_stmt_errno", "mysqli_stmt_error", "mysqli_stmt_num_rows",
      "mysqli_stmt_sqlstate", "mysqli_store_result", "mysqli_stmt_store_result",
      "mysqli_thread_id", "mysqli_thread_safe", "mysqli_use_result",
      "mysqli_warning_count", "mysqli_bind_param", "mysqli_bind_result",
      "mysqli_client_encoding", "mysqli_escape_string", "mysqli_fetch",
      "mysqli_param_count", "mysqli_get_metadata", "mysqli_send_long_data",
      "mysqli_set_opt", "pdo_drivers", "socket_select", "socket_create",
      "socket_create_listen", "socket_accept", "socket_set_nonblock",
      "socket_set_block", "socket_listen", "socket_close", "socket_write",
      "socket_read", "socket_getsockname", "socket_getpeername", "socket_connect",
      "socket_strerror", "socket_bind", "socket_recv", "socket_send",
      "socket_recvfrom", "socket_sendto", "socket_get_option", "socket_set_option",
      "socket_shutdown", "socket_last_error", "socket_clear_error", "socket_getopt",
      "socket_setopt", "eaccelerator_put", "eaccelerator_get", "eaccelerator_rm",
      "eaccelerator_gc", "eaccelerator_lock", "eaccelerator_unlock",
      "eaccelerator_caching", "eaccelerator_optimizer", "eaccelerator_clear",
      "eaccelerator_clean", "eaccelerator_info", "eaccelerator_purge",
      "eaccelerator_cached_scripts", "eaccelerator_removed_scripts",
      "eaccelerator_list_keys", "eaccelerator_encode", "eaccelerator_load",
      "_eaccelerator_loader_file", "_eaccelerator_loader_line",
      "eaccelerator_set_session_handlers", "_eaccelerator_output_handler",
      "eaccelerator_cache_page", "eaccelerator_rm_page", "eaccelerator_cache_output",
      "eaccelerator_cache_result", "xdebug_get_stack_depth",
      "xdebug_get_function_stack", "xdebug_print_function_stack",
      "xdebug_get_declared_vars", "xdebug_call_class", "xdebug_call_function",
      "xdebug_call_file", "xdebug_call_line", "xdebug_var_dump", "xdebug_debug_zval",
      "xdebug_debug_zval_stdout", "xdebug_enable", "xdebug_disable",
      "xdebug_is_enabled", "xdebug_break", "xdebug_start_trace", "xdebug_stop_trace",
      "xdebug_get_tracefile_name", "xdebug_get_profiler_filename",
      "xdebug_dump_aggr_profiling_data", "xdebug_clear_aggr_profiling_data",
      "xdebug_memory_usage", "xdebug_peak_memory_usage", "xdebug_time_index",
      "xdebug_start_error_collection", "xdebug_stop_error_collection",
      "xdebug_get_collected_errors", "xdebug_start_code_coverage",
      "xdebug_stop_code_coverage", "xdebug_get_code_coverage",
      "xdebug_get_function_count", "xdebug_dump_superglobals",
      "_" // alias for gettext()
    ].forEach(function(element, index, array) {
      result[element] = token("t_string", "php-predefined-function");
    });

    // output of get_defined_constants(). Differs significantly from http://php.net/manual/en/reserved.constants.php
    [ "E_ERROR", "E_RECOVERABLE_ERROR", "E_WARNING", "E_PARSE", "E_NOTICE",
      "E_STRICT", "E_CORE_ERROR", "E_CORE_WARNING", "E_COMPILE_ERROR",
      "E_COMPILE_WARNING", "E_USER_ERROR", "E_USER_WARNING", "E_USER_NOTICE",
      "E_ALL", "TRUE", "FALSE", "NULL", "ZEND_THREAD_SAFE", "PHP_VERSION", "PHP_OS",
      "PHP_SAPI", "DEFAULT_INCLUDE_PATH", "PEAR_INSTALL_DIR", "PEAR_EXTENSION_DIR",
      "PHP_EXTENSION_DIR", "PHP_PREFIX", "PHP_BINDIR", "PHP_LIBDIR", "PHP_DATADIR",
      "PHP_SYSCONFDIR", "PHP_LOCALSTATEDIR", "PHP_CONFIG_FILE_PATH",
      "PHP_CONFIG_FILE_SCAN_DIR", "PHP_SHLIB_SUFFIX", "PHP_EOL", "PHP_EOL",
      "PHP_INT_MAX", "PHP_INT_SIZE", "PHP_OUTPUT_HANDLER_START",
      "PHP_OUTPUT_HANDLER_CONT", "PHP_OUTPUT_HANDLER_END", "UPLOAD_ERR_OK",
      "UPLOAD_ERR_INI_SIZE", "UPLOAD_ERR_FORM_SIZE", "UPLOAD_ERR_PARTIAL",
      "UPLOAD_ERR_NO_FILE", "UPLOAD_ERR_NO_TMP_DIR", "UPLOAD_ERR_CANT_WRITE",
      "UPLOAD_ERR_EXTENSION", "CAL_GREGORIAN", "CAL_JULIAN", "CAL_JEWISH",
      "CAL_FRENCH", "CAL_NUM_CALS", "CAL_DOW_DAYNO", "CAL_DOW_SHORT", "CAL_DOW_LONG",
      "CAL_MONTH_GREGORIAN_SHORT", "CAL_MONTH_GREGORIAN_LONG",
      "CAL_MONTH_JULIAN_SHORT", "CAL_MONTH_JULIAN_LONG", "CAL_MONTH_JEWISH",
      "CAL_MONTH_FRENCH", "CAL_EASTER_DEFAULT", "CAL_EASTER_ROMAN",
      "CAL_EASTER_ALWAYS_GREGORIAN", "CAL_EASTER_ALWAYS_JULIAN",
      "CAL_JEWISH_ADD_ALAFIM_GERESH", "CAL_JEWISH_ADD_ALAFIM",
      "CAL_JEWISH_ADD_GERESHAYIM", "CLSCTX_INPROC_SERVER", "CLSCTX_INPROC_HANDLER",
      "CLSCTX_LOCAL_SERVER", "CLSCTX_REMOTE_SERVER", "CLSCTX_SERVER", "CLSCTX_ALL",
      "VT_NULL", "VT_EMPTY", "VT_UI1", "VT_I1", "VT_UI2", "VT_I2", "VT_UI4", "VT_I4",
      "VT_R4", "VT_R8", "VT_BOOL", "VT_ERROR", "VT_CY", "VT_DATE", "VT_BSTR",
      "VT_DECIMAL", "VT_UNKNOWN", "VT_DISPATCH", "VT_VARIANT", "VT_INT", "VT_UINT",
      "VT_ARRAY", "VT_BYREF", "CP_ACP", "CP_MACCP", "CP_OEMCP", "CP_UTF7", "CP_UTF8",
      "CP_SYMBOL", "CP_THREAD_ACP", "VARCMP_LT", "VARCMP_EQ", "VARCMP_GT",
      "VARCMP_NULL", "NORM_IGNORECASE", "NORM_IGNORENONSPACE", "NORM_IGNORESYMBOLS",
      "NORM_IGNOREWIDTH", "NORM_IGNOREKANATYPE", "DISP_E_DIVBYZERO",
      "DISP_E_OVERFLOW", "DISP_E_BADINDEX", "MK_E_UNAVAILABLE", "INPUT_POST",
      "INPUT_GET", "INPUT_COOKIE", "INPUT_ENV", "INPUT_SERVER", "INPUT_SESSION",
      "INPUT_REQUEST", "FILTER_FLAG_NONE", "FILTER_REQUIRE_SCALAR",
      "FILTER_REQUIRE_ARRAY", "FILTER_FORCE_ARRAY", "FILTER_NULL_ON_FAILURE",
      "FILTER_VALIDATE_INT", "FILTER_VALIDATE_BOOLEAN", "FILTER_VALIDATE_FLOAT",
      "FILTER_VALIDATE_REGEXP", "FILTER_VALIDATE_URL", "FILTER_VALIDATE_EMAIL",
      "FILTER_VALIDATE_IP", "FILTER_DEFAULT", "FILTER_UNSAFE_RAW",
      "FILTER_SANITIZE_STRING", "FILTER_SANITIZE_STRIPPED",
      "FILTER_SANITIZE_ENCODED", "FILTER_SANITIZE_SPECIAL_CHARS",
      "FILTER_SANITIZE_EMAIL", "FILTER_SANITIZE_URL", "FILTER_SANITIZE_NUMBER_INT",
      "FILTER_SANITIZE_NUMBER_FLOAT", "FILTER_SANITIZE_MAGIC_QUOTES",
      "FILTER_CALLBACK", "FILTER_FLAG_ALLOW_OCTAL", "FILTER_FLAG_ALLOW_HEX",
      "FILTER_FLAG_STRIP_LOW", "FILTER_FLAG_STRIP_HIGH", "FILTER_FLAG_ENCODE_LOW",
      "FILTER_FLAG_ENCODE_HIGH", "FILTER_FLAG_ENCODE_AMP",
      "FILTER_FLAG_NO_ENCODE_QUOTES", "FILTER_FLAG_EMPTY_STRING_NULL",
      "FILTER_FLAG_ALLOW_FRACTION", "FILTER_FLAG_ALLOW_THOUSAND",
      "FILTER_FLAG_ALLOW_SCIENTIFIC", "FILTER_FLAG_SCHEME_REQUIRED",
      "FILTER_FLAG_HOST_REQUIRED", "FILTER_FLAG_PATH_REQUIRED",
      "FILTER_FLAG_QUERY_REQUIRED", "FILTER_FLAG_IPV4", "FILTER_FLAG_IPV6",
      "FILTER_FLAG_NO_RES_RANGE", "FILTER_FLAG_NO_PRIV_RANGE", "FTP_ASCII",
      "FTP_TEXT", "FTP_BINARY", "FTP_IMAGE", "FTP_AUTORESUME", "FTP_TIMEOUT_SEC",
      "FTP_AUTOSEEK", "FTP_FAILED", "FTP_FINISHED", "FTP_MOREDATA", "HASH_HMAC",
      "ICONV_IMPL", "ICONV_VERSION", "ICONV_MIME_DECODE_STRICT",
      "ICONV_MIME_DECODE_CONTINUE_ON_ERROR", "ODBC_TYPE", "ODBC_BINMODE_PASSTHRU",
      "ODBC_BINMODE_RETURN", "ODBC_BINMODE_CONVERT", "SQL_ODBC_CURSORS",
      "SQL_CUR_USE_DRIVER", "SQL_CUR_USE_IF_NEEDED", "SQL_CUR_USE_ODBC",
      "SQL_CONCURRENCY", "SQL_CONCUR_READ_ONLY", "SQL_CONCUR_LOCK",
      "SQL_CONCUR_ROWVER", "SQL_CONCUR_VALUES", "SQL_CURSOR_TYPE",
      "SQL_CURSOR_FORWARD_ONLY", "SQL_CURSOR_KEYSET_DRIVEN", "SQL_CURSOR_DYNAMIC",
      "SQL_CURSOR_STATIC", "SQL_KEYSET_SIZE", "SQL_FETCH_FIRST", "SQL_FETCH_NEXT",
      "SQL_CHAR", "SQL_VARCHAR", "SQL_LONGVARCHAR", "SQL_DECIMAL", "SQL_NUMERIC",
      "SQL_BIT", "SQL_TINYINT", "SQL_SMALLINT", "SQL_INTEGER", "SQL_BIGINT",
      "SQL_REAL", "SQL_FLOAT", "SQL_DOUBLE", "SQL_BINARY", "SQL_VARBINARY",
      "SQL_LONGVARBINARY", "SQL_DATE", "SQL_TIME", "SQL_TIMESTAMP",
      "PREG_PATTERN_ORDER", "PREG_SET_ORDER", "PREG_OFFSET_CAPTURE",
      "PREG_SPLIT_NO_EMPTY", "PREG_SPLIT_DELIM_CAPTURE", "PREG_SPLIT_OFFSET_CAPTURE",
      "PREG_GREP_INVERT", "PREG_NO_ERROR", "PREG_INTERNAL_ERROR",
      "PREG_BACKTRACK_LIMIT_ERROR", "PREG_RECURSION_LIMIT_ERROR",
      "PREG_BAD_UTF8_ERROR", "DATE_ATOM", "DATE_COOKIE", "DATE_ISO8601",
      "DATE_RFC822", "DATE_RFC850", "DATE_RFC1036", "DATE_RFC1123", "DATE_RFC2822",
      "DATE_RFC3339", "DATE_RSS", "DATE_W3C", "SUNFUNCS_RET_TIMESTAMP",
      "SUNFUNCS_RET_STRING", "SUNFUNCS_RET_DOUBLE", "LIBXML_VERSION",
      "LIBXML_DOTTED_VERSION", "LIBXML_NOENT", "LIBXML_DTDLOAD", "LIBXML_DTDATTR",
      "LIBXML_DTDVALID", "LIBXML_NOERROR", "LIBXML_NOWARNING", "LIBXML_NOBLANKS",
      "LIBXML_XINCLUDE", "LIBXML_NSCLEAN", "LIBXML_NOCDATA", "LIBXML_NONET",
      "LIBXML_COMPACT", "LIBXML_NOXMLDECL", "LIBXML_NOEMPTYTAG", "LIBXML_ERR_NONE",
      "LIBXML_ERR_WARNING", "LIBXML_ERR_ERROR", "LIBXML_ERR_FATAL",
      "CONNECTION_ABORTED", "CONNECTION_NORMAL", "CONNECTION_TIMEOUT", "INI_USER",
      "INI_PERDIR", "INI_SYSTEM", "INI_ALL", "PHP_URL_SCHEME", "PHP_URL_HOST",
      "PHP_URL_PORT", "PHP_URL_USER", "PHP_URL_PASS", "PHP_URL_PATH",
      "PHP_URL_QUERY", "PHP_URL_FRAGMENT", "M_E", "M_LOG2E", "M_LOG10E", "M_LN2",
      "M_LN10", "M_PI", "M_PI_2", "M_PI_4", "M_1_PI", "M_2_PI", "M_SQRTPI",
      "M_2_SQRTPI", "M_LNPI", "M_EULER", "M_SQRT2", "M_SQRT1_2", "M_SQRT3", "INF",
      "NAN", "INFO_GENERAL", "INFO_CREDITS", "INFO_CONFIGURATION", "INFO_MODULES",
      "INFO_ENVIRONMENT", "INFO_VARIABLES", "INFO_LICENSE", "INFO_ALL",
      "CREDITS_GROUP", "CREDITS_GENERAL", "CREDITS_SAPI", "CREDITS_MODULES",
      "CREDITS_DOCS", "CREDITS_FULLPAGE", "CREDITS_QA", "CREDITS_ALL",
      "HTML_SPECIALCHARS", "HTML_ENTITIES", "ENT_COMPAT", "ENT_QUOTES",
      "ENT_NOQUOTES", "STR_PAD_LEFT", "STR_PAD_RIGHT", "STR_PAD_BOTH",
      "PATHINFO_DIRNAME", "PATHINFO_BASENAME", "PATHINFO_EXTENSION",
      "PATHINFO_FILENAME", "CHAR_MAX", "LC_CTYPE", "LC_NUMERIC", "LC_TIME",
      "LC_COLLATE", "LC_MONETARY", "LC_ALL", "SEEK_SET", "SEEK_CUR", "SEEK_END",
      "LOCK_SH", "LOCK_EX", "LOCK_UN", "LOCK_NB", "STREAM_NOTIFY_CONNECT",
      "STREAM_NOTIFY_AUTH_REQUIRED", "STREAM_NOTIFY_AUTH_RESULT",
      "STREAM_NOTIFY_MIME_TYPE_IS", "STREAM_NOTIFY_FILE_SIZE_IS",
      "STREAM_NOTIFY_REDIRECTED", "STREAM_NOTIFY_PROGRESS", "STREAM_NOTIFY_FAILURE",
      "STREAM_NOTIFY_COMPLETED", "STREAM_NOTIFY_RESOLVE",
      "STREAM_NOTIFY_SEVERITY_INFO", "STREAM_NOTIFY_SEVERITY_WARN",
      "STREAM_NOTIFY_SEVERITY_ERR", "STREAM_FILTER_READ", "STREAM_FILTER_WRITE",
      "STREAM_FILTER_ALL", "STREAM_CLIENT_PERSISTENT", "STREAM_CLIENT_ASYNC_CONNECT",
      "STREAM_CLIENT_CONNECT", "STREAM_CRYPTO_METHOD_SSLv2_CLIENT",
      "STREAM_CRYPTO_METHOD_SSLv3_CLIENT", "STREAM_CRYPTO_METHOD_SSLv23_CLIENT",
      "STREAM_CRYPTO_METHOD_TLS_CLIENT", "STREAM_CRYPTO_METHOD_SSLv2_SERVER",
      "STREAM_CRYPTO_METHOD_SSLv3_SERVER", "STREAM_CRYPTO_METHOD_SSLv23_SERVER",
      "STREAM_CRYPTO_METHOD_TLS_SERVER", "STREAM_SHUT_RD", "STREAM_SHUT_WR",
      "STREAM_SHUT_RDWR", "STREAM_PF_INET", "STREAM_PF_INET6", "STREAM_PF_UNIX",
      "STREAM_IPPROTO_IP", "STREAM_IPPROTO_TCP", "STREAM_IPPROTO_UDP",
      "STREAM_IPPROTO_ICMP", "STREAM_IPPROTO_RAW", "STREAM_SOCK_STREAM",
      "STREAM_SOCK_DGRAM", "STREAM_SOCK_RAW", "STREAM_SOCK_SEQPACKET",
      "STREAM_SOCK_RDM", "STREAM_PEEK", "STREAM_OOB", "STREAM_SERVER_BIND",
      "STREAM_SERVER_LISTEN", "FILE_USE_INCLUDE_PATH", "FILE_IGNORE_NEW_LINES",
      "FILE_SKIP_EMPTY_LINES", "FILE_APPEND", "FILE_NO_DEFAULT_CONTEXT",
      "PSFS_PASS_ON", "PSFS_FEED_ME", "PSFS_ERR_FATAL", "PSFS_FLAG_NORMAL",
      "PSFS_FLAG_FLUSH_INC", "PSFS_FLAG_FLUSH_CLOSE", "CRYPT_SALT_LENGTH",
      "CRYPT_STD_DES", "CRYPT_EXT_DES", "CRYPT_MD5", "CRYPT_BLOWFISH",
      "DIRECTORY_SEPARATOR", "PATH_SEPARATOR", "GLOB_BRACE", "GLOB_MARK",
      "GLOB_NOSORT", "GLOB_NOCHECK", "GLOB_NOESCAPE", "GLOB_ERR", "GLOB_ONLYDIR",
      "LOG_EMERG", "LOG_ALERT", "LOG_CRIT", "LOG_ERR", "LOG_WARNING", "LOG_NOTICE",
      "LOG_INFO", "LOG_DEBUG", "LOG_KERN", "LOG_USER", "LOG_MAIL", "LOG_DAEMON",
      "LOG_AUTH", "LOG_SYSLOG", "LOG_LPR", "LOG_NEWS", "LOG_UUCP", "LOG_CRON",
      "LOG_AUTHPRIV", "LOG_PID", "LOG_CONS", "LOG_ODELAY", "LOG_NDELAY",
      "LOG_NOWAIT", "LOG_PERROR", "EXTR_OVERWRITE", "EXTR_SKIP", "EXTR_PREFIX_SAME",
      "EXTR_PREFIX_ALL", "EXTR_PREFIX_INVALID", "EXTR_PREFIX_IF_EXISTS",
      "EXTR_IF_EXISTS", "EXTR_REFS", "SORT_ASC", "SORT_DESC", "SORT_REGULAR",
      "SORT_NUMERIC", "SORT_STRING", "SORT_LOCALE_STRING", "CASE_LOWER",
      "CASE_UPPER", "COUNT_NORMAL", "COUNT_RECURSIVE", "ASSERT_ACTIVE",
      "ASSERT_CALLBACK", "ASSERT_BAIL", "ASSERT_WARNING", "ASSERT_QUIET_EVAL",
      "STREAM_USE_PATH", "STREAM_IGNORE_URL", "STREAM_ENFORCE_SAFE_MODE",
      "STREAM_REPORT_ERRORS", "STREAM_MUST_SEEK", "STREAM_URL_STAT_LINK",
      "STREAM_URL_STAT_QUIET", "STREAM_MKDIR_RECURSIVE", "IMAGETYPE_GIF",
      "IMAGETYPE_JPEG", "IMAGETYPE_PNG", "IMAGETYPE_SWF", "IMAGETYPE_PSD",
      "IMAGETYPE_BMP", "IMAGETYPE_TIFF_II", "IMAGETYPE_TIFF_MM", "IMAGETYPE_JPC",
      "IMAGETYPE_JP2", "IMAGETYPE_JPX", "IMAGETYPE_JB2", "IMAGETYPE_SWC",
      "IMAGETYPE_IFF", "IMAGETYPE_WBMP", "IMAGETYPE_JPEG2000", "IMAGETYPE_XBM",
      "T_INCLUDE", "T_INCLUDE_ONCE", "T_EVAL", "T_REQUIRE", "T_REQUIRE_ONCE",
      "T_LOGICAL_OR", "T_LOGICAL_XOR", "T_LOGICAL_AND", "T_PRINT", "T_PLUS_EQUAL",
      "T_MINUS_EQUAL", "T_MUL_EQUAL", "T_DIV_EQUAL", "T_CONCAT_EQUAL", "T_MOD_EQUAL",
      "T_AND_EQUAL", "T_OR_EQUAL", "T_XOR_EQUAL", "T_SL_EQUAL", "T_SR_EQUAL",
      "T_BOOLEAN_OR", "T_BOOLEAN_AND", "T_IS_EQUAL", "T_IS_NOT_EQUAL",
      "T_IS_IDENTICAL", "T_IS_NOT_IDENTICAL", "T_IS_SMALLER_OR_EQUAL",
      "T_IS_GREATER_OR_EQUAL", "T_SL", "T_SR", "T_INC", "T_DEC", "T_INT_CAST",
      "T_DOUBLE_CAST", "T_STRING_CAST", "T_ARRAY_CAST", "T_OBJECT_CAST",
      "T_BOOL_CAST", "T_UNSET_CAST", "T_NEW", "T_EXIT", "T_IF", "T_ELSEIF", "T_ELSE",
      "T_ENDIF", "T_LNUMBER", "T_DNUMBER", "T_STRING", "T_STRING_VARNAME",
      "T_VARIABLE", "T_NUM_STRING", "T_INLINE_HTML", "T_CHARACTER",
      "T_BAD_CHARACTER", "T_ENCAPSED_AND_WHITESPACE", "T_CONSTANT_ENCAPSED_STRING",
      "T_ECHO", "T_DO", "T_WHILE", "T_ENDWHILE", "T_FOR", "T_ENDFOR", "T_FOREACH",
      "T_ENDFOREACH", "T_DECLARE", "T_ENDDECLARE", "T_AS", "T_SWITCH", "T_ENDSWITCH",
      "T_CASE", "T_DEFAULT", "T_BREAK", "T_CONTINUE", "T_FUNCTION", "T_CONST",
      "T_RETURN", "T_USE", "T_GLOBAL", "T_STATIC", "T_VAR", "T_UNSET", "T_ISSET",
      "T_EMPTY", "T_CLASS", "T_EXTENDS", "T_INTERFACE", "T_IMPLEMENTS",
      "T_OBJECT_OPERATOR", "T_DOUBLE_ARROW", "T_LIST", "T_ARRAY", "T_CLASS_C",
      "T_FUNC_C", "T_METHOD_C", "T_LINE", "T_FILE", "T_COMMENT", "T_DOC_COMMENT",
      "T_OPEN_TAG", "T_OPEN_TAG_WITH_ECHO", "T_CLOSE_TAG", "T_WHITESPACE",
      "T_START_HEREDOC", "T_END_HEREDOC", "T_DOLLAR_OPEN_CURLY_BRACES",
      "T_CURLY_OPEN", "T_PAAMAYIM_NEKUDOTAYIM", "T_DOUBLE_COLON", "T_ABSTRACT",
      "T_CATCH", "T_FINAL", "T_INSTANCEOF", "T_PRIVATE", "T_PROTECTED", "T_PUBLIC",
      "T_THROW", "T_TRY", "T_CLONE", "T_HALT_COMPILER", "FORCE_GZIP",
      "FORCE_DEFLATE", "XML_ELEMENT_NODE", "XML_ATTRIBUTE_NODE", "XML_TEXT_NODE",
      "XML_CDATA_SECTION_NODE", "XML_ENTITY_REF_NODE", "XML_ENTITY_NODE",
      "XML_PI_NODE", "XML_COMMENT_NODE", "XML_DOCUMENT_NODE",
      "XML_DOCUMENT_TYPE_NODE", "XML_DOCUMENT_FRAG_NODE", "XML_NOTATION_NODE",
      "XML_HTML_DOCUMENT_NODE", "XML_DTD_NODE", "XML_ELEMENT_DECL_NODE",
      "XML_ATTRIBUTE_DECL_NODE", "XML_ENTITY_DECL_NODE", "XML_NAMESPACE_DECL_NODE",
      "XML_LOCAL_NAMESPACE", "XML_ATTRIBUTE_CDATA", "XML_ATTRIBUTE_ID",
      "XML_ATTRIBUTE_IDREF", "XML_ATTRIBUTE_IDREFS", "XML_ATTRIBUTE_ENTITY",
      "XML_ATTRIBUTE_NMTOKEN", "XML_ATTRIBUTE_NMTOKENS", "XML_ATTRIBUTE_ENUMERATION",
      "XML_ATTRIBUTE_NOTATION", "DOM_PHP_ERR", "DOM_INDEX_SIZE_ERR",
      "DOMSTRING_SIZE_ERR", "DOM_HIERARCHY_REQUEST_ERR", "DOM_WRONG_DOCUMENT_ERR",
      "DOM_INVALID_CHARACTER_ERR", "DOM_NO_DATA_ALLOWED_ERR",
      "DOM_NO_MODIFICATION_ALLOWED_ERR", "DOM_NOT_FOUND_ERR",
      "DOM_NOT_SUPPORTED_ERR", "DOM_INUSE_ATTRIBUTE_ERR", "DOM_INVALID_STATE_ERR",
      "DOM_SYNTAX_ERR", "DOM_INVALID_MODIFICATION_ERR", "DOM_NAMESPACE_ERR",
      "DOM_INVALID_ACCESS_ERR", "DOM_VALIDATION_ERR", "XML_ERROR_NONE",
      "XML_ERROR_NO_MEMORY", "XML_ERROR_SYNTAX", "XML_ERROR_NO_ELEMENTS",
      "XML_ERROR_INVALID_TOKEN", "XML_ERROR_UNCLOSED_TOKEN",
      "XML_ERROR_PARTIAL_CHAR", "XML_ERROR_TAG_MISMATCH",
      "XML_ERROR_DUPLICATE_ATTRIBUTE", "XML_ERROR_JUNK_AFTER_DOC_ELEMENT",
      "XML_ERROR_PARAM_ENTITY_REF", "XML_ERROR_UNDEFINED_ENTITY",
      "XML_ERROR_RECURSIVE_ENTITY_REF", "XML_ERROR_ASYNC_ENTITY",
      "XML_ERROR_BAD_CHAR_REF", "XML_ERROR_BINARY_ENTITY_REF",
      "XML_ERROR_ATTRIBUTE_EXTERNAL_ENTITY_REF", "XML_ERROR_MISPLACED_XML_PI",
      "XML_ERROR_UNKNOWN_ENCODING", "XML_ERROR_INCORRECT_ENCODING",
      "XML_ERROR_UNCLOSED_CDATA_SECTION", "XML_ERROR_EXTERNAL_ENTITY_HANDLING",
      "XML_OPTION_CASE_FOLDING", "XML_OPTION_TARGET_ENCODING",
      "XML_OPTION_SKIP_TAGSTART", "XML_OPTION_SKIP_WHITE", "XML_SAX_IMPL", "IMG_GIF",
      "IMG_JPG", "IMG_JPEG", "IMG_PNG", "IMG_WBMP", "IMG_XPM", "IMG_COLOR_TILED",
      "IMG_COLOR_STYLED", "IMG_COLOR_BRUSHED", "IMG_COLOR_STYLEDBRUSHED",
      "IMG_COLOR_TRANSPARENT", "IMG_ARC_ROUNDED", "IMG_ARC_PIE", "IMG_ARC_CHORD",
      "IMG_ARC_NOFILL", "IMG_ARC_EDGED", "IMG_GD2_RAW", "IMG_GD2_COMPRESSED",
      "IMG_EFFECT_REPLACE", "IMG_EFFECT_ALPHABLEND", "IMG_EFFECT_NORMAL",
      "IMG_EFFECT_OVERLAY", "GD_BUNDLED", "IMG_FILTER_NEGATE",
      "IMG_FILTER_GRAYSCALE", "IMG_FILTER_BRIGHTNESS", "IMG_FILTER_CONTRAST",
      "IMG_FILTER_COLORIZE", "IMG_FILTER_EDGEDETECT", "IMG_FILTER_GAUSSIAN_BLUR",
      "IMG_FILTER_SELECTIVE_BLUR", "IMG_FILTER_EMBOSS", "IMG_FILTER_MEAN_REMOVAL",
      "IMG_FILTER_SMOOTH", "PNG_NO_FILTER", "PNG_FILTER_NONE", "PNG_FILTER_SUB",
      "PNG_FILTER_UP", "PNG_FILTER_AVG", "PNG_FILTER_PAETH", "PNG_ALL_FILTERS",
      "MB_OVERLOAD_MAIL", "MB_OVERLOAD_STRING", "MB_OVERLOAD_REGEX", "MB_CASE_UPPER",
      "MB_CASE_LOWER", "MB_CASE_TITLE", "MYSQL_ASSOC", "MYSQL_NUM", "MYSQL_BOTH",
      "MYSQL_CLIENT_COMPRESS", "MYSQL_CLIENT_SSL", "MYSQL_CLIENT_INTERACTIVE",
      "MYSQL_CLIENT_IGNORE_SPACE", "MYSQLI_READ_DEFAULT_GROUP",
      "MYSQLI_READ_DEFAULT_FILE", "MYSQLI_OPT_CONNECT_TIMEOUT",
      "MYSQLI_OPT_LOCAL_INFILE", "MYSQLI_INIT_COMMAND", "MYSQLI_CLIENT_SSL",
      "MYSQLI_CLIENT_COMPRESS", "MYSQLI_CLIENT_INTERACTIVE",
      "MYSQLI_CLIENT_IGNORE_SPACE", "MYSQLI_CLIENT_NO_SCHEMA",
      "MYSQLI_CLIENT_FOUND_ROWS", "MYSQLI_STORE_RESULT", "MYSQLI_USE_RESULT",
      "MYSQLI_ASSOC", "MYSQLI_NUM", "MYSQLI_BOTH",
      "MYSQLI_STMT_ATTR_UPDATE_MAX_LENGTH", "MYSQLI_STMT_ATTR_CURSOR_TYPE",
      "MYSQLI_CURSOR_TYPE_NO_CURSOR", "MYSQLI_CURSOR_TYPE_READ_ONLY",
      "MYSQLI_CURSOR_TYPE_FOR_UPDATE", "MYSQLI_CURSOR_TYPE_SCROLLABLE",
      "MYSQLI_STMT_ATTR_PREFETCH_ROWS", "MYSQLI_NOT_NULL_FLAG",
      "MYSQLI_PRI_KEY_FLAG", "MYSQLI_UNIQUE_KEY_FLAG", "MYSQLI_MULTIPLE_KEY_FLAG",
      "MYSQLI_BLOB_FLAG", "MYSQLI_UNSIGNED_FLAG", "MYSQLI_ZEROFILL_FLAG",
      "MYSQLI_AUTO_INCREMENT_FLAG", "MYSQLI_TIMESTAMP_FLAG", "MYSQLI_SET_FLAG",
      "MYSQLI_NUM_FLAG", "MYSQLI_PART_KEY_FLAG", "MYSQLI_GROUP_FLAG",
      "MYSQLI_TYPE_DECIMAL", "MYSQLI_TYPE_TINY", "MYSQLI_TYPE_SHORT",
      "MYSQLI_TYPE_LONG", "MYSQLI_TYPE_FLOAT", "MYSQLI_TYPE_DOUBLE",
      "MYSQLI_TYPE_NULL", "MYSQLI_TYPE_TIMESTAMP", "MYSQLI_TYPE_LONGLONG",
      "MYSQLI_TYPE_INT24", "MYSQLI_TYPE_DATE", "MYSQLI_TYPE_TIME",
      "MYSQLI_TYPE_DATETIME", "MYSQLI_TYPE_YEAR", "MYSQLI_TYPE_NEWDATE",
      "MYSQLI_TYPE_ENUM", "MYSQLI_TYPE_SET", "MYSQLI_TYPE_TINY_BLOB",
      "MYSQLI_TYPE_MEDIUM_BLOB", "MYSQLI_TYPE_LONG_BLOB", "MYSQLI_TYPE_BLOB",
      "MYSQLI_TYPE_VAR_STRING", "MYSQLI_TYPE_STRING", "MYSQLI_TYPE_CHAR",
      "MYSQLI_TYPE_INTERVAL", "MYSQLI_TYPE_GEOMETRY", "MYSQLI_TYPE_NEWDECIMAL",
      "MYSQLI_TYPE_BIT", "MYSQLI_RPL_MASTER", "MYSQLI_RPL_SLAVE", "MYSQLI_RPL_ADMIN",
      "MYSQLI_NO_DATA", "MYSQLI_DATA_TRUNCATED", "MYSQLI_REPORT_INDEX",
      "MYSQLI_REPORT_ERROR", "MYSQLI_REPORT_STRICT", "MYSQLI_REPORT_ALL",
      "MYSQLI_REPORT_OFF", "AF_UNIX", "AF_INET", "AF_INET6", "SOCK_STREAM",
      "SOCK_DGRAM", "SOCK_RAW", "SOCK_SEQPACKET", "SOCK_RDM", "MSG_OOB",
      "MSG_WAITALL", "MSG_PEEK", "MSG_DONTROUTE", "SO_DEBUG", "SO_REUSEADDR",
      "SO_KEEPALIVE", "SO_DONTROUTE", "SO_LINGER", "SO_BROADCAST", "SO_OOBINLINE",
      "SO_SNDBUF", "SO_RCVBUF", "SO_SNDLOWAT", "SO_RCVLOWAT", "SO_SNDTIMEO",
      "SO_RCVTIMEO", "SO_TYPE", "SO_ERROR", "SOL_SOCKET", "SOMAXCONN",
      "PHP_NORMAL_READ", "PHP_BINARY_READ", "SOCKET_EINTR", "SOCKET_EBADF",
      "SOCKET_EACCES", "SOCKET_EFAULT", "SOCKET_EINVAL", "SOCKET_EMFILE",
      "SOCKET_EWOULDBLOCK", "SOCKET_EINPROGRESS", "SOCKET_EALREADY",
      "SOCKET_ENOTSOCK", "SOCKET_EDESTADDRREQ", "SOCKET_EMSGSIZE",
      "SOCKET_EPROTOTYPE", "SOCKET_ENOPROTOOPT", "SOCKET_EPROTONOSUPPORT",
      "SOCKET_ESOCKTNOSUPPORT", "SOCKET_EOPNOTSUPP", "SOCKET_EPFNOSUPPORT",
      "SOCKET_EAFNOSUPPORT", "SOCKET_EADDRINUSE", "SOCKET_EADDRNOTAVAIL",
      "SOCKET_ENETDOWN", "SOCKET_ENETUNREACH", "SOCKET_ENETRESET",
      "SOCKET_ECONNABORTED", "SOCKET_ECONNRESET", "SOCKET_ENOBUFS", "SOCKET_EISCONN",
      "SOCKET_ENOTCONN", "SOCKET_ESHUTDOWN", "SOCKET_ETOOMANYREFS",
      "SOCKET_ETIMEDOUT", "SOCKET_ECONNREFUSED", "SOCKET_ELOOP",
      "SOCKET_ENAMETOOLONG", "SOCKET_EHOSTDOWN", "SOCKET_EHOSTUNREACH",
      "SOCKET_ENOTEMPTY", "SOCKET_EPROCLIM", "SOCKET_EUSERS", "SOCKET_EDQUOT",
      "SOCKET_ESTALE", "SOCKET_EREMOTE", "SOCKET_EDISCON", "SOCKET_SYSNOTREADY",
      "SOCKET_VERNOTSUPPORTED", "SOCKET_NOTINITIALISED", "SOCKET_HOST_NOT_FOUND",
      "SOCKET_TRY_AGAIN", "SOCKET_NO_RECOVERY", "SOCKET_NO_DATA",
      "SOCKET_NO_ADDRESS", "SOL_TCP", "SOL_UDP", "EACCELERATOR_VERSION",
      "EACCELERATOR_SHM_AND_DISK", "EACCELERATOR_SHM", "EACCELERATOR_SHM_ONLY",
      "EACCELERATOR_DISK_ONLY", "EACCELERATOR_NONE", "XDEBUG_TRACE_APPEND",
      "XDEBUG_TRACE_COMPUTERIZED", "XDEBUG_TRACE_HTML", "XDEBUG_CC_UNUSED",
      "XDEBUG_CC_DEAD_CODE", "STDIN", "STDOUT", "STDERR",
    ].forEach(function(element, index, array) {
      result[element] = token("atom", "php-predefined-constant");
    });

    // PHP declared classes - output of get_declared_classes(). Differs from http://php.net/manual/en/reserved.classes.php
    [  "stdClass", "Exception", "ErrorException", "COMPersistHelper", "com_exception",
      "com_safearray_proxy", "variant", "com", "dotnet", "ReflectionException",
      "Reflection", "ReflectionFunctionAbstract", "ReflectionFunction",
      "ReflectionParameter", "ReflectionMethod", "ReflectionClass",
      "ReflectionObject", "ReflectionProperty", "ReflectionExtension", "DateTime",
      "DateTimeZone", "LibXMLError", "__PHP_Incomplete_Class", "php_user_filter",
      "Directory", "SimpleXMLElement", "DOMException", "DOMStringList",
      "DOMNameList", "DOMImplementationList", "DOMImplementationSource",
      "DOMImplementation", "DOMNode", "DOMNameSpaceNode", "DOMDocumentFragment",
      "DOMDocument", "DOMNodeList", "DOMNamedNodeMap", "DOMCharacterData", "DOMAttr",
      "DOMElement", "DOMText", "DOMComment", "DOMTypeinfo", "DOMUserDataHandler",
      "DOMDomError", "DOMErrorHandler", "DOMLocator", "DOMConfiguration",
      "DOMCdataSection", "DOMDocumentType", "DOMNotation", "DOMEntity",
      "DOMEntityReference", "DOMProcessingInstruction", "DOMStringExtend",
      "DOMXPath", "RecursiveIteratorIterator", "IteratorIterator", "FilterIterator",
      "RecursiveFilterIterator", "ParentIterator", "LimitIterator",
      "CachingIterator", "RecursiveCachingIterator", "NoRewindIterator",
      "AppendIterator", "InfiniteIterator", "RegexIterator",
      "RecursiveRegexIterator", "EmptyIterator", "ArrayObject", "ArrayIterator",
      "RecursiveArrayIterator", "SplFileInfo", "DirectoryIterator",
      "RecursiveDirectoryIterator", "SplFileObject", "SplTempFileObject",
      "SimpleXMLIterator", "LogicException", "BadFunctionCallException",
      "BadMethodCallException", "DomainException", "InvalidArgumentException",
      "LengthException", "OutOfRangeException", "RuntimeException",
      "OutOfBoundsException", "OverflowException", "RangeException",
      "UnderflowException", "UnexpectedValueException", "SplObjectStorage",
      "XMLReader", "XMLWriter", "mysqli_sql_exception", "mysqli_driver", "mysqli",
      "mysqli_warning", "mysqli_result", "mysqli_stmt", "PDOException", "PDO",
      "PDOStatement", "PDORow"
    ].forEach(function(element, index, array) {
      result[element] = token("t_string", "php-predefined-class");
    });

    return result;

  }();

  // Helper regexps
  var isOperatorChar = /[+*&%\/=<>!?.|-]/;
  var isHexDigit = /[0-9A-Fa-f]/;
  var isWordChar = /[\w\$_]/;

  // Wrapper around phpToken that helps maintain parser state (whether
  // we are inside of a multi-line comment)
  function phpTokenState(inside) {
    return function(source, setState) {
      var newInside = inside;
      var type = phpToken(inside, source, function(c) {newInside = c;});
      if (newInside != inside)
        setState(phpTokenState(newInside));
      return type;
    };
  }

  // The token reader, inteded to be used by the tokenizer from
  // tokenize.js (through phpTokenState). Advances the source stream
  // over a token, and returns an object containing the type and style
  // of that token.
  function phpToken(inside, source, setInside) {
    function readHexNumber(){
      source.next();  // skip the 'x'
      source.nextWhileMatches(isHexDigit);
      return {type: "number", style: "php-atom"};
    }

    function readNumber() {
      source.nextWhileMatches(/[0-9]/);
      if (source.equals(".")){
        source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      if (source.equals("e") || source.equals("E")){
        source.next();
        if (source.equals("-"))
          source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      return {type: "number", style: "php-atom"};
    }
    // Read a word and look it up in the keywords array. If found, it's a
    // keyword of that type; otherwise it's a PHP T_STRING.
    function readWord() {
      source.nextWhileMatches(isWordChar);
      var word = source.get();
      var known = keywords.hasOwnProperty(word) && keywords.propertyIsEnumerable(word) && keywords[word];
      // since we called get(), tokenize::take won't get() anything. Thus, we must set token.content
      return known ? {type: known.type, style: known.style, content: word} :
      {type: "t_string", style: "php-t_string", content: word};
    }
    function readVariable() {
      source.nextWhileMatches(isWordChar);
      var word = source.get();
      // in PHP, '$this' is a reserved word, but 'this' isn't. You can have function this() {...}
      if (word == "$this")
        return {type: "variable", style: "php-keyword", content: word};
      else
        return {type: "variable", style: "php-variable", content: word};
    }

    // Advance the stream until the given character (not preceded by a
    // backslash) is encountered, or the end of the line is reached.
    function nextUntilUnescaped(source, end) {
      var escaped = false;
      while(!source.endOfLine()){
        var next = source.next();
        if (next == end && !escaped)
          return false;
        escaped = next == "\\" && !escaped;
      }
      return escaped;
    }

    function readSingleLineComment() {
      // read until the end of the line or until ?>, which terminates single-line comments
      // `<?php echo 1; // comment ?> foo` will display "1 foo"
      while(!source.lookAhead("?>") && !source.endOfLine())
        source.next();
      return {type: "comment", style: "php-comment"};
    }
    /* For multi-line comments, we want to return a comment token for
       every line of the comment, but we also want to return the newlines
       in them as regular newline tokens. We therefore need to save a
       state variable ("inside") to indicate whether we are inside a
       multi-line comment.
    */

    function readMultilineComment(start){
      var newInside = "/*";
      var maybeEnd = (start == "*");
      while (true) {
        if (source.endOfLine())
          break;
        var next = source.next();
        if (next == "/" && maybeEnd){
          newInside = null;
          break;
        }
        maybeEnd = (next == "*");
      }
      setInside(newInside);
      return {type: "comment", style: "php-comment"};
    }

    // similar to readMultilineComment and nextUntilUnescaped
    // unlike comments, strings are not stopped by ?>
    function readMultilineString(start){
      var newInside = start;
      var escaped = false;
      while (true) {
        if (source.endOfLine())
          break;
        var next = source.next();
        if (next == start && !escaped){
          newInside = null;  // we're outside of the string now
          break;
        }
        escaped = (next == "\\" && !escaped);
      }
      setInside(newInside);
      return {
        type: newInside == null? "string" : "string_not_terminated",
        style: (start == "'"? "php-string-single-quoted" : "php-string-double-quoted")
      };
    }

    // http://php.net/manual/en/language.types.string.php#language.types.string.syntax.heredoc
    // See also 'nowdoc' on the page. Heredocs are not interrupted by the '?>' token.
    function readHeredoc(identifier){
      var token = {};
      if (identifier == "<<<") {
        // on our first invocation after reading the <<<, we must determine the closing identifier
        if (source.equals("'")) {
          // nowdoc
          source.nextWhileMatches(isWordChar);
          identifier = "'" + source.get() + "'";
          source.next();  // consume the closing "'"
        } else if (source.matches(/[A-Za-z_]/)) {
          // heredoc
          source.nextWhileMatches(isWordChar);
          identifier = source.get();
        } else {
          // syntax error
          setInside(null);
          return { type: "error", style: "syntax-error" };
        }
        setInside(identifier);
        token.type = "string_not_terminated";
        token.style = identifier.charAt(0) == "'"? "php-string-single-quoted" : "php-string-double-quoted";
        token.content = identifier;
      } else {
        token.style = identifier.charAt(0) == "'"? "php-string-single-quoted" : "php-string-double-quoted";
        // consume a line of heredoc and check if it equals the closing identifier plus an optional semicolon
        if (source.lookAhead(identifier, true) && (source.lookAhead(";\n") || source.endOfLine())) {
          // the closing identifier can only appear at the beginning of the line
          // note that even whitespace after the ";" is forbidden by the PHP heredoc syntax
          token.type = "string";
          token.content = source.get();  // don't get the ";" if there is one
          setInside(null);
        } else {
          token.type = "string_not_terminated";
          source.nextWhileMatches(/[^\n]/);
          token.content = source.get();
        }
      }
      return token;
    }

    function readOperator() {
      source.nextWhileMatches(isOperatorChar);
      return {type: "operator", style: "php-operator"};
    }
    function readStringSingleQuoted() {
      var endBackSlash = nextUntilUnescaped(source, "'", false);
      setInside(endBackSlash ? "'" : null);
      return {type: "string", style: "php-string-single-quoted"};
    }
    function readStringDoubleQuoted() {
      var endBackSlash = nextUntilUnescaped(source, "\"", false);
      setInside(endBackSlash ? "\"": null);
      return {type: "string", style: "php-string-double-quoted"};
    }

    // Fetch the next token. Dispatches on first character in the
    // stream, or first two characters when the first is a slash.
    switch (inside) {
      case null:
      case false: break;
      case "'":
      case "\"": return readMultilineString(inside);
      case "/*": return readMultilineComment(source.next());
      default: return readHeredoc(inside);
    }
    var ch = source.next();
    if (ch == "'" || ch == "\"")
      return readMultilineString(ch)
    else if (ch == "#")
      return readSingleLineComment();
    else if (ch == "$")
      return readVariable();
    else if (ch == ":" && source.equals(":")) {
      source.next();
      // the T_DOUBLE_COLON can only follow a T_STRING (class name)
      return {type: "t_double_colon", style: "php-operator"}
    }
    // with punctuation, the type of the token is the symbol itself
    else if (/[\[\]{}\(\),;:]/.test(ch)) {
      return {type: ch, style: "php-punctuation"};
    }
    else if (ch == "0" && (source.equals("x") || source.equals("X")))
      return readHexNumber();
    else if (/[0-9]/.test(ch))
      return readNumber();
    else if (ch == "/") {
      if (source.equals("*"))
      { source.next(); return readMultilineComment(ch); }
      else if (source.equals("/"))
        return readSingleLineComment();
      else
        return readOperator();
    }
    else if (ch == "<") {
      if (source.lookAhead("<<", true)) {
        setInside("<<<");
        return {type: "<<<", style: "php-punctuation"};
      }
      else
        return readOperator();
    }
    else if (isOperatorChar.test(ch))
      return readOperator();
    else
      return readWord();
  }

  // The external interface to the tokenizer.
  return function(source, startState) {
    return tokenizer(source, startState || phpTokenState(false, true));
  };
})();

var PlsqlParser = Editor.Parser = (function() {

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }

  var functions = wordRegexp([
"abs","acos","add_months","ascii","asin","atan","atan2","average",
"bfilename",
"ceil","chartorowid","chr","concat","convert","cos","cosh","count",
"decode","deref","dual","dump","dup_val_on_index",
"empty","error","exp",
"false","floor","found",
"glb","greatest",
"hextoraw",
"initcap","instr","instrb","isopen",
"last_day","least","lenght","lenghtb","ln","lower","lpad","ltrim","lub",
"make_ref","max","min","mod","months_between",
"new_time","next_day","nextval","nls_charset_decl_len","nls_charset_id","nls_charset_name","nls_initcap","nls_lower",
"nls_sort","nls_upper","nlssort","no_data_found","notfound","null","nvl",
"others",
"power",
"rawtohex","reftohex","round","rowcount","rowidtochar","rpad","rtrim",
"sign","sin","sinh","soundex","sqlcode","sqlerrm","sqrt","stddev","substr","substrb","sum","sysdate",
"tan","tanh","to_char","to_date","to_label","to_multi_byte","to_number","to_single_byte","translate","true","trunc",
"uid","upper","user","userenv",
"variance","vsize"

  ]);

  var keywords = wordRegexp([
"abort","accept","access","add","all","alter","and","any","array","arraylen","as","asc","assert","assign","at","attributes","audit",
"authorization","avg",
"base_table","begin","between","binary_integer","body","boolean","by",
"case","cast","char","char_base","check","close","cluster","clusters","colauth","column","comment","commit","compress","connect",
"connected","constant","constraint","crash","create","current","currval","cursor",
"data_base","database","date","dba","deallocate","debugoff","debugon","decimal","declare","default","definition","delay","delete",
"desc","digits","dispose","distinct","do","drop",
"else","elsif","enable","end","entry","escape","exception","exception_init","exchange","exclusive","exists","exit","external",
"fast","fetch","file","for","force","form","from","function",
"generic","goto","grant","group",
"having",
"identified","if","immediate","in","increment","index","indexes","indicator","initial","initrans","insert","interface","intersect",
"into","is",
"key",
"level","library","like","limited","local","lock","log","logging","long","loop",
"master","maxextents","maxtrans","member","minextents","minus","mislabel","mode","modify","multiset",
"new","next","no","noaudit","nocompress","nologging","noparallel","not","nowait","number_base",
"object","of","off","offline","on","online","only","open","option","or","order","out",
"package","parallel","partition","pctfree","pctincrease","pctused","pls_integer","positive","positiven","pragma","primary","prior",
"private","privileges","procedure","public",
"raise","range","raw","read","rebuild","record","ref","references","refresh","release","rename","replace","resource","restrict","return",
"returning","reverse","revoke","rollback","row","rowid","rowlabel","rownum","rows","run",
"savepoint","schema","segment","select","separate","session","set","share","snapshot","some","space","split","sql","start","statement",
"storage","subtype","successful","synonym",
"tabauth","table","tables","tablespace","task","terminate","then","to","trigger","truncate","type",
"union","unique","unlimited","unrecoverable","unusable","update","use","using",
"validate","value","values","variable","view","views",
"when","whenever","where","while","with","work"
  ]);

  var types = wordRegexp([
"bfile","blob",
"character","clob",
"dec",
"float",
"int","integer",
"mlslabel",
"natural","naturaln","nchar","nclob","number","numeric","nvarchar2",
"real","rowtype",
"signtype","smallint","string",
"varchar","varchar2"
  ]);

  var operators = wordRegexp([
    ":=", "<", "<=", "==", "!=", "<>", ">", ">=", "like", "rlike", "in", "xor", "between"
  ]);

  var operatorChars = /[*+\-<>=&|:\/]/;

  var tokenizeSql = (function() {
    function normal(source, setState) {
      var ch = source.next();
      if (ch == "@" || ch == "$") {
        source.nextWhileMatches(/[\w\d]/);
        return "plsql-var";
      }
      else if (ch == "\"" || ch == "'" || ch == "`") {
        setState(inLiteral(ch));
        return null;
      }
      else if (ch == "," || ch == ";") {
        return "plsql-separator"
      }
      else if (ch == '-') {
        if (source.peek() == "-") {
          while (!source.endOfLine()) source.next();
          return "plsql-comment";
        }
        else if (/\d/.test(source.peek())) {
          source.nextWhileMatches(/\d/);
          if (source.peek() == '.') {
            source.next();
            source.nextWhileMatches(/\d/);
          }
          return "plsql-number";
        }
        else
          return "plsql-operator";
      }
      else if (operatorChars.test(ch)) {
        source.nextWhileMatches(operatorChars);
        return "plsql-operator";
      }
      else if (/\d/.test(ch)) {
        source.nextWhileMatches(/\d/);
        if (source.peek() == '.') {
          source.next();
          source.nextWhileMatches(/\d/);
        }
        return "plsql-number";
      }
      else if (/[()]/.test(ch)) {
        return "plsql-punctuation";
      }
      else {
        source.nextWhileMatches(/[_\w\d]/);
        var word = source.get(), type;
        if (operators.test(word))
          type = "plsql-operator";
        else if (keywords.test(word))
          type = "plsql-keyword";
        else if (functions.test(word))
          type = "plsql-function";
        else if (types.test(word))
          type = "plsql-type";
        else
          type = "plsql-word";
        return {style: type, content: word};
      }
    }

    function inLiteral(quote) {
      return function(source, setState) {
        var escaped = false;
        while (!source.endOfLine()) {
          var ch = source.next();
          if (ch == quote && !escaped) {
            setState(normal);
            break;
          }
          escaped = !escaped && ch == "\\";
        }
        return quote == "`" ? "plsql-word" : "plsql-literal";
      };
    }

    return function(source, startState) {
      return tokenizer(source, startState || normal);
    };
  })();

  function indentSql(context) {
    return function(nextChars) {
      var firstChar = nextChars && nextChars.charAt(0);
      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.align)
        return context.col - (closing ? context.width : 0);
      else
        return context.indent + (closing ? 0 : indentUnit);
    }
  }

  function parseSql(source) {
    var tokens = tokenizeSql(source);
    var context = null, indent = 0, col = 0;
    function pushContext(type, width, align) {
      context = {prev: context, indent: indent, col: col, type: type, width: width, align: align};
    }
    function popContext() {
      context = context.prev;
    }

    var iter = {
      next: function() {
        var token = tokens.next();
        var type = token.style, content = token.content, width = token.value.length;

        if (content == "\n") {
          token.indentation = indentSql(context);
          indent = col = 0;
          if (context && context.align == null) context.align = false;
        }
        else if (type == "whitespace" && col == 0) {
          indent = width;
        }
        else if (!context && type != "plsql-comment") {
          pushContext(";", 0, false);
        }

        if (content != "\n") col += width;

        if (type == "plsql-punctuation") {
          if (content == "(")
            pushContext(")", width);
          else if (content == ")")
            popContext();
        }
        else if (type == "plsql-separator" && content == ";" && context && !context.prev) {
          popContext();
        }

        return token;
      },

      copy: function() {
        var _context = context, _indent = indent, _col = col, _tokenState = tokens.state;
        return function(source) {
          tokens = tokenizeSql(source, _tokenState);
          context = _context;
          indent = _indent;
          col = _col;
          return iter;
        };
      }
    };
    return iter;
  }

  return {make: parseSql, electricChars: ")"};
})();

var PythonParser = Editor.Parser = (function() {
    function wordRegexp(words) {
        return new RegExp("^(?:" + words.join("|") + ")$");
    }
    var DELIMITERCLASS = 'py-delimiter';
    var LITERALCLASS = 'py-literal';
    var ERRORCLASS = 'py-error';
    var OPERATORCLASS = 'py-operator';
    var IDENTIFIERCLASS = 'py-identifier';
    var STRINGCLASS = 'py-string';
    var BYTESCLASS = 'py-bytes';
    var UNICODECLASS = 'py-unicode';
    var RAWCLASS = 'py-raw';
    var NORMALCONTEXT = 'normal';
    var STRINGCONTEXT = 'string';
    var singleOperators = '+-*/%&|^~<>';
    var doubleOperators = wordRegexp(['==', '!=', '\\<=', '\\>=', '\\<\\>',
                                      '\\<\\<', '\\>\\>', '\\/\\/', '\\*\\*']);
    var singleDelimiters = '()[]{}@,:`=;';
    var doubleDelimiters = ['\\+=', '\\-=', '\\*=', '/=', '%=', '&=', '\\|=',
                            '\\^='];
    var tripleDelimiters = wordRegexp(['//=','\\>\\>=','\\<\\<=','\\*\\*=']);
    var singleStarters = singleOperators + singleDelimiters + '=!';
    var doubleStarters = '=<>*/';
    var identifierStarters = /[_A-Za-z]/;

    var wordOperators = wordRegexp(['and', 'or', 'not', 'is', 'in']);
    var commonkeywords = ['as', 'assert', 'break', 'class', 'continue',
                          'def', 'del', 'elif', 'else', 'except', 'finally',
                          'for', 'from', 'global', 'if', 'import',
                          'lambda', 'pass', 'raise', 'return',
                          'try', 'while', 'with', 'yield'];
    var commontypes = ['bool', 'classmethod', 'complex', 'dict', 'enumerate',
                       'float', 'frozenset', 'int', 'list', 'object',
                       'property', 'reversed', 'set', 'slice', 'staticmethod',
                       'str', 'super', 'tuple', 'type'];
    var py2 = {'types': ['basestring', 'buffer', 'file', 'long', 'unicode',
                         'xrange'],
               'keywords': ['exec', 'print'],
               'version': 2 };
    var py3 = {'types': ['bytearray', 'bytes', 'filter', 'map', 'memoryview',
                         'open', 'range', 'zip'],
               'keywords': ['nonlocal'],
               'version': 3};

    var py, keywords, types, stringStarters, stringTypes, config;

    function configure(conf) {
        if (!conf.hasOwnProperty('pythonVersion')) {
            conf.pythonVersion = 2;
        }
        if (!conf.hasOwnProperty('strictErrors')) {
            conf.strictErrors = true;
        }
        if (conf.pythonVersion != 2 && conf.pythonVersion != 3) {
            alert('CodeMirror: Unknown Python Version "' +
                  conf.pythonVersion +
                  '", defaulting to Python 2.x.');
            conf.pythonVersion = 2;
        }
        if (conf.pythonVersion == 3) {
            py = py3;
            stringStarters = /[\'\"rbRB]/;
            stringTypes = /[rb]/;
            doubleDelimiters.push('\\-\\>');
        } else {
            py = py2;
            stringStarters = /[\'\"RUru]/;
            stringTypes = /[ru]/;
        }
        config = conf;
        keywords = wordRegexp(commonkeywords.concat(py.keywords));
        types = wordRegexp(commontypes.concat(py.types));
        doubleDelimiters = wordRegexp(doubleDelimiters);
    }

    var tokenizePython = (function() {
        function normal(source, setState) {
            var stringDelim, threeStr, temp, type, word, possible = {};
            var ch = source.next();
            
            function filterPossible(token, styleIfPossible) {
                if (!possible.style && !possible.content) {
                    return token;
                } else if (typeof(token) == STRINGCONTEXT) {
                    token = {content: source.get(), style: token};
                }
                if (possible.style || styleIfPossible) {
                    token.style = styleIfPossible ? styleIfPossible : possible.style;
                }
                if (possible.content) {
                    token.content = possible.content + token.content;
                }
                possible = {};
                return token;
            }

            // Handle comments
            if (ch == '#') {
                while (!source.endOfLine()) {
                    source.next();
                }
                return 'py-comment';
            }
            // Handle special chars
            if (ch == '\\') {
                if (!source.endOfLine()) {
                    var whitespace = true;
                    while (!source.endOfLine()) {
                        if(!(/[\s\u00a0]/.test(source.next()))) {
                            whitespace = false;
                        }
                    }
                    if (!whitespace) {
                        return ERRORCLASS;
                    }
                }
                return 'py-special';
            }
            // Handle operators and delimiters
            if (singleStarters.indexOf(ch) != -1 || (ch == "." && !source.matches(/\d/))) {
                if (doubleStarters.indexOf(source.peek()) != -1) {
                    temp = ch + source.peek();
                    // It must be a double delimiter or operator or triple delimiter
                    if (doubleOperators.test(temp)) {
                        source.next();
                        var nextChar = source.peek();
                        if (nextChar && tripleDelimiters.test(temp + nextChar)) {
                            source.next();
                            return DELIMITERCLASS;
                        } else {
                            return OPERATORCLASS;
                        }
                    } else if (doubleDelimiters.test(temp)) {
                        source.next();
                        return DELIMITERCLASS;
                    }
                }
                // It must be a single delimiter or operator
                if (singleOperators.indexOf(ch) != -1 || ch == ".") {
                    return OPERATORCLASS;
                } else if (singleDelimiters.indexOf(ch) != -1) {
                    if (ch == '@' && source.matches(/\w/)) {
                        source.nextWhileMatches(/[\w\d_]/);
                        return {style:'py-decorator',
                                content: source.get()};
                    } else {
                        return DELIMITERCLASS;
                    }
                } else {
                    return ERRORCLASS;
                }
            }
            // Handle number literals
            if (/\d/.test(ch) || (ch == "." && source.matches(/\d/))) {
                if (ch === '0' && !source.endOfLine()) {
                    switch (source.peek()) {
                        case 'o':
                        case 'O':
                            source.next();
                            source.nextWhileMatches(/[0-7]/);
                            return filterPossible(LITERALCLASS, ERRORCLASS);
                        case 'x':
                        case 'X':
                            source.next();
                            source.nextWhileMatches(/[0-9A-Fa-f]/);
                            return filterPossible(LITERALCLASS, ERRORCLASS);
                        case 'b':
                        case 'B':
                            source.next();
                            source.nextWhileMatches(/[01]/);
                            return filterPossible(LITERALCLASS, ERRORCLASS);
                    }
                }
                source.nextWhileMatches(/\d/);
                if (ch != '.' && source.peek() == '.') {
                    source.next();
                    source.nextWhileMatches(/\d/);
                }
                // Grab an exponent
                if (source.matches(/e/i)) {
                    source.next();
                    if (source.peek() == '+' || source.peek() == '-') {
                        source.next();
                    }
                    if (source.matches(/\d/)) {
                        source.nextWhileMatches(/\d/);
                    } else {
                        return filterPossible(ERRORCLASS);
                    }
                }
                // Grab a complex number
                if (source.matches(/j/i)) {
                    source.next();
                }

                return filterPossible(LITERALCLASS);
            }
            // Handle strings
            if (stringStarters.test(ch)) {
                var peek = source.peek();
                var stringType = STRINGCLASS;
                if ((stringTypes.test(ch)) && (peek == '"' || peek == "'")) {
                    switch (ch.toLowerCase()) {
                        case 'b':
                            stringType = BYTESCLASS;
                            break;
                        case 'r':
                            stringType = RAWCLASS;
                            break;
                        case 'u':
                            stringType = UNICODECLASS;
                            break;
                    }
                    ch = source.next();
                    stringDelim = ch;
                    if (source.peek() != stringDelim) {
                        setState(inString(stringType, stringDelim));
                        return null;
                    } else {
                        source.next();
                        if (source.peek() == stringDelim) {
                            source.next();
                            threeStr = stringDelim + stringDelim + stringDelim;
                            setState(inString(stringType, threeStr));
                            return null;
                        } else {
                            return stringType;
                        }
                    }
                } else if (ch == "'" || ch == '"') {
                    stringDelim = ch;
                    if (source.peek() != stringDelim) {
                        setState(inString(stringType, stringDelim));
                        return null;
                    } else {
                        source.next();
                        if (source.peek() == stringDelim) {
                            source.next();
                            threeStr = stringDelim + stringDelim + stringDelim;
                            setState(inString(stringType, threeStr));
                            return null;
                        } else {
                            return stringType;
                        }
                    }
                }
            }
            // Handle Identifier
            if (identifierStarters.test(ch)) {
                source.nextWhileMatches(/[\w\d_]/);
                word = source.get();
                if (wordOperators.test(word)) {
                    type = OPERATORCLASS;
                } else if (keywords.test(word)) {
                    type = 'py-keyword';
                } else if (types.test(word)) {
                    type = 'py-type';
                } else {
                    type = IDENTIFIERCLASS;
                    while (source.peek() == '.') {
                        source.next();
                        if (source.matches(identifierStarters)) {
                            source.nextWhileMatches(/[\w\d]/);
                        } else {
                            type = ERRORCLASS;
                            break;
                        }
                    }
                    word = word + source.get();
                }
                return filterPossible({style: type, content: word});
            }

            // Register Dollar sign and Question mark as errors. Always!
            if (/\$\?/.test(ch)) {
                return filterPossible(ERRORCLASS);
            }

            return filterPossible(ERRORCLASS);
        }

        function inString(style, terminator) {
            return function(source, setState) {
                var matches = [];
                var found = false;
                while (!found && !source.endOfLine()) {
                    var ch = source.next(), newMatches = [];
                    // Skip escaped characters
                    if (ch == '\\') {
                        if (source.peek() == '\n') {
                            break;
                        }
                        ch = source.next();
                        ch = source.next();
                    }
                    if (ch == terminator.charAt(0)) {
                        matches.push(terminator);
                    }
                    for (var i = 0; i < matches.length; i++) {
                        var match = matches[i];
                        if (match.charAt(0) == ch) {
                            if (match.length == 1) {
                                setState(normal);
                                found = true;
                                break;
                            } else {
                                newMatches.push(match.slice(1));
                            }
                        }
                    }
                    matches = newMatches;
                }
                return style;
            };
        }

        return function(source, startState) {
            return tokenizer(source, startState || normal);
        };
    })();

    function parsePython(source, basecolumn) {
        if (!keywords) {
            configure({});
        }
        basecolumn = basecolumn || 0;

        var tokens = tokenizePython(source);
        var lastToken = null;
        var column = basecolumn;
        var context = {prev: null,
                       endOfScope: false,
                       startNewScope: false,
                       level: basecolumn,
                       next: null,
                       type: NORMALCONTEXT
                       };

        function pushContext(level, type) {
            type = type ? type : NORMALCONTEXT;
            context = {prev: context,
                       endOfScope: false,
                       startNewScope: false,
                       level: level,
                       next: null,
                       type: type
                       };
        }

        function popContext(remove) {
            remove = remove ? remove : false;
            if (context.prev) {
                if (remove) {
                    context = context.prev;
                    context.next = null;
                } else {
                    context.prev.next = context;
                    context = context.prev;
                }
            }
        }

        function indentPython(context) {
            var temp;
            return function(nextChars, currentLevel, direction) {
                if (direction === null || direction === undefined) {
                    if (nextChars) {
                        while (context.next) {
                            context = context.next;
                        }
                    }
                    return context.level;
                }
                else if (direction === true) {
                    if (currentLevel == context.level) {
                        if (context.next) {
                            return context.next.level;
                        } else {
                            return context.level;
                        }
                    } else {
                        temp = context;
                        while (temp.prev && temp.prev.level > currentLevel) {
                            temp = temp.prev;
                        }
                        return temp.level;
                    }
                } else if (direction === false) {
                    if (currentLevel > context.level) {
                        return context.level;
                    } else if (context.prev) {
                        temp = context;
                        while (temp.prev && temp.prev.level >= currentLevel) {
                            temp = temp.prev;
                        }
                        if (temp.prev) {
                            return temp.prev.level;
                        } else {
                            return temp.level;
                        }
                    }
                }
                return context.level;
            };
        }

        var iter = {
            next: function() {
                var token = tokens.next();
                var type = token.style;
                var content = token.content;

                if (lastToken) {
                    if (lastToken.content == 'def' && type == IDENTIFIERCLASS) {
                        token.style = 'py-func';
                    }
                    if (lastToken.content == '\n') {
                        var tempCtx = context;
                        // Check for a different scope
                        if (type == 'whitespace' && context.type == NORMALCONTEXT) {
                            if (token.value.length < context.level) {
                                while (token.value.length < context.level) {
                                    popContext();
                                }

                                if (token.value.length != context.level) {
                                    context = tempCtx;
                                    if (config.strictErrors) {
                                        token.style = ERRORCLASS;
                                    }
                                } else {
                                    context.next = null;
                                }
                            }
                        } else if (context.level !== basecolumn &&
                                   context.type == NORMALCONTEXT) {
                            while (basecolumn !== context.level) {
                                popContext();
                            }

                            if (context.level !== basecolumn) {
                                context = tempCtx;
                                if (config.strictErrors) {
                                    token.style = ERRORCLASS;
                                }
                            }
                        }
                    }
                }

                // Handle Scope Changes
                switch(type) {
                    case STRINGCLASS:
                    case BYTESCLASS:
                    case RAWCLASS:
                    case UNICODECLASS:
                        if (context.type !== STRINGCONTEXT) {
                            pushContext(context.level + 1, STRINGCONTEXT);
                        }
                        break;
                    default:
                        if (context.type === STRINGCONTEXT) {
                            popContext(true);
                        }
                        break;
                }
                switch(content) {
                    case '.':
                    case '@':
                        // These delimiters don't appear by themselves
                        if (content !== token.value) {
                            token.style = ERRORCLASS;
                        }
                        break;
                    case ':':
                        // Colons only delimit scope inside a normal scope
                        if (context.type === NORMALCONTEXT) {
                            context.startNewScope = context.level+indentUnit;
                        }
                        break;
                    case '(':
                    case '[':
                    case '{':
                        // These start a sequence scope
                        pushContext(column + content.length, 'sequence');
                        break;
                    case ')':
                    case ']':
                    case '}':
                        // These end a sequence scope
                        popContext(true);
                        break;
                    case 'pass':
                    case 'return':
                        // These end a normal scope
                        if (context.type === NORMALCONTEXT) {
                            context.endOfScope = true;
                        }
                        break;
                    case '\n':
                        // Reset our column
                        column = basecolumn;
                        // Make any scope changes
                        if (context.endOfScope) {
                            context.endOfScope = false;
                            popContext();
                        } else if (context.startNewScope !== false) {
                            var temp = context.startNewScope;
                            context.startNewScope = false;
                            pushContext(temp, NORMALCONTEXT);
                        }
                        // Newlines require an indentation function wrapped in a closure for proper context.
                        token.indentation = indentPython(context);
                        break;
                }

                // Keep track of current column for certain scopes.
                if (content != '\n') {
                    column += token.value.length;
                }

                lastToken = token;
                return token;
            },

            copy: function() {
                var _context = context, _tokenState = tokens.state;
                return function(source) {
                    tokens = tokenizePython(source, _tokenState);
                    context = _context;
                    return iter;
                };
            }
        };
        return iter;
    }

    return {make: parsePython,
            electricChars: "",
            configure: configure};
})();

var SqlParser = Editor.Parser = (function() {

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }

  var functions = wordRegexp([
    "abs", "acos", "adddate", "aes_encrypt", "aes_decrypt", "ascii",
    "asin", "atan", "atan2", "avg", "benchmark", "bin", "bit_and",
    "bit_count", "bit_length", "bit_or", "cast", "ceil", "ceiling",
    "char_length", "character_length", "coalesce", "concat", "concat_ws",
    "connection_id", "conv", "convert", "cos", "cot", "count", "curdate",
    "current_date", "current_time", "current_timestamp", "current_user",
    "curtime", "database", "date_add", "date_format", "date_sub",
    "dayname", "dayofmonth", "dayofweek", "dayofyear", "decode", "degrees",
    "des_encrypt", "des_decrypt", "elt", "encode", "encrypt", "exp",
    "export_set", "extract", "field", "find_in_set", "floor", "format",
    "found_rows", "from_days", "from_unixtime", "get_lock", "greatest",
    "group_unique_users", "hex", "ifnull", "inet_aton", "inet_ntoa", "instr",
    "interval", "is_free_lock", "isnull", "last_insert_id", "lcase", "least",
    "left", "length", "ln", "load_file", "locate", "log", "log2", "log10",
    "lower", "lpad", "ltrim", "make_set", "master_pos_wait", "max", "md5",
    "mid", "min", "mod", "monthname", "now", "nullif", "oct", "octet_length",
    "ord", "password", "period_add", "period_diff", "pi", "position",
    "pow", "power", "quarter", "quote", "radians", "rand", "release_lock",
    "repeat", "reverse", "right", "round", "rpad", "rtrim", "sec_to_time",
    "session_user", "sha", "sha1", "sign", "sin", "soundex", "space", "sqrt",
    "std", "stddev", "strcmp", "subdate", "substring", "substring_index",
    "sum", "sysdate", "system_user", "tan", "time_format", "time_to_sec",
    "to_days", "trim", "ucase", "unique_users", "unix_timestamp", "upper",
    "user", "version", "week", "weekday", "yearweek"
  ]);

  var keywords = wordRegexp([
    "alter", "grant", "revoke", "primary", "key", "table", "start",
    "transaction", "select", "update", "insert", "delete", "create", "describe",
    "from", "into", "values", "where", "join", "inner", "left", "natural", "and",
    "or", "in", "not", "xor", "like", "using", "on", "order", "group", "by",
    "asc", "desc", "limit", "offset", "union", "all", "as", "distinct", "set",
    "commit", "rollback", "replace", "view", "database", "separator", "if",
    "exists", "null", "truncate", "status", "show", "lock", "unique"
  ]);

  var types = wordRegexp([
    "bigint", "binary", "bit", "blob", "bool", "char", "character", "date",
    "datetime", "dec", "decimal", "double", "enum", "float", "float4", "float8",
    "int", "int1", "int2", "int3", "int4", "int8", "integer", "long", "longblob",
    "longtext", "mediumblob", "mediumint", "mediumtext", "middleint", "nchar",
    "numeric", "real", "set", "smallint", "text", "time", "timestamp", "tinyblob",
    "tinyint", "tinytext", "varbinary", "varchar", "year"
  ]);

  var operators = wordRegexp([
    ":=", "<", "<=", "==", "<>", ">", ">=", "like", "rlike", "in", "xor", "between"
  ]);

  var operatorChars = /[*+\-<>=&|:\/]/;

  var tokenizeSql = (function() {
    function normal(source, setState) {
      var ch = source.next();
      if (ch == "@" || ch == "$") {
        source.nextWhileMatches(/[\w\d]/);
        return "sql-var";
      }
      else if (ch == "\"" || ch == "'" || ch == "`") {
        setState(inLiteral(ch));
        return null;
      }
      else if (ch == "," || ch == ";") {
        return "sql-separator"
      }
      else if (ch == '-') {
        if (source.peek() == "-") {
          while (!source.endOfLine()) source.next();
          return "sql-comment";
        }
        else if (/\d/.test(source.peek())) {
          source.nextWhileMatches(/\d/);
          if (source.peek() == '.') {
            source.next();
            source.nextWhileMatches(/\d/);
          }
          return "sql-number";
        }
        else
          return "sql-operator";
      }
      else if (operatorChars.test(ch)) {
        source.nextWhileMatches(operatorChars);
        return "sql-operator";
      }
      else if (/\d/.test(ch)) {
        source.nextWhileMatches(/\d/);
        if (source.peek() == '.') {
          source.next();
          source.nextWhileMatches(/\d/);
        }
        return "sql-number";
      }
      else if (/[()]/.test(ch)) {
        return "sql-punctuation";
      }
      else {
        source.nextWhileMatches(/[_\w\d]/);
        var word = source.get(), type;
        if (operators.test(word))
          type = "sql-operator";
        else if (keywords.test(word))
          type = "sql-keyword";
        else if (functions.test(word))
          type = "sql-function";
        else if (types.test(word))
          type = "sql-type";
        else
          type = "sql-word";
        return {style: type, content: word};
      }
    }

    function inLiteral(quote) {
      return function(source, setState) {
        var escaped = false;
        while (!source.endOfLine()) {
          var ch = source.next();
          if (ch == quote && !escaped) {
            setState(normal);
            break;
          }
          escaped = !escaped && ch == "\\";
        }
        return quote == "`" ? "sql-word" : "sql-literal";
      };
    }

    return function(source, startState) {
      return tokenizer(source, startState || normal);
    };
  })();

  function indentSql(context) {
    return function(nextChars) {
      var firstChar = nextChars && nextChars.charAt(0);
      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.align)
        return context.col - (closing ? context.width : 0);
      else
        return context.indent + (closing ? 0 : indentUnit);
    }
  }

  function parseSql(source) {
    var tokens = tokenizeSql(source);
    var context = null, indent = 0, col = 0;
    function pushContext(type, width, align) {
      context = {prev: context, indent: indent, col: col, type: type, width: width, align: align};
    }
    function popContext() {
      context = context.prev;
    }

    var iter = {
      next: function() {
        var token = tokens.next();
        var type = token.style, content = token.content, width = token.value.length;

        if (content == "\n") {
          token.indentation = indentSql(context);
          indent = col = 0;
          if (context && context.align == null) context.align = false;
        }
        else if (type == "whitespace" && col == 0) {
          indent = width;
        }
        else if (!context && type != "sql-comment") {
          pushContext(";", 0, false);
        }

        if (content != "\n") col += width;

        if (type == "sql-punctuation") {
          if (content == "(")
            pushContext(")", width);
          else if (content == ")")
            popContext();
        }
        else if (type == "sql-separator" && content == ";" && context && !context.prev) {
          popContext();
        }

        return token;
      },

      copy: function() {
        var _context = context, _indent = indent, _col = col, _tokenState = tokens.state;
        return function(source) {
          tokens = tokenizeSql(source, _tokenState);
          context = _context;
          indent = _indent;
          col = _col;
          return iter;
        };
      }
    };
    return iter;
  }

  return {make: parseSql, electricChars: ")"};
})();

/* CodeMirror main module
 *
 * Implements the CodeMirror constructor and prototype, which take care
 * of initializing the editor frame, and providing the outside interface.
 */

// The CodeMirrorConfig object is used to specify a default
// configuration. If you specify such an object before loading this
// file, the values you put into it will override the defaults given
// below. You can also assign to it after loading.
var CodeMirrorConfig = window.CodeMirrorConfig || {};

var CodeMirror = (function(){
  function setDefaults(object, defaults) {
    for (var option in defaults) {
      if (!object.hasOwnProperty(option))
        object[option] = defaults[option];
    }
  }
  function forEach(array, action) {
    for (var i = 0; i < array.length; i++)
      action(array[i]);
  }

  // These default options can be overridden by passing a set of
  // options to a specific CodeMirror constructor. See manual.html for
  // their meaning.
  setDefaults(CodeMirrorConfig, {
    stylesheet: "",
    path: "",
    parserfile: [],
    basefiles: ["util.js", "stringstream.js", "select.js", "undo.js", "editor.js", "tokenize.js"],
    iframeClass: null,
    passDelay: 200,
    passTime: 50,
    lineNumberDelay: 200,
    lineNumberTime: 50,
    continuousScanning: false,
    saveFunction: null,
    onChange: null,
    undoDepth: 50,
    undoDelay: 800,
    disableSpellcheck: true,
    textWrapping: true,
    readOnly: false,
    width: "",
    height: "300px",
    autoMatchParens: false,
    parserConfig: null,
    tabMode: "indent", // or "spaces", "default", "shift"
    reindentOnLoad: false,
    activeTokens: null,
    cursorActivity: null,
    lineNumbers: false,
    indentUnit: 2
  });

  function addLineNumberDiv(container) {
    var nums = document.createElement("DIV"),
        scroller = document.createElement("DIV");
    nums.style.position = "absolute";
    nums.style.height = "100%";
    if (nums.style.setExpression) {
      try {nums.style.setExpression("height", "this.previousSibling.offsetHeight + 'px'");}
      catch(e) {} // Seems to throw 'Not Implemented' on some IE8 versions
    }
    nums.style.top = "0px";
    nums.style.overflow = "hidden";
    container.appendChild(nums);
    scroller.className = "CodeMirror-line-numbers";
    nums.appendChild(scroller);
    return nums;
  }

  function CodeMirror(place, options) {
    // Backward compatibility for deprecated options.
    if (options.dumbTabs) options.tabMode = "spaces";
    else if (options.normalTab) options.tabMode = "default";

    // Use passed options, if any, to override defaults.
    this.options = options = options || {};
    setDefaults(options, CodeMirrorConfig);

    var frame = this.frame = document.createElement("IFRAME");
    if (options.iframeClass) frame.className = options.iframeClass;
    frame.frameBorder = 0;
    frame.src = "javascript:false;";
    frame.style.border = "0";
    frame.style.width = '100%';
    frame.style.height = '100%';
    // display: block occasionally suppresses some Firefox bugs, so we
    // always add it, redundant as it sounds.
    frame.style.display = "block";

    var div = this.wrapping = document.createElement("DIV");
    div.style.position = "relative";
    div.className = "CodeMirror-wrapping";
    div.style.width = options.width;
    div.style.height = options.height;

    if (place.appendChild) place.appendChild(div);
    else place(div);
    div.appendChild(frame);
    if (options.lineNumbers) this.lineNumbers = addLineNumberDiv(div);

    // Link back to this object, so that the editor can fetch options
    // and add a reference to itself.
    frame.CodeMirror = this;
    this.win = frame.contentWindow;

    if (typeof options.parserfile == "string")
      options.parserfile = [options.parserfile];
    if (typeof options.stylesheet == "string")
      options.stylesheet = [options.stylesheet];

    var html = ["<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\"><html><head>"];
    // Hack to work around a bunch of IE8-specific problems.
    html.push("<meta http-equiv=\"X-UA-Compatible\" content=\"IE=EmulateIE7\"/>");
    forEach(options.stylesheet, function(file) {
      html.push("<link rel=\"stylesheet\" type=\"text/css\" href=\"" + file + "\"/>");
    });
    forEach(options.basefiles.concat(options.parserfile), function(file) {
      html.push("<script type=\"text/javascript\" src=\"" + options.path + file + "\"><" + "/script>");
    });
    html.push("</head><body style=\"border-width: 0;\" class=\"editbox\" spellcheck=\"" +
              (options.disableSpellcheck ? "false" : "true") + "\"></body></html>");

    var doc = this.win.document;
    doc.open();
    doc.write(html.join(""));
    doc.close();
  }

  CodeMirror.prototype = {
    init: function() {
      if (this.options.initCallback) this.options.initCallback(this);
      if (this.options.lineNumbers) this.activateLineNumbers();
      if (this.options.reindentOnLoad) this.reindent();
    },

    getCode: function() {return this.editor.getCode();},
    setCode: function(code) {this.editor.importCode(code);},
    selection: function() {this.focusIfIE(); return this.editor.selectedText();},
    reindent: function() {this.editor.reindent();},
    reindentSelection: function() {this.focusIfIE(); this.editor.reindentSelection(null);},

    focusIfIE: function() {
      // in IE, a lot of selection-related functionality only works when the frame is focused
      if (this.win.select.ie_selection) this.focus();
    },
    focus: function() {
      this.win.focus();
      if (this.editor.selectionSnapshot) // IE hack
        this.win.select.setBookmark(this.win.document.body, this.editor.selectionSnapshot);
    },
    replaceSelection: function(text) {
      this.focus();
      this.editor.replaceSelection(text);
      return true;
    },
    replaceChars: function(text, start, end) {
      this.editor.replaceChars(text, start, end);
    },
    getSearchCursor: function(string, fromCursor, caseFold) {
      return this.editor.getSearchCursor(string, fromCursor, caseFold);
    },

    undo: function() {this.editor.history.undo();},
    redo: function() {this.editor.history.redo();},
    historySize: function() {return this.editor.history.historySize();},
    clearHistory: function() {this.editor.history.clear();},

    grabKeys: function(callback, filter) {this.editor.grabKeys(callback, filter);},
    ungrabKeys: function() {this.editor.ungrabKeys();},

    setParser: function(name) {this.editor.setParser(name);},
    setSpellcheck: function(on) {this.win.document.body.spellcheck = on;},
    setTextWrapping: function(on) {
      if (on == this.options.textWrapping) return;
      this.win.document.body.style.whiteSpace = on ? "" : "nowrap";
      this.options.textWrapping = on;
      if (this.lineNumbers) {
        this.setLineNumbers(false);
        this.setLineNumbers(true);
      }
    },
    setIndentUnit: function(unit) {this.win.indentUnit = unit;},
    setUndoDepth: function(depth) {this.editor.history.maxDepth = depth;},
    setTabMode: function(mode) {this.options.tabMode = mode;},
    setLineNumbers: function(on) {
      if (on && !this.lineNumbers) {
        this.lineNumbers = addLineNumberDiv(this.wrapping);
        this.activateLineNumbers();
      }
      else if (!on && this.lineNumbers) {
        this.wrapping.removeChild(this.lineNumbers);
        this.wrapping.style.marginLeft = "";
        this.lineNumbers = null;
      }
    },

    cursorPosition: function(start) {this.focusIfIE(); return this.editor.cursorPosition(start);},
    firstLine: function() {return this.editor.firstLine();},
    lastLine: function() {return this.editor.lastLine();},
    nextLine: function(line) {return this.editor.nextLine(line);},
    prevLine: function(line) {return this.editor.prevLine(line);},
    lineContent: function(line) {return this.editor.lineContent(line);},
    setLineContent: function(line, content) {this.editor.setLineContent(line, content);},
    removeLine: function(line){this.editor.removeLine(line);},
    insertIntoLine: function(line, position, content) {this.editor.insertIntoLine(line, position, content);},
    selectLines: function(startLine, startOffset, endLine, endOffset) {
      this.win.focus();
      this.editor.selectLines(startLine, startOffset, endLine, endOffset);
    },
    nthLine: function(n) {
      var line = this.firstLine();
      for (; n > 1 && line !== false; n--)
        line = this.nextLine(line);
      return line;
    },
    lineNumber: function(line) {
      var num = 0;
      while (line !== false) {
        num++;
        line = this.prevLine(line);
      }
      return num;
    },

    // Old number-based line interface
    jumpToLine: function(n) {
      this.selectLines(this.nthLine(n), 0);
      this.win.focus();
    },
    currentLine: function() {
      return this.lineNumber(this.cursorPosition().line);
    },

    activateLineNumbers: function() {
      var frame = this.frame, win = frame.contentWindow, doc = win.document, body = doc.body,
          nums = this.lineNumbers, scroller = nums.firstChild, self = this;
      var barWidth = null;

      function sizeBar() {
        if (frame.offsetWidth == 0) return;
        for (var root = frame; root.parentNode; root = root.parentNode);
        if (!nums.parentNode || root != document || !win.Editor) {
          // Clear event handlers (their nodes might already be collected, so try/catch)
          try{clear();}catch(e){}
          clearInterval(sizeInterval);
          return;
        }

        if (nums.offsetWidth != barWidth) {
          barWidth = nums.offsetWidth;
          nums.style.left = "-" + (frame.parentNode.style.marginLeft = barWidth + "px");
        }
      }
      function doScroll() {
        nums.scrollTop = body.scrollTop || doc.documentElement.scrollTop || 0;
      }
      // Cleanup function, registered by nonWrapping and wrapping.
      var clear = function(){};
      sizeBar();
      var sizeInterval = setInterval(sizeBar, 500);

      function nonWrapping() {
        var nextNum = 1;
        function update() {
          var target = 50 + Math.max(body.offsetHeight, frame.offsetHeight);
          while (scroller.offsetHeight < target && (!scroller.firstChild || scroller.offsetHeight)) {
            scroller.appendChild(document.createElement("DIV"));
            scroller.lastChild.innerHTML = nextNum++;
          }
          doScroll();
        }
        var onScroll = win.addEventHandler(win, "scroll", update, true),
            onResize = win.addEventHandler(win, "resize", update, true);
        clear = function(){onScroll(); onResize();};
        update();
      }
      function wrapping() {
        var node, lineNum, next, pos;

        function addNum(n) {
          if (!lineNum) lineNum = scroller.appendChild(document.createElement("DIV"));
          lineNum.innerHTML = n;
          pos = lineNum.offsetHeight + lineNum.offsetTop;
          lineNum = lineNum.nextSibling;
        }
        function work() {
          if (!scroller.parentNode || scroller.parentNode != self.lineNumbers) return;

          var endTime = new Date().getTime() + self.options.lineNumberTime;
          while (node) {
            addNum(next++);
            for (; node && !win.isBR(node); node = node.nextSibling) {
              var bott = node.offsetTop + node.offsetHeight;
              while (scroller.offsetHeight && bott - 3 > pos) addNum("&nbsp;");
            }
            if (node) node = node.nextSibling;
            if (new Date().getTime() > endTime) {
              pending = setTimeout(work, self.options.lineNumberDelay);
              return;
            }
          }
          // While there are un-processed number DIVs, or the scroller is smaller than the frame...
          var target = 50 + Math.max(body.offsetHeight, frame.offsetHeight);
          while (lineNum || (scroller.offsetHeight < target && (!scroller.firstChild || scroller.offsetHeight)))
            addNum(next++);
          doScroll();
        }
        function start() {
          doScroll();
          node = body.firstChild;
          lineNum = scroller.firstChild;
          pos = 0;
          next = 1;
          work();
        }

        start();
        var pending = null;
        function update() {
          if (pending) clearTimeout(pending);
          if (self.editor.allClean()) start();
          else pending = setTimeout(update, 200);
        }
        self.updateNumbers = update;
        var onScroll = win.addEventHandler(win, "scroll", doScroll, true),
            onResize = win.addEventHandler(win, "resize", update, true);
        clear = function(){
          if (pending) clearTimeout(pending);
          if (self.updateNumbers == update) self.updateNumbers = null;
          onScroll();
          onResize();
        };
      }
      (this.options.textWrapping ? wrapping : nonWrapping)();
    }
  };

  CodeMirror.InvalidLineHandle = {toString: function(){return "CodeMirror.InvalidLineHandle";}};

  CodeMirror.replace = function(element) {
    if (typeof element == "string")
      element = document.getElementById(element);
    return function(newElement) {
      element.parentNode.replaceChild(newElement, element);
    };
  };

  CodeMirror.fromTextArea = function(area, options) {
    if (typeof area == "string")
      area = document.getElementById(area);

    options = options || {};
    if (area.style.width && options.width == null)
      options.width = area.style.width;
    if (area.style.height && options.height == null)
      options.height = area.style.height;
    if (options.content == null) options.content = area.value;

    if (area.form) {
      function updateField() {
        area.value = mirror.getCode();
      }
      if (typeof area.form.addEventListener == "function")
        area.form.addEventListener("submit", updateField, false);
      else
        area.form.attachEvent("onsubmit", updateField);
    }

    function insert(frame) {
      if (area.nextSibling)
        area.parentNode.insertBefore(frame, area.nextSibling);
      else
        area.parentNode.appendChild(frame);
    }

    area.style.display = "none";
    var mirror = new CodeMirror(insert, options);
    return mirror;
  };

  CodeMirror.isProbablySupported = function() {
    // This is rather awful, but can be useful.
    var match;
    if (window.opera)
      return Number(window.opera.version()) >= 9.52;
    else if (/Apple Computers, Inc/.test(navigator.vendor) && (match = navigator.userAgent.match(/Version\/(\d+(?:\.\d+)?)\./)))
      return Number(match[1]) >= 3;
    else if (document.selection && window.ActiveXObject && (match = navigator.userAgent.match(/MSIE (\d+(?:\.\d*)?)\b/)))
      return Number(match[1]) >= 6;
    else if (match = navigator.userAgent.match(/gecko\/(\d{8})/i))
      return Number(match[1]) >= 20050901;
    else if (match = navigator.userAgent.match(/AppleWebKit\/(\d+)/))
      return Number(match[1]) >= 525;
    else
      return null;
  };

  return CodeMirror;
})();

/* The Editor object manages the content of the editable frame. It
 * catches events, colours nodes, and indents lines. This file also
 * holds some functions for transforming arbitrary DOM structures into
 * plain sequences of <span> and <br> elements
 */

var internetExplorer = document.selection && window.ActiveXObject && /MSIE/.test(navigator.userAgent);
var webkit = /AppleWebKit/.test(navigator.userAgent);
var safari = /Apple Computers, Inc/.test(navigator.vendor);
var gecko = /gecko\/(\d{8})/i.test(navigator.userAgent);

// Make sure a string does not contain two consecutive 'collapseable'
// whitespace characters.
function makeWhiteSpace(n) {
  var buffer = [], nb = true;
  for (; n > 0; n--) {
    buffer.push((nb || n == 1) ? nbsp : " ");
    nb = !nb;
  }
  return buffer.join("");
}

// Create a set of white-space characters that will not be collapsed
// by the browser, but will not break text-wrapping either.
function fixSpaces(string) {
  if (string.charAt(0) == " ") string = nbsp + string.slice(1);
  return string.replace(/\t/g, function(){return makeWhiteSpace(indentUnit);})
    .replace(/[ \u00a0]{2,}/g, function(s) {return makeWhiteSpace(s.length);});
}

function cleanText(text) {
  return text.replace(/\u00a0/g, " ").replace(/\u200b/g, "");
}

// Create a SPAN node with the expected properties for document part
// spans.
function makePartSpan(value, doc) {
  var text = value;
  if (value.nodeType == 3) text = value.nodeValue;
  else value = doc.createTextNode(text);

  var span = doc.createElement("SPAN");
  span.isPart = true;
  span.appendChild(value);
  span.currentText = text;
  return span;
}

// On webkit, when the last BR of the document does not have text
// behind it, the cursor can not be put on the line after it. This
// makes pressing enter at the end of the document occasionally do
// nothing (or at least seem to do nothing). To work around it, this
// function makes sure the document ends with a span containing a
// zero-width space character. The traverseDOM iterator filters such
// character out again, so that the parsers won't see them. This
// function is called from a few strategic places to make sure the
// zwsp is restored after the highlighting process eats it.
var webkitLastLineHack = webkit ?
  function(container) {
    var last = container.lastChild;
    if (!last || !last.isPart || last.textContent != "\u200b")
      container.appendChild(makePartSpan("\u200b", container.ownerDocument));
  } : function() {};

var Editor = (function(){
  // The HTML elements whose content should be suffixed by a newline
  // when converting them to flat text.
  var newlineElements = {"P": true, "DIV": true, "LI": true};

  function asEditorLines(string) {
    var tab = makeWhiteSpace(indentUnit);
    return map(string.replace(/\t/g, tab).replace(/\u00a0/g, " ").replace(/\r\n?/g, "\n").split("\n"), fixSpaces);
  }

  // Helper function for traverseDOM. Flattens an arbitrary DOM node
  // into an array of textnodes and <br> tags.
  function simplifyDOM(root, atEnd) {
    var doc = root.ownerDocument;
    var result = [];
    var leaving = true;

    function simplifyNode(node, top) {
      if (node.nodeType == 3) {
        var text = node.nodeValue = fixSpaces(node.nodeValue.replace(/[\r\u200b]/g, "").replace(/\n/g, " "));
        if (text.length) leaving = false;
        result.push(node);
      }
      else if (isBR(node) && node.childNodes.length == 0) {
        leaving = true;
        result.push(node);
      }
      else {
        forEach(node.childNodes, simplifyNode);
        if (!leaving && newlineElements.hasOwnProperty(node.nodeName.toUpperCase())) {
          leaving = true;
          if (!atEnd || !top)
            result.push(doc.createElement("BR"));
        }
      }
    }

    simplifyNode(root, true);
    return result;
  }

  // Creates a MochiKit-style iterator that goes over a series of DOM
  // nodes. The values it yields are strings, the textual content of
  // the nodes. It makes sure that all nodes up to and including the
  // one whose text is being yielded have been 'normalized' to be just
  // <span> and <br> elements.
  // See the story.html file for some short remarks about the use of
  // continuation-passing style in this iterator.
  function traverseDOM(start){
    function _yield(value, c){cc = c; return value;}
    function push(fun, arg, c){return function(){return fun(arg, c);};}
    function stop(){cc = stop; throw StopIteration;};
    var cc = push(scanNode, start, stop);
    var owner = start.ownerDocument;
    var nodeQueue = [];

    // Create a function that can be used to insert nodes after the
    // one given as argument.
    function pointAt(node){
      var parent = node.parentNode;
      var next = node.nextSibling;
      return function(newnode) {
        parent.insertBefore(newnode, next);
      };
    }
    var point = null;

    // This an Opera-specific hack -- always insert an empty span
    // between two BRs, because Opera's cursor code gets terribly
    // confused when the cursor is between two BRs.
    var afterBR = true;

    // Insert a normalized node at the current point. If it is a text
    // node, wrap it in a <span>, and give that span a currentText
    // property -- this is used to cache the nodeValue, because
    // directly accessing nodeValue is horribly slow on some browsers.
    // The dirty property is used by the highlighter to determine
    // which parts of the document have to be re-highlighted.
    function insertPart(part){
      var text = "\n";
      if (part.nodeType == 3) {
        select.snapshotChanged();
        part = makePartSpan(part, owner);
        text = part.currentText;
        afterBR = false;
      }
      else {
        if (afterBR && window.opera)
          point(makePartSpan("", owner));
        afterBR = true;
      }
      part.dirty = true;
      nodeQueue.push(part);
      point(part);
      return text;
    }

    // Extract the text and newlines from a DOM node, insert them into
    // the document, and yield the textual content. Used to replace
    // non-normalized nodes.
    function writeNode(node, c, end) {
      var toYield = [];
      forEach(simplifyDOM(node, end), function(part) {
        toYield.push(insertPart(part));
      });
      return _yield(toYield.join(""), c);
    }

    // Check whether a node is a normalized <span> element.
    function partNode(node){
      if (node.isPart && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
        node.currentText = node.firstChild.nodeValue;
        return !/[\n\t\r]/.test(node.currentText);
      }
      return false;
    }

    // Handle a node. Add its successor to the continuation if there
    // is one, find out whether the node is normalized. If it is,
    // yield its content, otherwise, normalize it (writeNode will take
    // care of yielding).
    function scanNode(node, c){
      if (node.nextSibling)
        c = push(scanNode, node.nextSibling, c);

      if (partNode(node)){
        nodeQueue.push(node);
        afterBR = false;
        return _yield(node.currentText, c);
      }
      else if (isBR(node)) {
        if (afterBR && window.opera)
          node.parentNode.insertBefore(makePartSpan("", owner), node);
        nodeQueue.push(node);
        afterBR = true;
        return _yield("\n", c);
      }
      else {
        var end = !node.nextSibling;
        point = pointAt(node);
        removeElement(node);
        return writeNode(node, c, end);
      }
    }

    // MochiKit iterators are objects with a next function that
    // returns the next value or throws StopIteration when there are
    // no more values.
    return {next: function(){return cc();}, nodes: nodeQueue};
  }

  // Determine the text size of a processed node.
  function nodeSize(node) {
    return isBR(node) ? 1 : node.currentText.length;
  }

  // Search backwards through the top-level nodes until the next BR or
  // the start of the frame.
  function startOfLine(node) {
    while (node && !isBR(node)) node = node.previousSibling;
    return node;
  }
  function endOfLine(node, container) {
    if (!node) node = container.firstChild;
    else if (isBR(node)) node = node.nextSibling;

    while (node && !isBR(node)) node = node.nextSibling;
    return node;
  }

  function time() {return new Date().getTime();}

  // Client interface for searching the content of the editor. Create
  // these by calling CodeMirror.getSearchCursor. To use, call
  // findNext on the resulting object -- this returns a boolean
  // indicating whether anything was found, and can be called again to
  // skip to the next find. Use the select and replace methods to
  // actually do something with the found locations.
  function SearchCursor(editor, string, fromCursor, caseFold) {
    this.editor = editor;
    this.caseFold = caseFold;
    if (caseFold) string = string.toLowerCase();
    this.history = editor.history;
    this.history.commit();

    // Are we currently at an occurrence of the search string?
    this.atOccurrence = false;
    // The object stores a set of nodes coming after its current
    // position, so that when the current point is taken out of the
    // DOM tree, we can still try to continue.
    this.fallbackSize = 15;
    var cursor;
    // Start from the cursor when specified and a cursor can be found.
    if (fromCursor && (cursor = select.cursorPos(this.editor.container))) {
      this.line = cursor.node;
      this.offset = cursor.offset;
    }
    else {
      this.line = null;
      this.offset = 0;
    }
    this.valid = !!string;

    // Create a matcher function based on the kind of string we have.
    var target = string.split("\n"), self = this;
    this.matches = (target.length == 1) ?
      // For one-line strings, searching can be done simply by calling
      // indexOf on the current line.
      function() {
        var line = cleanText(self.history.textAfter(self.line).slice(self.offset));
        var match = (self.caseFold ? line.toLowerCase() : line).indexOf(string);
        if (match > -1)
          return {from: {node: self.line, offset: self.offset + match},
                  to: {node: self.line, offset: self.offset + match + string.length}};
      } :
      // Multi-line strings require internal iteration over lines, and
      // some clunky checks to make sure the first match ends at the
      // end of the line and the last match starts at the start.
      function() {
        var firstLine = cleanText(self.history.textAfter(self.line).slice(self.offset));
        var match = (self.caseFold ? firstLine.toLowerCase() : firstLine).lastIndexOf(target[0]);
        if (match == -1 || match != firstLine.length - target[0].length)
          return false;
        var startOffset = self.offset + match;

        var line = self.history.nodeAfter(self.line);
        for (var i = 1; i < target.length - 1; i++) {
          var lineText = cleanText(self.history.textAfter(line));
          if ((self.caseFold ? lineText.toLowerCase() : lineText) != target[i])
            return false;
          line = self.history.nodeAfter(line);
        }

        var lastLine = cleanText(self.history.textAfter(line));
        if ((self.caseFold ? lastLine.toLowerCase() : lastLine).indexOf(target[target.length - 1]) != 0)
          return false;

        return {from: {node: self.line, offset: startOffset},
                to: {node: line, offset: target[target.length - 1].length}};
      };
  }

  SearchCursor.prototype = {
    findNext: function() {
      if (!this.valid) return false;
      this.atOccurrence = false;
      var self = this;

      // Go back to the start of the document if the current line is
      // no longer in the DOM tree.
      if (this.line && !this.line.parentNode) {
        this.line = null;
        this.offset = 0;
      }

      // Set the cursor's position one character after the given
      // position.
      function saveAfter(pos) {
        if (self.history.textAfter(pos.node).length > pos.offset) {
          self.line = pos.node;
          self.offset = pos.offset + 1;
        }
        else {
          self.line = self.history.nodeAfter(pos.node);
          self.offset = 0;
        }
      }

      while (true) {
        var match = this.matches();
        // Found the search string.
        if (match) {
          this.atOccurrence = match;
          saveAfter(match.from);
          return true;
        }
        this.line = this.history.nodeAfter(this.line);
        this.offset = 0;
        // End of document.
        if (!this.line) {
          this.valid = false;
          return false;
        }
      }
    },

    select: function() {
      if (this.atOccurrence) {
        select.setCursorPos(this.editor.container, this.atOccurrence.from, this.atOccurrence.to);
        select.scrollToCursor(this.editor.container);
      }
    },

    replace: function(string) {
      if (this.atOccurrence) {
        var end = this.editor.replaceRange(this.atOccurrence.from, this.atOccurrence.to, string);
        this.line = end.node;
        this.offset = end.offset;
        this.atOccurrence = false;
      }
    }
  };

  // The Editor object is the main inside-the-iframe interface.
  function Editor(options) {
    this.options = options;
    window.indentUnit = options.indentUnit;
    this.parent = parent;
    this.doc = document;
    var container = this.container = this.doc.body;
    this.win = window;
    this.history = new History(container, options.undoDepth, options.undoDelay, this);
    var self = this;

    if (!Editor.Parser)
      throw "No parser loaded.";
    if (options.parserConfig && Editor.Parser.configure)
      Editor.Parser.configure(options.parserConfig);

    if (!options.readOnly)
      select.setCursorPos(container, {node: null, offset: 0});

    this.dirty = [];
    this.importCode(options.content || "");
    this.history.onChange = options.onChange;

    if (!options.readOnly) {
      if (options.continuousScanning !== false) {
        this.scanner = this.documentScanner(options.passTime);
        this.delayScanning();
      }

      function setEditable() {
        // In IE, designMode frames can not run any scripts, so we use
        // contentEditable instead.
        if (document.body.contentEditable != undefined && internetExplorer)
          document.body.contentEditable = "true";
        else
          document.designMode = "on";

        document.documentElement.style.borderWidth = "0";
        if (!options.textWrapping)
          container.style.whiteSpace = "nowrap";
      }

      // If setting the frame editable fails, try again when the user
      // focus it (happens when the frame is not visible on
      // initialisation, in Firefox).
      try {
        setEditable();
      }
      catch(e) {
        var focusEvent = addEventHandler(document, "focus", function() {
          focusEvent();
          setEditable();
        }, true);
      }

      addEventHandler(document, "keydown", method(this, "keyDown"));
      addEventHandler(document, "keypress", method(this, "keyPress"));
      addEventHandler(document, "keyup", method(this, "keyUp"));

      function cursorActivity() {self.cursorActivity(false);}
      addEventHandler(document.body, "mouseup", cursorActivity);
      addEventHandler(document.body, "cut", cursorActivity);

      // workaround for a gecko bug [?] where going forward and then
      // back again breaks designmode (no more cursor)
      if (gecko)
        addEventHandler(this.win, "pagehide", function(){self.unloaded = true;});

      addEventHandler(document.body, "paste", function(event) {
        cursorActivity();
        var text = null;
        try {
          var clipboardData = event.clipboardData || window.clipboardData;
          if (clipboardData) text = clipboardData.getData('Text');
        }
        catch(e) {}
        if (text !== null) {
          event.stop();
          self.replaceSelection(text);
          select.scrollToCursor(self.container);
        }
      });

      if (this.options.autoMatchParens)
        addEventHandler(document.body, "click", method(this, "scheduleParenHighlight"));
    }
    else if (!options.textWrapping) {
      container.style.whiteSpace = "nowrap";
    }
  }

  function isSafeKey(code) {
    return (code >= 16 && code <= 18) || // shift, control, alt
           (code >= 33 && code <= 40); // arrows, home, end
  }

  Editor.prototype = {
    // Import a piece of code into the editor.
    importCode: function(code) {
      this.history.push(null, null, asEditorLines(code));
      this.history.reset();
    },

    // Extract the code from the editor.
    getCode: function() {
      if (!this.container.firstChild)
        return "";

      var accum = [];
      select.markSelection(this.win);
      forEach(traverseDOM(this.container.firstChild), method(accum, "push"));
      webkitLastLineHack(this.container);
      select.selectMarked();
      return cleanText(accum.join(""));
    },

    checkLine: function(node) {
      if (node === false || !(node == null || node.parentNode == this.container))
        throw parent.CodeMirror.InvalidLineHandle;
    },

    cursorPosition: function(start) {
      if (start == null) start = true;
      var pos = select.cursorPos(this.container, start);
      if (pos) return {line: pos.node, character: pos.offset};
      else return {line: null, character: 0};
    },

    firstLine: function() {
      return null;
    },

    lastLine: function() {
      if (this.container.lastChild) return startOfLine(this.container.lastChild);
      else return null;
    },

    nextLine: function(line) {
      this.checkLine(line);
      var end = endOfLine(line, this.container);
      return end || false;
    },

    prevLine: function(line) {
      this.checkLine(line);
      if (line == null) return false;
      return startOfLine(line.previousSibling);
    },

    selectLines: function(startLine, startOffset, endLine, endOffset) {
      this.checkLine(startLine);
      var start = {node: startLine, offset: startOffset}, end = null;
      if (endOffset !== undefined) {
        this.checkLine(endLine);
        end = {node: endLine, offset: endOffset};
      }
      select.setCursorPos(this.container, start, end);
      select.scrollToCursor(this.container);
    },

    lineContent: function(line) {
      var accum = [];
      for (line = line ? line.nextSibling : this.container.firstChild;
           line && !isBR(line); line = line.nextSibling)
        accum.push(nodeText(line));
      return cleanText(accum.join(""));
    },

    setLineContent: function(line, content) {
      this.history.commit();
      this.replaceRange({node: line, offset: 0},
                        {node: line, offset: this.history.textAfter(line).length},
                        content);
      this.addDirtyNode(line);
      this.scheduleHighlight();
    },

    removeLine: function(line) {
      var node = line ? line.nextSibling : this.container.firstChild;
      while (node) {
        var next = node.nextSibling;
        removeElement(node);
        if (isBR(node)) break;
        node = next;
      }
      this.addDirtyNode(line);
      this.scheduleHighlight();
    },

    insertIntoLine: function(line, position, content) {
      var before = null;
      if (position == "end") {
        before = endOfLine(line, this.container);
      }
      else {
        for (var cur = line ? line.nextSibling : this.container.firstChild; cur; cur = cur.nextSibling) {
          if (position == 0) {
            before = cur;
            break;
          }
          var text = nodeText(cur);
          if (text.length > position) {
            before = cur.nextSibling;
            content = text.slice(0, position) + content + text.slice(position);
            removeElement(cur);
            break;
          }
          position -= text.length;
        }
      }

      var lines = asEditorLines(content), doc = this.container.ownerDocument;
      for (var i = 0; i < lines.length; i++) {
        if (i > 0) this.container.insertBefore(doc.createElement("BR"), before);
        this.container.insertBefore(makePartSpan(lines[i], doc), before);
      }
      this.addDirtyNode(line);
      this.scheduleHighlight();
    },

    // Retrieve the selected text.
    selectedText: function() {
      var h = this.history;
      h.commit();

      var start = select.cursorPos(this.container, true),
          end = select.cursorPos(this.container, false);
      if (!start || !end) return "";

      if (start.node == end.node)
        return h.textAfter(start.node).slice(start.offset, end.offset);

      var text = [h.textAfter(start.node).slice(start.offset)];
      for (var pos = h.nodeAfter(start.node); pos != end.node; pos = h.nodeAfter(pos))
        text.push(h.textAfter(pos));
      text.push(h.textAfter(end.node).slice(0, end.offset));
      return cleanText(text.join("\n"));
    },

    // Replace the selection with another piece of text.
    replaceSelection: function(text) {
      this.history.commit();

      var start = select.cursorPos(this.container, true),
          end = select.cursorPos(this.container, false);
      if (!start || !end) return;

      end = this.replaceRange(start, end, text);
      select.setCursorPos(this.container, end);
      webkitLastLineHack(this.container);
    },

    reroutePasteEvent: function() {
      if (this.capturingPaste || window.opera) return;
      this.capturingPaste = true;
      var te = parent.document.createElement("TEXTAREA");
      te.style.position = "absolute";
      te.style.left = "-10000px";
      te.style.width = "10px";
      te.style.top = nodeTop(frameElement) + "px";
      var wrap = window.frameElement.CodeMirror.wrapping;
      wrap.parentNode.insertBefore(te, wrap);
      parent.focus();
      te.focus();

      var self = this;
      this.parent.setTimeout(function() {
        self.capturingPaste = false;
        self.win.focus();
        if (self.selectionSnapshot) // IE hack
          self.win.select.setBookmark(self.container, self.selectionSnapshot);
        var text = te.value;
        if (text) {
          self.replaceSelection(text);
          select.scrollToCursor(self.container);
        }
        removeElement(te);
      }, 10);
    },

    replaceRange: function(from, to, text) {
      var lines = asEditorLines(text);
      lines[0] = this.history.textAfter(from.node).slice(0, from.offset) + lines[0];
      var lastLine = lines[lines.length - 1];
      lines[lines.length - 1] = lastLine + this.history.textAfter(to.node).slice(to.offset);
      var end = this.history.nodeAfter(to.node);
      this.history.push(from.node, end, lines);
      return {node: this.history.nodeBefore(end),
              offset: lastLine.length};
    },

    getSearchCursor: function(string, fromCursor, caseFold) {
      return new SearchCursor(this, string, fromCursor, caseFold);
    },

    // Re-indent the whole buffer
    reindent: function() {
      if (this.container.firstChild)
        this.indentRegion(null, this.container.lastChild);
    },

    reindentSelection: function(direction) {
      if (!select.somethingSelected(this.win)) {
        this.indentAtCursor(direction);
      }
      else {
        var start = select.selectionTopNode(this.container, true),
            end = select.selectionTopNode(this.container, false);
        if (start === false || end === false) return;
        this.indentRegion(start, end, direction);
      }
    },

    grabKeys: function(eventHandler, filter) {
      this.frozen = eventHandler;
      this.keyFilter = filter;
    },
    ungrabKeys: function() {
      this.frozen = "leave";
      this.keyFilter = null;
    },

    setParser: function(name) {
      Editor.Parser = window[name];
      if (this.container.firstChild) {
        forEach(this.container.childNodes, function(n) {
          if (n.nodeType != 3) n.dirty = true;
        });
        this.addDirtyNode(this.firstChild);
        this.scheduleHighlight();
      }
    },

    // Intercept enter and tab, and assign their new functions.
    keyDown: function(event) {
      if (this.frozen == "leave") this.frozen = null;
      if (this.frozen && (!this.keyFilter || this.keyFilter(event.keyCode))) {
        event.stop();
        this.frozen(event);
        return;
      }

      var code = event.keyCode;
      // Don't scan when the user is typing.
      this.delayScanning();
      // Schedule a paren-highlight event, if configured.
      if (this.options.autoMatchParens)
        this.scheduleParenHighlight();

      // The various checks for !altKey are there because AltGr sets both
      // ctrlKey and altKey to true, and should not be recognised as
      // Control.
      if (code == 13) { // enter
        if (event.ctrlKey && !event.altKey) {
          this.reparseBuffer();
        }
        else {
          select.insertNewlineAtCursor(this.win);
          this.indentAtCursor();
          select.scrollToCursor(this.container);
        }
        event.stop();
      }
      else if (code == 9 && this.options.tabMode != "default" && !event.ctrlKey) { // tab
        this.handleTab(!event.shiftKey);
        event.stop();
      }
      else if (code == 32 && event.shiftKey && this.options.tabMode == "default") { // space
        this.handleTab(true);
        event.stop();
      }
      else if (code == 36 && !event.shiftKey && !event.ctrlKey) { // home
        if (this.home()) event.stop();
      }
      else if (code == 35 && !event.shiftKey && !event.ctrlKey) { // end
        if (this.end()) event.stop();
      }
      else if ((code == 219 || code == 221) && event.ctrlKey && !event.altKey) { // [, ]
        this.highlightParens(event.shiftKey, true);
        event.stop();
      }
      else if (event.metaKey && !event.shiftKey && (code == 37 || code == 39)) { // Meta-left/right
        var cursor = select.selectionTopNode(this.container);
        if (cursor === false || !this.container.firstChild) return;

        if (code == 37) select.focusAfterNode(startOfLine(cursor), this.container);
        else {
          var end = endOfLine(cursor, this.container);
          select.focusAfterNode(end ? end.previousSibling : this.container.lastChild, this.container);
        }
        event.stop();
      }
      else if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        if ((event.shiftKey && code == 90) || code == 89) { // shift-Z, Y
          select.scrollToNode(this.history.redo());
          event.stop();
        }
        else if (code == 90 || (safari && code == 8)) { // Z, backspace
          select.scrollToNode(this.history.undo());
          event.stop();
        }
        else if (code == 83 && this.options.saveFunction) { // S
          this.options.saveFunction();
          event.stop();
        }
        else if (internetExplorer && code == 86) {
          this.reroutePasteEvent();
        }
      }
    },

    // Check for characters that should re-indent the current line,
    // and prevent Opera from handling enter and tab anyway.
    keyPress: function(event) {
      var electric = Editor.Parser.electricChars, self = this;
      // Hack for Opera, and Firefox on OS X, in which stopping a
      // keydown event does not prevent the associated keypress event
      // from happening, so we have to cancel enter and tab again
      // here.
      if ((this.frozen && (!this.keyFilter || this.keyFilter(event.keyCode))) ||
          event.code == 13 || (event.code == 9 && this.options.tabMode != "default") ||
          (event.keyCode == 32 && event.shiftKey && this.options.tabMode == "default"))
        event.stop();
      else if (electric && electric.indexOf(event.character) != -1)
        this.parent.setTimeout(function(){self.indentAtCursor(null);}, 0);
      else if ((event.character == "v" || event.character == "V")
               && (event.ctrlKey || event.metaKey) && !event.altKey) // ctrl-V
        this.reroutePasteEvent();
    },

    // Mark the node at the cursor dirty when a non-safe key is
    // released.
    keyUp: function(event) {
      this.cursorActivity(isSafeKey(event.keyCode));
    },

    // Indent the line following a given <br>, or null for the first
    // line. If given a <br> element, this must have been highlighted
    // so that it has an indentation method. Returns the whitespace
    // element that has been modified or created (if any).
    indentLineAfter: function(start, direction) {
      // whiteSpace is the whitespace span at the start of the line,
      // or null if there is no such node.
      var whiteSpace = start ? start.nextSibling : this.container.firstChild;
      if (whiteSpace && !hasClass(whiteSpace, "whitespace"))
        whiteSpace = null;

      // Sometimes the start of the line can influence the correct
      // indentation, so we retrieve it.
      var firstText = whiteSpace ? whiteSpace.nextSibling : (start ? start.nextSibling : this.container.firstChild);
      var nextChars = (start && firstText && firstText.currentText) ? firstText.currentText : "";

      // Ask the lexical context for the correct indentation, and
      // compute how much this differs from the current indentation.
      var newIndent = 0, curIndent = whiteSpace ? whiteSpace.currentText.length : 0;
      if (direction != null && this.options.tabMode == "shift")
        newIndent = direction ? curIndent + indentUnit : Math.max(0, curIndent - indentUnit)
      else if (start)
        newIndent = start.indentation(nextChars, curIndent, direction);
      else if (Editor.Parser.firstIndentation)
        newIndent = Editor.Parser.firstIndentation(nextChars, curIndent, direction);
      var indentDiff = newIndent - curIndent;

      // If there is too much, this is just a matter of shrinking a span.
      if (indentDiff < 0) {
        if (newIndent == 0) {
          if (firstText) select.snapshotMove(whiteSpace.firstChild, firstText.firstChild, 0);
          removeElement(whiteSpace);
          whiteSpace = null;
        }
        else {
          select.snapshotMove(whiteSpace.firstChild, whiteSpace.firstChild, indentDiff, true);
          whiteSpace.currentText = makeWhiteSpace(newIndent);
          whiteSpace.firstChild.nodeValue = whiteSpace.currentText;
        }
      }
      // Not enough...
      else if (indentDiff > 0) {
        // If there is whitespace, we grow it.
        if (whiteSpace) {
          whiteSpace.currentText = makeWhiteSpace(newIndent);
          whiteSpace.firstChild.nodeValue = whiteSpace.currentText;
        }
        // Otherwise, we have to add a new whitespace node.
        else {
          whiteSpace = makePartSpan(makeWhiteSpace(newIndent), this.doc);
          whiteSpace.className = "whitespace";
          if (start) insertAfter(whiteSpace, start);
          else this.container.insertBefore(whiteSpace, this.container.firstChild);
        }
        if (firstText) select.snapshotMove(firstText.firstChild, whiteSpace.firstChild, curIndent, false, true);
      }
      if (indentDiff != 0) this.addDirtyNode(start);
      return whiteSpace;
    },

    // Re-highlight the selected part of the document.
    highlightAtCursor: function() {
      var pos = select.selectionTopNode(this.container, true);
      var to = select.selectionTopNode(this.container, false);
      if (pos === false || to === false) return false;

      select.markSelection(this.win);
      if (this.highlight(pos, endOfLine(to, this.container), true, 20) === false)
        return false;
      select.selectMarked();
      return true;
    },

    // When tab is pressed with text selected, the whole selection is
    // re-indented, when nothing is selected, the line with the cursor
    // is re-indented.
    handleTab: function(direction) {
      if (this.options.tabMode == "spaces")
        select.insertTabAtCursor(this.win);
      else
        this.reindentSelection(direction);
    },

    // Custom home behaviour that doesn't land the cursor in front of
    // leading whitespace unless pressed twice.
    home: function() {
      var cur = select.selectionTopNode(this.container, true), start = cur;
      if (cur === false || !(!cur || cur.isPart || isBR(cur)) || !this.container.firstChild)
        return false;

      while (cur && !isBR(cur)) cur = cur.previousSibling;
      var next = cur ? cur.nextSibling : this.container.firstChild;
      if (next && next != start && next.isPart && hasClass(next, "whitespace"))
        select.focusAfterNode(next, this.container);
      else
        select.focusAfterNode(cur, this.container);

      select.scrollToCursor(this.container);
      return true;
    },

    // Some browsers (Opera) don't manage to handle the end key
    // properly in the face of vertical scrolling.
    end: function() {
      var cur = select.selectionTopNode(this.container, true);
      if (cur === false) return false;
      cur = endOfLine(cur, this.container);
      if (!cur) return false;
      select.focusAfterNode(cur.previousSibling, this.container);
      select.scrollToCursor(this.container);
      return true;
    },

    // Delay (or initiate) the next paren highlight event.
    scheduleParenHighlight: function() {
      if (this.parenEvent) this.parent.clearTimeout(this.parenEvent);
      var self = this;
      this.parenEvent = this.parent.setTimeout(function(){self.highlightParens();}, 300);
    },

    // Take the token before the cursor. If it contains a character in
    // '()[]{}', search for the matching paren/brace/bracket, and
    // highlight them in green for a moment, or red if no proper match
    // was found.
    highlightParens: function(jump, fromKey) {
      var self = this;
      // give the relevant nodes a colour.
      function highlight(node, ok) {
        if (!node) return;
        if (self.options.markParen) {
          self.options.markParen(node, ok);
        }
        else {
          node.style.fontWeight = "bold";
          node.style.color = ok ? "#8F8" : "#F88";
        }
      }
      function unhighlight(node) {
        if (!node) return;
        if (self.options.unmarkParen) {
          self.options.unmarkParen(node);
        }
        else {
          node.style.fontWeight = "";
          node.style.color = "";
        }
      }
      if (!fromKey && self.highlighted) {
        unhighlight(self.highlighted[0]);
        unhighlight(self.highlighted[1]);
      }

      if (!window.select) return;
      // Clear the event property.
      if (this.parenEvent) this.parent.clearTimeout(this.parenEvent);
      this.parenEvent = null;

      // Extract a 'paren' from a piece of text.
      function paren(node) {
        if (node.currentText) {
          var match = node.currentText.match(/^[\s\u00a0]*([\(\)\[\]{}])[\s\u00a0]*$/);
          return match && match[1];
        }
      }
      // Determine the direction a paren is facing.
      function forward(ch) {
        return /[\(\[\{]/.test(ch);
      }

      var ch, cursor = select.selectionTopNode(this.container, true);
      if (!cursor || !this.highlightAtCursor()) return;
      cursor = select.selectionTopNode(this.container, true);
      if (!(cursor && ((ch = paren(cursor)) || (cursor = cursor.nextSibling) && (ch = paren(cursor)))))
        return;
      // We only look for tokens with the same className.
      var className = cursor.className, dir = forward(ch), match = matching[ch];

      // Since parts of the document might not have been properly
      // highlighted, and it is hard to know in advance which part we
      // have to scan, we just try, and when we find dirty nodes we
      // abort, parse them, and re-try.
      function tryFindMatch() {
        var stack = [], ch, ok = true;
        for (var runner = cursor; runner; runner = dir ? runner.nextSibling : runner.previousSibling) {
          if (runner.className == className && isSpan(runner) && (ch = paren(runner))) {
            if (forward(ch) == dir)
              stack.push(ch);
            else if (!stack.length)
              ok = false;
            else if (stack.pop() != matching[ch])
              ok = false;
            if (!stack.length) break;
          }
          else if (runner.dirty || !isSpan(runner) && !isBR(runner)) {
            return {node: runner, status: "dirty"};
          }
        }
        return {node: runner, status: runner && ok};
      }

      while (true) {
        var found = tryFindMatch();
        if (found.status == "dirty") {
          this.highlight(found.node, endOfLine(found.node));
          // Needed because in some corner cases a highlight does not
          // reach a node.
          found.node.dirty = false;
          continue;
        }
        else {
          highlight(cursor, found.status);
          highlight(found.node, found.status);
          if (fromKey)
            self.parent.setTimeout(function() {unhighlight(cursor); unhighlight(found.node);}, 500);
          else
            self.highlighted = [cursor, found.node];
          if (jump && found.node)
            select.focusAfterNode(found.node.previousSibling, this.container);
          break;
        }
      }
    },

    // Adjust the amount of whitespace at the start of the line that
    // the cursor is on so that it is indented properly.
    indentAtCursor: function(direction) {
      if (!this.container.firstChild) return;
      // The line has to have up-to-date lexical information, so we
      // highlight it first.
      if (!this.highlightAtCursor()) return;
      var cursor = select.selectionTopNode(this.container, false);
      // If we couldn't determine the place of the cursor,
      // there's nothing to indent.
      if (cursor === false)
        return;
      var lineStart = startOfLine(cursor);
      var whiteSpace = this.indentLineAfter(lineStart, direction);
      if (cursor == lineStart && whiteSpace)
          cursor = whiteSpace;
      // This means the indentation has probably messed up the cursor.
      if (cursor == whiteSpace)
        select.focusAfterNode(cursor, this.container);
    },

    // Indent all lines whose start falls inside of the current
    // selection.
    indentRegion: function(start, end, direction) {
      var current = (start = startOfLine(start)), before = start && startOfLine(start.previousSibling);
      if (!isBR(end)) end = endOfLine(end, this.container);
      this.addDirtyNode(start);

      do {
        var next = endOfLine(current, this.container);
        if (current) this.highlight(before, next, true);
        this.indentLineAfter(current, direction);
        before = current;
        current = next;
      } while (current != end);
      select.setCursorPos(this.container, {node: start, offset: 0}, {node: end, offset: 0});
    },

    // Find the node that the cursor is in, mark it as dirty, and make
    // sure a highlight pass is scheduled.
    cursorActivity: function(safe) {
      // pagehide event hack above
      if (this.unloaded) {
        this.win.document.designMode = "off";
        this.win.document.designMode = "on";
        this.unloaded = false;
      }

      if (internetExplorer) {
        this.container.createTextRange().execCommand("unlink");
        this.selectionSnapshot = select.getBookmark(this.container);
      }

      var activity = this.options.cursorActivity;
      if (!safe || activity) {
        var cursor = select.selectionTopNode(this.container, false);
        if (cursor === false || !this.container.firstChild) return;
        cursor = cursor || this.container.firstChild;
        if (activity) activity(cursor);
        if (!safe) {
          this.scheduleHighlight();
          this.addDirtyNode(cursor);
        }
      }
    },

    reparseBuffer: function() {
      forEach(this.container.childNodes, function(node) {node.dirty = true;});
      if (this.container.firstChild)
        this.addDirtyNode(this.container.firstChild);
    },

    // Add a node to the set of dirty nodes, if it isn't already in
    // there.
    addDirtyNode: function(node) {
      node = node || this.container.firstChild;
      if (!node) return;

      for (var i = 0; i < this.dirty.length; i++)
        if (this.dirty[i] == node) return;

      if (node.nodeType != 3)
        node.dirty = true;
      this.dirty.push(node);
    },

    allClean: function() {
      return !this.dirty.length;
    },

    // Cause a highlight pass to happen in options.passDelay
    // milliseconds. Clear the existing timeout, if one exists. This
    // way, the passes do not happen while the user is typing, and
    // should as unobtrusive as possible.
    scheduleHighlight: function() {
      // Timeouts are routed through the parent window, because on
      // some browsers designMode windows do not fire timeouts.
      var self = this;
      this.parent.clearTimeout(this.highlightTimeout);
      this.highlightTimeout = this.parent.setTimeout(function(){self.highlightDirty();}, this.options.passDelay);
    },

    // Fetch one dirty node, and remove it from the dirty set.
    getDirtyNode: function() {
      while (this.dirty.length > 0) {
        var found = this.dirty.pop();
        // IE8 sometimes throws an unexplainable 'invalid argument'
        // exception for found.parentNode
        try {
          // If the node has been coloured in the meantime, or is no
          // longer in the document, it should not be returned.
          while (found && found.parentNode != this.container)
            found = found.parentNode;
          if (found && (found.dirty || found.nodeType == 3))
            return found;
        } catch (e) {}
      }
      return null;
    },

    // Pick dirty nodes, and highlight them, until options.passTime
    // milliseconds have gone by. The highlight method will continue
    // to next lines as long as it finds dirty nodes. It returns
    // information about the place where it stopped. If there are
    // dirty nodes left after this function has spent all its lines,
    // it shedules another highlight to finish the job.
    highlightDirty: function(force) {
      // Prevent FF from raising an error when it is firing timeouts
      // on a page that's no longer loaded.
      if (!window.select) return false;

      if (!this.options.readOnly) select.markSelection(this.win);
      var start, endTime = force ? null : time() + this.options.passTime;
      while ((time() < endTime || force) && (start = this.getDirtyNode())) {
        var result = this.highlight(start, endTime);
        if (result && result.node && result.dirty)
          this.addDirtyNode(result.node);
      }
      if (!this.options.readOnly) select.selectMarked();
      if (start) this.scheduleHighlight();
      return this.dirty.length == 0;
    },

    // Creates a function that, when called through a timeout, will
    // continuously re-parse the document.
    documentScanner: function(passTime) {
      var self = this, pos = null;
      return function() {
        // FF timeout weirdness workaround.
        if (!window.select) return;
        // If the current node is no longer in the document... oh
        // well, we start over.
        if (pos && pos.parentNode != self.container)
          pos = null;
        select.markSelection(self.win);
        var result = self.highlight(pos, time() + passTime, true);
        select.selectMarked();
        var newPos = result ? (result.node && result.node.nextSibling) : null;
        pos = (pos == newPos) ? null : newPos;
        self.delayScanning();
      };
    },

    // Starts the continuous scanning process for this document after
    // a given interval.
    delayScanning: function() {
      if (this.scanner) {
        this.parent.clearTimeout(this.documentScan);
        this.documentScan = this.parent.setTimeout(this.scanner, this.options.continuousScanning);
      }
    },

    // The function that does the actual highlighting/colouring (with
    // help from the parser and the DOM normalizer). Its interface is
    // rather overcomplicated, because it is used in different
    // situations: ensuring that a certain line is highlighted, or
    // highlighting up to X milliseconds starting from a certain
    // point. The 'from' argument gives the node at which it should
    // start. If this is null, it will start at the beginning of the
    // document. When a timestamp is given with the 'target' argument,
    // it will stop highlighting at that time. If this argument holds
    // a DOM node, it will highlight until it reaches that node. If at
    // any time it comes across two 'clean' lines (no dirty nodes), it
    // will stop, except when 'cleanLines' is true. maxBacktrack is
    // the maximum number of lines to backtrack to find an existing
    // parser instance. This is used to give up in situations where a
    // highlight would take too long and freeze the browser interface.
    highlight: function(from, target, cleanLines, maxBacktrack){
      var container = this.container, self = this, active = this.options.activeTokens;
      var endTime = (typeof target == "number" ? target : null);

      if (!container.firstChild)
        return false;
      // Backtrack to the first node before from that has a partial
      // parse stored.
      while (from && (!from.parserFromHere || from.dirty)) {
        if (maxBacktrack != null && isBR(from) && (--maxBacktrack) < 0)
          return false;
        from = from.previousSibling;
      }
      // If we are at the end of the document, do nothing.
      if (from && !from.nextSibling)
        return false;

      // Check whether a part (<span> node) and the corresponding token
      // match.
      function correctPart(token, part){
        return !part.reduced && part.currentText == token.value && part.className == token.style;
      }
      // Shorten the text associated with a part by chopping off
      // characters from the front. Note that only the currentText
      // property gets changed. For efficiency reasons, we leave the
      // nodeValue alone -- we set the reduced flag to indicate that
      // this part must be replaced.
      function shortenPart(part, minus){
        part.currentText = part.currentText.substring(minus);
        part.reduced = true;
      }
      // Create a part corresponding to a given token.
      function tokenPart(token){
        var part = makePartSpan(token.value, self.doc);     
        part.className = token.style;
        return part;
      }

      function maybeTouch(node) {
        if (node) {
          var old = node.oldNextSibling;
          if (lineDirty || old === undefined || node.nextSibling != old)
            self.history.touch(node);
          node.oldNextSibling = node.nextSibling;
        }
        else {
          var old = self.container.oldFirstChild;
          if (lineDirty || old === undefined || self.container.firstChild != old)
            self.history.touch(null);
          self.container.oldFirstChild = self.container.firstChild;
        }
      }

      // Get the token stream. If from is null, we start with a new
      // parser from the start of the frame, otherwise a partial parse
      // is resumed.
      var traversal = traverseDOM(from ? from.nextSibling : container.firstChild),
          stream = stringStream(traversal),
          parsed = from ? from.parserFromHere(stream) : Editor.Parser.make(stream);

      function surroundedByBRs(node) {
        return (node.previousSibling == null || isBR(node.previousSibling)) &&
               (node.nextSibling == null || isBR(node.nextSibling));
      }

      // parts is an interface to make it possible to 'delay' fetching
      // the next DOM node until we are completely done with the one
      // before it. This is necessary because often the next node is
      // not yet available when we want to proceed past the current
      // one.
      var parts = {
        current: null,
        // Fetch current node.
        get: function(){
          if (!this.current)
            this.current = traversal.nodes.shift();
          return this.current;
        },
        // Advance to the next part (do not fetch it yet).
        next: function(){
          this.current = null;
        },
        // Remove the current part from the DOM tree, and move to the
        // next.
        remove: function(){
          container.removeChild(this.get());
          this.current = null;
        },
        // Advance to the next part that is not empty, discarding empty
        // parts.
        getNonEmpty: function(){
          var part = this.get();
          // Allow empty nodes when they are alone on a line, needed
          // for the FF cursor bug workaround (see select.js,
          // insertNewlineAtCursor).
          while (part && isSpan(part) && part.currentText == "") {
            // Leave empty nodes that are alone on a line alone in
            // Opera, since that browsers doesn't deal well with
            // having 2 BRs in a row.
            if (window.opera && surroundedByBRs(part)) {
              this.next();
              part = this.get();
            }
            else {
              var old = part;
              this.remove();
              part = this.get();
              // Adjust selection information, if any. See select.js for details.
              select.snapshotMove(old.firstChild, part && (part.firstChild || part), 0);
            }
          }
          
          return part;
        }
      };

      var lineDirty = false, prevLineDirty = true, lineNodes = 0;

      // This forEach loops over the tokens from the parsed stream, and
      // at the same time uses the parts object to proceed through the
      // corresponding DOM nodes.
      forEach(parsed, function(token){
        var part = parts.getNonEmpty();

        if (token.value == "\n"){
          // The idea of the two streams actually staying synchronized
          // is such a long shot that we explicitly check.
          if (!isBR(part))
            throw "Parser out of sync. Expected BR.";

          if (part.dirty || !part.indentation) lineDirty = true;
          maybeTouch(from);
          from = part;

          // Every <br> gets a copy of the parser state and a lexical
          // context assigned to it. The first is used to be able to
          // later resume parsing from this point, the second is used
          // for indentation.
          part.parserFromHere = parsed.copy();
          part.indentation = token.indentation;
          part.dirty = false;

          // If the target argument wasn't an integer, go at least
          // until that node.
          if (endTime == null && part == target) throw StopIteration;

          // A clean line with more than one node means we are done.
          // Throwing a StopIteration is the way to break out of a
          // MochiKit forEach loop.
          if ((endTime != null && time() >= endTime) || (!lineDirty && !prevLineDirty && lineNodes > 1 && !cleanLines))
            throw StopIteration;
          prevLineDirty = lineDirty; lineDirty = false; lineNodes = 0;
          parts.next();
        }
        else {
          if (!isSpan(part))
            throw "Parser out of sync. Expected SPAN.";
          if (part.dirty)
            lineDirty = true;
          lineNodes++;

          // If the part matches the token, we can leave it alone.
          if (correctPart(token, part)){
            part.dirty = false;
            parts.next();
          }
          // Otherwise, we have to fix it.
          else {
            lineDirty = true;
            // Insert the correct part.
            var newPart = tokenPart(token);
            container.insertBefore(newPart, part);
            if (active) active(newPart, token, self);
            var tokensize = token.value.length;
            var offset = 0;
            // Eat up parts until the text for this token has been
            // removed, adjusting the stored selection info (see
            // select.js) in the process.
            while (tokensize > 0) {
              part = parts.get();
              var partsize = part.currentText.length;
              select.snapshotReplaceNode(part.firstChild, newPart.firstChild, tokensize, offset);
              if (partsize > tokensize){
                shortenPart(part, tokensize);
                tokensize = 0;
              }
              else {
                tokensize -= partsize;
                offset += partsize;
                parts.remove();
              }
            }
          }
        }
      });
      maybeTouch(from);
      webkitLastLineHack(this.container);

      // The function returns some status information that is used by
      // hightlightDirty to determine whether and where it has to
      // continue.
      return {node: parts.getNonEmpty(),
              dirty: lineDirty};
    }
  };

  return Editor;
})();

addEventHandler(window, "load", function() {
  var CodeMirror = window.frameElement.CodeMirror;
  var e = CodeMirror.editor = new Editor(CodeMirror.options);
  this.parent.setTimeout(method(CodeMirror, "init"), 0);
});

// Minimal framing needed to use CodeMirror-style parsers to highlight
// code. Load this along with tokenize.js, stringstream.js, and your
// parser. Then call highlightText, passing a string as the first
// argument, and as the second argument either a callback function
// that will be called with an array of SPAN nodes for every line in
// the code, or a DOM node to which to append these spans, and
// optionally (not needed if you only loaded one parser) a parser
// object.

// Stuff from util.js that the parsers are using.
var StopIteration = {toString: function() {return "StopIteration"}};

var Editor = {};
var indentUnit = 2;

(function(){
  function normaliseString(string) {
    var tab = "";
    for (var i = 0; i < indentUnit; i++) tab += " ";

    string = string.replace(/\t/g, tab).replace(/\u00a0/g, " ").replace(/\r\n?/g, "\n");
    var pos = 0, parts = [], lines = string.split("\n");
    for (var line = 0; line < lines.length; line++) {
      if (line != 0) parts.push("\n");
      parts.push(lines[line]);
    }

    return {
      next: function() {
        if (pos < parts.length) return parts[pos++];
        else throw StopIteration;
      }
    };
  }

  window.highlightText = function(string, callback, parser) {
    parser = (parser || Editor.Parser).make(stringStream(normaliseString(string)));
    var line = [];
    if (callback.nodeType == 1) {
      var node = callback;
      callback = function(line) {
        for (var i = 0; i < line.length; i++)
          node.appendChild(line[i]);
        node.appendChild(document.createElement("BR"));
      };
    }

    try {
      while (true) {
        var token = parser.next();
        if (token.value == "\n") {
          callback(line);
          line = [];
        }
        else {
          var span = document.createElement("SPAN");
          span.className = token.style;
          span.appendChild(document.createTextNode(token.value));
          line.push(span);
        }
      }
    }
    catch (e) {
      if (e != StopIteration) throw e;
    }
    if (line.length) callback(line);
  }
})();

/* Demonstration of embedding CodeMirror in a bigger application. The
 * interface defined here is a mess of prompts and confirms, and
 * should probably not be used in a real project.
 */

function MirrorFrame(place, options) {
  this.home = document.createElement("DIV");
  if (place.appendChild)
    place.appendChild(this.home);
  else
    place(this.home);

  var self = this;
  function makeButton(name, action) {
    var button = document.createElement("INPUT");
    button.type = "button";
    button.value = name;
    self.home.appendChild(button);
    button.onclick = function(){self[action].call(self);};
  }

  makeButton("Search", "search");
  makeButton("Replace", "replace");
  makeButton("Current line", "line");
  makeButton("Jump to line", "jump");
  makeButton("Insert constructor", "macro");
  makeButton("Indent all", "reindent");

  this.mirror = new CodeMirror(this.home, options);
}

MirrorFrame.prototype = {
  search: function() {
    var text = prompt("Enter search term:", "");
    if (!text) return;

    var first = true;
    do {
      var cursor = this.mirror.getSearchCursor(text, first, true);
      first = false;
      while (cursor.findNext()) {
        cursor.select();
        if (!confirm("Search again?"))
          return;
      }
    } while (confirm("End of document reached. Start over?"));
  },

  replace: function() {
    // This is a replace-all, but it is possible to implement a
    // prompting replace.
    var from = prompt("Enter search string:", ""), to;
    if (from) to = prompt("What should it be replaced with?", "");
    if (to == null) return;

    var cursor = this.mirror.getSearchCursor(from, false);
    while (cursor.findNext())
      cursor.replace(to);
  },

  jump: function() {
    var line = prompt("Jump to line:", "");
    if (line && !isNaN(Number(line)))
      this.mirror.jumpToLine(Number(line));
  },

  line: function() {
    alert("The cursor is currently at line " + this.mirror.currentLine());
    this.mirror.focus();
  },

  macro: function() {
    var name = prompt("Name your constructor:", "");
    if (name)
      this.mirror.replaceSelection("function " + name + "() {\n  \n}\n\n" + name + ".prototype = {\n  \n};\n");
  },

  reindent: function() {
    this.mirror.reindent();
  }
};

/* Simple parser for CSS */

var CSSParser = Editor.Parser = (function() {
  var tokenizeCSS = (function() {
    function normal(source, setState) {
      var ch = source.next();
      if (ch == "@") {
        source.nextWhileMatches(/\w/);
        return "css-at";
      }
      else if (ch == "/" && source.equals("*")) {
        setState(inCComment);
        return null;
      }
      else if (ch == "<" && source.equals("!")) {
        setState(inSGMLComment);
        return null;
      }
      else if (ch == "=") {
        return "css-compare";
      }
      else if (source.equals("=") && (ch == "~" || ch == "|")) {
        source.next();
        return "css-compare";
      }
      else if (ch == "\"" || ch == "'") {
        setState(inString(ch));
        return null;
      }
      else if (ch == "#") {
        source.nextWhileMatches(/\w/);
        return "css-hash";
      }
      else if (ch == "!") {
        source.nextWhileMatches(/[ \t]/);
        source.nextWhileMatches(/\w/);
        return "css-important";
      }
      else if (/\d/.test(ch)) {
        source.nextWhileMatches(/[\w.%]/);
        return "css-unit";
      }
      else if (/[,.+>*\/]/.test(ch)) {
        return "css-select-op";
      }
      else if (/[;{}:\[\]]/.test(ch)) {
        return "css-punctuation";
      }
      else {
        source.nextWhileMatches(/[\w\\\-_]/);
        return "css-identifier";
      }
    }

    function inCComment(source, setState) {
      var maybeEnd = false;
      while (!source.endOfLine()) {
        var ch = source.next();
        if (maybeEnd && ch == "/") {
          setState(normal);
          break;
        }
        maybeEnd = (ch == "*");
      }
      return "css-comment";
    }

    function inSGMLComment(source, setState) {
      var dashes = 0;
      while (!source.endOfLine()) {
        var ch = source.next();
        if (dashes >= 2 && ch == ">") {
          setState(normal);
          break;
        }
        dashes = (ch == "-") ? dashes + 1 : 0;
      }
      return "css-comment";
    }

    function inString(quote) {
      return function(source, setState) {
        var escaped = false;
        while (!source.endOfLine()) {
          var ch = source.next();
          if (ch == quote && !escaped)
            break;
          escaped = !escaped && ch == "\\";
        }
        if (!escaped)
          setState(normal);
        return "css-string";
      };
    }

    return function(source, startState) {
      return tokenizer(source, startState || normal);
    };
  })();

  function indentCSS(inBraces, inRule, base) {
    return function(nextChars) {
      if (!inBraces || /^\}/.test(nextChars)) return base;
      else if (inRule) return base + indentUnit * 2;
      else return base + indentUnit;
    };
  }

  // This is a very simplistic parser -- since CSS does not really
  // nest, it works acceptably well, but some nicer colouroing could
  // be provided with a more complicated parser.
  function parseCSS(source, basecolumn) {
    basecolumn = basecolumn || 0;
    var tokens = tokenizeCSS(source);
    var inBraces = false, inRule = false;

    var iter = {
      next: function() {
        var token = tokens.next(), style = token.style, content = token.content;

        if (style == "css-identifier" && inRule)
          token.style = "css-value";
        if (style == "css-hash")
          token.style =  inRule ? "css-colorcode" : "css-identifier";

        if (content == "\n")
          token.indentation = indentCSS(inBraces, inRule, basecolumn);

        if (content == "{")
          inBraces = true;
        else if (content == "}")
          inBraces = inRule = false;
        else if (inBraces && content == ";")
          inRule = false;
        else if (inBraces && style != "css-comment" && style != "whitespace")
          inRule = true;

        return token;
      },

      copy: function() {
        var _inBraces = inBraces, _inRule = inRule, _tokenState = tokens.state;
        return function(source) {
          tokens = tokenizeCSS(source, _tokenState);
          inBraces = _inBraces;
          inRule = _inRule;
          return iter;
        };
      }
    };
    return iter;
  }

  return {make: parseCSS, electricChars: "}"};
})();

var DummyParser = Editor.Parser = (function() {
  function tokenizeDummy(source) {
    while (!source.endOfLine()) source.next();
    return "text";
  }
  function parseDummy(source) {
    function indentTo(n) {return function() {return n;}}
    source = tokenizer(source, tokenizeDummy);
    var space = 0;

    var iter = {
      next: function() {
        var tok = source.next();
        if (tok.type == "whitespace") {
          if (tok.value == "\n") tok.indentation = indentTo(space);
          else space = tok.value.length;
        }
        return tok;
      },
      copy: function() {
        var _space = space;
        return function(_source) {
          space = _space;
          source = tokenizer(_source, tokenizeDummy);
          return iter;
        };
      }
    };
    return iter;
  }
  return {make: parseDummy};
})();

var HTMLMixedParser = Editor.Parser = (function() {
  if (!(CSSParser && JSParser && XMLParser))
    throw new Error("CSS, JS, and XML parsers must be loaded for HTML mixed mode to work.");
  XMLParser.configure({useHTMLKludges: true});

  function parseMixed(stream) {
    var htmlParser = XMLParser.make(stream), localParser = null, inTag = false;
    var iter = {next: top, copy: copy};

    function top() {
      var token = htmlParser.next();
      if (token.content == "<")
        inTag = true;
      else if (token.style == "xml-tagname" && inTag === true)
        inTag = token.content.toLowerCase();
      else if (token.content == ">") {
        if (inTag == "script")
          iter.next = local(JSParser, "</script");
        else if (inTag == "style")
          iter.next = local(CSSParser, "</style");
        inTag = false;
      }
      return token;
    }
    function local(parser, tag) {
      var baseIndent = htmlParser.indentation();
      localParser = parser.make(stream, baseIndent + indentUnit);
      return function() {
        if (stream.lookAhead(tag, false, false, true)) {
          localParser = null;
          iter.next = top;
          return top();
        }

        var token = localParser.next();
        var lt = token.value.lastIndexOf("<"), sz = Math.min(token.value.length - lt, tag.length);
        if (lt != -1 && token.value.slice(lt, lt + sz).toLowerCase() == tag.slice(0, sz) &&
            stream.lookAhead(tag.slice(sz), false, false, true)) {
          stream.push(token.value.slice(lt));
          token.value = token.value.slice(0, lt);
        }

        if (token.indentation) {
          var oldIndent = token.indentation;
          token.indentation = function(chars) {
            if (chars == "</")
              return baseIndent;
            else
              return oldIndent(chars);
          }
        }

        return token;
      };
    }

    function copy() {
      var _html = htmlParser.copy(), _local = localParser && localParser.copy(),
          _next = iter.next, _inTag = inTag;
      return function(_stream) {
        stream = _stream;
        htmlParser = _html(_stream);
        localParser = _local && _local(_stream);
        iter.next = _next;
        inTag = _inTag;
        return iter;
      };
    }
    return iter;
  }

  return {make: parseMixed, electricChars: "{}/:"};

})();

/* Parse function for JavaScript. Makes use of the tokenizer from
 * tokenizejavascript.js. Note that your parsers do not have to be
 * this complicated -- if you don't want to recognize local variables,
 * in many languages it is enough to just look for braces, semicolons,
 * parentheses, etc, and know when you are inside a string or comment.
 *
 * See manual.html for more info about the parser interface.
 */

var JSParser = Editor.Parser = (function() {
  // Token types that can be considered to be atoms.
  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true};
  // Setting that can be used to have JSON data indent properly.
  var json = false;
  // Constructor for the lexical context objects.
  function JSLexical(indented, column, type, align, prev, info) {
    // indentation at start of this line
    this.indented = indented;
    // column at which this scope was opened
    this.column = column;
    // type of scope ('vardef', 'stat' (statement), 'form' (special form), '[', '{', or '(')
    this.type = type;
    // '[', '{', or '(' blocks that have any text after their opening
    // character are said to be 'aligned' -- any lines below are
    // indented all the way to the opening character.
    if (align != null)
      this.align = align;
    // Parent scope, if any.
    this.prev = prev;
    this.info = info;
  }

  // My favourite JavaScript indentation rules.
  function indentJS(lexical) {
    return function(firstChars) {
      var firstChar = firstChars && firstChars.charAt(0), type = lexical.type;
      var closing = firstChar == type;
      if (type == "vardef")
        return lexical.indented + 4;
      else if (type == "form" && firstChar == "{")
        return lexical.indented;
      else if (type == "stat" || type == "form")
        return lexical.indented + indentUnit;
      else if (lexical.info == "switch" && !closing)
        return lexical.indented + (/^(?:case|default)\b/.test(firstChars) ? indentUnit : 2 * indentUnit);
      else if (lexical.align)
        return lexical.column - (closing ? 1 : 0);
      else
        return lexical.indented + (closing ? 0 : indentUnit);
    };
  }

  // The parser-iterator-producing function itself.
  function parseJS(input, basecolumn) {
    // Wrap the input in a token stream
    var tokens = tokenizeJavaScript(input);
    // The parser state. cc is a stack of actions that have to be
    // performed to finish the current statement. For example we might
    // know that we still need to find a closing parenthesis and a
    // semicolon. Actions at the end of the stack go first. It is
    // initialized with an infinitely looping action that consumes
    // whole statements.
    var cc = [statements];
    // Context contains information about the current local scope, the
    // variables defined in that, and the scopes above it.
    var context = null;
    // The lexical scope, used mostly for indentation.
    var lexical = new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false);
    // Current column, and the indentation at the start of the current
    // line. Used to create lexical scope objects.
    var column = 0;
    var indented = 0;
    // Variables which are used by the mark, cont, and pass functions
    // below to communicate with the driver loop in the 'next'
    // function.
    var consume, marked;
  
    // The iterator object.
    var parser = {next: next, copy: copy};

    function next(){
      // Start by performing any 'lexical' actions (adjusting the
      // lexical variable), or the operations below will be working
      // with the wrong lexical state.
      while(cc[cc.length - 1].lex)
        cc.pop()();

      // Fetch a token.
      var token = tokens.next();

      // Adjust column and indented.
      if (token.type == "whitespace" && column == 0)
        indented = token.value.length;
      column += token.value.length;
      if (token.content == "\n"){
        indented = column = 0;
        // If the lexical scope's align property is still undefined at
        // the end of the line, it is an un-aligned scope.
        if (!("align" in lexical))
          lexical.align = false;
        // Newline tokens get an indentation function associated with
        // them.
        token.indentation = indentJS(lexical);
      }
      // No more processing for meaningless tokens.
      if (token.type == "whitespace" || token.type == "comment")
        return token;
      // When a meaningful token is found and the lexical scope's
      // align is undefined, it is an aligned scope.
      if (!("align" in lexical))
        lexical.align = true;

      // Execute actions until one 'consumes' the token and we can
      // return it.
      while(true) {
        consume = marked = false;
        // Take and execute the topmost action.
        cc.pop()(token.type, token.content);
        if (consume){
          // Marked is used to change the style of the current token.
          if (marked)
            token.style = marked;
          // Here we differentiate between local and global variables.
          else if (token.type == "variable" && inScope(token.content))
            token.style = "js-localvariable";
          return token;
        }
      }
    }

    // This makes a copy of the parser state. It stores all the
    // stateful variables in a closure, and returns a function that
    // will restore them when called with a new input stream. Note
    // that the cc array has to be copied, because it is contantly
    // being modified. Lexical objects are not mutated, and context
    // objects are not mutated in a harmful way, so they can be shared
    // between runs of the parser.
    function copy(){
      var _context = context, _lexical = lexical, _cc = cc.concat([]), _tokenState = tokens.state;
  
      return function copyParser(input){
        context = _context;
        lexical = _lexical;
        cc = _cc.concat([]); // copies the array
        column = indented = 0;
        tokens = tokenizeJavaScript(input, _tokenState);
        return parser;
      };
    }

    // Helper function for pushing a number of actions onto the cc
    // stack in reverse order.
    function push(fs){
      for (var i = fs.length - 1; i >= 0; i--)
        cc.push(fs[i]);
    }
    // cont and pass are used by the action functions to add other
    // actions to the stack. cont will cause the current token to be
    // consumed, pass will leave it for the next action.
    function cont(){
      push(arguments);
      consume = true;
    }
    function pass(){
      push(arguments);
      consume = false;
    }
    // Used to change the style of the current token.
    function mark(style){
      marked = style;
    }

    // Push a new scope. Will automatically link the current scope.
    function pushcontext(){
      context = {prev: context, vars: {"this": true, "arguments": true}};
    }
    // Pop off the current scope.
    function popcontext(){
      context = context.prev;
    }
    // Register a variable in the current scope.
    function register(varname){
      if (context){
        mark("js-variabledef");
        context.vars[varname] = true;
      }
    }
    // Check whether a variable is defined in the current scope.
    function inScope(varname){
      var cursor = context;
      while (cursor) {
        if (cursor.vars[varname])
          return true;
        cursor = cursor.prev;
      }
      return false;
    }
  
    // Push a new lexical context of the given type.
    function pushlex(type, info) {
      var result = function(){
        lexical = new JSLexical(indented, column, type, null, lexical, info)
      };
      result.lex = true;
      return result;
    }
    // Pop off the current lexical context.
    function poplex(){
      lexical = lexical.prev;
    }
    poplex.lex = true;
    // The 'lex' flag on these actions is used by the 'next' function
    // to know they can (and have to) be ran before moving on to the
    // next token.
  
    // Creates an action that discards tokens until it finds one of
    // the given type.
    function expect(wanted){
      return function expecting(type){
        if (type == wanted) cont();
        else cont(arguments.callee);
      };
    }

    // Looks for a statement, and then calls itself.
    function statements(type){
      return pass(statement, statements);
    }
    // Dispatches various types of statements based on the type of the
    // current token.
    function statement(type){
      if (type == "var") cont(pushlex("vardef"), vardef1, expect(";"), poplex);
      else if (type == "keyword a") cont(pushlex("form"), expression, statement, poplex);
      else if (type == "keyword b") cont(pushlex("form"), statement, poplex);
      else if (type == "{" && json) cont(pushlex("}"), commasep(objprop, "}"), poplex);
      else if (type == "{") cont(pushlex("}"), block, poplex);
      else if (type == "function") cont(functiondef);
      else if (type == "for") cont(pushlex("form"), expect("("), pushlex(")"), forspec1, expect(")"), poplex, statement, poplex);
      else if (type == "variable") cont(pushlex("stat"), maybelabel);
      else if (type == "switch") cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"), block, poplex, poplex);
      else if (type == "case") cont(expression, expect(":"));
      else if (type == "default") cont(expect(":"));
      else if (type == "catch") cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"), statement, poplex, popcontext);
      else pass(pushlex("stat"), expression, expect(";"), poplex);
    }
    // Dispatch expression types.
    function expression(type){
      if (atomicTypes.hasOwnProperty(type)) cont(maybeoperator);
      else if (type == "function") cont(functiondef);
      else if (type == "keyword c") cont(expression);
      else if (type == "(") cont(pushlex(")"), expression, expect(")"), poplex, maybeoperator);
      else if (type == "operator") cont(expression);
      else if (type == "[") cont(pushlex("]"), commasep(expression, "]"), poplex, maybeoperator);
      else if (type == "{") cont(pushlex("}"), commasep(objprop, "}"), poplex, maybeoperator);
    }
    // Called for places where operators, function calls, or
    // subscripts are valid. Will skip on to the next action if none
    // is found.
    function maybeoperator(type){
      if (type == "operator") cont(expression);
      else if (type == "(") cont(pushlex(")"), expression, commasep(expression, ")"), poplex, maybeoperator);
      else if (type == ".") cont(property, maybeoperator);
      else if (type == "[") cont(pushlex("]"), expression, expect("]"), poplex, maybeoperator);
    }
    // When a statement starts with a variable name, it might be a
    // label. If no colon follows, it's a regular statement.
    function maybelabel(type){
      if (type == ":") cont(poplex, statement);
      else pass(maybeoperator, expect(";"), poplex);
    }
    // Property names need to have their style adjusted -- the
    // tokenizer thinks they are variables.
    function property(type){
      if (type == "variable") {mark("js-property"); cont();}
    }
    // This parses a property and its value in an object literal.
    function objprop(type){
      if (type == "variable") mark("js-property");
      if (atomicTypes.hasOwnProperty(type)) cont(expect(":"), expression);
    }
    // Parses a comma-separated list of the things that are recognized
    // by the 'what' argument.
    function commasep(what, end){
      function proceed(type) {
        if (type == ",") cont(what, proceed);
        else if (type == end) cont();
        else cont(expect(end));
      }
      return function commaSeparated(type) {
        if (type == end) cont();
        else pass(what, proceed);
      };
    }
    // Look for statements until a closing brace is found.
    function block(type){
      if (type == "}") cont();
      else pass(statement, block);
    }
    // Variable definitions are split into two actions -- 1 looks for
    // a name or the end of the definition, 2 looks for an '=' sign or
    // a comma.
    function vardef1(type, value){
      if (type == "variable"){register(value); cont(vardef2);}
      else cont();
    }
    function vardef2(type, value){
      if (value == "=") cont(expression, vardef2);
      else if (type == ",") cont(vardef1);
    }
    // For loops.
    function forspec1(type){
      if (type == "var") cont(vardef1, forspec2);
      else if (type == ";") pass(forspec2);
      else if (type == "variable") cont(formaybein);
      else pass(forspec2);
    }
    function formaybein(type, value){
      if (value == "in") cont(expression);
      else cont(maybeoperator, forspec2);
    }
    function forspec2(type, value){
      if (type == ";") cont(forspec3);
      else if (value == "in") cont(expression);
      else cont(expression, expect(";"), forspec3);
    }
    function forspec3(type) {
      if (type == ")") pass();
      else cont(expression);
    }
    // A function definition creates a new context, and the variables
    // in its argument list have to be added to this context.
    function functiondef(type, value){
      if (type == "variable"){register(value); cont(functiondef);}
      else if (type == "(") cont(pushcontext, commasep(funarg, ")"), statement, popcontext);
    }
    function funarg(type, value){
      if (type == "variable"){register(value); cont();}
    }
  
    return parser;
  }

  return {
    make: parseJS,
    electricChars: "{}:",
    configure: function(obj) {
      if (obj.json != null) json = obj.json;
    }
  };
})();

var SparqlParser = Editor.Parser = (function() {
  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var ops = wordRegexp(["str", "lang", "langmatches", "datatype", "bound", "sameterm", "isiri", "isuri",
                        "isblank", "isliteral", "union", "a"]);
  var keywords = wordRegexp(["base", "prefix", "select", "distinct", "reduced", "construct", "describe",
                             "ask", "from", "named", "where", "order", "limit", "offset", "filter", "optional",
                             "graph", "by", "asc", "desc", ]);
  var operatorChars = /[*+\-<>=&|]/;

  var tokenizeSparql = (function() {
    function normal(source, setState) {
      var ch = source.next();
      if (ch == "$" || ch == "?") {
        source.nextWhileMatches(/[\w\d]/);
        return "sp-var";
      }
      else if (ch == "<" && !source.matches(/[\s\u00a0=]/)) {
        source.nextWhileMatches(/[^\s\u00a0>]/);
        if (source.equals(">")) source.next();
        return "sp-uri";
      }
      else if (ch == "\"" || ch == "'") {
        setState(inLiteral(ch));
        return null;
      }
      else if (/[{}\(\),\.;\[\]]/.test(ch)) {
        return "sp-punc";
      }
      else if (ch == "#") {
        while (!source.endOfLine()) source.next();
        return "sp-comment";
      }
      else if (operatorChars.test(ch)) {
        source.nextWhileMatches(operatorChars);
        return "sp-operator";
      }
      else if (ch == ":") {
        source.nextWhileMatches(/[\w\d\._\-]/);
        return "sp-prefixed";
      }
      else {
        source.nextWhileMatches(/[_\w\d]/);
        if (source.equals(":")) {
          source.next();
          source.nextWhileMatches(/[\w\d_\-]/);
          return "sp-prefixed";
        }
        var word = source.get(), type;
        if (ops.test(word))
          type = "sp-operator";
        else if (keywords.test(word))
          type = "sp-keyword";
        else
          type = "sp-word";
        return {style: type, content: word};
      }
    }

    function inLiteral(quote) {
      return function(source, setState) {
        var escaped = false;
        while (!source.endOfLine()) {
          var ch = source.next();
          if (ch == quote && !escaped) {
            setState(normal);
            break;
          }
          escaped = !escaped && ch == "\\";
        }
        return "sp-literal";
      };
    }

    return function(source, startState) {
      return tokenizer(source, startState || normal);
    };
  })();

  function indentSparql(context) {
    return function(nextChars) {
      var firstChar = nextChars && nextChars.charAt(0);
      if (/[\]\}]/.test(firstChar))
        while (context && context.type == "pattern") context = context.prev;

      var closing = context && firstChar == matching[context.type];
      if (!context)
        return 0;
      else if (context.type == "pattern")
        return context.col;
      else if (context.align)
        return context.col - (closing ? context.width : 0);
      else
        return context.indent + (closing ? 0 : indentUnit);
    }
  }

  function parseSparql(source) {
    var tokens = tokenizeSparql(source);
    var context = null, indent = 0, col = 0;
    function pushContext(type, width) {
      context = {prev: context, indent: indent, col: col, type: type, width: width};
    }
    function popContext() {
      context = context.prev;
    }

    var iter = {
      next: function() {
        var token = tokens.next(), type = token.style, content = token.content, width = token.value.length;

        if (content == "\n") {
          token.indentation = indentSparql(context);
          indent = col = 0;
          if (context && context.align == null) context.align = false;
        }
        else if (type == "whitespace" && col == 0) {
          indent = width;
        }
        else if (type != "sp-comment" && context && context.align == null) {
          context.align = true;
        }

        if (content != "\n") col += width;

        if (/[\[\{\(]/.test(content)) {
          pushContext(content, width);
        }
        else if (/[\]\}\)]/.test(content)) {
          while (context && context.type == "pattern")
            popContext();
          if (context && content == matching[context.type])
            popContext();
        }
        else if (content == "." && context && context.type == "pattern") {
          popContext();
        }
        else if ((type == "sp-word" || type == "sp-prefixed" || type == "sp-uri" || type == "sp-var" || type == "sp-literal") &&
                 context && /[\{\[]/.test(context.type)) {
          pushContext("pattern", width);
        }

        return token;
      },

      copy: function() {
        var _context = context, _indent = indent, _col = col, _tokenState = tokens.state;
        return function(source) {
          tokens = tokenizeSparql(source, _tokenState);
          context = _context;
          indent = _indent;
          col = _col;
          return iter;
        };
      }
    };
    return iter;
  }

  return {make: parseSparql, electricChars: "}]"};
})();

/* This file defines an XML parser, with a few kludges to make it
 * useable for HTML. autoSelfClosers defines a set of tag names that
 * are expected to not have a closing tag, and doNotIndent specifies
 * the tags inside of which no indentation should happen (see Config
 * object). These can be disabled by passing the editor an object like
 * {useHTMLKludges: false} as parserConfig option.
 */

var XMLParser = Editor.Parser = (function() {
  var Kludges = {
    autoSelfClosers: {"br": true, "img": true, "hr": true, "link": true, "input": true,
                      "meta": true, "col": true, "frame": true, "base": true, "area": true},
    doNotIndent: {"pre": true, "!cdata": true}
  };
  var NoKludges = {autoSelfClosers: {}, doNotIndent: {"!cdata": true}};
  var UseKludges = Kludges;
  var alignCDATA = false;

  // Simple stateful tokenizer for XML documents. Returns a
  // MochiKit-style iterator, with a state property that contains a
  // function encapsulating the current state. See tokenize.js.
  var tokenizeXML = (function() {
    function inText(source, setState) {
      var ch = source.next();
      if (ch == "<") {
        if (source.equals("!")) {
          source.next();
          if (source.equals("[")) {
            if (source.lookAhead("[CDATA[", true)) {
              setState(inBlock("xml-cdata", "]]>"));
              return null;
            }
            else {
              return "xml-text";
            }
          }
          else if (source.lookAhead("--", true)) {
            setState(inBlock("xml-comment", "-->"));
            return null;
          }
          else {
            return "xml-text";
          }
        }
        else if (source.equals("?")) {
          source.next();
          source.nextWhileMatches(/[\w\._\-]/);
          setState(inBlock("xml-processing", "?>"));
          return "xml-processing";
        }
        else {
          if (source.equals("/")) source.next();
          setState(inTag);
          return "xml-punctuation";
        }
      }
      else if (ch == "&") {
        while (!source.endOfLine()) {
          if (source.next() == ";")
            break;
        }
        return "xml-entity";
      }
      else {
        source.nextWhileMatches(/[^&<\n]/);
        return "xml-text";
      }
    }

    function inTag(source, setState) {
      var ch = source.next();
      if (ch == ">") {
        setState(inText);
        return "xml-punctuation";
      }
      else if (/[?\/]/.test(ch) && source.equals(">")) {
        source.next();
        setState(inText);
        return "xml-punctuation";
      }
      else if (ch == "=") {
        return "xml-punctuation";
      }
      else if (/[\'\"]/.test(ch)) {
        setState(inAttribute(ch));
        return null;
      }
      else {
        source.nextWhileMatches(/[^\s\u00a0=<>\"\'\/?]/);
        return "xml-name";
      }
    }

    function inAttribute(quote) {
      return function(source, setState) {
        while (!source.endOfLine()) {
          if (source.next() == quote) {
            setState(inTag);
            break;
          }
        }
        return "xml-attribute";
      };
    }

    function inBlock(style, terminator) {
      return function(source, setState) {
        while (!source.endOfLine()) {
          if (source.lookAhead(terminator, true)) {
            setState(inText);
            break;
          }
          source.next();
        }
        return style;
      };
    }

    return function(source, startState) {
      return tokenizer(source, startState || inText);
    };
  })();

  // The parser. The structure of this function largely follows that of
  // parseJavaScript in parsejavascript.js (there is actually a bit more
  // shared code than I'd like), but it is quite a bit simpler.
  function parseXML(source) {
    var tokens = tokenizeXML(source), token;
    var cc = [base];
    var tokenNr = 0, indented = 0;
    var currentTag = null, context = null;
    var consume;
    
    function push(fs) {
      for (var i = fs.length - 1; i >= 0; i--)
        cc.push(fs[i]);
    }
    function cont() {
      push(arguments);
      consume = true;
    }
    function pass() {
      push(arguments);
      consume = false;
    }

    function markErr() {
      token.style += " xml-error";
    }
    function expect(text) {
      return function(style, content) {
        if (content == text) cont();
        else {markErr(); cont(arguments.callee);}
      };
    }

    function pushContext(tagname, startOfLine) {
      var noIndent = UseKludges.doNotIndent.hasOwnProperty(tagname) || (context && context.noIndent);
      context = {prev: context, name: tagname, indent: indented, startOfLine: startOfLine, noIndent: noIndent};
    }
    function popContext() {
      context = context.prev;
    }
    function computeIndentation(baseContext) {
      return function(nextChars, current) {
        var context = baseContext;
        if (context && context.noIndent)
          return current;
        if (alignCDATA && /<!\[CDATA\[/.test(nextChars))
          return 0;
        if (context && /^<\//.test(nextChars))
          context = context.prev;
        while (context && !context.startOfLine)
          context = context.prev;
        if (context)
          return context.indent + indentUnit;
        else
          return 0;
      };
    }

    function base() {
      return pass(element, base);
    }
    var harmlessTokens = {"xml-text": true, "xml-entity": true, "xml-comment": true, "xml-processing": true};
    function element(style, content) {
      if (content == "<") cont(tagname, attributes, endtag(tokenNr == 1));
      else if (content == "</") cont(closetagname, expect(">"));
      else if (style == "xml-cdata") {
        if (!context || context.name != "!cdata") pushContext("!cdata");
        if (/\]\]>$/.test(content)) popContext();
        cont();
      }
      else if (harmlessTokens.hasOwnProperty(style)) cont();
      else {markErr(); cont();}
    }
    function tagname(style, content) {
      if (style == "xml-name") {
        currentTag = content.toLowerCase();
        token.style = "xml-tagname";
        cont();
      }
      else {
        currentTag = null;
        pass();
      }
    }
    function closetagname(style, content) {
      if (style == "xml-name") {
        token.style = "xml-tagname";
        if (context && content.toLowerCase() == context.name) popContext();
        else markErr();
      }
      cont();
    }
    function endtag(startOfLine) {
      return function(style, content) {
        if (content == "/>" || (content == ">" && UseKludges.autoSelfClosers.hasOwnProperty(currentTag))) cont();
        else if (content == ">") {pushContext(currentTag, startOfLine); cont();}
        else {markErr(); cont(arguments.callee);}
      };
    }
    function attributes(style) {
      if (style == "xml-name") {token.style = "xml-attname"; cont(attribute, attributes);}
      else pass();
    }
    function attribute(style, content) {
      if (content == "=") cont(value);
      else if (content == ">" || content == "/>") pass(endtag);
      else pass();
    }
    function value(style) {
      if (style == "xml-attribute") cont(value);
      else pass();
    }

    return {
      indentation: function() {return indented;},

      next: function(){
        token = tokens.next();
        if (token.style == "whitespace" && tokenNr == 0)
          indented = token.value.length;
        else
          tokenNr++;
        if (token.content == "\n") {
          indented = tokenNr = 0;
          token.indentation = computeIndentation(context);
        }

        if (token.style == "whitespace" || token.type == "xml-comment")
          return token;

        while(true){
          consume = false;
          cc.pop()(token.style, token.content);
          if (consume) return token;
        }
      },

      copy: function(){
        var _cc = cc.concat([]), _tokenState = tokens.state, _context = context;
        var parser = this;
        
        return function(input){
          cc = _cc.concat([]);
          tokenNr = indented = 0;
          context = _context;
          tokens = tokenizeXML(input, _tokenState);
          return parser;
        };
      }
    };
  }

  return {
    make: parseXML,
    electricChars: "/",
    configure: function(config) {
      if (config.useHTMLKludges != null)
        UseKludges = config.useHTMLKludges ? Kludges : NoKludges;
      if (config.alignCDATA)
        alignCDATA = config.alignCDATA;
    }
  };
})();

/* Functionality for finding, storing, and restoring selections
 *
 * This does not provide a generic API, just the minimal functionality
 * required by the CodeMirror system.
 */

// Namespace object.
var select = {};

(function() {
  select.ie_selection = document.selection && document.selection.createRangeCollection;

  // Find the 'top-level' (defined as 'a direct child of the node
  // passed as the top argument') node that the given node is
  // contained in. Return null if the given node is not inside the top
  // node.
  function topLevelNodeAt(node, top) {
    while (node && node.parentNode != top)
      node = node.parentNode;
    return node;
  }

  // Find the top-level node that contains the node before this one.
  function topLevelNodeBefore(node, top) {
    while (!node.previousSibling && node.parentNode != top)
      node = node.parentNode;
    return topLevelNodeAt(node.previousSibling, top);
  }

  var fourSpaces = "\u00a0\u00a0\u00a0\u00a0";

  select.scrollToNode = function(element) {
    if (!element) return;
    var doc = element.ownerDocument, body = doc.body,
        win = (doc.defaultView || doc.parentWindow),
        html = doc.documentElement,
        atEnd = !element.nextSibling || !element.nextSibling.nextSibling
                || !element.nextSibling.nextSibling.nextSibling;
    // In Opera (and recent Webkit versions), BR elements *always*
    // have a offsetTop property of zero.
    var compensateHack = 0;
    while (element && !element.offsetTop) {
      compensateHack++;
      element = element.previousSibling;
    }
    // atEnd is another kludge for these browsers -- if the cursor is
    // at the end of the document, and the node doesn't have an
    // offset, just scroll to the end.
    if (compensateHack == 0) atEnd = false;

    var y = compensateHack * (element ? element.offsetHeight : 0), x = 0, pos = element;
    while (pos && pos.offsetParent) {
      y += pos.offsetTop;
      // Don't count X offset for <br> nodes
      if (!isBR(pos))
        x += pos.offsetLeft;
      pos = pos.offsetParent;
    }

    var scroll_x = body.scrollLeft || html.scrollLeft || 0,
        scroll_y = body.scrollTop || html.scrollTop || 0,
        screen_x = x - scroll_x, screen_y = y - scroll_y, scroll = false;

    if (screen_x < 0 || screen_x > (win.innerWidth || html.clientWidth || 0)) {
      scroll_x = x;
      scroll = true;
    }
    if (screen_y < 0 || atEnd || screen_y > (win.innerHeight || html.clientHeight || 0) - 50) {
      scroll_y = atEnd ? 1e6 : y;
      scroll = true;
    }
    if (scroll) win.scrollTo(scroll_x, scroll_y);
  };

  select.scrollToCursor = function(container) {
    select.scrollToNode(select.selectionTopNode(container, true) || container.firstChild);
  };

  // Used to prevent restoring a selection when we do not need to.
  var currentSelection = null;

  select.snapshotChanged = function() {
    if (currentSelection) currentSelection.changed = true;
  };

  // This is called by the code in editor.js whenever it is replacing
  // a text node. The function sees whether the given oldNode is part
  // of the current selection, and updates this selection if it is.
  // Because nodes are often only partially replaced, the length of
  // the part that gets replaced has to be taken into account -- the
  // selection might stay in the oldNode if the newNode is smaller
  // than the selection's offset. The offset argument is needed in
  // case the selection does move to the new object, and the given
  // length is not the whole length of the new node (part of it might
  // have been used to replace another node).
  select.snapshotReplaceNode = function(from, to, length, offset) {
    if (!currentSelection) return;

    function replace(point) {
      if (from == point.node) {
        currentSelection.changed = true;
        if (length && point.offset > length) {
          point.offset -= length;
        }
        else {
          point.node = to;
          point.offset += (offset || 0);
        }
      }
    }
    replace(currentSelection.start);
    replace(currentSelection.end);
  };

  select.snapshotMove = function(from, to, distance, relative, ifAtStart) {
    if (!currentSelection) return;

    function move(point) {
      if (from == point.node && (!ifAtStart || point.offset == 0)) {
        currentSelection.changed = true;
        point.node = to;
        if (relative) point.offset = Math.max(0, point.offset + distance);
        else point.offset = distance;
      }
    }
    move(currentSelection.start);
    move(currentSelection.end);
  };

  // Most functions are defined in two ways, one for the IE selection
  // model, one for the W3C one.
  if (select.ie_selection) {
    function selectionNode(win, start) {
      var range = win.document.selection.createRange();
      range.collapse(start);

      function nodeAfter(node) {
        var found = null;
        while (!found && node) {
          found = node.nextSibling;
          node = node.parentNode;
        }
        return nodeAtStartOf(found);
      }

      function nodeAtStartOf(node) {
        while (node && node.firstChild) node = node.firstChild;
        return {node: node, offset: 0};
      }

      var containing = range.parentElement();
      if (!isAncestor(win.document.body, containing)) return null;
      if (!containing.firstChild) return nodeAtStartOf(containing);

      var working = range.duplicate();
      working.moveToElementText(containing);
      working.collapse(true);
      for (var cur = containing.firstChild; cur; cur = cur.nextSibling) {
        if (cur.nodeType == 3) {
          var size = cur.nodeValue.length;
          working.move("character", size);
        }
        else {
          working.moveToElementText(cur);
          working.collapse(false);
        }

        var dir = range.compareEndPoints("StartToStart", working);
        if (dir == 0) return nodeAfter(cur);
        if (dir == 1) continue;
        if (cur.nodeType != 3) return nodeAtStartOf(cur);

        working.setEndPoint("StartToEnd", range);
        return {node: cur, offset: size - working.text.length};
      }
      return nodeAfter(containing);
    }

    select.markSelection = function(win) {
      currentSelection = null;
      var sel = win.document.selection;
      if (!sel) return;
      var start = selectionNode(win, true),
          end = selectionNode(win, false);
      if (!start || !end) return;
      currentSelection = {start: start, end: end, window: win, changed: false};
    };

    select.selectMarked = function() {
      if (!currentSelection || !currentSelection.changed) return;
      var win = currentSelection.window, doc = win.document;

      function makeRange(point) {
        var range = doc.body.createTextRange(),
            node = point.node;
        if (!node) {
          range.moveToElementText(currentSelection.window.document.body);
          range.collapse(false);
        }
        else if (node.nodeType == 3) {
          range.moveToElementText(node.parentNode);
          var offset = point.offset;
          while (node.previousSibling) {
            node = node.previousSibling;
            offset += (node.innerText || "").length;
          }
          range.move("character", offset);
        }
        else {
          range.moveToElementText(node);
          range.collapse(true);
        }
        return range;
      }

      var start = makeRange(currentSelection.start), end = makeRange(currentSelection.end);
      start.setEndPoint("StartToEnd", end);
      start.select();
    };

    // Get the top-level node that one end of the cursor is inside or
    // after. Note that this returns false for 'no cursor', and null
    // for 'start of document'.
    select.selectionTopNode = function(container, start) {
      var selection = container.ownerDocument.selection;
      if (!selection) return false;

      var range = selection.createRange(), range2 = range.duplicate();
      range.collapse(start);
      var around = range.parentElement();
      if (around && isAncestor(container, around)) {
        // Only use this node if the selection is not at its start.
        range2.moveToElementText(around);
        if (range.compareEndPoints("StartToStart", range2) == 1)
          return topLevelNodeAt(around, container);
      }

      // Move the start of a range to the start of a node,
      // compensating for the fact that you can't call
      // moveToElementText with text nodes.
      function moveToNodeStart(range, node) {
        if (node.nodeType == 3) {
          var count = 0, cur = node.previousSibling;
          while (cur && cur.nodeType == 3) {
            count += cur.nodeValue.length;
            cur = cur.previousSibling;
          }
          if (cur) {
            try{range.moveToElementText(cur);}
            catch(e){return false;}
            range.collapse(false);
          }
          else range.moveToElementText(node.parentNode);
          if (count) range.move("character", count);
        }
        else {
          try{range.moveToElementText(node);}
          catch(e){return false;}
        }
        return true;
      }

      // Do a binary search through the container object, comparing
      // the start of each node to the selection
      var start = 0, end = container.childNodes.length - 1;
      while (start < end) {
        var middle = Math.ceil((end + start) / 2), node = container.childNodes[middle];
        if (!node) return false; // Don't ask. IE6 manages this sometimes.
        if (!moveToNodeStart(range2, node)) return false;
        if (range.compareEndPoints("StartToStart", range2) == 1)
          start = middle;
        else
          end = middle - 1;
      }
      return container.childNodes[start] || null;
    };

    // Place the cursor after this.start. This is only useful when
    // manually moving the cursor instead of restoring it to its old
    // position.
    select.focusAfterNode = function(node, container) {
      var range = container.ownerDocument.body.createTextRange();
      range.moveToElementText(node || container);
      range.collapse(!node);
      range.select();
    };

    select.somethingSelected = function(win) {
      var sel = win.document.selection;
      return sel && (sel.createRange().text != "");
    };

    function insertAtCursor(window, html) {
      var selection = window.document.selection;
      if (selection) {
        var range = selection.createRange();
        range.pasteHTML(html);
        range.collapse(false);
        range.select();
      }
    }

    // Used to normalize the effect of the enter key, since browsers
    // do widely different things when pressing enter in designMode.
    select.insertNewlineAtCursor = function(window) {
      insertAtCursor(window, "<br>");
    };

    select.insertTabAtCursor = function(window) {
      insertAtCursor(window, fourSpaces);
    };

    // Get the BR node at the start of the line on which the cursor
    // currently is, and the offset into the line. Returns null as
    // node if cursor is on first line.
    select.cursorPos = function(container, start) {
      var selection = container.ownerDocument.selection;
      if (!selection) return null;

      var topNode = select.selectionTopNode(container, start);
      while (topNode && !isBR(topNode))
        topNode = topNode.previousSibling;

      var range = selection.createRange(), range2 = range.duplicate();
      range.collapse(start);
      if (topNode) {
        range2.moveToElementText(topNode);
        range2.collapse(false);
      }
      else {
        // When nothing is selected, we can get all kinds of funky errors here.
        try { range2.moveToElementText(container); }
        catch (e) { return null; }
        range2.collapse(true);
      }
      range.setEndPoint("StartToStart", range2);

      return {node: topNode, offset: range.text.length};
    };

    select.setCursorPos = function(container, from, to) {
      function rangeAt(pos) {
        var range = container.ownerDocument.body.createTextRange();
        if (!pos.node) {
          range.moveToElementText(container);
          range.collapse(true);
        }
        else {
          range.moveToElementText(pos.node);
          range.collapse(false);
        }
        range.move("character", pos.offset);
        return range;
      }

      var range = rangeAt(from);
      if (to && to != from)
        range.setEndPoint("EndToEnd", rangeAt(to));
      range.select();
    }

    // Some hacks for storing and re-storing the selection when the editor loses and regains focus.
    select.getBookmark = function (container) {
      var from = select.cursorPos(container, true), to = select.cursorPos(container, false);
      if (from && to) return {from: from, to: to};
    };

    // Restore a stored selection.
    select.setBookmark = function(container, mark) {
      if (!mark) return;
      select.setCursorPos(container, mark.from, mark.to);
    };
  }
  // W3C model
  else {
    // Store start and end nodes, and offsets within these, and refer
    // back to the selection object from those nodes, so that this
    // object can be updated when the nodes are replaced before the
    // selection is restored.
    select.markSelection = function (win) {
      var selection = win.getSelection();
      if (!selection || selection.rangeCount == 0)
        return (currentSelection = null);
      var range = selection.getRangeAt(0);

      currentSelection = {
        start: {node: range.startContainer, offset: range.startOffset},
        end: {node: range.endContainer, offset: range.endOffset},
        window: win,
        changed: false
      };

      // We want the nodes right at the cursor, not one of their
      // ancestors with a suitable offset. This goes down the DOM tree
      // until a 'leaf' is reached (or is it *up* the DOM tree?).
      function normalize(point){
        while (point.node.nodeType != 3 && !isBR(point.node)) {
          var newNode = point.node.childNodes[point.offset] || point.node.nextSibling;
          point.offset = 0;
          while (!newNode && point.node.parentNode) {
            point.node = point.node.parentNode;
            newNode = point.node.nextSibling;
          }
          point.node = newNode;
          if (!newNode)
            break;
        }
      }

      normalize(currentSelection.start);
      normalize(currentSelection.end);
    };

    select.selectMarked = function () {
      var cs = currentSelection;
      // on webkit-based browsers, it is apparently possible that the
      // selection gets reset even when a node that is not one of the
      // endpoints get messed with. the most common situation where
      // this occurs is when a selection is deleted or overwitten. we
      // check for that here.
      function focusIssue() {
        return cs.start.node == cs.end.node && cs.start.offset == 0 && cs.end.offset == 0;
      }
      if (!cs || !(cs.changed || (webkit && focusIssue()))) return;
      var win = cs.window, range = win.document.createRange();

      function setPoint(point, which) {
        if (point.node) {
          // Some magic to generalize the setting of the start and end
          // of a range.
          if (point.offset == 0)
            range["set" + which + "Before"](point.node);
          else
            range["set" + which](point.node, point.offset);
        }
        else {
          range.setStartAfter(win.document.body.lastChild || win.document.body);
        }
      }

      setPoint(cs.end, "End");
      setPoint(cs.start, "Start");
      selectRange(range, win);
    };

    // Helper for selecting a range object.
    function selectRange(range, window) {
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    function selectionRange(window) {
      var selection = window.getSelection();
      if (!selection || selection.rangeCount == 0)
        return false;
      else
        return selection.getRangeAt(0);
    }

    // Finding the top-level node at the cursor in the W3C is, as you
    // can see, quite an involved process.
    select.selectionTopNode = function(container, start) {
      var range = selectionRange(container.ownerDocument.defaultView);
      if (!range) return false;

      var node = start ? range.startContainer : range.endContainer;
      var offset = start ? range.startOffset : range.endOffset;
      // Work around (yet another) bug in Opera's selection model.
      if (window.opera && !start && range.endContainer == container && range.endOffset == range.startOffset + 1 &&
          container.childNodes[range.startOffset] && isBR(container.childNodes[range.startOffset]))
        offset--;

      // For text nodes, we look at the node itself if the cursor is
      // inside, or at the node before it if the cursor is at the
      // start.
      if (node.nodeType == 3){
        if (offset > 0)
          return topLevelNodeAt(node, container);
        else
          return topLevelNodeBefore(node, container);
      }
      // Occasionally, browsers will return the HTML node as
      // selection. If the offset is 0, we take the start of the frame
      // ('after null'), otherwise, we take the last node.
      else if (node.nodeName.toUpperCase() == "HTML") {
        return (offset == 1 ? null : container.lastChild);
      }
      // If the given node is our 'container', we just look up the
      // correct node by using the offset.
      else if (node == container) {
        return (offset == 0) ? null : node.childNodes[offset - 1];
      }
      // In any other case, we have a regular node. If the cursor is
      // at the end of the node, we use the node itself, if it is at
      // the start, we use the node before it, and in any other
      // case, we look up the child before the cursor and use that.
      else {
        if (offset == node.childNodes.length)
          return topLevelNodeAt(node, container);
        else if (offset == 0)
          return topLevelNodeBefore(node, container);
        else
          return topLevelNodeAt(node.childNodes[offset - 1], container);
      }
    };

    select.focusAfterNode = function(node, container) {
      var win = container.ownerDocument.defaultView,
          range = win.document.createRange();
      range.setStartBefore(container.firstChild || container);
      // In Opera, setting the end of a range at the end of a line
      // (before a BR) will cause the cursor to appear on the next
      // line, so we set the end inside of the start node when
      // possible.
      if (node && !node.firstChild)
        range.setEndAfter(node);
      else if (node)
        range.setEnd(node, node.childNodes.length);
      else
        range.setEndBefore(container.firstChild || container);
      range.collapse(false);
      selectRange(range, win);
    };

    select.somethingSelected = function(win) {
      var range = selectionRange(win);
      return range && !range.collapsed;
    };

    function insertNodeAtCursor(window, node) {
      var range = selectionRange(window);
      if (!range) return;

      range.deleteContents();
      range.insertNode(node);
      webkitLastLineHack(window.document.body);
      range = window.document.createRange();
      range.selectNode(node);
      range.collapse(false);
      selectRange(range, window);
    }

    select.insertNewlineAtCursor = function(window) {
      insertNodeAtCursor(window, window.document.createElement("BR"));
    };

    select.insertTabAtCursor = function(window) {
      insertNodeAtCursor(window, window.document.createTextNode(fourSpaces));
    };

    select.cursorPos = function(container, start) {
      var range = selectionRange(window);
      if (!range) return;

      var topNode = select.selectionTopNode(container, start);
      while (topNode && !isBR(topNode))
        topNode = topNode.previousSibling;

      range = range.cloneRange();
      range.collapse(start);
      if (topNode)
        range.setStartAfter(topNode);
      else
        range.setStartBefore(container);
      return {node: topNode, offset: range.toString().length};
    };

    select.setCursorPos = function(container, from, to) {
      var win = container.ownerDocument.defaultView,
          range = win.document.createRange();

      function setPoint(node, offset, side) {
        if (offset == 0 && node && !node.nextSibling) {
          range["set" + side + "After"](node);
          return true;
        }

        if (!node)
          node = container.firstChild;
        else
          node = node.nextSibling;

        if (!node) return;

        if (offset == 0) {
          range["set" + side + "Before"](node);
          return true;
        }

        var backlog = []
        function decompose(node) {
          if (node.nodeType == 3)
            backlog.push(node);
          else
            forEach(node.childNodes, decompose);
        }
        while (true) {
          while (node && !backlog.length) {
            decompose(node);
            node = node.nextSibling;
          }
          var cur = backlog.shift();
          if (!cur) return false;

          var length = cur.nodeValue.length;
          if (length >= offset) {
            range["set" + side](cur, offset);
            return true;
          }
          offset -= length;
        }
      }

      to = to || from;
      if (setPoint(to.node, to.offset, "End") && setPoint(from.node, from.offset, "Start"))
        selectRange(range, win);
    };
  }
})();

/* String streams are the things fed to parsers (which can feed them
 * to a tokenizer if they want). They provide peek and next methods
 * for looking at the current character (next 'consumes' this
 * character, peek does not), and a get method for retrieving all the
 * text that was consumed since the last time get was called.
 *
 * An easy mistake to make is to let a StopIteration exception finish
 * the token stream while there are still characters pending in the
 * string stream (hitting the end of the buffer while parsing a
 * token). To make it easier to detect such errors, the stringstreams
 * throw an exception when this happens.
 */

// Make a stringstream stream out of an iterator that returns strings.
// This is applied to the result of traverseDOM (see codemirror.js),
// and the resulting stream is fed to the parser.
var stringStream = function(source){
  // String that's currently being iterated over.
  var current = "";
  // Position in that string.
  var pos = 0;
  // Accumulator for strings that have been iterated over but not
  // get()-ed yet.
  var accum = "";
  // Make sure there are more characters ready, or throw
  // StopIteration.
  function ensureChars() {
    while (pos == current.length) {
      accum += current;
      current = ""; // In case source.next() throws
      pos = 0;
      try {current = source.next();}
      catch (e) {
        if (e != StopIteration) throw e;
        else return false;
      }
    }
    return true;
  }

  return {
    // Return the next character in the stream.
    peek: function() {
      if (!ensureChars()) return null;
      return current.charAt(pos);
    },
    // Get the next character, throw StopIteration if at end, check
    // for unused content.
    next: function() {
      if (!ensureChars()) {
        if (accum.length > 0)
          throw "End of stringstream reached without emptying buffer ('" + accum + "').";
        else
          throw StopIteration;
      }
      return current.charAt(pos++);
    },
    // Return the characters iterated over since the last call to
    // .get().
    get: function() {
      var temp = accum;
      accum = "";
      if (pos > 0){
        temp += current.slice(0, pos);
        current = current.slice(pos);
        pos = 0;
      }
      return temp;
    },
    // Push a string back into the stream.
    push: function(str) {
      current = current.slice(0, pos) + str + current.slice(pos);
    },
    lookAhead: function(str, consume, skipSpaces, caseInsensitive) {
      function cased(str) {return caseInsensitive ? str.toLowerCase() : str;}
      str = cased(str);
      var found = false;

      var _accum = accum, _pos = pos;
      if (skipSpaces) this.nextWhileMatches(/[\s\u00a0]/);

      while (true) {
        var end = pos + str.length, left = current.length - pos;
        if (end <= current.length) {
          found = str == cased(current.slice(pos, end));
          pos = end;
          break;
        }
        else if (str.slice(0, left) == cased(current.slice(pos))) {
          accum += current; current = "";
          try {current = source.next();}
          catch (e) {break;}
          pos = 0;
          str = str.slice(left);
        }
        else {
          break;
        }
      }

      if (!(found && consume)) {
        current = accum.slice(_accum.length) + current;
        pos = _pos;
        accum = _accum;
      }

      return found;
    },

    // Utils built on top of the above
    more: function() {
      return this.peek() !== null;
    },
    applies: function(test) {
      var next = this.peek();
      return (next !== null && test(next));
    },
    nextWhile: function(test) {
      var next;
      while ((next = this.peek()) !== null && test(next))
        this.next();
    },
    matches: function(re) {
      var next = this.peek();
      return (next !== null && re.test(next));
    },
    nextWhileMatches: function(re) {
      var next;
      while ((next = this.peek()) !== null && re.test(next))
        this.next();
    },
    equals: function(ch) {
      return ch === this.peek();
    },
    endOfLine: function() {
      var next = this.peek();
      return next == null || next == "\n";
    }
  };
};

// A framework for simple tokenizers. Takes care of newlines and
// white-space, and of getting the text from the source stream into
// the token object. A state is a function of two arguments -- a
// string stream and a setState function. The second can be used to
// change the tokenizer's state, and can be ignored for stateless
// tokenizers. This function should advance the stream over a token
// and return a string or object containing information about the next
// token, or null to pass and have the (new) state be called to finish
// the token. When a string is given, it is wrapped in a {style, type}
// object. In the resulting object, the characters consumed are stored
// under the content property. Any whitespace following them is also
// automatically consumed, and added to the value property. (Thus,
// content is the actual meaningful part of the token, while value
// contains all the text it spans.)

function tokenizer(source, state) {
  // Newlines are always a separate token.
  function isWhiteSpace(ch) {
    // The messy regexp is because IE's regexp matcher is of the
    // opinion that non-breaking spaces are no whitespace.
    return ch != "\n" && /^[\s\u00a0]*$/.test(ch);
  }

  var tokenizer = {
    state: state,

    take: function(type) {
      if (typeof(type) == "string")
        type = {style: type, type: type};

      type.content = (type.content || "") + source.get();
      if (!/\n$/.test(type.content))
        source.nextWhile(isWhiteSpace);
      type.value = type.content + source.get();
      return type;
    },

    next: function () {
      if (!source.more()) throw StopIteration;

      var type;
      if (source.equals("\n")) {
        source.next();
        return this.take("whitespace");
      }
      
      if (source.applies(isWhiteSpace))
        type = "whitespace";
      else
        while (!type)
          type = this.state(source, function(s) {tokenizer.state = s;});

      return this.take(type);
    }
  };
  return tokenizer;
}

/* Tokenizer for JavaScript code */

var tokenizeJavaScript = (function() {
  // Advance the stream until the given character (not preceded by a
  // backslash) is encountered, or the end of the line is reached.
  function nextUntilUnescaped(source, end) {
    var escaped = false;
    while (!source.endOfLine()) {
      var next = source.next();
      if (next == end && !escaped)
        return false;
      escaped = !escaped && next == "\\";
    }
    return escaped;
  }

  // A map of JavaScript's keywords. The a/b/c keyword distinction is
  // very rough, but it gives the parser enough information to parse
  // correct code correctly (we don't care that much how we parse
  // incorrect code). The style information included in these objects
  // is used by the highlighter to pick the correct CSS style for a
  // token.
  var keywords = function(){
    function result(type, style){
      return {type: type, style: "js-" + style};
    }
    // keywords that take a parenthised expression, and then a
    // statement (if)
    var keywordA = result("keyword a", "keyword");
    // keywords that take just a statement (else)
    var keywordB = result("keyword b", "keyword");
    // keywords that optionally take an expression, and form a
    // statement (return)
    var keywordC = result("keyword c", "keyword");
    var operator = result("operator", "keyword");
    var atom = result("atom", "atom");
    return {
      "if": keywordA, "while": keywordA, "with": keywordA,
      "else": keywordB, "do": keywordB, "try": keywordB, "finally": keywordB,
      "return": keywordC, "break": keywordC, "continue": keywordC, "new": keywordC, "delete": keywordC, "throw": keywordC,
      "in": operator, "typeof": operator, "instanceof": operator,
      "var": result("var", "keyword"), "function": result("function", "keyword"), "catch": result("catch", "keyword"),
      "for": result("for", "keyword"), "switch": result("switch", "keyword"),
      "case": result("case", "keyword"), "default": result("default", "keyword"),
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom
    };
  }();

  // Some helper regexps
  var isOperatorChar = /[+\-*&%=<>!?|]/;
  var isHexDigit = /[0-9A-Fa-f]/;
  var isWordChar = /[\w\$_]/;

  // Wrapper around jsToken that helps maintain parser state (whether
  // we are inside of a multi-line comment and whether the next token
  // could be a regular expression).
  function jsTokenState(inside, regexp) {
    return function(source, setState) {
      var newInside = inside;
      var type = jsToken(inside, regexp, source, function(c) {newInside = c;});
      var newRegexp = type.type == "operator" || type.type == "keyword c" || type.type.match(/^[\[{}\(,;:]$/);
      if (newRegexp != regexp || newInside != inside)
        setState(jsTokenState(newInside, newRegexp));
      return type;
    };
  }

  // The token reader, inteded to be used by the tokenizer from
  // tokenize.js (through jsTokenState). Advances the source stream
  // over a token, and returns an object containing the type and style
  // of that token.
  function jsToken(inside, regexp, source, setInside) {
    function readHexNumber(){
      source.next(); // skip the 'x'
      source.nextWhileMatches(isHexDigit);
      return {type: "number", style: "js-atom"};
    }

    function readNumber() {
      source.nextWhileMatches(/[0-9]/);
      if (source.equals(".")){
        source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      if (source.equals("e") || source.equals("E")){
        source.next();
        if (source.equals("-"))
          source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      return {type: "number", style: "js-atom"};
    }
    // Read a word, look it up in keywords. If not found, it is a
    // variable, otherwise it is a keyword of the type found.
    function readWord() {
      source.nextWhileMatches(isWordChar);
      var word = source.get();
      var known = keywords.hasOwnProperty(word) && keywords.propertyIsEnumerable(word) && keywords[word];
      return known ? {type: known.type, style: known.style, content: word} :
      {type: "variable", style: "js-variable", content: word};
    }
    function readRegexp() {
      nextUntilUnescaped(source, "/");
      source.nextWhileMatches(/[gi]/);
      return {type: "regexp", style: "js-string"};
    }
    // Mutli-line comments are tricky. We want to return the newlines
    // embedded in them as regular newline tokens, and then continue
    // returning a comment token for every line of the comment. So
    // some state has to be saved (inside) to indicate whether we are
    // inside a /* */ sequence.
    function readMultilineComment(start){
      var newInside = "/*";
      var maybeEnd = (start == "*");
      while (true) {
        if (source.endOfLine())
          break;
        var next = source.next();
        if (next == "/" && maybeEnd){
          newInside = null;
          break;
        }
        maybeEnd = (next == "*");
      }
      setInside(newInside);
      return {type: "comment", style: "js-comment"};
    }
    function readOperator() {
      source.nextWhileMatches(isOperatorChar);
      return {type: "operator", style: "js-operator"};
    }
    function readString(quote) {
      var endBackSlash = nextUntilUnescaped(source, quote);
      setInside(endBackSlash ? quote : null);
      return {type: "string", style: "js-string"};
    }

    // Fetch the next token. Dispatches on first character in the
    // stream, or first two characters when the first is a slash.
    if (inside == "\"" || inside == "'")
      return readString(inside);
    var ch = source.next();
    if (inside == "/*")
      return readMultilineComment(ch);
    else if (ch == "\"" || ch == "'")
      return readString(ch);
    // with punctuation, the type of the token is the symbol itself
    else if (/[\[\]{}\(\),;\:\.]/.test(ch))
      return {type: ch, style: "js-punctuation"};
    else if (ch == "0" && (source.equals("x") || source.equals("X")))
      return readHexNumber();
    else if (/[0-9]/.test(ch))
      return readNumber();
    else if (ch == "/"){
      if (source.equals("*"))
      { source.next(); return readMultilineComment(ch); }
      else if (source.equals("/"))
      { nextUntilUnescaped(source, null); return {type: "comment", style: "js-comment"};}
      else if (regexp)
        return readRegexp();
      else
        return readOperator();
    }
    else if (isOperatorChar.test(ch))
      return readOperator();
    else
      return readWord();
  }

  // The external interface to the tokenizer.
  return function(source, startState) {
    return tokenizer(source, startState || jsTokenState(false, true));
  };
})();

/**
 * Storage and control for undo information within a CodeMirror
 * editor. 'Why on earth is such a complicated mess required for
 * that?', I hear you ask. The goal, in implementing this, was to make
 * the complexity of storing and reverting undo information depend
 * only on the size of the edited or restored content, not on the size
 * of the whole document. This makes it necessary to use a kind of
 * 'diff' system, which, when applied to a DOM tree, causes some
 * complexity and hackery.
 *
 * In short, the editor 'touches' BR elements as it parses them, and
 * the History stores these. When nothing is touched in commitDelay
 * milliseconds, the changes are committed: It goes over all touched
 * nodes, throws out the ones that did not change since last commit or
 * are no longer in the document, and assembles the rest into zero or
 * more 'chains' -- arrays of adjacent lines. Links back to these
 * chains are added to the BR nodes, while the chain that previously
 * spanned these nodes is added to the undo history. Undoing a change
 * means taking such a chain off the undo history, restoring its
 * content (text is saved per line) and linking it back into the
 * document.
 */

// A history object needs to know about the DOM container holding the
// document, the maximum amount of undo levels it should store, the
// delay (of no input) after which it commits a set of changes, and,
// unfortunately, the 'parent' window -- a window that is not in
// designMode, and on which setTimeout works in every browser.
function History(container, maxDepth, commitDelay, editor) {
  this.container = container;
  this.maxDepth = maxDepth; this.commitDelay = commitDelay;
  this.editor = editor; this.parent = editor.parent;
  // This line object represents the initial, empty editor.
  var initial = {text: "", from: null, to: null};
  // As the borders between lines are represented by BR elements, the
  // start of the first line and the end of the last one are
  // represented by null. Since you can not store any properties
  // (links to line objects) in null, these properties are used in
  // those cases.
  this.first = initial; this.last = initial;
  // Similarly, a 'historyTouched' property is added to the BR in
  // front of lines that have already been touched, and 'firstTouched'
  // is used for the first line.
  this.firstTouched = false;
  // History is the set of committed changes, touched is the set of
  // nodes touched since the last commit.
  this.history = []; this.redoHistory = []; this.touched = [];
}

History.prototype = {
  // Schedule a commit (if no other touches come in for commitDelay
  // milliseconds).
  scheduleCommit: function() {
    var self = this;
    this.parent.clearTimeout(this.commitTimeout);
    this.commitTimeout = this.parent.setTimeout(function(){self.tryCommit();}, this.commitDelay);
  },

  // Mark a node as touched. Null is a valid argument.
  touch: function(node) {
    this.setTouched(node);
    this.scheduleCommit();
  },

  // Undo the last change.
  undo: function() {
    // Make sure pending changes have been committed.
    this.commit();

    if (this.history.length) {
      // Take the top diff from the history, apply it, and store its
      // shadow in the redo history.
      var item = this.history.pop();
      this.redoHistory.push(this.updateTo(item, "applyChain"));
      this.notifyEnvironment();
      return this.chainNode(item);
    }
  },

  // Redo the last undone change.
  redo: function() {
    this.commit();
    if (this.redoHistory.length) {
      // The inverse of undo, basically.
      var item = this.redoHistory.pop();
      this.addUndoLevel(this.updateTo(item, "applyChain"));
      this.notifyEnvironment();
      return this.chainNode(item);
    }
  },

  clear: function() {
    this.history = [];
    this.redoHistory = [];
  },

  // Ask for the size of the un/redo histories.
  historySize: function() {
    return {undo: this.history.length, redo: this.redoHistory.length};
  },

  // Push a changeset into the document.
  push: function(from, to, lines) {
    var chain = [];
    for (var i = 0; i < lines.length; i++) {
      var end = (i == lines.length - 1) ? to : this.container.ownerDocument.createElement("BR");
      chain.push({from: from, to: end, text: cleanText(lines[i])});
      from = end;
    }
    this.pushChains([chain], from == null && to == null);
    this.notifyEnvironment();
  },

  pushChains: function(chains, doNotHighlight) {
    this.commit(doNotHighlight);
    this.addUndoLevel(this.updateTo(chains, "applyChain"));
    this.redoHistory = [];
  },

  // Retrieve a DOM node from a chain (for scrolling to it after undo/redo).
  chainNode: function(chains) {
    for (var i = 0; i < chains.length; i++) {
      var start = chains[i][0], node = start && (start.from || start.to);
      if (node) return node;
    }
  },

  // Clear the undo history, make the current document the start
  // position.
  reset: function() {
    this.history = []; this.redoHistory = [];
  },

  textAfter: function(br) {
    return this.after(br).text;
  },

  nodeAfter: function(br) {
    return this.after(br).to;
  },

  nodeBefore: function(br) {
    return this.before(br).from;
  },

  // Commit unless there are pending dirty nodes.
  tryCommit: function() {
    if (!window.History) return; // Stop when frame has been unloaded
    if (this.editor.highlightDirty()) this.commit(true);
    else this.scheduleCommit();
  },

  // Check whether the touched nodes hold any changes, if so, commit
  // them.
  commit: function(doNotHighlight) {
    this.parent.clearTimeout(this.commitTimeout);
    // Make sure there are no pending dirty nodes.
    if (!doNotHighlight) this.editor.highlightDirty(true);
    // Build set of chains.
    var chains = this.touchedChains(), self = this;

    if (chains.length) {
      this.addUndoLevel(this.updateTo(chains, "linkChain"));
      this.redoHistory = [];
      this.notifyEnvironment();
    }
  },

  // [ end of public interface ]

  // Update the document with a given set of chains, return its
  // shadow. updateFunc should be "applyChain" or "linkChain". In the
  // second case, the chains are taken to correspond the the current
  // document, and only the state of the line data is updated. In the
  // first case, the content of the chains is also pushed iinto the
  // document.
  updateTo: function(chains, updateFunc) {
    var shadows = [], dirty = [];
    for (var i = 0; i < chains.length; i++) {
      shadows.push(this.shadowChain(chains[i]));
      dirty.push(this[updateFunc](chains[i]));
    }
    if (updateFunc == "applyChain")
      this.notifyDirty(dirty);
    return shadows;
  },

  // Notify the editor that some nodes have changed.
  notifyDirty: function(nodes) {
    forEach(nodes, method(this.editor, "addDirtyNode"))
    this.editor.scheduleHighlight();
  },

  notifyEnvironment: function() {
    // Used by the line-wrapping line-numbering code.
    if (window.frameElement && window.frameElement.CodeMirror.updateNumbers)
      window.frameElement.CodeMirror.updateNumbers();
    if (this.onChange) this.onChange();
  },

  // Link a chain into the DOM nodes (or the first/last links for null
  // nodes).
  linkChain: function(chain) {
    for (var i = 0; i < chain.length; i++) {
      var line = chain[i];
      if (line.from) line.from.historyAfter = line;
      else this.first = line;
      if (line.to) line.to.historyBefore = line;
      else this.last = line;
    }
  },

  // Get the line object after/before a given node.
  after: function(node) {
    return node ? node.historyAfter : this.first;
  },
  before: function(node) {
    return node ? node.historyBefore : this.last;
  },

  // Mark a node as touched if it has not already been marked.
  setTouched: function(node) {
    if (node) {
      if (!node.historyTouched) {
        this.touched.push(node);
        node.historyTouched = true;
      }
    }
    else {
      this.firstTouched = true;
    }
  },

  // Store a new set of undo info, throw away info if there is more of
  // it than allowed.
  addUndoLevel: function(diffs) {
    this.history.push(diffs);
    if (this.history.length > this.maxDepth)
      this.history.shift();
  },

  // Build chains from a set of touched nodes.
  touchedChains: function() {
    var self = this;

    // The temp system is a crummy hack to speed up determining
    // whether a (currently touched) node has a line object associated
    // with it. nullTemp is used to store the object for the first
    // line, other nodes get it stored in their historyTemp property.
    var nullTemp = null;
    function temp(node) {return node ? node.historyTemp : nullTemp;}
    function setTemp(node, line) {
      if (node) node.historyTemp = line;
      else nullTemp = line;
    }

    function buildLine(node) {
      var text = [];
      for (var cur = node ? node.nextSibling : self.container.firstChild;
           cur && !isBR(cur); cur = cur.nextSibling)
        if (cur.currentText) text.push(cur.currentText);
      return {from: node, to: cur, text: cleanText(text.join(""))};
    }

    // Filter out unchanged lines and nodes that are no longer in the
    // document. Build up line objects for remaining nodes.
    var lines = [];
    if (self.firstTouched) self.touched.push(null);
    forEach(self.touched, function(node) {
      if (node && node.parentNode != self.container) return;

      if (node) node.historyTouched = false;
      else self.firstTouched = false;

      var line = buildLine(node), shadow = self.after(node);
      if (!shadow || shadow.text != line.text || shadow.to != line.to) {
        lines.push(line);
        setTemp(node, line);
      }
    });

    // Get the BR element after/before the given node.
    function nextBR(node, dir) {
      var link = dir + "Sibling", search = node[link];
      while (search && !isBR(search))
        search = search[link];
      return search;
    }

    // Assemble line objects into chains by scanning the DOM tree
    // around them.
    var chains = []; self.touched = [];
    forEach(lines, function(line) {
      // Note that this makes the loop skip line objects that have
      // been pulled into chains by lines before them.
      if (!temp(line.from)) return;

      var chain = [], curNode = line.from, safe = true;
      // Put any line objects (referred to by temp info) before this
      // one on the front of the array.
      while (true) {
        var curLine = temp(curNode);
        if (!curLine) {
          if (safe) break;
          else curLine = buildLine(curNode);
        }
        chain.unshift(curLine);
        setTemp(curNode, null);
        if (!curNode) break;
        safe = self.after(curNode);
        curNode = nextBR(curNode, "previous");
      }
      curNode = line.to; safe = self.before(line.from);
      // Add lines after this one at end of array.
      while (true) {
        if (!curNode) break;
        var curLine = temp(curNode);
        if (!curLine) {
          if (safe) break;
          else curLine = buildLine(curNode);
        }
        chain.push(curLine);
        setTemp(curNode, null);
        safe = self.before(curNode);
        curNode = nextBR(curNode, "next");
      }
      chains.push(chain);
    });

    return chains;
  },

  // Find the 'shadow' of a given chain by following the links in the
  // DOM nodes at its start and end.
  shadowChain: function(chain) {
    var shadows = [], next = this.after(chain[0].from), end = chain[chain.length - 1].to;
    while (true) {
      shadows.push(next);
      var nextNode = next.to;
      if (!nextNode || nextNode == end)
        break;
      else
        next = nextNode.historyAfter || this.before(end);
      // (The this.before(end) is a hack -- FF sometimes removes
      // properties from BR nodes, in which case the best we can hope
      // for is to not break.)
    }
    return shadows;
  },

  // Update the DOM tree to contain the lines specified in a given
  // chain, link this chain into the DOM nodes.
  applyChain: function(chain) {
    // Some attempt is made to prevent the cursor from jumping
    // randomly when an undo or redo happens. It still behaves a bit
    // strange sometimes.
    var cursor = select.cursorPos(this.container, false), self = this;

    // Remove all nodes in the DOM tree between from and to (null for
    // start/end of container).
    function removeRange(from, to) {
      var pos = from ? from.nextSibling : self.container.firstChild;
      while (pos != to) {
        var temp = pos.nextSibling;
        removeElement(pos);
        pos = temp;
      }
    }

    var start = chain[0].from, end = chain[chain.length - 1].to;
    // Clear the space where this change has to be made.
    removeRange(start, end);

    // Insert the content specified by the chain into the DOM tree.
    for (var i = 0; i < chain.length; i++) {
      var line = chain[i];
      // The start and end of the space are already correct, but BR
      // tags inside it have to be put back.
      if (i > 0)
        self.container.insertBefore(line.from, end);

      // Add the text.
      var node = makePartSpan(fixSpaces(line.text), this.container.ownerDocument);
      self.container.insertBefore(node, end);
      // See if the cursor was on this line. Put it back, adjusting
      // for changed line length, if it was.
      if (cursor && cursor.node == line.from) {
        var cursordiff = 0;
        var prev = this.after(line.from);
        if (prev && i == chain.length - 1) {
          // Only adjust if the cursor is after the unchanged part of
          // the line.
          for (var match = 0; match < cursor.offset &&
               line.text.charAt(match) == prev.text.charAt(match); match++);
          if (cursor.offset > match)
            cursordiff = line.text.length - prev.text.length;
        }
        select.setCursorPos(this.container, {node: line.from, offset: Math.max(0, cursor.offset + cursordiff)});
      }
      // Cursor was in removed line, this is last new line.
      else if (cursor && (i == chain.length - 1) && cursor.node && cursor.node.parentNode != this.container) {
        select.setCursorPos(this.container, {node: line.from, offset: line.text.length});
      }
    }

    // Anchor the chain in the DOM tree.
    this.linkChain(chain);
    return start;
  }
};

/* A few useful utility functions. */

// Capture a method on an object.
function method(obj, name) {
  return function() {obj[name].apply(obj, arguments);};
}

// The value used to signal the end of a sequence in iterators.
var StopIteration = {toString: function() {return "StopIteration"}};

// Apply a function to each element in a sequence.
function forEach(iter, f) {
  if (iter.next) {
    try {while (true) f(iter.next());}
    catch (e) {if (e != StopIteration) throw e;}
  }
  else {
    for (var i = 0; i < iter.length; i++)
      f(iter[i]);
  }
}

// Map a function over a sequence, producing an array of results.
function map(iter, f) {
  var accum = [];
  forEach(iter, function(val) {accum.push(f(val));});
  return accum;
}

// Create a predicate function that tests a string againsts a given
// regular expression. No longer used but might be used by 3rd party
// parsers.
function matcher(regexp){
  return function(value){return regexp.test(value);};
}

// Test whether a DOM node has a certain CSS class. Much faster than
// the MochiKit equivalent, for some reason.
function hasClass(element, className){
  var classes = element.className;
  return classes && new RegExp("(^| )" + className + "($| )").test(classes);
}

// Insert a DOM node after another node.
function insertAfter(newNode, oldNode) {
  var parent = oldNode.parentNode;
  parent.insertBefore(newNode, oldNode.nextSibling);
  return newNode;
}

function removeElement(node) {
  if (node.parentNode)
    node.parentNode.removeChild(node);
}

function clearElement(node) {
  while (node.firstChild)
    node.removeChild(node.firstChild);
}

// Check whether a node is contained in another one.
function isAncestor(node, child) {
  while (child = child.parentNode) {
    if (node == child)
      return true;
  }
  return false;
}

// The non-breaking space character.
var nbsp = "\u00a0";
var matching = {"{": "}", "[": "]", "(": ")",
                "}": "{", "]": "[", ")": "("};

// Standardize a few unportable event properties.
function normalizeEvent(event) {
  if (!event.stopPropagation) {
    event.stopPropagation = function() {this.cancelBubble = true;};
    event.preventDefault = function() {this.returnValue = false;};
  }
  if (!event.stop) {
    event.stop = function() {
      this.stopPropagation();
      this.preventDefault();
    };
  }

  if (event.type == "keypress") {
    event.code = (event.charCode == null) ? event.keyCode : event.charCode;
    event.character = String.fromCharCode(event.code);
  }
  return event;
}

// Portably register event handlers.
function addEventHandler(node, type, handler, removeFunc) {
  function wrapHandler(event) {
    handler(normalizeEvent(event || window.event));
  }
  if (typeof node.addEventListener == "function") {
    node.addEventListener(type, wrapHandler, false);
    if (removeFunc) return function() {node.removeEventListener(type, wrapHandler, false);};
  }
  else {
    node.attachEvent("on" + type, wrapHandler);
    if (removeFunc) return function() {node.detachEvent("on" + type, wrapHandler);};
  }
}

function nodeText(node) {
  return node.textContent || node.innerText || node.nodeValue || "";
}

function nodeTop(node) {
  var top = 0;
  while (node.offsetParent) {
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return top;
}

function isBR(node) {
  var nn = node.nodeName;
  return nn == "BR" || nn == "br";
}
function isSpan(node) {
  var nn = node.nodeName;
  return nn == "SPAN" || nn == "span";
}



