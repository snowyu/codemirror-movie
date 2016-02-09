!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.CodeMirrorMovie=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/adam/code/internal/codemirror-movie/lib/actions.js":[function(require,module,exports){
"use strict";

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var _utils = require("./utils");

var extend = _utils.extend;
var makePos = _utils.makePos;
var getCursor = _utils.getCursor;

var actions = {
	/**
  * Type-in passed text into current editor char-by-char
  * @param {Object} options Current options
  * @param {CodeMirror} editor Editor instance where action should be
  * performed
  * @param {Function} next Function to call when action performance
  * is completed
  * @param {Function} timer Function that creates timer for delayed
  * execution. This timer will automatically delay execution when
  * scenario is paused and revert when played again
  */
	type: function type(options, editor, next, timer) {
		options = extend({
			text: "", // text to type
			delay: 60, // delay between character typing
			pos: null // initial position where to start typing
		}, wrap("text", options));

		if (!options.text) {
			throw new Error("No text provided for \"type\" action");
		}

		if (options.pos !== null) {
			editor.setCursor(makePos(options.pos, editor));
		}

		var chars = options.text.split("");

		timer(function perform() {
			var ch = chars.shift();
			editor.replaceSelection(ch, "end");
			if (chars.length) {
				timer(perform, options.delay);
			} else {
				next();
			}
		}, options.delay);
	},

	/**
  * Wait for a specified timeout
  * @param options
  * @param editor
  * @param next
  * @param timer
  */
	wait: function wait(options, editor, next, timer) {
		options = extend({
			timeout: 100
		}, wrap("timeout", options));

		timer(next, parseInt(options.timeout, 10));
	},

	/**
  * Move caret to a specified position
  */
	moveTo: function moveTo(options, editor, next, timer) {
		options = extend({
			delay: 80,
			immediate: false // TODO: remove, use delay: 0 instead
		}, wrap("pos", options));

		if (typeof options.pos === "undefined") {
			throw new Error("No position specified for \"moveTo\" action");
		}

		var curPos = getCursor(editor);
		// reset selection, if exists
		editor.setSelection(curPos, curPos);
		var targetPos = makePos(options.pos, editor);

		if (options.immediate || !options.delay) {
			editor.setCursor(targetPos);
			next();
		}

		var deltaLine = targetPos.line - curPos.line;
		var deltaChar = targetPos.ch - curPos.ch;
		var steps = Math.max(deltaChar, deltaLine);
		// var stepLine = deltaLine / steps;
		// var stepChar = deltaChar / steps;
		var stepLine = deltaLine < 0 ? -1 : 1;
		var stepChar = deltaChar < 0 ? -1 : 1;

		timer(function perform() {
			curPos = getCursor(editor);
			if (steps > 0 && !(curPos.line == targetPos.line && curPos.ch == targetPos.ch)) {

				if (curPos.line != targetPos.line) {
					curPos.line += stepLine;
				}

				if (curPos.ch != targetPos.ch) {
					curPos.ch += stepChar;
				}

				editor.setCursor(curPos);
				steps--;
				timer(perform, options.delay);
			} else {
				editor.setCursor(targetPos);
				next();
			}
		}, options.delay);
	},

	/**
  * Similar to "moveTo" function but with immediate cursor position update
  */
	jumpTo: function jumpTo(options, editor, next, timer) {
		options = extend({
			afterDelay: 200
		}, wrap("pos", options));

		if (typeof options.pos === "undefined") {
			throw new Error("No position specified for \"jumpTo\" action");
		}

		editor.setCursor(makePos(options.pos, editor));
		timer(next, options.afterDelay);
	},

	/**
  * Executes predefined CodeMirror command
  * @param {Object} options
  * @param {CodeMirror} editor
  * @param {Function} next
  * @param {Function} timer
  */
	run: function run(options, editor, next, timer) {
		options = extend({
			beforeDelay: 500,
			times: 1
		}, wrap("command", options));

		var times = options.times;
		timer(function perform() {
			if (typeof options.command === "function") {
				options.command(editor, options);
			} else {
				editor.execCommand(options.command);
			}

			if (--times > 0) {
				timer(perform, options.beforeDelay);
			} else {
				next();
			}
		}, options.beforeDelay);
	},

	/**
  * Creates selection for specified position
  * @param {Object} options
  * @param {CodeMirror} editor
  * @param {Function} next
  * @param {Function} timer
  */
	select: function select(options, editor, next, timer) {
		options = extend({
			from: "caret"
		}, wrap("to", options));

		var from = makePos(options.from, editor);
		var to = makePos(options.to, editor);
		editor.setSelection(from, to);
		next();
	},

	/**
  * Highlights text with an optional CSS class
  * @param {Object} options
  * @param {CodeMirror} editor
  * @param {Function} next
  * @param {Function} timer
  */
	highlight: function highlight(options, editor, next, timer) {
		options = extend({
			from: "caret",
			style: "highlighted"
		}, wrap("to", options));

		var from = makePos(options.from, editor);
		var to = makePos(options.to, editor);
		editor.markText(from, to, { className: options.style });
		next();
	}
};

function wrap(key, value) {
	return typeof value === "object" ? value : _defineProperty({}, key, value);
}

module.exports = actions;

},{"./utils":"/Users/adam/code/internal/codemirror-movie/lib/utils.js"}],"/Users/adam/code/internal/codemirror-movie/lib/dom.js":[function(require,module,exports){
"use strict";

exports.viewportRect = viewportRect;

/**
 * Removes element from parent
 * @param {Element} elem
 * @returns {Element}
 */
exports.remove = remove;

/**
 * Renders string into DOM element
 * @param {String} str
 * @returns {Element}
 */
exports.toDOM = toDOM;

/**
 * Sets or retrieves CSS property value
 * @param {Element} elem
 * @param {String} prop
 * @param {String} val
 */
exports.css = css;
Object.defineProperty(exports, "__esModule", {
	value: true
});
"use strict";

var toArray = require("./utils").toArray;

var w3cCSS = document.defaultView && document.defaultView.getComputedStyle;

function viewportRect() {
	var body = document.body;
	var docElem = document.documentElement;
	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;
	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

	return {
		top: scrollTop - clientTop,
		left: scrollLeft - clientLeft,
		width: body.clientWidth || docElem.clientWidth,
		height: body.clientHeight || docElem.clientHeight
	};
}

function remove(elem) {
	ar(elem).forEach(function (el) {
		return el.parentNode && el.parentNode.removeChild(el);
	});
	return elem;
}

function toDOM(str) {
	var div = document.createElement("div");
	div.innerHTML = str;
	return div.firstChild;
}

function css(elem, prop, val) {
	if (typeof prop === "string" && val == null) {
		return getCSS(elem, prop);
	}

	if (typeof prop === "string") {
		var obj = {};
		obj[prop] = val;
		prop = obj;
	}

	setCSS(elem, prop);
}

function ar(obj) {
	if (obj.length === +obj.length) {
		return toArray(obj);
	}

	return Array.isArray(obj) ? obj : [obj];
}

function toCamelCase(name) {
	return name.replace(/\-(\w)/g, function (str, p1) {
		return p1.toUpperCase();
	});
}

/**
 * Returns CSS property value of given element.
 * @author jQuery Team
 * @param {Element} elem
 * @param {String} name CSS property value
 */
function getCSS(elem, name) {
	var rnumpx = /^-?\d+(?:px)?$/i,
	    rnum = /^-?\d(?:\.\d+)?/,
	    rsuf = /\d$/;

	var nameCamel = toCamelCase(name);
	// If the property exists in style[], then it's been set
	// recently (and is current)
	if (elem.style[nameCamel]) {
		return elem.style[nameCamel];
	}

	if (w3cCSS) {
		var cs = window.getComputedStyle(elem, "");
		return cs.getPropertyValue(name);
	}

	if (elem.currentStyle) {
		var ret = elem.currentStyle[name] || elem.currentStyle[nameCamel];
		var style = elem.style || elem;

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		if (!rnumpx.test(ret) && rnum.test(ret)) {
			// Remember the original values
			var left = style.left,
			    rsLeft = elem.runtimeStyle.left;

			// Put in the new values to get a computed value out
			elem.runtimeStyle.left = elem.currentStyle.left;
			var suffix = rsuf.test(ret) ? "em" : "";
			style.left = nameCamel === "fontSize" ? "1em" : ret + suffix || 0;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			elem.runtimeStyle.left = rsLeft;
		}

		return ret;
	}
}

/**
 * Sets CSS properties to given element
 * @param {Element} elem
 * @param {Object} params CSS properties to set
 */
function setCSS(elem, params) {
	if (!elem) {
		return;
	}

	var numProps = { "line-height": 1, "z-index": 1, opacity: 1 };
	var props = Object.keys(params).map(function (k) {
		var v = params[k];
		var name = k.replace(/([A-Z])/g, "-$1").toLowerCase();
		return name + ":" + (typeof v === "number" && !(name in numProps) ? v + "px" : v);
	});

	elem.style.cssText += ";" + props.join(";");
}

},{"./utils":"/Users/adam/code/internal/codemirror-movie/lib/utils.js"}],"/Users/adam/code/internal/codemirror-movie/lib/movie.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * High-level function to create movie instance on textarea.
 * @param {Element} target Reference to textarea, either <code>Element</code>
 * or string ID. It can also accept existing CodeMirror object.
 * @param {Object} movieOptions Movie options. See <code>defaultOptions</code>
 * for value reference
 * @param {Object} editorOptions Additional options passed to CodeMirror
 * editor initializer.
 */
exports["default"] = movie;
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * A high-level library interface for creating scenarios over textarea
 * element. The <code>CodeMirror.movie</code> takes reference to textarea
 * element (or its ID) and parses its content for initial content value,
 * scenario and outline.
 */
"use strict";

var _utils = require("./utils");

var parseJSON = _utils.parseJSON;
var extend = _utils.extend;
var toArray = _utils.toArray;

var Scenario = _interopRequire(require("./scenario"));

var outline = _interopRequire(require("./widgets/outline"));

var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
var mac = ios || /Mac/.test(navigator.platform);

var macCharMap = {
	ctrl: "⌃",
	control: "⌃",
	cmd: "⌘",
	shift: "⇧",
	alt: "⌥",
	enter: "⏎",
	tab: "⇥",
	left: "←",
	right: "→",
	up: "↑",
	down: "↓"
};

var pcCharMap = {
	cmd: "Ctrl",
	control: "Ctrl",
	ctrl: "Ctrl",
	alt: "Alt",
	shift: "Shift",
	left: "←",
	right: "→",
	up: "↑",
	down: "↓"
};

var defaultOptions = {
	/**
  * Automatically parse movie definition from textarea content. Setting
  * this property to <code>false</code> assumes that user wants to
  * explicitly provide movie data: initial value, scenario etc.
  */
	parse: true,

	/**
  * String or regexp used to separate sections of movie definition, e.g.
  * default value, scenario and editor options
  */
	sectionSeparator: "@@@",

	/** Regular expression to extract outline from scenario line */
	outlineSeparator: /\s+:::\s+(.+)$/,

	/** Automatically prettify keyboard shortcuts in outline */
	prettifyKeys: true,

	/** Strip parentheses from prettyfied keyboard shortcut definition */
	stripParentheses: false
};exports.defaultOptions = defaultOptions;

function movie(target) {
	var movieOptions = arguments[1] === undefined ? {} : arguments[1];
	var editorOptions = arguments[2] === undefined ? {} : arguments[2];

	setupCodeMirror();

	if (typeof target === "string") {
		target = document.getElementById(target);
	}

	var targetIsTextarea = target.nodeName.toLowerCase() === "textarea";

	movieOptions = extend({}, defaultOptions, movieOptions);
	editorOptions = extend({
		theme: "espresso",
		mode: "text/html",
		indentWithTabs: true,
		tabSize: 4,
		lineNumbers: true,
		preventCursorMovement: true
	}, editorOptions);

	var initialValue = editorOptions.value || (targetIsTextarea ? target.value : target.getValue()) || "";

	if (targetIsTextarea && movieOptions.parse) {
		extend(movieOptions, parseMovieDefinition(initialValue, movieOptions));
		initialValue = movieOptions.value;
		if (movieOptions.editorOptions) {
			extend(editorOptions, movieOptions.editorOptions);
		}

		// read CM options from given textarea
		var cmAttr = /^data\-cm\-(.+)$/i;
		toArray(target.attributes).forEach(function (attr) {
			var m = attr.name.match(cmAttr);
			if (m) {
				editorOptions[m[1]] = attr.value;
			}
		});
	}

	// normalize line endings
	initialValue = initialValue.replace(/\r?\n/g, "\n");

	// locate initial caret position from | symbol
	var initialPos = initialValue.indexOf("|");

	if (targetIsTextarea) {
		target.value = editorOptions.value = initialValue = initialValue.replace(/\|/g, "");
	}

	// create editor instance if needed
	var editor = targetIsTextarea ? CodeMirror.fromTextArea(target, editorOptions) : target;

	if (initialPos != -1) {
		editor.setCursor(editor.posFromIndex(initialPos));
	}

	// save initial data so we can revert to it later
	editor.__initial = {
		content: initialValue,
		pos: editor.getCursor(true)
	};

	var wrapper = editor.getWrapperElement();

	// adjust height, if required
	if (editorOptions.height) {
		wrapper.style.height = editorOptions.height + "px";
	}

	wrapper.className += " CodeMirror-movie" + (movieOptions.outline ? " CodeMirror-movie_with-outline" : "");

	var sc = new Scenario(movieOptions.scenario, editor);
	if (movieOptions.outline) {
		wrapper.className += " CodeMirror-movie_with-outline";
		wrapper.appendChild(outline(movieOptions.outline, sc));
	}
	return sc;
}

/**
 * Prettyfies key bindings references in given string: formats it according
 * to current user’s platform. The key binding should be defined inside
 * parentheses, e.g. <code>(ctrl-alt-up)</code>
 * @param {String} str
 * @param {Object} options Transform options
 * @returns {String}
 */
function prettifyKeyBindings(str, options) {
	options = options || {};
	var reKey = /ctrl|alt|shift|cmd/i;
	var map = mac ? macCharMap : pcCharMap;
	return str.replace(/\((.+?)\)/g, function (m, kb) {
		if (reKey.test(kb)) {
			var parts = kb.toLowerCase().split(/[\-\+]/).map(function (key) {
				return map[key.toLowerCase()] || key.toUpperCase();
			});

			m = parts.join(mac ? "" : "+");
			if (!options.stripParentheses) {
				m = "(" + m + ")";
			}
		}

		return m;
	});
}

function readLines(text) {
	// IE fails to split string by regexp,
	// need to normalize newlines first
	var nl = "\n";
	var lines = (text || "").replace(/\r\n/g, nl).replace(/\n\r/g, nl).replace(/\r/g, nl).split(nl);

	// If this line starts with spaces or is just a }, combine it with the last line
	for (var i = lines.length - 1; i >= 0; i--) {
		if (lines[i].match(/^[\s\s]|^[}$]/)) {
			lines[i - 1] = lines[i - 1] + "\n" + lines[i];
			lines.splice(i, 1);
		}
	}

	// Combine multiline statements into a single line
	for (var i = 0, len = lines.length; i < lines.length; i++) {
		if (lines[i].match("\n") && lines[i].match()) {
			lines[i] = parseMultlineScenerio(lines[i]);
		}
	}

	return lines.filter(Boolean);
}

// Allow commands to be spread over multiple lines, using indentation to determine
function parseMultlineScenerio(line) {
	var reg = /^(\w+?)\s*:\s*({[\s|\S]+})\s*(?::::\s*([\s\S]+))?/m,
	    res = line.match(reg),
	    ob = {};

	var parsedRes = res[2].split("\n"),
	    key,
	    t,
	    tabLength = false,
	    firstLevelIndentRegex = "(w+?)s*:s*(.+)",
	    lastLevelIndentRegex;
	for (var i = 0, len = parsedRes.length; i < len; i++) {
		var tabs = parsedRes[i].match(/^(\s)+/);
		if (tabs) {
			// 2 tabs means this must be a key
			if (tabs[0].length == tabLength || !tabLength) {
				if (!tabLength) {
					tabLength = tabs[0].length;
					firstLevelIndentRegex = new RegExp("^\\s{" + tabLength + "}(\\w+?)\\s*:\\s*(.+)");
					lastLevelIndentRegex = new RegExp("^\\s{" + tabLength * 2 + "}");
				}
				// If this is a {key: value}, save both
				if (parsedRes[i].match(firstLevelIndentRegex)) {
					t = parseJSON("{" + parsedRes[i] + "}");
					key = Object.keys(t)[0];
					ob[key] = t[key];
				} else {
					// Otherwise, just a key, add that in
					key = parsedRes[i].match(/\w+/)[0];
					ob[key] = "";
				}
			} else {
				// This is a multiline string we need to combine
				ob[key] = ob[key] + parsedRes[i].replace(lastLevelIndentRegex, "") + "\n";
			}
		} else if (parsedRes[i].match(/^\s*$/) && key) {
			ob[key] = ob[key] + "\n";
		}
	}

	Object.keys(ob).forEach(function (key) {
		if (ob[key].trim) {
			ob[key] = ob[key].trim();
		}
	});

	// Add Outline
	var outline = "";
	if (res[3]) {
		outline = " ::: " + res[3];
	}

	return res[1] + ":" + JSON.stringify(ob) + outline;
}

function unescape(text) {
	var replacements = {
		"&lt;": "<",
		"&gt;": ">",
		"&amp;": "&"
	};

	return text.replace(/&(lt|gt|amp);/g, function (str, p1) {
		return replacements[str] || str;
	});
}

/**
 * Extracts initial content, scenario and outline from given string
 * @param {String} text
 * @param {Object} options
 */
function parseMovieDefinition(text) {
	var options = arguments[1] === undefined ? {} : arguments[1];

	options = extend({}, defaultOptions, options || {});
	var parts = text.split(options.sectionSeparator);

	// parse scenario
	var reDef = /^(\w+?)\s*:\s*({[\s|\S]+})\s*(?::::\s*(.+))?/m;
	var scenario = [];
	var outline = {};
	var editorOptions = {};

	var skipComment = function (line) {
		return line.charAt(0) !== "#";
	};

	// read movie definition
	readLines(parts[1]).filter(skipComment).forEach(function (line) {
		// do we have outline definition here?
		line = line.replace(options.outlineSeparator, function (str, title) {
			if (options.prettifyKeys) {
				outline[scenario.length] = prettifyKeyBindings(title.trim());
			}
			return "";
		});

		var sd = line.match(reDef);
		if (!sd) {
			return scenario.push(line.trim());
		}

		if (sd[2].charAt(0) === "{") {
			var obj = {};
			obj[sd[1]] = parseJSON(unescape(sd[2]));
			return scenario.push(obj);
		}

		scenario.push(sd[1] + ":" + unescape(sd[2]));
	});

	// read editor options
	if (parts[2]) {
		readLines(parts[2]).filter(skipComment).forEach(function (line) {
			var sd = line.match(reDef);
			if (sd) {
				editorOptions[sd[1]] = sd[2];
			}
		});
	}

	return {
		value: unescape(parts[0].trim()),
		scenario: scenario,
		outline: Object.keys(outline).length ? outline : null,
		editorOptions: editorOptions
	};
}

function setupCodeMirror() {
	if (typeof CodeMirror === "undefined" || "preventCursorMovement" in CodeMirror.defaults) {
		return;
	}

	CodeMirror.defineOption("preventCursorMovement", false, function (cm) {
		var handler = function (cm, event) {
			return cm.getOption("readOnly") && event.preventDefault();
		};
		cm.on("keydown", handler);
		cm.on("mousedown", handler);
	});
}

if (typeof CodeMirror !== "undefined") {
	CodeMirror.movie = movie;
}

},{"./scenario":"/Users/adam/code/internal/codemirror-movie/lib/scenario.js","./utils":"/Users/adam/code/internal/codemirror-movie/lib/utils.js","./widgets/outline":"/Users/adam/code/internal/codemirror-movie/lib/widgets/outline.js"}],"/Users/adam/code/internal/codemirror-movie/lib/scenario.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});
"use strict";

var commonActions = _interopRequire(require("./actions"));

var prompt = require("./widgets/prompt").actions;

var tooltip = require("./widgets/tooltip").actions;

var extend = require("./utils").extend;

var actionsDefinition = extend({}, commonActions, prompt, tooltip);

var STATE_IDLE = "idle";
var STATE_PLAY = "play";
var STATE_PAUSE = "pause";

// Regular expression used to split event strings
var eventSplitter = /\s+/;

var defaultOptions = {
	beforeDelay: 1000,
	afterDelay: 1000
};

exports.defaultOptions = defaultOptions;
/**
 * @param {Object} actions Actions scenario
 * @param {Object} data Initial content (<code>String</code>) or editor
 * instance (<code>CodeMirror</code>)
 */

var Scenario = (function () {
	function Scenario(actions, data) {
		_classCallCheck(this, Scenario);

		this._actions = actions;
		this._actionIx = 0;
		this._editor = null;
		this._state = STATE_IDLE;
		this._timerQueue = [];

		if (data && "getValue" in data) {
			this._editor = data;
		}

		var ed = this._editor;
		if (ed && !ed.__initial) {
			ed.__initial = {
				content: ed.getValue(),
				pos: ed.getCursor(true)
			};
		}
	}

	_createClass(Scenario, {
		_setup: {
			value: function _setup(editor) {
				if (!editor && this._editor) {
					editor = this._editor;
				}

				editor.execCommand("revert");
				return editor;
			}
		},
		play: {

			/**
    * Play current scenario
    * @param {CodeMirror} editor Editor instance where on which scenario 
    * should be played
    * @memberOf Scenario
    */

			value: function play(editor) {
				if (this._state === STATE_PLAY) {
					// already playing
					return;
				}

				if (this._state === STATE_PAUSE) {
					// revert from paused state
					editor = editor || this._editor;
					editor.focus();
					var timerObj = null;
					while (timerObj = this._timerQueue.shift()) {
						requestTimer(timerObj.fn, timerObj.delay);
					}

					this._state = STATE_PLAY;
					this.trigger("resume");
					return;
				}

				this._editor = editor = this._setup(editor);
				editor.focus();

				var timer = this.requestTimer.bind(this);
				var that = this;
				this._actionIx = 0;
				var next = (function (_next) {
					var _nextWrapper = function next() {
						return _next.apply(this, arguments);
					};

					_nextWrapper.toString = function () {
						return _next.toString();
					};

					return _nextWrapper;
				})(function () {
					if (that._actionIx >= that._actions.length) {
						return timer(function () {
							that.stop();
						}, defaultOptions.afterDelay);
					}

					that.trigger("action", that._actionIx);
					var action = parseActionCall(that._actions[that._actionIx++]);

					if (action.name in actionsDefinition) {
						actionsDefinition[action.name].call(that, action.options, editor, next, timer);
					} else {
						throw new Error("No such action: " + action.name);
					}
				});

				this._state = STATE_PLAY;
				this._editor.setOption("readOnly", true);
				this.trigger("play");
				timer(next, defaultOptions.beforeDelay);
			}
		},
		pause: {

			/**
    * Pause current scenario playback. It can be restored with 
    * <code>play()</code> method call 
    */

			value: function pause() {
				this._state = STATE_PAUSE;
				this.trigger("pause");
			}
		},
		stop: {

			/**
    * Stops playback of current scenario
    */

			value: function stop() {
				if (this._state !== STATE_IDLE) {
					this._state = STATE_IDLE;
					this._timerQueue.length = 0;
					this._editor.setOption("readOnly", false);
					this.trigger("stop");
				}
			}
		},
		state: {

			/**
    * Returns current playback state
    * @return {String}
    */

			get: function () {
				return this._state;
			}
		},
		toggle: {

			/**
    * Toggle playback of movie scenario
    */

			value: function toggle() {
				if (this._state === STATE_PLAY) {
					this.pause();
				} else {
					this.play();
				}
			}
		},
		requestTimer: {
			value: (function (_requestTimer) {
				var _requestTimerWrapper = function requestTimer(_x, _x2) {
					return _requestTimer.apply(this, arguments);
				};

				_requestTimerWrapper.toString = function () {
					return _requestTimer.toString();
				};

				return _requestTimerWrapper;
			})(function (fn, delay) {
				if (this._state !== STATE_PLAY) {
					// save function call into a queue till next 'play()' call
					this._timerQueue.push({
						fn: fn,
						delay: delay
					});
				} else {
					return requestTimer(fn, delay);
				}
			})
		},
		on: {

			// borrowed from Backbone
			/**
    * Bind one or more space separated events, `events`, to a `callback`
    * function. Passing `"all"` will bind the callback to all events fired.
    * @param {String} events
    * @param {Function} callback
    * @param {Object} context
    * @memberOf eventDispatcher
    */

			value: function on(events, callback, context) {
				var calls, event, node, tail, list;
				if (!callback) {
					return this;
				}

				events = events.split(eventSplitter);
				calls = this._callbacks || (this._callbacks = {});

				// Create an immutable callback list, allowing traversal during
				// modification.  The tail is an empty object that will always be used
				// as the next node.
				while (event = events.shift()) {
					list = calls[event];
					node = list ? list.tail : {};
					node.next = tail = {};
					node.context = context;
					node.callback = callback;
					calls[event] = {
						tail: tail,
						next: list ? list.next : node
					};
				}

				return this;
			}
		},
		off: {

			/**
    * Remove one or many callbacks. If `context` is null, removes all
    * callbacks with that function. If `callback` is null, removes all
    * callbacks for the event. If `events` is null, removes all bound
    * callbacks for all events.
    * @param {String} events
    * @param {Function} callback
    * @param {Object} context
    */

			value: function off(events, callback, context) {
				var event, calls, node, tail, cb, ctx;

				// No events, or removing *all* events.
				if (!(calls = this._callbacks)) {
					return;
				}

				if (!(events || callback || context)) {
					delete this._callbacks;
					return this;
				}

				// Loop through the listed events and contexts, splicing them out of the
				// linked list of callbacks if appropriate.
				events = events ? events.split(eventSplitter) : Object.keys(calls);
				while (event = events.shift()) {
					node = calls[event];
					delete calls[event];
					if (!node || !(callback || context)) {
						continue;
					}

					// Create a new list, omitting the indicated callbacks.
					tail = node.tail;
					while ((node = node.next) !== tail) {
						cb = node.callback;
						ctx = node.context;
						if (callback && cb !== callback || context && ctx !== context) {
							this.on(event, cb, ctx);
						}
					}
				}

				return this;
			}
		},
		trigger: {

			/**
    * Trigger one or many events, firing all bound callbacks. Callbacks are
    * passed the same arguments as `trigger` is, apart from the event name
    * (unless you're listening on `"all"`, which will cause your callback
    * to receive the true name of the event as the first argument).
    * @param {String} events
    */

			value: function trigger(events) {
				for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
					rest[_key - 1] = arguments[_key];
				}

				var event, node, calls, tail, args, all;
				if (!(calls = this._callbacks)) {
					return this;
				}

				all = calls.all;
				events = events.split(eventSplitter);

				// For each event, walk through the linked list of callbacks twice,
				// first to trigger the event, then to trigger any `"all"` callbacks.
				while (event = events.shift()) {
					if (node = calls[event]) {
						tail = node.tail;
						while ((node = node.next) !== tail) {
							node.callback.apply(node.context || this, rest);
						}
					}
					if (node = all) {
						tail = node.tail;
						args = [event].concat(rest);
						while ((node = node.next) !== tail) {
							node.callback.apply(node.context || this, args);
						}
					}
				}

				return this;
			}
		}
	});

	return Scenario;
})();

exports["default"] = Scenario;

/**
 * Parses action call from string
 * @param {String} data
 * @returns {Object}
 */
function parseActionCall(data) {
	if (typeof data === "string") {
		var parts = data.split(":");
		return {
			name: parts.shift(),
			options: parts.join(":")
		};
	} else {
		var name = Object.keys(data)[0];
		return {
			name: name,
			options: data[name]
		};
	}
}

function requestTimer(fn, delay) {
	if (!delay) {
		fn();
	} else {
		return setTimeout(fn, delay);
	}
}

},{"./actions":"/Users/adam/code/internal/codemirror-movie/lib/actions.js","./utils":"/Users/adam/code/internal/codemirror-movie/lib/utils.js","./widgets/prompt":"/Users/adam/code/internal/codemirror-movie/lib/widgets/prompt.js","./widgets/tooltip":"/Users/adam/code/internal/codemirror-movie/lib/widgets/tooltip.js"}],"/Users/adam/code/internal/codemirror-movie/lib/utils.js":[function(require,module,exports){
"use strict";

exports.extend = extend;
exports.toArray = toArray;

/**
 * Returns prefixed (if required) CSS property name
 * @param  {String} prop
 * @return {String}
 */
exports.prefixed = prefixed;
exports.posObj = posObj;
exports.getCursor = getCursor;

/**
 * Helper function that produces <code>{line, ch}</code> object from
 * passed argument
 * @param {Object} pos
 * @param {CodeMirror} editor
 * @returns {Object}
 */
exports.makePos = makePos;
exports.template = template;
exports.find = find;

/**
 * Relaxed JSON parser.
 * @param {String} text
 * @returns {Object} 
 */
exports.parseJSON = parseJSON;
Object.defineProperty(exports, "__esModule", {
	value: true
});
var propCache = {};

// detect CSS 3D Transforms for smoother animations
var has3d = (function () {
	var el = document.createElement("div");
	var cssTransform = prefixed("transform");
	if (cssTransform) {
		el.style[cssTransform] = "translateZ(0)";
		return /translatez/i.test(el.style[cssTransform]);
	}

	return false;
})();

exports.has3d = has3d;

function extend(obj) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	args.forEach(function (a) {
		if (typeof a === "object") {
			Object.keys(a).forEach(function (key) {
				return obj[key] = a[key];
			});
		}
	});
	return obj;
}

function toArray(obj) {
	var ix = arguments[1] === undefined ? 0 : arguments[1];

	return Array.prototype.slice.call(obj, ix);
}

function prefixed(prop) {
	if (prop in propCache) {
		return propCache[prop];
	}

	var el = document.createElement("div");
	var style = el.style;

	var prefixes = ["o", "ms", "moz", "webkit"];
	var props = [prop];
	var capitalize = function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.substr(1);
	};

	prop = prop.replace(/\-([a-z])/g, function (str, ch) {
		return ch.toUpperCase();
	});

	var capProp = capitalize(prop);
	prefixes.forEach(function (prefix) {
		props.push(prefix + capProp, capitalize(prefix) + capProp);
	});

	for (var i = 0, il = props.length; i < il; i++) {
		if (props[i] in style) {
			return propCache[prop] = props[i];
		}
	}

	return propCache[prop] = null;
}

function posObj(obj) {
	return {
		line: obj.line,
		ch: obj.ch
	};
}

function getCursor(editor) {
	var start = arguments[1] === undefined ? "from" : arguments[1];

	return posObj(editor.getCursor(start));
}

function makePos(pos, editor) {
	if (pos === "caret") {
		return getCursor(editor);
	}

	if (typeof pos === "string") {
		if (~pos.indexOf(":")) {
			var parts = pos.split(":");
			return {
				line: +parts[0],
				ch: +parts[1]
			};
		}

		pos = +pos;
	}

	if (typeof pos === "number") {
		return posObj(editor.posFromIndex(pos));
	}

	return posObj(pos);
}

function template(tmpl, data) {
	var fn = function (data) {
		return tmpl.replace(/<%([-=])?\s*([\w\-]+)\s*%>/g, function (str, op, key) {
			return data[key.trim()];
		});
	};
	return data ? fn(data) : fn;
}

function find(arr, iter) {
	var found;
	arr.some(function (item, i, arr) {
		if (iter(item, i, arr)) {
			return found = item;
		}
	});
	return found;
}

function parseJSON(text) {
	try {
		return new Function("return " + text)();
	} catch (e) {
		return {};
	}
}

},{}],"/Users/adam/code/internal/codemirror-movie/lib/vendor/tween.js":[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports["default"] = tween;

/**
 * Get or set default value
 * @param  {String} name
 * @param  {Object} value
 * @return {Object}
 */
exports.defaults = defaults;

/**
 * Returns all active animation objects.
 * For debugging mostly
 * @return {Array}
 */
exports._all = _all;
exports.stop = stop;
Object.defineProperty(exports, "__esModule", {
	value: true
});
var global = window;
var time = Date.now ? function () {
	return Date.now();
} : function () {
	return +new Date();
};

var indexOf = "indexOf" in Array.prototype ? function (array, value) {
	return array.indexOf(value);
} : function (array, value) {
	for (var i = 0, il = array.length; i < il; i++) {
		if (array[i] === value) {
			return i;
		}
	}

	return -1;
};

function extend(obj) {
	for (var i = 1, il = arguments.length, source; i < il; i++) {
		source = arguments[i];
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	}

	return obj;
}

/**
 * requestAnimationFrame polyfill by Erik Möller
 * fixes from Paul Irish and Tino Zijdel
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 */
(function () {
	var lastTime = 0;
	var vendors = ["ms", "moz", "webkit", "o"];
	for (var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x) {
		global.requestAnimationFrame = global[vendors[x] + "RequestAnimationFrame"];
		global.cancelAnimationFrame = global[vendors[x] + "CancelAnimationFrame"] || global[vendors[x] + "CancelRequestAnimationFrame"];
	}

	if (!global.requestAnimationFrame) global.requestAnimationFrame = function (callback, element) {
		var currTime = time();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = global.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!global.cancelAnimationFrame) global.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();

var dummyFn = function dummyFn() {};
var anims = [];
var idCounter = 0;

var defaults = {
	duration: 500, // ms
	delay: 0,
	easing: "linear",
	start: dummyFn,
	step: dummyFn,
	complete: dummyFn,
	autostart: true,
	reverse: false
};

var easings = {
	linear: function linear(t, b, c, d) {
		return c * t / d + b;
	},
	inQuad: function inQuad(t, b, c, d) {
		return c * (t /= d) * t + b;
	},
	outQuad: function outQuad(t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	},
	inOutQuad: function inOutQuad(t, b, c, d) {
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t + b;
		}return -c / 2 * (--t * (t - 2) - 1) + b;
	},
	inCubic: function inCubic(t, b, c, d) {
		return c * (t /= d) * t * t + b;
	},
	outCubic: function outCubic(t, b, c, d) {
		return c * ((t = t / d - 1) * t * t + 1) + b;
	},
	inOutCubic: function inOutCubic(t, b, c, d) {
		if ((t /= d / 2) < 1) {
			return c / 2 * t * t * t + b;
		}return c / 2 * ((t -= 2) * t * t + 2) + b;
	},
	inExpo: function inExpo(t, b, c, d) {
		return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001;
	},
	outExpo: function outExpo(t, b, c, d) {
		return t == d ? b + c : c * 1.001 * (-Math.pow(2, -10 * t / d) + 1) + b;
	},
	inOutExpo: function inOutExpo(t, b, c, d) {
		if (t == 0) {
			return b;
		}if (t == d) {
			return b + c;
		}if ((t /= d / 2) < 1) {
			return c / 2 * Math.pow(2, 10 * (t - 1)) + b - c * 0.0005;
		}return c / 2 * 1.0005 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	inElastic: function inElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) {
			return b;
		}if ((t /= d) == 1) {
			return b + c;
		}if (!p) p = d * 0.3;
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	},
	outElastic: function outElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) {
			return b;
		}if ((t /= d) == 1) {
			return b + c;
		}if (!p) p = d * 0.3;
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
	},
	inOutElastic: function inOutElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) {
			return b;
		}if ((t /= d / 2) == 2) {
			return b + c;
		}if (!p) p = d * (0.3 * 1.5);
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		if (t < 1) {
			return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		}return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
	},
	inBack: function inBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * (t /= d) * t * ((s + 1) * t - s) + b;
	},
	outBack: function outBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
	},
	inOutBack: function inOutBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		if ((t /= d / 2) < 1) {
			return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
		}return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
	},
	inBounce: function inBounce(t, b, c, d) {
		return c - this.outBounce(t, d - t, 0, c, d) + b;
	},
	outBounce: function outBounce(t, b, c, d) {
		if ((t /= d) < 1 / 2.75) {
			return c * (7.5625 * t * t) + b;
		} else if (t < 2 / 2.75) {
			return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
		} else if (t < 2.5 / 2.75) {
			return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
		} else {
			return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
		}
	},
	inOutBounce: function inOutBounce(t, b, c, d) {
		if (t < d / 2) {
			return this.inBounce(t * 2, 0, c, d) * 0.5 + b;
		}return this.outBounce(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
	},
	outHard: function outHard(t, b, c, d) {
		var ts = (t /= d) * t;
		var tc = ts * t;
		return b + c * (1.75 * tc * ts + -7.4475 * ts * ts + 12.995 * tc + -11.595 * ts + 5.2975 * t);
	}
};

exports.easings = easings;
function mainLoop() {
	if (!anims.length) {
		// no animations left, stop polling
		return;
	}

	var now = time();
	var filtered = [],
	    tween,
	    opt;

	// do not use Array.filter() of _.filter() function
	// since tween’s callbacks can add new animations
	// in runtime. In this case, filter function will loose
	// newly created animation
	for (var i = 0; i < anims.length; i++) {
		tween = anims[i];

		if (!tween.animating) {
			continue;
		}

		opt = tween.options;

		if (tween.startTime > now) {
			filtered.push(tween);
			continue;
		}

		if (tween.infinite) {
			// opt.step.call(tween, 0);
			opt.step(0, tween);
			filtered.push(tween);
		} else if (tween.pos === 1 || tween.endTime <= now) {
			tween.pos = 1;
			// opt.step.call(tween, opt.reverse ? 0 : 1);
			opt.step(opt.reverse ? 0 : 1, tween);
			tween.stop();
		} else {
			tween.pos = opt.easing(now - tween.startTime, 0, 1, opt.duration);
			// opt.step.call(tween, opt.reverse ? 1 - tween.pos : tween.pos);
			opt.step(opt.reverse ? 1 - tween.pos : tween.pos, tween);
			filtered.push(tween);
		}
	}

	anims = filtered;

	if (anims.length) {
		requestAnimationFrame(mainLoop);
	}
}

function addToQueue(tween) {
	if (indexOf(anims, tween) == -1) {
		anims.push(tween);
		if (anims.length == 1) {
			mainLoop();
		}
	}
}

var Tween = exports.Tween = (function () {
	function Tween(options) {
		_classCallCheck(this, Tween);

		this.options = extend({}, defaults, options);

		var e = this.options.easing;
		if (typeof e == "string") {
			if (!easings[e]) throw "Unknown \"" + e + "\" easing function";
			this.options.easing = easings[e];
		}

		if (typeof this.options.easing != "function") throw "Easing should be a function";

		this._id = "tw" + idCounter++;

		if (this.options.autostart) {
			this.start();
		}
	}

	_createClass(Tween, {
		start: {

			/**
    * Start animation from the beginning
    */

			value: function start() {
				if (!this.animating) {
					this.pos = 0;
					this.startTime = time() + (this.options.delay || 0);
					this.infinite = this.options.duration === "infinite";
					this.endTime = this.infinite ? 0 : this.startTime + this.options.duration;
					this.animating = true;
					this.options.start(this);
					addToQueue(this);
				}

				return this;
			}
		},
		stop: {

			/**
    * Stop animation
    */

			value: function stop() {
				if (this.animating) {
					this.animating = false;
					if (this.options.complete) {
						this.options.complete(this);
					}
				}
				return this;
			}
		},
		toggle: {
			value: function toggle() {
				if (this.animating) {
					this.stop();
				} else {
					this.start();
				}
			}
		}
	});

	return Tween;
})();

function tween(options) {
	return new Tween(options);
}

function defaults(name, value) {
	if (typeof value != "undefined") {
		defaults[name] = value;
	}

	return defaults[name];
}

function _all() {
	return anims;
}

function stop() {
	for (var i = 0; i < anims.length; i++) {
		anims[i].stop();
	}

	anims.length = 0;
}

;

},{}],"/Users/adam/code/internal/codemirror-movie/lib/widgets/outline.js":[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Module that creates list of action hints and highlights items when specified
 * action is performed
 */
"use strict";

var dom = _interopRequireWildcard(require("../dom"));

var _utils = require("../utils");

var template = _utils.template;
var find = _utils.find;
var toArray = _utils.toArray;
var extend = _utils.extend;
var defaultOptions = {
	wrapperTemplate: "<ul class=\"CodeMirror-outline\"><%= content %></ul>",
	itemTemplate: "<li data-action-id=\"<%= id %>\" class=\"CodeMirror-outline__item\"><%= title %></li>",
	itemClass: "CodeMirror-outline__item",
	selectedClass: "CodeMirror-outline__item_selected"
};

exports.defaultOptions = defaultOptions;
/**
 * @param {Object} hints
 * @param {Scenario} scenario
 * @param {Object} options
 */

exports["default"] = function (hints, scenario) {
	var options = arguments[2] === undefined ? {} : arguments[2];

	options = extend({}, defaultOptions, options);

	var hintKeys = Object.keys(hints).sort(function (a, b) {
		return a - b;
	});

	var itemTemplate = template(options.itemTemplate);
	var items = hintKeys.map(function (key) {
		return itemTemplate({ title: hints[key], id: key });
	});

	var el = dom.toDOM(template(options.wrapperTemplate, {
		content: items.join("")
	}));

	if (options.target) {
		options.target.appendChild(el);
	}

	scenario.on("action", function (id) {
		var items = toArray(el.querySelectorAll("." + options.itemClass));
		var matchedItem = find(items, function (elem) {
			return elem.getAttribute("data-action-id") == id;
		});

		if (matchedItem) {
			items.forEach(function (item) {
				return item.classList.remove(options.selectedClass);
			});
			matchedItem.classList.add(options.selectedClass);
		}
	}).on("stop", function () {
		toArray(el.querySelectorAll("." + options.itemClass)).forEach(function (item) {
			return item.classList.remove(options.selectedClass);
		});
	});

	return el;
};

},{"../dom":"/Users/adam/code/internal/codemirror-movie/lib/dom.js","../utils":"/Users/adam/code/internal/codemirror-movie/lib/utils.js"}],"/Users/adam/code/internal/codemirror-movie/lib/widgets/prompt.js":[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

exports.show = show;
exports.hide = hide;
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Shows fake prompt dialog with interactive value typing
 */
"use strict";

var tween = _interopRequire(require("../vendor/tween"));

var _utils = require("../utils");

var extend = _utils.extend;
var template = _utils.template;
var has3d = _utils.has3d;
var prefixed = _utils.prefixed;

var dom = _interopRequireWildcard(require("../dom"));

var dialogInstance = null;
var bgInstance = null;
var lastTween = null;

var actions = {
	prompt: function prompt(options, editor, next, timer) {
		options = extend({
			title: "Enter something",
			delay: 80, // delay between character typing
			typeDelay: 1000, // time to wait before typing text
			hideDelay: 2000 // time to wait before hiding prompt dialog
		}, wrap("text", options));

		show(options.title, editor.getWrapperElement(), function (dialog) {
			timer(function () {
				typeText(dialog.querySelector(".CodeMirror-prompt__input"), options, timer, function () {
					timer(function () {
						hide(next);
					}, options.hideDelay);
				});
			}, options.typeDelay);
		});
	}
};

exports.actions = actions;

function show(text, target, callback) {
	hide();
	dialogInstance = dom.toDOM("<div class=\"CodeMirror-prompt\">\n\t\t<div class=\"CodeMirror-prompt__title\">" + text + "</div>\n\t\t<input type=\"text\" name=\"prompt\" class=\"CodeMirror-prompt__input\" readonly=\"readonly\" />\n\t\t</div>");
	bgInstance = dom.toDOM("<div class=\"CodeMirror-prompt__shade\"></div>");

	target.appendChild(dialogInstance);
	target.appendChild(bgInstance);

	animateShow(dialogInstance, bgInstance, { complete: callback });
}

function hide(callback) {
	if (dialogInstance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(dialogInstance, bgInstance, { complete: callback });
		dialogInstance = bgInstance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options 
 */
function animateShow(dialog, bg) {
	var options = arguments[2] === undefined ? {} : arguments[2];

	var cssTransform = prefixed("transform");
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var tmpl = template(has3d ? "translate3d(0, <%= pos %>, 0)" : "translate(0, <%= pos %>)");

	bgStyle.opacity = 0;
	tween({
		duration: 200,
		step: function step(pos) {
			bgStyle.opacity = pos;
		}
	});

	dialogStyle[cssTransform] = tmpl({ pos: -height });

	return lastTween = tween({
		duration: 400,
		easing: "outCubic",
		step: function step(pos) {
			dialogStyle[cssTransform] = tmpl({ pos: -height * (1 - pos) + "px" });
		},
		complete: function complete() {
			lastTween = null;
			options.complete && options.complete(dialog, bg);
		}
	});
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options
 */
function animateHide(dialog, bg, options) {
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var cssTransform = prefixed("transform");
	var tmpl = template(has3d ? "translate3d(0, <%= pos %>, 0)" : "translate(0, <%= pos %>)");

	return tween({
		duration: 200,
		step: function step(pos) {
			dialogStyle[cssTransform] = tmpl({ pos: -height * pos + "px" });
			bgStyle.opacity = 1 - pos;
		},
		complete: function complete() {
			dom.remove([dialog, bg]);
			options.complete && options.complete(dialog, bg);
		}
	});
}

function typeText(target, options, timer, next) {
	var chars = options.text.split("");
	timer(function perform() {
		target.value += chars.shift();
		if (chars.length) {
			timer(perform, options.delay);
		} else {
			next();
		}
	}, options.delay);
}

function wrap(key, value) {
	return typeof value === "object" ? value : _defineProperty({}, key, value);
}

},{"../dom":"/Users/adam/code/internal/codemirror-movie/lib/dom.js","../utils":"/Users/adam/code/internal/codemirror-movie/lib/utils.js","../vendor/tween":"/Users/adam/code/internal/codemirror-movie/lib/vendor/tween.js"}],"/Users/adam/code/internal/codemirror-movie/lib/widgets/tooltip.js":[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

exports.show = show;
exports.hide = hide;
Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Extension that allows authors to display context tooltips bound to specific
 * positions
 */
"use strict";

var tween = _interopRequire(require("../vendor/tween"));

var _utils = require("../utils");

var extend = _utils.extend;
var prefixed = _utils.prefixed;
var makePos = _utils.makePos;
var has3d = _utils.has3d;

var dom = _interopRequireWildcard(require("../dom"));

var instance = null;
var lastTween = null;

var alignDefaults = {
	/** CSS selector for getting popup tail */
	tailClass: "CodeMirror-tooltip__tail",

	/** Class name for switching tail/popup position relative to target point */
	belowClass: "CodeMirror-tooltip_below",

	/** Min distance between popup and viewport */
	popupMargin: 5,

	/** Min distance between popup left/right edge and its tail */
	tailMargin: 11
};

exports.alignDefaults = alignDefaults;
var actions = {
	/**
  * Shows tooltip with given text, wait for `options.wait`
  * milliseconds then hides tooltip
  */
	tooltip: function tooltip(options, editor, next, timer) {
		options = extend({
			wait: 4000, // time to wait before hiding tooltip
			pos: "caret" // position where tooltip should point to
		}, wrap("text", options));

		var pos = resolvePosition(options.pos, editor);
		show(options.text, pos, function () {
			timer(function () {
				hide(function () {
					return timer(next);
				});
			}, options.wait);
		});
	},

	/**
  * Shows tooltip with specified text. This tooltip should be explicitly 
  * hidden with `hideTooltip` action
  */
	showTooltip: function showTooltip(options, editor, next, timer) {
		options = extend({
			pos: "caret" // position where tooltip should point to
		}, wrap("text", options));

		show(options.text, resolvePosition(options.pos, editor));
		next();
	},

	/**
  * Hides tooltip, previously shown by 'showTooltip' action
  */
	hideTooltip: function hideTooltip(options, editor, next, timer) {
		hide(next);
	}
};

exports.actions = actions;

function show(text, pos, callback) {
	hide();

	instance = dom.toDOM("<div class=\"CodeMirror-tooltip\">\n\t\t<div class=\"CodeMirror-tooltip__content\">" + text + "</div>\n\t\t<div class=\"CodeMirror-tooltip__tail\"></div>\n\t\t</div>");

	dom.css(instance, prefixed("transform"), "scale(0)");
	document.body.appendChild(instance);

	alignPopupWithTail(instance, { position: pos });
	animateShow(instance, { complete: callback });
}

function hide(callback) {
	if (instance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(instance, { complete: callback });
		instance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * Helper function that finds optimal position of tooltip popup on page
 * and aligns popup tail with this position
 * @param {Element} popup
 * @param {Object} options
 */
function alignPopupWithTail(popup) {
	var options = arguments[1] === undefined ? {} : arguments[1];

	options = extend({}, alignDefaults, options);

	dom.css(popup, {
		left: 0,
		top: 0
	});

	var tail = popup.querySelector("." + options.tailClass);

	var resultX = 0,
	    resultY = 0;
	var pos = options.position;
	var vp = dom.viewportRect();

	var width = popup.offsetWidth;
	var height = popup.offsetHeight;

	var isTop;

	// calculate horizontal position
	resultX = Math.min(vp.width - width - options.popupMargin, Math.max(options.popupMargin, pos.x - vp.left - width / 2));

	// calculate vertical position
	if (height + tail.offsetHeight + options.popupMargin + vp.top < pos.y) {
		// place above target position
		resultY = Math.max(0, pos.y - height - tail.offsetHeight);
		isTop = true;
	} else {
		// place below target position
		resultY = pos.y + tail.offsetHeight;
		isTop = false;
	}

	// calculate tail position
	var tailMinLeft = options.tailMargin;
	var tailMaxLeft = width - options.tailMargin;
	tail.style.left = Math.min(tailMaxLeft, Math.max(tailMinLeft, pos.x - resultX - vp.left)) + "px";

	dom.css(popup, {
		left: resultX,
		top: resultY
	});

	popup.classList.toggle(options.belowClass, !isTop);
}

/**
 * @param {jQuery} elem
 * @param {Object} options 
 */
function animateShow(elem) {
	var options = arguments[1] === undefined ? {} : arguments[1];

	options = extend({}, alignDefaults, options);
	var cssOrigin = prefixed("transform-origin");
	var cssTransform = prefixed("transform");
	var style = elem.style;

	var tail = elem.querySelector("." + options.tailClass);
	var xOrigin = dom.css(tail, "left");
	var yOrigin = tail.offsetTop;
	if (elem.classList.contains(options.belowClass)) {
		yOrigin -= tail.offsetHeight;
	}

	yOrigin += "px";

	style[cssOrigin] = xOrigin + " " + yOrigin;
	var prefix = has3d ? "translateZ(0) " : "";

	return lastTween = tween({
		duration: 800,
		easing: "outElastic",
		step: function step(pos) {
			style[cssTransform] = prefix + "scale(" + pos + ")";
		},
		complete: function complete() {
			style[cssTransform] = "none";
			lastTween = null;
			options.complete && options.complete(elem);
		}
	});
}

/**
 * @param {jQuery} elem
 * @param {Object} options
 */
function animateHide(elem, options) {
	var style = elem.style;

	return tween({
		duration: 200,
		easing: "linear",
		step: function step(pos) {
			style.opacity = 1 - pos;
		},
		complete: function complete() {
			dom.remove(elem);
			options.complete && options.complete(elem);
		}
	});
}

/**
 * Resolves position where tooltip should point to
 * @param {Object} pos
 * @param {CodeMirror} editor
 * @returns {Object} Object with <code>x</code> and <code>y</code> 
 * properties
 */
function resolvePosition(pos, editor) {
	if (pos === "caret") {
		// get absolute position of current caret position
		return sanitizeCaretPos(editor.cursorCoords(true));
	}

	if (typeof pos === "object") {
		if ("x" in pos && "y" in pos) {
			// passed absolute coordinates
			return pos;
		}

		if ("left" in pos && "top" in pos) {
			// passed absolute coordinates
			return sanitizeCaretPos(pos);
		}
	}

	pos = makePos(pos, editor);
	return sanitizeCaretPos(editor.charCoords(pos));
}

function sanitizeCaretPos(pos) {
	if ("left" in pos) {
		pos.x = pos.left;
	}

	if ("top" in pos) {
		pos.y = pos.top;
	}

	return pos;
}

function wrap(key, value) {
	return typeof value === "object" ? value : _defineProperty({}, key, value);
}

},{"../dom":"/Users/adam/code/internal/codemirror-movie/lib/dom.js","../utils":"/Users/adam/code/internal/codemirror-movie/lib/utils.js","../vendor/tween":"/Users/adam/code/internal/codemirror-movie/lib/vendor/tween.js"}]},{},["/Users/adam/code/internal/codemirror-movie/lib/movie.js"])("/Users/adam/code/internal/codemirror-movie/lib/movie.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9qcy1idW5kbGVyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYWRhbS9jb2RlL2ludGVybmFsL2NvZGVtaXJyb3ItbW92aWUvbGliL2FjdGlvbnMuanMiLCIvVXNlcnMvYWRhbS9jb2RlL2ludGVybmFsL2NvZGVtaXJyb3ItbW92aWUvbGliL2RvbS5qcyIsIi9Vc2Vycy9hZGFtL2NvZGUvaW50ZXJuYWwvY29kZW1pcnJvci1tb3ZpZS9saWIvbW92aWUuanMiLCIvVXNlcnMvYWRhbS9jb2RlL2ludGVybmFsL2NvZGVtaXJyb3ItbW92aWUvbGliL3NjZW5hcmlvLmpzIiwiL1VzZXJzL2FkYW0vY29kZS9pbnRlcm5hbC9jb2RlbWlycm9yLW1vdmllL2xpYi91dGlscy5qcyIsIi9Vc2Vycy9hZGFtL2NvZGUvaW50ZXJuYWwvY29kZW1pcnJvci1tb3ZpZS9saWIvdmVuZG9yL3R3ZWVuLmpzIiwiL1VzZXJzL2FkYW0vY29kZS9pbnRlcm5hbC9jb2RlbWlycm9yLW1vdmllL2xpYi93aWRnZXRzL291dGxpbmUuanMiLCIvVXNlcnMvYWRhbS9jb2RlL2ludGVybmFsL2NvZGVtaXJyb3ItbW92aWUvbGliL3dpZGdldHMvcHJvbXB0LmpzIiwiL1VzZXJzL2FkYW0vY29kZS9pbnRlcm5hbC9jb2RlbWlycm9yLW1vdmllL2xpYi93aWRnZXRzL3Rvb2x0aXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O3FCQ0F5QyxTQUFTOztJQUExQyxNQUFNLFVBQU4sTUFBTTtJQUFFLE9BQU8sVUFBUCxPQUFPO0lBQUUsU0FBUyxVQUFULFNBQVM7O0FBRWxDLElBQUksT0FBTyxHQUFHOzs7Ozs7Ozs7Ozs7QUFZYixLQUFJLEVBQUUsY0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDNUMsU0FBTyxHQUFHLE1BQU0sQ0FBQztBQUNoQixPQUFJLEVBQUUsRUFBRTtBQUNSLFFBQUssRUFBRSxFQUFFO0FBQ1QsTUFBRyxFQUFFLElBQUk7QUFBQSxHQUNULEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDOztBQUUxQixNQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtBQUNsQixTQUFNLElBQUksS0FBSyxDQUFDLHNDQUFvQyxDQUFDLENBQUM7R0FDdEQ7O0FBRUQsTUFBSSxPQUFPLENBQUMsR0FBRyxLQUFLLElBQUksRUFBRTtBQUN6QixTQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7R0FDL0M7O0FBRUQsTUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7O0FBRW5DLE9BQUssQ0FBQyxTQUFTLE9BQU8sR0FBRztBQUN4QixPQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDdkIsU0FBTSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuQyxPQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDakIsU0FBSyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsTUFBTTtBQUNOLFFBQUksRUFBRSxDQUFDO0lBQ1A7R0FDRCxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUNsQjs7Ozs7Ozs7O0FBU0QsS0FBSSxFQUFFLGNBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQzVDLFNBQU8sR0FBRyxNQUFNLENBQUM7QUFDaEIsVUFBTyxFQUFFLEdBQUc7R0FDWixFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzs7QUFFN0IsT0FBSyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQzNDOzs7OztBQUtELE9BQU0sRUFBRSxnQkFBUyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDOUMsU0FBTyxHQUFHLE1BQU0sQ0FBQztBQUNoQixRQUFLLEVBQUUsRUFBRTtBQUNULFlBQVMsRUFBRSxLQUFLO0FBQUEsR0FDaEIsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7O0FBRXpCLE1BQUksT0FBTyxPQUFPLENBQUMsR0FBRyxLQUFLLFdBQVcsRUFBRTtBQUN2QyxTQUFNLElBQUksS0FBSyxDQUFDLDZDQUEyQyxDQUFDLENBQUM7R0FDN0Q7O0FBRUQsTUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUUvQixRQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNwQyxNQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQzs7QUFFN0MsTUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtBQUN4QyxTQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLE9BQUksRUFBRSxDQUFDO0dBQ1A7O0FBRUQsTUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQzdDLE1BQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUN6QyxNQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQzs7O0FBRzNDLE1BQUksUUFBUSxHQUFHLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLE1BQUksUUFBUSxHQUFHLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUV0QyxPQUFLLENBQUMsU0FBUyxPQUFPLEdBQUc7QUFDeEIsU0FBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixPQUFJLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFBLEFBQUMsRUFBRTs7QUFFL0UsUUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUU7QUFDbEMsV0FBTSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUM7S0FDeEI7O0FBRUQsUUFBSSxNQUFNLENBQUMsRUFBRSxJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUU7QUFDOUIsV0FBTSxDQUFDLEVBQUUsSUFBSSxRQUFRLENBQUM7S0FDdEI7O0FBRUQsVUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN6QixTQUFLLEVBQUUsQ0FBQztBQUNSLFNBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLE1BQU07QUFDTixVQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLFFBQUksRUFBRSxDQUFDO0lBQ1A7R0FDRCxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUNsQjs7Ozs7QUFLRCxPQUFNLEVBQUUsZ0JBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQzlDLFNBQU8sR0FBRyxNQUFNLENBQUM7QUFDaEIsYUFBVSxFQUFFLEdBQUc7R0FDZixFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzs7QUFFekIsTUFBSSxPQUFPLE9BQU8sQ0FBQyxHQUFHLEtBQUssV0FBVyxFQUFFO0FBQ3ZDLFNBQU0sSUFBSSxLQUFLLENBQUMsNkNBQTJDLENBQUMsQ0FBQztHQUM3RDs7QUFFRCxRQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0MsT0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7RUFDaEM7Ozs7Ozs7OztBQVNELElBQUcsRUFBRSxhQUFTLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUMzQyxTQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ2hCLGNBQVcsRUFBRSxHQUFHO0FBQ2hCLFFBQUssRUFBRSxDQUFDO0dBQ1IsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7O0FBRTdCLE1BQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDMUIsT0FBSyxDQUFDLFNBQVMsT0FBTyxHQUFHO0FBQ3hCLE9BQUksT0FBTyxPQUFPLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRTtBQUMxQyxXQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqQyxNQUFNO0FBQ04sVUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEM7O0FBRUQsT0FBSSxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUU7QUFDaEIsU0FBSyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDcEMsTUFBTTtBQUNOLFFBQUksRUFBRSxDQUFDO0lBQ1A7R0FDRCxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztFQUN4Qjs7Ozs7Ozs7O0FBU0QsT0FBTSxFQUFFLGdCQUFTLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUM5QyxTQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ2hCLE9BQUksRUFBRSxPQUFPO0dBQ2IsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7O0FBRXhCLE1BQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3pDLE1BQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLFFBQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzlCLE1BQUksRUFBRSxDQUFDO0VBQ1A7Ozs7Ozs7OztBQVNELFVBQVMsRUFBRSxtQkFBUyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDakQsU0FBTyxHQUFHLE1BQU0sQ0FBQztBQUNoQixPQUFJLEVBQUUsT0FBTztBQUNiLFFBQUssRUFBRSxhQUFhO0dBQ3BCLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDOztBQUV4QixNQUFJLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN6QyxNQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNyQyxRQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUM7QUFDdEQsTUFBSSxFQUFFLENBQUM7RUFDUDtDQUNELENBQUM7O0FBRUYsU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUN6QixRQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRyxLQUFLLHVCQUFLLEdBQUcsRUFBRyxLQUFLLENBQUMsQ0FBQztDQUMxRDs7aUJBRWMsT0FBTzs7Ozs7UUMvTE4sWUFBWSxHQUFaLFlBQVk7Ozs7Ozs7UUFxQlosTUFBTSxHQUFOLE1BQU07Ozs7Ozs7UUFVTixLQUFLLEdBQUwsS0FBSzs7Ozs7Ozs7UUFZTCxHQUFHLEdBQUgsR0FBRzs7OztBQWpEbkIsWUFBWSxDQUFDOztJQUVMLE9BQU8sV0FBTyxTQUFTLEVBQXZCLE9BQU87O0FBRWYsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLFdBQVcsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDOztBQUVwRSxTQUFTLFlBQVksR0FBRztBQUM5QixLQUFJLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBQ3pCLEtBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUM7QUFDdkMsS0FBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSyxJQUFJLENBQUMsU0FBUyxJQUFLLENBQUMsQ0FBQztBQUMzRCxLQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDO0FBQzVELEtBQUksU0FBUyxHQUFJLE1BQU0sQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzVFLEtBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDOztBQUU3RSxRQUFPO0FBQ04sS0FBRyxFQUFFLFNBQVMsR0FBSSxTQUFTO0FBQzNCLE1BQUksRUFBRSxVQUFVLEdBQUcsVUFBVTtBQUM3QixPQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsV0FBVztBQUM5QyxRQUFNLEVBQUUsSUFBSSxDQUFDLFlBQVksSUFBSSxPQUFPLENBQUMsWUFBWTtFQUNqRCxDQUFDO0NBQ0Y7O0FBT00sU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQzVCLEdBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFO1NBQUksRUFBRSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7RUFBQSxDQUFDLENBQUM7QUFDdkUsUUFBTyxJQUFJLENBQUM7Q0FDWjs7QUFPTSxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUU7QUFDMUIsS0FBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxJQUFHLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUNwQixRQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUM7Q0FDdEI7O0FBUU0sU0FBUyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDcEMsS0FBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxJQUFJLElBQUksRUFBRTtBQUM1QyxTQUFPLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDMUI7O0FBRUQsS0FBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDN0IsTUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2IsS0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNoQixNQUFJLEdBQUcsR0FBRyxDQUFDO0VBQ1g7O0FBRUQsT0FBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztDQUNuQjs7QUFFRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUU7QUFDaEIsS0FBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRTtBQUMvQixTQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNwQjs7QUFFRCxRQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDeEM7O0FBRUQsU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFFO0FBQzFCLFFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBUyxHQUFHLEVBQUUsRUFBRSxFQUFFO0FBQ2hELFNBQU8sRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0VBQ3hCLENBQUMsQ0FBQztDQUNIOzs7Ozs7OztBQVFELFNBQVMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDM0IsS0FBSSxNQUFNLEdBQUcsaUJBQWlCO0tBQzdCLElBQUksR0FBRyxpQkFBaUI7S0FDeEIsSUFBSSxHQUFHLEtBQUssQ0FBQzs7QUFFZCxLQUFJLFNBQVMsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7OztBQUdsQyxLQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDMUIsU0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0VBQzdCOztBQUVELEtBQUksTUFBTSxFQUFFO0FBQ1gsTUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMzQyxTQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNqQzs7QUFFRCxLQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7QUFDdEIsTUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xFLE1BQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDOzs7Ozs7O0FBTy9CLE1BQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7O0FBRXhDLE9BQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJO09BQUUsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDOzs7QUFHdkQsT0FBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7QUFDaEQsT0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3hDLFFBQUssQ0FBQyxJQUFJLEdBQUcsU0FBUyxLQUFLLFVBQVUsR0FBRyxLQUFLLEdBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEFBQUMsQ0FBQztBQUNwRSxNQUFHLEdBQUcsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7OztBQUc3QixRQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNsQixPQUFJLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7R0FDaEM7O0FBRUQsU0FBTyxHQUFHLENBQUM7RUFDWDtDQUNEOzs7Ozs7O0FBT0QsU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUM3QixLQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1YsU0FBTztFQUNQOztBQUVELEtBQUksUUFBUSxHQUFHLEVBQUMsYUFBYSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUMsQ0FBQztBQUM1RCxLQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsRUFBSTtBQUN4QyxNQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsTUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdEQsU0FBTyxJQUFJLEdBQUcsR0FBRyxJQUFJLEFBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLEVBQUUsSUFBSSxJQUFJLFFBQVEsQ0FBQSxBQUFDLEdBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUEsQUFBQyxDQUFDO0VBQ3BGLENBQUMsQ0FBQzs7QUFFSCxLQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUM1Qzs7Ozs7Ozs7Ozs7Ozs7OztxQkN4RXVCLEtBQUs7Ozs7Ozs7Ozs7QUFwRTdCLFlBQVksQ0FBQzs7cUJBRTRCLFNBQVM7O0lBQTFDLFNBQVMsVUFBVCxTQUFTO0lBQUUsTUFBTSxVQUFOLE1BQU07SUFBRSxPQUFPLFVBQVAsT0FBTzs7SUFDM0IsUUFBUSwyQkFBTSxZQUFZOztJQUMxQixPQUFPLDJCQUFNLG1CQUFtQjs7QUFFdkMsSUFBSSxHQUFHLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDN0YsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVoRCxJQUFJLFVBQVUsR0FBRztBQUNoQixPQUFRLEdBQUc7QUFDWCxVQUFXLEdBQUc7QUFDZCxNQUFPLEdBQUc7QUFDVixRQUFTLEdBQUc7QUFDWixNQUFPLEdBQUc7QUFDVixRQUFTLEdBQUc7QUFDWixNQUFPLEdBQUc7QUFDVixPQUFRLEdBQUc7QUFDWCxRQUFTLEdBQUc7QUFDWixLQUFNLEdBQUc7QUFDVCxPQUFRLEdBQUc7Q0FDWCxDQUFDOztBQUVGLElBQUksU0FBUyxHQUFHO0FBQ2YsTUFBTyxNQUFNO0FBQ2IsVUFBVyxNQUFNO0FBQ2pCLE9BQVEsTUFBTTtBQUNkLE1BQU8sS0FBSztBQUNaLFFBQVMsT0FBTztBQUNoQixPQUFRLEdBQUc7QUFDWCxRQUFTLEdBQUc7QUFDWixLQUFNLEdBQUc7QUFDVCxPQUFRLEdBQUc7Q0FDWCxDQUFDOztBQUVLLElBQUksY0FBYyxHQUFHOzs7Ozs7QUFNM0IsTUFBSyxFQUFFLElBQUk7Ozs7OztBQU1YLGlCQUFnQixFQUFFLEtBQUs7OztBQUd2QixpQkFBZ0IsRUFBRSxnQkFBZ0I7OztBQUdsQyxhQUFZLEVBQUUsSUFBSTs7O0FBR2xCLGlCQUFnQixFQUFFLEtBQUs7Q0FDdkIsQ0FBQyxRQXRCUyxjQUFjLEdBQWQsY0FBYzs7QUFpQ1YsU0FBUyxLQUFLLENBQUMsTUFBTSxFQUFxQztLQUFuQyxZQUFZLGdDQUFDLEVBQUU7S0FBRSxhQUFhLGdDQUFDLEVBQUU7O0FBQ3RFLGdCQUFlLEVBQUUsQ0FBQzs7QUFFbEIsS0FBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7QUFDL0IsUUFBTSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDekM7O0FBRUQsS0FBSSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLFVBQVUsQ0FBQzs7QUFFcEUsYUFBWSxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3hELGNBQWEsR0FBRyxNQUFNLENBQUM7QUFDdEIsT0FBSyxFQUFFLFVBQVU7QUFDakIsTUFBSSxFQUFHLFdBQVc7QUFDbEIsZ0JBQWMsRUFBRSxJQUFJO0FBQ3BCLFNBQU8sRUFBRSxDQUFDO0FBQ1YsYUFBVyxFQUFHLElBQUk7QUFDbEIsdUJBQXFCLEVBQUUsSUFBSTtFQUMzQixFQUFFLGFBQWEsQ0FBQyxDQUFDOztBQUVsQixLQUFJLFlBQVksR0FBRyxhQUFhLENBQUMsS0FBSyxLQUFLLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBLEFBQUMsSUFBSSxFQUFFLENBQUM7O0FBRXRHLEtBQUksZ0JBQWdCLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRTtBQUMzQyxRQUFNLENBQUMsWUFBWSxFQUFFLG9CQUFvQixDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLGNBQVksR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQ2xDLE1BQUksWUFBWSxDQUFDLGFBQWEsRUFBRTtBQUMvQixTQUFNLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztHQUNsRDs7O0FBR0QsTUFBSSxNQUFNLEdBQUcsbUJBQW1CLENBQUM7QUFDakMsU0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBUyxJQUFJLEVBQUU7QUFDakQsT0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDaEMsT0FBSSxDQUFDLEVBQUU7QUFDTixpQkFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDakM7R0FDRCxDQUFDLENBQUM7RUFDSDs7O0FBR0QsYUFBWSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHcEQsS0FBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFM0MsS0FBSSxnQkFBZ0IsRUFBRTtBQUNyQixRQUFNLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxLQUFLLEdBQUcsWUFBWSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQ3BGOzs7QUFHRCxLQUFJLE1BQU0sR0FBRyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsR0FBRyxNQUFNLENBQUM7O0FBRXhGLEtBQUksVUFBVSxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ3JCLFFBQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0VBQ2xEOzs7QUFHRCxPQUFNLENBQUMsU0FBUyxHQUFHO0FBQ2xCLFNBQU8sRUFBRSxZQUFZO0FBQ3JCLEtBQUcsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztFQUMzQixDQUFDOztBQUVGLEtBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDOzs7QUFHekMsS0FBSSxhQUFhLENBQUMsTUFBTSxFQUFFO0FBQ3pCLFNBQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0VBQ25EOztBQUVELFFBQU8sQ0FBQyxTQUFTLElBQUksbUJBQW1CLElBQUksWUFBWSxDQUFDLE9BQU8sR0FBRyxnQ0FBZ0MsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDOztBQUUxRyxLQUFJLEVBQUUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3JELEtBQUksWUFBWSxDQUFDLE9BQU8sRUFBRTtBQUN6QixTQUFPLENBQUMsU0FBUyxJQUFJLGdDQUFnQyxDQUFDO0FBQ3RELFNBQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUN2RDtBQUNELFFBQU8sRUFBRSxDQUFDO0NBQ1Y7Ozs7Ozs7Ozs7QUFVRCxTQUFTLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUU7QUFDMUMsUUFBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFDeEIsS0FBSSxLQUFLLEdBQUcscUJBQXFCLENBQUM7QUFDbEMsS0FBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLFVBQVUsR0FBRyxTQUFTLENBQUM7QUFDdkMsUUFBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxVQUFTLENBQUMsRUFBRSxFQUFFLEVBQUU7QUFDaEQsTUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ25CLE9BQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FDMUIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUNmLEdBQUcsQ0FBQyxVQUFBLEdBQUc7V0FBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRTtJQUFBLENBQUMsQ0FBQzs7QUFFMUQsSUFBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUMvQixPQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFO0FBQzlCLEtBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNsQjtHQUNEOztBQUVELFNBQU8sQ0FBQyxDQUFDO0VBQ1QsQ0FBQyxDQUFDO0NBQ0g7O0FBRUQsU0FBUyxTQUFTLENBQUMsSUFBSSxFQUFFOzs7QUFHeEIsS0FBSSxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ2QsS0FBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFBLENBQ3JCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQ3BCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQ3BCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQ2xCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQzs7O0FBR1osTUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzFDLE1BQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRTtBQUNuQyxRQUFLLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQyxRQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztHQUNuQjtFQUNEOzs7QUFHRCxNQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN6RCxNQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO0FBQzVDLFFBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUMzQztFQUNEOztBQUVELFFBQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztDQUM3Qjs7O0FBR0QsU0FBUyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUU7QUFDcEMsS0FBSSxHQUFHLEdBQUcsb0RBQW9EO0tBQzVELEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztLQUNyQixFQUFFLEdBQUcsRUFBRSxDQUFDOztBQUVWLEtBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0tBQ2hDLEdBQUc7S0FDSCxDQUFDO0tBQ0QsU0FBUyxHQUFHLEtBQUs7S0FDakIscUJBQXFCLEdBQUcsZ0JBQW1CO0tBQzNDLG9CQUFvQixDQUFDO0FBQ3ZCLE1BQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDcEQsTUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN4QyxNQUFHLElBQUksRUFBRTs7QUFFUixPQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksU0FBUyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQzdDLFFBQUcsQ0FBQyxTQUFTLEVBQUU7QUFDZCxjQUFTLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMzQiwwQkFBcUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEdBQUMsU0FBUyxHQUFDLHVCQUF1QixDQUFDLENBQUM7QUFDOUUseUJBQW9CLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxHQUFFLFNBQVMsR0FBQyxDQUFDLEFBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQztLQUM3RDs7QUFFRCxRQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsRUFBRTtBQUM3QyxNQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsR0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEMsUUFBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEIsT0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQixNQUFNOztBQUVOLFFBQUcsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25DLE9BQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDYjtJQUNELE1BQ0k7O0FBQ0osTUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUMxRTtHQUNELE1BQU0sSUFBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsRUFBRTtBQUM3QyxLQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztHQUN6QjtFQUNEOztBQUVELE9BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVMsR0FBRyxFQUFFO0FBQ3JDLE1BQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFRLEVBQUU7QUFDbkIsS0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztHQUN6QjtFQUNELENBQUMsQ0FBQzs7O0FBR0gsS0FBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLEtBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ1YsU0FBTyxHQUFHLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDM0I7O0FBRUQsUUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDO0NBQ25EOztBQUVELFNBQVMsUUFBUSxDQUFDLElBQUksRUFBRTtBQUN2QixLQUFJLFlBQVksR0FBRztBQUNsQixRQUFNLEVBQUcsR0FBRztBQUNaLFFBQU0sRUFBRyxHQUFHO0FBQ1osU0FBTyxFQUFFLEdBQUc7RUFDWixDQUFDOztBQUVGLFFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxVQUFTLEdBQUcsRUFBRSxFQUFFLEVBQUU7QUFDdkQsU0FBTyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDO0VBQ2hDLENBQUMsQ0FBQztDQUNIOzs7Ozs7O0FBT0QsU0FBUyxvQkFBb0IsQ0FBQyxJQUFJLEVBQWM7S0FBWixPQUFPLGdDQUFDLEVBQUU7O0FBQzdDLFFBQU8sR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLGNBQWMsRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDLENBQUM7QUFDcEQsS0FBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7O0FBR2pELEtBQUksS0FBSyxHQUFHLCtDQUErQyxDQUFBO0FBQzNELEtBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNsQixLQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDakIsS0FBSSxhQUFhLEdBQUcsRUFBRSxDQUFDOztBQUV2QixLQUFJLFdBQVcsR0FBRyxVQUFBLElBQUk7U0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUc7RUFBQSxDQUFDOzs7QUFHakQsVUFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBUyxJQUFJLEVBQUU7O0FBRTlELE1BQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxVQUFTLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDbEUsT0FBSSxPQUFPLENBQUMsWUFBWSxFQUFFO0FBQ3pCLFdBQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDN0Q7QUFDRCxVQUFPLEVBQUUsQ0FBQztHQUNWLENBQUMsQ0FBQzs7QUFFSCxNQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLE1BQUksQ0FBQyxFQUFFLEVBQUU7QUFDUixVQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7R0FDbEM7O0FBR0QsTUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUM1QixPQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixNQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFVBQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUMxQjs7QUFFRCxVQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDN0MsQ0FBQyxDQUFDOzs7QUFHSCxLQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNiLFdBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVMsSUFBSSxFQUFFO0FBQzlELE9BQUksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsT0FBSSxFQUFFLEVBQUU7QUFDUCxpQkFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QjtHQUNELENBQUMsQ0FBQztFQUNIOztBQUVELFFBQU87QUFDTixPQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNoQyxVQUFRLEVBQUUsUUFBUTtBQUNsQixTQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsT0FBTyxHQUFHLElBQUk7QUFDckQsZUFBYSxFQUFFLGFBQWE7RUFDNUIsQ0FBQztDQUNGOztBQUVELFNBQVMsZUFBZSxHQUFHO0FBQzFCLEtBQUksT0FBTyxVQUFVLEtBQUssV0FBVyxJQUFJLHVCQUF1QixJQUFJLFVBQVUsQ0FBQyxRQUFRLEVBQUU7QUFDeEYsU0FBTztFQUNQOztBQUVELFdBQVUsQ0FBQyxZQUFZLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLFVBQUEsRUFBRSxFQUFJO0FBQzdELE1BQUksT0FBTyxHQUFHLFVBQUMsRUFBRSxFQUFFLEtBQUs7VUFBSyxFQUFFLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUU7R0FBQSxDQUFDO0FBQ2hGLElBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzFCLElBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0VBQzVCLENBQUMsQ0FBQztDQUNIOztBQUVELElBQUksT0FBTyxVQUFVLEtBQUssV0FBVyxFQUFFO0FBQ3RDLFdBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0NBQ3pCOzs7Ozs7Ozs7Ozs7OztBQzlWRCxZQUFZLENBQUM7O0lBRU4sYUFBYSwyQkFBTSxXQUFXOztJQUNsQixNQUFNLFdBQU8sa0JBQWtCLEVBQTFDLE9BQU87O0lBQ0ksT0FBTyxXQUFPLG1CQUFtQixFQUE1QyxPQUFPOztJQUNQLE1BQU0sV0FBTyxTQUFTLEVBQXRCLE1BQU07O0FBRWQsSUFBSSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7O0FBRW5FLElBQUksVUFBVSxHQUFJLE1BQU0sQ0FBQztBQUN6QixJQUFJLFVBQVUsR0FBSSxNQUFNLENBQUM7QUFDekIsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDOzs7QUFHMUIsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDOztBQUVuQixJQUFJLGNBQWMsR0FBRztBQUMzQixZQUFXLEVBQUUsSUFBSTtBQUNqQixXQUFVLEVBQUUsSUFBSTtDQUNoQixDQUFDOztRQUhTLGNBQWMsR0FBZCxjQUFjOzs7Ozs7O0lBVUosUUFBUTtBQUNqQixVQURTLFFBQVEsQ0FDaEIsT0FBTyxFQUFFLElBQUksRUFBRTt3QkFEUCxRQUFROztBQUUzQixNQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztBQUN4QixNQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNuQixNQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNwQixNQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQztBQUN6QixNQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFdEIsTUFBSSxJQUFJLElBQUksVUFBVSxJQUFJLElBQUksRUFBRTtBQUMvQixPQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztHQUNwQjs7QUFFRCxNQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ3RCLE1BQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRTtBQUN4QixLQUFFLENBQUMsU0FBUyxHQUFHO0FBQ2QsV0FBTyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUU7QUFDdEIsT0FBRyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7R0FDRjtFQUNEOztjQW5CbUIsUUFBUTtBQXFCNUIsUUFBTTtVQUFBLGdCQUFDLE1BQU0sRUFBRTtBQUNkLFFBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUM1QixXQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUN0Qjs7QUFFRCxVQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdCLFdBQU8sTUFBTSxDQUFDO0lBQ2Q7O0FBUUQsTUFBSTs7Ozs7Ozs7O1VBQUEsY0FBQyxNQUFNLEVBQUU7QUFDWixRQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssVUFBVSxFQUFFOztBQUUvQixZQUFPO0tBQ1A7O0FBRUQsUUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFdBQVcsRUFBRTs7QUFFaEMsV0FBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ2hDLFdBQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNmLFNBQUksUUFBUSxHQUFHLElBQUksQ0FBQztBQUNwQixZQUFPLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxFQUFFO0FBQzNDLGtCQUFZLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7TUFDMUM7O0FBRUQsU0FBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7QUFDekIsU0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QixZQUFPO0tBQ1A7O0FBRUQsUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QyxVQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRWYsUUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekMsUUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFFBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLFFBQUksSUFBSTs7Ozs7Ozs7OztPQUFHLFlBQVc7QUFDckIsU0FBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO0FBQzNDLGFBQU8sS0FBSyxDQUFDLFlBQVc7QUFDdkIsV0FBSSxDQUFDLElBQUksRUFBRSxDQUFDO09BQ1osRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7TUFDOUI7O0FBRUQsU0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZDLFNBQUksTUFBTSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRTlELFNBQUksTUFBTSxDQUFDLElBQUksSUFBSSxpQkFBaUIsRUFBRTtBQUNyQyx1QkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7TUFDL0UsTUFBTTtBQUNOLFlBQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO01BQ2xEO0tBQ0QsQ0FBQSxDQUFDOztBQUVGLFFBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6QyxRQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JCLFNBQUssQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3hDOztBQU1ELE9BQUs7Ozs7Ozs7VUFBQSxpQkFBRztBQUNQLFFBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO0FBQzFCLFFBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEI7O0FBS0QsTUFBSTs7Ozs7O1VBQUEsZ0JBQUc7QUFDTixRQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssVUFBVSxFQUFFO0FBQy9CLFNBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO0FBQ3pCLFNBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUM1QixTQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDMUMsU0FBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNyQjtJQUNEOztBQU1HLE9BQUs7Ozs7Ozs7UUFBQSxZQUFHO0FBQ1gsV0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ25COztBQUtELFFBQU07Ozs7OztVQUFBLGtCQUFHO0FBQ1IsUUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFVBQVUsRUFBRTtBQUMvQixTQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDYixNQUFNO0FBQ04sU0FBSSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ1o7SUFDRDs7QUFFRCxjQUFZOzs7Ozs7Ozs7OztNQUFBLFVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRTtBQUN2QixRQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssVUFBVSxFQUFFOztBQUUvQixTQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztBQUNyQixRQUFFLEVBQUUsRUFBRTtBQUNOLFdBQUssRUFBRSxLQUFLO01BQ1osQ0FBQyxDQUFDO0tBQ0gsTUFBTTtBQUNOLFlBQU8sWUFBWSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMvQjtJQUNEOztBQVdELElBQUU7Ozs7Ozs7Ozs7OztVQUFBLFlBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUU7QUFDN0IsUUFBSSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0FBQ25DLFFBQUksQ0FBQyxRQUFRLEVBQUU7QUFDZCxZQUFPLElBQUksQ0FBQztLQUNaOztBQUVELFVBQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3JDLFNBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQzs7Ozs7QUFLbEQsV0FBTyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFO0FBQzlCLFNBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEIsU0FBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUM3QixTQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDdEIsU0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsU0FBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDekIsVUFBSyxDQUFDLEtBQUssQ0FBQyxHQUFHO0FBQ2QsVUFBSSxFQUFHLElBQUk7QUFDWCxVQUFJLEVBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSTtNQUM5QixDQUFDO0tBQ0Y7O0FBRUQsV0FBTyxJQUFJLENBQUM7SUFDWjs7QUFXRCxLQUFHOzs7Ozs7Ozs7Ozs7VUFBQSxhQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFO0FBQzlCLFFBQUksS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUM7OztBQUd0QyxRQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUEsQUFBQyxFQUFFO0FBQy9CLFlBQU87S0FDUDs7QUFFRCxRQUFJLEVBQUUsTUFBTSxJQUFJLFFBQVEsSUFBSSxPQUFPLENBQUEsQUFBQyxFQUFFO0FBQ3JDLFlBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN2QixZQUFPLElBQUksQ0FBQztLQUNaOzs7O0FBSUQsVUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkUsV0FBTyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFO0FBQzlCLFNBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEIsWUFBTyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEIsU0FBSSxDQUFDLElBQUksSUFBSSxFQUFFLFFBQVEsSUFBSSxPQUFPLENBQUEsQUFBQyxFQUFFO0FBQ3BDLGVBQVM7TUFDVDs7O0FBR0QsU0FBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDakIsWUFBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBLEtBQU0sSUFBSSxFQUFFO0FBQ25DLFFBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ25CLFNBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ25CLFVBQUksQUFBQyxRQUFRLElBQUksRUFBRSxLQUFLLFFBQVEsSUFBTSxPQUFPLElBQUksR0FBRyxLQUFLLE9BQU8sQUFBQyxFQUFFO0FBQ2xFLFdBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztPQUN4QjtNQUNEO0tBQ0Q7O0FBRUQsV0FBTyxJQUFJLENBQUM7SUFDWjs7QUFTRCxTQUFPOzs7Ozs7Ozs7O1VBQUEsaUJBQUMsTUFBTSxFQUFXO3NDQUFOLElBQUk7QUFBSixTQUFJOzs7QUFDdEIsUUFBSSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUN4QyxRQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUEsQUFBQyxFQUFFO0FBQy9CLFlBQU8sSUFBSSxDQUFDO0tBQ1o7O0FBRUQsT0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7QUFDaEIsVUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7Ozs7QUFJckMsV0FBTyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFO0FBQzlCLFNBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN4QixVQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNqQixhQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUEsS0FBTSxJQUFJLEVBQUU7QUFDbkMsV0FBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDaEQ7TUFDRDtBQUNELFNBQUksSUFBSSxHQUFHLEdBQUcsRUFBRTtBQUNmLFVBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2pCLFVBQUksR0FBRyxDQUFFLEtBQUssQ0FBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QixhQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUEsS0FBTSxJQUFJLEVBQUU7QUFDbkMsV0FBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDaEQ7TUFDRDtLQUNEOztBQUVELFdBQU8sSUFBSSxDQUFDO0lBQ1o7Ozs7UUE5UG1CLFFBQVE7OztxQkFBUixRQUFROzs7Ozs7O0FBc1E3QixTQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUU7QUFDOUIsS0FBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDN0IsTUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QixTQUFPO0FBQ04sT0FBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUU7QUFDbkIsVUFBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0dBQ3hCLENBQUM7RUFDRixNQUFNO0FBQ04sTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxTQUFPO0FBQ04sT0FBSSxFQUFFLElBQUk7QUFDVixVQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQztHQUNuQixDQUFDO0VBQ0Y7Q0FDRDs7QUFFRCxTQUFTLFlBQVksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFO0FBQ2hDLEtBQUksQ0FBQyxLQUFLLEVBQUU7QUFDWCxJQUFFLEVBQUUsQ0FBQztFQUNMLE1BQU07QUFDTixTQUFPLFVBQVUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDN0I7Q0FDRDs7Ozs7UUN4U2UsTUFBTSxHQUFOLE1BQU07UUFTTixPQUFPLEdBQVAsT0FBTzs7Ozs7OztRQVNQLFFBQVEsR0FBUixRQUFRO1FBZ0NSLE1BQU0sR0FBTixNQUFNO1FBT04sU0FBUyxHQUFULFNBQVM7Ozs7Ozs7OztRQVdULE9BQU8sR0FBUCxPQUFPO1FBd0JQLFFBQVEsR0FBUixRQUFRO1FBS1IsSUFBSSxHQUFKLElBQUk7Ozs7Ozs7UUFlSixTQUFTLEdBQVQsU0FBUzs7OztBQTlIekIsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDOzs7QUFHWixJQUFJLEtBQUssR0FBRyxDQUFDLFlBQVc7QUFDOUIsS0FBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QyxLQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDekMsS0FBSSxZQUFZLEVBQUU7QUFDakIsSUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxlQUFlLENBQUM7QUFDekMsU0FBTyxBQUFDLGFBQWEsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0VBQ3BEOztBQUVELFFBQU8sS0FBSyxDQUFDO0NBQ2IsQ0FBQSxFQUFHLENBQUM7O1FBVE0sS0FBSyxHQUFMLEtBQUs7O0FBV1QsU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFXO21DQUFOLElBQUk7QUFBSixNQUFJOzs7QUFDbEMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsRUFBSTtBQUNqQixNQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtBQUMxQixTQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7V0FBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUFBLENBQUMsQ0FBQztHQUNqRDtFQUNELENBQUMsQ0FBQztBQUNILFFBQU8sR0FBRyxDQUFDO0NBQ1g7O0FBRU0sU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFRO0tBQU4sRUFBRSxnQ0FBQyxDQUFDOztBQUNoQyxRQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDM0M7O0FBT00sU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQzlCLEtBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtBQUN0QixTQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUN2Qjs7QUFFRCxLQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZDLEtBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7O0FBRXJCLEtBQUksUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDNUMsS0FBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQixLQUFJLFVBQVUsR0FBRyxvQkFBUyxHQUFHLEVBQUU7QUFDOUIsU0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbkQsQ0FBQzs7QUFFRixLQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsVUFBUyxHQUFHLEVBQUUsRUFBRSxFQUFFO0FBQ25ELFNBQU8sRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO0VBQ3hCLENBQUMsQ0FBQzs7QUFFSCxLQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IsU0FBUSxDQUFDLE9BQU8sQ0FBQyxVQUFTLE1BQU0sRUFBRTtBQUNqQyxPQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0VBQzNELENBQUMsQ0FBQzs7QUFFSCxNQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQy9DLE1BQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssRUFBRTtBQUN0QixVQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDbEM7RUFDRDs7QUFFRCxRQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7Q0FDOUI7O0FBRU0sU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFO0FBQzNCLFFBQU87QUFDTixNQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7QUFDZCxJQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUU7RUFDVixDQUFDO0NBQ0Y7O0FBRU0sU0FBUyxTQUFTLENBQUMsTUFBTSxFQUFnQjtLQUFkLEtBQUssZ0NBQUMsTUFBTTs7QUFDN0MsUUFBTyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0NBQ3ZDOztBQVNNLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUU7QUFDcEMsS0FBSSxHQUFHLEtBQUssT0FBTyxFQUFFO0FBQ3BCLFNBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQ3pCOztBQUVELEtBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO0FBQzVCLE1BQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3RCLE9BQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0IsVUFBTztBQUNOLFFBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDZixNQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztHQUNGOztBQUVELEtBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztFQUNYOztBQUVELEtBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO0FBQzVCLFNBQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN4Qzs7QUFFRCxRQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNuQjs7QUFFTSxTQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ3BDLEtBQUksRUFBRSxHQUFHLFVBQUEsSUFBSTtTQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsNkJBQTZCLEVBQUUsVUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUc7VUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0dBQUEsQ0FBQztFQUFBLENBQUM7QUFDakcsUUFBTyxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztDQUM1Qjs7QUFFTSxTQUFTLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQy9CLEtBQUksS0FBSyxDQUFDO0FBQ1YsSUFBRyxDQUFDLElBQUksQ0FBQyxVQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFLO0FBQzFCLE1BQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDdkIsVUFBTyxLQUFLLEdBQUcsSUFBSSxDQUFDO0dBQ3BCO0VBQ0QsQ0FBQyxDQUFDO0FBQ0gsUUFBTyxLQUFLLENBQUM7Q0FDYjs7QUFPTSxTQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUU7QUFDL0IsS0FBSTtBQUNILFNBQU8sQUFBQyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEVBQUcsQ0FBQztFQUMxQyxDQUFDLE9BQU0sQ0FBQyxFQUFFO0FBQ1YsU0FBTyxFQUFFLENBQUM7RUFDVjtDQUNEOzs7Ozs7Ozs7cUJDaUt1QixLQUFLOzs7Ozs7OztRQVViLFFBQVEsR0FBUixRQUFROzs7Ozs7O1FBYVIsSUFBSSxHQUFKLElBQUk7UUFJSixJQUFJLEdBQUosSUFBSTs7OztBQWhVcEIsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQ2hCLFlBQVc7QUFBQyxRQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztDQUFDLEdBQy9CLFlBQVc7QUFBQyxRQUFPLENBQUMsSUFBSSxJQUFJLEVBQUEsQ0FBQztDQUFDLENBQUM7O0FBRWxDLElBQUksT0FBTyxHQUFHLFNBQVMsSUFBSSxLQUFLLENBQUMsU0FBUyxHQUN2QyxVQUFTLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFBQyxRQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FBQyxHQUNyRCxVQUFTLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFDeEIsTUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMvQyxNQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUU7QUFDdkIsVUFBTyxDQUFDLENBQUM7R0FDVDtFQUNEOztBQUVELFFBQU8sQ0FBQyxDQUFDLENBQUM7Q0FDVixDQUFDOztBQUVILFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRTtBQUNwQixNQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMzRCxRQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLE1BQUksTUFBTSxFQUFFO0FBQ1gsUUFBSyxJQUFJLElBQUksSUFBSSxNQUFNLEVBQUU7QUFDeEIsT0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QjtHQUNEO0VBQ0Q7O0FBRUQsUUFBTyxHQUFHLENBQUM7Q0FDWDs7Ozs7Ozs7QUFRRCxBQUFDLENBQUEsWUFBVztBQUNYLEtBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztBQUNqQixLQUFJLE9BQU8sR0FBRyxDQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQzdDLE1BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQ3pFLFFBQU0sQ0FBQyxxQkFBcUIsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLHVCQUF1QixDQUFDLENBQUM7QUFDNUUsUUFBTSxDQUFDLG9CQUFvQixHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsc0JBQXNCLENBQUMsSUFDcEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyw2QkFBNkIsQ0FBQyxDQUFDO0VBQ3hEOztBQUVELEtBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQ2hDLE1BQU0sQ0FBQyxxQkFBcUIsR0FBRyxVQUFTLFFBQVEsRUFBRSxPQUFPLEVBQUU7QUFDMUQsTUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDdEIsTUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUEsQUFBQyxDQUFDLENBQUM7QUFDekQsTUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFXO0FBQ3JDLFdBQVEsQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLENBQUM7R0FDaEMsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNmLFVBQVEsR0FBRyxRQUFRLEdBQUcsVUFBVSxDQUFDO0FBQ2pDLFNBQU8sRUFBRSxDQUFDO0VBQ1YsQ0FBQzs7QUFFSCxLQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUMvQixNQUFNLENBQUMsb0JBQW9CLEdBQUcsVUFBUyxFQUFFLEVBQUU7QUFDMUMsY0FBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ2pCLENBQUM7Q0FDSCxDQUFBLEVBQUUsQ0FBRTs7QUFHTCxJQUFJLE9BQU8sR0FBRyxtQkFBVyxFQUFFLENBQUM7QUFDNUIsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDOztBQUVsQixJQUFJLFFBQVEsR0FBRztBQUNkLFNBQVEsRUFBRSxHQUFHO0FBQ2IsTUFBSyxFQUFFLENBQUM7QUFDUixPQUFNLEVBQUUsUUFBUTtBQUNoQixNQUFLLEVBQUUsT0FBTztBQUNkLEtBQUksRUFBRSxPQUFPO0FBQ2IsU0FBUSxFQUFFLE9BQU87QUFDakIsVUFBUyxFQUFFLElBQUk7QUFDZixRQUFPLEVBQUUsS0FBSztDQUNkLENBQUM7O0FBRUssSUFBSSxPQUFPLEdBQUc7QUFDcEIsT0FBTSxFQUFFLGdCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QixTQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNyQjtBQUNELE9BQU0sRUFBRSxnQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDNUIsU0FBTyxDQUFDLElBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUN0QjtBQUNELFFBQU8sRUFBRSxpQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDN0IsU0FBTyxDQUFDLENBQUMsSUFBRyxDQUFDLElBQUUsQ0FBQyxDQUFBLEFBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7RUFDNUI7QUFDRCxVQUFTLEVBQUUsbUJBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQy9CLE1BQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFJLENBQUM7QUFBRSxVQUFPLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7R0FBQSxBQUNwQyxPQUFPLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRyxBQUFDLEVBQUUsQ0FBQyxJQUFHLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ25DO0FBQ0QsUUFBTyxFQUFFLGlCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM3QixTQUFPLENBQUMsSUFBRSxDQUFDLElBQUUsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUN4QjtBQUNELFNBQVEsRUFBRSxrQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDOUIsU0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ2pDO0FBQ0QsV0FBVSxFQUFFLG9CQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUNoQyxNQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBSSxDQUFDO0FBQUUsVUFBTyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUFBLEFBQ3RDLE9BQU8sQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUEsR0FBRSxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ2hDO0FBQ0QsT0FBTSxFQUFFLGdCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QixTQUFNLEFBQUMsQ0FBQyxJQUFFLENBQUMsR0FBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBRyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztFQUNsRTtBQUNELFFBQU8sRUFBRSxpQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDN0IsU0FBTSxBQUFDLENBQUMsSUFBRSxDQUFDLEdBQUksQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxJQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ2xFO0FBQ0QsVUFBUyxFQUFFLG1CQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMvQixNQUFHLENBQUMsSUFBRSxDQUFDO0FBQUUsVUFBTyxDQUFDLENBQUM7R0FBQSxBQUNsQixJQUFHLENBQUMsSUFBRSxDQUFDO0FBQUUsVUFBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDO0dBQUEsQUFDcEIsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUksQ0FBQztBQUFFLFVBQU8sQ0FBQyxHQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQztHQUFBLEFBQ3hFLE9BQU8sQ0FBQyxHQUFDLENBQUMsR0FBRyxNQUFNLElBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3ZEO0FBQ0QsVUFBUyxFQUFFLG1CQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3JDLE1BQUksQ0FBQyxDQUFDO0FBQ04sTUFBRyxDQUFDLElBQUUsQ0FBQztBQUFFLFVBQU8sQ0FBQyxDQUFDO0dBQUEsQUFBRSxJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQSxJQUFHLENBQUM7QUFBRSxVQUFPLENBQUMsR0FBQyxDQUFDLENBQUM7R0FBQSxBQUFFLElBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxHQUFFLENBQUM7QUFDN0QsTUFBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUFFLElBQUMsR0FBQyxDQUFDLENBQUMsQUFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQztHQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBRSxDQUFDLEdBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQSxBQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEYsU0FBTyxFQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxFQUFFLElBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQSxBQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxDQUFFLENBQUEsQUFBQyxHQUFHLENBQUMsQ0FBQztFQUN6RTtBQUNELFdBQVUsRUFBRSxvQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN0QyxNQUFJLENBQUMsQ0FBQztBQUNOLE1BQUcsQ0FBQyxJQUFFLENBQUM7QUFBRSxVQUFPLENBQUMsQ0FBQztHQUFBLEFBQUUsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUEsSUFBRyxDQUFDO0FBQUUsVUFBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDO0dBQUEsQUFBRSxJQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsR0FBRSxDQUFDO0FBQzdELE1BQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFBRSxJQUFDLEdBQUMsQ0FBQyxDQUFDLEFBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUM7R0FBRSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUUsQ0FBQyxHQUFDLElBQUksQ0FBQyxFQUFFLENBQUEsQUFBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xGLFNBQU8sQ0FBQyxHQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBQyxJQUFJLENBQUMsRUFBRSxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFO0VBQ3ZFO0FBQ0QsYUFBWSxFQUFFLHNCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3hDLE1BQUksQ0FBQyxDQUFDO0FBQ04sTUFBRyxDQUFDLElBQUUsQ0FBQztBQUFFLFVBQU8sQ0FBQyxDQUFDO0dBQUEsQUFDbEIsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQztBQUFFLFVBQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQztHQUFBLEFBQzNCLElBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLENBQUMsSUFBRSxHQUFFLEdBQUMsR0FBRyxDQUFBLEFBQUMsQ0FBQztBQUNwQixNQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQUUsSUFBQyxHQUFDLENBQUMsQ0FBQyxBQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDO0dBQUUsTUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsRUFBRSxDQUFBLEFBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4RixNQUFHLENBQUMsR0FBRyxDQUFDO0FBQUUsVUFBTyxDQUFDLEdBQUUsSUFBRSxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsRUFBRSxJQUFFLENBQUMsSUFBRSxDQUFDLENBQUEsQUFBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLElBQUksQ0FBQyxFQUFFLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBRSxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7R0FBQSxBQUN0RixPQUFPLENBQUMsR0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsSUFBRSxDQUFDLElBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBQyxJQUFJLENBQUMsRUFBRSxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUUsR0FBQyxHQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM5RTtBQUNELE9BQU0sRUFBRSxnQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQy9CLE1BQUcsQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDO0FBQy9CLFNBQU8sQ0FBQyxJQUFFLENBQUMsSUFBRSxDQUFDLENBQUEsQUFBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUM7RUFDcEM7QUFDRCxRQUFPLEVBQUUsaUJBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUNoQyxNQUFHLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztBQUMvQixTQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBRyxDQUFDLENBQUEsQUFBQyxHQUFHLENBQUMsQ0FBQztFQUM3QztBQUNELFVBQVMsRUFBRSxtQkFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ2xDLE1BQUcsQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDO0FBQy9CLE1BQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFJLENBQUM7QUFBRSxVQUFPLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFHLEtBQUssQ0FBQyxHQUFFLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBRyxDQUFDLENBQUEsQ0FBQyxBQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQUEsQUFDL0QsT0FBTyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQSxHQUFFLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFHLEtBQUssQ0FBQyxHQUFFLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBRyxDQUFDLENBQUEsQUFBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3ZEO0FBQ0QsU0FBUSxFQUFFLGtCQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM5QixTQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQy9DO0FBQ0QsVUFBUyxFQUFFLG1CQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMvQixNQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQSxHQUFJLENB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QUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMzQixRQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUNoRDs7QUFFRCxTQUFTLGdCQUFnQixDQUFDLEdBQUcsRUFBRTtBQUM5QixLQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUU7QUFDbEIsS0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO0VBQ2pCOztBQUVELEtBQUksS0FBSyxJQUFJLEdBQUcsRUFBRTtBQUNqQixLQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7RUFDaEI7O0FBRUQsUUFBTyxHQUFHLENBQUM7Q0FDWDs7QUFFRCxTQUFTLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3pCLFFBQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxHQUFHLEtBQUssdUJBQUssR0FBRyxFQUFHLEtBQUssQ0FBQyxDQUFDO0NBQzFEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7ZXh0ZW5kLCBtYWtlUG9zLCBnZXRDdXJzb3J9IGZyb20gJy4vdXRpbHMnO1xuXG52YXIgYWN0aW9ucyA9IHtcblx0LyoqXG5cdCAqIFR5cGUtaW4gcGFzc2VkIHRleHQgaW50byBjdXJyZW50IGVkaXRvciBjaGFyLWJ5LWNoYXJcblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgQ3VycmVudCBvcHRpb25zXG5cdCAqIEBwYXJhbSB7Q29kZU1pcnJvcn0gZWRpdG9yIEVkaXRvciBpbnN0YW5jZSB3aGVyZSBhY3Rpb24gc2hvdWxkIGJlXG5cdCAqIHBlcmZvcm1lZFxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IEZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhY3Rpb24gcGVyZm9ybWFuY2Vcblx0ICogaXMgY29tcGxldGVkXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHRpbWVyIEZ1bmN0aW9uIHRoYXQgY3JlYXRlcyB0aW1lciBmb3IgZGVsYXllZFxuXHQgKiBleGVjdXRpb24uIFRoaXMgdGltZXIgd2lsbCBhdXRvbWF0aWNhbGx5IGRlbGF5IGV4ZWN1dGlvbiB3aGVuXG5cdCAqIHNjZW5hcmlvIGlzIHBhdXNlZCBhbmQgcmV2ZXJ0IHdoZW4gcGxheWVkIGFnYWluXG5cdCAqL1xuXHR0eXBlOiBmdW5jdGlvbihvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHR0ZXh0OiAnJywgIC8vIHRleHQgdG8gdHlwZVxuXHRcdFx0ZGVsYXk6IDYwLCAvLyBkZWxheSBiZXR3ZWVuIGNoYXJhY3RlciB0eXBpbmdcblx0XHRcdHBvczogbnVsbCAgLy8gaW5pdGlhbCBwb3NpdGlvbiB3aGVyZSB0byBzdGFydCB0eXBpbmdcblx0XHR9LCB3cmFwKCd0ZXh0Jywgb3B0aW9ucykpO1xuXG5cdFx0aWYgKCFvcHRpb25zLnRleHQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignTm8gdGV4dCBwcm92aWRlZCBmb3IgXCJ0eXBlXCIgYWN0aW9uJyk7XG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMucG9zICE9PSBudWxsKSB7XG5cdFx0XHRlZGl0b3Iuc2V0Q3Vyc29yKG1ha2VQb3Mob3B0aW9ucy5wb3MsIGVkaXRvcikpO1xuXHRcdH1cblxuXHRcdHZhciBjaGFycyA9IG9wdGlvbnMudGV4dC5zcGxpdCgnJyk7XG5cblx0XHR0aW1lcihmdW5jdGlvbiBwZXJmb3JtKCkge1xuXHRcdFx0dmFyIGNoID0gY2hhcnMuc2hpZnQoKTtcblx0XHRcdGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGNoLCAnZW5kJyk7XG5cdFx0XHRpZiAoY2hhcnMubGVuZ3RoKSB7XG5cdFx0XHRcdHRpbWVyKHBlcmZvcm0sIG9wdGlvbnMuZGVsYXkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmV4dCgpO1xuXHRcdFx0fVxuXHRcdH0sIG9wdGlvbnMuZGVsYXkpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBXYWl0IGZvciBhIHNwZWNpZmllZCB0aW1lb3V0XG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqIEBwYXJhbSBlZGl0b3Jcblx0ICogQHBhcmFtIG5leHRcblx0ICogQHBhcmFtIHRpbWVyXG5cdCAqL1xuXHR3YWl0OiBmdW5jdGlvbihvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHR0aW1lb3V0OiAxMDBcblx0XHR9LCB3cmFwKCd0aW1lb3V0Jywgb3B0aW9ucykpO1xuXG5cdFx0dGltZXIobmV4dCwgcGFyc2VJbnQob3B0aW9ucy50aW1lb3V0LCAxMCkpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNb3ZlIGNhcmV0IHRvIGEgc3BlY2lmaWVkIHBvc2l0aW9uXG5cdCAqL1xuXHRtb3ZlVG86IGZ1bmN0aW9uKG9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpIHtcblx0XHRvcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdGRlbGF5OiA4MCxcblx0XHRcdGltbWVkaWF0ZTogZmFsc2UgLy8gVE9ETzogcmVtb3ZlLCB1c2UgZGVsYXk6IDAgaW5zdGVhZFxuXHRcdH0sIHdyYXAoJ3BvcycsIG9wdGlvbnMpKTtcblxuXHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5wb3MgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ05vIHBvc2l0aW9uIHNwZWNpZmllZCBmb3IgXCJtb3ZlVG9cIiBhY3Rpb24nKTtcblx0XHR9XG5cblx0XHR2YXIgY3VyUG9zID0gZ2V0Q3Vyc29yKGVkaXRvcik7XG5cdFx0Ly8gcmVzZXQgc2VsZWN0aW9uLCBpZiBleGlzdHNcblx0XHRlZGl0b3Iuc2V0U2VsZWN0aW9uKGN1clBvcywgY3VyUG9zKTtcblx0XHR2YXIgdGFyZ2V0UG9zID0gbWFrZVBvcyhvcHRpb25zLnBvcywgZWRpdG9yKTtcblxuXHRcdGlmIChvcHRpb25zLmltbWVkaWF0ZSB8fCAhb3B0aW9ucy5kZWxheSkge1xuXHRcdFx0ZWRpdG9yLnNldEN1cnNvcih0YXJnZXRQb3MpO1xuXHRcdFx0bmV4dCgpO1xuXHRcdH1cblxuXHRcdHZhciBkZWx0YUxpbmUgPSB0YXJnZXRQb3MubGluZSAtIGN1clBvcy5saW5lO1xuXHRcdHZhciBkZWx0YUNoYXIgPSB0YXJnZXRQb3MuY2ggLSBjdXJQb3MuY2g7XG5cdFx0dmFyIHN0ZXBzID0gTWF0aC5tYXgoZGVsdGFDaGFyLCBkZWx0YUxpbmUpO1xuXHRcdC8vIHZhciBzdGVwTGluZSA9IGRlbHRhTGluZSAvIHN0ZXBzO1xuXHRcdC8vIHZhciBzdGVwQ2hhciA9IGRlbHRhQ2hhciAvIHN0ZXBzO1xuXHRcdHZhciBzdGVwTGluZSA9IGRlbHRhTGluZSA8IDAgPyAtMSA6IDE7XG5cdFx0dmFyIHN0ZXBDaGFyID0gZGVsdGFDaGFyIDwgMCA/IC0xIDogMTtcblxuXHRcdHRpbWVyKGZ1bmN0aW9uIHBlcmZvcm0oKSB7XG5cdFx0XHRjdXJQb3MgPSBnZXRDdXJzb3IoZWRpdG9yKTtcblx0XHRcdGlmIChzdGVwcyA+IDAgJiYgIShjdXJQb3MubGluZSA9PSB0YXJnZXRQb3MubGluZSAmJiBjdXJQb3MuY2ggPT0gdGFyZ2V0UG9zLmNoKSkge1xuXG5cdFx0XHRcdGlmIChjdXJQb3MubGluZSAhPSB0YXJnZXRQb3MubGluZSkge1xuXHRcdFx0XHRcdGN1clBvcy5saW5lICs9IHN0ZXBMaW5lO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1clBvcy5jaCAhPSB0YXJnZXRQb3MuY2gpIHtcblx0XHRcdFx0XHRjdXJQb3MuY2ggKz0gc3RlcENoYXI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlZGl0b3Iuc2V0Q3Vyc29yKGN1clBvcyk7XG5cdFx0XHRcdHN0ZXBzLS07XG5cdFx0XHRcdHRpbWVyKHBlcmZvcm0sIG9wdGlvbnMuZGVsYXkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWRpdG9yLnNldEN1cnNvcih0YXJnZXRQb3MpO1xuXHRcdFx0XHRuZXh0KCk7XG5cdFx0XHR9XG5cdFx0fSwgb3B0aW9ucy5kZWxheSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNpbWlsYXIgdG8gXCJtb3ZlVG9cIiBmdW5jdGlvbiBidXQgd2l0aCBpbW1lZGlhdGUgY3Vyc29yIHBvc2l0aW9uIHVwZGF0ZVxuXHQgKi9cblx0anVtcFRvOiBmdW5jdGlvbihvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHRhZnRlckRlbGF5OiAyMDBcblx0XHR9LCB3cmFwKCdwb3MnLCBvcHRpb25zKSk7XG5cblx0XHRpZiAodHlwZW9mIG9wdGlvbnMucG9zID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdObyBwb3NpdGlvbiBzcGVjaWZpZWQgZm9yIFwianVtcFRvXCIgYWN0aW9uJyk7XG5cdFx0fVxuXG5cdFx0ZWRpdG9yLnNldEN1cnNvcihtYWtlUG9zKG9wdGlvbnMucG9zLCBlZGl0b3IpKTtcblx0XHR0aW1lcihuZXh0LCBvcHRpb25zLmFmdGVyRGVsYXkpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBFeGVjdXRlcyBwcmVkZWZpbmVkIENvZGVNaXJyb3IgY29tbWFuZFxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcGFyYW0ge0NvZGVNaXJyb3J9IGVkaXRvclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHRpbWVyXG5cdCAqL1xuXHRydW46IGZ1bmN0aW9uKG9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpIHtcblx0XHRvcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdGJlZm9yZURlbGF5OiA1MDAsXG5cdFx0XHR0aW1lczogMVxuXHRcdH0sIHdyYXAoJ2NvbW1hbmQnLCBvcHRpb25zKSk7XG5cblx0XHR2YXIgdGltZXMgPSBvcHRpb25zLnRpbWVzO1xuXHRcdHRpbWVyKGZ1bmN0aW9uIHBlcmZvcm0oKSB7XG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuY29tbWFuZCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRvcHRpb25zLmNvbW1hbmQoZWRpdG9yLCBvcHRpb25zKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVkaXRvci5leGVjQ29tbWFuZChvcHRpb25zLmNvbW1hbmQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoLS10aW1lcyA+IDApIHtcblx0XHRcdFx0dGltZXIocGVyZm9ybSwgb3B0aW9ucy5iZWZvcmVEZWxheSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRuZXh0KCk7XG5cdFx0XHR9XG5cdFx0fSwgb3B0aW9ucy5iZWZvcmVEZWxheSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgc2VsZWN0aW9uIGZvciBzcGVjaWZpZWQgcG9zaXRpb25cblx0ICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcblx0ICogQHBhcmFtIHtDb2RlTWlycm9yfSBlZGl0b3Jcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSB0aW1lclxuXHQgKi9cblx0c2VsZWN0OiBmdW5jdGlvbihvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHRmcm9tOiAnY2FyZXQnXG5cdFx0fSwgd3JhcCgndG8nLCBvcHRpb25zKSk7XG5cblx0XHR2YXIgZnJvbSA9IG1ha2VQb3Mob3B0aW9ucy5mcm9tLCBlZGl0b3IpO1xuXHRcdHZhciB0byA9IG1ha2VQb3Mob3B0aW9ucy50bywgZWRpdG9yKTtcblx0XHRlZGl0b3Iuc2V0U2VsZWN0aW9uKGZyb20sIHRvKTtcblx0XHRuZXh0KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhpZ2hsaWdodHMgdGV4dCB3aXRoIGFuIG9wdGlvbmFsIENTUyBjbGFzc1xuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcGFyYW0ge0NvZGVNaXJyb3J9IGVkaXRvclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHRpbWVyXG5cdCAqL1xuXHRoaWdobGlnaHQ6IGZ1bmN0aW9uKG9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpIHtcblx0XHRvcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdGZyb206ICdjYXJldCcsXG5cdFx0XHRzdHlsZTogJ2hpZ2hsaWdodGVkJ1xuXHRcdH0sIHdyYXAoJ3RvJywgb3B0aW9ucykpO1xuXG5cdFx0dmFyIGZyb20gPSBtYWtlUG9zKG9wdGlvbnMuZnJvbSwgZWRpdG9yKTtcblx0XHR2YXIgdG8gPSBtYWtlUG9zKG9wdGlvbnMudG8sIGVkaXRvcik7XG5cdFx0ZWRpdG9yLm1hcmtUZXh0KGZyb20sIHRvLCB7Y2xhc3NOYW1lOiBvcHRpb25zLnN0eWxlfSk7XG5cdFx0bmV4dCgpO1xuXHR9XG59O1xuXG5mdW5jdGlvbiB3cmFwKGtleSwgdmFsdWUpIHtcblx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyB2YWx1ZSA6IHtba2V5XTogdmFsdWV9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhY3Rpb25zO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB7dG9BcnJheX0gZnJvbSAnLi91dGlscyc7XG5cbnZhciB3M2NDU1MgPSBkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlO1xuXG5leHBvcnQgZnVuY3Rpb24gdmlld3BvcnRSZWN0KCkge1xuXHR2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cdHZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHR2YXIgY2xpZW50VG9wID0gZG9jRWxlbS5jbGllbnRUb3AgIHx8IGJvZHkuY2xpZW50VG9wICB8fCAwO1xuXHR2YXIgY2xpZW50TGVmdCA9IGRvY0VsZW0uY2xpZW50TGVmdCB8fCBib2R5LmNsaWVudExlZnQgfHwgMDtcblx0dmFyIHNjcm9sbFRvcCAgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxUb3AgIHx8IGJvZHkuc2Nyb2xsVG9wO1xuXHR2YXIgc2Nyb2xsTGVmdCA9IHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2NFbGVtLnNjcm9sbExlZnQgfHwgYm9keS5zY3JvbGxMZWZ0O1xuXHRcblx0cmV0dXJuIHtcblx0XHR0b3A6IHNjcm9sbFRvcCAgLSBjbGllbnRUb3AsXG5cdFx0bGVmdDogc2Nyb2xsTGVmdCAtIGNsaWVudExlZnQsXG5cdFx0d2lkdGg6IGJvZHkuY2xpZW50V2lkdGggfHwgZG9jRWxlbS5jbGllbnRXaWR0aCxcblx0XHRoZWlnaHQ6IGJvZHkuY2xpZW50SGVpZ2h0IHx8IGRvY0VsZW0uY2xpZW50SGVpZ2h0XG5cdH07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBlbGVtZW50IGZyb20gcGFyZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAqIEByZXR1cm5zIHtFbGVtZW50fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlKGVsZW0pIHtcblx0YXIoZWxlbSkuZm9yRWFjaChlbCA9PiBlbC5wYXJlbnROb2RlICYmIGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpKTtcblx0cmV0dXJuIGVsZW07XG59XG5cbi8qKlxuICogUmVuZGVycyBzdHJpbmcgaW50byBET00gZWxlbWVudFxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybnMge0VsZW1lbnR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0RPTShzdHIpIHtcblx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRkaXYuaW5uZXJIVE1MID0gc3RyO1xuXHRyZXR1cm4gZGl2LmZpcnN0Q2hpbGQ7XG59XG5cbi8qKlxuICogU2V0cyBvciByZXRyaWV2ZXMgQ1NTIHByb3BlcnR5IHZhbHVlXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjc3MoZWxlbSwgcHJvcCwgdmFsKSB7XG5cdGlmICh0eXBlb2YgcHJvcCA9PT0gJ3N0cmluZycgJiYgdmFsID09IG51bGwpIHtcblx0XHRyZXR1cm4gZ2V0Q1NTKGVsZW0sIHByb3ApO1xuXHR9XG5cdFxuXHRpZiAodHlwZW9mIHByb3AgPT09ICdzdHJpbmcnKSB7XG5cdFx0dmFyIG9iaiA9IHt9O1xuXHRcdG9ialtwcm9wXSA9IHZhbDtcblx0XHRwcm9wID0gb2JqO1xuXHR9XG5cdFxuXHRzZXRDU1MoZWxlbSwgcHJvcCk7XG59XG5cbmZ1bmN0aW9uIGFyKG9iaikge1xuXHRpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcblx0XHRyZXR1cm4gdG9BcnJheShvYmopO1xuXHR9XG5cdFxuXHRyZXR1cm4gQXJyYXkuaXNBcnJheShvYmopID8gb2JqIDogW29ial07XG59XG5cbmZ1bmN0aW9uIHRvQ2FtZWxDYXNlKG5hbWUpIHtcblx0cmV0dXJuIG5hbWUucmVwbGFjZSgvXFwtKFxcdykvZywgZnVuY3Rpb24oc3RyLCBwMSkge1xuXHRcdHJldHVybiBwMS50b1VwcGVyQ2FzZSgpO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBnaXZlbiBlbGVtZW50LlxuICogQGF1dGhvciBqUXVlcnkgVGVhbVxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBDU1MgcHJvcGVydHkgdmFsdWVcbiAqL1xuZnVuY3Rpb24gZ2V0Q1NTKGVsZW0sIG5hbWUpIHtcblx0dmFyIHJudW1weCA9IC9eLT9cXGQrKD86cHgpPyQvaSxcblx0XHRybnVtID0gL14tP1xcZCg/OlxcLlxcZCspPy8sXG5cdFx0cnN1ZiA9IC9cXGQkLztcblx0XG5cdHZhciBuYW1lQ2FtZWwgPSB0b0NhbWVsQ2FzZShuYW1lKTtcblx0Ly8gSWYgdGhlIHByb3BlcnR5IGV4aXN0cyBpbiBzdHlsZVtdLCB0aGVuIGl0J3MgYmVlbiBzZXRcblx0Ly8gcmVjZW50bHkgKGFuZCBpcyBjdXJyZW50KVxuXHRpZiAoZWxlbS5zdHlsZVtuYW1lQ2FtZWxdKSB7XG5cdFx0cmV0dXJuIGVsZW0uc3R5bGVbbmFtZUNhbWVsXTtcblx0fSBcblx0XHRcblx0aWYgKHczY0NTUykge1xuXHRcdHZhciBjcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0sICcnKTtcblx0XHRyZXR1cm4gY3MuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcblx0fVxuXHRcblx0aWYgKGVsZW0uY3VycmVudFN0eWxlKSB7XG5cdFx0dmFyIHJldCA9IGVsZW0uY3VycmVudFN0eWxlW25hbWVdIHx8IGVsZW0uY3VycmVudFN0eWxlW25hbWVDYW1lbF07XG5cdFx0dmFyIHN0eWxlID0gZWxlbS5zdHlsZSB8fCBlbGVtO1xuXHRcdFxuXHRcdC8vIEZyb20gdGhlIGF3ZXNvbWUgaGFjayBieSBEZWFuIEVkd2FyZHNcblx0XHQvLyBodHRwOi8vZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDcvMDcvMjcvMTguNTQuMTUvI2NvbW1lbnQtMTAyMjkxXG5cdFx0XG5cdFx0Ly8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgcGl4ZWwgbnVtYmVyXG5cdFx0Ly8gYnV0IGEgbnVtYmVyIHRoYXQgaGFzIGEgd2VpcmQgZW5kaW5nLCB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgdG8gcGl4ZWxzXG5cdFx0aWYgKCFybnVtcHgudGVzdChyZXQpICYmIHJudW0udGVzdChyZXQpKSB7XG5cdFx0XHQvLyBSZW1lbWJlciB0aGUgb3JpZ2luYWwgdmFsdWVzXG5cdFx0XHR2YXIgbGVmdCA9IHN0eWxlLmxlZnQsIHJzTGVmdCA9IGVsZW0ucnVudGltZVN0eWxlLmxlZnQ7XG5cdFx0XHRcblx0XHRcdC8vIFB1dCBpbiB0aGUgbmV3IHZhbHVlcyB0byBnZXQgYSBjb21wdXRlZCB2YWx1ZSBvdXRcblx0XHRcdGVsZW0ucnVudGltZVN0eWxlLmxlZnQgPSBlbGVtLmN1cnJlbnRTdHlsZS5sZWZ0O1xuXHRcdFx0dmFyIHN1ZmZpeCA9IHJzdWYudGVzdChyZXQpID8gJ2VtJyA6ICcnO1xuXHRcdFx0c3R5bGUubGVmdCA9IG5hbWVDYW1lbCA9PT0gJ2ZvbnRTaXplJyA/ICcxZW0nIDogKHJldCArIHN1ZmZpeCB8fCAwKTtcblx0XHRcdHJldCA9IHN0eWxlLnBpeGVsTGVmdCArICdweCc7XG5cdFx0XHRcblx0XHRcdC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcblx0XHRcdHN0eWxlLmxlZnQgPSBsZWZ0O1xuXHRcdFx0ZWxlbS5ydW50aW1lU3R5bGUubGVmdCA9IHJzTGVmdDtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHJldDtcblx0fVxufVxuXG4vKipcbiAqIFNldHMgQ1NTIHByb3BlcnRpZXMgdG8gZ2l2ZW4gZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIENTUyBwcm9wZXJ0aWVzIHRvIHNldFxuICovXG5mdW5jdGlvbiBzZXRDU1MoZWxlbSwgcGFyYW1zKSB7XG5cdGlmICghZWxlbSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBudW1Qcm9wcyA9IHsnbGluZS1oZWlnaHQnOiAxLCAnei1pbmRleCc6IDEsIG9wYWNpdHk6IDF9O1xuXHR2YXIgcHJvcHMgPSBPYmplY3Qua2V5cyhwYXJhbXMpLm1hcChrID0+IHtcblx0XHR2YXIgdiA9IHBhcmFtc1trXTtcblx0XHR2YXIgbmFtZSA9IGsucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJykudG9Mb3dlckNhc2UoKTtcblx0XHRyZXR1cm4gbmFtZSArICc6JyArICgodHlwZW9mIHYgPT09ICdudW1iZXInICYmICEobmFtZSBpbiBudW1Qcm9wcykpID8gdiArICdweCcgOiB2KTtcblx0fSk7XG5cblx0ZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICc7JyArIHByb3BzLmpvaW4oJzsnKTtcbn0iLCIvKipcbiAqIEEgaGlnaC1sZXZlbCBsaWJyYXJ5IGludGVyZmFjZSBmb3IgY3JlYXRpbmcgc2NlbmFyaW9zIG92ZXIgdGV4dGFyZWFcbiAqIGVsZW1lbnQuIFRoZSA8Y29kZT5Db2RlTWlycm9yLm1vdmllPC9jb2RlPiB0YWtlcyByZWZlcmVuY2UgdG8gdGV4dGFyZWFcbiAqIGVsZW1lbnQgKG9yIGl0cyBJRCkgYW5kIHBhcnNlcyBpdHMgY29udGVudCBmb3IgaW5pdGlhbCBjb250ZW50IHZhbHVlLFxuICogc2NlbmFyaW8gYW5kIG91dGxpbmUuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQge3BhcnNlSlNPTiwgZXh0ZW5kLCB0b0FycmF5fSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBTY2VuYXJpbyBmcm9tICcuL3NjZW5hcmlvJztcbmltcG9ydCBvdXRsaW5lIGZyb20gJy4vd2lkZ2V0cy9vdXRsaW5lJztcblxudmFyIGlvcyA9IC9BcHBsZVdlYktpdC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAvTW9iaWxlXFwvXFx3Ky8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbnZhciBtYWMgPSBpb3MgfHwgL01hYy8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pO1xuXG52YXIgbWFjQ2hhck1hcCA9IHtcblx0J2N0cmwnOiAn4oyDJyxcblx0J2NvbnRyb2wnOiAn4oyDJyxcblx0J2NtZCc6ICfijJgnLFxuXHQnc2hpZnQnOiAn4oenJyxcblx0J2FsdCc6ICfijKUnLFxuXHQnZW50ZXInOiAn4o+OJyxcblx0J3RhYic6ICfih6UnLFxuXHQnbGVmdCc6ICfihpAnLFxuXHQncmlnaHQnOiAn4oaSJyxcblx0J3VwJzogJ+KGkScsXG5cdCdkb3duJzogJ+KGkydcbn07XG5cbnZhciBwY0NoYXJNYXAgPSB7XG5cdCdjbWQnOiAnQ3RybCcsXG5cdCdjb250cm9sJzogJ0N0cmwnLFxuXHQnY3RybCc6ICdDdHJsJyxcblx0J2FsdCc6ICdBbHQnLFxuXHQnc2hpZnQnOiAnU2hpZnQnLFxuXHQnbGVmdCc6ICfihpAnLFxuXHQncmlnaHQnOiAn4oaSJyxcblx0J3VwJzogJ+KGkScsXG5cdCdkb3duJzogJ+KGkydcbn07XG5cbmV4cG9ydCB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG5cdC8qKlxuXHQgKiBBdXRvbWF0aWNhbGx5IHBhcnNlIG1vdmllIGRlZmluaXRpb24gZnJvbSB0ZXh0YXJlYSBjb250ZW50LiBTZXR0aW5nXG5cdCAqIHRoaXMgcHJvcGVydHkgdG8gPGNvZGU+ZmFsc2U8L2NvZGU+IGFzc3VtZXMgdGhhdCB1c2VyIHdhbnRzIHRvXG5cdCAqIGV4cGxpY2l0bHkgcHJvdmlkZSBtb3ZpZSBkYXRhOiBpbml0aWFsIHZhbHVlLCBzY2VuYXJpbyBldGMuXG5cdCAqL1xuXHRwYXJzZTogdHJ1ZSxcblxuXHQvKipcblx0ICogU3RyaW5nIG9yIHJlZ2V4cCB1c2VkIHRvIHNlcGFyYXRlIHNlY3Rpb25zIG9mIG1vdmllIGRlZmluaXRpb24sIGUuZy5cblx0ICogZGVmYXVsdCB2YWx1ZSwgc2NlbmFyaW8gYW5kIGVkaXRvciBvcHRpb25zXG5cdCAqL1xuXHRzZWN0aW9uU2VwYXJhdG9yOiAnQEBAJyxcblxuXHQvKiogUmVndWxhciBleHByZXNzaW9uIHRvIGV4dHJhY3Qgb3V0bGluZSBmcm9tIHNjZW5hcmlvIGxpbmUgKi9cblx0b3V0bGluZVNlcGFyYXRvcjogL1xccys6OjpcXHMrKC4rKSQvLFxuXG5cdC8qKiBBdXRvbWF0aWNhbGx5IHByZXR0aWZ5IGtleWJvYXJkIHNob3J0Y3V0cyBpbiBvdXRsaW5lICovXG5cdHByZXR0aWZ5S2V5czogdHJ1ZSxcblxuXHQvKiogU3RyaXAgcGFyZW50aGVzZXMgZnJvbSBwcmV0dHlmaWVkIGtleWJvYXJkIHNob3J0Y3V0IGRlZmluaXRpb24gKi9cblx0c3RyaXBQYXJlbnRoZXNlczogZmFsc2Vcbn07XG5cbi8qKlxuICogSGlnaC1sZXZlbCBmdW5jdGlvbiB0byBjcmVhdGUgbW92aWUgaW5zdGFuY2Ugb24gdGV4dGFyZWEuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBSZWZlcmVuY2UgdG8gdGV4dGFyZWEsIGVpdGhlciA8Y29kZT5FbGVtZW50PC9jb2RlPlxuICogb3Igc3RyaW5nIElELiBJdCBjYW4gYWxzbyBhY2NlcHQgZXhpc3RpbmcgQ29kZU1pcnJvciBvYmplY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gbW92aWVPcHRpb25zIE1vdmllIG9wdGlvbnMuIFNlZSA8Y29kZT5kZWZhdWx0T3B0aW9uczwvY29kZT5cbiAqIGZvciB2YWx1ZSByZWZlcmVuY2VcbiAqIEBwYXJhbSB7T2JqZWN0fSBlZGl0b3JPcHRpb25zIEFkZGl0aW9uYWwgb3B0aW9ucyBwYXNzZWQgdG8gQ29kZU1pcnJvclxuICogZWRpdG9yIGluaXRpYWxpemVyLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtb3ZpZSh0YXJnZXQsIG1vdmllT3B0aW9ucz17fSwgZWRpdG9yT3B0aW9ucz17fSkge1xuXHRzZXR1cENvZGVNaXJyb3IoKTtcblxuXHRpZiAodHlwZW9mIHRhcmdldCA9PT0gJ3N0cmluZycpIHtcblx0XHR0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YXJnZXQpO1xuXHR9XG5cblx0dmFyIHRhcmdldElzVGV4dGFyZWEgPSB0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3RleHRhcmVhJztcblxuXHRtb3ZpZU9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRPcHRpb25zLCBtb3ZpZU9wdGlvbnMpO1xuXHRlZGl0b3JPcHRpb25zID0gZXh0ZW5kKHtcblx0XHR0aGVtZTogJ2VzcHJlc3NvJyxcblx0XHRtb2RlIDogJ3RleHQvaHRtbCcsXG5cdFx0aW5kZW50V2l0aFRhYnM6IHRydWUsXG5cdFx0dGFiU2l6ZTogNCxcblx0XHRsaW5lTnVtYmVycyA6IHRydWUsXG5cdFx0cHJldmVudEN1cnNvck1vdmVtZW50OiB0cnVlXG5cdH0sIGVkaXRvck9wdGlvbnMpO1xuXG5cdHZhciBpbml0aWFsVmFsdWUgPSBlZGl0b3JPcHRpb25zLnZhbHVlIHx8ICh0YXJnZXRJc1RleHRhcmVhID8gdGFyZ2V0LnZhbHVlIDogdGFyZ2V0LmdldFZhbHVlKCkpIHx8ICcnO1xuXG5cdGlmICh0YXJnZXRJc1RleHRhcmVhICYmIG1vdmllT3B0aW9ucy5wYXJzZSkge1xuXHRcdGV4dGVuZChtb3ZpZU9wdGlvbnMsIHBhcnNlTW92aWVEZWZpbml0aW9uKGluaXRpYWxWYWx1ZSwgbW92aWVPcHRpb25zKSk7XG5cdFx0aW5pdGlhbFZhbHVlID0gbW92aWVPcHRpb25zLnZhbHVlO1xuXHRcdGlmIChtb3ZpZU9wdGlvbnMuZWRpdG9yT3B0aW9ucykge1xuXHRcdFx0ZXh0ZW5kKGVkaXRvck9wdGlvbnMsIG1vdmllT3B0aW9ucy5lZGl0b3JPcHRpb25zKTtcblx0XHR9XG5cblx0XHQvLyByZWFkIENNIG9wdGlvbnMgZnJvbSBnaXZlbiB0ZXh0YXJlYVxuXHRcdHZhciBjbUF0dHIgPSAvXmRhdGFcXC1jbVxcLSguKykkL2k7XG5cdFx0dG9BcnJheSh0YXJnZXQuYXR0cmlidXRlcykuZm9yRWFjaChmdW5jdGlvbihhdHRyKSB7XG5cdFx0XHR2YXIgbSA9IGF0dHIubmFtZS5tYXRjaChjbUF0dHIpO1xuXHRcdFx0aWYgKG0pIHtcblx0XHRcdFx0ZWRpdG9yT3B0aW9uc1ttWzFdXSA9IGF0dHIudmFsdWU7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBub3JtYWxpemUgbGluZSBlbmRpbmdzXG5cdGluaXRpYWxWYWx1ZSA9IGluaXRpYWxWYWx1ZS5yZXBsYWNlKC9cXHI/XFxuL2csICdcXG4nKTtcblxuXHQvLyBsb2NhdGUgaW5pdGlhbCBjYXJldCBwb3NpdGlvbiBmcm9tIHwgc3ltYm9sXG5cdHZhciBpbml0aWFsUG9zID0gaW5pdGlhbFZhbHVlLmluZGV4T2YoJ3wnKTtcblxuXHRpZiAodGFyZ2V0SXNUZXh0YXJlYSkge1xuXHRcdHRhcmdldC52YWx1ZSA9IGVkaXRvck9wdGlvbnMudmFsdWUgPSBpbml0aWFsVmFsdWUgPSBpbml0aWFsVmFsdWUucmVwbGFjZSgvXFx8L2csICcnKTtcblx0fVxuXG5cdC8vIGNyZWF0ZSBlZGl0b3IgaW5zdGFuY2UgaWYgbmVlZGVkXG5cdHZhciBlZGl0b3IgPSB0YXJnZXRJc1RleHRhcmVhID8gQ29kZU1pcnJvci5mcm9tVGV4dEFyZWEodGFyZ2V0LCBlZGl0b3JPcHRpb25zKSA6IHRhcmdldDtcblxuXHRpZiAoaW5pdGlhbFBvcyAhPSAtMSkge1xuXHRcdGVkaXRvci5zZXRDdXJzb3IoZWRpdG9yLnBvc0Zyb21JbmRleChpbml0aWFsUG9zKSk7XG5cdH1cblxuXHQvLyBzYXZlIGluaXRpYWwgZGF0YSBzbyB3ZSBjYW4gcmV2ZXJ0IHRvIGl0IGxhdGVyXG5cdGVkaXRvci5fX2luaXRpYWwgPSB7XG5cdFx0Y29udGVudDogaW5pdGlhbFZhbHVlLFxuXHRcdHBvczogZWRpdG9yLmdldEN1cnNvcih0cnVlKVxuXHR9O1xuXG5cdHZhciB3cmFwcGVyID0gZWRpdG9yLmdldFdyYXBwZXJFbGVtZW50KCk7XG5cblx0Ly8gYWRqdXN0IGhlaWdodCwgaWYgcmVxdWlyZWRcblx0aWYgKGVkaXRvck9wdGlvbnMuaGVpZ2h0KSB7XG5cdFx0d3JhcHBlci5zdHlsZS5oZWlnaHQgPSBlZGl0b3JPcHRpb25zLmhlaWdodCArICdweCc7XG5cdH1cblxuXHR3cmFwcGVyLmNsYXNzTmFtZSArPSAnIENvZGVNaXJyb3ItbW92aWUnICsgKG1vdmllT3B0aW9ucy5vdXRsaW5lID8gJyBDb2RlTWlycm9yLW1vdmllX3dpdGgtb3V0bGluZScgOiAnJyk7XG5cblx0dmFyIHNjID0gbmV3IFNjZW5hcmlvKG1vdmllT3B0aW9ucy5zY2VuYXJpbywgZWRpdG9yKTtcblx0aWYgKG1vdmllT3B0aW9ucy5vdXRsaW5lKSB7XG5cdFx0d3JhcHBlci5jbGFzc05hbWUgKz0gJyBDb2RlTWlycm9yLW1vdmllX3dpdGgtb3V0bGluZSc7XG5cdFx0d3JhcHBlci5hcHBlbmRDaGlsZChvdXRsaW5lKG1vdmllT3B0aW9ucy5vdXRsaW5lLCBzYykpO1xuXHR9XG5cdHJldHVybiBzYztcbn07XG5cbi8qKlxuICogUHJldHR5ZmllcyBrZXkgYmluZGluZ3MgcmVmZXJlbmNlcyBpbiBnaXZlbiBzdHJpbmc6IGZvcm1hdHMgaXQgYWNjb3JkaW5nXG4gKiB0byBjdXJyZW50IHVzZXLigJlzIHBsYXRmb3JtLiBUaGUga2V5IGJpbmRpbmcgc2hvdWxkIGJlIGRlZmluZWQgaW5zaWRlXG4gKiBwYXJlbnRoZXNlcywgZS5nLiA8Y29kZT4oY3RybC1hbHQtdXApPC9jb2RlPlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVHJhbnNmb3JtIG9wdGlvbnNcbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHByZXR0aWZ5S2V5QmluZGluZ3Moc3RyLCBvcHRpb25zKSB7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHR2YXIgcmVLZXkgPSAvY3RybHxhbHR8c2hpZnR8Y21kL2k7XG5cdHZhciBtYXAgPSBtYWMgPyBtYWNDaGFyTWFwIDogcGNDaGFyTWFwO1xuXHRyZXR1cm4gc3RyLnJlcGxhY2UoL1xcKCguKz8pXFwpL2csIGZ1bmN0aW9uKG0sIGtiKSB7XG5cdFx0aWYgKHJlS2V5LnRlc3Qoa2IpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrYi50b0xvd2VyQ2FzZSgpXG5cdFx0XHRcdC5zcGxpdCgvW1xcLVxcK10vKVxuXHRcdFx0XHQubWFwKGtleSA9PiBtYXBba2V5LnRvTG93ZXJDYXNlKCldIHx8IGtleS50b1VwcGVyQ2FzZSgpKTtcblxuXHRcdFx0bSA9IHBhcnRzLmpvaW4obWFjID8gJycgOiAnKycpO1xuXHRcdFx0aWYgKCFvcHRpb25zLnN0cmlwUGFyZW50aGVzZXMpIHtcblx0XHRcdFx0bSA9ICcoJyArIG0gKyAnKSc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG07XG5cdH0pO1xufVxuXG5mdW5jdGlvbiByZWFkTGluZXModGV4dCkge1xuXHQvLyBJRSBmYWlscyB0byBzcGxpdCBzdHJpbmcgYnkgcmVnZXhwLFxuXHQvLyBuZWVkIHRvIG5vcm1hbGl6ZSBuZXdsaW5lcyBmaXJzdFxuXHR2YXIgbmwgPSAnXFxuJztcblx0dmFyIGxpbmVzID0gKHRleHQgfHwgJycpXG5cdFx0LnJlcGxhY2UoL1xcclxcbi9nLCBubClcblx0XHQucmVwbGFjZSgvXFxuXFxyL2csIG5sKVxuXHRcdC5yZXBsYWNlKC9cXHIvZywgbmwpXG5cdFx0LnNwbGl0KG5sKTtcblxuXHQvLyBJZiB0aGlzIGxpbmUgc3RhcnRzIHdpdGggc3BhY2VzIG9yIGlzIGp1c3QgYSB9LCBjb21iaW5lIGl0IHdpdGggdGhlIGxhc3QgbGluZVxuXHRmb3IodmFyIGkgPSBsaW5lcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdGlmKGxpbmVzW2ldLm1hdGNoKC9eW1xcc1xcc118Xlt9JF0vKSkge1xuXHRcdFx0bGluZXNbaS0xXSA9IGxpbmVzW2ktMV0gKyBcIlxcblwiICsgbGluZXNbaV07XG5cdFx0XHRsaW5lcy5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ29tYmluZSBtdWx0aWxpbmUgc3RhdGVtZW50cyBpbnRvIGEgc2luZ2xlIGxpbmVcblx0Zm9yKHZhciBpID0gMCwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpZihsaW5lc1tpXS5tYXRjaChcIlxcblwiKSAmJiBsaW5lc1tpXS5tYXRjaCgpKSB7XG5cdFx0XHRsaW5lc1tpXSA9IHBhcnNlTXVsdGxpbmVTY2VuZXJpbyhsaW5lc1tpXSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGxpbmVzLmZpbHRlcihCb29sZWFuKTtcbn1cblxuLy8gQWxsb3cgY29tbWFuZHMgdG8gYmUgc3ByZWFkIG92ZXIgbXVsdGlwbGUgbGluZXMsIHVzaW5nIGluZGVudGF0aW9uIHRvIGRldGVybWluZVxuZnVuY3Rpb24gcGFyc2VNdWx0bGluZVNjZW5lcmlvKGxpbmUpIHtcblx0dmFyIHJlZyA9IC9eKFxcdys/KVxccyo6XFxzKih7W1xcc3xcXFNdK30pXFxzKig/Ojo6OlxccyooW1xcc1xcU10rKSk/L20sXG5cdFx0XHRyZXMgPSBsaW5lLm1hdGNoKHJlZyksXG5cdFx0XHRvYiA9IHt9O1xuXG5cdHZhciBwYXJzZWRSZXMgPSByZXNbMl0uc3BsaXQoXCJcXG5cIiksXG5cdFx0XHRrZXksXG5cdFx0XHR0LFxuXHRcdFx0dGFiTGVuZ3RoID0gZmFsc2UsXG5cdFx0XHRmaXJzdExldmVsSW5kZW50UmVnZXggPSBcIihcXHcrPylcXHMqOlxccyooLispXCIsXG5cdFx0XHRsYXN0TGV2ZWxJbmRlbnRSZWdleDtcblx0Zm9yKHZhciBpID0gMCwgbGVuID0gcGFyc2VkUmVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0dmFyIHRhYnMgPSBwYXJzZWRSZXNbaV0ubWF0Y2goL14oXFxzKSsvKTtcblx0XHRpZih0YWJzKSB7XG5cdFx0XHQvLyAyIHRhYnMgbWVhbnMgdGhpcyBtdXN0IGJlIGEga2V5XG5cdFx0XHRpZih0YWJzWzBdLmxlbmd0aCA9PSB0YWJMZW5ndGggfHwgIXRhYkxlbmd0aCkge1xuXHRcdFx0XHRpZighdGFiTGVuZ3RoKSB7XG5cdFx0XHRcdFx0dGFiTGVuZ3RoID0gdGFic1swXS5sZW5ndGg7XG5cdFx0XHRcdFx0Zmlyc3RMZXZlbEluZGVudFJlZ2V4ID0gbmV3IFJlZ0V4cChcIl5cXFxcc3tcIit0YWJMZW5ndGgrXCJ9KFxcXFx3Kz8pXFxcXHMqOlxcXFxzKiguKylcIik7XG5cdFx0XHRcdFx0bGFzdExldmVsSW5kZW50UmVnZXggPSBuZXcgUmVnRXhwKFwiXlxcXFxze1wiKyh0YWJMZW5ndGgqMikrXCJ9XCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIElmIHRoaXMgaXMgYSB7a2V5OiB2YWx1ZX0sIHNhdmUgYm90aFxuXHRcdFx0XHRpZihwYXJzZWRSZXNbaV0ubWF0Y2goZmlyc3RMZXZlbEluZGVudFJlZ2V4KSkge1xuXHRcdFx0XHRcdHQgPSBwYXJzZUpTT04oXCJ7XCIrcGFyc2VkUmVzW2ldK1wifVwiKTtcblx0XHRcdFx0XHRrZXkgPSBPYmplY3Qua2V5cyh0KVswXTtcblx0XHRcdFx0XHRvYltrZXldID0gdFtrZXldO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIE90aGVyd2lzZSwganVzdCBhIGtleSwgYWRkIHRoYXQgaW5cblx0XHRcdFx0XHRrZXkgPSBwYXJzZWRSZXNbaV0ubWF0Y2goL1xcdysvKVswXTtcblx0XHRcdFx0XHRvYltrZXldID0gJyc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2UgeyAvLyBUaGlzIGlzIGEgbXVsdGlsaW5lIHN0cmluZyB3ZSBuZWVkIHRvIGNvbWJpbmVcblx0XHRcdFx0b2Jba2V5XSA9IG9iW2tleV0gKyBwYXJzZWRSZXNbaV0ucmVwbGFjZShsYXN0TGV2ZWxJbmRlbnRSZWdleCwgJycpICsgXCJcXG5cIjtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYocGFyc2VkUmVzW2ldLm1hdGNoKC9eXFxzKiQvKSAmJiBrZXkpIHtcblx0XHRcdG9iW2tleV0gPSBvYltrZXldICsgXCJcXG5cIjtcblx0XHR9XG5cdH1cblxuXHRPYmplY3Qua2V5cyhvYikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcblx0XHRpZihvYltrZXldWyd0cmltJ10pIHtcblx0XHRcdG9iW2tleV0gPSBvYltrZXldLnRyaW0oKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIEFkZCBPdXRsaW5lXG5cdHZhciBvdXRsaW5lID0gJyc7XG5cdGlmKHJlc1szXSkge1xuXHRcdG91dGxpbmUgPSBcIiA6OjogXCIgKyByZXNbM107XG5cdH1cblxuXHRyZXR1cm4gcmVzWzFdICsgXCI6XCIgKyBKU09OLnN0cmluZ2lmeShvYikgKyBvdXRsaW5lO1xufVxuXG5mdW5jdGlvbiB1bmVzY2FwZSh0ZXh0KSB7XG5cdHZhciByZXBsYWNlbWVudHMgPSB7XG5cdFx0JyZsdDsnOiAgJzwnLFxuXHRcdCcmZ3Q7JzogICc+Jyxcblx0XHQnJmFtcDsnOiAnJidcblx0fTtcblxuXHRyZXR1cm4gdGV4dC5yZXBsYWNlKC8mKGx0fGd0fGFtcCk7L2csIGZ1bmN0aW9uKHN0ciwgcDEpIHtcblx0XHRyZXR1cm4gcmVwbGFjZW1lbnRzW3N0cl0gfHwgc3RyO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBpbml0aWFsIGNvbnRlbnQsIHNjZW5hcmlvIGFuZCBvdXRsaW5lIGZyb20gZ2l2ZW4gc3RyaW5nXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gcGFyc2VNb3ZpZURlZmluaXRpb24odGV4dCwgb3B0aW9ucz17fSkge1xuXHRvcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyB8fCB7fSk7XG5cdHZhciBwYXJ0cyA9IHRleHQuc3BsaXQob3B0aW9ucy5zZWN0aW9uU2VwYXJhdG9yKTtcblxuXHQvLyBwYXJzZSBzY2VuYXJpb1xuXHR2YXIgcmVEZWYgPSAvXihcXHcrPylcXHMqOlxccyooe1tcXHN8XFxTXSt9KVxccyooPzo6OjpcXHMqKC4rKSk/L21cblx0dmFyIHNjZW5hcmlvID0gW107XG5cdHZhciBvdXRsaW5lID0ge307XG5cdHZhciBlZGl0b3JPcHRpb25zID0ge307XG5cblx0dmFyIHNraXBDb21tZW50ID0gbGluZSA9PiBsaW5lLmNoYXJBdCgwKSAhPT0gJyMnO1xuXG5cdC8vIHJlYWQgbW92aWUgZGVmaW5pdGlvblxuXHRyZWFkTGluZXMocGFydHNbMV0pLmZpbHRlcihza2lwQ29tbWVudCkuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG5cdFx0Ly8gZG8gd2UgaGF2ZSBvdXRsaW5lIGRlZmluaXRpb24gaGVyZT9cblx0XHRsaW5lID0gbGluZS5yZXBsYWNlKG9wdGlvbnMub3V0bGluZVNlcGFyYXRvciwgZnVuY3Rpb24oc3RyLCB0aXRsZSkge1xuXHRcdFx0aWYgKG9wdGlvbnMucHJldHRpZnlLZXlzKSB7XG5cdFx0XHRcdG91dGxpbmVbc2NlbmFyaW8ubGVuZ3RoXSA9IHByZXR0aWZ5S2V5QmluZGluZ3ModGl0bGUudHJpbSgpKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAnJztcblx0XHR9KTtcblxuXHRcdHZhciBzZCA9IGxpbmUubWF0Y2gocmVEZWYpO1xuXHRcdGlmICghc2QpIHtcblx0XHRcdHJldHVybiBzY2VuYXJpby5wdXNoKGxpbmUudHJpbSgpKTtcblx0XHR9XG5cblxuXHRcdGlmIChzZFsyXS5jaGFyQXQoMCkgPT09ICd7Jykge1xuXHRcdFx0dmFyIG9iaiA9IHt9O1xuXHRcdFx0b2JqW3NkWzFdXSA9IHBhcnNlSlNPTih1bmVzY2FwZShzZFsyXSkpO1xuXHRcdFx0cmV0dXJuIHNjZW5hcmlvLnB1c2gob2JqKTtcblx0XHR9XG5cblx0XHRzY2VuYXJpby5wdXNoKHNkWzFdICsgJzonICsgdW5lc2NhcGUoc2RbMl0pKTtcblx0fSk7XG5cblx0Ly8gcmVhZCBlZGl0b3Igb3B0aW9uc1xuXHRpZiAocGFydHNbMl0pIHtcblx0XHRyZWFkTGluZXMocGFydHNbMl0pLmZpbHRlcihza2lwQ29tbWVudCkuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG5cdFx0XHR2YXIgc2QgPSBsaW5lLm1hdGNoKHJlRGVmKTtcblx0XHRcdGlmIChzZCkge1xuXHRcdFx0XHRlZGl0b3JPcHRpb25zW3NkWzFdXSA9IHNkWzJdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHR2YWx1ZTogdW5lc2NhcGUocGFydHNbMF0udHJpbSgpKSxcblx0XHRzY2VuYXJpbzogc2NlbmFyaW8sXG5cdFx0b3V0bGluZTogT2JqZWN0LmtleXMob3V0bGluZSkubGVuZ3RoID8gb3V0bGluZSA6IG51bGwsXG5cdFx0ZWRpdG9yT3B0aW9uczogZWRpdG9yT3B0aW9uc1xuXHR9O1xufVxuXG5mdW5jdGlvbiBzZXR1cENvZGVNaXJyb3IoKSB7XG5cdGlmICh0eXBlb2YgQ29kZU1pcnJvciA9PT0gJ3VuZGVmaW5lZCcgfHwgJ3ByZXZlbnRDdXJzb3JNb3ZlbWVudCcgaW4gQ29kZU1pcnJvci5kZWZhdWx0cykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdENvZGVNaXJyb3IuZGVmaW5lT3B0aW9uKCdwcmV2ZW50Q3Vyc29yTW92ZW1lbnQnLCBmYWxzZSwgY20gPT4ge1xuXHRcdHZhciBoYW5kbGVyID0gKGNtLCBldmVudCkgPT4gY20uZ2V0T3B0aW9uKCdyZWFkT25seScpICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0Y20ub24oJ2tleWRvd24nLCBoYW5kbGVyKTtcblx0XHRjbS5vbignbW91c2Vkb3duJywgaGFuZGxlcik7XG5cdH0pO1xufVxuXG5pZiAodHlwZW9mIENvZGVNaXJyb3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdENvZGVNaXJyb3IubW92aWUgPSBtb3ZpZTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgY29tbW9uQWN0aW9ucyBmcm9tICcuL2FjdGlvbnMnO1xuaW1wb3J0IHthY3Rpb25zIGFzIHByb21wdH0gZnJvbSAnLi93aWRnZXRzL3Byb21wdCc7XG5pbXBvcnQge2FjdGlvbnMgYXMgdG9vbHRpcH0gZnJvbSAnLi93aWRnZXRzL3Rvb2x0aXAnO1xuaW1wb3J0IHtleHRlbmR9IGZyb20gJy4vdXRpbHMnO1xuXG52YXIgYWN0aW9uc0RlZmluaXRpb24gPSBleHRlbmQoe30sIGNvbW1vbkFjdGlvbnMsIHByb21wdCwgdG9vbHRpcCk7XG5cbnZhciBTVEFURV9JRExFICA9ICdpZGxlJztcbnZhciBTVEFURV9QTEFZICA9ICdwbGF5JztcbnZhciBTVEFURV9QQVVTRSA9ICdwYXVzZSc7XG5cbi8vIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHNwbGl0IGV2ZW50IHN0cmluZ3NcbnZhciBldmVudFNwbGl0dGVyID0gL1xccysvO1xuXG5leHBvcnQgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xuXHRiZWZvcmVEZWxheTogMTAwMCxcblx0YWZ0ZXJEZWxheTogMTAwMFxufTtcblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gYWN0aW9ucyBBY3Rpb25zIHNjZW5hcmlvXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBJbml0aWFsIGNvbnRlbnQgKDxjb2RlPlN0cmluZzwvY29kZT4pIG9yIGVkaXRvclxuICogaW5zdGFuY2UgKDxjb2RlPkNvZGVNaXJyb3I8L2NvZGU+KVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY2VuYXJpbyB7XG5cdGNvbnN0cnVjdG9yKGFjdGlvbnMsIGRhdGEpIHtcblx0XHR0aGlzLl9hY3Rpb25zID0gYWN0aW9ucztcblx0XHR0aGlzLl9hY3Rpb25JeCA9IDA7XG5cdFx0dGhpcy5fZWRpdG9yID0gbnVsbDtcblx0XHR0aGlzLl9zdGF0ZSA9IFNUQVRFX0lETEU7XG5cdFx0dGhpcy5fdGltZXJRdWV1ZSA9IFtdO1xuXHRcdFxuXHRcdGlmIChkYXRhICYmICdnZXRWYWx1ZScgaW4gZGF0YSkge1xuXHRcdFx0dGhpcy5fZWRpdG9yID0gZGF0YTtcblx0XHR9XG5cdFx0XG5cdFx0dmFyIGVkID0gdGhpcy5fZWRpdG9yO1xuXHRcdGlmIChlZCAmJiAhZWQuX19pbml0aWFsKSB7XG5cdFx0XHRlZC5fX2luaXRpYWwgPSB7XG5cdFx0XHRcdGNvbnRlbnQ6IGVkLmdldFZhbHVlKCksXG5cdFx0XHRcdHBvczogZWQuZ2V0Q3Vyc29yKHRydWUpXG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXG5cdF9zZXR1cChlZGl0b3IpIHtcblx0XHRpZiAoIWVkaXRvciAmJiB0aGlzLl9lZGl0b3IpIHtcblx0XHRcdGVkaXRvciA9IHRoaXMuX2VkaXRvcjtcblx0XHR9XG5cdFx0XG5cdFx0ZWRpdG9yLmV4ZWNDb21tYW5kKCdyZXZlcnQnKTtcblx0XHRyZXR1cm4gZWRpdG9yO1xuXHR9XG5cdFxuXHQvKipcblx0ICogUGxheSBjdXJyZW50IHNjZW5hcmlvXG5cdCAqIEBwYXJhbSB7Q29kZU1pcnJvcn0gZWRpdG9yIEVkaXRvciBpbnN0YW5jZSB3aGVyZSBvbiB3aGljaCBzY2VuYXJpbyBcblx0ICogc2hvdWxkIGJlIHBsYXllZFxuXHQgKiBAbWVtYmVyT2YgU2NlbmFyaW9cblx0ICovXG5cdHBsYXkoZWRpdG9yKSB7XG5cdFx0aWYgKHRoaXMuX3N0YXRlID09PSBTVEFURV9QTEFZKSB7XG5cdFx0XHQvLyBhbHJlYWR5IHBsYXlpbmdcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0XG5cdFx0aWYgKHRoaXMuX3N0YXRlID09PSBTVEFURV9QQVVTRSkge1xuXHRcdFx0Ly8gcmV2ZXJ0IGZyb20gcGF1c2VkIHN0YXRlXG5cdFx0XHRlZGl0b3IgPSBlZGl0b3IgfHwgdGhpcy5fZWRpdG9yO1xuXHRcdFx0ZWRpdG9yLmZvY3VzKCk7XG5cdFx0XHR2YXIgdGltZXJPYmogPSBudWxsO1xuXHRcdFx0d2hpbGUgKHRpbWVyT2JqID0gdGhpcy5fdGltZXJRdWV1ZS5zaGlmdCgpKSB7XG5cdFx0XHRcdHJlcXVlc3RUaW1lcih0aW1lck9iai5mbiwgdGltZXJPYmouZGVsYXkpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0aGlzLl9zdGF0ZSA9IFNUQVRFX1BMQVk7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ3Jlc3VtZScpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRcblx0XHR0aGlzLl9lZGl0b3IgPSBlZGl0b3IgPSB0aGlzLl9zZXR1cChlZGl0b3IpO1xuXHRcdGVkaXRvci5mb2N1cygpO1xuXHRcdFxuXHRcdHZhciB0aW1lciA9IHRoaXMucmVxdWVzdFRpbWVyLmJpbmQodGhpcyk7XG5cdFx0dmFyIHRoYXQgPSB0aGlzO1xuXHRcdHRoaXMuX2FjdGlvbkl4ID0gMDtcblx0XHR2YXIgbmV4dCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHRoYXQuX2FjdGlvbkl4ID49IHRoYXQuX2FjdGlvbnMubGVuZ3RoKSB7XG5cdFx0XHRcdHJldHVybiB0aW1lcihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR0aGF0LnN0b3AoKTtcblx0XHRcdFx0fSwgZGVmYXVsdE9wdGlvbnMuYWZ0ZXJEZWxheSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoYXQudHJpZ2dlcignYWN0aW9uJywgdGhhdC5fYWN0aW9uSXgpO1xuXHRcdFx0dmFyIGFjdGlvbiA9IHBhcnNlQWN0aW9uQ2FsbCh0aGF0Ll9hY3Rpb25zW3RoYXQuX2FjdGlvbkl4KytdKTtcblx0XHRcdFxuXHRcdFx0aWYgKGFjdGlvbi5uYW1lIGluIGFjdGlvbnNEZWZpbml0aW9uKSB7XG5cdFx0XHRcdGFjdGlvbnNEZWZpbml0aW9uW2FjdGlvbi5uYW1lXS5jYWxsKHRoYXQsIGFjdGlvbi5vcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignTm8gc3VjaCBhY3Rpb246ICcgKyBhY3Rpb24ubmFtZSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHR0aGlzLl9zdGF0ZSA9IFNUQVRFX1BMQVk7XG5cdFx0dGhpcy5fZWRpdG9yLnNldE9wdGlvbigncmVhZE9ubHknLCB0cnVlKTtcblx0XHR0aGlzLnRyaWdnZXIoJ3BsYXknKTtcblx0XHR0aW1lcihuZXh0LCBkZWZhdWx0T3B0aW9ucy5iZWZvcmVEZWxheSk7XG5cdH1cblx0XG5cdC8qKlxuXHQgKiBQYXVzZSBjdXJyZW50IHNjZW5hcmlvIHBsYXliYWNrLiBJdCBjYW4gYmUgcmVzdG9yZWQgd2l0aCBcblx0ICogPGNvZGU+cGxheSgpPC9jb2RlPiBtZXRob2QgY2FsbCBcblx0ICovXG5cdHBhdXNlKCkge1xuXHRcdHRoaXMuX3N0YXRlID0gU1RBVEVfUEFVU0U7XG5cdFx0dGhpcy50cmlnZ2VyKCdwYXVzZScpO1xuXHR9XG5cdFxuXHQvKipcblx0ICogU3RvcHMgcGxheWJhY2sgb2YgY3VycmVudCBzY2VuYXJpb1xuXHQgKi9cblx0c3RvcCgpIHtcblx0XHRpZiAodGhpcy5fc3RhdGUgIT09IFNUQVRFX0lETEUpIHtcblx0XHRcdHRoaXMuX3N0YXRlID0gU1RBVEVfSURMRTtcblx0XHRcdHRoaXMuX3RpbWVyUXVldWUubGVuZ3RoID0gMDtcblx0XHRcdHRoaXMuX2VkaXRvci5zZXRPcHRpb24oJ3JlYWRPbmx5JywgZmFsc2UpO1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdzdG9wJyk7XG5cdFx0fVxuXHR9XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyBjdXJyZW50IHBsYXliYWNrIHN0YXRlXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldCBzdGF0ZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fc3RhdGU7XG5cdH1cblx0XG5cdC8qKlxuXHQgKiBUb2dnbGUgcGxheWJhY2sgb2YgbW92aWUgc2NlbmFyaW9cblx0ICovXG5cdHRvZ2dsZSgpIHtcblx0XHRpZiAodGhpcy5fc3RhdGUgPT09IFNUQVRFX1BMQVkpIHtcblx0XHRcdHRoaXMucGF1c2UoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wbGF5KCk7XG5cdFx0fVxuXHR9XG5cdFxuXHRyZXF1ZXN0VGltZXIoZm4sIGRlbGF5KSB7XG5cdFx0aWYgKHRoaXMuX3N0YXRlICE9PSBTVEFURV9QTEFZKSB7XG5cdFx0XHQvLyBzYXZlIGZ1bmN0aW9uIGNhbGwgaW50byBhIHF1ZXVlIHRpbGwgbmV4dCAncGxheSgpJyBjYWxsXG5cdFx0XHR0aGlzLl90aW1lclF1ZXVlLnB1c2goe1xuXHRcdFx0XHRmbjogZm4sXG5cdFx0XHRcdGRlbGF5OiBkZWxheVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiByZXF1ZXN0VGltZXIoZm4sIGRlbGF5KTtcblx0XHR9XG5cdH1cblx0XG5cdC8vIGJvcnJvd2VkIGZyb20gQmFja2JvbmVcblx0LyoqXG5cdCAqIEJpbmQgb25lIG9yIG1vcmUgc3BhY2Ugc2VwYXJhdGVkIGV2ZW50cywgYGV2ZW50c2AsIHRvIGEgYGNhbGxiYWNrYFxuXHQgKiBmdW5jdGlvbi4gUGFzc2luZyBgXCJhbGxcImAgd2lsbCBiaW5kIHRoZSBjYWxsYmFjayB0byBhbGwgZXZlbnRzIGZpcmVkLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG5cdCAqIEBtZW1iZXJPZiBldmVudERpc3BhdGNoZXJcblx0ICovXG5cdG9uKGV2ZW50cywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgY2FsbHMsIGV2ZW50LCBub2RlLCB0YWlsLCBsaXN0O1xuXHRcdGlmICghY2FsbGJhY2spIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRcblx0XHRldmVudHMgPSBldmVudHMuc3BsaXQoZXZlbnRTcGxpdHRlcik7XG5cdFx0Y2FsbHMgPSB0aGlzLl9jYWxsYmFja3MgfHwgKHRoaXMuX2NhbGxiYWNrcyA9IHt9KTtcblxuXHRcdC8vIENyZWF0ZSBhbiBpbW11dGFibGUgY2FsbGJhY2sgbGlzdCwgYWxsb3dpbmcgdHJhdmVyc2FsIGR1cmluZ1xuXHRcdC8vIG1vZGlmaWNhdGlvbi4gIFRoZSB0YWlsIGlzIGFuIGVtcHR5IG9iamVjdCB0aGF0IHdpbGwgYWx3YXlzIGJlIHVzZWRcblx0XHQvLyBhcyB0aGUgbmV4dCBub2RlLlxuXHRcdHdoaWxlIChldmVudCA9IGV2ZW50cy5zaGlmdCgpKSB7XG5cdFx0XHRsaXN0ID0gY2FsbHNbZXZlbnRdO1xuXHRcdFx0bm9kZSA9IGxpc3QgPyBsaXN0LnRhaWwgOiB7fTtcblx0XHRcdG5vZGUubmV4dCA9IHRhaWwgPSB7fTtcblx0XHRcdG5vZGUuY29udGV4dCA9IGNvbnRleHQ7XG5cdFx0XHRub2RlLmNhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0XHRjYWxsc1tldmVudF0gPSB7XG5cdFx0XHRcdHRhaWwgOiB0YWlsLFxuXHRcdFx0XHRuZXh0IDogbGlzdCA/IGxpc3QubmV4dCA6IG5vZGVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogUmVtb3ZlIG9uZSBvciBtYW55IGNhbGxiYWNrcy4gSWYgYGNvbnRleHRgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG5cdCAqIGNhbGxiYWNrcyB3aXRoIHRoYXQgZnVuY3Rpb24uIElmIGBjYWxsYmFja2AgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcblx0ICogY2FsbGJhY2tzIGZvciB0aGUgZXZlbnQuIElmIGBldmVudHNgIGlzIG51bGwsIHJlbW92ZXMgYWxsIGJvdW5kXG5cdCAqIGNhbGxiYWNrcyBmb3IgYWxsIGV2ZW50cy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50c1xuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuXHQgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuXHQgKi9cblx0b2ZmKGV2ZW50cywgY2FsbGJhY2ssIGNvbnRleHQpIHtcblx0XHR2YXIgZXZlbnQsIGNhbGxzLCBub2RlLCB0YWlsLCBjYiwgY3R4O1xuXG5cdFx0Ly8gTm8gZXZlbnRzLCBvciByZW1vdmluZyAqYWxsKiBldmVudHMuXG5cdFx0aWYgKCEoY2FsbHMgPSB0aGlzLl9jYWxsYmFja3MpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdFxuXHRcdGlmICghKGV2ZW50cyB8fCBjYWxsYmFjayB8fCBjb250ZXh0KSkge1xuXHRcdFx0ZGVsZXRlIHRoaXMuX2NhbGxiYWNrcztcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdC8vIExvb3AgdGhyb3VnaCB0aGUgbGlzdGVkIGV2ZW50cyBhbmQgY29udGV4dHMsIHNwbGljaW5nIHRoZW0gb3V0IG9mIHRoZVxuXHRcdC8vIGxpbmtlZCBsaXN0IG9mIGNhbGxiYWNrcyBpZiBhcHByb3ByaWF0ZS5cblx0XHRldmVudHMgPSBldmVudHMgPyBldmVudHMuc3BsaXQoZXZlbnRTcGxpdHRlcikgOiBPYmplY3Qua2V5cyhjYWxscyk7XG5cdFx0d2hpbGUgKGV2ZW50ID0gZXZlbnRzLnNoaWZ0KCkpIHtcblx0XHRcdG5vZGUgPSBjYWxsc1tldmVudF07XG5cdFx0XHRkZWxldGUgY2FsbHNbZXZlbnRdO1xuXHRcdFx0aWYgKCFub2RlIHx8ICEoY2FsbGJhY2sgfHwgY29udGV4dCkpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIENyZWF0ZSBhIG5ldyBsaXN0LCBvbWl0dGluZyB0aGUgaW5kaWNhdGVkIGNhbGxiYWNrcy5cblx0XHRcdHRhaWwgPSBub2RlLnRhaWw7XG5cdFx0XHR3aGlsZSAoKG5vZGUgPSBub2RlLm5leHQpICE9PSB0YWlsKSB7XG5cdFx0XHRcdGNiID0gbm9kZS5jYWxsYmFjaztcblx0XHRcdFx0Y3R4ID0gbm9kZS5jb250ZXh0O1xuXHRcdFx0XHRpZiAoKGNhbGxiYWNrICYmIGNiICE9PSBjYWxsYmFjaykgfHwgKGNvbnRleHQgJiYgY3R4ICE9PSBjb250ZXh0KSkge1xuXHRcdFx0XHRcdHRoaXMub24oZXZlbnQsIGNiLCBjdHgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblx0XG5cdC8qKlxuXHQgKiBUcmlnZ2VyIG9uZSBvciBtYW55IGV2ZW50cywgZmlyaW5nIGFsbCBib3VuZCBjYWxsYmFja3MuIENhbGxiYWNrcyBhcmVcblx0ICogcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcblx0ICogKHVubGVzcyB5b3UncmUgbGlzdGVuaW5nIG9uIGBcImFsbFwiYCwgd2hpY2ggd2lsbCBjYXVzZSB5b3VyIGNhbGxiYWNrXG5cdCAqIHRvIHJlY2VpdmUgdGhlIHRydWUgbmFtZSBvZiB0aGUgZXZlbnQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50KS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50c1xuXHQgKi9cblx0dHJpZ2dlcihldmVudHMsIC4uLnJlc3QpIHtcblx0XHR2YXIgZXZlbnQsIG5vZGUsIGNhbGxzLCB0YWlsLCBhcmdzLCBhbGw7XG5cdFx0aWYgKCEoY2FsbHMgPSB0aGlzLl9jYWxsYmFja3MpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0XG5cdFx0YWxsID0gY2FsbHMuYWxsO1xuXHRcdGV2ZW50cyA9IGV2ZW50cy5zcGxpdChldmVudFNwbGl0dGVyKTtcblxuXHRcdC8vIEZvciBlYWNoIGV2ZW50LCB3YWxrIHRocm91Z2ggdGhlIGxpbmtlZCBsaXN0IG9mIGNhbGxiYWNrcyB0d2ljZSxcblx0XHQvLyBmaXJzdCB0byB0cmlnZ2VyIHRoZSBldmVudCwgdGhlbiB0byB0cmlnZ2VyIGFueSBgXCJhbGxcImAgY2FsbGJhY2tzLlxuXHRcdHdoaWxlIChldmVudCA9IGV2ZW50cy5zaGlmdCgpKSB7XG5cdFx0XHRpZiAobm9kZSA9IGNhbGxzW2V2ZW50XSkge1xuXHRcdFx0XHR0YWlsID0gbm9kZS50YWlsO1xuXHRcdFx0XHR3aGlsZSAoKG5vZGUgPSBub2RlLm5leHQpICE9PSB0YWlsKSB7XG5cdFx0XHRcdFx0bm9kZS5jYWxsYmFjay5hcHBseShub2RlLmNvbnRleHQgfHwgdGhpcywgcmVzdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChub2RlID0gYWxsKSB7XG5cdFx0XHRcdHRhaWwgPSBub2RlLnRhaWw7XG5cdFx0XHRcdGFyZ3MgPSBbIGV2ZW50IF0uY29uY2F0KHJlc3QpO1xuXHRcdFx0XHR3aGlsZSAoKG5vZGUgPSBub2RlLm5leHQpICE9PSB0YWlsKSB7XG5cdFx0XHRcdFx0bm9kZS5jYWxsYmFjay5hcHBseShub2RlLmNvbnRleHQgfHwgdGhpcywgYXJncyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxufTtcblxuLyoqXG4gKiBQYXJzZXMgYWN0aW9uIGNhbGwgZnJvbSBzdHJpbmdcbiAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBwYXJzZUFjdGlvbkNhbGwoZGF0YSkge1xuXHRpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG5cdFx0dmFyIHBhcnRzID0gZGF0YS5zcGxpdCgnOicpO1xuXHRcdHJldHVybiB7XG5cdFx0XHRuYW1lOiBwYXJ0cy5zaGlmdCgpLFxuXHRcdFx0b3B0aW9uczogcGFydHMuam9pbignOicpXG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHR2YXIgbmFtZSA9IE9iamVjdC5rZXlzKGRhdGEpWzBdO1xuXHRcdHJldHVybiB7XG5cdFx0XHRuYW1lOiBuYW1lLFxuXHRcdFx0b3B0aW9uczogZGF0YVtuYW1lXVxuXHRcdH07XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVxdWVzdFRpbWVyKGZuLCBkZWxheSkge1xuXHRpZiAoIWRlbGF5KSB7XG5cdFx0Zm4oKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gc2V0VGltZW91dChmbiwgZGVsYXkpO1xuXHR9XG59IiwidmFyIHByb3BDYWNoZSA9IHt9O1xuXG4vLyBkZXRlY3QgQ1NTIDNEIFRyYW5zZm9ybXMgZm9yIHNtb290aGVyIGFuaW1hdGlvbnMgXG5leHBvcnQgdmFyIGhhczNkID0gKGZ1bmN0aW9uKCkge1xuXHR2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0dmFyIGNzc1RyYW5zZm9ybSA9IHByZWZpeGVkKCd0cmFuc2Zvcm0nKTtcblx0aWYgKGNzc1RyYW5zZm9ybSkge1xuXHRcdGVsLnN0eWxlW2Nzc1RyYW5zZm9ybV0gPSAndHJhbnNsYXRlWigwKSc7XG5cdFx0cmV0dXJuICgvdHJhbnNsYXRlei9pKS50ZXN0KGVsLnN0eWxlW2Nzc1RyYW5zZm9ybV0pOyBcblx0fVxuXHRcblx0cmV0dXJuIGZhbHNlO1xufSkoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZChvYmosIC4uLmFyZ3MpIHtcblx0YXJncy5mb3JFYWNoKGEgPT4ge1xuXHRcdGlmICh0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdE9iamVjdC5rZXlzKGEpLmZvckVhY2goa2V5ID0+IG9ialtrZXldID0gYVtrZXldKTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gb2JqO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9BcnJheShvYmosIGl4PTApIHtcblx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iaiwgaXgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgcHJlZml4ZWQgKGlmIHJlcXVpcmVkKSBDU1MgcHJvcGVydHkgbmFtZVxuICogQHBhcmFtICB7U3RyaW5nfSBwcm9wXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVmaXhlZChwcm9wKSB7XG5cdGlmIChwcm9wIGluIHByb3BDYWNoZSkge1xuXHRcdHJldHVybiBwcm9wQ2FjaGVbcHJvcF07XG5cdH1cblxuXHR2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0dmFyIHN0eWxlID0gZWwuc3R5bGU7XG5cblx0dmFyIHByZWZpeGVzID0gWydvJywgJ21zJywgJ21veicsICd3ZWJraXQnXTtcblx0dmFyIHByb3BzID0gW3Byb3BdO1xuXHR2YXIgY2FwaXRhbGl6ZSA9IGZ1bmN0aW9uKHN0cikge1xuXHRcdHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc3Vic3RyKDEpO1xuXHR9O1xuXG5cdHByb3AgPSBwcm9wLnJlcGxhY2UoL1xcLShbYS16XSkvZywgZnVuY3Rpb24oc3RyLCBjaCkge1xuXHRcdHJldHVybiBjaC50b1VwcGVyQ2FzZSgpO1xuXHR9KTtcblxuXHR2YXIgY2FwUHJvcCA9IGNhcGl0YWxpemUocHJvcCk7XG5cdHByZWZpeGVzLmZvckVhY2goZnVuY3Rpb24ocHJlZml4KSB7XG5cdFx0cHJvcHMucHVzaChwcmVmaXggKyBjYXBQcm9wLCBjYXBpdGFsaXplKHByZWZpeCkgKyBjYXBQcm9wKTtcblx0fSk7XG5cblx0Zm9yICh2YXIgaSA9IDAsIGlsID0gcHJvcHMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuXHRcdGlmIChwcm9wc1tpXSBpbiBzdHlsZSkge1xuXHRcdFx0cmV0dXJuIHByb3BDYWNoZVtwcm9wXSA9IHByb3BzW2ldO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBwcm9wQ2FjaGVbcHJvcF0gPSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9zT2JqKG9iaikge1xuXHRyZXR1cm4ge1xuXHRcdGxpbmU6IG9iai5saW5lLFxuXHRcdGNoOiBvYmouY2hcblx0fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnNvcihlZGl0b3IsIHN0YXJ0PSdmcm9tJykge1xuXHRyZXR1cm4gcG9zT2JqKGVkaXRvci5nZXRDdXJzb3Ioc3RhcnQpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdGhhdCBwcm9kdWNlcyA8Y29kZT57bGluZSwgY2h9PC9jb2RlPiBvYmplY3QgZnJvbVxuICogcGFzc2VkIGFyZ3VtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gcG9zXG4gKiBAcGFyYW0ge0NvZGVNaXJyb3J9IGVkaXRvclxuICogQHJldHVybnMge09iamVjdH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQb3MocG9zLCBlZGl0b3IpIHtcblx0aWYgKHBvcyA9PT0gJ2NhcmV0Jykge1xuXHRcdHJldHVybiBnZXRDdXJzb3IoZWRpdG9yKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgcG9zID09PSAnc3RyaW5nJykge1xuXHRcdGlmICh+cG9zLmluZGV4T2YoJzonKSkge1xuXHRcdFx0bGV0IHBhcnRzID0gcG9zLnNwbGl0KCc6Jyk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRsaW5lOiArcGFydHNbMF0sXG5cdFx0XHRcdGNoOiArcGFydHNbMV1cblx0XHRcdH07XG5cdFx0fVxuXHRcdFxuXHRcdHBvcyA9ICtwb3M7XG5cdH1cblx0XG5cdGlmICh0eXBlb2YgcG9zID09PSAnbnVtYmVyJykge1xuXHRcdHJldHVybiBwb3NPYmooZWRpdG9yLnBvc0Zyb21JbmRleChwb3MpKTtcblx0fVxuXHRcblx0cmV0dXJuIHBvc09iaihwb3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVtcGxhdGUodG1wbCwgZGF0YSkge1xuXHR2YXIgZm4gPSBkYXRhID0+IHRtcGwucmVwbGFjZSgvPCUoWy09XSk/XFxzKihbXFx3XFwtXSspXFxzKiU+L2csIChzdHIsIG9wLCBrZXkpID0+IGRhdGFba2V5LnRyaW0oKV0pO1xuXHRyZXR1cm4gZGF0YSA/IGZuKGRhdGEpIDogZm47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kKGFyciwgaXRlcikge1xuXHR2YXIgZm91bmQ7XG5cdGFyci5zb21lKChpdGVtLCBpLCBhcnIpID0+IHtcblx0XHRpZiAoaXRlcihpdGVtLCBpLCBhcnIpKSB7XG5cdFx0XHRyZXR1cm4gZm91bmQgPSBpdGVtO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBmb3VuZDtcbn1cblxuLyoqXG4gKiBSZWxheGVkIEpTT04gcGFyc2VyLlxuICogQHBhcmFtIHtTdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtPYmplY3R9IFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VKU09OKHRleHQpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gKG5ldyBGdW5jdGlvbigncmV0dXJuICcgKyB0ZXh0KSkoKTtcblx0fSBjYXRjaChlKSB7XG5cdFx0cmV0dXJuIHt9O1xuXHR9XG59IiwidmFyIGdsb2JhbCA9IHdpbmRvdztcbnZhciB0aW1lID0gRGF0ZS5ub3cgXG5cdD8gZnVuY3Rpb24oKSB7cmV0dXJuIERhdGUubm93KCk7fVxuXHQ6IGZ1bmN0aW9uKCkge3JldHVybiArbmV3IERhdGU7fTtcblxudmFyIGluZGV4T2YgPSAnaW5kZXhPZicgaW4gQXJyYXkucHJvdG90eXBlXG5cdD8gZnVuY3Rpb24oYXJyYXksIHZhbHVlKSB7cmV0dXJuIGFycmF5LmluZGV4T2YodmFsdWUpO31cblx0OiBmdW5jdGlvbihhcnJheSwgdmFsdWUpIHtcblx0XHRmb3IgKHZhciBpID0gMCwgaWwgPSBhcnJheS5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG5cdFx0XHRpZiAoYXJyYXlbaV0gPT09IHZhbHVlKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiAtMTtcblx0fTtcblxuZnVuY3Rpb24gZXh0ZW5kKG9iaikge1xuXHRmb3IgKHZhciBpID0gMSwgaWwgPSBhcmd1bWVudHMubGVuZ3RoLCBzb3VyY2U7IGkgPCBpbDsgaSsrKSB7XG5cdFx0c291cmNlID0gYXJndW1lbnRzW2ldO1xuXHRcdGlmIChzb3VyY2UpIHtcblx0XHRcdGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG5cdFx0XHRcdG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIHJlcXVlc3RBbmltYXRpb25GcmFtZSBwb2x5ZmlsbCBieSBFcmlrIE3DtmxsZXJcbiAqIGZpeGVzIGZyb20gUGF1bCBJcmlzaCBhbmQgVGlubyBaaWpkZWxcbiAqIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gKiBodHRwOi8vbXkub3BlcmEuY29tL2Vtb2xsZXIvYmxvZy8yMDExLzEyLzIwL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtZXItYW5pbWF0aW5nXG4gKi9cbihmdW5jdGlvbigpIHtcblx0dmFyIGxhc3RUaW1lID0gMDtcblx0dmFyIHZlbmRvcnMgPSBbICdtcycsICdtb3onLCAnd2Via2l0JywgJ28nIF07XG5cdGZvciAodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIWdsb2JhbC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xuXHRcdGdsb2JhbC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBnbG9iYWxbdmVuZG9yc1t4XSArICdSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcblx0XHRnbG9iYWwuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBnbG9iYWxbdmVuZG9yc1t4XSArICdDYW5jZWxBbmltYXRpb25GcmFtZSddXG5cdFx0XHRcdHx8IGdsb2JhbFt2ZW5kb3JzW3hdICsgJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuXHR9XG5cdFxuXHRpZiAoIWdsb2JhbC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpXG5cdFx0Z2xvYmFsLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XG5cdFx0XHR2YXIgY3VyclRpbWUgPSB0aW1lKCk7XG5cdFx0XHR2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcblx0XHRcdHZhciBpZCA9IGdsb2JhbC5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpO1xuXHRcdFx0fSwgdGltZVRvQ2FsbCk7XG5cdFx0XHRsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcblx0XHRcdHJldHVybiBpZDtcblx0XHR9O1xuXG5cdGlmICghZ2xvYmFsLmNhbmNlbEFuaW1hdGlvbkZyYW1lKVxuXHRcdGdsb2JhbC5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQoaWQpO1xuXHRcdH07XG59KCkpO1xuXG5cbnZhciBkdW1teUZuID0gZnVuY3Rpb24oKSB7fTtcbnZhciBhbmltcyA9IFtdO1xudmFyIGlkQ291bnRlciA9IDA7XG5cbnZhciBkZWZhdWx0cyA9IHtcblx0ZHVyYXRpb246IDUwMCwgLy8gbXNcblx0ZGVsYXk6IDAsXG5cdGVhc2luZzogJ2xpbmVhcicsXG5cdHN0YXJ0OiBkdW1teUZuLFxuXHRzdGVwOiBkdW1teUZuLFxuXHRjb21wbGV0ZTogZHVtbXlGbixcblx0YXV0b3N0YXJ0OiB0cnVlLFxuXHRyZXZlcnNlOiBmYWxzZVxufTtcblxuZXhwb3J0IHZhciBlYXNpbmdzID0ge1xuXHRsaW5lYXI6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRyZXR1cm4gYyAqIHQgLyBkICsgYjtcblx0fSxcblx0aW5RdWFkOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0cmV0dXJuIGMqKHQvPWQpKnQgKyBiO1xuXHR9LFxuXHRvdXRRdWFkOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0cmV0dXJuIC1jICoodC89ZCkqKHQtMikgKyBiO1xuXHR9LFxuXHRpbk91dFF1YWQ6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRpZigodC89ZC8yKSA8IDEpIHJldHVybiBjLzIqdCp0ICsgYjtcblx0XHRyZXR1cm4gLWMvMiAqKCgtLXQpKih0LTIpIC0gMSkgKyBiO1xuXHR9LFxuXHRpbkN1YmljOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0cmV0dXJuIGMqKHQvPWQpKnQqdCArIGI7XG5cdH0sXG5cdG91dEN1YmljOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0cmV0dXJuIGMqKCh0PXQvZC0xKSp0KnQgKyAxKSArIGI7XG5cdH0sXG5cdGluT3V0Q3ViaWM6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRpZigodC89ZC8yKSA8IDEpIHJldHVybiBjLzIqdCp0KnQgKyBiO1xuXHRcdHJldHVybiBjLzIqKCh0LT0yKSp0KnQgKyAyKSArIGI7XG5cdH0sXG5cdGluRXhwbzogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdHJldHVybih0PT0wKSA/IGIgOiBjICogTWF0aC5wb3coMiwgMTAgKih0L2QgLSAxKSkgKyBiIC0gYyAqIDAuMDAxO1xuXHR9LFxuXHRvdXRFeHBvOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0cmV0dXJuKHQ9PWQpID8gYitjIDogYyAqIDEuMDAxICooLU1hdGgucG93KDIsIC0xMCAqIHQvZCkgKyAxKSArIGI7XG5cdH0sXG5cdGluT3V0RXhwbzogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdGlmKHQ9PTApIHJldHVybiBiO1xuXHRcdGlmKHQ9PWQpIHJldHVybiBiK2M7XG5cdFx0aWYoKHQvPWQvMikgPCAxKSByZXR1cm4gYy8yICogTWF0aC5wb3coMiwgMTAgKih0IC0gMSkpICsgYiAtIGMgKiAwLjAwMDU7XG5cdFx0cmV0dXJuIGMvMiAqIDEuMDAwNSAqKC1NYXRoLnBvdygyLCAtMTAgKiAtLXQpICsgMikgKyBiO1xuXHR9LFxuXHRpbkVsYXN0aWM6IGZ1bmN0aW9uKHQsIGIsIGMsIGQsIGEsIHApIHtcblx0XHR2YXIgcztcblx0XHRpZih0PT0wKSByZXR1cm4gYjsgIGlmKCh0Lz1kKT09MSkgcmV0dXJuIGIrYzsgIGlmKCFwKSBwPWQqLjM7XG5cdFx0aWYoIWEgfHwgYSA8IE1hdGguYWJzKGMpKSB7IGE9Yzsgcz1wLzQ7IH0gZWxzZSBzID0gcC8oMipNYXRoLlBJKSAqIE1hdGguYXNpbihjL2EpO1xuXHRcdHJldHVybiAtKGEqTWF0aC5wb3coMiwxMCoodC09MSkpICogTWF0aC5zaW4oKHQqZC1zKSooMipNYXRoLlBJKS9wICkpICsgYjtcblx0fSxcblx0b3V0RWxhc3RpYzogZnVuY3Rpb24odCwgYiwgYywgZCwgYSwgcCkge1xuXHRcdHZhciBzO1xuXHRcdGlmKHQ9PTApIHJldHVybiBiOyAgaWYoKHQvPWQpPT0xKSByZXR1cm4gYitjOyAgaWYoIXApIHA9ZCouMztcblx0XHRpZighYSB8fCBhIDwgTWF0aC5hYnMoYykpIHsgYT1jOyBzPXAvNDsgfSBlbHNlIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKGMvYSk7XG5cdFx0cmV0dXJuKGEqTWF0aC5wb3coMiwtMTAqdCkgKiBNYXRoLnNpbigodCpkLXMpKigyKk1hdGguUEkpL3AgKSArIGMgKyBiKTtcblx0fSxcblx0aW5PdXRFbGFzdGljOiBmdW5jdGlvbih0LCBiLCBjLCBkLCBhLCBwKSB7XG5cdFx0dmFyIHM7XG5cdFx0aWYodD09MCkgcmV0dXJuIGI7IFxuXHRcdGlmKCh0Lz1kLzIpPT0yKSByZXR1cm4gYitjO1xuXHRcdGlmKCFwKSBwPWQqKC4zKjEuNSk7XG5cdFx0aWYoIWEgfHwgYSA8IE1hdGguYWJzKGMpKSB7IGE9Yzsgcz1wLzQ7IH0gICAgICAgZWxzZSBzID0gcC8oMipNYXRoLlBJKSAqIE1hdGguYXNpbihjL2EpO1xuXHRcdGlmKHQgPCAxKSByZXR1cm4gLS41KihhKk1hdGgucG93KDIsMTAqKHQtPTEpKSAqIE1hdGguc2luKCh0KmQtcykqKDIqTWF0aC5QSSkvcCApKSArIGI7XG5cdFx0cmV0dXJuIGEqTWF0aC5wb3coMiwtMTAqKHQtPTEpKSAqIE1hdGguc2luKCh0KmQtcykqKDIqTWF0aC5QSSkvcCApKi41ICsgYyArIGI7XG5cdH0sXG5cdGluQmFjazogZnVuY3Rpb24odCwgYiwgYywgZCwgcykge1xuXHRcdGlmKHMgPT0gdW5kZWZpbmVkKSBzID0gMS43MDE1ODtcblx0XHRyZXR1cm4gYyoodC89ZCkqdCooKHMrMSkqdCAtIHMpICsgYjtcblx0fSxcblx0b3V0QmFjazogZnVuY3Rpb24odCwgYiwgYywgZCwgcykge1xuXHRcdGlmKHMgPT0gdW5kZWZpbmVkKSBzID0gMS43MDE1ODtcblx0XHRyZXR1cm4gYyooKHQ9dC9kLTEpKnQqKChzKzEpKnQgKyBzKSArIDEpICsgYjtcblx0fSxcblx0aW5PdXRCYWNrOiBmdW5jdGlvbih0LCBiLCBjLCBkLCBzKSB7XG5cdFx0aWYocyA9PSB1bmRlZmluZWQpIHMgPSAxLjcwMTU4O1xuXHRcdGlmKCh0Lz1kLzIpIDwgMSkgcmV0dXJuIGMvMioodCp0KigoKHMqPSgxLjUyNSkpKzEpKnQgLSBzKSkgKyBiO1xuXHRcdHJldHVybiBjLzIqKCh0LT0yKSp0KigoKHMqPSgxLjUyNSkpKzEpKnQgKyBzKSArIDIpICsgYjtcblx0fSxcblx0aW5Cb3VuY2U6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRyZXR1cm4gYyAtIHRoaXMub3V0Qm91bmNlKHQsIGQtdCwgMCwgYywgZCkgKyBiO1xuXHR9LFxuXHRvdXRCb3VuY2U6IGZ1bmN0aW9uKHQsIGIsIGMsIGQpIHtcblx0XHRpZigodC89ZCkgPCgxLzIuNzUpKSB7XG5cdFx0XHRyZXR1cm4gYyooNy41NjI1KnQqdCkgKyBiO1xuXHRcdH0gZWxzZSBpZih0IDwoMi8yLjc1KSkge1xuXHRcdFx0cmV0dXJuIGMqKDcuNTYyNSoodC09KDEuNS8yLjc1KSkqdCArIC43NSkgKyBiO1xuXHRcdH0gZWxzZSBpZih0IDwoMi41LzIuNzUpKSB7XG5cdFx0XHRyZXR1cm4gYyooNy41NjI1Kih0LT0oMi4yNS8yLjc1KSkqdCArIC45Mzc1KSArIGI7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBjKig3LjU2MjUqKHQtPSgyLjYyNS8yLjc1KSkqdCArIC45ODQzNzUpICsgYjtcblx0XHR9XG5cdH0sXG5cdGluT3V0Qm91bmNlOiBmdW5jdGlvbih0LCBiLCBjLCBkKSB7XG5cdFx0aWYodCA8IGQvMikgcmV0dXJuIHRoaXMuaW5Cb3VuY2UodCoyLCAwLCBjLCBkKSAqIC41ICsgYjtcblx0XHRyZXR1cm4gdGhpcy5vdXRCb3VuY2UodCoyLWQsIDAsIGMsIGQpICogLjUgKyBjKi41ICsgYjtcblx0fSxcblx0b3V0SGFyZDogZnVuY3Rpb24odCwgYiwgYywgZCkge1xuXHRcdHZhciB0cyA9ICh0Lz1kKSp0O1xuXHRcdHZhciB0YyA9IHRzKnQ7XG5cdFx0cmV0dXJuIGIgKyBjKigxLjc1KnRjKnRzICsgLTcuNDQ3NSp0cyp0cyArIDEyLjk5NSp0YyArIC0xMS41OTUqdHMgKyA1LjI5NzUqdCk7XG5cdH1cbn07XG5cbmZ1bmN0aW9uIG1haW5Mb29wKCkge1xuXHRpZiAoIWFuaW1zLmxlbmd0aCkge1xuXHRcdC8vIG5vIGFuaW1hdGlvbnMgbGVmdCwgc3RvcCBwb2xsaW5nXG5cdFx0cmV0dXJuO1xuXHR9XG5cdFxuXHR2YXIgbm93ID0gdGltZSgpO1xuXHR2YXIgZmlsdGVyZWQgPSBbXSwgdHdlZW4sIG9wdDtcblxuXHQvLyBkbyBub3QgdXNlIEFycmF5LmZpbHRlcigpIG9mIF8uZmlsdGVyKCkgZnVuY3Rpb25cblx0Ly8gc2luY2UgdHdlZW7igJlzIGNhbGxiYWNrcyBjYW4gYWRkIG5ldyBhbmltYXRpb25zXG5cdC8vIGluIHJ1bnRpbWUuIEluIHRoaXMgY2FzZSwgZmlsdGVyIGZ1bmN0aW9uIHdpbGwgbG9vc2Vcblx0Ly8gbmV3bHkgY3JlYXRlZCBhbmltYXRpb25cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhbmltcy5sZW5ndGg7IGkrKykge1xuXHRcdHR3ZWVuID0gYW5pbXNbaV07XG5cblx0XHRpZiAoIXR3ZWVuLmFuaW1hdGluZykge1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0b3B0ID0gdHdlZW4ub3B0aW9ucztcblxuXHRcdGlmICh0d2Vlbi5zdGFydFRpbWUgPiBub3cpIHtcblx0XHRcdGZpbHRlcmVkLnB1c2godHdlZW4pO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0aWYgKHR3ZWVuLmluZmluaXRlKSB7XG5cdFx0XHQvLyBvcHQuc3RlcC5jYWxsKHR3ZWVuLCAwKTtcblx0XHRcdG9wdC5zdGVwKDAsIHR3ZWVuKTtcblx0XHRcdGZpbHRlcmVkLnB1c2godHdlZW4pO1xuXHRcdH0gZWxzZSBpZiAodHdlZW4ucG9zID09PSAxIHx8IHR3ZWVuLmVuZFRpbWUgPD0gbm93KSB7XG5cdFx0XHR0d2Vlbi5wb3MgPSAxO1xuXHRcdFx0Ly8gb3B0LnN0ZXAuY2FsbCh0d2Vlbiwgb3B0LnJldmVyc2UgPyAwIDogMSk7XG5cdFx0XHRvcHQuc3RlcChvcHQucmV2ZXJzZSA/IDAgOiAxLCB0d2Vlbik7XG5cdFx0XHR0d2Vlbi5zdG9wKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHR3ZWVuLnBvcyA9IG9wdC5lYXNpbmcobm93IC0gdHdlZW4uc3RhcnRUaW1lLCAwLCAxLCBvcHQuZHVyYXRpb24pO1xuXHRcdFx0Ly8gb3B0LnN0ZXAuY2FsbCh0d2Vlbiwgb3B0LnJldmVyc2UgPyAxIC0gdHdlZW4ucG9zIDogdHdlZW4ucG9zKTtcblx0XHRcdG9wdC5zdGVwKG9wdC5yZXZlcnNlID8gMSAtIHR3ZWVuLnBvcyA6IHR3ZWVuLnBvcywgdHdlZW4pO1xuXHRcdFx0ZmlsdGVyZWQucHVzaCh0d2Vlbik7XG5cdFx0fVx0XHRcdFxuXHR9XG5cblx0YW5pbXMgPSBmaWx0ZXJlZDtcblxuXHRpZiAoYW5pbXMubGVuZ3RoKSB7XG5cdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1haW5Mb29wKTtcblx0fVxufVxuXG5mdW5jdGlvbiBhZGRUb1F1ZXVlKHR3ZWVuKSB7XG5cdGlmIChpbmRleE9mKGFuaW1zLCB0d2VlbikgPT0gLTEpIHtcblx0XHRhbmltcy5wdXNoKHR3ZWVuKTtcblx0XHRpZiAoYW5pbXMubGVuZ3RoID09IDEpIHtcblx0XHRcdG1haW5Mb29wKCk7XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBUd2VlbiB7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHR0aGlzLm9wdGlvbnMgPSBleHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblx0XG5cdFx0dmFyIGUgPSB0aGlzLm9wdGlvbnMuZWFzaW5nO1xuXHRcdGlmICh0eXBlb2YgZSA9PSAnc3RyaW5nJykge1xuXHRcdFx0aWYgKCFlYXNpbmdzW2VdKVxuXHRcdFx0XHR0aHJvdyAnVW5rbm93biBcIicgKyBlICsgJ1wiIGVhc2luZyBmdW5jdGlvbic7XG5cdFx0XHR0aGlzLm9wdGlvbnMuZWFzaW5nID0gZWFzaW5nc1tlXTtcblx0XHR9XG5cdFx0XG5cdFx0aWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuZWFzaW5nICE9ICdmdW5jdGlvbicpXG5cdFx0XHR0aHJvdyAnRWFzaW5nIHNob3VsZCBiZSBhIGZ1bmN0aW9uJztcblxuXHRcdHRoaXMuX2lkID0gJ3R3JyArIChpZENvdW50ZXIrKyk7XG5cdFx0XG5cdFx0aWYgKHRoaXMub3B0aW9ucy5hdXRvc3RhcnQpIHtcblx0XHRcdHRoaXMuc3RhcnQoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogU3RhcnQgYW5pbWF0aW9uIGZyb20gdGhlIGJlZ2lubmluZ1xuXHQgKi9cblx0c3RhcnQoKSB7XG5cdFx0aWYgKCF0aGlzLmFuaW1hdGluZykge1xuXHRcdFx0dGhpcy5wb3MgPSAwO1xuXHRcdFx0dGhpcy5zdGFydFRpbWUgPSB0aW1lKCkgKyAodGhpcy5vcHRpb25zLmRlbGF5IHx8IDApO1xuXHRcdFx0dGhpcy5pbmZpbml0ZSA9IHRoaXMub3B0aW9ucy5kdXJhdGlvbiA9PT0gJ2luZmluaXRlJztcblx0XHRcdHRoaXMuZW5kVGltZSA9IHRoaXMuaW5maW5pdGUgPyAwIDogdGhpcy5zdGFydFRpbWUgKyB0aGlzLm9wdGlvbnMuZHVyYXRpb247XG5cdFx0XHR0aGlzLmFuaW1hdGluZyA9IHRydWU7XG5cdFx0XHR0aGlzLm9wdGlvbnMuc3RhcnQodGhpcyk7XG5cdFx0XHRhZGRUb1F1ZXVlKHRoaXMpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3AgYW5pbWF0aW9uXG5cdCAqL1xuXHRzdG9wKCkge1xuXHRcdGlmICh0aGlzLmFuaW1hdGluZykge1xuXHRcdFx0dGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuY29tcGxldGUpIHtcblx0XHRcdFx0dGhpcy5vcHRpb25zLmNvbXBsZXRlKHRoaXMpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdHRvZ2dsZSgpIHtcblx0XHRpZiAodGhpcy5hbmltYXRpbmcpIHtcblx0XHRcdHRoaXMuc3RvcCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnN0YXJ0KCk7XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHR3ZWVuKG9wdGlvbnMpIHtcblx0cmV0dXJuIG5ldyBUd2VlbihvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBHZXQgb3Igc2V0IGRlZmF1bHQgdmFsdWVcbiAqIEBwYXJhbSAge1N0cmluZ30gbmFtZVxuICogQHBhcmFtICB7T2JqZWN0fSB2YWx1ZVxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdHMobmFtZSwgdmFsdWUpIHtcblx0aWYgKHR5cGVvZiB2YWx1ZSAhPSAndW5kZWZpbmVkJykge1xuXHRcdGRlZmF1bHRzW25hbWVdID0gdmFsdWU7XG5cdH1cblxuXHRyZXR1cm4gZGVmYXVsdHNbbmFtZV07XG59XG5cbi8qKlxuICogUmV0dXJucyBhbGwgYWN0aXZlIGFuaW1hdGlvbiBvYmplY3RzLlxuICogRm9yIGRlYnVnZ2luZyBtb3N0bHlcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5leHBvcnQgZnVuY3Rpb24gX2FsbCgpIHtcblx0cmV0dXJuIGFuaW1zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcCgpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhbmltcy5sZW5ndGg7IGkrKykge1xuXHRcdGFuaW1zW2ldLnN0b3AoKTtcblx0fVxuXG5cdGFuaW1zLmxlbmd0aCA9IDA7XG59OyIsIi8qKlxuICogTW9kdWxlIHRoYXQgY3JlYXRlcyBsaXN0IG9mIGFjdGlvbiBoaW50cyBhbmQgaGlnaGxpZ2h0cyBpdGVtcyB3aGVuIHNwZWNpZmllZFxuICogYWN0aW9uIGlzIHBlcmZvcm1lZFxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0ICogYXMgZG9tIGZyb20gJy4uL2RvbSc7XG5pbXBvcnQge3RlbXBsYXRlLCBmaW5kLCB0b0FycmF5LCBleHRlbmR9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcblx0d3JhcHBlclRlbXBsYXRlOiAnPHVsIGNsYXNzPVwiQ29kZU1pcnJvci1vdXRsaW5lXCI+PCU9IGNvbnRlbnQgJT48L3VsPicsXG5cdGl0ZW1UZW1wbGF0ZTogJzxsaSBkYXRhLWFjdGlvbi1pZD1cIjwlPSBpZCAlPlwiIGNsYXNzPVwiQ29kZU1pcnJvci1vdXRsaW5lX19pdGVtXCI+PCU9IHRpdGxlICU+PC9saT4nLFxuXHRpdGVtQ2xhc3M6ICdDb2RlTWlycm9yLW91dGxpbmVfX2l0ZW0nLFxuXHRzZWxlY3RlZENsYXNzOiAnQ29kZU1pcnJvci1vdXRsaW5lX19pdGVtX3NlbGVjdGVkJ1xufTtcblx0XG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBoaW50c1xuICogQHBhcmFtIHtTY2VuYXJpb30gc2NlbmFyaW9cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGhpbnRzLCBzY2VuYXJpbywgb3B0aW9ucz17fSkge1xuXHRvcHRpb25zID0gZXh0ZW5kKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cdFxuXHR2YXIgaGludEtleXMgPSBPYmplY3Qua2V5cyhoaW50cykuc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdFx0cmV0dXJuIGEgLSBiO1xuXHR9KTtcblx0XG5cdHZhciBpdGVtVGVtcGxhdGUgPSB0ZW1wbGF0ZShvcHRpb25zLml0ZW1UZW1wbGF0ZSk7XG5cdHZhciBpdGVtcyA9IGhpbnRLZXlzLm1hcChrZXkgPT4gaXRlbVRlbXBsYXRlKHt0aXRsZTogaGludHNba2V5XSwgaWQ6IGtleX0pKTtcblx0XG5cdHZhciBlbCA9IGRvbS50b0RPTSh0ZW1wbGF0ZShvcHRpb25zLndyYXBwZXJUZW1wbGF0ZSwge1xuXHRcdGNvbnRlbnQ6IGl0ZW1zLmpvaW4oJycpXG5cdH0pKTtcblx0XG5cdGlmIChvcHRpb25zLnRhcmdldCkge1xuXHRcdG9wdGlvbnMudGFyZ2V0LmFwcGVuZENoaWxkKGVsKTtcblx0fVxuXHRcblx0c2NlbmFyaW9cblx0XHQub24oJ2FjdGlvbicsIGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSB0b0FycmF5KGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgb3B0aW9ucy5pdGVtQ2xhc3MpKTtcblx0XHRcdHZhciBtYXRjaGVkSXRlbSA9IGZpbmQoaXRlbXMsIGVsZW0gPT4gZWxlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtYWN0aW9uLWlkJykgPT0gaWQpO1xuXHRcdFx0XG5cdFx0XHRpZiAobWF0Y2hlZEl0ZW0pIHtcblx0XHRcdFx0aXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uY2xhc3NMaXN0LnJlbW92ZShvcHRpb25zLnNlbGVjdGVkQ2xhc3MpKTtcblx0XHRcdFx0bWF0Y2hlZEl0ZW0uY2xhc3NMaXN0LmFkZChvcHRpb25zLnNlbGVjdGVkQ2xhc3MpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Lm9uKCdzdG9wJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0b0FycmF5KGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy4nICsgb3B0aW9ucy5pdGVtQ2xhc3MpKVxuXHRcdFx0LmZvckVhY2goaXRlbSA9PiBpdGVtLmNsYXNzTGlzdC5yZW1vdmUob3B0aW9ucy5zZWxlY3RlZENsYXNzKSk7XG5cdFx0fSk7XG5cdFxuXHRyZXR1cm4gZWw7XG59OyIsIi8qKlxuICogU2hvd3MgZmFrZSBwcm9tcHQgZGlhbG9nIHdpdGggaW50ZXJhY3RpdmUgdmFsdWUgdHlwaW5nXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgdHdlZW4gZnJvbSAnLi4vdmVuZG9yL3R3ZWVuJztcbmltcG9ydCB7ZXh0ZW5kLCB0ZW1wbGF0ZSwgaGFzM2QsIHByZWZpeGVkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgKiBhcyBkb20gZnJvbSAnLi4vZG9tJztcblxudmFyIGRpYWxvZ0luc3RhbmNlID0gbnVsbDtcbnZhciBiZ0luc3RhbmNlID0gbnVsbDtcbnZhciBsYXN0VHdlZW4gPSBudWxsO1xuXG5leHBvcnQgdmFyIGFjdGlvbnMgPSB7XG5cdHByb21wdChvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHR0aXRsZTogJ0VudGVyIHNvbWV0aGluZycsXG5cdFx0XHRkZWxheTogODAsICAgICAgICAvLyBkZWxheSBiZXR3ZWVuIGNoYXJhY3RlciB0eXBpbmdcblx0XHRcdHR5cGVEZWxheTogMTAwMCwgIC8vIHRpbWUgdG8gd2FpdCBiZWZvcmUgdHlwaW5nIHRleHRcblx0XHRcdGhpZGVEZWxheTogMjAwMCAgIC8vIHRpbWUgdG8gd2FpdCBiZWZvcmUgaGlkaW5nIHByb21wdCBkaWFsb2dcblx0XHR9LCB3cmFwKCd0ZXh0Jywgb3B0aW9ucykpO1xuXHRcdFxuXHRcdHNob3cob3B0aW9ucy50aXRsZSwgZWRpdG9yLmdldFdyYXBwZXJFbGVtZW50KCksIGZ1bmN0aW9uKGRpYWxvZykge1xuXHRcdFx0dGltZXIoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHR5cGVUZXh0KGRpYWxvZy5xdWVyeVNlbGVjdG9yKCcuQ29kZU1pcnJvci1wcm9tcHRfX2lucHV0JyksIG9wdGlvbnMsIHRpbWVyLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR0aW1lcihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGhpZGUobmV4dCk7XG5cdFx0XHRcdFx0fSwgb3B0aW9ucy5oaWRlRGVsYXkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0sIG9wdGlvbnMudHlwZURlbGF5KTtcblx0XHR9KTtcblx0fVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNob3codGV4dCwgdGFyZ2V0LCBjYWxsYmFjaykge1xuXHRoaWRlKCk7XG5cdGRpYWxvZ0luc3RhbmNlID0gZG9tLnRvRE9NKGA8ZGl2IGNsYXNzPVwiQ29kZU1pcnJvci1wcm9tcHRcIj5cblx0XHQ8ZGl2IGNsYXNzPVwiQ29kZU1pcnJvci1wcm9tcHRfX3RpdGxlXCI+JHt0ZXh0fTwvZGl2PlxuXHRcdDxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJwcm9tcHRcIiBjbGFzcz1cIkNvZGVNaXJyb3ItcHJvbXB0X19pbnB1dFwiIHJlYWRvbmx5PVwicmVhZG9ubHlcIiAvPlxuXHRcdDwvZGl2PmApO1xuXHRiZ0luc3RhbmNlID0gZG9tLnRvRE9NKCc8ZGl2IGNsYXNzPVwiQ29kZU1pcnJvci1wcm9tcHRfX3NoYWRlXCI+PC9kaXY+Jyk7XG5cdFxuXHR0YXJnZXQuYXBwZW5kQ2hpbGQoZGlhbG9nSW5zdGFuY2UpO1xuXHR0YXJnZXQuYXBwZW5kQ2hpbGQoYmdJbnN0YW5jZSk7XG5cdFxuXHRhbmltYXRlU2hvdyhkaWFsb2dJbnN0YW5jZSwgYmdJbnN0YW5jZSwge2NvbXBsZXRlOiBjYWxsYmFja30pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGlkZShjYWxsYmFjaykge1xuXHRpZiAoZGlhbG9nSW5zdGFuY2UpIHtcblx0XHRpZiAobGFzdFR3ZWVuKSB7XG5cdFx0XHRsYXN0VHdlZW4uc3RvcCgpO1xuXHRcdFx0bGFzdFR3ZWVuID0gbnVsbDtcblx0XHR9XG5cdFx0YW5pbWF0ZUhpZGUoZGlhbG9nSW5zdGFuY2UsIGJnSW5zdGFuY2UsIHtjb21wbGV0ZTogY2FsbGJhY2t9KTtcblx0XHRkaWFsb2dJbnN0YW5jZSA9IGJnSW5zdGFuY2UgPSBudWxsO1xuXHR9IGVsc2UgaWYgKGNhbGxiYWNrKSB7XG5cdFx0Y2FsbGJhY2soKTtcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZGlhbG9nXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGJnXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBcbiAqL1xuZnVuY3Rpb24gYW5pbWF0ZVNob3coZGlhbG9nLCBiZywgb3B0aW9ucz17fSkge1xuXHR2YXIgY3NzVHJhbnNmb3JtID0gcHJlZml4ZWQoJ3RyYW5zZm9ybScpO1xuXHR2YXIgZGlhbG9nU3R5bGUgPSBkaWFsb2cuc3R5bGU7XG5cdHZhciBiZ1N0eWxlID0gYmcuc3R5bGU7XG5cdHZhciBoZWlnaHQgPSBkaWFsb2cub2Zmc2V0SGVpZ2h0O1xuXHR2YXIgdG1wbCA9IHRlbXBsYXRlKGhhczNkID8gJ3RyYW5zbGF0ZTNkKDAsIDwlPSBwb3MgJT4sIDApJyA6ICd0cmFuc2xhdGUoMCwgPCU9IHBvcyAlPiknKTtcblxuXHRiZ1N0eWxlLm9wYWNpdHkgPSAwO1xuXHR0d2Vlbih7XG5cdFx0ZHVyYXRpb246IDIwMCxcblx0XHRzdGVwKHBvcykge1xuXHRcdFx0YmdTdHlsZS5vcGFjaXR5ID0gcG9zO1xuXHRcdH1cblx0fSk7XG5cdFxuXHRkaWFsb2dTdHlsZVtjc3NUcmFuc2Zvcm1dID0gdG1wbCh7cG9zOiAtaGVpZ2h0fSk7XG5cdFxuXHRyZXR1cm4gbGFzdFR3ZWVuID0gdHdlZW4oe1xuXHRcdGR1cmF0aW9uOiA0MDAsXG5cdFx0ZWFzaW5nOiAnb3V0Q3ViaWMnLFxuXHRcdHN0ZXAocG9zKSB7XG5cdFx0XHRkaWFsb2dTdHlsZVtjc3NUcmFuc2Zvcm1dID0gdG1wbCh7cG9zOiAoLWhlaWdodCAqICgxIC0gcG9zKSkgKyAncHgnfSk7XG5cdFx0fSxcblx0XHRjb21wbGV0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRsYXN0VHdlZW4gPSBudWxsO1xuXHRcdFx0b3B0aW9ucy5jb21wbGV0ZSAmJiBvcHRpb25zLmNvbXBsZXRlKGRpYWxvZywgYmcpO1xuXHRcdH1cblx0fSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBkaWFsb2dcbiAqIEBwYXJhbSB7RWxlbWVudH0gYmdcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGVIaWRlKGRpYWxvZywgYmcsIG9wdGlvbnMpIHtcblx0dmFyIGRpYWxvZ1N0eWxlID0gZGlhbG9nLnN0eWxlO1xuXHR2YXIgYmdTdHlsZSA9IGJnLnN0eWxlO1xuXHR2YXIgaGVpZ2h0ID0gZGlhbG9nLm9mZnNldEhlaWdodDtcblx0dmFyIGNzc1RyYW5zZm9ybSA9IHByZWZpeGVkKCd0cmFuc2Zvcm0nKTtcblx0dmFyIHRtcGwgPSB0ZW1wbGF0ZShoYXMzZCA/ICd0cmFuc2xhdGUzZCgwLCA8JT0gcG9zICU+LCAwKScgOiAndHJhbnNsYXRlKDAsIDwlPSBwb3MgJT4pJyk7XG5cblx0cmV0dXJuIHR3ZWVuKHtcblx0XHRkdXJhdGlvbjogMjAwLFxuXHRcdHN0ZXAocG9zKSB7XG5cdFx0XHRkaWFsb2dTdHlsZVtjc3NUcmFuc2Zvcm1dID0gdG1wbCh7cG9zOiAoLWhlaWdodCAqIHBvcykgKyAncHgnfSk7XG5cdFx0XHRiZ1N0eWxlLm9wYWNpdHkgPSAxIC0gcG9zO1xuXHRcdH0sXG5cdFx0Y29tcGxldGUoKSB7XG5cdFx0XHRkb20ucmVtb3ZlKFtkaWFsb2csIGJnXSk7XG5cdFx0XHRvcHRpb25zLmNvbXBsZXRlICYmIG9wdGlvbnMuY29tcGxldGUoZGlhbG9nLCBiZyk7XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gdHlwZVRleHQodGFyZ2V0LCBvcHRpb25zLCB0aW1lciwgbmV4dCkge1xuXHR2YXIgY2hhcnMgPSBvcHRpb25zLnRleHQuc3BsaXQoJycpO1xuXHR0aW1lcihmdW5jdGlvbiBwZXJmb3JtKCkge1xuXHRcdHRhcmdldC52YWx1ZSArPSBjaGFycy5zaGlmdCgpO1xuXHRcdGlmIChjaGFycy5sZW5ndGgpIHtcblx0XHRcdHRpbWVyKHBlcmZvcm0sIG9wdGlvbnMuZGVsYXkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fVxuXHR9LCBvcHRpb25zLmRlbGF5KTtcbn1cblxuZnVuY3Rpb24gd3JhcChrZXksIHZhbHVlKSB7XG5cdHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdmFsdWUgOiB7W2tleV06IHZhbHVlfTtcbn0iLCIvKipcbiAqIEV4dGVuc2lvbiB0aGF0IGFsbG93cyBhdXRob3JzIHRvIGRpc3BsYXkgY29udGV4dCB0b29sdGlwcyBib3VuZCB0byBzcGVjaWZpY1xuICogcG9zaXRpb25zXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgdHdlZW4gZnJvbSAnLi4vdmVuZG9yL3R3ZWVuJztcbmltcG9ydCB7ZXh0ZW5kLCBwcmVmaXhlZCwgbWFrZVBvcywgaGFzM2R9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCAqIGFzIGRvbSBmcm9tICcuLi9kb20nO1xuXG52YXIgaW5zdGFuY2UgPSBudWxsO1xudmFyIGxhc3RUd2VlbiA9IG51bGw7XG5cbmV4cG9ydCB2YXIgYWxpZ25EZWZhdWx0cyA9IHtcblx0LyoqIENTUyBzZWxlY3RvciBmb3IgZ2V0dGluZyBwb3B1cCB0YWlsICovXG5cdHRhaWxDbGFzczogJ0NvZGVNaXJyb3ItdG9vbHRpcF9fdGFpbCcsXG5cdFxuXHQvKiogQ2xhc3MgbmFtZSBmb3Igc3dpdGNoaW5nIHRhaWwvcG9wdXAgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGFyZ2V0IHBvaW50ICovXG5cdGJlbG93Q2xhc3M6ICdDb2RlTWlycm9yLXRvb2x0aXBfYmVsb3cnLFxuXHRcblx0LyoqIE1pbiBkaXN0YW5jZSBiZXR3ZWVuIHBvcHVwIGFuZCB2aWV3cG9ydCAqL1xuXHRwb3B1cE1hcmdpbjogNSxcblx0XG5cdC8qKiBNaW4gZGlzdGFuY2UgYmV0d2VlbiBwb3B1cCBsZWZ0L3JpZ2h0IGVkZ2UgYW5kIGl0cyB0YWlsICovXG5cdHRhaWxNYXJnaW46IDExXG59O1xuXG5leHBvcnQgdmFyIGFjdGlvbnMgPSB7XG5cdC8qKlxuXHQgKiBTaG93cyB0b29sdGlwIHdpdGggZ2l2ZW4gdGV4dCwgd2FpdCBmb3IgYG9wdGlvbnMud2FpdGBcblx0ICogbWlsbGlzZWNvbmRzIHRoZW4gaGlkZXMgdG9vbHRpcFxuXHQgKi9cblx0dG9vbHRpcChvcHRpb25zLCBlZGl0b3IsIG5leHQsIHRpbWVyKSB7XG5cdFx0b3B0aW9ucyA9IGV4dGVuZCh7XG5cdFx0XHR3YWl0OiA0MDAwLCAgIC8vIHRpbWUgdG8gd2FpdCBiZWZvcmUgaGlkaW5nIHRvb2x0aXBcblx0XHRcdHBvczogJ2NhcmV0JyAgLy8gcG9zaXRpb24gd2hlcmUgdG9vbHRpcCBzaG91bGQgcG9pbnQgdG9cblx0XHR9LCB3cmFwKCd0ZXh0Jywgb3B0aW9ucykpO1xuXHRcdFxuXHRcdHZhciBwb3MgPSByZXNvbHZlUG9zaXRpb24ob3B0aW9ucy5wb3MsIGVkaXRvcik7XG5cdFx0c2hvdyhvcHRpb25zLnRleHQsIHBvcywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aW1lcihmdW5jdGlvbigpIHtcblx0XHRcdFx0aGlkZSgoKSA9PiB0aW1lcihuZXh0KSk7XG5cdFx0XHR9LCBvcHRpb25zLndhaXQpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTaG93cyB0b29sdGlwIHdpdGggc3BlY2lmaWVkIHRleHQuIFRoaXMgdG9vbHRpcCBzaG91bGQgYmUgZXhwbGljaXRseSBcblx0ICogaGlkZGVuIHdpdGggYGhpZGVUb29sdGlwYCBhY3Rpb25cblx0ICovXG5cdHNob3dUb29sdGlwKG9wdGlvbnMsIGVkaXRvciwgbmV4dCwgdGltZXIpIHtcblx0XHRvcHRpb25zID0gZXh0ZW5kKHtcblx0XHRcdHBvczogJ2NhcmV0JyAgLy8gcG9zaXRpb24gd2hlcmUgdG9vbHRpcCBzaG91bGQgcG9pbnQgdG9cblx0XHR9LCB3cmFwKCd0ZXh0Jywgb3B0aW9ucykpO1xuXHRcdFxuXHRcdHNob3cob3B0aW9ucy50ZXh0LCByZXNvbHZlUG9zaXRpb24ob3B0aW9ucy5wb3MsIGVkaXRvcikpO1xuXHRcdG5leHQoKTtcblx0fSxcblxuXHQvKipcblx0ICogSGlkZXMgdG9vbHRpcCwgcHJldmlvdXNseSBzaG93biBieSAnc2hvd1Rvb2x0aXAnIGFjdGlvblxuXHQgKi9cblx0aGlkZVRvb2x0aXAob3B0aW9ucywgZWRpdG9yLCBuZXh0LCB0aW1lcikge1xuXHRcdGhpZGUobmV4dCk7XG5cdH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93KHRleHQsIHBvcywgY2FsbGJhY2spIHtcblx0aGlkZSgpO1xuXHRcblx0aW5zdGFuY2UgPSBkb20udG9ET00oYDxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLXRvb2x0aXBcIj5cblx0XHQ8ZGl2IGNsYXNzPVwiQ29kZU1pcnJvci10b29sdGlwX19jb250ZW50XCI+JHt0ZXh0fTwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJDb2RlTWlycm9yLXRvb2x0aXBfX3RhaWxcIj48L2Rpdj5cblx0XHQ8L2Rpdj5gKTtcblx0XG5cdGRvbS5jc3MoaW5zdGFuY2UsIHByZWZpeGVkKCd0cmFuc2Zvcm0nKSwgJ3NjYWxlKDApJyk7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaW5zdGFuY2UpO1xuXHRcblx0YWxpZ25Qb3B1cFdpdGhUYWlsKGluc3RhbmNlLCB7cG9zaXRpb246IHBvc30pO1xuXHRhbmltYXRlU2hvdyhpbnN0YW5jZSwge2NvbXBsZXRlOiBjYWxsYmFja30pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGlkZShjYWxsYmFjaykge1xuXHRpZiAoaW5zdGFuY2UpIHtcblx0XHRpZiAobGFzdFR3ZWVuKSB7XG5cdFx0XHRsYXN0VHdlZW4uc3RvcCgpO1xuXHRcdFx0bGFzdFR3ZWVuID0gbnVsbDtcblx0XHR9XG5cdFx0YW5pbWF0ZUhpZGUoaW5zdGFuY2UsIHtjb21wbGV0ZTogY2FsbGJhY2t9KTtcblx0XHRpbnN0YW5jZSA9IG51bGw7XG5cdH0gZWxzZSBpZiAoY2FsbGJhY2spIHtcblx0XHRjYWxsYmFjaygpO1xuXHR9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRoYXQgZmluZHMgb3B0aW1hbCBwb3NpdGlvbiBvZiB0b29sdGlwIHBvcHVwIG9uIHBhZ2VcbiAqIGFuZCBhbGlnbnMgcG9wdXAgdGFpbCB3aXRoIHRoaXMgcG9zaXRpb25cbiAqIEBwYXJhbSB7RWxlbWVudH0gcG9wdXBcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIGFsaWduUG9wdXBXaXRoVGFpbChwb3B1cCwgb3B0aW9ucz17fSkge1xuXHRvcHRpb25zID0gZXh0ZW5kKHt9LCBhbGlnbkRlZmF1bHRzLCBvcHRpb25zKTtcblx0XG5cdGRvbS5jc3MocG9wdXAsIHtcblx0XHRsZWZ0OiAwLFxuXHRcdHRvcDogMFxuXHR9KTtcblx0XG5cdHZhciB0YWlsID0gcG9wdXAucXVlcnlTZWxlY3RvcignLicgKyBvcHRpb25zLnRhaWxDbGFzcyk7XG5cdFxuXHR2YXIgcmVzdWx0WCA9IDAsIHJlc3VsdFkgPSAwO1xuXHR2YXIgcG9zID0gb3B0aW9ucy5wb3NpdGlvbjtcblx0dmFyIHZwID0gZG9tLnZpZXdwb3J0UmVjdCgpO1xuXHRcblx0dmFyIHdpZHRoID0gcG9wdXAub2Zmc2V0V2lkdGg7XG5cdHZhciBoZWlnaHQgPSBwb3B1cC5vZmZzZXRIZWlnaHQ7XG5cdFxuXHR2YXIgaXNUb3A7XG5cdFx0XG5cdC8vIGNhbGN1bGF0ZSBob3Jpem9udGFsIHBvc2l0aW9uXG5cdHJlc3VsdFggPSBNYXRoLm1pbih2cC53aWR0aCAtIHdpZHRoIC0gb3B0aW9ucy5wb3B1cE1hcmdpbiwgTWF0aC5tYXgob3B0aW9ucy5wb3B1cE1hcmdpbiwgcG9zLnggLSB2cC5sZWZ0IC0gd2lkdGggLyAyKSk7XG5cdFxuXHQvLyBjYWxjdWxhdGUgdmVydGljYWwgcG9zaXRpb25cblx0aWYgKGhlaWdodCArIHRhaWwub2Zmc2V0SGVpZ2h0ICsgb3B0aW9ucy5wb3B1cE1hcmdpbiArIHZwLnRvcCA8IHBvcy55KSB7XG5cdFx0Ly8gcGxhY2UgYWJvdmUgdGFyZ2V0IHBvc2l0aW9uXG5cdFx0cmVzdWx0WSA9IE1hdGgubWF4KDAsIHBvcy55IC0gaGVpZ2h0IC0gdGFpbC5vZmZzZXRIZWlnaHQpO1xuXHRcdGlzVG9wID0gdHJ1ZTtcblx0fSBlbHNlIHtcblx0XHQvLyBwbGFjZSBiZWxvdyB0YXJnZXQgcG9zaXRpb24gXG5cdFx0cmVzdWx0WSA9IHBvcy55ICsgdGFpbC5vZmZzZXRIZWlnaHQ7XG5cdFx0aXNUb3AgPSBmYWxzZTtcblx0fVxuXHRcblx0Ly8gY2FsY3VsYXRlIHRhaWwgcG9zaXRpb25cblx0dmFyIHRhaWxNaW5MZWZ0ID0gb3B0aW9ucy50YWlsTWFyZ2luO1xuXHR2YXIgdGFpbE1heExlZnQgPSB3aWR0aCAtIG9wdGlvbnMudGFpbE1hcmdpbjtcblx0dGFpbC5zdHlsZS5sZWZ0ID0gTWF0aC5taW4odGFpbE1heExlZnQsIE1hdGgubWF4KHRhaWxNaW5MZWZ0LCBwb3MueCAtIHJlc3VsdFggLSB2cC5sZWZ0KSkgKyAncHgnO1xuXHRcblx0ZG9tLmNzcyhwb3B1cCwge1xuXHRcdGxlZnQ6IHJlc3VsdFgsXG5cdFx0dG9wOiByZXN1bHRZXG5cdH0pO1xuXHRcblx0cG9wdXAuY2xhc3NMaXN0LnRvZ2dsZShvcHRpb25zLmJlbG93Q2xhc3MsICFpc1RvcCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFxuICovXG5mdW5jdGlvbiBhbmltYXRlU2hvdyhlbGVtLCBvcHRpb25zPXt9KSB7XG5cdG9wdGlvbnMgPSBleHRlbmQoe30sIGFsaWduRGVmYXVsdHMsIG9wdGlvbnMpO1xuXHR2YXIgY3NzT3JpZ2luID0gcHJlZml4ZWQoJ3RyYW5zZm9ybS1vcmlnaW4nKTtcblx0dmFyIGNzc1RyYW5zZm9ybSA9IHByZWZpeGVkKCd0cmFuc2Zvcm0nKTtcblx0dmFyIHN0eWxlID0gZWxlbS5zdHlsZTtcblxuXHR2YXIgdGFpbCA9IGVsZW0ucXVlcnlTZWxlY3RvcignLicgKyBvcHRpb25zLnRhaWxDbGFzcyk7XG5cdHZhciB4T3JpZ2luID0gZG9tLmNzcyh0YWlsLCAnbGVmdCcpO1xuXHR2YXIgeU9yaWdpbiA9IHRhaWwub2Zmc2V0VG9wO1xuXHRpZiAoZWxlbS5jbGFzc0xpc3QuY29udGFpbnMob3B0aW9ucy5iZWxvd0NsYXNzKSkge1xuXHRcdHlPcmlnaW4gLT0gdGFpbC5vZmZzZXRIZWlnaHQ7XG5cdH1cblx0XG5cdHlPcmlnaW4gKz0gJ3B4JztcblxuXHRzdHlsZVtjc3NPcmlnaW5dID0geE9yaWdpbiArICcgJyArIHlPcmlnaW47XG5cdHZhciBwcmVmaXggPSBoYXMzZCA/ICd0cmFuc2xhdGVaKDApICcgOiAnJztcblx0XG5cdHJldHVybiBsYXN0VHdlZW4gPSB0d2Vlbih7XG5cdFx0ZHVyYXRpb246IDgwMCxcblx0XHRlYXNpbmc6ICdvdXRFbGFzdGljJyxcblx0XHRzdGVwKHBvcykge1xuXHRcdFx0c3R5bGVbY3NzVHJhbnNmb3JtXSA9IHByZWZpeCArICdzY2FsZSgnICsgcG9zICsgJyknO1xuXHRcdH0sXG5cdFx0Y29tcGxldGUoKSB7XG5cdFx0XHRzdHlsZVtjc3NUcmFuc2Zvcm1dID0gJ25vbmUnO1xuXHRcdFx0bGFzdFR3ZWVuID0gbnVsbDtcblx0XHRcdG9wdGlvbnMuY29tcGxldGUgJiYgb3B0aW9ucy5jb21wbGV0ZShlbGVtKTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBhbmltYXRlSGlkZShlbGVtLCBvcHRpb25zKSB7XG5cdHZhciBzdHlsZSA9IGVsZW0uc3R5bGU7XG5cblx0cmV0dXJuIHR3ZWVuKHtcblx0XHRkdXJhdGlvbjogMjAwLFxuXHRcdGVhc2luZzogJ2xpbmVhcicsXG5cdFx0c3RlcDogZnVuY3Rpb24ocG9zKSB7XG5cdFx0XHRzdHlsZS5vcGFjaXR5ID0gKDEgLSBwb3MpO1xuXHRcdH0sXG5cdFx0Y29tcGxldGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZG9tLnJlbW92ZShlbGVtKTtcblx0XHRcdG9wdGlvbnMuY29tcGxldGUgJiYgb3B0aW9ucy5jb21wbGV0ZShlbGVtKTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqIFJlc29sdmVzIHBvc2l0aW9uIHdoZXJlIHRvb2x0aXAgc2hvdWxkIHBvaW50IHRvXG4gKiBAcGFyYW0ge09iamVjdH0gcG9zXG4gKiBAcGFyYW0ge0NvZGVNaXJyb3J9IGVkaXRvclxuICogQHJldHVybnMge09iamVjdH0gT2JqZWN0IHdpdGggPGNvZGU+eDwvY29kZT4gYW5kIDxjb2RlPnk8L2NvZGU+IFxuICogcHJvcGVydGllc1xuICovXG5mdW5jdGlvbiByZXNvbHZlUG9zaXRpb24ocG9zLCBlZGl0b3IpIHtcblx0aWYgKHBvcyA9PT0gJ2NhcmV0Jykge1xuXHRcdC8vIGdldCBhYnNvbHV0ZSBwb3NpdGlvbiBvZiBjdXJyZW50IGNhcmV0IHBvc2l0aW9uXG5cdFx0cmV0dXJuIHNhbml0aXplQ2FyZXRQb3MoZWRpdG9yLmN1cnNvckNvb3Jkcyh0cnVlKSk7XG5cdH1cblxuXHRpZiAodHlwZW9mIHBvcyA9PT0gJ29iamVjdCcpIHtcblx0XHRpZiAoJ3gnIGluIHBvcyAmJiAneScgaW4gcG9zKSB7XG5cdFx0XHQvLyBwYXNzZWQgYWJzb2x1dGUgY29vcmRpbmF0ZXNcblx0XHRcdHJldHVybiBwb3M7XG5cdFx0fVxuXG5cdFx0aWYgKCdsZWZ0JyBpbiBwb3MgJiYgJ3RvcCcgaW4gcG9zKSB7XG5cdFx0XHQvLyBwYXNzZWQgYWJzb2x1dGUgY29vcmRpbmF0ZXNcblx0XHRcdHJldHVybiBzYW5pdGl6ZUNhcmV0UG9zKHBvcyk7XG5cdFx0fVxuXHR9XG5cdFxuXHRwb3MgPSBtYWtlUG9zKHBvcywgZWRpdG9yKTtcblx0cmV0dXJuIHNhbml0aXplQ2FyZXRQb3MoZWRpdG9yLmNoYXJDb29yZHMocG9zKSk7XG59XG5cbmZ1bmN0aW9uIHNhbml0aXplQ2FyZXRQb3MocG9zKSB7XG5cdGlmICgnbGVmdCcgaW4gcG9zKSB7XG5cdFx0cG9zLnggPSBwb3MubGVmdDtcblx0fVxuXG5cdGlmICgndG9wJyBpbiBwb3MpIHtcblx0XHRwb3MueSA9IHBvcy50b3A7XG5cdH1cblxuXHRyZXR1cm4gcG9zO1xufVxuXG5mdW5jdGlvbiB3cmFwKGtleSwgdmFsdWUpIHtcblx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyB2YWx1ZSA6IHtba2V5XTogdmFsdWV9O1xufSJdfQ==
