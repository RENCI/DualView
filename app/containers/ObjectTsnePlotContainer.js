var React = require("react");
var ReactDOM = require("react-dom");
var PropTypes = require("prop-types");
var d3 = require("d3");
var ObjectTsnePlot = require("../visualizations/ObjectTsnePlot");
var ViewActionCreators = require("../actions/ViewActionCreators");

class ObjectTsnePlotContainer extends React.Component {
  constructor() {
    super();

    // Create visualization function
    this.objectTsnePlot = ObjectTsnePlot()
        .on("selectObject", this.handleSelectObject)
        .on("highlightObject", this.handleHighlightObject);
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

    this.objectTsnePlot
        .width(props.width)
        .height(props.width);

    d3.select(ReactDOM.findDOMNode(this))
        .datum(props.data)
        .call(this.objectTsnePlot);
  }

  handleSelectObject(object) {
    ViewActionCreators.selectObject(object);
  }

  handleHighlightObject(object) {
    ViewActionCreators.highlightObject(object);
  }

  render() {
    return <div></div>
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
