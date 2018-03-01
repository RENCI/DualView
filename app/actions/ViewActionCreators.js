var AppDispatcher = require("../dispatcher/AppDispatcher");
var Constants = require("../constants/Constants");

module.exports = {
  // Dimension selection
  selectDimensions: function (dimensions, selected) {
    AppDispatcher.dispatch({
      actionType: Constants.SELECT_DIMENSIONS,
      dimensions: dimensions,
      selected: selected
    });
  },
  highlightDimensions: function (dimensions) {
    AppDispatcher.dispatch({
      actionType: Constants.HIGHLIGHT_DIMENSIONS,
      dimensions: dimensions
    });
  },

  // Object selection
  selectObjects: function (objects, selected) {
    AppDispatcher.dispatch({
      actionType: Constants.SELECT_OBJECTS,
      objects: objects,
      selected: selected
    });
  },
  highlightObjects: function (objects) {
    AppDispatcher.dispatch({
      actionType: Constants.HIGHLIGHT_OBJECTS,
      objects: objects
    });
  },

  // Dimension visualization controls
  changeDimensionControl: function (name, value) {
    AppDispatcher.dispatch({
      actionType: Constants.CHANGE_DIMENSION_CONTROL,
      name: name,
      value: value
    });
  },

  // Object visualization controls
  changeObjectControl: function (name, value) {
    AppDispatcher.dispatch({
      actionType: Constants.CHANGE_OBJECT_CONTROL,
      name: name,
      value: value
    });
  },

  // Dimension tSNE controls
  changeDimensionTsneParameter: function (name, value) {
    AppDispatcher.dispatch({
      actionType: Constants.CHANGE_DIMENSION_TSNE_PARAMETER,
      name: name,
      value: value
    });
  },
  resetDimensionTsneParameters: function () {
    AppDispatcher.dispatch({
      actionType: Constants.RESET_DIMENSION_TSNE_PARAMETERS
    });
  },
  rerunDimensionTsne: function () {
    AppDispatcher.dispatch({
      actionType: Constants.RERUN_DIMENSION_TSNE
    });
  },
  stopDimensionTsne: function () {
    AppDispatcher.dispatch({
      actionType: Constants.STOP_DIMENSION_TSNE
    });
  },

  // Object tSNE controls
  changeObjectTsneParameter: function (name, value) {
    AppDispatcher.dispatch({
      actionType: Constants.CHANGE_OBJECT_TSNE_PARAMETER,
      name: name,
      value: value
    });
  },
  resetObjectTsneParameters: function () {
    AppDispatcher.dispatch({
      actionType: Constants.RESET_OBJECT_TSNE_PARAMETERS
    });
  },
  rerunObjectTsne: function () {
    AppDispatcher.dispatch({
      actionType: Constants.RERUN_OBJECT_TSNE
    });
  },
  stopObjectTsne: function () {
    AppDispatcher.dispatch({
      actionType: Constants.STOP_OBJECT_TSNE
    });
  }
};
