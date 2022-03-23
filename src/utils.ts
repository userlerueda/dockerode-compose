var arr: any[] = [];
var each = arr.forEach;
var slice = arr.slice;

module.exports.extend = function(obj: { [x: string]: any; }) {
    each.call(slice.call(arguments, 1), function(source: { [x: string]: any; }) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

module.exports.processArgs = function(opts: any, callback: any, defaultOpts: any) {
    if (!callback && typeof opts === 'function') {
      callback = opts;
      opts = null;
    }
    return {
      callback: callback,
      opts: module.exports.extend({}, defaultOpts, opts)
    };
  };