
var PTM = 12;

var world = null;
var canvas;
var context;
var myDebugDraw;
var start = true;
var finish = false;
var run = true;
var frameTime60 = 0;
var statusUpdateCounter = 0;
var showStats = false;
var canvasOffset = {
    x: 0,
    y: 0
};        
var viewCenterPixel = {
    x:640,
    y:360
};
var currentWorld = null;
var bgSet = false;
var finishTimer = 0;
var finishDistance = 0;

var background = 'img/bg1.jpg';
var music = new Audio('audio/music.wav');
var explosion = new Audio('audio/explosion.wav');

function setBackground() {
	var rand = 1 + Math.floor(Math.random() * 2);
	background = 'img/bg' + rand + '.jpg';
}

function playMusic() {
	explosion.pause();
	explosion.load();
	music.addEventListener('ended', function() {
	    this.currentTime = 0;
	    this.play();
	}, false);
	music.play();
}

function playExplosion() {
	music.pause();
	music.load();
	explosion.play();
}

function resetVars() {
    finish = false;
    finishTimer = 0;
    finishDistance = 0;
}

function myRound(val, places) {
    var c = 1;
    for (var i = 0; i < places; i++)
        c *= 10;
    return Math.round(val*c)/c;
}

function myTimeConverter(milliseconds) {
  var ms = milliseconds % 1000;
  milliseconds = (milliseconds - ms) / 1000;
  var secs = milliseconds % 60;
  milliseconds = (milliseconds - secs) / 60;
  var mins = milliseconds % 60;
  var hrs = (milliseconds - mins) / 60;
  return hrs + ':' + mins + ':' + secs + '.' + ms;
}

function myZoom() {
	var zoom = PTM - 12;
	if(zoom > 0) {
		return '+' + zoom;
	} else {
		return zoom;
	}
}

function getWorldPointFromPixelPoint(pixelPoint) {
    return {                
        x: (pixelPoint.x - canvasOffset.x)/PTM,
        y: (pixelPoint.y - (canvas.height - canvasOffset.y))/PTM
    };
}

function setViewCenterWorld(b2vecpos, instantaneous) {
    var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
    var toMoveX = b2vecpos.get_x() - currentViewCenterWorld.x;
    var toMoveY = b2vecpos.get_y() - currentViewCenterWorld.y;
    var fraction = instantaneous ? 1 : 0.25;
    canvasOffset.x -= myRound(fraction * toMoveX * PTM, 0);
    canvasOffset.y += myRound(fraction * toMoveY * PTM, 0);
}

function onKeyDown(canvas, evt) {
    if ( evt.keyCode == 80 ) {//p
        pause();
    }
    else if ( evt.keyCode == 82 || evt.keyCode == 13) {//r
        resetScene();
    }
    else if ( evt.keyCode == 83 ) {//s
        step();
    }
    else if ( evt.keyCode == 88 ) {//x
        zoomIn();
    }
    else if ( evt.keyCode == 90 ) {//z
        zoomOut();
    }
    
    if ( currentWorld && currentWorld.onKeyDown )
        currentWorld.onKeyDown(canvas, evt);
    
    draw();
}

function onKeyUp(canvas, evt) {
    
    if ( currentWorld && currentWorld.onKeyUp )
        currentWorld.onKeyUp(canvas, evt);
}

function zoomIn() {
    if(run) {
        var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
        PTM += 1;
        if(PTM > 18) {
            PTM = 18;
        }
        var newViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
        canvasOffset.x += (newViewCenterWorld.x-currentViewCenterWorld.x) * PTM;
        canvasOffset.y -= (newViewCenterWorld.y-currentViewCenterWorld.y) * PTM;
        draw();
    }
}

function zoomOut() {
    if(run) {
        var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
        PTM -= 1;
        if(PTM < 6) {
            PTM = 6;
        }
        var newViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
        canvasOffset.x += (newViewCenterWorld.x-currentViewCenterWorld.x) * PTM;
        canvasOffset.y -= (newViewCenterWorld.y-currentViewCenterWorld.y) * PTM;
        draw();
    }
}

function init() {
    
    canvas = document.getElementById("canvas");
    context = canvas.getContext( '2d' );
    
    canvasOffset.x = canvas.width/2;
    canvasOffset.y = canvas.height/2;

    var image = new Image();
    image.src = background;
    image.onload = function() {
        context.drawImage(image, 0, 0);
        context.font = 'bold 50pt Calibri,Geneva,Arial';
        context.textAlign = 'center';
        context.fillStyle = 'rgb(0,0,0)';
        context.fillText('Super Ball', canvas.width/2, canvas.height/2);
        context.font = '20pt Calibri,Geneva,Arial';
        context.fillText('( Click to play )', canvas.width/2, (canvas.height/2) + 60);
    };

    canvas.addEventListener('click', function(evt) {
        if(start) {
            resetScene();
        } 
        if(finish) {
            resetScene();
        }
    }, false);
    
    canvas.addEventListener('keydown', function(evt) {
        onKeyDown(canvas,evt);
    }, false);
    
    canvas.addEventListener('keyup', function(evt) {
        onKeyUp(canvas,evt);
    }, false);
    
    myDebugDraw = getCanvasDebugDraw();            
    myDebugDraw.SetFlags(e_shapeBit);
}

function createWorld() {
    
    if ( world != null ) 
        Box2D.destroy(world);
        
    world = new b2World( new b2Vec2(0.0, -10.0) );
    world.SetDebugDraw(myDebugDraw);
    currentWorld = new embox2dMyWorld();
    currentWorld.setup();
}

function resetScene() {
    resetVars();
    createWorld();
    if(start) {
        animate();
        start = false;
    }
    setBackground();
    playMusic();
    draw();
}

function step(timestamp) {
    
    if ( currentWorld && currentWorld.step ) 
        currentWorld.step();
    
    if ( ! showStats ) {
        world.Step(1/60, 3, 2);
        draw();
        return;
    }
    
    var current = Date.now();
    world.Step(1/60, 3, 2);
    var frametime = (Date.now() - current);
    frameTime60 = frameTime60 * (59/60) + frametime * (1/60);
    
    draw();
    statusUpdateCounter++;
    if ( statusUpdateCounter > 20 ) {
        statusUpdateCounter = 0;
    }
}

function draw() {

    if(start || run) {
        var image = new Image();
        image.src = background;
        image.onload = function() {
            context.drawImage(image, 0, 0);
        };
    }

    var timer = myTimeConverter(currentWorld.getTimer());
    var distance = Math.round(currentWorld.getDistance());
    var contact = currentWorld.getContact();

    if( contact == false) {

        context.font = '20pt Calibri,Geneva,Arial';
        context.textAlign = 'left';
        context.fillStyle = 'rgb(0,0,0)';
        context.fillText('Time : ' + timer, 10, 30);
        context.fillText('Distance : ' + distance + 'm', 10, 60);
        context.textAlign = 'right';
        context.fillText('Zoom : ' + myZoom(), canvas.width - 10, 30);
        context.font = 'bold 15pt Calibri,Geneva,Arial';
        context.textAlign = 'center';
        context.fillText('Enter/R : start/reset, Up : jump, Down : move down, Z/X : zoom -/zoom +', canvas.width/2, canvas.height - 30);

        context.save();
            context.translate(canvasOffset.x, canvasOffset.y);
            context.scale(1,-1);                
            context.scale(PTM,PTM);
            context.lineWidth /= PTM;    
            context.fillStyle = 'rgb(255,255,0)';
            world.DrawDebugData();
        context.restore();

    } else {

        if(finish == false) {
            finishTimer = timer;
            finishDistance = distance;
            finish = true;
			playExplosion();
        }

        context.font = 'bold 40pt Calibri,Geneva,Arial';
        context.textAlign = 'center';
        context.fillStyle = 'rgb(0,0,0)';
        context.fillText('Game Over', canvas.width/2, canvas.height/2);
        context.font = '20pt Calibri,Geneva,Arial';
        context.fillText('Time : ' + finishTimer, canvas.width/2, (canvas.height/2) + 60);
        context.fillText('Distance : ' + finishDistance + 'm', canvas.width/2, (canvas.height/2) + 90);
        context.fillText('( Click or press ENTER / R to restart the game )', canvas.width/2, (canvas.height/2) + 180);
        context.font = '15pt Calibri,Geneva,Arial';
        context.fillText('Author : Thomas Yalap, © Web@cadémie 2014 - All Rights Reserved.', canvas.width/2, canvas.height - 30);
    }
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(callback){
                window.setTimeout(callback, 1000 / 60);
            };
})();

function animate() {
    if (run)
        requestAnimFrame(animate);
    step();
}

function pause() {
    run = !run;
    if (run)
        animate();
}
