var React = require("react");
var ReactDOM = require("react-dom");
var PropTypes = require("prop-types");
var d3 = require("d3");
var TsnePlot = require("../visualizations/TsnePlot");
var TsneDensityPlot = require("../visualizations/TsneDensityPlot");
var ViewActionCreators = require("../actions/ViewActionCreators");

class ObjectTsnePlotContainer extends React.Component {
  constructor() {
    super();

    // Create visualization function
    this.tsnePlot = TsneDensityPlot()
        .on("select", this.handleSelectObjects)
        .on("highlight", this.handleHighlightObjects);

    // Need to bind this to callback functions here
    this.handleSelectObjects = this.handleSelectObjects.bind(this);
    this.handleHighlightObjects = this.handleHighlightObjects.bind(this);
  }

  componentWillUpdate(props, state) {
    this.drawVisualization(props, state);

    return false;
  }

  drawVisualization(props, state) {
    // Copy output to Objects
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

  handleSelectObjects(objects, selected) {
    ViewActionCreators.selectObjects(objects, selected);
  }

  handleHighlightObjects(objects) {
    ViewActionCreators.highlightObjects(objects);
  }

  render() {
    return <div ref={div => this.div = div}></div>
  }
}

// Don't make propsTypes required, as a warning is given for the first render
// if using React.cloneElement, as in VisualizationContainer
ObjectTsnePlotContainer.propTypes = {
  width: PropTypes.number,
  data: PropTypes.array,
  progressOutput: PropTypes.array,
  output: PropTypes.array
};

module.exports = ObjectTsnePlotContainer;
