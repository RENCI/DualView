var tsne = require("tsne-js");

// Status functions for web worker
function isBusy () {
  postMessage({
    type: 'STATUS',
    data: 'BUSY'
  });
}

function isReady () {
  postMessage({
    type: 'STATUS',
    data: 'READY'
  });
}

isBusy();

// Create default model
var model = new tsne({
  dim: 2,
  perplexity: 7,
  earlyExaggeration: 4.0,
  learningRate: 100.0,
  nIter: 5000,
  metric: 'jaccard'
});

// The self read-only property of the WorkerGlobalScope interface returns a reference to the WorkerGlobalScope itself
self.onmessage = function (e) {
  var msg = e.data;

  switch (msg.type) {
    case 'INPUT_DATA':
      isBusy();

      model.init({
        data: msg.data,
        type: 'dense'
      });

      isReady();

      break;

    case 'RUN':
      isBusy();

      model.perplexity = msg.data.perplexity;
      model.earlyExaggeration = msg.data.earlyExaggeration;
      model.learningRate = msg.data.learningRate;
      model.nIter = msg.data.nIter;
      model.metric = msg.data.metric;

      model.run();

      postMessage({
        type: 'DONE',
        data: model.getOutputScaled()
      });

      isReady();

      break;

    default:
      console.log("Unknown tSNE worker message type");
  }
};

// Emitted progress events
model.on('progressIter', function (iter) {
  // data: [iter, error, gradNorm]
  postMessage({
    type: 'PROGRESS_ITER',
    data: iter
  });
});

model.on('progressStatus', function (status) {
  postMessage({
    type: 'PROGRESS_STATUS',
    data: status
  });
});

model.on('progressData', function (data) {
  postMessage({
    type: 'PROGRESS_DATA',
    data: data
  });
});
