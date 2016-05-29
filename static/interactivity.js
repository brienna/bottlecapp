
// Gather data (passed from Jinja template)
var data = caps;

// Set variables
var width = window.innerWidth;
var height = window.innerHeight;
var preloaded = false;  // caps have not been preloaded yet
var caps = {};  // where preloaded caps will be stored

// Select and configure the canvas element
var canvas = d3.select("canvas")
  .attr("width", width)
  .attr("height", height)
  // Preload cap images for later use
  .call(preloadCaps)
  .node();

// Get the canvas context to access drawing interface
var context = canvas.getContext("2d");

// Create and configure the force layout
var force = d3.layout.force()
  .size([width, height])
  .nodes(caps)
  .charge(1)
  .start();

force.on('tick', function() {
  if (preloaded) {
    // Clear the canvas
    context.clearRect(0, 0, width, height);

    for (var cap in caps) {
      x = Math.random() * 200;
      y = Math.random() * 200;
      context.drawImage(caps[cap], x, y, 50, 50);

    }
  }
});

function preloadCaps() {
  var loadedCaps = 0;
  var numCaps = data.length;
  for (var i = 0; i < data.length; i++) {
    // Create a new img element
    caps[i] = new Image();
    // Add onload event handler
    caps[i].addEventListener("load", function() {
      loadedCaps++;
      if (loadedCaps >= numCaps) {
        // Finish preloading
        preloaded = true;
        console.log('Caps have been preloaded.');
      }
    });
    // Set source url of image
    caps[i].src = data[i].path;
  }
}

