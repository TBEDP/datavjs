/*global Raphael, d3, $, define, _ */
/*!
 * StreamLegend的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Cover', function (require) {
  var DataV = require('DataV');
  //cover
  var Cover = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      var conf = this.defaults;
      this.node = $(container);
      this.node.css({
        "position": "absolute",
        "left": 0,
        "top": 0,
        "width": conf.chartWidth,
        "height": conf.chartHeight,
        "zIndex": 100,
        "visibility": "hidden"
      }).bind("mousemove", $.proxy(function (e) {
        this.mouse = {x: e.pageX, y: e.pageY};
        e.stopPropagation();
      }, this)).bind("mouseleave", $.proxy(function () {
        this.mouse = undefined;
      }, this));
    }
  });

  return Cover;
});