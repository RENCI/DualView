var React = require("react");
var PropTypes = require("prop-types");
var TsneContainer = require("../containers/TsneContainer");
var DimensionTsnePlotContainer = require("../containers/DimensionTsnePlotContainer");
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
    <div className="row column-separator" style={style}>
      <div className="col-md-6 text-center" style={style}>
        <TsneContainer
          data={dimensionTsneInput}
          title="Dimensions">
            <DimensionTsnePlotContainer data={props.data.dimensions} />
        </TsneContainer>
      </div>
      <div className="col-md-6 text-center" style={style}>
        <TsneContainer
          data={objectTsneInput}
          title="Objects">
            <ObjectTsnePlotContainer data={props.data.objects} />
        </TsneContainer>
      </div>
    </div>
  );
}

MainSection.propTypes = {
  data: PropTypes.object.isRequired
};

module.exports = MainSection;
