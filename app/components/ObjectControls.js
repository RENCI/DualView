var React = require("react");
var PropTypes = require("prop-types");
var Select = require("./Select");
var ViewActionCreators = require("../actions/ViewActionCreators");

function handleChange(name, value) {
  ViewActionCreators.changeObjectControl(name, value);
}

function ObjectControls(props) {
  return props.controls.map(function (control, i) {
    if (typeof(control.value) === "boolean") {
      return null;
    }
    else if (control.values) {
      return (
        <Select
          key={i}
          name={control.name}
          value={control.value}
          values={control.values}
          label={control.label}
          onChange={handleChange} />
      );
    }
    else {
      return null;
    }
  });
}

ObjectControls.propTypes = {
  controls: PropTypes.array.isRequired
};

module.exports = ObjectControls;
