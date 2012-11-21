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
})('HoverLine', function (require) {
  var DataV = require('DataV');
  var HoverLine = DataV.extend(DataV.Chart, {
    initialize: function () {
    }
  });

  HoverLine.prototype.render = function () {
    this.clear();
    var paper = this.owner.paper;
    var conf = this.defaults;
    this.indicatorLine = paper.path("M0 0V" + conf.chartHeight).attr({
      stroke: "none",
      "stroke-width": 1,
      "stroke-dasharray": "- "
    });
    this.highlightLine = paper.path("M0 0V" + conf.chartHeight).attr({
      stroke: "none",
      "stroke-width": 2
    });
  };
  HoverLine.prototype.hidden = function () {
    this.indicatorLine.attr({"stroke": "none"});
    this.highlightLine.attr({"stroke": "none"});
  };
  HoverLine.prototype.show = function () {
    this.indicatorLine.attr({"stroke": "#000"});
    this.highlightLine.attr({"stroke": "white"});
  };

  HoverLine.prototype.refresh = function (columnIndex, rowIndex) {
    //refresh lines' position
    var owner = this.owner;
    var pathSource = owner.pathSource;
    var lineX = this.defaults.chartWidth * columnIndex / (owner.columnCount - 1);
    var pathSourceCell = pathSource[pathSource.length - 1][columnIndex];
    this.indicatorLine.attr({
      path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSource[0][columnIndex].y0
    });

    if (typeof rowIndex !== 'undefined') {
      pathSourceCell = pathSource[rowIndex][columnIndex];
      this.highlightLine.attr({
        path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSourceCell.y0
      });

      if (rowIndex === 0) {
        this.highlightLine.attr({"cursor": "pointer"});
      } else {
        this.highlightLine.attr({"cursor": "auto"});
      }
    }
  };

  HoverLine.prototype.clear = function () {
    this.indicatorLine && this.indicatorLine.remove();
    this.highlightLine && this.highlightLine.remove();
  };

  return HoverLine;
});
