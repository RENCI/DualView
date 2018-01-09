var React = require("react");
var PropTypes = require("prop-types");

var style = {
  marginLeft: 5,
  marginRight: 5
};

function Select(props) {
  function handleChange(e) {
    props.onChange(props.name, e.currentTarget.value);
  }

  var options = props.values.map(function (value, i) {
    return (
      <option
        key={i}
        value={value}
        defaultValue={value === props.value}>
          {value}
      </option>
    );
  });

  return (
    <form className="form-inline" >
      <label>
        {props.label}
        <select
          className="form-control"
          style={style}
          onChange={handleChange}>
            {options}
        </select>
      </label>
    </form>
  );
}

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

module.exports = Select;
