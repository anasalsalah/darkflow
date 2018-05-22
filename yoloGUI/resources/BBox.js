const TOP_LEFT = 0;
const TOP_RIGHT = 1;
const BOTTOM_RIGHT = 2;
const BOTTOM_LEFT = 3;

// TODO: Path and BBox to inherit from abstract class Shape.
function BBox(x, y, w, h, fill, label, parent = null) {
  // This is a very simple and unsafe constructor. All we're doing is checking if the values exist.
  // "x || 0" just means "if there is a value for x, use that. Otherwise use 0."
  // But we aren't checking anything else! We could put "Lalala" for the value of x
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;
  this.fill = fill || '#AAAAAA';
  this.label = label || 'label';
  this.resizeCorner = -1;

  this.children = [];
  this.parent = parent;
  if (this.parent != null)
    this.parent.children.push(this);
}

// common to the Shape parent class
BBox.prototype.getX = function() {
    return this.x;
}

// common to the Shape parent class
BBox.prototype.getY = function() {
    return this.y;
}

// common to the Shape parent class
BBox.prototype.drawMe = function(ctx) {

  ctx.fillStyle = this.fill;
  ctx.fillRect(this.x, this.y, this.w, this.h);
  ctx.font = this.parent ? "12px Arial bold" : "18px Arial bold";
  ctx.fillStyle = "black";
  ctx.fillText(this.label,this.x+5, this.y+18);
}

// common to the Shape parent class
BBox.prototype.contains = function(mx, my) {
  // check if Mouse X,Y fall in the area between
  // the shape's X and (X + Width) and its Y and (Y + Height)
  return  (this.x <= mx) && (this.x + this.w >= mx) &&
          (this.y <= my) && (this.y + this.h >= my);
}

// common to the Shape parent class
BBox.prototype.setResizeCorner = function(mx, my) {

  // check for topleft corner
  if (this.x-5 < mx && mx < this.x+5 && this.y-5 < my && my < this.y+5) {
    this.resizeCorner = TOP_LEFT;
  }
  // check for topright corner
  else if (this.x+this.w-5 < mx && mx < this.x+this.w+5 && this.y-5 < my && my < this.y+5) {
	this.resizeCorner = TOP_RIGHT;
  }
  // check for bottomright corner
  else if (this.x+this.w-5 < mx && mx < this.x+this.w+5 && this.y+this.h-5 < my && my < this.y+this.h+5) {
	this.resizeCorner = BOTTOM_RIGHT;
  }
  // check for bottomleft corner
  else if (this.x-5 < mx && mx < this.x+5 && this.y+this.h-5 < my && my < this.y+this.h+5) {
	this.resizeCorner = BOTTOM_LEFT;
  }
  else {
    this.resizeCorner = -1;
  }
}

// common to the Shape parent class
BBox.prototype.resizeMe = function(mx, my) {

    let resizeCorner = this.resizeCorner;

    let newX, newY, newW, newH;
    // find out from which corner the user is dragging the object,
    // then calculate the new values for the selected shape.
    if (resizeCorner == TOP_LEFT) {
        newX = mx;
        newY = my;
        newW = this.x - mx + this.w;
        newH = this.y - my + this.h;
    }
    if (resizeCorner == TOP_RIGHT) {
        newX = this.x;
        newY = my;
        newW = mx - this.x;
        newH = this.y - my + this.h;
    }
    if (resizeCorner == BOTTOM_RIGHT) {
        newX = this.x;
        newY = this.y;
        newW = mx - this.x;
        newH = my - this.y;
    }
    if (resizeCorner == BOTTOM_LEFT) {
        newX = mx;
        newY = this.y;
        newW = this.x - mx + this.w;
        newH = my - this.y;
    }
    //assign the new values
    this.x = newX;
    this.y = newY;
    this.w = newW;
    this.h = newH;

    // prevent w and h from having negative values
    if (this.w < 0)
        this.w = 20;
    if (this.h < 0)
        this.h = 20;
}

// common to the Shape parent class
BBox.prototype.setWithinBorders = function(bX, bY, width, height) {

  if (this.x < bX) {
    this.x = bX;
  }
  if (this.y < bY) {
    this.y = bY;
  }
  if (this.x + this.w > bX + width) {
    this.x = bX + width - this.w;
  }
  if (this.y + this.h > bY + height) {
    this.y = bY + height - this.h;
  }
}

// common to the Shape parent class
BBox.prototype.dragMe = function(x, y) {

  this.x += x;
  this.y += y;
}

// common to the Shape parent class
BBox.prototype.highlightMe = function(ctx, color, lineWidth) {

    if (this.parent==null) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(this.x,this.y,this.w,this.h);
    }

    //draw resize circles on the corners of selected box
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x + this.w, this.y, 5, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x + this.w, this.y + this.h, 5, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x, this.y + this.h, 5, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
}