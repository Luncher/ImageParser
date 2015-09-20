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
