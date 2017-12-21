var AppDispatcher = require("../dispatcher/AppDispatcher");
var EventEmitter = require("events").EventEmitter;
var assign = require("object-assign");
var Constants = require("../constants/Constants");
var simpleStatistics = require("simple-statistics");
var d3 = require("d3");

var CHANGE_EVENT = "change";

// The data
var data = null;

function processData(inputData) {
  console.log(inputData);

  data = {};

  // Get id column if present
  var id = inputData.columns[0] === "" ? inputData.columns[0] : null;

  // Create dimensions
  data.dimensions = inputData.columns.filter(function (column) {
    // Don't include id column
    if (id === null) return false;

    // Filter non-numeric columns
    for (var i = 0; i < inputData.length; i++) {
      if (isNaN(+inputData[i][column])) return false;
    }

    return true;
  }).map(function (column) {
    return {
      name: column,
      correlations: [],
      tsne: null
    };
  });

  // Create objects
  data.objects = inputData.map(function (object, i) {
    return {
      id: id !== null ? object[id] : i,
      values: data.dimensions.map(function (dimension) {
        return {
          dimension: dimension,
          value: +inputData[i][dimension.name]
        };
      }),
      tsne: null
    };
  });

  // Add values to dimensions
  data.dimensions.forEach(function (dimension, i) {
    dimension.values = data.objects.map(function (object) {
      return {
        object: object,
        value: object.values[i].value
      };
    });

    var extent = d3.extent(dimension.values, function (value) {
      return value.value;
    });

    dimension.min = extent[0];
    dimension.max = extent[1];
  });


  // Add correlations to dimensions
  for (var i = 0; i < data.dimensions.length; i++) {
    var d1 = data.dimensions[i];
    for (var j = i; j < data.dimensions.length; j++) {
      if (i === j) {
        // Correlation with self
        d1.correlations.push({
          dimension: d1,
          value: 1
        });

        continue;
      }

      var d2 = data.dimensions[j];

      var c = simpleStatistics.sampleCorrelation(
        d1.values.map(function (value) { return value.value; }),
        d2.values.map(function (value) { return value.value; })
      );

      d1.correlations.push({
        dimension: d2,
        value: c
      });

      d2.correlations.push({
        dimension: d1,
        value: c
      });
    }
  }

  // Compute input for tSNE
  data.dimensions.forEach(function (dimension ) {
    dimension.tsneInput = dimension.correlations.map(function (correlation) {
      return 1.0 - Math.abs(correlation.value);
    });
  });

  function normalize(v, min, max) {
    return (v - min) / (max - min);
  }

  data.objects.forEach(function (object) {
    object.tsneInput = object.values.map(function (value) {
      return normalize(value.value, value.dimension.min, value.dimension.max);
    });
  });

  console.log(data);
}

var DataStore = assign({}, EventEmitter.prototype, {
  emitChange: function () {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function (callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function (callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },
  getData: function () {
    return data;
  }
});

DataStore.dispatchToken = AppDispatcher.register(function (action) {
  switch (action.actionType) {
    case Constants.RECEIVE_DATA:
      processData(action.data);
      DataStore.emitChange();
      break;
  }
});

module.exports = DataStore;
