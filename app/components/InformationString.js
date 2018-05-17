var React = require("react");
var PropTypes = require("prop-types");

var divStyle = {
  height: 20,
  marginBottom: 5
};

var labelStyle = {
  background: "white",
  color: "#666",
  border: "1px solid #ccc"
};

function InformationString(props) {
  return (
    <div className="text-right" style={divStyle}>
      <span className="label" style={labelStyle}>{props.info}</span>
    </div>
  );
}

InformationString.propTypes = {
  info: PropTypes.string.isRequired
};

module.exports = InformationString;
