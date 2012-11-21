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
})('Tip', function (require) {
  var DataV = require('DataV');
  //floatTag
  var Tip = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.container = container;
      this.node = DataV.FloatTag()(this.container);
      this.hidden();
    },
    getContent: function (index) {
      return "呵呵";
    }
  });
  // stream.floatTag.setContent(stream.getFloatTagContent(stream.displayData.allInfos[i][0]));
  Tip.prototype.setContent = function (index) {
    var html = this.getContent(index);
    this.node.html(html);
  };
  Tip.prototype.setCss = function (cssJson) {
    this.node.css(cssJson);
  };

  return Tip;
});