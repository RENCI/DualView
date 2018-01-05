var React = require("react");
var PropTypes = require("prop-types");
var ViewTitle = require("./ViewTitle");
var TsneContainer = require("../containers/TsneContainer");
var DimensionTsnePlotContainer = require("../containers/DimensionTsnePlotContainer");
var ControlPanel = require("./ControlPanel");
var DimensionControls = require("./DimensionControls");
var ObjectControls = require("./ObjectControls");
var ObjectTsnePlotContainer = require("../containers/ObjectTsnePlotContainer");

var style = {
  height: "100%"
};

function MainSection(props) {
  var objectTsneInput = props.data.objects.map(function (object) {
    return object.tsneInput;
  });

  var dimensionTsneInput = props.data.dimensions.map(function (dimension) {
    return dimension.tsneInput;
  });

  return (
    <div className="row" style={style}>
      <div className="col-md-6 text-center" style={style}>
        <ViewTitle>Dimensions</ViewTitle>
        <TsneContainer data={dimensionTsneInput}>
          <DimensionTsnePlotContainer data={props.data.dimensions} />
          <ControlPanel title="Connection controls">
            <DimensionControls controls={props.dimensionControls} />
          </ControlPanel>
        </TsneContainer>
      </div>
      <div className="col-md-6 text-center" style={style}>
        <ViewTitle>Objects</ViewTitle>
        <TsneContainer data={objectTsneInput}>
          <ObjectTsnePlotContainer data={props.data.objects} />
          <ControlPanel title="Connection controls">
            <ObjectControls controls={props.objectControls} />
          </ControlPanel>
        </TsneContainer>
      </div>
    </div>
  );
}

MainSection.propTypes = {
  data: PropTypes.object.isRequired,
  dimensionControls: PropTypes.array.isRequired,
  objectControls: PropTypes.array.isRequired
};

module.exports = MainSection;
