var React = require("react");
var PropTypes = require("prop-types");
var ViewTitle = require("../components/ViewTitle");
var VisualizationContainer = require("./VisualizationContainer");
var ControlPanel = require("../components/ControlPanel");
var TsneControls = require("../components/TsneControls");
var TsneUtils = require("../utils/TsneUtils");
var DataUtils = require("../utils/DataUtils");

function getStateFromStore(store) {
  return {
    parameters: store.getParameters(),
    status: store.getStatus(),
    iteration: store.getIteration(),
    progressOutput: store.getProgressOutput(),
    output: store.getOutput()
  };
}

class TsneContainer extends React.Component {
  constructor(props) {
    super(props);

    this.tsne = new TsneUtils();

    this.state = {
      // tSNE input parameters
      parameters: [
        {
          name: "perplexity",
          value: 7.0,
          min: 5.0,
          max: 50.0,
          label: "perplexity"
        },
        {
          name: "earlyExaggeration",
          value: 4.0,
          min: 1.0,
          max: 20.0,
          label: "early exaggeration"
        },
        {
          name: "learningRate",
          value: 10.0,
          min: 100.0,
          max: 1000.0,
          label: "learning rate"
        },
        {
          name: "nIter",
          value: 500,
          min: 200,
          max: 5000,
          label: "iterations"
        },
        {
          name: "metric",
          value: "euclidean",
          values: ["euclidean", "manhattan", "jaccard", "dice"],
          label: "metric"
        }
      ],

      // tSNE output
      status: "",
      iteration: {
        value: 0,
        error: 0,
        gradNorm: 0
      },
      progressOutput: [],
      output: []
    };

    // Set default value from initial value
    this.state.parameters.forEach(function (parameter) {
      parameter.defaultValue = parameter.value;
    });

    // Need to bind this to callback functions here
    this.onResetParameters = this.onResetParameters.bind(this);
    this.onRerun = this.onRerun.bind(this);
    this.onStop = this.onStop.bind(this);
    this.onChangeParameter = this.onChangeParameter.bind(this);

    this.onProgressStatus = this.onProgressStatus.bind(this);
    this.onProgressIter = this.onProgressIter.bind(this);
    this.onProgressData = this.onProgressData.bind(this);
    this.onDone = this.onDone.bind(this);
  }

  componentDidMount() {
    // Set callbacks for tSNE
    this.tsne.onProgressStatus = this.onProgressStatus;
    this.tsne.onProgressIter = this.onProgressIter;
    this.tsne.onProgressData = this.onProgressData;
    this.tsne.onDone = this.onDone;

    // Enable tooltips
    $('[data-toggle="tooltip"]').tooltip({
      container: "body",
      placement: "auto top",
      animation: false
    });

    // Run tSNE
    this.runTsne();
  }

  onResetParameters() {
    // XXX: Mutating state directly, perhaps look into using immutability helper
    this.state.parameters.forEach(function (parameter) {
      parameter.value = parameter.defaultValue;
    });

    this.setState({
      parameters: this.state.parameters
    });

    this.runTsne();
  }

  onRerun() {
    this.runTsne();
  }

  onStop() {
    this.tsne.stopTsne();

    this.setToLastIteration();

    // Use current progress output
    if (this.state.progressOutput.length > 0) {
      this.setState({
        output: this.state.progressOutput,
        progressOutput: []
      });
    }
  }

  onChangeParameter(name, value) {
    var parameter = DataUtils.find(this.state.parameters, "name", name);

    if (parameter) parameter.value = value;
    else return;

    this.setState({
      parameters: this.state.parameters
    });

    this.runTsne();
  }

  onProgressStatus(msg) {
    this.setState({
      status: msg.data
    });
  }

  onProgressIter(msg) {
    this.state.iteration = {
      value: msg.data[0],
      error: msg.data[1],
      gradNorm: msg.data[2]
    };

    // Don't need to use setState, as onProgressData will handle this
  }

  onProgressData(msg) {
    this.setState({
      progressOutput: msg.data
    });
  }

  onDone(msg) {
    this.setToLastIteration();

    this.setState({
      output: msg.data,
      progressOutput: []
    });
  }

  setToLastIteration() {
    this.state.iteration.value =  DataUtils.find(this.state.parameters, "name", "nIter").value - 1;
  }

  runTsne() {
    this.tsne.startTsne(this.props.data, this.state.parameters);
  }

  render() {
    var props = {
      progressOutput: this.state.progressOutput,
      output: this.state.output
    };

    // Get the children so we can split them up, rendering only the first, which
    // is assumed to be the plot container, inside a visualization container
    var children = React.Children.toArray(this.props.children);

    return (
      <div>
        <VisualizationContainer>
          {React.cloneElement(children[0], props)}
        </VisualizationContainer>
        {children.slice(1)}
        <ControlPanel title="tSNE Parameters">
          <TsneControls
            parameters={this.state.parameters}
            status={this.state.status}
            iteration={this.state.iteration}
            onResetParameters={this.onResetParameters}
            onRerun={this.onRerun}
            onStop={this.onStop}
            onChangeParameter={this.onChangeParameter} />
        </ControlPanel>
      </div>
    );
  }
}

TsneContainer.propTypes = {
  data: PropTypes.array.isRequired
};

module.exports = TsneContainer;
