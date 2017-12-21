var React = require("react");
var Header = require("./Header");

function HeaderSection() {
  return (
    <div className="row well">
      <div className="col-sm-12 text-center">
        <Header header="Dual View" />
      </div>
    </div>
  );
}

module.exports = HeaderSection;
