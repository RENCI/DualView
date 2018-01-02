// Controller-view for the application

var React = require("react");
var d3 = require("d3");
var ServerActionCreators = require("../actions/ServerActionCreators");
var DataStore = require("../stores/DataStore");
var ResizeContainer = require("./ResizeContainer");
var HeaderSection = require("../components/HeaderSection");
var MainSection = require("../components/MainSection");

//var filename = "data/mycars.csv";
//var filename = "data/mystates.csv";
var filename = "data/NHS_PCT_sample04.csv";
//var filename = "data/NHS_PCT_sample05.csv";
//var filename = "data/NHS_practice_qof_prev_1011_cluster.csv";
//var filename = "data/swiss.csv";
//var filename = "data/NFL Combine 2017.csv";
//var filename = "data/descriptors.csv";

//var filename = "data/ais.csv";
//var filename = "data/Benefits.csv";
//var filename = "data/car90.csv";
//var filename = "data/Caterpillars.csv";
//var filename = "data/cps3.csv";
//var filename = "data/Crime.csv";
//var filename = "data/crohn.csv";
//var filename = "data/HELPrct.csv";
//var filename = "data/jobs.csv";
//var filename = "data/loti.csv";
//var filename = "data/nuclear.csv";
//var filename = "data/OJ.csv";
//var filename = "data/pension.csv";
//var filename = "data/possum.csv";
//var filename = "data/rockArt.csv";
//var filename = "data/USJudgeRatings.csv";

var divStyle = {
  height: "100%",
  display: "flex",
  flexDirection: "column"
};

var mainStyle = {
  height: "calc(100% - 200px)"
};

function getStateFromStore() {
  return {
    data: DataStore.getData()
  };
}

class AppContainer extends React.Component {
  constructor() {
    super();

    this.state = {
      data: DataStore.getData()
    };

    // Need to bind this to callback functions here
    this.onDataChange = this.onDataChange.bind(this);
  }

  componentDidMount() {
    DataStore.addChangeListener(this.onDataChange);

    // Load data
    d3.csv(filename, function(error, data) {
      if (error) {
        console.log(error);
        return;
      }

      console.log(data);

      var data2 = data.slice(0, 500);
      data2.columns = data.columns;

      ServerActionCreators.receiveData(data2);
    });
  }

  componentWillUnmount() {
    DataStore.removeChangeListener(this.onDataChange);
  }

  onDataChange() {
    this.setState(getStateFromStore());
  }

  render() {
    var hasData = this.state.data !== null;

    return (
      <div className="container-fluid" style={divStyle}>
        <ResizeContainer />
        <HeaderSection />
        {hasData ?
          <div style={mainStyle}>
            <MainSection {...this.state} />
          </div>
        : null}
      </div>
    );
  }
}

module.exports = AppContainer;
