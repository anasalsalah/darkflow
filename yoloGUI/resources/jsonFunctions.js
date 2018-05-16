function loadJsonFile(jsonFile) {

  var url = "/get_json?json_file=" + jsonFile;
  getRequestFromServer(url, function(response) {

    if (response == null || response == "")
        alert("Could not retrieve the boxes data for this image!"
                + "Your changes to this image will NOT be saved. Please contact your project manager.")

    document.getElementById('jsonContents').textContent = response;
    document.getElementById('jsonContents').name = jsonFile;
    drawBoxesFromJson(response);
  });
}

function loadLabelLists() {
  var url = "/get_labels";
  getRequestFromServer(url, function(response) {

    if (response == null || response == "")
        alert("Could not retrieve labels! Please contact your project manager.")
    else {
        var jsonLabels = JSON.parse(response);

        var jsonBoxLabels = jsonLabels.labels.objects;
        var boxLabelSelect = document.getElementById('selectedBoxLabel');
        for (var i=0; i < jsonBoxLabels.length; i++) {
            var option = document.createElement("option");
            option.text = jsonBoxLabels[i].value;
            option.value = jsonBoxLabels[i].value;
            boxLabelSelect.add(option);
        }

        var jsonLandmarkLabels = jsonLabels.labels.landmarks;
        var landmarkLabelSelect = document.getElementById('selectedLandmarkLabel');
        for (var i=0; i<jsonLandmarkLabels.length; i++) {
            var option = document.createElement("option");
            option.text = jsonLandmarkLabels[i].value;
            option.value = jsonLandmarkLabels[i].value;
            landmarkLabelSelect.add(option);
        }

        boxLabelSelect.value = "";
        landmarkLabelSelect.value = "";
    }
  });
}


function getRequestFromServer(url, doneCallback) {

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = handleStateChange;
    xhr.open("GET", url, true);
    xhr.send();

    function handleStateChange() {
        if (xhr.readyState === 4) {
            doneCallback(xhr.status == 200 ? xhr.responseText : null);
        }
    }
}

// TODO: update json file status to "Done" or "Reviewed"
function saveJsonFile(jsonFile, jsonText) {

  var url = "/save_json?json_file=" + jsonFile + "&json_status=" + status + "&json_text=" + jsonText;
  postRequestToServer(url, function(response) {
    if (response == null || response == "") {
        alert("Could not save the json data for this image. Please contact your project manager.")
    }
    else {
        // TODO: place success message somewhere in the page
        //alert(response);
    }
  });
}

function updateIssue(issueId, folderId) {

  var url = "/update_issue?issue_id=" + issueId + "&folder_id=" + folderId;
  postRequestToServer(url, function(response) {
    if (response == null || response == "") {
        alert("Could not update the status of your work. Please contact your project manager.")
    }
    else {
        alert("You're done here! You may now exit the browser.");
    }
  });
}


function postRequestToServer(url, doneCallback) {

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = handleStateChange;
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send(); //xhr.send(jsonText);

  function handleStateChange() {
    if (xhr.readyState === 4) {
        doneCallback(xhr.status == 200 ? xhr.responseText : null);
      }
  }
}


function drawBoxesFromJson(jsonText) {

  myCanvState.clearShapes();

  if(jsonText == null || jsonText == "") {
    //alert("The json data is empty. Cannot draw boxes.");
    return;
  }

  if (myCanvState.bgImg.complete == false) {
    //the image has not been completely loaded.
    //wait for a split-second before trying again.
    setTimeout(function() {drawBoxesFromJson(jsonText)}, 100);
    return;
  }

  try {
    var image = JSON.parse(jsonText).image;
    var boxes = image.boxes;

    if(boxes.length > 0) {
      // disable listening to canvas changes while we are using the json content to update the canvas
      myCanvState.canvas.removeEventListener('updateCanvas', updateJsonFromCanvas, true);

      // the resolution of the actual image stored on the server
      var trueW = image.width;
      var trueH = image.height;
      // the resolution of the image displayed in the browser
      var workW = myCanvState.bgImg.width;
      var workH = myCanvState.bgImg.height;
      // the ratio of size between the two images (opposite to updateJsonFromCanvas)
      var wRatio = workW / trueW;
      var hRatio = workH / trueH;

      for (i=0; i<boxes.length; i++) {
        var label = boxes[i].label;
        var x = Math.round(boxes[i].topleft.x * wRatio);
        var y = Math.round(boxes[i].topleft.y * hRatio);
        var w = Math.round(boxes[i].bottomright.x * wRatio - x);
        var h = Math.round(boxes[i].bottomright.y * hRatio - y);

        myCanvState.addShape(new Shape(x, y, w, h, 'rgba(127, 255, 212, .5)', label));
      }
      // re-enable listening to canvas changes
      myCanvState.canvas.addEventListener('updateCanvas', updateJsonFromCanvas, true);
    }
    document.getElementById('numOfBoxes').textContent = myCanvState.shapes.length;
  }
  catch (err){
    alert ("An error occurred while trying to draw boxes based on the json file: " + err.message);
  }
}


function updateJsonFromCanvas() {

  if (myCanvState.shapes && myCanvState.shapes.length > 0) {
    // get the current json data
    var jsonText = document.getElementById('jsonContents').textContent;

    if (jsonText == null || jsonText == "") {
        //alert("This image does not have any box data! Any changes will NOT be saved. Please contact your project manager.")
        return;
    }

    var data = JSON.parse(jsonText);
    var image = data.image
    var shapes = myCanvState.shapes;
    image.boxes = [];

    // the resolution of the actual image stored on the server
    var trueW = image.width;
    var trueH = image.height;
    // the resolution of the image displayed in the browser
    var workW = myCanvState.bgImg.width;
    var workH = myCanvState.bgImg.height;
    // the ratio of size between the two images (opposite to drawBoxesFromJson)
    var wRatio = trueW / workW;
    var hRatio = trueH / workH;

    // fill in the new shapes in the json data
    for (i=0; i<shapes.length; i++) {

      var shape = shapes[i];
      var topx = Math.round(shape.x * wRatio);
      var topy = Math.round(shape.y * hRatio);
      var bottomx = Math.round((shape.x + shape.w) * wRatio);
      var bottomy = Math.round((shape.y + shape.h) * hRatio);

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
    document.getElementById('jsonContents').textContent = JSON.stringify(data);
    document.getElementById('numOfBoxes').textContent = myCanvState.shapes.length;
  }
  document.getElementById('numOfBoxes').textContent = myCanvState.shapes.length;
}