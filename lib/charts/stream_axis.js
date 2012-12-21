/*global Raphael, d3, $, define, _ */
/*!
 * Stream的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('StreamAxis', function (require) {
  var DataV = require('DataV');
  DataV.Axis = require('Axis');
  var Axis = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.node = $(container);
      /**
       * 时间纬度
       */
      this.dimension.x = {
        type: "string",
        required: true,
        index: 0
      };
    }
  });

  Axis.prototype.setSource = function (source, map) {
    map = this.map(map);
    this.grouped = _.groupBy(source, map.x);
    this.axis = _.keys(this.grouped);
    this.range = [0, this.axis.length - 1];
  };

  Axis.prototype.init = function () {
    var conf = this.defaults;
    this.paper = new Raphael(this.node[0], conf.legendBesidesWidth, conf.axisHeight);
    this.node.css({
      "margin-top": "0px",
      "border-top": "1px solid #ddd",
      "height": conf.axisHeight + "px"
    });
  };

  Axis.prototype.render = function () {
    this.init();
    this.clear();
    //all date strings' format are same, string length are same 
    var conf = this.defaults,
      that = this;
    var getPopPath = function (El) {
        //down pop
        var x = 0,
          y = 0,
          size = 4,
          cw = 23,
          bb = {height: 8};
        if (El) {
          bb = El.getBBox();
          bb.height *= 0.6;
          cw = bb.width / 2 - size;
        }
        return [
          'M', x, y,
          'l', size, size, cw, 0,
          'a', size, size, 0, 0, 1, size, size,
          'l', 0, bb.height,
          'a', size, size, 0, 0, 1, -size, size,
          'l', -(size * 2 + cw * 2), 0,
          'a', size, size, 0, 0, 1, -size, -size,
          'l', 0, -bb.height,
          'a', size, size, 0, 0, 1, size, -size,
          'l', cw, 0,
          'z'
        ].join(',');
      };
    var left = conf.percentageWidth,
      right = conf.legendBesidesWidth - conf.percentageWidth;
    var tempWord = this.paper.text(0, 0, this.axis[0]);
    var tickNumber = Math.floor((right - left) / tempWord.getBBox().width / 2) + 1;
    tempWord.remove();

    this.dateScale = d3.scale.linear()
      .domain([0, this.axis.length - 1])
      .range([left, right]);
    DataV.Axis().scale(this.dateScale)
      .ticks(tickNumber)
      .tickSize(6, 3, 3)
      .tickAttr({"stroke": "none"})
      .minorTickAttr({"stroke": "none"})
      .domainAttr({"stroke": "none"})
      .tickFormat(function (d) {
        return that.axis[d] || "";
      })(this.paper);

    this.axisPopText = this.paper.text(0, 11, this.axis[0])
      .attr({
        "text-anchor": "middle",
        "fill": "#fff",
        "transform": "t" + left + ",0"
      }).hide();
    this.axisPopBubble = this.paper.path(getPopPath(this.axisPopText))
      .attr({
        "fill": "#000",
        "transform": "t" + (-10000) + ",0"
      }).toBack()
      .hide();
  };
  Axis.prototype.hideTab = function () {
    this.axisPopText.hide();
    this.axisPopBubble.hide();
  };
  Axis.prototype.showTab = function () {
    this.axisPopText.show();
    this.axisPopBubble.show();
  };
  Axis.prototype.refreshTab = function (index) {
    var conf = this.defaults;
    var x = conf.chartWidth * index / (this.axis.length - 1);
    var transX = x + this.defaults.percentageWidth;
    this.axisPopText.attr({
      "text": this.axis[index + this.range[0]]
    }).transform("t" + transX + ",0");
    this.axisPopBubble.transform("t" + transX + ",0");
  };
  Axis.prototype.clear = function () {
    this.paper.clear();
  };
  return Axis;
});