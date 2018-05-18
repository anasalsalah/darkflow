// Original code by Simon Sarris
// www.simonsarris.com / sarris@acm.org / December 2011
// Modified extensively by Anas Al Salah @ globalme.net / May 2018

function CanvasState(canvas, bgImg) {
  // **** First some setup! ****
  this.canvas = canvas;
  this.bgImg = bgImg;
  this.ctx = canvas.getContext('2d');
  // This complicates things a little but it fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  let stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  let html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****

  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // stores the shapes that get drawn on the canvas
  this.drawing = DRAWING_NONE; // keep track of when we are drawing parts
  this.dragging = false; // keep track of when we are dragging
  this.resizing = false; // keep track of when we are resizing
  this.selectedShape = null;
  this.dragStartX = 0; // See mousedown and mousemove events for explanation
  this.dragStartY = 0;

  // **** selected shape drawing options ****
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;
  this.bboxStyle = 'rgba(127, 255, 212, .5)';
  this.pathStyle = 'rgba(127, 0, 212, .3)';
  // interval in milliseconds between each redraw of the canvas
  this.interval = 30;

  // **** Then events! ****

  // This is an example of a closure!
  // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
  // This is our reference!
  let myCanvState = this;

  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);

  // click is for adding torso or carwheels+licensePlate
  canvas.addEventListener('click', function(e) {

    if(myCanvState.selectedShape) {

        let mouse = myCanvState.getMouse(e);
        let mx = mouse.x;
        let my = mouse.y;
        let selectedShape = myCanvState.selectedShape;

        if (isShapeAPath(myCanvState.drawing)) {

            if (selectedShape.parent == null) { // creating a new path for a currently selected box
                let newPath =  new Path(myCanvState.pathStyle, myCanvState.drawing, selectedShape);
                newPath.addPoint(mx, my);
                //add the new shape and set it as selected
                myCanvState.addShape(newPath);
                myCanvState.selectedShape = newPath;
            }
            else { // a path in the process of getting drawn
                selectedShape.addPoint(mx, my);
                if (selectedShape.isComplete()) { // finished drawing the path
                    myCanvState.drawing = DRAWING_NONE;
                    myCanvState.selectedShape = myCanvState.selectedShape.parent;
                    myCanvState.refreshCanvas();
                }
            }
        }
    }
  }, true);

  // Up, down, and move are for dragging or resizing or adding a part that's a bbox
  canvas.addEventListener('mousedown', function(e) {

    if (isShapeAPath(myCanvState.drawing)) // a path is still being drawn
        return;

    if (isShapeABBox(myCanvState.drawing)) { // a part that's a bbox is getting created

        let mouse = myCanvState.getMouse(e);
        let mx = mouse.x;
        let my = mouse.y;

        let bbox = new BBox(mx, my, 0, 0, myCanvState.pathStyle, myCanvState.drawing, myCanvState.selectedShape);
        myCanvState.addShape(bbox);
        myCanvState.selectedShape = bbox;
    }
    else { // check for dragging or resizing
        let mouse = myCanvState.getMouse(e);
        let mx = mouse.x;
        let my = mouse.y;
        let shapes = myCanvState.shapes;
        let event = new Event('updateSelectedBox');

        // give priority to resizing. loop over all shapes to check for corners
        for (let i = shapes.length-1; i >= 0; i--) {

          shapes[i].setResizeCorner(mx, my);
          if (shapes[i].resizeCorner != -1) {
            let mySel = shapes[i];
            myCanvState.resizing = true;
            myCanvState.dragging = false;
            myCanvState.selectedShape = mySel;
            myCanvState.refreshCanvas();
            myCanvState.canvas.dispatchEvent(event);
            return;
          }
        }
        // if user is not resizing, loop over shapes to check if dragging
        for (let i = shapes.length-1; i >= 0; i--) {

          if (shapes[i].contains(mx, my)) {
            let mySel = shapes[i];
            // Keep track of where in the object we clicked
            // so we can move it smoothly (see mousemove)
            myCanvState.dragStartX = mx;
            myCanvState.dragStartY = my;
            myCanvState.dragging = true;
            myCanvState.resizing = false;
            myCanvState.selectedShape = mySel;

            myCanvState.refreshCanvas();
            myCanvState.canvas.dispatchEvent(event);
            return;
          }
        }
        // havent returned means we have failed to select anything.
        // If there was an object selected, we deselect it
        if (myCanvState.selectedShape) {
          myCanvState.dragging = false;
          myCanvState.resizing = false;
          myCanvState.selectedShape = null;
          myCanvState.refreshCanvas(); // Need to clear the old selectedShape border
          myCanvState.canvas.dispatchEvent(event);
        }
    }
  }, true);


  canvas.addEventListener('mousemove', function(e) {

    if (isShapeAPath(myCanvState.drawing)
            && myCanvState.selectedShape.parent != null) { //currently drawing a part that's a path
      myCanvState.refreshCanvas();
    }
    else if (isShapeABBox(myCanvState.drawing)
                && myCanvState.selectedShape.parent != null) { //currently dragging a part that's a bbox

        let mouse = myCanvState.getMouse(e);
        myCanvState.selectedShape.resizeCorner = BOTTOM_RIGHT;
        myCanvState.selectedShape.resizeMe(mouse.x, mouse.y);
        myCanvState.refreshCanvas();
    }
    else if (myCanvState.resizing) {

      let mouse = myCanvState.getMouse(e);
      myCanvState.selectedShape.resizeMe(mouse.x, mouse.y);
      myCanvState.refreshCanvas();
    }
    else if (myCanvState.dragging) {

      let mouse = myCanvState.getMouse(e);
      // move the shape by the number of pixels between where we started to drag and where the mouse is located.
      myCanvState.selectedShape.dragMe(mouse.x - myCanvState.dragStartX, mouse.y - myCanvState.dragStartY);
      // update the drag start coordinates to the current mouse location.
      myCanvState.dragStartX = mouse.x;
      myCanvState.dragStartY = mouse.y;
      myCanvState.refreshCanvas();
    }
  }, true);


  canvas.addEventListener('mouseup', function(e) {

    if (isShapeABBox(myCanvState.drawing)) { //finished drawing a part that's a bbox
        myCanvState.drawing = DRAWING_NONE;
        myCanvState.selectedShape = myCanvState.selectedShape.parent;
        myCanvState.refreshCanvas();
    }
    myCanvState.dragging = false;
    myCanvState.resizing = false;
  }, true);


  // double click for making new shapes
  canvas.addEventListener('dblclick', function(e) {

    let mouse = myCanvState.getMouse(e);
    myCanvState.addShape(new BBox(mouse.x - 10, mouse.y - 10, 50, 50, myCanvState.bboxStyle, 'New'));
  }, true);

  // set the timer for redrawing the canvas.
  setInterval(function() { myCanvState.draw(); }, myCanvState.interval);
}


CanvasState.prototype.addShape = function(shape) {

  this.shapes.push(shape);
  this.refreshCanvas();
}


CanvasState.prototype.clearShapes = function() {

  this.shapes = [];
  this.selectedShape = null;
  this.refreshCanvas();
}


CanvasState.prototype.clearCanvas = function() {

  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {
  // if our state is invalid, redraw and validate!
  if (!this.valid) {

    let ctx = this.ctx;
    let shapes = this.shapes;
    this.clearCanvas();

    // ** Add stuff you want drawn in the background all the time here **
    this.drawBgImage();

    // draw all shapes
    let l = shapes.length;
    for (let i = 0; i < l; i++) {

      let shape = shapes[i];

      // Limit shapes to fall within canvas. Do not allow moving off screen.
      shape.setWithinCanvas(this.canvas.width, this.canvas.height);
      shape.drawMe(ctx);
      if (shape == this.selectedShape)
        shape.highlightMe(ctx, this.selectionColor, this.selectionWidth);
    }

    // ** Add stuff you want drawn on top all the time here **
    this.valid = true;
  }
  else {
    // a new image has been loaded and the canvas still needs to refresh
    if (this.canvas.width==0 || this.canvas.height==0)
        this.valid = false;
  }
}


// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {

  let element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

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


CanvasState.prototype.drawBgImage = function() {

  let img = this.bgImg;
  this.canvas.width = img.width;
  this.canvas.height = img.height;
  this.ctx.drawImage(img,0,0);
}


CanvasState.prototype.refreshCanvas = function() {

  this.valid = false;
  this.canvas.dispatchEvent(new Event('updateCanvas'));
}


CanvasState.prototype.deleteSelectedShape = function() {

  let selectedShape = this.selectedShape;

  for (i=0; i<this.shapes.length; i++) {

     if (this.shapes[i] == selectedShape) {
    	this.shapes.splice(i,1);
    	i--;
     }
     else if (this.shapes[i].parent == selectedShape) {
        this.shapes.splice(i,1);
        i--;
     }
  }
  this.selectedShape = null;
  this.canvas.dispatchEvent(new Event('updateSelectedBox'));
  this.refreshCanvas();
}


CanvasState.prototype.updateSelectedBoxLabel = function(newLabel) {

  if (this.selectedShape && this.selectedShape.parent==null) {
    this.selectedShape.label = newLabel;
    this.refreshCanvas();
  }
  else {
    alert("Please select a bounding box.");
  }
  this.canvas.dispatchEvent(new Event('updateSelectedBox'));
}

CanvasState.prototype.drawBoxesFromJson = function(jsonText) {

    let image = JSON.parse(jsonText).image;
    let boxes = image.boxes;

    if(boxes.length > 0) {
      // disable listening to canvas changes while we are using the json content to update the canvas
      this.canvas.removeEventListener('updateCanvas', updateJsonFromCanvas, true);

      // the ratio of size between the working vs. original image (opposite to updateJsonFromCanvas)
      let wRatio = this.bgImg.width / image.width;
      let hRatio = this.bgImg.height / image.height;

      for (let i=0; i<boxes.length; i++) {
        let box = boxes[i];
        let label = box.label;
        let x = Math.round(box.topleft.x * wRatio);
        let y = Math.round(box.topleft.y * hRatio);
        let w = Math.round(box.bottomright.x * wRatio - x);
        let h = Math.round(box.bottomright.y * hRatio - y);

        let bbox = new BBox(x, y, w, h, this.bboxStyle, label);
        this.addShape(bbox);

        if (box.parts) {

            for (let j=0; j<box.parts.length; j++) {
              let part = box.parts[j];
              let label = part.label;
              if (part.points) { // part is a Path
                let path = new Path(this.pathStyle, label, bbox);
                for (let k=0; k<part.points.length; k++) {
                  point = part.points[k];
                  path.addPoint(point.x * wRatio, point.y * hRatio);
                }
                this.addShape(path);
              }
              else { // part is a BBox
                let x = Math.round(part.topleft.x * wRatio);
                let y = Math.round(part.topleft.y * hRatio);
                let w = Math.round(part.bottomright.x * wRatio - x);
                let h = Math.round(part.bottomright.y * hRatio - y);
                let child_bbox = new BBox(x, y, w, h, this.bboxStyle, label, bbox);
                this.addShape(child_bbox);
              }
            }
        }
      }
      // re-enable listening to canvas changes
      this.canvas.addEventListener('updateCanvas', updateJsonFromCanvas, true);
    }
}


CanvasState.prototype.updateJsonFromCanvas = function(jsonText) {

    if (jsonText == null || jsonText == "") {
        //alert("This image does not have any box data! Any changes will NOT be saved. Please contact your project manager.")
        return;
    }

    let data = JSON.parse(jsonText);
    let image = data.image
    let shapes = myCanvState.shapes;
    image.boxes = [];

    // the ratio of size between the working vs. original image (opposite to drawBoxesFromJson)
    let wRatio = image.width / myCanvState.bgImg.width;;
    let hRatio = image.height / myCanvState.bgImg.height;

    // fill in the new shapes in the json data
    for (let i=0; i<shapes.length; i++) {

      var shape = shapes[i];
      if (shape.parent == null) { // a bounding box
        image.boxes[i] = {};
        let box = image.boxes[i];
        box.label = shape.label;
        box.confidence = 1;
        box.topleft = {}
        box.topleft.x = Math.round(shape.x * wRatio);
        box.topleft.y = Math.round(shape.y * hRatio);
        box.bottomright = {}
        box.bottomright.x = Math.round((shape.x + shape.w) * wRatio);
        box.bottomright.y = Math.round((shape.y + shape.h) * hRatio);

        if (shape.children.length > 0) { // bounding box has parts
            box.parts = [];
            for (let j=0; j<shape.children.length; j++) {
                box.parts[j] = {};
                let child = shape.children[j];
                let part = box.parts[j];
                part.label = child.label;
                if (child instanceof BBox) {
                    part.topleft = {}
                    part.topleft.x = Math.round(child.x * wRatio);
                    part.topleft.y = Math.round(child.y * hRatio);
                    part.bottomright = {}
                    part.bottomright.x = Math.round((child.x + child.w) * wRatio);
                    part.bottomright.y = Math.round((child.y + child.h) * hRatio);
                }
                else if (child instanceof Path) {
                    part.points = [];
                    for (let k=0; k<child.points.length; k++) {
                        let point = child.points[k];
                        part.points[k] = {};
                        part.points[k].x = point.x * wRatio;
                        part.points[k].y = point.y * hRatio;
                    }
                }
            }
        }
      }
    }

    return data;
}