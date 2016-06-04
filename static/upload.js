
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
                drawImg(a, b, c, d, e, f);
            });
            image.src = blobURL;
        });

    }
}

var info = [];
var doubletap = false;
var pan = false;
var zoomDirection = "in";  // set initial zoom direction
var minScale=1.00;
var maxScale=3.00;
var zoomIntensity=0.1;
var scaleChange = 0;
var xGesture, yGesture;
var lastScale = 1;
var xLastPos = 0, yLastPost = 0;
var xMaxPos = 0, yMaxPos = 0;

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

    if (pan) {
        xMaxPos = Math.ceil((scale - 1) * canvas.width / 2);
        yMaxPos = Math.ceil((scale - 1) * canvas.height / 2);
        if (xGesture > xMaxPos) {
            xGesture = xMaxPos;
        }
        if (xGesture < -xMaxPos) {
            xGesture = -xMaxPos;
        }
        if (yGesture > yMaxPos) {
            yGesture = yMaxPos;
        }
        if (yGesture < -yMaxPos) {
            yGesture = -yMaxPos;
        }
        pan = false;
    }

    if (scale != 1) {
        scaling();
    }
}

function scaling() {
    scaleChange = scale - minScale;
    e = -(xGesture * scaleChange);
    f = -(yGesture * scaleChange);
    drawImg(scale, b, c, scale, e, f);
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
        }

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
            scale = Math.max(.999, Math.min(lastScale * (event.scale), 4));
            xGesture = event.center.x - canvas.offsetLeft;
            yGesture = event.center.y - canvas.offsetTop;
        }
        if (event.type == "pinchend") {
            lastScale = scale;
        }

        if (event.type == "panend") {
            xLastPos = xGesture < xMaxPos ? xGesture : xmaxPos;
            yLastPos = yGesture < yMaxPos ? yGesture : yMaxPos;
        }

        if (event.type == "pan") {
            xGesture = xLastPos + event.deltaX;
            yGesture = yLastPos + event.deltaY;
            pan = true;
        }
    });
}




