function selectThumbnailImage(thumbIndex, imageFile, jsonFile) {

  //get the contents of the json file for the selected image from the server
  imageContents = document.getElementById('imageContents');
  imageContents.onload = loadJsonFile(jsonFile);
  imageContents.src = imageFile;

  //change class of previously selected thumb to "Done"
  setSelectedImageDone();

  //change class of currently selected thumb to "Selected"
  selectedThumbImg = document.getElementById("thumbImg" + thumbIndex);
  selectedThumbImg.classList.remove("thumb-unselected");
  selectedThumbImg.classList.remove("thumb-done");
  selectedThumbImg.classList.add("thumb-selected");

  myCanvState.deselectShape();
  checkShowDoneButton();
}

function checkShowDoneButton() {

  let thumbImg;
  for (let i=0; i<imagesArrayLength; i++) {
    if(document.getElementById("thumbImg" + i).classList.contains("thumb-unselected"))
      return; // exit if at least one image is still not done yet
  }

  //for loop did not detect any not-done images
  document.getElementById("doneButton").style = "";
}


function setSelectedImageDone() {

  if (selectedThumbImg != null) {
    //save the json data for the current image
    let jsonContents = document.getElementById('jsonContents');
    saveJsonFile(jsonContents.name, jsonContents.textContent);

    selectedThumbImg.classList.remove("thumb-selected");
    selectedThumbImg.classList.add("thumb-done");
  }
}

function selectPreviousImage() {

  let currentId = selectedThumbImg.id;
  let currentIndex = currentId.split("thumbImg")[1];
  let prevIndex = parseInt(currentIndex) - 1;
  let prevThumbImg = document.getElementById("thumbImg" + prevIndex);

  setSelectedImageDone();

  if (prevThumbImg!=null) {
    prevThumbImg.click();
    myCanvState.deselectShape();
  }
}


function selectNextImage() {

  let currentId = selectedThumbImg.id;
  let currentIndex = currentId.split("thumbImg")[1];
  let nextIndex = parseInt(currentIndex) + 1;
  let nextThumbImg = document.getElementById("thumbImg" + nextIndex);

  setSelectedImageDone();

  if (nextThumbImg!=null) {
    nextThumbImg.click();
    myCanvState.deselectShape();
  }
}


function updatedSelectedBoxLabelFromCanvas() {

  let selectLabel = document.getElementById("selectBoxLabel");

  if(myCanvState.selectedShape && myCanvState.selectedShape.label == selectLabel.value)
    return; //no need to do anything since canvas box label matches dropdown value

  if(myCanvState.selectedShape)
    selectLabel.value = myCanvState.selectedShape.label;
  else
    selectLabel.value = "";

  displayAddPartFields(selectLabel.value);
}


function updateSelectedBoxLabel(selectLabel) {

  myCanvState.updateSelectedBoxLabel(selectLabel.value);
  displayAddPartFields(selectLabel.value);
}


function resetSelectPartType() {
    document.getElementById("selectPartType").value = DRAWING_NONE;
    document.getElementById("partInstructions").textContent = "";
}


function updateSelectedPartInstructions(selectPart) {

  myCanvState.setDrawing(selectPart.value);
  let instructions = document.getElementById("partInstructions");

  switch (selectPart.value) {

    case DRAWING_NONE:
      instructions.textContent = "";
      break;
    case PART_HEAD:
      instructions.textContent = "Click and drag to draw a box for the head.";
      break;
    case PART_TORSO:
      instructions.textContent = "Click 4 times on the image in this order: left shoulder, right shoulder, right hip, left hip."
      break;
    case PART_WHEELS_LICENSE:
      instructions.textContent = "Click 5 times on the image in this order: front-left wheel, front-right, back-right, back-left, and finally the front license plate."
      break;
    case PART_TWO_WHEELS:
      instructions.textContent = "Click 2 times on the image in this order: front wheel, back wheel."
      break;
  }
}


function displayAddPartFields(label) {

  selectPart = document.getElementById("selectPartType");

  // remove any existing options
  for(let k=selectPart.options.length-1; k >= 0; k--) {
    selectPart.options.remove(k);
  }
  // add default option and select it
  let option = document.createElement("option");
  option.text = "Add Part";
  option.value = DRAWING_NONE;
  selectPart.add(option);
  selectPart.value = DRAWING_NONE;

  //check if current label has parts and populate dropdown accordingly
  if (labelData && labelData.labels) {
      for (let i=0; i < labelData.labels.length; i++) {
        if (labelData.labels[i].name == label && labelData.labels[i].parts) {
            //display the Add Part dropdown
            selectPart.style.display = "";
            let labelParts = labelData.labels[i].parts
            //add the parts to the dropdown
            for(let j=0; j < labelParts.length; j++) {
                option = document.createElement("option");
                option.text = labelParts[j].name;
                option.value = labelParts[j].name;
                selectPart.add(option);
            }
            return;
        }
      }
  }
  // could not find parts for selected label. hide the parts dropdown.
  selectPart.style.display = "none";
  updateSelectedPartInstructions(selectPart);
}


function buttonDeleteSelectedBox() {

  myCanvState.deleteSelectedShape();
}


function keyboardShortcut() {

  switch (event.keyCode) {

    case 38: // Up arrow
      selectPreviousImage();
      break;
    case 40: // Down arrow
      selectNextImage();
      break;
    case 27: // Escape key
      myCanvState.deselectShape();
      break;
    case 46: // Delete key
      myCanvState.deleteSelectedShape();
      break;
    case 67: // 'c' for car
      selectBoxLabel.value = OBJECT_CAR;
      updateSelectedBoxLabel(selectBoxLabel);
      break;
    case 80: // 'p' for person
      selectBoxLabel.value = OBJECT_PERSON;
      updateSelectedBoxLabel(selectBoxLabel);
      break;
    case 66: // 'b' for bicycle
      selectBoxLabel.value = OBJECT_BICYCLE;
      updateSelectedBoxLabel(selectBoxLabel);
      break;
    case 77: // 'm' for motorcycle
      selectBoxLabel.value = OBJECT_MOTORCYCLE;
      updateSelectedBoxLabel(selectBoxLabel);
      break;
    case 72: // 'h' for head
      selectPartType.value = PART_HEAD;
      updateSelectedPartInstructions(selectPartType);
      break;
    case 84: // 't' for torso
      selectPartType.value = PART_TORSO;
      updateSelectedPartInstructions(selectPartType);
      break;
    case 87: // 'w' for wheels
      selectPartType.value = PART_WHEELS_LICENSE;
      updateSelectedPartInstructions(selectPartType);
      break;
  }
}


function buttonNewBox() {

  myCanvState.addShape(new BBox(50, 50, 50, 50, myCanvState.bboxStyle, 'New'));
}


function displayInfoPopup(popupId) {

  let popup = document.getElementById(popupId);
  popup.classList.toggle("show");
}