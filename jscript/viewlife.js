require(["newlife","camera","jquery.mousewheel","statistics"],function(life,camera){
	
	var cfgOb={SIZE:25};
	var squareWidth=2000/cfgOb.SIZE;
	var squareHeight=2000/cfgOb.SIZE;
	var theBoard=new life(cfgOb);
	window.theBoard=theBoard;
	var movementTick=0;

	var myCamera;

	function boardModel()
	{

	    var cameras=[];
	    var gc;

	    var me=this;

	    this.draw=function(gc,extants){
		theBoard.eachCell(function(cell){
		    var x=squareWidth*cell.getCoords().col;
		    var y=squareHeight*cell.getCoords().row;
		    if (cell.getState() || cell.random)
			{
			    if (cell.random)
				{
				    gc.fillStyle="red";
				}
			    else
				{
				    gc.fillStyle="white";
				}
			}
		    else
			{
			    gc.fillStyle="rgb(0,0,128)";
			}
		    gc.fillRect(x,y,squareWidth,squareHeight);
		    });
	    }
	    this.getExtants=function(){
		return {left:0,right:2000,top:0,bottom:2000};
	    }


	    this.camera=function(cam){
		cameras.push(cam);
	    }

	    function updateView(){
		cameras.forEach(function(cam){cam.modelIsUpdated();});
	    }

	    this.click=function(coords){
		var row=Math.floor(coords.Y/squareHeight);
		var col=Math.floor(coords.X/squareWidth);
		theBoard.toggleCell(row,col);
		updateView();
	    }

	    this.setRandom=function(coords){
		var row=Math.floor(coords.Y/squareHeight);
		var col=Math.floor(coords.X/squareWidth);
		theBoard.setCellRandom(row,col,1);
		updateView();
	    }

	    var animate=false;
	    var animateThread;

	    this.toggleAnimation=function(){
		animate=!animate;
		if (animate){
		    animateThread=setInterval(function(){
			    theBoard.nextGeneration();
			    if (theBoard.shouldStopGenerating()) 
				{
				    clearInterval(animateThread);
				    animate=false;
				}
			    movementTick++;
			    if (!(movementTick % 10))
				{
				    var theBoardCenter=theBoard.findCenter();
				    console.log({X:theBoardCenter.x*squareWidth,Y:theBoardCenter.y*squareHeight});
				    myCamera.setView({center:{X:theBoardCenter.x*squareWidth,Y:theBoardCenter.y*squareHeight}});
				}
			    updateView();
			},10);
		}
		else
		    {
			clearInterval(animateThread);
		    }
	    }

	}

	var myModel=new boardModel();
	

	$(document).ready(function(){
		$("#importForm").find("input[type=submit]").click(function(){
			$("#importForm").css("z-index",-20);
		    });
		myCamera=$("#lifeCam").data("camera");

		

		theBoard.bind("population",$("#population").find(".val"));
		theBoard.bind("generation",$("#generation").find(".val"));
		theBoard.bind("stability",$("#stability").find(".val"));
		myCamera.setModel(myModel);
		myCamera.addHandler(['move'],function(coords,mouse){});
		myCamera.addHandler(['click'],function(coords, mouse){
			if (mouse.button===0)
			    {
				myModel.click(coords);
			    }
			else if (mouse.button===1)
			    {
				console.log(coords);
				myCamera.setView({center:coords});
			    }
		    });
		$("#controls").click(function(ev){
			if (ev.target==this){
				myModel.toggleAnimation();
			}
		})

		$("#zoomOut").click(function(){
			myCamera.zoom(1.4);
		});

		$("#zoomIn").click(function(){
			myCamera.zoom(1/1.4);
		})
		myCamera.addHandler(['rightclick'],function(coords){
			myModel.toggleAnimation();
		    });
		myCamera.addHandler(['mousewheel'],function(coords, wheel){
			wheel.preventDefault();
			if (wheel.delta < 0) 
			    {
				console.log("zoom out");
				myCamera.zoom(1.4);
			    }
			else
			    {
				console.log("zoom in");
				myCamera.zoom(1/1.4);
			    }
		    });
	    });
		


    });
