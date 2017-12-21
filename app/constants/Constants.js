var keyMirror = require("keymirror");

module.exports = keyMirror({
  RECEIVE_DATA: null,

  SELECT_DIMENSION: null,
  HIGHLIGHT_DIMENSION: null,

  SELECT_OBJECT: null,
  HIGHLIGHT_OBJECT: null,

  CHANGE_DIMENSION_TSNE_PARAMETER: null,
  RESET_DIMENSION_TSNE_PARAMETERS: null,
  RERUN_DIMENSION_TSNE: null,
  STOP_DIMENSION_TSNE: null,

  CHANGE_OBJECT_TSNE_PARAMETER: null,
  RESET_OBJECT_TSNE_PARAMETERS: null,
  RERUN_OBJECT_TSNE: null,
  STOP_OBJECT_TSNE: null
});
