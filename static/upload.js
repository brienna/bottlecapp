
var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');
width = window.innerWidth/4;
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
            var image = new Image();
            image.addEventListener("load", function() {
                // Draw image onto the canvas
                context.drawImage(image, 0, 0, height, width);
            });
            image.src = blobURL;
        });

    }
}

