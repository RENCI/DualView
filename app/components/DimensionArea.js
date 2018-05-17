var React = require("react");
var PropTypes = require("prop-types");
var ViewTitle = require("./ViewTitle");
var TsneContainer = require("../containers/TsneContainer");
var DimensionTsnePlotContainer = require("../containers/DimensionTsnePlotContainer");
var InformationString = require("./InformationString");
var ControlPanel = require("./ControlPanel");
var DimensionControls = require("./DimensionControls");

var style = {
  height: "100%"
};

function DimensionArea(props) {
  var tsneInput = props.dimensions.map(function (dimension) {
    return dimension.tsneInput;
  });

  var no = props.selected.objects.length;
  var nd = props.selected.dimensions.length;
  var info = no > 0 ? ("Dimensions colored by value" + (no > 1 ? "s" : "") + " for " + no + " object" + (no > 1 ? "s" : "")) :
             nd > 0 ? ("Dimensions colored by relation" + (nd > 1 ? "s" : "") + " to " + nd + " dimension" + (nd > 1 ? "s" : "")) :
             "";

  return (
    <div className="col-md-6 text-center" style={style}>
      <ViewTitle>Dimensions</ViewTitle>
      <TsneContainer data={tsneInput}>
        <DimensionTsnePlotContainer data={props.dimensions} />
        <InformationString info={info} />
        <ControlPanel title="Connection controls">
          <DimensionControls controls={props.dimensionControls} />
        </ControlPanel>
      </TsneContainer>
    </div>
  );
}

DimensionArea.propTypes = {
  dimensions: PropTypes.array.isRequired,
  dimensionControls: PropTypes.array.isRequired,
  selected: PropTypes.object.isRequired
};

module.exports = DimensionArea;
