var DrawImage = (function(root) {
	DrawImage.STYLE_TILE = 'tile';
	DrawImage.STYLE_SCALE = 'scale';
	DrawImage.STYLE_9PITCH = '9pitch';

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
			case DrawImage.STYLE_9PITCH: {
				DrawImage.draw9Pitch.apply(null, arguments);
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

	DrawImage.draw9Pitch = function(canvas, image, x, y, w, h, frame) {
		var scaleX = w / frame.sw;
		var scaleY = h / frame.sh;
		var dx = x + Math.round(scaleX*frame.ox);
		var dy = y + Math.round(scaleY*frame.oy);
		var dw = frame.w*scaleX;
		var dh = frame.h*scaleY;
		
		var subw = Math.round(frame.w/3);
		var subh = Math.round(frame.h/3);
		
		var dxw = Math.round(dw/3);
		var dxh = Math.round(dh/3);
		//4 corner
		canvas.drawImage(image, frame.x, frame.y, subw, subh, dx, dy, subw, subh);
		canvas.drawImage(image, frame.x+subw*2, frame.y, subw, subh, dx+dw-subw, dy, subw, subh);
		canvas.drawImage(image, frame.x, frame.y+subh*2, subw, subh, dx, dy+dh-subh, subw, subh);
		canvas.drawImage(image, frame.x+2*subw, frame.y+2*subh, subw, subh, dx+dw-subw, dy+dh-subh, subw, subh);

		//left + right
		canvas.drawImage(image, frame.x, frame.y+subh, subw, subh, dx, dy+subh, subw, dh - 2*subh);
		canvas.drawImage(image, frame.x+subw*2, frame.y+subh, subw, subh, dx+dw-subw, dy+subh, subw, dh - 2*subh);

		//top bottom
		canvas.drawImage(image, frame.x+subw, frame.y, subw, subh, dx+subw, dy, dw - subw*2, subh);
		canvas.drawImage(image, frame.x+subw, frame.y+subh*2, subw, subh, dx+subw, dy+dh-subh, dw - subw*2, subh);

		//middle
		canvas.drawImage(image, frame.x+subw, frame.y+subh, subw, subh, dx+subw, dy+subh, dw-subw*2, dh-subh*2);

		return;
	}

	DrawImage.drawTile = function(canvas, image, x, y, w, h, frame) {
		//TODO	
	}

	return DrawImage;
})(this);
this.DrawImage = DrawImage;
