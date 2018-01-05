var React = require("react");
var PropTypes = require("prop-types");

function ControlPanel(props) {
  return (
    <div className="panel panel-default">
      {props.title !== "" ?
        <div className="panel-heading">
          <h4>{props.title}</h4>
        </div>
      : null}
      <div className="panel-body text-left">
        {props.children}
      </div>
    </div>
  );
}

ControlPanel.propTypes = {
  title: PropTypes.string.isRequired
};

module.exports = ControlPanel;
