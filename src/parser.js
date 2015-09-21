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
