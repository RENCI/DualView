var React = require("react");
var ReactDOM = require("react-dom");
var PropTypes = require("prop-types");
var d3 = require("d3");
var DimensionTsnePlot = require("../visualizations/DimensionTsnePlot");
var ViewActionCreators = require("../actions/ViewActionCreators");

class DimensionTsnePlotContainer extends React.Component {
  constructor() {
    super();

    // Create visualization function
    this.dimensionTsnePlot = DimensionTsnePlot()
        .on("selectDimension", this.handleSelectDimension)
        .on("highlightDimension", this.handleHighlightDimension);
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

    this.dimensionTsnePlot
        .width(props.width)
        .height(props.width);

    d3.select(ReactDOM.findDOMNode(this))
        .datum(props.data)
        .call(this.dimensionTsnePlot);
  }

  handleSelectDimension(dimension) {
    ViewActionCreators.selectDimension(dimension);
  }

  handleHighlightDimension(dimension) {
    ViewActionCreators.highlightDimension(dimension);
  }

  render() {
    return <div></div>
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
