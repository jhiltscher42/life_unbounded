define(["require","vector","jquery","jquery.mousewheel"],function(require,vector,$){

	//for camera to be happy with the model passed to it, it needs to expose 
	//.draw(gc,extants), 
	//and optionally .getExtants() returns {left:, top:, right:, bottom:}
	//               .camera(cam)
	//               .unCamera(cam)

    if (!window.console) console={};
    if (!console.log) console.log=function(){};

    var lastEvt={offsetX:0,offsetY:0};

    function isFunction(testOb) {return "function"==typeof testOb};

    function distance(x1,y1,x2,y2)
    {
	var xmag=x1-x2;
	var ymag=y1-y2;
	return Math.sqrt(xmag*xmag+ymag*ymag);
    };

    function blessEventCoords(evt)
    {
	lastEvt=evt;
	if (("undefined" == typeof evt.offsetX) || 
	    ("undefined" == typeof evt.offsetY))
	    {
		evt.offsetX=evt.layerX;
		evt.offsetY=evt.layerY;
	    }	
    }


    function makeCameraHandler(conf){
	if ("handle" in conf){
	    return function(evt,delta){
		try{
		    var targetCamera=$("#"+this.id.substr(7)).data("camera");
		    if (targetCamera==null) throw {err:"no cam on canvas "+this.id};
		    if (!targetCamera.translateCoords || !isFunction(targetCamera.translateCoords)){
			throw {err:"invalid camera ob on canvas "+this.id};
		    }
		    blessEventCoords(evt);
		    var modelCoords=targetCamera.translateCoords(evt.offsetX,evt.offsetY);
		    if (delta) evt.delta=delta;
		    return conf.handle(targetCamera,modelCoords,evt);
		}
		catch(e){console.log(evt); console.log(JSON.stringify(e)); return e;}
	    }
	}
	else{ 
	    throw {err:"no handle routine specified"};
	}
    }

    try{
	//click handler section
    var cameraClickHandler=makeCameraHandler(
	  {
	      handle:function(targetCamera,coords,evt){
		  //		  console.log("camera "+targetCamera.id+" clicked at "+coords);
		  targetCamera.click(coords,evt);
	      }
	  });

    var cameraRightClickHandler=makeCameraHandler(
	  {
	      handle:function(targetCamera,coords,evt){
		  targetCamera.rightclick(coords,evt);
		  return false;
	      }
	  });

    var cameraMouseMoveHandler=makeCameraHandler(
					  {
					      handle:function(targetCamera,coords,evt){
						  targetCamera.mousemove(coords,evt);
					      }
					  });
    var cameraMouseUpHandler=makeCameraHandler(
					  {
					      handle:function(targetCamera,coords,evt){
						  targetCamera.mouseup(coords,evt);
					      }
					  });
    var cameraMouseDownHandler=makeCameraHandler(
					  {
					      handle:function(targetCamera,coords,evt){
						  targetCamera.mousedown(coords,evt);
					      }
					  });
    var cameraMouseWheelHandler=makeCameraHandler(
					  {
					      handle:function(targetCamera,coords,evt){
						  targetCamera.mousewheel(coords,evt);
					      }
					  });
    }
    catch(e){
	console.log(e);
    }

		
	
    function camera(camCanvas){
	var model=null;
	var me=this;
	var gc;//=camCanvas[0].getContext('2d');
	//	gc.camId=camCanvas[0].id;
	var cursor_gc;

	var canvasWidth=camCanvas.width();
	var canvasHeight=camCanvas.height();

	//can we *make* the cursor canvas here?
	$(document).ready(function(){
		canvasWidth=camCanvas.attr("camWidth") || 250;
		canvasHeight=camCanvas.attr("camHeight") || 250;
		
		var drawHtml="<canvas width="+canvasWidth+" height="+canvasHeight+" id='draw_"+camCanvas[0].id+"' class='drawCanvas' style='width:100%; height:100%; background-color:black; top:0; left:0; position:absolute'>";
		var cursorHtml="<canvas width="+canvasWidth+" height="+canvasHeight+" id='cursor_"+camCanvas[0].id+"' style='top:0; left:0; width:100%; height:100%; position: absolute;'></canvas>";

		camCanvas.append(drawHtml);
		camCanvas.append(cursorHtml);

		gc=camCanvas.find(".drawCanvas")[0].getContext('2d');
		var cursorCanvas=$("#cursor_"+camCanvas[0].id);
		//cursorCanvas.offset($("#"+camCanvas[0].id).position());
		me.cursorEl=cursorCanvas;

		cursorCanvas.click(cameraClickHandler)
		    .mousemove(cameraMouseMoveHandler)
		    .mouseup(cameraMouseUpHandler)
		    .mousedown(cameraMouseDownHandler)
		    .mousewheel(cameraMouseWheelHandler)
		    .bind("contextmenu",cameraRightClickHandler);



		cursor_gc=cursorCanvas[0].getContext('2d');
	    });
	
	var cursorExtants=null,showCursorFlag=false;

	var viewLeft=0,viewRight=2000,viewTop=0,viewBottom=2000;
	var handlers=[];

	var notifyTargets=[];

	var cursorWidth=2;

	var updateCursor=function(){
	    if (!cursor_gc) return;
	    cursor_gc.clearRect(viewLeft,viewTop,viewRight-viewLeft,viewBottom-viewTop);
	    cursor_gc.lineWidth=cursorWidth;
	    cursor_gc.strokeStyle="rgb(0,255,255)";
	    if (cursorExtants && showCursorFlag){
		cursor_gc.beginPath();
		cursor_gc.rect(cursorExtants.left,cursorExtants.top,cursorExtants.right-cursorExtants.left,cursorExtants.bottom-cursorExtants.top);
		cursor_gc.stroke();
		//console.log("drawing cursor at "+cursorExtants);
	    }
	}

	this.setCursorWidth=function(width){
	    cursorWidth=width;
	}

	this.moveCursor=function(newExtants){
	    cursorExtants=newExtants;
	    if (!showCursorFlag){
		if (cursorExtants) showCursorFlag=true;  //if moveCursor is called, automatically showCursor if it isn't shown.
	    }
	    updateCursor();
	}
	this.moveCursor.help={help:"moveCursor(newExtants) moves the cursor to the newExtants={left,right,top,bottom}, activating it if it's not on already"};
	
	this.hideCursor=function(){
	    showCursorFlag=false;
	    updateCursor();
	}
	this.hideCursor.help={help:"causes the cursor to be hidden"}

	this.showCursor=function(){
	    showCursorFlag=true;
	    updateCursor();
	}
	this.showCursor.help={help:"causes the cursor to be drawn at it's current coordinates"};

	this.addNotify=function(target){
	    if (target.notify) notifyTargets.push(target);
	    else throw {err:"object needs notify method"};
	}
	this.addNotify.help={help:"addNotify(target) adds target to the list of objects to be .notify()ed when the camera's view is updated"};

	this.removeNotify=function(target){
	    notifyTargets=notifyTargets.filter(function(f){return f!==target;});
	}
	this.removeNotify.help={help:"removeNotify(target) removes target from the list of objects to be notified of camera changes"};

	this.addHandler=function(type,handler){
	    type.forEach(function(t){
		    //console.log("pushing "+t);
		    handlers.push({type:t,handler:handler});
		});
	    return me;
	}
	this.addHandler.help={help:"addHandler(type,handler) adds a handler(coords,evt) to handle events of 'type' type.  valid types are 'click','mousemove','mouseup','mousedown', 'mousemove', and 'mousewheel'"};

	this.supercedeHandler=function(type,superceder){
	    var superceded=handlers.filter(function(el){
		    if (el.type==type) return true;
		    else return false;
		});
	    me.removeHandler(type);
	    superceded.forEach(function(handler){
		    me.addHandler([type],superceder(handler));
		});
	}
	
	this.supercedeHandler.help={help:"supercedeHandler(type,superceder) replaces existing handlers of 'type' type with the returned function of superceder(handler)"};
	
	this.removeHandler=function(type,handler){
	    handlers=handlers.filter(function(el){
		    if (!type) return false;  //if type is falsy, removeHandler removes everything.
		    if (!handler && el.type==type) return false;  //if handler is falsy, remove handler removes el.type==type
		    if (handler==el.handler && el.type==type) return false;  //if both exist, only remove when both are equal
		    return true;});  //leave all the rest
	}
	this.removeHandler.help={help:"removeHandler([type],[handler]): if removeHandler() is called without arguments, it removes all handlers.  if it's called with just one argument, it removes all handlers of that type.  If both are specified, only that specific case is removed."};
	
	var handle=function(type,coords,evt){
	    handlers.filter(function(el){return el.type==type}).forEach(function(el){
		    try
			{
			    el.handler(coords,evt);
			}
		    catch(e){
			console.log(e+":"+e.stack+" in handler '"+type+"' with coords="+coords.toString());
		    }
		});
	    return false;
	}

	var eventsHelp={help:"calling will cause this to trigger the associated event handlers"};		      
			      
	this.click=function(coords,evt){
	    return handle('click',coords,evt);
	}
	this.click.help=eventsHelp;

	this.rightclick=function(coords,evt){
	    return handle('rightclick',coords,evt);
	}
	this.rightclick.help=eventsHelp;

	this.mousedown=function(coords,evt){
	    return handle('mousedown',coords,evt);
	}
	this.mousedown.help=eventsHelp;

	this.mouseup=function(coords,evt){
	    return handle('mouseup',coords,evt);
	}
	this.mouseup.help=eventsHelp;

	this.mousewheel=function(coords,evt){  //this needs evt to get to the mouse wheel var
	    return handle('mousewheel',coords,evt);
	}
	this.mousewheel.help=eventsHelp;

	this.mousemove=function(coords,evt){
	    return handle('mousemove',coords,evt);
	}
	this.mousemove.help=eventsHelp;

	var updateView=function(){
	    //console.log("update");
	    if (gc){
		canvasWidth=gc.canvas.width;
		canvasHeight=gc.canvas.height;
		  gc.setTransform(1,0,0,1,0,0);
		if (model && !model.handlesEraseCamera) {
		  gc.clearRect(0,0,gc.canvas.width,gc.canvas.height);
		}
		  if (cursor_gc) cursor_gc.setTransform(1,0,0,1,0,0);

		  var originDistanceX=(-viewLeft)*canvasWidth/(viewRight-viewLeft);
		  var originDistanceY=(-viewTop)*canvasHeight/(viewBottom-viewTop);;
  
		  gc.translate(originDistanceX, originDistanceY);
		  if (cursor_gc) cursor_gc.translate(originDistanceX, originDistanceY);

		  gc.scale(canvasWidth /(viewRight-viewLeft),
			    canvasHeight/(viewBottom-viewTop));
		  if (cursor_gc) cursor_gc.scale(canvasWidth /(viewRight-viewLeft),
						 canvasHeight/(viewBottom-viewTop));
	    }

	    if (model && model.draw && gc){
		model.draw(gc, {left:viewLeft,right:viewRight,top:viewTop,bottom:viewBottom});
	    }
	    if (showCursorFlag){
		updateCursor();
	    }
	    notifyTargets.forEach(function(target){target.notify(me)});
	    //console.log("update done");
	}

	this.id=camCanvas[0].id;
	this.cam_id=++camera.prototype.nextCamId;
	this.translateCoords=function(canvas_x,canvas_y)
	    {
		
		var scalex=(viewRight-viewLeft)/me.cursorEl.width();
		var scaley=(viewBottom-viewTop)/me.cursorEl.height();
		
		return new vector(viewLeft+(canvas_x*scalex),viewTop+(canvas_y*scaley));
	    }

	this.getLastCoords=function(evt){
	    console.log(lastEvt);

	    return me.translateCoords(lastEvt.offsetX,lastEvt.offsetY);
	}

	this.setModel=function(M){
	    if (model && model.unCamera) {model.unCamera(me);} 
	    model=M; 
	    if (model && model.camera) {model.camera(me);}
	    me.setView();
	    return me;
	}
	this.setModel.help={help:"sets the model the camera views, informing the model that it is being viewed by this camera, so that the model can send update calls.  If a model was being viewed, that model is informed that this camera is no longer viewing it."}

	this.toString=function(){var f=0; return this.getView().toString()}
 
	this.modelIsUpdated=function()
	{
	    updateView();
	    return me;
	}
	this.modelIsUpdated.help={help:"causes an update of the view to happen, returns the camera"};

	this.setView=function(viewOb){
	    if (!viewOb){
		if (model && model.getExtants){
		    var extants=model.getExtants();
		    viewLeft=extants.left;
		    viewRight=extants.right;
		    viewTop=extants.top;
		    viewBottom=extants.bottom;
		}
		else{viewLeft=0;viewRight=2000;viewTop=0;viewBottom=2000;}
	    }
	    else if ("center" in viewOb){
		if ((!("width"  in viewOb)) && 
		    (!("height" in viewOb))){
		    viewOb.width=viewRight-viewLeft;
		    viewOb.height=viewBottom-viewTop;
		}
		else if (("width" in viewOb) && (!("height" in viewOb)))
		    {
			viewOb.height=(viewBottom-viewTop) * (viewOb.width/(viewRight-viewLeft));
		    }
		else if (("height" in viewOb) && (!("width" in viewOb)))
		    {
			viewOb.width=(viewRight-viewLeft) * (viewOb.height/(viewBottom-viewTop));
		    }

		viewLeft=  viewOb.center.X-(viewOb.width/2);
		viewRight= viewOb.center.X+(viewOb.width/2);
		viewTop=   viewOb.center.Y-(viewOb.height/2);
		viewBottom=viewOb.center.Y+(viewOb.height/2);
	    }
	    else if ("extants" in viewOb)
		    {
			viewLeft=viewOb.extants.left;
			viewRight=viewOb.extants.right;
			viewTop=viewOb.extants.top;
			viewBottom=viewOb.extants.bottom;
		    }

	    updateView();
	    return me;
	}
	this.setView.help={help:["setView()->resets to model extants","setView({extants:{left: ,top: ,right: ,bottom:}}) -> sets to view given, if possible.","setView({center:new vector(x,y),[width:],[height:])->centers camera, optionally rezooming."]};

	this.pan=function(shiftx,shifty){
	    viewLeft+=shiftx;
	    viewRight+=shiftx;
	    viewTop+=shifty;
	    viewBottom+=shifty;
	    updateView();
	    return me;
	}
	this.pan.help={help:"pan(shiftx,shifty) moves the viewpoint relative to current"};

	this.zoom=function(zoomMult){
	    if (zoomMult<=0) return {err:"bad zoom"};
	    var range=new vector(viewRight-viewLeft,viewBottom-viewTop);
	    var center=new vector((viewLeft+viewRight)/2,(viewTop+viewBottom)/2);
	    range=range.multiplyByScalar(zoomMult);
	    var lefttop=center.addToVector(range.divideByScalar(-2));
	    var rightbottom=center.addToVector(range.divideByScalar(2));
	    viewLeft=lefttop.X;
	    viewTop=lefttop.Y;
	    viewRight=rightbottom.X;
	    viewBottom=rightbottom.Y;
	    updateView();
	    return me;
	}
	this.zoom.help={help:"zoom(zoomFactor) zooms around the current center.  between 0 and 1 zooms in, greater than 1 zooms out.  (multiply the current size of the window by zoomFactor)"};

	this.getView=function(){
	    return {left:viewLeft,right:viewRight,top:viewTop,bottom:viewBottom,
		    toString:function(){return "{{"+this.left+","+this.top+"} to {"+this.right+","+this.bottom+"}}";}};
	}
	this.getView.help={help:"returns the extants of this camera in {left,right,top,bottom,toString()} format"};

	updateView();


};

    camera.prototype.nextCamId=0;
    camera.prototype.help={help:"exposes setView(), setModel(), pan(shiftx,shifty), zoom(zoomMult), getView(), modelIsUpdated(), click(coords,evt), mousedown(coords,evt), mouseup(coords,evt), mousewheel(coords, evt), mousemove(coords,evt), addNotify(notifyObject), removeNotify(notifyObject), addHandler(type,handler), removeHandler(type, handler), showCursor(), hideCursor(), moveCursor(rectangle) "};
	

    $(document).ready(function(){
	    //init code here
	    var cameras=$(".camera");
	    cameras.each(
			 function(index,el){
			     var theElement=$(el);
			     if (theElement.css('position')!='relative')
				 {
				     theElement.css('position','relative');
				 }
			     theElement.data("camera",new camera(theElement));
			 });
		
	    $(window).resize(function(ev){
		    cameras.each(function(index,el){
			    var cam=$("#"+el.id).find(".drawCamera");
			    var curCam=$("#cursor_"+el.id);
			    var keepHeight=$(el).attr("keepHeight");
			    var keepAspect=$(el).attr("keepAspect");
			    if (!keepAspect) keepAspect=16/9;
			    if (keepHeight)
				{
				    if (keepHeight.indexOf("%")!=-1){
					keepHeight=keepHeight.replace("%","");
					cam.height($(window).height()*keepHeight/100);
					cam.width(cam.height()*keepAspect);
					curCam.height(cam.height());
					curCam.width(cam.width());
					curCam.offset(cam.position());
					//cam.width(cam.height()/16/);
				    }
				}
			    $(el).data().camera.modelIsUpdated();
			});
		});
	    $(window).resize();
	    //fuck.  apparently, the 'camera' canvases aren't /necessarily/ completely in place by the time this
	    //part happens, so we have to launch a new event to occur half a second later, so that the control canvases attach
	    //to the right place.  Fuck.  That's ugly as hell.
	    setTimeout(function(){$(window).resize();},500);
	    window.camView=$("#cameraView").data("camera");
	});

    return camera;

    });
