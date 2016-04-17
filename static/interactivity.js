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











