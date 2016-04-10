var diameter = 600;

// create an SVG container to hold the visualization
var svg = d3.select('body')
	.append('svg')
	.attr({width: diameter, height: diameter})
	.style({"margin-left": "auto", 
		"margin-right": "auto", 
		"display": "block"});

var cluster = d3.layout.pack()
	.size([diameter, diameter])
	.padding(3)
	.value(function(d) {return 1;})
	.nodes({children: caps})  // caps variable was passed from app.py/grid.html
	// filter out the outer bubble
  	.filter(function(d) { return !d.children; })

// select all bubbles, binding each to a cluster node
var bubbles = svg.selectAll('circle')
	.data(cluster);

// add bubble per cluster node
bubbles.enter()
	.append('circle')
   	.attr('transform', function(d) { 
   		return 'translate(' + d.x + ',' + d.y + ')'; })
   	.attr('r', function(d) { return d.r; })
   	.attr('fill', 'pink');












