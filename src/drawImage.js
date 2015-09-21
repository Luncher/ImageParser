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
