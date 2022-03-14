var arr = [];
var each = arr.forEach;
var slice = arr.slice;

module.exports.extend = function(obj) {
    each.call(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

module.exports.processArgs = function(opts, callback, defaultOpts) {
    if (!callback && typeof opts === 'function') {
      callback = opts;
      opts = null;
    }
    return {
      callback: callback,
      opts: module.exports.extend({}, defaultOpts, opts)
    };
  };