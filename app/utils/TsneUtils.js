var TsneWorker = require("worker-loader!../workers/TsneWorker.js");

function parameterValues(parameters) {
  var values = {};

  parameters.forEach(function (parameter) {
    values[parameter.name] = parameter.value;
  });

  return values;
}

module.exports = function() {
  // Web worker for tSNE
  var worker = null;

  var tsne = {
    startTsne: function (data, parameters) {
      createWorker();

      worker.postMessage({
        type: "INPUT_DATA",
        data: data
      });

      worker.postMessage({
        type: 'RUN',
        data: parameterValues(parameters)
      });
    },

    stopTsne: function () {
      if (worker) worker.terminate();
    },

    // To be supplied by the user
    onProgressStatus: function () {},
    onProgressIter: function () {},
    onProgressData: function () {},
    onStatus: function () {},
    onDone: function () {}
  };

  function createWorker() {
    if (worker) worker.terminate()

    // Create the web worker for running tSNE in the background
    worker = new TsneWorker();

    worker.onmessage = function (e) {
      var msg = e.data;

      switch (msg.type) {
        case 'PROGRESS_STATUS':
          tsne.onProgressStatus(msg);
          break;

        case 'PROGRESS_ITER':
          tsne.onProgressIter(msg);
          break;

        case 'PROGRESS_DATA':
          tsne.onProgressData(msg);
          break;

        case 'STATUS':
          tsne.onStatus(msg);
          break;

        case 'DONE':
          tsne.onDone(msg);
          break;

        default:
          console.log("Unknown message type: ", msg.type);
      }
    };
  }

  return tsne;
}
