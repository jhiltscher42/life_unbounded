define([],function(){

Array.prototype.min=function(){
    return this.reduce(function(a,b){return (a<b)?a:b;})
};

Array.prototype.max=function(){
    return this.reduce(function(a,b){return (a>b)?a:b;})
};

Array.prototype.mean=function(){
    return this.reduce(function(a,b){return a+b;})/this.length;
};

Array.prototype.median=function(){
    var sortedCopy=this.slice(0).sort(function(a,b){return a-b;});

    return sortedCopy[Math.floor(sortedCopy.length/2)];
};

Array.prototype.dist=function(){
    return this.reduce(function(Dist,current){
	    if (!(current in Dist))
		{
		    Dist[current]=1;
		}
	    else
		{
		    Dist[current]++;
		}
	    return Dist;
	},{} // initialized with an empty object literal
	);
};

Array.prototype.mode=function(){
    var Dist=this.dist();
    var biggestI=0,biggestVal=0;
    for (var i in Dist)
	{
	    if (Dist[i]>biggestVal)
		{
		    biggestI=i;
		    biggestVal=Dist[i];
		}
	}
    var ret=[];
    for (var i in Dist)
	{
	    if (Dist[i]==biggestVal) ret.push(i);
	}
    return ret;
};
	    
Array.prototype.variance=function(){
    var curMean=this.mean();
    var deviation=this.map(function(cur){
	    return (cur-curMean);
	});
    var sqDev=deviation.map(function(cur){
	    return cur*cur;
	});
    return sqDev.reduce(function(a,b){return a+b})/this.length;
};

Array.prototype.stddev=function(){
    return Math.sqrt(this.variance());
};

return {"statistics":"installed"};
    });
