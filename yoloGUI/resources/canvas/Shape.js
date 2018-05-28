const DRAWING_NONE = "none";

const OBJECT_CAR = "car";
const OBJECT_PERSON = "person";
const OBJECT_BICYCLE = "bicycle";
const OBJECT_MOTORCYCLE = "motorcycle";

const PART_HEAD = "head";
const PART_TORSO = "torso";
const PART_WHEELS_LICENSE = "wheelsAndLicense";
const PART_TWO_WHEELS = "twoWheels";

const OBJECT_STYLE_FONT = "18px Arial bold";
const PART_STYLE_FONT = "14px Arial bold";

const CORNER_SIZE_PIXELS = 6;

function Shape() {}

Shape.isPath = function (shapeType) {

 return (shapeType == PART_WHEELS_LICENSE
        || shapeType == PART_TWO_WHEELS
        || shapeType == PART_TORSO);
}

Shape.isBBox = function (shapeType) {

 return (shapeType == PART_HEAD);
}

Shape.isCarWheels = function (shapeType) {

 return (shapeType == PART_WHEELS_LICENSE);
}


Shape.getPathNumOfPoints = function (label) {

    switch (label) {
        case PART_TWO_WHEELS:
            return 2;
        case PART_TORSO:
            return 4;
        case PART_WHEELS_LICENSE:
            return 5;
        default:
            return 4;
    }

}