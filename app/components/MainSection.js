var React = require("react");
var PropTypes = require("prop-types");
var DimensionArea = require("./DimensionArea");
var ObjectArea = require("./ObjectArea");

var style = {
  height: "100%"
};

function MainSection(props) {
  function isSelected(d) {
    return d.selected || d.highlight;
  }

  var selected = {
    dimensions: props.data.dimensions.filter(isSelected),
    objects: props.data.objects.filter(isSelected)
  };

  return (
    <div className="row" style={style}>
      <DimensionArea
        dimensions={props.data.dimensions}
        dimensionControls={props.dimensionControls}
        selected={selected} />
      <ObjectArea
        objects={props.data.objects}
        objectControls={props.objectControls}
        selected={selected} />
    </div>
  );
}

MainSection.propTypes = {
  data: PropTypes.object.isRequired,
  dimensionControls: PropTypes.array.isRequired,
  objectControls: PropTypes.array.isRequired
};

module.exports = MainSection;
