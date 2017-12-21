var d3 = require("d3");
var d3ScaleChromatic = require("d3-scale-chromatic");

module.exports = function () {
      // Size
  var margin = { top: 20, left: 20, bottom: 20, right: 20 },
      width = 200,
      height = 200,
      innerWidth = function() { return width - margin.left - margin.right; },
      innerHeight = function() { return height - margin.top - margin.bottom; },

      // Data
      data = [],
      selected = [],

      // Scales
      xScale = d3.scaleLinear()
          .domain([-1, 1]),
      yScale = d3.scaleLinear()
          .domain([-1, 1]),
      radiusScale = d3.scaleLinear(),
      colorScale = d3.scaleSequential(d3ScaleChromatic.interpolateRdBu),
      strokeScale = d3.scaleLinear()
          .domain([0.5, 1])
          .range(["#eee", "#000"])

      // Parameters
      transitionDuration = 2000,

      // Start with empty selection
      svg = d3.select(),

      // Event dispatcher
      dispatcher = d3.dispatch("selectObject", "highlightObject");

  function objectTsnePlot(selection) {
    selection.each(function(d) {
      data = d;

      // Create skeletal chart
      svg = d3.select(this).selectAll("svg")
          .data([data]);

      var drag = function() {
        var x0, y0;

        return d3.drag()
          .on("start", function() {
            d3.event.sourceEvent.stopPropagation();

            x0 = d3.event.x - margin.left,
            y0 = d3.event.y - margin.top;

            svg.select(".selectRectangle").append("rect")
                .attr("width", 0)
                .attr("height", 0)
                .style("fill", "none")
                .style("stroke", "black")
                .style("stroke-dasharray", "5 8");

            data.forEach(function(d) {
              d.saveSelected = d.selected;
            });
          })
          .on("drag", function() {
            var x = d3.event.x - margin.left,
                y = d3.event.y - margin.top;

            var x1 = Math.min(x0, x);
            var y1 = Math.min(y0, y);
            var x2 = Math.max(x0, x);
            var y2 = Math.max(y0, y);

            svg.select(".selectRectangle > rect")
                .attr("x", x1)
                .attr("y", y1)
                .attr("width", x2 - x1)
                .attr("height", y2 - y1);

            data.forEach(function(d) {
              if (!d.tsne || d.saveSelected) return;

              var x = xScale(d.tsne[0]),
                  y = yScale(d.tsne[1]);

              var selected = x >= x1 && x <= x2 && y >= y1 && y <= y2;

              if (selected !== d.selected) {
                // XXX: Use separate toggleSelect and select?
                dispatcher.call("selectObject", this, d);
              }
            });
          })
          .on("end", function() {
            svg.select(".selectRectangle > rect").remove();
          });
      }();

      var svgEnter = svg.enter().append("svg")
          .attr("class", "objectTsnePlot")
          .on("mousedown", function() {
            // Stop text highlighting
            d3.event.preventDefault();
          })
          .on("dblclick", function() {
            dispatcher.call("selectObject", this, null);
          })
          .call(drag);

      // Apply margins
      var g = svgEnter.append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Groups for layout
      var groups = ["progressPoints", "links", "points", "highlights", "selectRectangle"];

      g.selectAll("g")
          .data(groups)
        .enter().append("g")
          .attr("class", function(d) { return d; });

      svg = svgEnter.merge(svg);

      draw();
    });
  }

  function draw() {
    // Set width and height
    svg .attr("width", width)
        .attr("height", height);

    // Draw the visualization
    updateScales();
    drawPoints();
    drawProgressPoints();
    drawLinks();
    drawHighlights();

    // Update tooltips
    $(".points .point").tooltip();

    function updateScales() {
      xScale.range([0, innerWidth()]);
      yScale.range([innerHeight(), 0]);

      var rMin = width / 1000;

      radiusScale
          .domain([0, d3.max(data, radiusMetric)])
          .range([rMin, rMin * 10]);
    }

    function drawPoints() {
      // Only update these points if tSNE has finished
      var progress = data.filter(function(d) {
        return d.tsneProgress;
      }).length > 0;

      if (progress) return;

      var showConnection = data.filter(function(d) {
        return d.connection > 0;
      }).length > 0;

      var strokeScale = d3.scaleLinear()
          .domain([0, 1])
          .range(showConnection ? ["#ddd", "black"] : ["black", "black"]);

      // Bind data
      var point = svg.select(".points").selectAll(".point")
          .data(data.filter(function(d) {
            return d.tsne;
          }), function(d) { return d.id; });

      // Enter
      var pointEnter = point.enter().append("circle")
          .attr("class", "point")
          .attr("data-toggle", "tooltip")
          .attr("data-container", "body")
          .attr("data-placement", "auto top")
          .attr("cx", function(d) { return xScale(d.tsne[0])})
          .attr("cy", function(d) { return yScale(d.tsne[1])})
          .style("stroke-width", 2)
          .on("mouseover", function(d) {
            dispatcher.call("highlightObject", this, d);
          }).on("mouseout", function(d) {
            dispatcher.call("highlightObject", this, null);
          });

      // Enter + update
      pointEnter.merge(point)
          .sort(function(a, b) {
            return d3.descending(radiusMetric(a), radiusMetric(b));
          })
          .attr("r", function(d) { return radiusScale(radiusMetric(d)); })
          .attr("data-original-title", function(d) { return d.id; })
          .style("fill", fillColor)
          .style("stroke", strokeColor)
          .on("click", function(d) {
            dispatcher.call("selectObject", this, d);
          })
          .on("dblclick", function(d) {
            d3.event.stopPropagation();
          })
        .transition()
          .duration(transitionDuration)
          .attr("cx", function(d) { return xScale(d.tsne[0])})
          .attr("cy", function(d) { return yScale(d.tsne[1])});

      // Exit
      point.exit().remove();
    }

    function drawProgressPoints() {
      // Bind data
      var point = svg.select(".progressPoints").selectAll(".point")
          .data(data.filter(function(d) {
            return d.tsneProgress;
          }), function(d) { return d.id; });

      // Enter
      var pointEnter = point.enter().append("circle")
          .attr("class", "point")
          .attr("cx", xScale(0))
          .attr("cy", yScale(0))
          .style("stroke", "black")
          .style("fill-opacity", 0.2)
          .style("stroke-opacity", 0.2);

      // Enter + update
      pointEnter.merge(point)
          .sort(function(a, b) {
            return d3.descending(radiusMetric(a), radiusMetric(b));
          })
          .attr("r", function(d) { return radiusScale(radiusMetric(d)); })
          .attr("cx", function(d) { return xScale(d.tsneProgress[0])})
          .attr("cy", function(d) { return yScale(d.tsneProgress[1])})
          .style("fill", function(d) { return "grey"; });

      // Exit
      point.exit().transition()
          .delay(transitionDuration)
          .remove();
    }

    function drawLinks() {
      var oldSelected = selected;

      // Get selected points
      selected = data.filter(function(d) {
        return d.tsne && (d.selected || d.highlight);
      });

      // Create array for links
      var links = [];

      if (selected.length === 2) {
        var p = selected.slice().sort(function(a, b) {
          return d3.ascending(a.id, b.id);
        });

        links.push({
          source: p[0],
          target: p[1]
        });
      }
      else if (selected.length > 2) {
        // Compute Delaunay triangulation of selected points
        var triangles = d3.voronoi()
            .x(function(d) { return d.tsne[0]; })
            .y(function(d) { return d.tsne[1]; })
            .triangles(selected);

        // Create links from unique Delaunay edges
        var links = d3.merge(triangles.map(function(d) {
          // Sort for consistency
          var p = d.slice().sort(function(a, b) {
            return d3.ascending(a.id, b.id);
          });

          return [
            { source: p[0], target: p[1] },
            { source: p[0], target: p[2] },
            { source: p[1], target: p[2] }
          ];
        })).filter(function(d, i, a) {
          for (var j = i - 1; j >= 0; j--) {
            var e = a[j];

            if (d.source === e.source && d.target === e.target) {
              return false;
            }
          }

          return true;
        });
      }

      // Interrupt any current transitions
      svg.select(".links").selectAll(".link").interrupt();

      // Bind data
      var link = svg.select(".links").selectAll(".link")
          .data(links, function(d) {
            return d.source.id + "_" + d.target.id;
          });

      if (selected.length === oldSelected.length) {
        // Same number of selected points, so transition links

        // Enter--fade in after delay at new location
        var linkEnter = link.enter().append("line")
            .attr("class", "link")
            .attr("x1", function(d) { return xScale(d.source.tsne[0])})
            .attr("y1", function(d) { return yScale(d.source.tsne[1])})
            .attr("x2", function(d) { return xScale(d.target.tsne[0])})
            .attr("y2", function(d) { return yScale(d.target.tsne[1])})
            .style("stroke", "black")
            .style("stroke-opacity", 0)
            .style("stroke-width", 3)
            .style("stroke-linecap", "round")
            .style("stroke-dasharray", "5 8")
            .style("pointer-events", "none")
          .transition()
            .delay(transitionDuration)
            .style("stroke-opacity", 0.5);

        // Update--move to new location
        link.transition()
            .duration(transitionDuration)
            .attr("x1", function(d) { return xScale(d.source.tsne[0])})
            .attr("y1", function(d) { return yScale(d.source.tsne[1])})
            .attr("x2", function(d) { return xScale(d.target.tsne[0])})
            .attr("y2", function(d) { return yScale(d.target.tsne[1])});

        // Exit--fade out
        link.exit().transition()
            .style("stroke-opacity", 0)
            .remove();
      }
      else {
        // Different number of selected points, so just add/remove immediately

        // Enter
        var linkEnter = link.enter().append("line")
            .attr("class", "link")
            .attr("x1", function(d) { return xScale(d.source.tsne[0])})
            .attr("y1", function(d) { return yScale(d.source.tsne[1])})
            .attr("x2", function(d) { return xScale(d.target.tsne[0])})
            .attr("y2", function(d) { return yScale(d.target.tsne[1])})
            .style("stroke", "black")
            .style("stroke-opacity", 0.5)
            .style("stroke-width", 3)
            .style("stroke-linecap", "round")
            .style("stroke-dasharray", "5 8")
            .style("pointer-events", "none");

        // Exit
        link.exit().remove();
      }
    }

    function drawHighlights() {
      var selected = data.filter(function(d) {
        return d.tsne && (d.selected || d.highlight);
      });

      // Bind data
      var highlight = svg.select(".highlights").selectAll(".highlight")
          .data(selected, function(d) { return d.id; });

      // Enter
      var highlightEnter = highlight.enter().append("circle")
          .attr("class", "highlight")
          .style("fill", "none")
          .style("stroke", "black")
          .style("stroke-opacity", 0.5)
          .style("stroke-width", 3)
          .style("stroke-linecap", "round")
          .style("stroke-dasharray", "5 8")
          .style("pointer-events", "none")
          .attr("cx", function(d) { return xScale(d.tsne[0])})
          .attr("cy", function(d) { return yScale(d.tsne[1])})
          .attr("r", function(d) { return radiusScale(radiusMetric(d)) + 5; });

      // Enter + update
      highlightEnter.merge(highlight)
          .style("stroke-opacity", function(d) {
            return d.highlight && d.selected ? 1 : d.highlight ? 0.75 : 0.5;
          })
        .transition()
          .duration(transitionDuration)
          .attr("cx", function(d) { return xScale(d.tsne[0])})
          .attr("cy", function(d) { return yScale(d.tsne[1])})
          .attr("r", function(d) { return radiusScale(radiusMetric(d)) + 5; });

      // Exit
      highlight.exit().remove();
    }

    function fillColor(d) {
      return d.connection ? colorScale(1 - d.connection.mean) : "#ddd";
    }

    function strokeColor(d) {
      return d.connection ? strokeScale(1 - d.connection.stdDev) : "#666";
    }

    function radiusMetric(d) {
      return 1;
    }
  }

  objectTsnePlot.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return objectTsnePlot;
  };

  objectTsnePlot.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return objectTsnePlot;
  };

  // For registering event callbacks
  objectTsnePlot.on = function() {
    var value = dispatcher.on.apply(dispatcher, arguments);
    return value === dispatcher ? objectTsnePlot : value;
  };

  return objectTsnePlot;
}
