var AppDispatcher = require("../dispatcher/AppDispatcher");
var EventEmitter = require("events").EventEmitter;
var assign = require("object-assign");
var Constants = require("../constants/Constants");
var simpleStatistics = require("simple-statistics");
var ttest = require("ttest");
var d3 = require("d3");

var CHANGE_EVENT = "change";

// The data
var data = null;

// Connection metrics to use
var objectConnectionValue = "mean";
var objectConnectionConsistency = "extremeness";
var dimensionConnectionValue = "mean";
var dimensionConnectionConsistency = "extremeness";

// Object similarity metric to use
var objectSimilarity = "cosine";

function normalize(v, min, max) {
  if (min === max) return 1;

  return (v - min) / (max - min);
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

  if (den1 === 0 || den2 === 0) return 1;

  return num / (den1 * den2);
}

function distance(a1, a2) {
  return Math.sqrt(simpleStatistics.sumSimple(a1.map(function (v1, i) {
    var v = v1 - a2[i];

    return v * v;
  })));
}

function minkowski(a1, a2, p) {
  return Math.pow(simpleStatistics.sumSimple(a1.map(function (v1, i) {
    return Math.pow(Math.abs(v1 - a2[i]), p);
  })), 1 / p);
}

function extremeness(values) {
  return Math.abs(simpleStatistics.mean(values.map(function (value) {
    return Math.abs(value - 0.5) * 2;
  })));
}

function pValue(a1, a2) {
  if (a1.length <= 1 || a2.length <= 1) return 0;

  var stat = ttest(a1, a2);

  return stat.pValue();
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

  // In case of using p-value
  var unselectedDimensions = data.dimensions.filter(function (dimension) {
    return !dimension.highlight && !dimension.selected;
  });

  var unselectedObjects = data.objects.filter(function (object) {
    return !object.highlight && !object.selected;
  });

  // Highlight objects
  if (selectedDimensions.length > 0) {
    data.objects.forEach(function (object, i) {
      var value;
      var consistency;

      var selectedValues = selectedDimensions.map(function (dimension) {
        return dimension.values[i].normalized;
      });

      switch (objectConnectionValue) {
        case "mean":
          value = simpleStatistics.mean(selectedValues);
          break;

        default:
          console.log("Unknown object connection value");
      }

      switch (objectConnectionConsistency) {
        case "extremeness":
          consistency = extremeness(selectedValues);
          break;

        case "stdDev":
          consistency = 1 - simpleStatistics.standardDeviation(selectedValues);
          break;

        case "pValue":
          var unselectedValues = selectedDimensions.map(function (dimension) {
            return dimension.values[i].normalized;
          });

          consistency = 1 - pValue(selectedValues, unselectedValues);
          break;

        default:
          console.log("Uknown object connection consistency");
      }

      object.connection = {
        value: value,
        consistency: consistency
      };

      ////
      object.tsneInput = selectedValues;
    });
  }
  else if (selectedObjects.length > 0) {
    data.objects.forEach(function (object, i) {
      var value;
      var consistency;

      var selectedSimilarities = selectedObjects.map(function (selected) {
        return selected.similarities[i].scaled;
      });

      switch (objectConnectionValue) {
        case "mean":
          value = simpleStatistics.mean(selectedSimilarities);
          break;

        default:
          console.log("Unknown object connection value");
      }

      switch (objectConnectionConsistency) {
        case "extremeness":
          consistency = extremeness(selectedSimilarities);
          break;

        case "stdDev":
          consistency = 1 - simpleStatistics.standardDeviation(selectedSimilarities);
          break;

        case "pValue":
          var unselectedSimilarities = unselectedObjects.map(function (unselected) {
            return unselected.similarities[i].scaled;
          });

          consistency = 1 - pValue(selectedSimilarities, unselectedSimilarities);
          break;

        default:
          console.log("Uknown object connection consistency");
      }

      object.connection = {
        value: value,
        consistency: consistency
      };

      ////
      object.tsneInput = object.values.map(function (value) {
        return value.normalized;
      });
    });
  }
  else {
    data.objects.forEach(function (object) {
      object.connection = null;

      ////
      object.tsneInput = object.values.map(function (value) {
        return value.normalized;
      });
    });
  }

  // Highlight dimensions
  if (selectedObjects.length > 0) {
    ////
    data.dimensions.forEach(function (dimension, i) {
      var selectedValues = dimension.values.filter(function (value) {
        return selectedObjects.indexOf(value.object) !== -1;
      }).map(function (value) {
        return normalize(value.value, dimension.min, dimension.max);
      });

      var unselectedValues = dimension.values.filter(function (value) {
        return selectedObjects.indexOf(value.object) === -1;
      }).map(function (value) {
        return normalize(value.value, dimension.min, dimension.max);
      });

      dimension.connection = {
        mean: simpleStatistics.mean(selectedValues),
        stdDev: simpleStatistics.standardDeviation(selectedValues),
        extremeness: extremeness(selectedValues),
        pValue: pValue(selectedValues, unselectedValues)
      };

      ////
      for (var j = i; j < data.dimensions.length; j++) {
        if (i === j) {
          // Correlation with self
          dimension.tsneInput[i] = 0;

          continue;
        }

        var d2 = data.dimensions[j];

        if (selectedObjects.length === 1) {
          var v1 = selectedObjects[0].values[i].value;
          var v2 = selectedObjects[0].values[j].value;
          var v = Math.abs(v1 - v2);

          dimension.tsneInput[j] = v;
          d2.tsneInput[i] = v;

          continue;
        }

        var sv1 = dimension.values.filter(function (value) {
          return selectedObjects.indexOf(value.object) !== -1;
        }).map(function (value) {
          return value.value;
        });

        var sv2 = d2.values.filter(function (value) {
          return selectedObjects.indexOf(value.object) !== -1;
        }).map(function (value) {
          return value.value;
        });

        var v = 1 - Math.abs(simpleStatistics.sampleCorrelation(sv1, sv2));

        if (isNaN(v)) {
          v = 0;
        }

        dimension.tsneInput[j] = v;
        d2.tsneInput[i] = v;
      }
    });
  }
  else if (selectedDimensions.length > 0) {
    data.dimensions.forEach(function (dimension) {
      var selectedCorrelations = dimension.correlations.filter(function (correlation) {
        return selectedDimensions.indexOf(correlation.dimension) !== -1;
      }).map(function (correlation) {
        return correlation.value;
      });

      var unselectedCorrelations = dimension.correlations.filter(function (correlation) {
        return selectedDimensions.indexOf(correlation.dimension) === -1;
      }).map(function (correlation) {
        return correlation.value;
      });

      dimension.connection = {
        mean: simpleStatistics.mean(selectedCorrelations),
        stdDev: simpleStatistics.standardDeviation(selectedCorrelations),
        extremeness: extremeness(selectedCorrelations),
        pValue: pValue(selectedCorrelations, unselectedCorrelations)
      };

      ////
      dimension.tsneInput = dimension.correlations.map(function (correlation) {
        return 1.0 - Math.abs(correlation.value);
      });
    });
  }
  else {
    data.dimensions.forEach(function (dimension) {
      dimension.connection = null;

      ////
      dimension.tsneInput = dimension.correlations.map(function (correlation) {
        return 1.0 - Math.abs(correlation.value);
      });
    });
  }

  console.log(data);
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

    dimension.values.forEach(function (value) {
      value.normalized = normalize(value.value, dimension.min, dimension.max);
    });
  });

  // Add normalized values to objects
  data.objects.forEach(function (object, i) {
    object.values.forEach(function (value) {
      value.normalized = value.dimension.values[i].normalized;
    });
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
  var minSimilarity = 1;
  var maxSimilarity = 0;
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
/*
      var d = 1 - minkowski(
        o1.values.map(function (value) { return normalize(value.value, value.dimension.min, value.dimension.max); }),
        o2.values.map(function (value) { return normalize(value.value, value.dimension.min, value.dimension.max); }),
        data.dimensions.length
      );
*/
      if (d < minSimilarity) minSimilarity = d;
      if (d > maxSimilarity) maxSimilarity = d;

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

  // Add scaled similarities
  data.objects.forEach(function (object) {
    object.similarities.forEach(function (similarity) {
      similarity.scaled = normalize(similarity.value, minSimilarity, maxSimilarity);
    });
  });

  // Compute input for tSNE
  data.dimensions.forEach(function (dimension ) {
    dimension.tsneInput = dimension.correlations.map(function (correlation) {
      return 1 - Math.abs(correlation.value);
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
