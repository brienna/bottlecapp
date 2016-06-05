
var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');
canvas.height = window.innerWidth;
canvas.width = window.innerWidth;
canvas.style.display = 'block';
canvas.style.margin = "0 auto";

// Select and configure the file input
var fileinput = document.getElementById('upload');
fileinput.onchange = function() {
    if (!(window.File && window.FileReader && window.FileList && window.Blob )) {
        console.log('The File APIs are not fully supported in this browser.');
    } else {
        display(fileinput.files);
    }
}

function display(files) {
    var reader = new FileReader();
    var file = files[0];  // the first file is the only file
    // Read the file
    reader.readAsArrayBuffer(file);
    reader.addEventListener("load", function(event) {
        // Create blob and get its URL
        var blob = new Blob([event.target.result]);
        window.URL = window.URL || window.webkitURL;
        var blobURL = window.URL.createObjectURL(blob);

        // Create img element
        image = new Image();
        image.addEventListener("load", function() {
            drawImg(a, b, c, d, e, f);
        });
        image.src = blobURL;
    });
}

var image, scale = 1;
// Set default transform values
var a = 1;  // scale drawing horizontally
var b = 0;  // skew drawing horizontally
var c = 0;  // skew drawing vertically
var d = 1;  // scale drawing vertically
var e = 0;  // move drawing horizontally
var f = 0;  // move drawing vertically
function drawImg(a, b, c, d, e, f) {
    // alert(a + "," + b + "," + c + "," + d + "," + e + "," + f);
    // Erase canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.transform(a, b, c, d, e, f);
    // Draw image
    context.drawImage(image, 0, 0, canvas.height, canvas.width);
    context.restore();
}

var lastScale = 1;
var lastDeltaX = 0;
var lastDeltaY = 0;
var currentScale = null;
var currentDeltaX = null;
var currentDeltaY = null;
on = false;
function animate() {
    requestAnimationFrame(animate);
    if (on) {
        drawImg(currentScale, b, c, currentScale, currentDeltaX, currentDeltaY);
        
    }
}

// Activate Hammer event listeners after DOM has loaded
window.addEventListener('load', hammerIt);

function hammerIt() {
    // Create Hammer Manager instance
    var mc = new Hammer.Manager(cropCanvas);
    var pinch = new Hammer.Pinch();
    var pan = new Hammer.Pan();
    pinch.recognizeWith(pan);
    mc.add([pinch, pan]);
    
    requestAnimationFrame(animate);
    
    // Listen for pinch and pan events at the same time
    mc.on("pinch pan", function (ev) {
        on = true;
        currentScale = lastScale * ev.scale;
        currentDeltaX = lastDeltaX + (ev.deltaX / currentScale);
        currentDeltaY = lastDeltaY + (ev.deltaY / currentScale);
    });

    // Saving final transforms for adjustment next time the user interacts
    mc.on("panend pinchend", function (ev) {
        on = false;
        lastScale = currentScale;
        lastDeltaX = currentDeltaX;
        lastDeltaY = currentDeltaY;
    });
    
}


/////// Second canvas!
var cropCanvas = document.getElementById('crop');
var ctx = cropCanvas.getContext('2d');
cropCanvas.height = window.innerWidth;
cropCanvas.width = window.innerWidth;
cropCanvas.style.display = 'block';
cropCanvas.style.margin = "0 auto";

// Draw the crop circle
var dots=60;
var interval=(Math.PI*2)/dots;   
var centerX=150;
var centerY=150;
var radius=100;
ctx.fillStyle = 'white';
for(var i=0;i< dots;i++){
    desiredRadianAngleOnCircle = interval*i;
    var x = centerX+radius*Math.cos(desiredRadianAngleOnCircle);
    var y = centerY+radius*Math.sin(desiredRadianAngleOnCircle);
     ctx.beginPath();
     ctx.arc(x,y,3,0,Math.PI*2); 
     ctx.closePath();
     ctx.fill();   
}

