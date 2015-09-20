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
