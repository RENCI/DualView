var React = require("react");
var PropTypes = require("prop-types");

function ViewTitle(props) {
  return <h3>{props.children}</h3>;
}

module.exports = ViewTitle;
