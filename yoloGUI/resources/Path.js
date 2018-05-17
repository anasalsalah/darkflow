

function Path(fill, label) {

    // this.length = numOfPoints;
    this.fill = fill || '#AAAAAA';
    this.label = label || 'label';
    this.points = []; // array to hold the points forming the path

}

Path.prototype.drawMe = function(ctx) {

    ctx.fillStyle = this.fill;

    if (this.points.length == 1) {
        ctx.fillRect(this.points[0].x-2, this.points[0].y-2, 4, 4);
    }
    else {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(let i=1; i<this.points.length; i++)
            ctx.lineTo(this.points[i].x, this.points[i].y);
        ctx.fill();
    }
    ctx.font = "12px Arial bold";
    ctx.fillStyle = "black";
    ctx.fillText(this.label,this.points[0].x-5, this.points[0].y-5);
}
