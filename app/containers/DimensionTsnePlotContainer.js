var React = require("react");
var ReactDOM = require("react-dom");
var PropTypes = require("prop-types");
var d3 = require("d3");
var TsnePlot = require("../visualizations/TsnePlot");
var TsneDensityPlot = require("../visualizations/TsneDensityPlot");
var ViewActionCreators = require("../actions/ViewActionCreators");

class DimensionTsnePlotContainer extends React.Component {
  constructor() {
    super();

    // Create visualization function
    this.tsnePlot = TsneDensityPlot()
        .on("select", this.handleSelectDimensions)
        .on("highlight", this.handleHighlightDimensions);
  }

  componentWillUpdate(props, state) {
    this.drawVisualization(props, state);

    return false;
  }

  drawVisualization(props, state) {
    // Copy output to dimensions
    props.data.forEach(function(d) {
      d.tsne = null;
      d.tsneProgress = null;
    });

    props.output.forEach(function(d, i) {
      props.data[i].tsne = d;
    });

    props.progressOutput.forEach(function(d, i) {
      props.data[i].tsneProgress = d;
    });

    this.tsnePlot
        .width(props.width)
        .height(props.width);

    d3.select(this.div)
        .datum(props.data)
        .call(this.tsnePlot);
  }

  handleSelectDimensions(dimensions, selected) {
    ViewActionCreators.selectDimensions(dimensions, selected);
  }

  handleHighlightDimensions(dimensions) {
    ViewActionCreators.highlightDimensions(dimensions);
  }

  render() {
    return <div ref={div => this.div = div}></div>
  }
}

// Don't make propsTypes required, as a warning is given for the first render
// if using React.cloneElement, as in VisualizationContainer
DimensionTsnePlotContainer.propTypes = {
  width: PropTypes.number,
  data: PropTypes.array,
  progressOutput: PropTypes.array,
  output: PropTypes.array
};

module.exports = DimensionTsnePlotContainer;
