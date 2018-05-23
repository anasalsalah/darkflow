// TODO: Path and BBox to inherit from abstract class Shape.
function Path(fill, label, parent = null) {

    this.numOfPoints = Shape.getPathNumOfPoints(label);

    this.fill = fill || '#AAAAAA';
    this.label = label || 'label';
    this.points = []; // array to hold the points forming the path
    this.resizeCorner = -1;

    this.children = [];
    this.parent = parent;
    if (this.parent != null)
      this.parent.children.push(this);
}

// common to the Shape parent class
Path.prototype.getX = function() {

    let theX = 999999;
    for (let i=0; i<this.points.length; i++) {
        theX = Math.min(theX, this.points[i].x);
    }
    return theX;
}

// common to the Shape parent class
Path.prototype.getY = function() {

    let theY = 999999;
    for (let i=0; i<this.points.length; i++) {
        theY = Math.min(theY, this.points[i].y);
    }
    return theY;
}

// common to the Shape parent class
Path.prototype.contains = function(mx, my) {
  // check if Mouse X,Y falls in the area inside the shape
  let point = {'x': mx, 'y': my};
  return  isInside (this, point);
}

// common to the Shape parent class
Path.prototype.setResizeCorner = function(mx, my) {

    for (let i=0; i<this.points.length; i++) {
        if (this.points[i].x-5 < mx && mx < this.points[i].x+5
            && this.points[i].y-5 < my && my < this.points[i].y+5) {
            this.resizeCorner = i;
            return;
        }
    }
    this.resizeCorner = -1;
}

// common to the Shape parent class
Path.prototype.resizeMe = function(mx, my) {

    this.points[this.resizeCorner].x = mx;
    this.points[this.resizeCorner].y = my;
}


// common to the Shape parent class
Path.prototype.drawMe = function(ctx) {

    ctx.fillStyle = this.fill;

    if (Shape.isCarWheels(this.label) && this.isComplete()) {
        // draw wheels as a parallelogram
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(let i=1; i<4; i++)
            ctx.lineTo(this.points[i].x, this.points[i].y);
        ctx.fill();
        // draw license plate as a single point
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(this.points[4].x, this.points[4].y, 5, 0, 2 * Math.PI);
        ctx.fill(); ctx.stroke();
    }
    else {
        if (this.numOfPoints > 2) { // fill in shapes
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);

            for(let i=1; i<this.points.length; i++)
                ctx.lineTo(this.points[i].x, this.points[i].y);

            ctx.fill();
        }
        else if (this.points.length == 1) { // path is single point
            ctx.fillRect(this.points[0].x-2, this.points[0].y-2, 4, 4);
        }
        else if (this.points.length == 2) { // path is a line
            ctx.strokeStyle = 'black';
            //draw resize circles on the corners of selected box
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            ctx.lineTo(this.points[1].x, this.points[1].y);
            ctx.fill(); ctx.stroke();
        }
    }

    ctx.font = "12px Arial bold";
    ctx.fillStyle = "black";
    ctx.fillText(this.label, this.points[0].x+10, this.points[0].y+10);
}

// specific to the Path class
Path.prototype.addPoint = function(mx, my) {

    if (!this.isComplete())
        this.points.push({'x':mx, 'y':my});
}

// common to the Shape parent class
Path.prototype.isComplete = function() {

    return this.points.length == this.numOfPoints;
}

// common to the Shape parent class
Path.prototype.setWithinBorders = function(bX, bY, width, height) {

    for(let i=0; i<this.points.length; i++) {

        let point = this.points[i];
        if (point.x < bX) {
            this.dragMe (bX-point.x, 0);
        }
        if (point.y < bY) {
            this.dragMe (0, bY-point.y);
        }
        if (point.x > (bX + width)) {
            this.dragMe (bX + width - point.x, 0);
        }
        if (point.y > bY + height) {
            this.dragMe (0, bY + height - point.y);
        }
    }
}

// common to the Shape parent class
Path.prototype.dragMe = function(x, y) {

    for(let i=0; i<this.points.length; i++) {
        this.points[i].x += x;
        this.points[i].y += y;
    }
}

// common to the Shape parent class
Path.prototype.highlightMe = function(ctx, color, lineWidth) {

    //ctx.strokeStyle = color;
    //ctx.lineWidth = lineWidth;

    for(let i=0; i<this.points.length; i++) {

        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        //draw resize circles on the corners of selected box
        ctx.beginPath();
        ctx.arc(this.points[i].x, this.points[i].y, 5, 0, 2 * Math.PI);
        ctx.fill(); ctx.stroke();
        //draw point numbers
        ctx.font = "12px Arial bold";
        ctx.fillStyle = "black";
        ctx.fillText(i+1, this.points[i].x-5, this.points[i].y-5);
    }
}

// below are geometric functions to calculate if a point is inside a polygon.
// the following code has been copied and adapted to js from:
// https://www.geeksforgeeks.org/how-to-check-if-a-given-point-lies-inside-a-polygon/

// Given three colinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
function onSegment (p, q, r)
{
    if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
        return true;
    return false;
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are colinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p, q, r)
{
    let val = (q.y - p.y) * (r.x - q.x) -
              (q.x - p.x) * (r.y - q.y);

    if (val == 0) return 0;  // colinear
    return ((val > 0)? 1: 2); // clock or counterclock wise
}

// The function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
function doIntersect(p1, q1, p2, q2)
{
    // Find the four orientations needed for general and
    // special cases
    let o1 = orientation(p1, q1, p2);
    let o2 = orientation(p1, q1, q2);
    let o3 = orientation(p2, q2, p1);
    let o4 = orientation(p2, q2, q1);

    // General case
    if (o1 != o2 && o3 != o4)
        return true;

    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;

    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;

    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;

     // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;

    return false; // Doesn't fall in any of the above cases
}

// Returns true if the point p lies inside the polygon[] with n vertices
function isInside(polygon, p)
{
    let n = 0;
    if (Shape.isCarWheels(polygon.label)) //discount license plate from polygon
        n = polygon.numOfPoints -1;
    else
        n = polygon.numOfPoints;
    // There must be at least 3 vertices in polygon[]
    if (n < 3)  return false;

    // Create a point for line segment from p to infinite
    let extreme = {'x': 999999, 'y': p.y};

    // Count intersections of the above line with sides of polygon
    let count = 0, i = 0;
    do
    {
        let next = (i+1)%n;

        // Check if the line segment from 'p' to 'extreme' intersects
        // with the line segment from 'polygon[i]' to 'polygon[next]'
        if (doIntersect(polygon.points[i], polygon.points[next], p, extreme))
        {
            // If the point 'p' is colinear with line segment 'i-next',
            // then check if it lies on segment. If it lies, return true,
            // otherwise false
            if (orientation(polygon.points[i], p, polygon.points[next]) == 0)
               return onSegment(polygon.points[i], p, polygon.points[next]);

            count++;
        }
        i = next;
    } while (i != 0);

    // Return true if count is odd, false otherwise
    return (count%2 == 1);
}