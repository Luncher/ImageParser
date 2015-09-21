var gBuildDate = "2015年 09月 21日 星期一 12:44:08 CST";console.log("tile map build date: " + gBuildDate);
(function(root) {
	var util = {};

	root.util = util;
	
	var extend = function(sub, sup) {
		var keys = Object.keys(sup);
		for(var i = 0; i < keys.length; i++) {
			var k = keys[i];
			sub[k] = sup[k];
		}
	};
	util.extend = extend;

	var inherits = function(d, p) {
		function x() {this.constructor = d;}	
		x.prototype = p.prototype;
		d.prototype = new x();
	};
	util.inherits = inherits;

	var Request = (function () {
		function Request() {

		}

		Request.__getXHR = function() {
			return new window.XMLHttpRequest;
		}

		Request.__make = function(config) {
			var xhr = this.__getXHR();	
			
			if(!config || !config.url) {
				return;
			}
			
			if(config.responseType) {
				xhr.responseType = config.responseType;
			}

			if(config.dataType) {
				xhr.dataType = config.dataType;
			}

			var method = config.method  || 'GET';
			xhr.open(method, config.url, true);

			for(var i = 0, keys = Object.keys(config.headers || {}); i < keys.length; i++) {
				var k = keys[i];
				xhr.setRequestHeader(k, config.headers[k]);	
			}

			xhr.send(config.data || null);

			xhr.onreadystatechange = function() {
				if(xhr.readyState === 4) {
					if(config.onDone) {
						config.onDone(xhr, xhr.responseText);
					}
				}

				return;
			}
		}

		Request.httpGetURL = function(url, onDone) {
			var config = {
				url: url,
				onDone: onDone
			}

			this.__make(config);
		}

		Request.httpGetJSON = function(url, onDone) {
			this.httpGetURL(url, function(xhr, data) {
				var err = null;
				var json = null;

				if(String(xhr.status).search(/^200$/) < 0) {
					onDone(new Error(xhr.statusText));
					return;	
				}

				try {
					json = JSON.parse(data);
				}
				catch(err) {
					console.debug('httpGetURL: ', err);	
					err = new Error(err);
				}
				onDone(err, json);
			});	

			return;
		}
		return Request;
	})();
	util.Request = Request;

	var LoaderImage = (function() {
		LoaderImage.cacheImages = {};
		function LoaderImage(src, onDone) {
			var image = LoaderImage.cacheImages[src];	
			if(image) {
				if(!image.loaded) {
					image.callers.push(onDone);	
				}
				else {
					image.loaded = true;
					setTimeout(function() {
						onLoaded(image);
					}, 0);
				}

				return;
			}

			image = new Image();
			image.src = src;
			image.callers = [onDone];

			function callonLoaded() {
				for(var i = 0; i < this.callers.length; i++) {
					var caller = this.callers[i];
					caller(this, this.loaded);
				}

				this.callers.length = 0;
			}

			image.onload = function(e) {
				this.loaded = true;	
				callonLoaded.call(this);
				LoaderImage.cacheImages[src] = this;
			}
			image.onabort = function(e) {
				this.loaded = false;	
				callonLoaded.call(this);
			}
			image.onerror = function(e) {
				this.loaded = false;
				callonLoaded.call(this);
			}
		}

		return LoaderImage;
	})();
	util.LoaderImage = LoaderImage;

	util.validType = function(dst, need) {
		return dst !== null && typeof dst === need;
	}

	util.isNull = function(src) {
		return src === null;
	}

	util.isNullOrUndefined = function(src) {
		return typeof src === 'undefined' || util.isNull(src);
	}

})(this);
var querystring = (function(root) {
	var util = root.util;
	function QueryString() {
	
	}

	function hasOwnProperty(obj, k) {
		return Object.prototype.hasOwnProperty.call(obj, k);
	}

	var stringifyPrimitive = function(v) {
		if(util.validType(v, 'string')) {
			return v;
		}
		if(util.validType(v, 'boolean')) {
			return v ? 'true' : 'false';
		}
		if(util.validType(v, 'number')) {
			return root.isFinite(v) ? v : '';
		}

		return '';
	}

	QueryString.unescapeBuffer = function(s, decodeSpaces) {
		//TODO	
	}

	QueryString.unescape = function(s, decodeSpaces) {
		try {
			return decodeURIComponent(s);
		}
		catch(e) {
			console.debug(e);
			//return QueryString.unescapeBuffer(s, decodeSpaces).toString();	
		}
	}

	QueryString.escape = function(str) {
		return encodeURIComponent(str);
	}

	QueryString.stringify = QueryString.encode = function(src, sep, eq, options) {
		sep = sep || '&';
		eq = eq || '=';
		var encode = QueryString.escape;
		if(options && typeof options.encodeURIComponent === 'function') {
			encode = options.encodeURIComponent;
		}

		if(util.validType(obj, 'object')) {
			var fields = [];
			var keys = Object.keys(obj);

			for(var i = 0; i < keys.length; ++i) {
				var k = keys[i];
				var v = obj[k];
				var ks = encode(stringifyPrimitive(k)) + eq;

				if(Array.isArray(v)) {
					for(var j = 0; j < v.length; ++j) {
						fields.push(ks + encode(stringifyPrimitive(v[j])));
					}
				}
				else {
					fields.push(ks + encode(stringifyPrimitive(v)));
				}
			}
			return fields.join(sep);
		}
		return '';
	}

	QueryString.parse = QueryString.decode = function(src, sep, eq, options) {
		eq = eq || '=';
		sep = sep || '&';
		var obj = {};

		if(!util.validType(src, 'string') || src.length === 0) {
			return obj;
		}
		qs = qs.split(sep);
		var maxKeys = 1000;
		if(options && util.validType(options.maxKeys)) {
			maxKeys = options.maxKeys;
		}
		var len = qs.length;
		if(maxKeys > 0 && len > maxKeys) {
			len = maxKeys;
		}

		var decode = QueryString.unescape;
		if(options && typeof options.decodeURIComponent === 'function') {
			decode = options.decodeURIComponent;
		}
		
		for(var i = 0; i < len; ++i) {
			var x = qs[i].replace(/\+/g, '%20');
			var idx = x.indexOf(eq);
			var kstr, vstr, k, v;
			
			if(idx > 0) {
				kstr = x.substr(0, indx);
				vstr = x.substr(idx + 1);
			}
			else {
				kstr = x;
				vstr = '';
			}

			try {
				k = decode(kstr);
				v = decode(vstr);
			}
			catch(e) {
				k = QueryString.unescape(kstr, true);
				v = QueryString.unescape(vstr, true);
			}

			if(!hasOwnProperty(obj, k)) {
				obj[k] = v;
			}
			else if(Array.isArray(obj[k])) {
				obj[k].push(v);
			}
			else {
				obj[k] = [obj[k], v];
			}
		}

		return obj;
	}

	return QueryString;
})(this);
this.querystring = querystring;
var urlParser = (function(root) {
	var util = root.util;
	var querystring = root.querystring;

	function Url() {
		this.protocol = null;
		this.slashes = null;
		this.port = null;
		this.host = null;
		this.hostname = null;
		this.hash = null;
		this.search = null;
		this.query = null;
		this.path = null;
		this.href = null;
	}

	var hostnameMaxLen = 255;
	var portPattern = /:[0-9]{1, 5}$/;
	//var protocolPattern = /^([a-z0-9.-+]+:)/i;
	var protocolPattern = /^([a-z0-9.+-]+:)/i;
	var hostEndingChars = ['/', '?', '#'];
	var delims = ['<', '>', '"', '`', ' ', '\n', '\r', '\t'];
	var unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims);
	var autoEscape = ['\''].concat(unwise);
	var nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape);
	var simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?\S*)?$/;

	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
		if(!util.validType(url, 'string')) {
			throw new Error("Params 'url' must be a string, not " + typeof url);
		}
		var queryindex = url.indexOf('?');
		var splitter = (queryindex !== -1 && queryindex < url.indexOf('#')) ? '?' : '#';
		var uSplits = url.split(splitter);
		uSplits[0] = uSplits[0].replace(/\\/g, '/');
		url = uSplits.join(splitter);

		var reset = url.trim();
		
		if(!slashesDenoteHost && url.split('#').length === 1) {
			var simplePath = simplePathPattern.exec(reset);
			if(simplePath) {
				this.path = reset;
				this.href = reset;
				this.pathname = simplePath[1];
				if(simplePath[2]) {
					this.search = simplePath[2];
					if(parseQueryString) {
						this.query = querystring.parse(this.search.substr(1));
					}
					else {
						this.query = this.search.substr(1);
					}
				}
				else if(parseQueryString){
					this.search = '';
					this.query = {};
				}
				return this;
			}
		}
		var proto = protocolPattern.exec(reset);
		if(proto) {
			proto = proto[0];
			this.protocol = proto.toLowerCase();
			reset = reset.substr(proto.length);
		}

		if(slashesDenoteHost || proto) {
			var slashes = reset.substr(0, 2) === '//';
			if(slashes) {
				reset = reset.substr(2);
				this.slashes = true;
			}
		}

		if(slashes) {
			var hostEnd = -1;
			for(var i = 0; i < nonHostChars.length; i++) {
				var hec = reset.indexOf(nonHostChars[i]);
				if(hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
					hostEnd = hec;
				}
			}

			if(hostEnd == -1) {
				hostEnd = reset.length;
			}
			this.host = reset.slice(0, hostEnd);
			reset = reset.slice(hostEnd);

			this.parseHost();
			this.hostname = this.hostname || '';

			if(this.hostname.length > hostnameMaxLen) {
				this.hostname = '';
			}
			else {
				this.hostname = this.hostname.toLowerCase();
			}

			var p = this.port ? ':' + this.port : '';
			var h = this.hostname || '';
			this.host = h + p;
			this.href += this.host;
		}

		for(var i = 0, l = autoEscape.length; i < l; i++) {
			var ae = autoEscape[i];
			if(reset.indexOf(ae) === -1) {
				continue;
			}
			var esc = encodeURIComponent(ae);
			if(esc === ae) {
				esc = escape(ae);
			}
			reset = reset.split(ae).join(esc);
		}

		var hash = reset.indexOf('#');
		if(hash !== -1) {
			this.hash = reset.substr(hash);
			reset = reset.slice(0, hash);
		}
		var qm = reset.indexOf('?');
		if(qm !== -1) {
			this.search = reset.substr(qm);
			if(parseQueryString) {
				this.query = querystring.parse(this.query);
			}
			reset = reset.slice(0, qm);
		}
		else if(parseQueryString) {
			this.search = '';
			this.query = {};
		}

		if(reset) {
			this.pathname = reset;		
		}

		if(this.hostname && !this.pathname) {
			this.pathname = '/';
		}

		if(this.pathname || this.search) {
			var p = this.pathname || '';
			var s = this.search || '';
			this.path = p + s;
		}

		this.href = this.format();
		return this;
	}

	Url.prototype.parseHost = function() {
		var host = this.host;	
		var port = portPattern.exec(host);

		if(port) {
			port = port[0];
			if(port !== ':') {
				this.port = port;
			}
			host = host.substr(0, host.length - port.length);
		}
		if(host) {
			this.hostname = host;
		}

		return;
	}

	Url.prototype.format = function() {
		var protocol = this.protocol || '';
		var pathname = this.pathname || '';
		var hash = this.hash || '';
		var host = false;
		var query = '';

		if(this.host) {
			host = this.host;
		}
		else if(this.hostname) {
			host = this.hostname.indexOf(':') === -1 ?
				this.hostname : '[' + this.hostname + ']';
			if(this.port) {
				host += ':' + this.port;
			}
		}

		if(this.query && util.validType(this.query, 'object') &&
			Object.keys(this.query).length) {
			query = querystring.stringify(this.query);	
		}

		var search = this.search || (query && ('?' + query)) || '';

		if(protocol && protocol.substr(-1) !== ':') {
			protocol += ':';
		}

		if(this.slashes && host !== false) {
			host = '//' + (host || '');
			if(pathname && pathname.charAt(0) !== '/') {
				pathname = '/' + pathname;
			}
		}
		else {
			host = '';
		}
		
		if(hash && hash.charAt(0) !== '#') {
			hash = '#' + hash;
		}
		if(search && search.charAt(0) !== '?') {
			search = '?' + search;
		}
		pathname = pathname.replace(/[?#]/g, function(match) {
			return encodeURIComponent(match);	
		});
		search = search.replace('#', '%23');

		return protocol + host + pathname + search + hash;
	}

	Url.prototype.resolve = function(relative) {
		return this.resolveObject(urlParser.parse(relative, false, true)).format();	
	}

	Url.prototype.resolveObject = function(relative) {
		if(util.validType(relative)) {
			var rel = new Url();
			rel.parse(relative, false, true);
			relative = rel;
		}

		var result = new Url();
		var tkeys = Object.keys(this);
		for(var tk = 0; tk < tkeys.length; tk++) {
			var tkey = tkeys[tk];	
			result[tkey] = this[tkey];
		}

		result.hash = relative.hash;
		if(relative.href === '') {
			result.href = result.format();
			return result;
		}

		if(relative.slashes && !relative.protocol) {
			var rkeys = Object.keys(relative);
			for(var rk = 0; rk < rkeys.length; rk++) {
				var rkey = rkeys[rk];
				if(rkey !== 'protocol') {
					result[rkey] = relative[rkey];
				}
			}

			if(result.hostname && !result.pathname) {
				result.path = result.pathname = '/';
			}

			result.href = result.format();
			return result;
		}

		if(relative.protocol && relative.protocol !== result.protocol) {
			result.protocol = relative.protocol;
			if(!result.host) {
				var relPath = (relative.pathname || '').split('/');
				while(relPath.length && !(relative.host = relPath.shift()));
				if(!relative.host) relative.host = '';
				if(!relative.hostname) relative.unshift('');
				if(relPath[0] !== '') relPath.unshift('');
				if(relPath.length < 2) relPath.unshift('');
				result.pathname = relPath.join('/');
			}
			else {
				result.pathname = relative.pathname;
			}
			result.search = relative.search;
			result.query = relative.query;
			result.host = relative.host || '';
			result.hostname = relative.hostname || relative.host;
			result.port = relative.port;
			if(result.pathname || result.search) {
				var p = result.pathname || '';
				var s = result.search || '';
				result.path = p + s;
			}
			result.slashes = result.slashes || relative.slashes;
			result.href = result.format();
			return result;
		}

		var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/');
		var isRelAbs = (relative.host || 
			relative.pathname && relative.pathname.charAt(0) === '/');
		var mustEndAbs = (isRelAbs || isSourceAbs ||
						(result.host && relative.pathname));
		var removeAllDots = mustEndAbs;
		var srcPath = result.pathname && result.pathname.split('/') || [];
		var relPath = relative.pathname && relative.pathname.split('/') || [];
		var psychotic = result.protocol;

		if(psychotic) {
			result.hostname = '';
			result.port = null;
			if(result.port) {
				if(srcPath[0] === '') {
					srcPath[0] = result.host;
				}
				else {
					srcPath.unshift(result.host);
				}
			}
			result.host = '';
			if(relative.protocol) {
				relative.hostname = null;
				relative.port = null;
				if(relative.host) {
					if(relPath[0] === '') {
						relPath[0] = relative.host;
					}
					else {
						relPath.unshift(relative.host);
					}
				}
				relative.host = null;
			}
			mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
		}

		if(isRelAbs) {
			result.host = (relative.host || relative.host === '') ?
						relative.host : result.host;
			result.hostname = (relative.hostname || relative.hostname === '') ?
						relative.hostname : result.hostname;
			result.search = relative.search;
			result.query = relative.query;
			srcPath = relPath;
		}
		else if(relPath.length) {
			if(!srcPath) {
				srcPath = [];
			}
			srcPath.pop();
			srcPath = srcPath.concat(relPath);
			result.search = relative.search;
			result.query = relative.query;
		}
		else if(!util.isNullOrUndefined(relative.search)) {
			if(psychotic) {
				result.hostname = result.host = srcPath.shift();
			}	
			result.search = relative.search;
			result.query = relative.query;
			if(!util.isNull(result.pathname) || !util.isNull(result.search)) {
				result.path = (result.pathname ? result.pathname : '') +
							  (result.search ? result.search : '');
			}
			result.href = result.format();
			return result;
		}

		if(!srcPath.length) {
			result.pathname = null;
			if(result.search) {
				result.path = '/' + result.search;
			}
			else {
				result.path = null;
			}
			result.href = result.format();
			return result;
		}

		var last = srcPath.slice(-1)[0];
		var hasTrailingSlash = (
			(result.host || relative.host) && (last === '.' || last === '..') ||
			last === '');
		var up = 0;
		for(var i = srcPath.length; i >= 0; i--) {
			last = srcPath[i];
			if(last === '.') {
				srcPath.splice(i, 1);
			}
			else if(last === '..') {
				srcPath.splice(i, 1);
				up++;
			}
			else if(up) {
				srcPath.splice(i, 1);
				up--;
			}
		}

		if(!mustEndAbs && !removeAllDots) {
			for(; up--; up) {
				srcPath.unshift('..');
			}
		}

		if(mustEndAbs && srcPath[0] !== '' &&
			(!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
			srcPath.unshift('');	
		}

		if(hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
			srcPath.push('');
		}

		var isAbsolute = srcPath[0] === '' ||
			(srcPath[0] && srcPath[0].charAt(0) === '/');

		if(psychotic) {
			result.hostname = result.host = isAbsolute ? '' :
											srcPath.length ? srcPath.shift() : '';
		}

		mustEndAbs = mustEndAbs || (result.host && srcPath.length);

		if(mustEndAbs && !isAbsolute) {
			srcPath.unshift('');
		}

		if(!srcPath.length) {
			result.pathname = null;
			result.path = null;
		}
		else {
			result.pathname = srcPath.join('/');	
		}

		if(!util.isNull(result.pathname) || !util.isNull(result.search)) {
			result.path = (result.pathname ? result.pathname : '') +
						  (result.search ? result.search : '');
		}
		result.slashes = result.slashes || relative.slashes;
		result.href = result.format();

		return result;
	}

	function urlParser() {
		
	}

	urlParser.parse = function(url, parseQueryString, slashesDenoteHost) {
		if(url && util.validType(url, 'object') && url instanceof Url) return url;	

		var u = new Url;
		u.parse(url, parseQueryString, slashesDenoteHost);
		return u;
	}

	urlParser.format = function(obj) {
		if(util.validType(obj, 'string')) obj = this.parse(obj);
		if(!(obj instanceof Url)) return Url.prototype.format.call(obj);
		return obj.format();
	}

	urlParser.resolve = function(source, relative) {
		return this.parse(source, false, true).resolve(relative);
	}

	return urlParser;
})(this);
this.urlParser = urlParser;
var TextureParser = (function(root) {
	var util = root.util;
	var extend = util.extend;
	var Request = util.Request;
	var urlParser = root.urlParser;
	var LoaderImage = util.LoaderImage;
	
	var Texture = function(image, options) {
		this.imageElem = image;
		extend(this, options);
	}

	Texture.prototype.find = function(name) {
		if(!util.validType(name, 'string')) {
			throw new Error("find params should be 'string', not : " + typeof name);
		}
		var frames = this.frames;
		if(!frames[name]) {
			return {};
		}
		else {
			return Texture.Frame(name, this, frames[name]);
		}
	}

	Texture.prototype.getImage = function() {
		return this.imageElem;
	}

	Texture.Frame = function(name, texture, options) {
		var obj = {};

		obj.name = name;
		obj.image= texture.imageElem;
		obj.x = options.frame.x;
		obj.y = options.frame.y;
		obj.w = options.frame.w;
		obj.h = options.frame.h;
		obj.rotate = options.rotated;
		obj.trimmed = options.trimmed;
		obj.ox = options.spriteSourceSize.x;
		obj.oy = options.spriteSourceSize.y;
		obj.sx = options.sourceSize.x || 0;
		obj.sy = options.sourceSize.y || 0;
		obj.sw = options.sourceSize.w;
		obj.sh = options.sourceSize.h;

		return obj;
	}

	function TextureCreator(image, options) {
		return new Texture(image, options);	
	}

	var TextureParser = {
	cacheTextures: [],
	__loadImage: function(options, onDone) {
		var me = this;
		var url = urlParser.resolve(options.url, options.image);
		LoaderImage(url, function(imageElem, state) {
			if(!state) {
				var err = new Error('LoaderImage fail');
				onDone(err);
			}
			else {
				var texture = TextureCreator(imageElem, options);
				me.add(url, texture);
				onDone(null, texture);
			}
		});
	},

	load: function(url, onDone) {
		var cache = this.get(url);
		if(cache) {
			setTimeout(function() {
				onDone(null, cache);	
			}, 0);
			return;
		}

		var me = this;
		Request.httpGetJSON(url, function(err, json) {
			if(err) {
				onDone(err);
			}
			else {
				var options = {
					url: url,
					json: json,
					meta: json.meta,
					frames: json.frames,
					image: json.meta.image
				};
				me.__loadImage(options, onDone);
			}
		});
	},

	get: function(url) {
		return this.cacheTextures[url];	
	},

	add: function(url, texture) {
		this.cacheTextures[url] = texture;	
	}
	}

	return TextureParser;
})(this);
this.TextureParser = TextureParser;
var DrawImage = (function(root) {
	DrawImage.STYLE_TILE = 'tile';
	DrawImage.STYLE_SCALE = 'scale';
	DrawImage.STYLE_9PATCH = '9patch';

	function DrawImage() {

	}

	DrawImage.draw = function(canvas, image, x, y, w, h, frame) {
		canvas.beginPath();
		switch(DrawImage.style) {
			case DrawImage.STYLE_TILE: {
				DrawImage.drawTile.apply(null, arguments);
				break;
			}	
			case DrawImage.STYLE_SCALE: {
				DrawImage.drawScale.apply(null, arguments);
				break;
			}
			case DrawImage.STYLE_9PATCH: {
				DrawImage.draw9Patch.apply(null, arguments);
			}
			default: {
				break;
			}
		}

		return;
	}

	DrawImage.drawScale = function(canvas, image, x, y, w, h, frame) {
		var scaleX = w / frame.sw;
		var scaleY = h / frame.sh;
		var dx = x + Math.round(scaleX*frame.ox);
		var dy = y + Math.round(scaleY*frame.oy);
		var dw = frame.w*scaleX;
		var dh = frame.h*scaleY;

		canvas.drawImage(image, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);

		return;
	}

	DrawImage.draw9Patch = function(canvas, image, x, y, w, h, frame) {
		var dx = x + frame.ox;
		var dy = y + frame.oy;
		var dw = w - (frame.sw - frame.w);
		var dh = h - (frame.sh - frame.h);
		
		if(!image) {
			canvas.fillRect(x, y, w, h);
			return;
		}

		if(!frame.w || frame.w > image.width) {
			frame.w = image.width;
		}

		if(!frame.h || frame.h > image.height) {
			frame.h = image.height;
		}

		if(dw <= frame.w || dh <= frame.h) {
			canvas.drawImage(image, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);	
			return;
		}

		var subw = Math.round(frame.w/3);
		var subh = Math.round(frame.h/3);
		var csubw= frame.w - subw - subw;
		var csubh= frame.h - subh - subh;
		var cdw= dw - subw - subw;
		var cdh= dh - subh - subh;	

		//4 corner
		canvas.drawImage(image, frame.x, frame.y, subw, subh, dx, dy, subw, subh);
		canvas.drawImage(image, frame.x+frame.w-subw, frame.y, subw, subh, dx+dw-subw, dy, subw, subh);
		canvas.drawImage(image, frame.x, frame.y+frame.h-subh, subw, subh, dx, dy+dh-subh, subw, subh);
		canvas.drawImage(image, frame.x+frame.w-subw, frame.y+frame.h-subh, subw, subh, dx+dw-subw, dy+dh-subh, subw, subh);

		//left + right
		canvas.drawImage(image, frame.x, frame.y+subh, subw, csubh, dx, dy+subh, subw, cdh);
		canvas.drawImage(image, frame.x+frame.w-subw, frame.y+subh, subw, csubh, dx+dw-subw, dy+subh, subw, cdh);

		//top bottom
		canvas.drawImage(image, frame.x+subw, frame.y, csubw, subh, dx+subw, dy, cdw, subh);
		canvas.drawImage(image, frame.x+subw, frame.y+frame.h-subh, csubw, subh, dx+subw, dy+dh-subh, cdw, subh);

		//middle
		canvas.drawImage(image, frame.x+subw, frame.y+subh, csubw, csubh, dx+subw, dy+subh, cdw, cdh);

		return;
	}

	DrawImage.drawTile = function(canvas, image, x, y, w, h, frame) {
		//TODO	
	}

	return DrawImage;
})(this);
this.DrawImage = DrawImage;
