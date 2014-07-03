define([],function(){

	var around=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

	function cell(row,col,alive){
	    var neighbors=[];
	    var me=this;
	    if (alive) alive=1; else alive=0;
	    this.addNeighbor=function(cell){
		if (neighbors.indexOf(cell)==-1) neighbors.push(cell);
	    }
	    this.removeNeighbor=function(cell){
		var neighborIndex=neighbors.indexOf(cell);
		if (neighborIndex>=0)
		    {
			neighbors.splice(neighborIndex,1);
		    }
	    }
	    this.toggleState=function(){if (alive) alive=0; else alive=1;}
	    this.setState=function(val){if (val) alive=1; else alive=0;}
	    this.getState=function(){if (me.random) return Math.floor(Math.random()*4); else return alive;}
	    this.getNeighbors=function(){return neighbors;}
	    this.getCoords=function(){return {row:row,col:col};}
	}

	var KEEP_PREVIOUS_POPULATIONS=5;

	function newlife(cfg){

	    if (!cfg.birthSet) cfg.birthSet={3:true};
	    if (!cfg.stableSet) cfg.stableSet={2:true, 3:true};

	    function cellKey(row,col){return row+"_"+col;}
	    
	    var me=this;
	    var cells={};
	    var boundProps={};
	    this.population=0;
	    this.generation=1;
	    this.stability=0;
	    this.previousPopulations=[];
	    var origStopFunction=null;

	    this.findCenter=function(){
		var center_x=0,center_y=0,listOfCols=[],numCells=0;
		this.eachCell(function(curCell){
			center_x+=curCell.getCoords().col;
			center_y+=curCell.getCoords().row;
			//listOfCols.push(curCell.getCoords().col);
			numCells++;
		    });
		if (this.population){
		    center_x=Math.floor(center_x/numCells);
		    center_y=Math.floor(center_y/numCells);
		}
		return {
		    x:center_x,
		    y:center_y,
		    //cols:listOfCols,
		    nothing:0
		};
	    }
	    
	    this.bind=function(name,element){
		boundProps[name]=element;
	    }

	    this.clear=function(){
		me.population=0;
		me.generation=1;
		me.stability=0;
		me.previousPopulations=[];
		cells={};
		updateBoundProps();
	    }
	    
	    var updateBoundProps=function(){
		for (var el in boundProps){
		    boundProps[el].text(me[el]);
		}
	    }

	    var destabilize=function(){
		if (origStopFunction)
		    {
			this.shouldStopGenerating=origStopFunction;
			this.previousPopulations=[];
			origStopFunction=null;
		    }
	    }

	    this.shouldStopGenerating=function(){
		if (this.previousPopulations.length == KEEP_PREVIOUS_POPULATIONS)
		    {
			origStopFunction=this.shouldStopGenerating;
			this.shouldStopGenerating=function()
			{
			    if (this.stability==0) return true; else return false;
			};
		    }
		return false;  
	    }

	    this.eachCell=function(doFunc){
		var i;
		for (i in cells){
		    doFunc(cells[i]);
		}
	    }

	    this.nextGeneration=function(){
		var oldCells=cells;
		cells={};
		this.previousPopulations.push(this.population);
		if (this.previousPopulations.length > KEEP_PREVIOUS_POPULATIONS)
		    {
			this.previousPopulations.shift();
		    }
		this.stability=this.previousPopulations.variance();
		this.population=0;
		this.generation++; 
		
		function doLife(cell){
		    var row=cell.getCoords().row,col=cell.getCoords().col;
		    var liveNeighbors=0;
		    cell.getNeighbors().forEach(function(neighbor){liveNeighbors+=neighbor.getState();});
		    if (cell.random)
			{
			    placeCell(row,col,cell);
			}
		    else if (cell.getState())
			{
			    if (cfg.stableSet[liveNeighbors])
				{
				    placeCell(row,col,cell);
				}
			}
		    else
			{
			    if (cfg.birthSet[liveNeighbors])
				{
				    placeCell(row,col);
				}
			}
		}
		
		for (var i in oldCells){
		    doLife(oldCells[i]);
		}
		
		
		updateBoundProps();
	    }

	    this.toggleCell=function(row,col){
		if (cells[cellKey(row,col)] && cells[cellKey(row,col)].getState())
		    {
			removeCell(row,col);
		    }
		else
		    {
			placeCell(row,col);
		    }
		destabilize();
		updateBoundProps();
	    }

	    this.setCellRandom=function(row,col, isRandom){
		placeCell(row,col);
		cells[cellKey(row,col)].random=isRandom;
	    }

	    function placeCell(row, col, priorCell){
		var newCell;
		var cell_key=cellKey(row,col);
		if (cells[cell_key] && cells[cell_key].getState()) return;

		if (!cells[cell_key])
		    {

			//create the cell and make it living
			newCell=new cell(row,col,1);
			//place it in the cells hash
			cells[cell_key]=newCell;

			
		    }
		else
		    {
			newCell=cells[cell_key];
			newCell.toggleState();
		    }

		if (priorCell && priorCell.random) newCell.random=true;
		
		me.population++;
			
		//search around the cells hash, creating dead cells where none are found, and add this to their list of neighbors 
		//(possibly just incrementing a neighbor counter)
		around.forEach(function(shiftArray){
			var nRow=row+shiftArray[0];
			var nCol=col+shiftArray[1];
			var neighbor=cells[cellKey(nRow,nCol)];
			if (!neighbor){
			    neighbor=new cell(nRow,nCol,0);
			    cells[cellKey(nRow,nCol)]=neighbor;
			}
			neighbor.addNeighbor(newCell);
			newCell.addNeighbor(neighbor);
		    });
	    }

	    function removeCell(row,col){
		var oldCell=cells[cellKey(row,col)];
		var isDead=function(cell){return !cell.getState();};
		//if I don't exist in the cell object, I'm done
		if (!oldCell) return;
		

		//if I'm on, toggle me to off
		if (oldCell.getState()) 
		    {
			me.population--;
			oldCell.toggleState();

			//if any of my neighbors are dead, and now only adjacent to dead cells, they can be removed
			
			oldCell.getNeighbors().slice().forEach(function(cell){
				var neighborState=cell.getState();
				var neighborIsAlone=false;
				if (!neighborState){
				    neighborIsAlone=cell.getNeighbors().every(isDead);
				}
				if (!neighborState && neighborIsAlone){
				    removeCell(cell.getCoords().row,cell.getCoords().col);
				    oldCell.removeNeighbor(cell);
				}
			    });
		    }

		if (oldCell.getNeighbors().every(isDead)) 
		    {
			delete cells[cellKey(row,col)];
		    }

	    }
	    
	    this.cells=cells;

	}

	return newlife;
    });
