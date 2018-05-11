const TOP_LEFT = "topleft";
const TOP_RIGHT = "topright";
const BOTTOM_RIGHT = "bottomright";
const BOTTOM_LEFT = "bottomleft";

// Constructor for Shape objects to hold data for all drawn objects.
// For now they will just be defined as rectangles.
function Shape(x, y, w, h, fill, label) {
  // This is a very simple and unsafe constructor. All we're doing is checking if the values exist.
  // "x || 0" just means "if there is a value for x, use that. Otherwise use 0."
  // But we aren't checking anything else! We could put "Lalala" for the value of x
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;
  this.fill = fill || '#AAAAAA';
  this.label = label || 'label';
  this.resizeCorner = "";
}

// Draws this shape to a given context
Shape.prototype.drawBox = function(ctx) {

  ctx.fillStyle = this.fill;
  ctx.fillRect(this.x, this.y, this.w, this.h);
  ctx.font = "18px Arial bold";
  ctx.fillStyle = "black";
  ctx.fillText(this.label,this.x+5, this.y+18);
}

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
  // check if Mouse X,Y fall in the area between
  // the shape's X and (X + Width) and its Y and (Y + Height)
  return  (this.x <= mx) && (this.x + this.w >= mx) &&
          (this.y <= my) && (this.y + this.h >= my);
}

// Check if Mouse X,Y fall in one of the shape's corners
Shape.prototype.getResizeCorner = function(mx, my) {

  // check for topleft corner
  if (this.x-5 < mx && mx < this.x+5 && this.y-5 < my && my < this.y+5)
	this.resizeCorner = TOP_LEFT;
  // check for topright corner
  else if (this.x+this.w-5 < mx && mx < this.x+this.w+5 && this.y-5 < my && my < this.y+5)
	this.resizeCorner = TOP_RIGHT;
  // check for bottomright corner
  else if (this.x+this.w-5 < mx && mx < this.x+this.w+5 && this.y+this.h-5 < my && my < this.y+this.h+5)
	this.resizeCorner = BOTTOM_RIGHT;
  // check for bottomleft corner
  else if (this.x-5 < mx && mx < this.x+5 && this.y+this.h-5 < my && my < this.y+this.h+5)
	this.resizeCorner = BOTTOM_LEFT;
  else this.resizeCorner = "";
}