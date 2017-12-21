var React = require("react");
var PropTypes = require("prop-types");

var style = {
  width: "100%"
};

function TsneProgress(props) {
  return (
    <progress
      style={style}
      value={props.value}
      max={props.max} />
  );
}

TsneProgress.propTypes = {
  max: PropTypes.number,
  value: PropTypes.number
};

TsneProgress.defaultProps = {
  max: 100,
  value: 0
};

module.exports = TsneProgress;
