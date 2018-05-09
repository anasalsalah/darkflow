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
}

// Draws this shape to a given context
Shape.prototype.drawBox = function(ctx) {

  ctx.fillStyle = this.fill;
  ctx.fillRect(this.x, this.y, this.w, this.h);
  ctx.font = "12px Arial";
  ctx.fillStyle = "black";
  ctx.fillText(this.label,this.x, this.y-12);
}

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
  // check if Mouse X,Y fall in the area between
  // the shape's X and (X + Width) and its Y and (Y + Height)
  return  (this.x <= mx) && (this.x + this.w >= mx) &&
          (this.y <= my) && (this.y + this.h >= my);
}

// Check if Mouse X,Y fall in one of the shape's corners
Shape.prototype.inCorner = function(mx, my) {

  // check for topleft corner
  if (this.x-5 < mx && mx < this.x+5 && this.y-5 < my && my < this.y+5)
	return "topleft";
  // check for topright corner
  if (this.x+this.w-5 < mx && mx < this.x+this.w+5 && this.y-5 < my && my < this.y+5)
	return "topright";
  // check for bottomright corner
  if (this.x+this.w-5 < mx && mx < this.x+this.w+5 && this.y+this.h-5 < my && my < this.y+this.h+5)
	return "bottomright";
  // check for bottomleft corner
  if (this.x-5 < mx && mx < this.x+5 && this.y+this.h-5 < my && my < this.y+this.h+5)
	return "bottomleft";
  return "";
}