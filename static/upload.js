
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
    // Draw image 
    context.drawImage(image, originx + offsetx, originy + offsety, canvas.height * scale, canvas.width * scale);
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
function animate() {
    requestAnimationFrame(animate);
    if (doubletap) {
        drawImg(scale);
        scale+=zoomIntensity;
        scaleChange = scale - lastScale;
        offsetx = -(tapx * scaleChange);
        offsety = -(tapy * scaleChange);
        if (scale<minScale || scale>maxScale){
            doubletap = false;
            zoomIntensity*=-1;
            scale+=zoomIntensity;
            scaleChange = scale - lastScale;
        }
    }
}


// from http://stackoverflow.com/questions/18011099/pinch-to-zoom-using-hammer-js
function hammerIt() {
    var posX = 0,
    posY = 0,
    last_scale = 1,
    last_posX = 0,
    last_posY = 0,
    max_pos_x = 0,
    max_pos_y = 0,
    transform = "",
    el = canvas;  // element to listen to

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
            tapx = event.center.x - canvas.offsetLeft;
            tapy = event.center.y - canvas.offsetTop;
            doubletap = true;
        }

        /*// Pan
        if (scale != 1) {
            posX = last_posX + event.deltaX;
            posY = last_posY + event.deltaY;
            max_pos_x = Math.ceil((scale - 1) * el.clientWidth / 2);
            max_pos_y = Math.ceil((scale - 1) * el.clientHeight / 2);
            if (posX > max_pos_x) {
                posX = max_pos_x;
            }
            if (posX < -max_pos_x) {
                posX = -max_pos_x;
            }
            if (posY > max_pos_y) {
                posY = max_pos_y;
            }
            if (posY < -max_pos_y) {
                posY = -max_pos_y;
            }
        }

        // Pinch
        if (event.type == "pinch") {
            scale = Math.max(.999, Math.min(last_scale * (event.scale), 4));
        }
        if(event.type == "pinchend"){last_scale = scale;}

        // Panend
        if(event.type == "panend"){
            last_posX = posX < max_pos_x ? posX : max_pos_x;
            last_posY = posY < max_pos_y ? posY : max_pos_y;
        }

        // Zoom the image according to gesture
        if (scale != 1) {
            transform =
                "translate3d(" + posX + "px," + posY + "px, 0) " +
                "scale3d(" + scale + ", " + scale + ", 1)";
        }

        // Pan the image according to gesture
        if (transform) {
            el.style.webkitTransform = transform;
        }*/

    });
}



