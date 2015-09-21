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
