
var canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize context to access drawing interface
var context = canvas.getContext("2d");

// Gather data (passed from Jinja template)
var data = caps;

// Load and draw caps on the canvas
loadCaps();

/** Load caps onto the page, then call drawCaps to draw */
function loadCaps() {
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
        // Finish loading
        drawCaps(caps);
      }
    });
    // Set source url of image
    caps[i].src = data[i].path;
  }
}

/** Draw loaded caps on the canvas */
function drawCaps(caps) {
  for (var cap in caps) {
    x = Math.random() * 100;
    y = Math.random() * 100;
    context.drawImage(caps[cap], x, y, 50, 50);
  }
}

/*
var width = 960,
    height = 500

var svg = d3.select('body')
  .append('svg')
  .attr({width: width, height: height})
  .style({"margin-left": "auto", 
    "margin-right": "auto",
    "display": "block"});

var force = d3.layout.force()
    .gravity(0.5)
    .distance(100)
    .charge(-100)
    .size([width, height])
    .nodes(caps)
    .start();

var node = svg.selectAll(".node")
    .data(caps)
    .enter().append("g")
    .attr("class", "node")
    .call(force.drag);

node.append("image")
  .attr("xlink:href", function(d) { return d.path; })
  .attr("x", -8)
  .attr("y", -8)
  .attr("width", 15)
  .attr("height", 15);

force.on("tick", function(e) {
    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
});
*/






 
 
