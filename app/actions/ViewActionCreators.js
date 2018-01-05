var AppDispatcher = require("../dispatcher/AppDispatcher");
var Constants = require("../constants/Constants");

module.exports = {
  // Dimension selection
  selectDimension: function (dimension) {
    AppDispatcher.dispatch({
      actionType: Constants.SELECT_DIMENSION,
      dimension: dimension
    });
  },
  highlightDimension: function (dimension) {
    AppDispatcher.dispatch({
      actionType: Constants.HIGHLIGHT_DIMENSION,
      dimension: dimension
    });
  },

  // Object selection
  selectObject: function (object) {
    AppDispatcher.dispatch({
      actionType: Constants.SELECT_OBJECT,
      object: object
    });
  },
  highlightObject: function (object) {
    AppDispatcher.dispatch({
      actionType: Constants.HIGHLIGHT_OBJECT,
      object: object
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
