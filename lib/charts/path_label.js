/*global Raphael, d3, $, define, _ */
/*!
 * PathLabel的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('PathLabel', function (require) {
  var DataV = require('DataV');
  //pathLabel
  var PathLabel = DataV.extend(DataV.Chart, {
    initialize: function (stream) {
      this.stream = stream;
    }
  });

  PathLabel.prototype.render = function () {
    this.clear();
    var stream = this.stream;
    var paths = stream.chart.paths;
    var conf = stream.defaults;
    var pathSource = stream.chart.pathSource;
    var labels = [];
    var getLabelLocation = function (locArray, el) {
      var x = 0,
        y = 0,
        i;
      var ratioMargin = 0.15;
      var index = 0;
      var max = 0;
      var box = el.getBBox();
      var xInterval;
      var minTop, maxBottom;
      var showLabel = true;
      var loc;
      var height;

      xInterval = Math.ceil(box.width / (locArray[1].x - locArray[0].x) / 2);
      if (xInterval === 0) {
        xInterval = 1;
      }

      locArray.forEach(function (d, i, array) {
        var m = Math.max(ratioMargin * array.length, xInterval);
        if (i >= m && i <= array.length - m) {
          if (d.y > max) {
            minTop = d.y0 - d.y;
            maxBottom = d.y0;
            max = d.y;
            index = i;
          }
        }
      });
      for (i = index - xInterval; i <= index + xInterval; i++) {
        if (i < 0 || i >= locArray.length) {
            height = 0;
            showLabel = false;
            break;
        }
        loc = locArray[i];
        //top's y is small
        if (loc.y0 - loc.y > minTop) {
            minTop = loc.y0 - loc.y;
        }
        if (loc.y0 < maxBottom) {
            maxBottom = loc.y0;
        }
      }

      if (showLabel && maxBottom - minTop >= box.height * 0.8) {
        x = locArray[index].x;
        y = (minTop + maxBottom) / 2;
      } else {
        showLabel = false;
      }

      return {
        x: x,
        y: y,
        showLabel: showLabel
      };
    };

    stream.labels = labels;
    var i, l, label, path;
    for (i = 0, l = paths.length; i < l; i++) {
      path = paths[i];
      label = stream.chart.paper.text(0, 0,
        conf.pathLabel ?
          stream.getDisplayRowInfo(i).rowName + " " + (Math.round(stream.getDisplayRowInfo(i).rowSum * 10000) / 100) + "%" : "")
        .attr({
          "text-anchor": "middle",
          "fill": "white",
          "font-size": conf.fontSize,
          "font-family": "微软雅黑"
        });
      label.labelLoc = getLabelLocation(pathSource[i], label);

      if (label.labelLoc.showLabel) {
        label.attr({
          "x": label.labelLoc.x,
          "y": label.labelLoc.y
        });
      } else {
        label.attr({"opacity": 0});
      }
      if (i === 0 && stream.getDisplayRowInfo(i).rowIndex === -1) {
        path.attr({"cursor": "pointer"});
        label.attr({"cursor": "pointer"});
      } else {
        path.attr({"cursor": "auto"});
        label.attr({"cursor": "auto"});
      }
      labels.push(label);
    }
  };
  PathLabel.prototype.hidden = function () {
    this.stream.labels.forEach(function (d) {
      d.hide();
    });
  };
  PathLabel.prototype.show = function () {
    this.stream.labels.forEach(function (d) {
      if (d.labelLoc.showLabel) {
        d.show();
      }
    });
  };
  PathLabel.prototype.clear = function () {
    var stream = this.stream;
    if (stream.labels) {
      stream.labels.forEach(function (d) {
        d.remove();
      });
    }
  };
  return PathLabel;
});
