const DRAWING_NONE = "none";
const DRAWING_HEAD = "head";
const DRAWING_TORSO = "torso";
const DRAWING_CARWHEELS = "wheelsAndLicense";

function isShapeAPath(shapeType) {

 return (shapeType == DRAWING_CARWHEELS || shapeType == DRAWING_TORSO);
}

function isShapeABBox(shapeType) {

 return (shapeType == DRAWING_HEAD);
}