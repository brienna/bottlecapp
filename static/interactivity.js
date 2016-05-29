
// Gather data (passed from Jinja template)
var data = caps;

// Set variables
var width = window.innerWidth;
var height = window.innerHeight;

// Select and configure the canvas element
var canvas = d3.select("canvas")
  .attr("width", width)
  .attr("height", height)
  // Preload cap images for later use
  .call(preloadCaps)
  .node()

// Get the canvas context to access drawing interface
var context = canvas.getContext("2d");

function preloadCaps() {
  var caps = {};  // dict needed to later store info about each cap
  var loadedCaps = 0;
  var numCaps = data.length;

  for (var i = 0; i < data.length; i++) {
    // Create a new img element
    caps[i] = new Image();
    // Add onload event handler
    caps[i].addEventListener("load", function() {
      loadedCaps++;
      if (loadedCaps >= numCaps) {
        // Finish preloading, draw caps
        drawCaps(caps);
      }
    });
    // Set source url of image
    caps[i].src = data[i].path;
  }
}

/** Draw loaded caps onto the canvas */
function drawCaps(caps) {
  var x = 0;
  var y = 0;
  for (var cap in caps) {
    context.drawImage(caps[cap], x, y, 50, 50);
    x += 53;
    if (x >= width) {
      y += 53;
      x = 20;
    }
  }
}

