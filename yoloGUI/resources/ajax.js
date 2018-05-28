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


function postRequestToServer(url, doneCallback, formData=null) {

  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = handleStateChange;
  xhr.open("POST", url, true);
  if (formData == null)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send(formData);

  function handleStateChange() {
    if (xhr.readyState === 4) {
        if (xhr.status == 200) {
            if (doneCallback != null)
                doneCallback(xhr.responseText);
        }
        else
            alert("The server encountered an error:\n" + xhr.responseText)
      }
  }
}


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

// TODO: update json file status to "Done" or "Reviewed"
function saveJsonFile(jsonFile, jsonText) {

  let url = "/save_json?json_file=" + jsonFile + "&json_status=" + status + "&json_text=" + jsonText;
  postRequestToServer(url, null);
}


function updateIssue(issueId, folderId) {

  let url = "/update_issue?issue_id=" + issueId + "&folder_id=" + folderId;
  postRequestToServer(url, function(response) {
        alert(response);
  });
}


function drawBoxesFromJson(jsonText) {

  myCanvState.clearShapes();

  if(jsonText == null || jsonText == "") {
    return;
  }

  if (myCanvState.bgImg.complete == false) {
    //the image has not been completely loaded.
    //wait for a split-second before trying again.
    document.body.style.cursor = "wait";
    setTimeout(function() {drawBoxesFromJson(jsonText)}, 100);
    return;
  }

  document.body.style.cursor = "default";
  try {
    myCanvState.getShapesFromJsonData(jsonText);
  }
  catch (err){
    alert ("An error occurred while trying to draw boxes based on the json file: " + err.message
                + "\nthe json file:\n" + jsonText);
  }
}


function updateJsonFromCanvas() {

  if (myCanvState.shapes && myCanvState.shapes.length>0) {
    // get the current json text
    let jsonText = document.getElementById('jsonContents').textContent;
    // update the json data based on whatever is drawn in canvas
    let jsonData = myCanvState.getJsonDataFromCanvas(jsonText);
    document.getElementById('jsonContents').textContent = JSON.stringify(jsonData);
  }
}