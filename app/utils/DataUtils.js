module.exports = {
  // Find the first object in an array by key/value pair
  find: function (array, key, value) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) return array[i];
    }

    return null;
  },

  // Remove non "word" characters from a string
  removeNonWord: function (s) {
    return s.replace(/\W/g, "");
  }
}
