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

  var Percentage = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.node = $(container);
      this.limit = 20;
      this.from = 0;
      this.to = 0;
      /**
       * 类型纬度
       */
      this.dimension.type = {
          type: "string",
          required: true,
          index: 1
      };
      /**
       * 值纬度
       */
      this.dimension.value = {
          type: "number",
          required: true,
          index: 2
      };
    }
  });

  Percentage.prototype.init = function () {
    var conf = this.defaults;
    this.paper = new Raphael(this.node[0], conf.percentageWidth, conf.chartHeight);
    this.node.css({
      "width": conf.percentageWidth,
      "height": conf.chartHeight,
      "float": "left",
      "margin-bottom": "0px",
      "border-bottom": "0px",
      "padding-bottom": "0px"
    });
  };

  Percentage.prototype.setSource = function (source, map) {
    map = this.map(map);
    this.grouped = _.groupBy(source, map.type);
    this.types = _.keys(this.grouped);
    if (this.types.length > this.limit) {
      this.to = this.limit;
    }
  };

  Percentage.prototype.render = function () {
    this.init();
    var conf = this.defaults;
    var y = conf.fontSize * 2 / 3;
    if (!this.rect) {//init
      this.rect = this.paper.rect(0, 0, conf.percentageWidth, conf.chartHeight)
      .attr({
        "fill": "#f4f4f4",
        "stroke": "#aaa",
        "stroke-width": 0.5
      });
      this.text = this.paper.text(conf.percentageWidth / 2, y, Math.round(100) + "%")
      .attr({"text-anchor": "middle"});
    }
    // this.rect.animate({"y": (1 - maxY) * conf.chartHeight, "height": maxY * conf.chartHeight}, 750);
    // this.text.attr({
    //   "text": Math.round(maxY * 100) + "%"
    // }).animate({"y": y}, 300);
  };

  return Percentage;
});