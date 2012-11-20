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
})('Percentage', function (require) {
  var DataV = require('DataV');

  var Percentage = DataV.extend(DataV.Widget, {
    initialize: function (container) {
      this.node = $(container);
    }
  });

  Percentage.prototype.init = function () {
    var owner = this.owner;
    var conf = owner.defaults;
    this.paper = new Raphael(this.node[0], conf.percentageWidth, conf.chartHeight);
    this.node.css({
      "width": conf.percentageWidth + "px",
      "height": conf.chartHeight + "px",
      "float": "left",
      "margin-bottom": "0px",
      "border-bottom": "0px",
      "padding-bottom": "0px"
    });
    this.statDataMaxY = d3.max(owner.statisticData.columnSum);
  };

  Percentage.prototype.render = function () {
    this.init();
    var owner = this.owner;
    if (!owner.defaults.moreConfig.more) {
      return;
    }
    var conf = owner.defaults;
    var maxY = owner.chart.getMaxY() / this.statDataMaxY;
    var y = maxY > 0.1 ? (1 - maxY) * conf.chartHeight + conf.fontSize * 2 / 3 
        : (1 - maxY) * conf.chartHeight - conf.fontSize * 2 / 3;

    if (!this.rect) {//init
      this.rect = this.paper.rect(0, (1 - maxY) * conf.chartHeight, conf.percentageWidth, maxY * conf.chartHeight)
      .attr({
        "fill": "#f4f4f4",
        "stroke": "#aaa",
        "stroke-width": 0.5
      });
      this.text = this.paper.text(conf.percentageWidth / 2, y, Math.round(maxY * 100) + "%")
      .attr({"text-anchor": "middle"});
    }
    this.rect.animate({"y": (1 - maxY) * conf.chartHeight, "height": maxY * conf.chartHeight}, 750);
    this.text.attr({
      "text": Math.round(maxY * 100) + "%"
    }).animate({"y": y}, 750);
  };

  return Percentage;
});