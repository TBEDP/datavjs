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
    var conf = this.owner.defaults;
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

  HoverLine.prototype.refresh = function (xIdx, pathIndex) {
    //refresh lines' position
    var owner = this.owner;
    var pathSource = owner.pathSource;
    var lineX = owner.defaults.chartWidth * xIdx / (owner.source[0].length - 1);
    var pathSourceCell = pathSource[pathSource.length - 1][xIdx];
    this.indicatorLine.attr({
      path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSource[0][xIdx].y0
    });

    pathSourceCell = pathSource[pathIndex][xIdx];
    this.highlightLine.attr({
      path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSourceCell.y0
    });
  
    if (pathIndex === 0 && owner.getDisplayRowInfo(pathIndex).rowIndex === -1) {
      this.highlightLine.attr({"cursor": "pointer"});
    } else {
      this.highlightLine.attr({"cursor": "auto"});
    }
  };

  HoverLine.prototype.clear = function () {
    this.indicatorLine && this.indicatorLine.remove();
    this.highlightLine && this.highlightLine.remove();
  };

  return HoverLine;
});
