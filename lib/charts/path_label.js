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
    initialize: function () {
      /**
       * 类型纬度
       */
      this.dimension.type = {
        type: "string",
        required: true,
        index: 1
      };
      /**
       * 时间纬度
       */
      this.dimension.x = {
        type: "string",
        required: true,
        index: 0
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

  PathLabel.prototype.render = function () {
    this.clear();
    var owner = this.owner;
    var paths = owner.paths;
    var conf = this.defaults;
    var pathSource = owner.pathSource;
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

    var getPathLabel = this.defaults.getPathLabel || this.getPathLabel;
    for (var i = 0, l = paths.length; i < l; i++) {
      var path = paths[i];
      var row = this.groupedByType[this.types[i]];
      var obj = {
        type: this.types[i],
        rank: row.rank,
        sum: row.sum,
        total: this.total
      };
      var text = getPathLabel.call(this, obj);
      var label = owner.paper.text(0, 0, text).attr({
        "textAnchor": "middle",
        "fill": "white",
        "fontSize": conf.fontSize,
        "fontFamily": "微软雅黑"
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
      if (i === 0) {
        path.attr({"cursor": "pointer"});
        label.attr({"cursor": "pointer"});
      } else {
        path.attr({"cursor": "auto"});
        label.attr({"cursor": "auto"});
      }
      labels.push(label);
    }
    this.labels = labels;
  };

  PathLabel.prototype.getPathLabel = function (obj) {
    return obj.type + " " + "排名: 第" + obj.rank;
  };

  PathLabel.prototype.hidden = function () {
    this.labels.forEach(function (d) {
      d.hide();
    });
  };

  PathLabel.prototype.show = function () {
    this.labels.forEach(function (d) {
      if (d.labelLoc.showLabel) {
        d.show();
      }
    });
  };

  PathLabel.prototype.clear = function () {
    if (this.labels) {
      this.labels.forEach(function (d) {
        d.remove();
      });
    }
  };

  PathLabel.prototype.setSource = function (source, map) {
    var that = this;
    this.map(map);
    this.groupedByType = _.groupBy(source, this.mapping.type);
    var sorted = _.sortBy(this.groupedByType, function (group, type) {
      var sum = DataV.sum(group, that.mapping.value);
      that.groupedByType[type].sum = sum;
      return -sum;
    });
    this.types = _.keys(this.groupedByType);
    _.each(sorted, function (list, index) {
      that.groupedByType[list[0][that.mapping.type]].rank = index + 1;
    });
    this.total = DataV.sum(_.map(that.groupedByType, function (group) {
      return group.sum;
    }));
  };

  return PathLabel;
});
