var AppDispatcher = require("../dispatcher/AppDispatcher");
var EventEmitter = require("events").EventEmitter;
var assign = require("object-assign");
var Constants = require("../constants/Constants");
var simpleStatistics = require("simple-statistics");
var d3 = require("d3");

var CHANGE_EVENT = "change";

// The data
var data = null;

function normalize(v, min, max) {
  return (v - min) / (max - min);
}

function extremeness(values) {
  return Math.abs(simpleStatistics.mean(values.map(function (value) {
    return Math.abs(value - 0.5) * 2;
  })));
}

function distanceNormalized(a1, a2) {
  return simpleStatistics.mean(a1.map(function (v1, i) {
    return Math.abs(v1 - a2[i]);
  }));

/*
  return Math.sqrt(simpleStatistics.sumSimple(a1.map(function (v1, i) {
    var v = v1 - a2[i];

    return v * v;
  }))) / Math.sqrt(a1.length);
*/
}

function cosineSimilarity(a1, a2) {
  var num = simpleStatistics.sumSimple(a1.map(function (v1, i) {
    return v1 * a2[i];
  }));

  var den1 = Math.sqrt(simpleStatistics.sumSimple(a1.map(function (v) {
    return v * v;
  })));

  var den2 = Math.sqrt(simpleStatistics.sumSimple(a2.map(function (v) {
    return v * v;
  })));

  return num / (den1 * den2);
}

function highlightItem(item, array) {
  array.forEach(function (item) {
    item.highlight = false;
  });

  if (item) item.highlight = true;

  updateConnections();
}

function selectItem(item, array) {
  if (item) {
    // Toggle selection
    item.selected = !item.selected;
  }
  else {
    // Clear all selections
    array.forEach(function (item) {
      item.selected = false;
    });
  }

  updateConnections();
}

function updateConnections() {
  var selectedDimensions = data.dimensions.filter(function (dimension) {
    return dimension.highlight || dimension.selected;
  });

  var selectedObjects = data.objects.filter(function (object) {
    return object.highlight || object.selected;
  });

  // Highlight objects
  if (selectedDimensions.length > 0) {
    data.objects.forEach(function (object) {
      var selectedValues = object.values.filter(function (value) {
        return selectedDimensions.indexOf(value.dimension) !== -1;
      }).map(function (value) {
        return normalize(value.value, value.dimension.min, value.dimension.max);
      });

      object.connection = {
        mean: simpleStatistics.mean(selectedValues),
        stdDev: simpleStatistics.standardDeviation(selectedValues),
        extremeness: extremeness(selectedValues)
      };
    });
  }
  else if (selectedObjects.length > 0) {
    data.objects.forEach(function (object) {
      var selectedSimilarities = object.similarities.filter(function (similarity) {
        return selectedObjects.indexOf(similarity.object) !== -1;
      }).map(function (similarity) {
        return similarity.value;
      });

      object.connection = {
        mean: simpleStatistics.mean(selectedSimilarities),
        stdDev: simpleStatistics.standardDeviation(selectedSimilarities),
        extremeness: extremeness(selectedSimilarities)
      };
    });
  }
  else {
    data.objects.forEach(function (object) {
      object.connection = null;
    });
  }

  // Highlight dimensions
  if (selectedObjects.length > 0) {
    data.dimensions.forEach(function (dimension, i) {
      var selectedValues = dimension.values.filter(function (value) {
        return selectedObjects.indexOf(value.object) !== -1;
      }).map(function (value) {
        return normalize(value.value, dimension.min, dimension.max);
      });

      dimension.connection = {
        mean: simpleStatistics.mean(selectedValues),
        stdDev: simpleStatistics.standardDeviation(selectedValues),
        extremeness: extremeness(selectedValues)
      };
    });
  }
  else if (selectedDimensions.length > 0) {
    data.dimensions.forEach(function (dimension) {
      var selectedCorrelations = dimension.correlations.filter(function (correlation) {
        return selectedDimensions.indexOf(correlation.dimension) !== -1;
      }).map(function (correlation) {
        return correlation.value;
      });

      dimension.connection = {
        mean: simpleStatistics.mean(selectedCorrelations),
        stdDev: simpleStatistics.standardDeviation(selectedCorrelations),
        extremeness: extremeness(selectedCorrelations)
      };
    });
  }
  else {
    data.dimensions.forEach(function (dimension) {
      dimension.connection = null;
    });
  }
}

function processData(inputData) {
  data = {};

  // Get id column if present
  var id = inputData.columns[0] === "" ? inputData.columns[0] : null;

  // Create dimensions and attributes
  data.dimensions = [];
  data.attributes = [];
  inputData.columns.forEach(function (column) {
    // Don't include id column
    if (column === id) return false;

    // Filter non-numeric columns
    for (var i = 0; i < inputData.length; i++) {
      var v = inputData[i][column];

       if (isNaN(+v)) {
         data.attributes.push(column);
         return;
      }
    }

    data.dimensions.push(column);
  });

  data.attributes = data.attributes.map(function (attribute) {
    return {
      name: attribute
    };
  });

  data.dimensions = data.dimensions.map(function (dimension) {
    return {
      name: dimension,
      correlations: [],
      tsne: null,
      highlight: false,
      selected: false,
      connection: null
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
      attributes: data.attributes.map(function (attribute) {
        return {
          attribute: attribute,
          value: inputData[i][attribute.name]
        }
      }),
      similarities: [],
      tsne: null,
      highlight: false,
      selected: false,
      connection: null
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

  // Add similarities to objects
  for (var i = 0; i < data.objects.length; i++) {
    var o1 = data.objects[i];
    for (var j = i; j < data.objects.length; j++) {
      if (i === j) {
        // Similarity to self
        o1.similarities.push({
          object: o1,
          value: 1
        });

        continue;
      }

      var o2 = data.objects[j];

      var d = cosineSimilarity(
        o1.values.map(function (value) { return normalize(value.value, value.dimension.min, value.dimension.max); }),
        o2.values.map(function (value) { return normalize(value.value, value.dimension.min, value.dimension.max); })
      );

      o1.similarities.push({
        object: o2,
        value: d
      });

      o2.similarities.push({
        object: o1,
        value: d
      });
    }
  }

  // Compute input for tSNE
  data.dimensions.forEach(function (dimension ) {
    dimension.tsneInput = dimension.correlations.map(function (correlation) {
      return 1.0 - Math.abs(correlation.value);
    });
  });

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

    case Constants.HIGHLIGHT_DIMENSION:
      highlightItem(action.dimension, data.dimensions);
      DataStore.emitChange();
      break;

    case Constants.SELECT_DIMENSION:
      selectItem(action.dimension, data.dimensions);
      DataStore.emitChange();
      break;

    case Constants.HIGHLIGHT_OBJECT:
      highlightItem(action.object, data.objects);
      DataStore.emitChange();
      break;

    case Constants.SELECT_OBJECT:
      selectItem(action.object, data.objects);
      DataStore.emitChange();
      break;
  }
});

module.exports = DataStore;
