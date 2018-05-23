function loadJsonFile(jsonFile) {

  let url = "/get_json?json_file=" + jsonFile;
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
  let url = "/get_labels";
  getRequestFromServer(url, function(response) {

    if (response == null || response == "")
        alert("Could not retrieve labels! Please contact your project manager.")
    else {
        labelData = JSON.parse(response);

        let jsonBoxLabels = labelData.labels;
        let boxLabelSelect = document.getElementById('selectBoxLabel');
        for (let i=0; i < jsonBoxLabels.length; i++) {
            let option = document.createElement("option");
            option.text = jsonBoxLabels[i].name;
            option.value = jsonBoxLabels[i].value;
            boxLabelSelect.add(option);
        }
        boxLabelSelect.value = "";
    }
  });
}


function getRequestFromServer(url, doneCallback) {

    let xhr = new XMLHttpRequest();
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

  let url = "/save_json?json_file=" + jsonFile + "&json_status=" + status + "&json_text=" + jsonText;
  postRequestToServer(url, function(response) {
    if (response == null || response == "") {
        alert("Could not save the json data for this image. Please contact your project manager.");
    }
  });
}

function updateIssue(issueId, folderId) {

  let url = "/update_issue?issue_id=" + issueId + "&folder_id=" + folderId;
  postRequestToServer(url, function(response) {
    if (response == null || response == "") {
        alert("Could not update the status of your work. Please contact your project manager.")
    }
    else {
        alert("Your issue has been updated! You may now exit the browser.");
    }
  });
}


function postRequestToServer(url, doneCallback) {

  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = handleStateChange;
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send();

  function handleStateChange() {
    if (xhr.readyState === 4) {
        doneCallback(xhr.status == 200 ? xhr.responseText : null);
      }
  }
}


function drawBoxesFromJson(jsonText) {

  myCanvState.clearShapes();

  if(jsonText == null || jsonText == "") {
    return;
  }

  if (myCanvState.bgImg.complete == false) {
    //the image has not been completely loaded.
    //wait for a split-second before trying again.
    setTimeout(function() {drawBoxesFromJson(jsonText)}, 100);
    return;
  }

  try {
    myCanvState.getShapesFromJsonData(jsonText);
  }
  catch (err){
    alert ("An error occurred while trying to draw boxes based on the json file: " + err.message
                + "\nthe json file:\n" + jsonText);
  }
}


function updateJsonFromCanvas(allowEmptyShapes=false) {

  if (myCanvState.shapes && (allowEmptyShapes || myCanvState.shapes.length>0)) {
    // get the current json text
    let jsonText = document.getElementById('jsonContents').textContent;
    // update the json data based on whatever is drawn in canvas
    let jsonData = myCanvState.getJsonDataFromCanvas(jsonText);
    document.getElementById('jsonContents').textContent = JSON.stringify(jsonData);
  }
}