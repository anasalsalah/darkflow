// Original code by Simon Sarris
// www.simonsarris.com
// sarris@acm.org
// Last update December 2011
// Free to use and distribute at will
// So long as you are nice to people, etc

function CanvasState(canvas, bgImg) {
  // **** First some setup! ****
  this.canvas = canvas;
  this.bgImg = bgImg;
  this.ctx = canvas.getContext('2d');
  // This complicates things a little but it fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****

  this.valid = false; // when set to false, the canvas will redraw everything
  // this.isDispatchUpdateCanvasEvent = true; // used to control dispatching ////////////////////////////////////////
  this.shapes = [];  // the collection of things to be drawn
  this.dragging = false; // keep track of when we are dragging
  this.resizing = false; // keep track of when we are resizing
  // the currently selected object. In the future we could turn this into an array for multiple selection
  this.selection = null;
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;

  // **** Then events! ****

  // This is an example of a closure!
  // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
  // This is our reference!
  var myCanvState = this;

  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);


  // Up, down, and move are for dragging or resizing
  canvas.addEventListener('mousedown', function(e) {
    var mouse = myCanvState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var shapes = myCanvState.shapes;
    var event = new Event('updateSelectedBox');

    // give priority to resizing. loop over all shapes to check for corners
    for (var i = shapes.length-1; i >= 0; i--) {

      shapes[i].getResizeCorner(mx, my);
      if (shapes[i].resizeCorner != "") {
        var mySel = shapes[i];
        myCanvState.resizing = true;
        myCanvState.dragging = false;
        myCanvState.selection = mySel;
        myCanvState.refreshCanvas();
        myCanvState.canvas.dispatchEvent(event);
        return;
      }
    }
    // if user is not resizing, loop over shapes to check if dragging
    for (var i = shapes.length-1; i >= 0; i--) {

      if (shapes[i].contains(mx, my)) {
        var mySel = shapes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myCanvState.dragoffx = mx - mySel.x;
        myCanvState.dragoffy = my - mySel.y;
        myCanvState.dragging = true;
        myCanvState.resizing = false;
        myCanvState.selection = mySel;

        myCanvState.refreshCanvas();
        myCanvState.canvas.dispatchEvent(event);
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (myCanvState.selection) {
      myCanvState.dragging = false;
      myCanvState.resizing = false;
      myCanvState.selection = null;
      myCanvState.refreshCanvas(); // Need to clear the old selection border
      myCanvState.canvas.dispatchEvent(event);
    }
  }, true);


  canvas.addEventListener('mousemove', function(e) {

    if (myCanvState.resizing) {

      var mouse = myCanvState.getMouse(e);
      var selection = myCanvState.selection;
      var resizeCorner = selection.resizeCorner;
      var newX, newY, newW, newH;
      // find out from which corner the user is dragging the object,
      // then calculate the new values for the selected shape.
      if (resizeCorner == TOP_LEFT) {
        newX = mouse.x;
        newY = mouse.y;
        newW = selection.x - mouse.x + selection.w;
        newH = selection.y - mouse.y + selection.h;
      }
      if (resizeCorner == TOP_RIGHT) {
        newX = selection.x;
        newY = mouse.y;
        newW = mouse.x - selection.x;
        newH = selection.y - mouse.y + selection.h;
      }
      if (resizeCorner == BOTTOM_RIGHT) {
        newX = selection.x;
        newY = selection.y;
        newW = mouse.x - selection.x;
        newH = mouse.y - selection.y;
      }
      if (resizeCorner == BOTTOM_LEFT) {
        newX = mouse.x;
        newY = selection.y;
        newW = selection.x - mouse.x + selection.w;
        newH = mouse.y - selection.y;
      }
      //assign the new values
      selection.x = newX;
      selection.y = newY;
      selection.w = newW;
      selection.h = newH;
      myCanvState.refreshCanvas(); // Something's resizing so we must redraw
    }
    if (myCanvState.dragging) {

      var mouse = myCanvState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      myCanvState.selection.x = mouse.x - myCanvState.dragoffx;
      myCanvState.selection.y = mouse.y - myCanvState.dragoffy;
      myCanvState.refreshCanvas(); // Something's dragging so we must redraw
    }
  }, true);


  canvas.addEventListener('mouseup', function(e) {

    myCanvState.dragging = false;
    myCanvState.resizing = false;
  }, true);


  // double click for making new shapes
  canvas.addEventListener('dblclick', function(e) {

    var mouse = myCanvState.getMouse(e);
    myCanvState.addShape(new Shape(mouse.x - 10, mouse.y - 10, 50, 50, 'rgba(0,255,0,.6)', 'New'));
  }, true);

  // **** Options! ****
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;
  this.interval = 30;
  setInterval(function() { myCanvState.draw(); }, myCanvState.interval);
}


CanvasState.prototype.addShape = function(shape) {

  this.shapes.push(shape);
  this.refreshCanvas();
}


CanvasState.prototype.clearShapes = function() {

  this.shapes = [];
  this.selection = null;
  this.refreshCanvas();
}


CanvasState.prototype.clearCanvas = function() {

  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}


CanvasState.prototype.setShapeWithinCanvas = function(shape) {

  if (shape.x < 0) {
    shape.x = 0;
    this.refreshCanvas();
  }
  if (shape.y < 0) {
    shape.y = 0;
    this.refreshCanvas();
  }
  if (shape.x + shape.w > this.canvas.width) {
    shape.x = this.canvas.width - shape.w;
    this.refreshCanvas();
  }
  if (shape.y + shape.h > this.canvas.height) {
    shape.y = this.canvas.height - shape.h;
    this.refreshCanvas();
  }
}


// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {
  // if our state is invalid, redraw and validate!
  if (!this.valid) {

    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clearCanvas();

    // ** Add stuff you want drawn in the background all the time here **
    this.drawImage();

    // draw all shapes
    var l = shapes.length;
    for (var i = 0; i < l; i++) {

      var shape = shapes[i];
      // We can skip the drawing of elements that have moved off the screen:
      if (shape.x > this.canvas.width || shape.y > this.canvas.height ||
          shape.x + shape.w < 0 || shape.y + shape.h < 0) {
          continue;
      }

      // Limit shapes to fall within canvas. Do not allow moving off screen.
      this.setShapeWithinCanvas(shape);
      shape.drawBox(ctx);
    }

    // draw selection
    // right now this is just a stroke along the edge of the selected Shape
    if (this.selection != null) {

      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      var mySel = this.selection;
      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);

      //draw resize circles on the corners of selected box
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(mySel.x, mySel.y, 5, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(mySel.x + mySel.w, mySel.y, 5, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(mySel.x + mySel.w, mySel.y + mySel.h, 5, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(mySel.x, mySel.y + mySel.h, 5, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }

    // ** Add stuff you want drawn on top all the time here **
    this.valid = true;
  }
}


// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {

  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}


CanvasState.prototype.drawImage = function() {

  var img = this.bgImg;
  this.canvas.width = img.width;
  this.canvas.height = img.height;
  this.ctx.drawImage(img,0,0);
}


CanvasState.prototype.refreshCanvas = function() {

  this.valid = false;
  this.canvas.dispatchEvent(new Event('updateCanvas'));
}


CanvasState.prototype.deleteSelectedBox = function() {

  for (i=0; i< this.shapes.length; i++) {

     if (this.shapes[i] == this.selection) {

    	this.shapes.splice(i,1);
        this.selection = null;
        this.canvas.dispatchEvent(new Event('updateSelectedBox'));
        this.refreshCanvas();
        break;
     }
  }
}


CanvasState.prototype.updateSelectedBoxLabel = function(newLabel) {

  this.selection.label = newLabel;
  this.canvas.dispatchEvent(new Event('updateSelectedBox'));
  this.refreshCanvas();
}