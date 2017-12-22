var React = require("react");
var PropTypes = require("prop-types");
var TsneProgress = require("./TsneProgress");
var ViewActionCreators = require("../actions/ViewActionCreators");
var DataUtils = require("../utils/DataUtils");

var controlStyle = {
  marginLeft: 5,
  marginRight: 5
};

function TsneControls(props) {
  function slider(parameter, i) {
    function handleChange(e) {
      props.onChangeParameter(parameter.name, e.currentTarget.value);
    }

    return (
      <form key={i} className="form-inline">
        <label key={i}>
          {parameter.label}
          <input
            key={i}
            type="range"
            className="form-control"
            style={controlStyle}
            value={parameter.value}
            min={parameter.min}
            max={parameter.max}
            onChange={handleChange} />
          {" " + parameter.value}
        </label>
      </form>
    );
  }

  function select(parameter, i) {
    function handleChange(e) {
      props.onChangeParameter(parameter.name, e.currentTarget.value);
    }

    var options = parameter.values.map(function (value, i) {
      return (
        <option
          key={i}
          value={value}
          defaultValue={value === parameter.value}>
            {value}
        </option>
      );
    });

    return (
      <form key={i} className="form-inline" >
        <label>
          {parameter.label}
          <select
            className="form-control"
            style={controlStyle}
            onChange={handleChange}>
              {options}
          </select>
        </label>
      </form>
    );
  }

  var controls = props.parameters.map(function (parameter, i) {
    return parameter.values ? select(parameter, i) : slider(parameter, i);
  });

  var statusClass = "label " + (props.status === "Optimization end" ?
                                "label-default" : "label-warning");

  var maxIterations = +DataUtils.find(props.parameters, "name", "nIter").value - 1;

  return (
    <div>
      <div className="btn-group">
        <label
          className="btn btn-default"
          data-toggle="tooltip"
          title="Rerun tSNE"
          onClick={props.onRerun}>
            <span className="glyphicon glyphicon-play"></span>
        </label>
        <label
          className="btn btn-default"
          data-toggle="tooltip"
          title="Stop tSNE"
          onClick={props.onStop}>
            <span className="glyphicon glyphicon-stop"></span>
        </label>
        <label
          className="btn btn-default"
          data-toggle="tooltip"
          title="Reset parameters"
          onClick={props.onResetParameters}>
            <span className="glyphicon glyphicon-repeat"></span>
        </label>
      </div>
      {controls}
      <TsneProgress
        max={maxIterations}
        value={props.iteration.value} />
      <div className="text-right">
        <span className={statusClass}>{"Status: " + props.status}</span>
      </div>
    </div>
  );
}

TsneControls.propTypes = {
  parameters: PropTypes.array.isRequired,
  status: PropTypes.string.isRequired,
  iteration: PropTypes.object.isRequired,
  onResetParameters: PropTypes.func.isRequired,
  onRerun: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onChangeParameter: PropTypes.func.isRequired
};

module.exports = TsneControls;
