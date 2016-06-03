
var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');
width = window.innerWidth;
height = width;
canvas.height = height;
canvas.width = width;
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

// Activate Hammer event listeners after DOM has loaded
window.addEventListener('load', hammerIt);

var minScale=1.00;
var maxScale=2.00;
zoomIntensity=0.05;
var doubletap = false;
var lastScale = scale;
var scaleChange = 0;
var tapx, tapy;
var zoomDirection = "in";  // initial zoom direction
function animate() {
    requestAnimationFrame(animate);
    if (doubletap) {
        context.translate(originx, originy);
        drawImg(scale);
        scale+=zoomIntensity;
        scaleChange = scale - lastScale;
        offsetx = -(tapx * scaleChange);
        offsety = -(tapy * scaleChange);
        if (scale<minScale || scale>maxScale){
            doubletap = false;
            zoomIntensity*=-1;
            scale+=zoomIntensity;  // to equal minScale or maxScale
            scaleChange = scale - lastScale;
        }
    }
}


// from http://stackoverflow.com/questions/18011099/pinch-to-zoom-using-hammer-js
function hammerIt() {
    // Create Hammer instance
    var hammertime = new Hammer(canvas);

    // Turn on pinch gesture capability (off by default)
    hammertime.get('pinch').set({ 
        enable: true
    });
    
    requestAnimationFrame(animate);
    
    // Listen for these gestures
    hammertime.on('doubletap pan pinch panend pinchend', function(event) {
        // Doubletap
        if (event.type == "doubletap") {
            doubletap = true;
            if (zoomDirection == "in") {
                // Get coordinates of doubletap
                tapx = event.center.x - canvas.offsetLeft;
                tapy = event.center.y - canvas.offsetTop;
                zoomDirection = "out";
            } else {
                zoomDirection = "in";
            }
        }
    });
}



