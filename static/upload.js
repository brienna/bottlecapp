
var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');
canvas.height = window.innerWidth;
canvas.width = window.innerWidth;
canvas.style.display = 'block';
canvas.style.margin = "0 auto";

// Select and configure the file input
var fileinput = document.getElementById('uploads');
fileinput.onchange = function() {
    if (!(window.File && window.FileReader && window.FileList && window.Blob )) {
        console.log('The File APIs are not fully supported in this browser.');
    } else {
        display(fileinput.files);
    }
}

var image, scale = 1.00;
function display(files) {
    var reader = new FileReader();

    // Process one file at a time
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
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
                drawImg(scale);
            });
            image.src = blobURL;
        });

    }
}

// Set initial origin at (0, 0)
var originx = 0; originy = 0;  
var offsetx = 0; offsety = 0; 
function drawImg(scale) {
    // Erase canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    // Draw image 
    context.drawImage(image, offsetx, offsety, canvas.height * scale, canvas.width * scale);
    context.restore();
}

var doubletap = false;
var pinch = false;
var zoomDirection = "in";  // initial zoom direction
var minScale=1.00;
var maxScale=3.00;
var zoomIntensity=0.1;
var scaleChange = 0;
var xGesture, yGesture;
var info = [];
var pinchScale = 1;
var lastScale = 1;
function animate() {
    requestAnimationFrame(animate);
    if (doubletap) {
        scale += zoomIntensity;
        scaling();
        if ((scale < minScale) || (scale > maxScale)) {
            // End zoom
            doubletap = false;
            // Reverse zoom direction for next doubletap
            zoomIntensity *= -1;
            if (zoomDirection == "in") {
                scale = maxScale;
                scaling();
                zoomDirection = "out";
            } else {
                scale = minScale;
                scaling();
                zoomDirection = "in";
            }
        }
    }
    if (pinch) {
        scaling();
        pinch = false;
    }

    function scaling() {
        scaleChange = scale - minScale;
        offsetx = -(xGesture * scaleChange);
        offsety = -(yGesture * scaleChange);
        drawImg(scale);
    }
}

// Activate Hammer event listeners after DOM has loaded
window.addEventListener('load', hammerIt);

function hammerIt() {
    // Create Hammer instance
    var hammertime = new Hammer(canvas);

    // Turn on pinch gesture capability (off by default)
    hammertime.get('pinch').set({ 
        enable: true
    });
    
    requestAnimationFrame(animate);

    // Listen for these gestures
    hammertime.on('doubletap pinch pinchend pan panend', function(event) {
        // Doubletap
        if (event.type == "doubletap") {
            doubletap = true;
            if (zoomDirection == "in") {
                // Get coordinates of doubletap
                xGesture = event.center.x - canvas.offsetLeft;
                yGesture = event.center.y - canvas.offsetTop;
            } 
        }
        if (event.type == "pinch") {
            pinch = true;
            scale = Math.max(.999, Math.min(lastScale * (event.scale), 4));
            xGesture = event.center.x - canvas.offsetLeft;
            yGesture = event.center.y - canvas.offsetTop;
        }
        if (event.type == "pinchend") {
            lastScale = scale;
        }
    });
}




