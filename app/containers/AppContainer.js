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
//var filename = "data/NHS_PCT_sample04.csv";
//var filename = "data/NHS_PCT_sample05.csv";
//var filename = "data/swiss.csv";
//var filename = "data/NFL Combine 2017.csv";
//var filename = "data/descriptors.csv";

//var filename = "data/crohn.csv";
//var filename = "data/car90.csv";

//var filename = "data/Hoops.csv";

//var filename = "data/Cholera.csv";
//var filename = "data/ais.csv";
//var filename = "data/codling.csv";
//var filename = "data/hurricNamed.csv";
var filename = "data/Benefits.csv";
//var filename = "data/Caterpillars.csv";
//var filename = "data/cps3.csv";
//var filename = "data/Crime.csv";
//var filename = "data/HELPrct.csv";
//var filename = "data/jobs.csv";
//var filename = "data/loti.csv";
//var filename = "data/nuclear.csv";
//var filename = "data/OJ.csv";
//var filename = "data/pension.csv";
//var filename = "data/possum.csv";
//var filename = "data/rockArt.csv";
//var filename = "data/USJudgeRatings.csv";
//var filename = "data/affect.csv";
//var filename = "data/Hoops.csv";
//var filename = "data/affairs.csv";
//var filename = "data/traffic2.csv";
//var filename = "data/discrim.csv";
//var filename = "data/iris.csv";
//var filename = "data/socsupport.csv";
//var filename = "data/std.csv";
//var filename = "data/toxicity.csv";
//var filename = "data/Caschool.csv";
//var filename = "data/bankingCrises.csv";
//var filename = "data/pbc.csv";
//var filename = "data/HELPfull.csv";
//var filename = "data/Caravan.csv";
//var filename = "data/College.csv";
//var filename = "data/kielmc.csv";
//var filename = "data/mlb1.csv";
//var filename = "data/plantTraits.csv";
//var filename = "data/midwest.csv";
//var filename = "data/NCHS_-_Drug_Poisoning_Mortality_by_State__United_States.csv";

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
    data: DataStore.getData(),
    dimensionControls: DataStore.getDimensionControls(),
    objectControls: DataStore.getObjectControls()
  };
}

class AppContainer extends React.Component {
  constructor() {
    super();

    this.state = getStateFromStore();

    // Need to bind this to callback functions here
    this.onDataChange = this.onDataChange.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  componentDidMount() {
    DataStore.addChangeListener(this.onDataChange);

    // Load data
    d3.csv(filename).then(function (data) {
      console.log(data);

      var data2 = data.slice();
      d3.shuffle(data2);
      data2 = data2.slice(0, 500);
      data2.columns = data.columns;

      ServerActionCreators.receiveData(data2);
    }).catch(function (error) {
      console.log(error);
    });
  }

  componentWillUnmount() {
    DataStore.removeChangeListener(this.onDataChange);
  }

  onDataChange() {
    this.setState(getStateFromStore());
  }

  onResize() {
    this.forceUpdate();
  }

  render() {
    var hasData = this.state.data !== null;

    return (
      <div className="container-fluid" style={divStyle}>
        <ResizeContainer
          onResize={this.onResize} />
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
