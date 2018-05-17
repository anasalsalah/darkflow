// Original code by Simon Sarris
// www.simonsarris.com / sarris@acm.org / December 2011
// Modified extensively by Anas Al Salah @ globalme.net / May 2018

const DRAWING_BBOX = "bbox";
const DRAWING_HEAD = "head";
const DRAWING_TORSO = "torso";
const DRAWING_WHEELS = "wheels";
const DRAWING_LICENSE = "licensePlate";

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
  // this.isDispatchUpdateCanvasEvent = true; // used to control dispatching ////////////////////////////////////////
  this.bboxes = [];  // the collection of bounding boxes to be drawn
  this.drawing = DRAWING_BBOX; // draw bounding boxes by default
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
  let myCanvState = this;

  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);

  // click is for adding wheel, torso, and license plate
  canvas.addEventListener('click', function(e) {
    let mouse = myCanvState.getMouse(e);
    let mx = mouse.x;
    let my = mouse.y;
    let bboxes = myCanvState.bboxes;
    let selection = myCanvState.selection;

    if (selection && myCanvState.drawing == DRAWING_LICENSE) {
        let licensePoint =  new Path('rgba(127, 0, 212, .3)', DRAWING_LICENSE);
        licensePoint.points.push({'x':mx, 'y':my});
        selection.shapesWithin.push(licensePoint);

        myCanvState.refreshCanvas();
    }
    /*
    this.drawing == DRAWING_TORSO ||
        this.drawing == DRAWING_WHEELS || */
  }, true);

  // Up, down, and move are for dragging or resizing
  canvas.addEventListener('mousedown', function(e) {
    let mouse = myCanvState.getMouse(e);
    let mx = mouse.x;
    let my = mouse.y;
    let bboxes = myCanvState.bboxes;
    let event = new Event('updateSelectedBox');

    // give priority to resizing. loop over all bboxes to check for corners
    for (let i = bboxes.length-1; i >= 0; i--) {

      bboxes[i].inResizeCorner(mx, my);
      if (bboxes[i].resizeCorner != "") {
        let mySel = bboxes[i];
        myCanvState.resizing = true;
        myCanvState.dragging = false;
        myCanvState.selection = mySel;
        myCanvState.refreshCanvas();
        myCanvState.canvas.dispatchEvent(event);
        return;
      }
    }
    // if user is not resizing, loop over bboxes to check if dragging
    for (let i = bboxes.length-1; i >= 0; i--) {

      if (bboxes[i].contains(mx, my)) {
        let mySel = bboxes[i];
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
      myCanvState.drawing = DRAWING_BBOX;
      myCanvState.refreshCanvas(); // Need to clear the old selection border
      myCanvState.canvas.dispatchEvent(event);
    }
  }, true);


  canvas.addEventListener('mousemove', function(e) {

    if (myCanvState.resizing) {

      let mouse = myCanvState.getMouse(e);
      let mx = mouse.x;
      let my = mouse.y;

      let selection = myCanvState.selection;

      let resizeCorner = selection.resizeCorner;

      let newX, newY, newW, newH;
      // find out from which corner the user is dragging the object,
      // then calculate the new values for the selected shape.
      if (resizeCorner == TOP_LEFT) {
        newX = mx;
        newY = my;
        newW = selection.x - mx + selection.w;
        newH = selection.y - my + selection.h;
      }
      if (resizeCorner == TOP_RIGHT) {
        newX = selection.x;
        newY = my;
        newW = mx - selection.x;
        newH = selection.y - my + selection.h;
      }
      if (resizeCorner == BOTTOM_RIGHT) {
        newX = selection.x;
        newY = selection.y;
        newW = mx - selection.x;
        newH = my - selection.y;
      }
      if (resizeCorner == BOTTOM_LEFT) {
        newX = mx;
        newY = selection.y;
        newW = selection.x - mx + selection.w;
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

      let mouse = myCanvState.getMouse(e);
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


  // double click for making new bboxes
  canvas.addEventListener('dblclick', function(e) {

    let mouse = myCanvState.getMouse(e);
    myCanvState.addShape(new BBox(mouse.x - 10, mouse.y - 10, 50, 50, 'rgba(127, 255, 212, .5)', 'New'));
  }, true);

  // **** Options! ****
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;
  this.interval = 30;
  setInterval(function() { myCanvState.draw(); }, myCanvState.interval);
}


CanvasState.prototype.addShape = function(shape) {

  this.bboxes.push(shape);
  this.refreshCanvas();
}


CanvasState.prototype.clearShapes = function() {

  this.bboxes = [];
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

    let ctx = this.ctx;
    let bboxes = this.bboxes;
    this.clearCanvas();

    // ** Add stuff you want drawn in the background all the time here **
    this.drawImage();

    // draw all bboxes
    let l = bboxes.length;
    for (let i = 0; i < l; i++) {

      let shape = bboxes[i];
      // We can skip the drawing of elements that have moved off the screen:
      if (shape.x > this.canvas.width || shape.y > this.canvas.height ||
          shape.x + shape.w < 0 || shape.y + shape.h < 0) {
          continue;
      }

      // Limit bboxes to fall within canvas. Do not allow moving off screen.
      this.setShapeWithinCanvas(shape);
      shape.drawMe(ctx);
    }

    // draw selection
    // right now this is just a stroke along the edge of the selected BBox
    if (this.selection != null) {

      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      let mySel = this.selection;
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


CanvasState.prototype.drawImage = function() {

  let img = this.bgImg;
  this.canvas.width = img.width;
  this.canvas.height = img.height;
  this.ctx.drawImage(img,0,0);
}


CanvasState.prototype.refreshCanvas = function() {

  this.valid = false;
  this.canvas.dispatchEvent(new Event('updateCanvas'));
}


CanvasState.prototype.deleteSelectedBox = function() {

  for (i=0; i< this.bboxes.length; i++) {

     if (this.bboxes[i] == this.selection) {

    	this.bboxes.splice(i,1);
        this.selection = null;
        this.canvas.dispatchEvent(new Event('updateSelectedBox'));
        this.refreshCanvas();
        break;
     }
  }
}


CanvasState.prototype.updateSelectedBoxLabel = function(newLabel) {

  if (this.selection && this.selection.label) {
    this.selection.label = newLabel;
    this.refreshCanvas();
  }
  else {
    alert("Please select a box in the image.");
  }
  this.canvas.dispatchEvent(new Event('updateSelectedBox'));
}

CanvasState.prototype.drawBoxesFromJson = function(jsonText) {

    let image = JSON.parse(jsonText).image;
    let boxes = image.boxes;

    if(boxes.length > 0) {
      // disable listening to canvas changes while we are using the json content to update the canvas
      this.canvas.removeEventListener('updateCanvas', updateJsonFromCanvas, true);

      // the resolution of the actual image stored on the server
      let trueW = image.width;
      let trueH = image.height;
      // the resolution of the image displayed in the browser
      let workW = this.bgImg.width;
      let workH = this.bgImg.height;
      // the ratio of size between the two images (opposite to updateJsonFromCanvas)
      let wRatio = workW / trueW;
      let hRatio = workH / trueH;

      for (let i=0; i<boxes.length; i++) {
        let label = boxes[i].label;
        let x = Math.round(boxes[i].topleft.x * wRatio);
        let y = Math.round(boxes[i].topleft.y * hRatio);
        let w = Math.round(boxes[i].bottomright.x * wRatio - x);
        let h = Math.round(boxes[i].bottomright.y * hRatio - y);

        let bbox = new BBox(x, y, w, h, 'rgba(127, 255, 212, .5)', label);
        if (boxes[i].parts){
            for (let j=0; j<boxes[i].parts; j++) {
                let part = new Path(boxes[i].parts.points, 'rgba(127, 0, 212, .3)', boxes[i].parts.label)
            }
        }

        this.addShape(bbox);

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
    let bboxes = myCanvState.bboxes;
    image.boxes = [];

    // the resolution of the actual image stored on the server
    let trueW = image.width;
    let trueH = image.height;
    // the resolution of the image displayed in the browser
    let workW = myCanvState.bgImg.width;
    let workH = myCanvState.bgImg.height;
    // the ratio of size between the two images (opposite to drawBoxesFromJson)
    let wRatio = trueW / workW;
    let hRatio = trueH / workH;

    // fill in the new bboxes in the json data
    for (i=0; i<bboxes.length; i++) {

      let shape = bboxes[i];
      let topx = Math.round(shape.x * wRatio);
      let topy = Math.round(shape.y * hRatio);
      let bottomx = Math.round((shape.x + shape.w) * wRatio);
      let bottomy = Math.round((shape.y + shape.h) * hRatio);

      image.boxes[i] = {};
      image.boxes[i].topleft = {}
      image.boxes[i].topleft.x = topx;
      image.boxes[i].topleft.y = topy;
      image.boxes[i].label = shape.label;
      image.boxes[i].confidence = 1;
      image.boxes[i].bottomright = {}
      image.boxes[i].bottomright.x = bottomx;
      image.boxes[i].bottomright.y = bottomy;
    }

    return data;
}