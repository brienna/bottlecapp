var diameter = 600;

var svg = d3.select('body').append('svg')
	.attr({width: diameter, height: diameter})
	.style({"margin-left": "auto", 
		"margin-right": "auto", 
		"display": "block"});

var bubbles = d3.layout.pack()
	.size([diameter, diameter])
	.padding(3)  // padding between adjacent bubbles
	.value(function(d) {return 1;})

function processData(caps) {
	var data = [];

	for (i = 0; i < caps.length; i++) {
		node = {date: caps[i].date, path: caps[i].path}
		data.push(node);
	}

   return {children: data};
}

var nodes = bubbles.nodes(processData(caps))
   // filter out the outer bubble
   .filter(function(d) { return !d.children; });

var vis = svg.selectAll('circle').data(nodes);

vis.enter().append('circle')
   .attr('transform', function(d) { return 'translate('
      + d.x + ',' + d.y + ')'; })
   .attr('r', function(d) { return d.r; })
   .attr('fill', 'pink');












