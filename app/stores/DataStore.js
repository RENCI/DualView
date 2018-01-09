var AppDispatcher = require("../dispatcher/AppDispatcher");
var EventEmitter = require("events").EventEmitter;
var assign = require("object-assign");
var Constants = require("../constants/Constants");
var DataUtils = require("../utils/DataUtils");
var simpleStatistics = require("simple-statistics");
var ttest = require("ttest");
var jStat = require("jStat").jStat;
var jsRegression = require("js-regression");
var regression = require("@smockle/regression").default;

var d3 = require("d3");

var CHANGE_EVENT = "change";

// The data
var data = null;

// Controls for dimension data
var dimensionControls = [
  {
    name: "connectionValue",
    value: "mean",
    values: ["mean", "median"],
    label: "connection value"
  },
  {
    name: "connectionConsistency",
    value: "extremeness",
    values: ["extremeness", "variabililty", "pValue"],
    label: "connection consistency"
  }
];

// Controls for object data
var objectControls = [
  {
    name: "connectionValue",
    value: "mean",
    values: ["mean", "median"],
    label: "connection value"
  },
  {
    name: "connectionConsistency",
    value: "extremeness",
    values: ["extremeness", "variabililty", "pValue"],
    label: "connection consistency"
  }
];

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

function variabililty(values) {
  var sd = simpleStatistics.standardDeviation(values);

  return 1 - 2 * sd;
}

function pValue(a1, a2) {
  if (a1.length <= 1 || a2.length <= 1) return 0;

  var stat = ttest(a1, a2);

  return stat.pValue();
}

function categoricalRegression(categorical, numeric) {
  // n - 1 dummy categories
  var categories = categorical.categories.slice(0, -1);

  console.log(categories.length + 1);

  // Setup multiple regression
  var x = categories.map(function (category) {
    return categorical.values.map(function (value) {
      return value.value === category ? 1 : 0;
    });
  });

  var y = numeric.values.map(function (value) {
    return value.value;
  });

  // XXX: Performance issues with lots of categorical values
  var reg = regression(x, y);

  return Math.sqrt(reg.Rsquared);
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
  var objectConnectionValue = DataUtils.find(objectControls, "name", "connectionValue").value;
  var objectConnectionConsistency = DataUtils.find(objectControls, "name", "connectionConsistency").value;
  var dimensionConnectionValue = DataUtils.find(dimensionControls, "name", "connectionValue").value;
  var dimensionConnectionConsistency = DataUtils.find(dimensionControls, "name", "connectionConsistency").value;

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

        case "median":
          value = simpleStatistics.median(selectedValues);
          break;

        default:
          console.log("Unknown object connection value");
      }

      switch (objectConnectionConsistency) {
        case "extremeness":
          consistency = extremeness(selectedValues);
          break;

        case "variabililty":
          consistency = variabililty(selectedValues);
          break;

        case "pValue":
          var unselectedValues = unselectedDimensions.map(function (dimension) {
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

        case "median":
          value = simpleStatistics.median(selectedSimilarities);
          break;

        default:
          console.log("Unknown object connection value");
      }

      switch (objectConnectionConsistency) {
        case "extremeness":
          consistency = extremeness(selectedSimilarities);
          break;

        case "variabililty":
          consistency = variabililty(selectedSimilarities);
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
      var value;
      var consistency;

      var selectedValues = selectedObjects.map(function (object) {
        return object.values[i].normalized;
      });

      switch (dimensionConnectionValue) {
        case "mean":
          value = simpleStatistics.mean(selectedValues);
          break;

        case "median":
          value = simpleStatistics.median(selectedValues);
          break;

        default:
          console.log("Unknown dimension connection value");
      }

      switch (dimensionConnectionConsistency) {
        case "extremeness":
          consistency = extremeness(selectedValues);
          break;

        case "variabililty":
          consistency = variabililty(selectedValues);
          break;

        case "pValue":
          var unselectedValues = unselectedObjects.map(function (object) {
            return object.values[i].normalized;
          });

          consistency = 1 - pValue(selectedValues, unselectedValues);
          break;

        default:
          console.log("Uknown dimension connection consistency");
      }

      dimension.connection = {
        value: value,
        consistency: consistency
      };

      //// XXX: Move relation computation to separate function
      var selectedValues1 = selectedObjects.map(function (object) {
        return object.values[i].value;
      });

      for (var j = i; j < data.dimensions.length; j++) {
        if (i === j) {
          // Correlation with self, distance of 0
          dimension.tsneInput[i] = 0;

          continue;
        }

        var d2 = data.dimensions[j];

        if (selectedObjects.length === 1) {
          var v1 = selectedObjects[0].values[i].normalized;
          var v2 = selectedObjects[0].values[j].normalized;
          var v = Math.abs(v1 - v2);

          dimension.tsneInput[j] = v;
          d2.tsneInput[i] = v;

          continue;
        }

        var selectedValues2 = selectedObjects.map(function (object) {
          return object.values[j].value;
        });

        var v = 1 - Math.abs(simpleStatistics.sampleCorrelation(selectedValues1, selectedValues2));

        if (isNaN(v)) {
          v = 0;
        }

        dimension.tsneInput[j] = v;
        d2.tsneInput[i] = v;
      }
    });
  }
  else if (selectedDimensions.length > 0) {
    var value;
    var consistency;

    data.dimensions.forEach(function (dimension, i) {
      var selectedRelations = selectedDimensions.map(function (selected) {
        return normalize(selected.relations[i].value, -1, 1);
      });

      switch (dimensionConnectionValue) {
        case "mean":
          value = simpleStatistics.mean(selectedRelations);
          break;

        case "median":
          value = simpleStatistics.median(selectedRelations);
          break;

        default:
          console.log("Unknown dimension connection value");
      }

      switch (dimensionConnectionConsistency) {
        case "extremeness":
          consistency = extremeness(selectedRelations);
          break;

        case "variabililty":
          consistency = variabililty(selectedRelations);
          break;

        case "pValue":
          var unselectedRelations = unselectedDimensions.map(function (unselected) {
            return normalize(unselected.relations[i].value, -1, 1);
          });

          consistency = 1 - pValue(selectedRelations, unselectedRelations);
          break;

        default:
          console.log("Uknown dimension connection consistency");
      }

      dimension.connection = {
        value: value,
        consistency: consistency
      };

      ////
      dimension.tsneInput = dimension.relations.map(function (relation) {
        return 1 - Math.abs(relation.value);
      });
    });
  }
  else {
    data.dimensions.forEach(function (dimension) {
      dimension.connection = null;

      ////
      dimension.tsneInput = dimension.relations.map(function (relation) {
        return 1 - Math.abs(relation.value);
      });
    });
  }

  console.log(data);
}

function processData(inputData) {
  data = {};

  // Get id column if present
  var id = inputData.columns[0] === "" ? inputData.columns[0] : null;

  // Create dimensions
  data.dimensions = [];
  inputData.columns.filter(function (column) {
    // Don't include id column
    if (column === id) return false;

    data.dimensions.push(column);
  });

  data.dimensions = inputData.columns.filter(function (column) {
    return column !== id;
  }).map(function (column) {
    // Check for categorical
    var categorical = false;

    for (var i = 0; i < inputData.length; i++) {
      var v = inputData[i][column];

       if (isNaN(+v)) {
         categorical = true;
         break;
      }
    }

    return {
      name: column,
      categorical: categorical,
      relations: [],
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
        var value = inputData[i][dimension.name];

        if (!dimension.categorical) value = +value;

        return {
          dimension: dimension,
          value: value
        };
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

    if (dimension.categorical) {
      var categories = d3.set(dimension.values.map(function (value) {
        return value.value;
      }));

      dimension.categories = categories.values();

      dimension.values.forEach(function (value) {
        value.normalized = 0.5;
      });
    }
    else {
      var extent = d3.extent(dimension.values, function (value) {
        return value.value;
      });

      dimension.min = extent[0];
      dimension.max = extent[1];

      dimension.values.forEach(function (value) {
        value.normalized = normalize(value.value, dimension.min, dimension.max);
      });
    }
  });

  // Add normalized values to objects
  data.objects.forEach(function (object, i) {
    object.values.forEach(function (value) {
      value.normalized = value.dimension.values[i].normalized;
    });
  });

  // Add relations to dimensions
  for (var i = 0; i < data.dimensions.length; i++) {
    var d1 = data.dimensions[i];
    for (var j = i; j < data.dimensions.length; j++) {
      if (i === j) {
        // Relation to self
        d1.relations.push({
          dimension: d1,
          value: 1
        });

        continue;
      }

      var d2 = data.dimensions[j];

      var r;

      if (d1.categorical && d2.categorical) {
        r = 0;
      }
      else if (d1.categorical) {
         r = categoricalRegression(d1, d2);
      }
      else if (d2.categorical) {
        r = categoricalRegression(d2, d1);
      }
      else {
        r = simpleStatistics.sampleCorrelation(
          d1.values.map(function (value) { return value.value; }),
          d2.values.map(function (value) { return value.value; })
        );
      }

      d1.relations.push({
        dimension: d2,
        value: r
      });

      d2.relations.push({
        dimension: d1,
        value: r
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
    dimension.tsneInput = dimension.relations.map(function (relation) {
      return 1 - Math.abs(relation.value);
    });
  });

  data.objects.forEach(function (object) {
    object.tsneInput = object.values.map(function (value) {
      return normalize(value.value, value.dimension.min, value.dimension.max);
    });
  });

  console.log(data);

  console.log(data.dimensions.filter(function (d) {
    return d.categorical;
  }));
}

function setDimensionControl(name, value) {
  var control = DataUtils.find(dimensionControls, "name", name);

  if (control) control.value = value;

  updateConnections();
}

function setObjectControl(name, value) {
  var control = DataUtils.find(objectControls, "name", name);

  if (control) control.value = value;

  updateConnections();
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
  },
  getDimensionControls: function () {
    return dimensionControls;
  },
  getObjectControls: function () {
    return objectControls;
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

    case Constants.CHANGE_DIMENSION_CONTROL:
      setDimensionControl(action.name, action.value);
      DataStore.emitChange();
      break;

    case Constants.CHANGE_OBJECT_CONTROL:
      setObjectControl(action.name, action.value);
      DataStore.emitChange();
      break;
  }
});

module.exports = DataStore;
