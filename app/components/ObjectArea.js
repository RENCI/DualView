var React = require("react");
var PropTypes = require("prop-types");
var ViewTitle = require("./ViewTitle");
var TsneContainer = require("../containers/TsneContainer");
var ObjectTsnePlotContainer = require("../containers/ObjectTsnePlotContainer");
var InformationString = require("./InformationString");
var ControlPanel = require("./ControlPanel");
var ObjectControls = require("./ObjectControls");

var style = {
  height: "100%"
};

function ObjectArea(props) {
  var tsneInput = props.objects.map(function (object) {
    return object.tsneInput;
  });

  var no = props.selected.objects.length;
  var nd = props.selected.dimensions.length;
  var info = nd > 0 ? ("Objects colored by value" + (nd > 1 ? "s" : "") + " for " + nd + " dimension" + (nd > 1 ? "s" : "")) :
             no > 0 ? ("Objects colored by similarit" + (no > 1 ? "ies" : "y") + " to " + no + " object" + (no > 1 ? "s" : "")) :
             "";

  return (
    <div className="col-md-6 text-center" style={style}>
      <ViewTitle>Objects</ViewTitle>
      <TsneContainer data={tsneInput}>
        <ObjectTsnePlotContainer data={props.objects} />
        <InformationString info={info} />
        <ControlPanel title="Connection controls">
          <ObjectControls controls={props.objectControls} />
        </ControlPanel>
      </TsneContainer>
    </div>
  );
}

ObjectArea.propTypes = {
  objects: PropTypes.array.isRequired,
  objectControls: PropTypes.array.isRequired,
  selected: PropTypes.object.isRequired
};

module.exports = ObjectArea;
