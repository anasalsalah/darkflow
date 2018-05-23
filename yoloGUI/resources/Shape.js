const DRAWING_NONE = "none";
const DRAWING_HEAD = "head";
const DRAWING_TORSO = "torso";
const DRAWING_CARWHEELS = "wheelsAndLicense";
const DRAWING_TWOWHEELS = "twoWheels";

function Shape() {}

Shape.isPath = function (shapeType) {

 return (shapeType == DRAWING_CARWHEELS
        || shapeType == DRAWING_TWOWHEELS
        || shapeType == DRAWING_TORSO);
}

Shape.isBBox = function (shapeType) {

 return (shapeType == DRAWING_HEAD);
}

Shape.isCarWheels = function (shapeType) {

 return (shapeType == DRAWING_CARWHEELS);
}


Shape.getPathNumOfPoints = function (label) {

    switch (label) {
        case DRAWING_TWOWHEELS:
            return 2;
        case DRAWING_TORSO:
            return 4;
        case DRAWING_CARWHEELS:
            return 5;
        default:
            return 4;
    }

}