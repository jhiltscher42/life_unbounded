define([],function(){

function vector(nX,nY)
{
    this.X=nX;
    this.Y=nY;
};

vector.prototype.vectorFromPolar=function(distance,polar)
{
    var x= distance * Math.sin(polar);
    var y= distance * Math.cos(polar);
    return new vector(x,-y);
};

vector.prototype.vectorFromPolarDegrees=function(distance,polar)
{
    return vector.prototype.vectorFromPolar(distance,Math.PI*(polar/180));
};

vector.prototype.divideByScalar=function(nScalar)
{
  return new vector(this.X/nScalar,this.Y/nScalar);
};
    
vector.prototype.addToVector=function(sVector){
    return new vector(this.X+sVector.X,this.Y+sVector.Y);
};

vector.prototype.subtractFromVector=function(sVector){
    return new vector(this.X-sVector.X,this.Y-sVector.Y);
};

vector.prototype.toString=function()
{
    return "{"+this.X+","+this.Y+"}";
}

vector.prototype.rightAngle=function()
{
    //Not sure about this.
    // let's see: 5,0 would be 0,5 -- was east, now is north
    // -5,0 would be 0,-5 -- was west, now is south
    // that's just x'=y y'=x
    // 0,5 would be -5,0 -- was north, now is west
    // 0,-5 would be 5,0 -- was south, now is east
    // ahh, so now it seems we need x'=-y; y'=x;
    // how about...
    // 5,5 (northeast), would be -5,5 (northwest) x'=-y; y'=x;
    // -5,5 (northwest), would be -5,-5 (southwest) x'=-y; y'=x;
    // -5,-5 (southwest), would be 5,-5 (southeast) x'=-y; y'=x;
    // 5,-5 (southeast), would be 5,5 (northeast) x'=-y; y'=x;
    // ok, we still have x'=-y; y'=x;  most general case?
    // 1,5 (northeastish), would be -5,1 (northishwest) x'=-y; y'=x;
    // yup, that seems to do it!
    return new vector(this.Y,-this.X);
};

vector.prototype.multiplyByScalar=function(nScalar)
{
    return new vector(this.X*nScalar,this.Y*nScalar);
};

vector.prototype.getMagnitude=function()
{
    return Math.sqrt((this.X*this.X)+(this.Y*this.Y));
};
    
vector.prototype.getAngle=function()
{
    //perhaps untraditionally, this causes 'north' to be 0, 'east' to be 90, 'south' to be 180 and 'west' to be 270
    //the angle is the arctan of the slope, which is the rise over the run.  obviously, if the run (the X component) is 0, then the slope is undefined, but then the angle is either 0 or 180
    if (!this.X)
	{
	    if (this.Y<=0) return 0;
	    else return 180;
	}
    var slope=-this.Y/this.X;
    var angle=90-Math.atan(slope)/Math.PI*180;
    if (this.X < 0) angle+=180;
    return angle;
};

vector.prototype.cross=function(sVector){
    return this.X*sVector.Y - this.Y*sVector.X;
}

vector.prototype.dot=function(sVector){
    return this.X*sVector.X + this.Y*sVector.Y;
}

vector.prototype.rotate=function(degrees)
{
    while (degrees<0) degrees+=360;
    while (degrees>360) degrees-=360;
    if (degrees==270)
	{
	    return this.rightAngle();
	}
    if (degrees==180)
	{
	    return this.multiplyByScalar(-1);
	}
    if (degrees==90)
	{
	    return this.rightAngle().multiplyByScalar(-1);
	}
    var newMagnitude=this.getMagnitude();
    var newAngle=this.getAngle()+degrees;
    while (newAngle<0) newAngle+=360;
    while (newAngle>360) newAngle-=360;
    //    console.log("angle -> "+newAngle+", size -> "+newMagnitude);
    return vector.prototype.vectorFromPolarDegrees(newMagnitude,newAngle);
}

return vector;
});
