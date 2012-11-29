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
})('Stream', function (require) {
  var DataV = require('DataV');
  var HoverLine = require('HoverLine');
  var PathLabel = require('PathLabel');
  //streamChart
  var Stream = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.node = this.checkContainer(node);

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

      this.defaults.width = 500;
      this.defaults.height = 300;
      this.defaults.offset = "expand";//zero, expand, silhou-ette, wiggle;
      this.defaults.order = "default";//default, reverse, inside-out //in this Stream application, it will always be default, the real order is adjusted in Stream's data-process.
      this.defaults.animateDuration = 750;
      this.defaults.animateOrder = undefined;
      this.paths = undefined;
      this.source = undefined;
      this.layoutData = undefined;
      this.pathSource = undefined; 
      this.setOptions(options);
      this.createPaper();
    }
  });

  Stream.prototype.createPaper = function () {
    var conf = this.defaults;
    this.paper = new Raphael(this.node, conf.width, conf.height);
  };

  Stream.prototype.setSource = function (source, map) {
    this.map(map);
    this.rawData = source;
    this.rawMap = map;
    var that = this;
    // 按类型分组
    var grouped = _.groupBy(source, this.mapping.type);
    this.rowCount = _.keys(grouped).length;
    this.columnCount = _.keys(_.groupBy(source, this.mapping.x)).length;
    // 组内按横轴排序
    _.forEach(grouped, function (group, type) {
      grouped[type] = _.sortBy(group, that.mapping.x);
    });
    this.sorted = _.sortBy(grouped, function (group) {
      return 0 - DataV.sum(group, that.mapping.value);
    });

    this.remaped = this.remapSource();
    this.layoutData = this.getLayoutData();
  };

  Stream.prototype.remapSource = function () {
    var sorted = this.sorted;
    var remap = [];
    for (var j = 0; j < this.columnCount; j++) {
      var plucked = _.pluck(sorted, j);
      var sum = DataV.sum(plucked, this.mapping.value);
      for (var i = 0; i < this.rowCount; i++) {
        remap[i] = remap[i] || [];
        remap[i][j] = {};
        remap[i][j].x = j;
        var rate = sorted[i][j][this.mapping.value] / sum;
        remap[i][j].y = rate;
        sorted[i][j].rate = rate;
      }
    }
    return remap;
  };

  /*!
   * 获取等级数据
   */
  Stream.prototype.getLayoutData = function () {
    var conf = this.defaults;
    var remaped = this.remaped;
    var that = this;

    if (!conf.more) {
      return remaped;
    } else {
      return DataV.more(remaped, conf.level, conf.max, function (remains) {
        var obj = [];
        for (var i = 0; i < that.columnCount; i++) {
          obj.push({
            x: i,
            y: DataV.sum(_.pluck(remains, i), 'y')
          });
        }
        return obj;
      });
    }
  };

  Stream.prototype.layout = function () {
    var conf = this.defaults;
    d3.layout.stack().offset(conf.offset).order(conf.order)(this.layoutData);
  };

  Stream.prototype.generateChartElements = function () {
    var conf = this.defaults;
    var paper = this.paper,
      paths = [];
    var area = this.generateArea();
    var colorFunc = this.getColor();

    // set div's background instread;
    paper.rect(0, 0, conf.chartWidth, conf.chartHeight).attr({
      "stroke": "none",
      "fill": "#e0e0e0"
    });

    for (var i = 0, l = this.layoutData.length; i < l; i++) {
      var areaString = area(this.pathSource[i]);
      var color = colorFunc(i);
      var path = paper.path(areaString).attr({
        fill: color,
        stroke: color,
        "stroke-width": 1
      });
      paths[i] = path;
    }
    this.paths = paths;
  };

  Stream.prototype.render = function (animate) {
    if (animate !== "animate") {
      this.clear();
      this.layout();
      this.generateChartElements();
    } else {
      this.layout();
      this.animate();
    }
    //hoverLine
    this.hoverLine = this.own(new HoverLine());
    this.hoverLine.render();//lines should be to front, so at last
    //pathLabel
    if (this.defaults.pathLabel) {
      this.pathLabel = this.own(new PathLabel());
      this.pathLabel.setSource(this.rawData, this.rawMap);
      this.pathLabel.render();
    }
    this.createInteractive();
  };

  Stream.prototype.animate = function () {
    var time = 0,
      area,
      colorFunc,
      color,
      i, l,
      _area,
      paths = [],
      order,
      anim,
      count = this.paths.length;
    var that = this;
    var animateCallback = function () {
      count -= 1;
      if (count > 0) {
        return;
      }
      that.animateCallback();
    };
    if (typeof this.defaults.animateDuration !== 'undefined') {
      time = this.defaults.animateDuration;
    }

    // if paths have not been created
    if (typeof this.paths === 'undefined') {
      this.generateChartElements();
    }

    area = this.generateArea();
    colorFunc = this.getColor();
    if (typeof this.defaults.animateOrder !== 'undefined') {
      order = this.defaults.animateOrder;
    } else {
      order = d3.range(this.pathSource.length);
    }
    for (i = 0, l = this.pathSource.length; i < l; i++) {
      _area = area(this.pathSource[i]);
      paths.push(_area);
    }
    for (i = 0, l = this.pathSource.length; i < l; i++) {
      color = colorFunc(i);
      anim = Raphael.animation({"path": paths[i]}, time, animateCallback);
      this.paths[order[i]].animate(anim);
    }
  };

  Stream.prototype.animateCallback = function () {
    var newOrderPaths = [];
    var that = this;
    if (typeof this.defaults.animateOrder !== 'undefined') {
      this.defaults.animateOrder.forEach(function (d, i) {
        newOrderPaths[i] = that.paths[d];
      });
      this.paths = newOrderPaths;
    }
  };

  Stream.prototype.clear = function () {
    this.paper.clear();
  };

  Stream.prototype.getColor = function (colorJson) {
    var colorMatrix = DataV.getColor();
    var color;
    var colorStyle = colorJson || {};
    var colorMode = colorStyle.mode || 'default';
    var i, l;

    switch (colorMode) {
    case "gradient":
      l = this.source.length;
      // 最大为 colorMatrix.length - 1
      var colorL = Math.min(Math.round(l / 5), colorMatrix.length - 1);
      var testColor = [colorMatrix[0][0], colorMatrix[colorL][0]];
      var test1 = DataV.gradientColor(testColor, "special");
      var testColorMatrix = [];
      var testColorMatrix1 = [];
      for (i = 0; i < l; i++) {
        testColorMatrix.push([test1(i / (l - 1)), test1(i / (l - 1))]);
      }

      for (i = l - 1; i >= 0; i--) {
        testColorMatrix1.push(testColorMatrix[i]);
      }
      colorMatrix = testColorMatrix;
      break;
    case "random":
    case "default":
      break;
    }

    var ratio = colorStyle.ratio || 0;
    ratio = Math.max(ratio, 0);
    ratio = Math.min(ratio, 1);

    var colorArray = colorMatrix.map(function () {
      return d3.interpolateRgb.apply(null, [colorMatrix[i][0], colorMatrix[i][1]])(ratio);
    });
    color = d3.scale.ordinal().range(colorArray);

    return color;
  };

  /*

   */
  Stream.prototype.getColor = function () {
    var count = this.layoutData.length;
    var color = this.defaults.gradientColor || ["#8be62f", "#1F4FD8"];
    var gradientColor = DataV.gradientColor(color, "special");
    var percent = 1 / count;
    var gotColors = [];

    for (var i = 0; i < count; i++) {
      gotColors.push(gradientColor(i * percent));
    }
    var midderNum = Math.floor(count / 2);
    return function (num) {
      return num % 2 === 0 ? gotColors[midderNum + num / 2] : gotColors[midderNum - (num + 1) / 2];
    };
  };

  Stream.prototype.getMaxY = function () {
    return d3.max(this.layoutData, function (d) {
      return d3.max(d, function (d) {
        return d.y0 + d.y;
      });
    });
  };

  Stream.prototype.mapPathSource = function () {
    var conf = this.defaults,
      maxX = this.layoutData[0].length - 1,
      maxY = this.getMaxY(), 
      width = conf.chartWidth,
      height = conf.chartHeight;

    this.pathSource = [];
    for (var i = 0, l = this.layoutData.length; i < l; i++) {
      this.pathSource[i] = [];
      for (var j = 0, l2 = this.layoutData[0].length; j < l2; j++) {
        var s = this.layoutData[i][j];
        var ps = this.pathSource[i][j] = {};
        ps.x = s.x * width / maxX;
        ps.y0 = height - s.y0 * height / maxY;
        ps.y = s.y * height / maxY;
      }
    }
  };

  Stream.prototype.generateArea = function () {
    this.mapPathSource();
    var area = d3.svg.area().x(function (d) {
      return d.x;
    }).y0(function (d) {
      return d.y0;
    }).y1(function (d) {
      return d.y0 - d.y; 
    });
    return area;
  };

  Stream.prototype.highlight = function (index) {
    if (typeof index !== 'undefined') {
      this.paths[index].attr({"opacity": 0.5, "stroke-width": 0});
    }
  };
  Stream.prototype.lowlight = function (index) {
    if (typeof index !== 'undefined') {
      this.paths[index].attr({"opacity": 1, "stroke-width": 1});
    }
  };

  Stream.prototype.createInteractive = function () {
    $(this.paper.canvas).unbind();//prevent event rebind.

    //refactor stream chart's animate function, especially change the callback
    var stream = this;
    this.animateCallback = function () {
      var newOrderPaths = [];
      var that = this;
      if (typeof this.defaults.animateOrder !== 'undefined') {
        this.defaults.animateOrder.forEach(function (d, i) {
          newOrderPaths[i] = that.paths[d];
        });
        this.paths = newOrderPaths;
      }

      stream.cover.hidden();
      if (typeof stream.cover.mouse !== 'undefined') {
        stream.hoverLine.show();
        stream.floatTag.show();
        var mouse = stream.cover.mouse;
        $(stream.paper.canvas).trigger("mousemove", [mouse.x, mouse.y]);
        $(stream.floatTag).trigger("mousemove", [mouse.x, mouse.y]);
        stream.cover.mouse = undefined;
      }

      stream.pathLabel.show();
    };

    //chart mouseenter
    var mouseenter = function () {
      stream.hoverLine.show();
      stream.fire('enter');
    };

    //chart mouseleave
    var mouseleave = function () {
      stream.hoverLine.hidden();
      //recover prepath;
      if (typeof stream.preIndex !== 'undefined') {
        stream.lowlight(stream.preIndex);
      }
      stream.fire('leave', stream.preIndex);
      stream.preIndex = undefined;
    };

    //chart click
    var click = function () {};

    //chart mousemove
    var mousemove = function (e, pageX, pageY) {
      var offset = $(this).parent().offset();
      var x = (e.pageX || pageX) - offset.left,
        y = (e.pageY || pageY) - offset.top;
      var pathSource = stream.pathSource,
        rowIndex;
      var columnIndex = Math.floor((x / (stream.defaults.chartWidth / (stream.columnCount - 1) / 2) + 1) / 2);
      //get path and pathIndex
      for (var i = 0, l = pathSource.length; i < l; i++) {
        if (y >= pathSource[i][columnIndex].y0 - pathSource[i][columnIndex].y && y <= pathSource[i][columnIndex].y0) {
          rowIndex = i;
          break;
        }
      }

      //recover prepath;
      if (typeof stream.preIndex !== 'undefined') {
        stream.lowlight(stream.preIndex);
      }
      stream.highlight(rowIndex);

      stream.fire('move', stream.preIndex, rowIndex, columnIndex);
      //set indicator and highlight line new position
      stream.hoverLine.refresh(columnIndex, rowIndex);
      //customevent;
      if (stream.defaults.customEventHandle.mousemove) {
        stream.defaults.customEventHandle.mousemove.call(stream,
          {"timeIndex": columnIndex, "rowIndex": rowIndex});
      }
      //change new path;
      stream.preIndex = rowIndex;
    };
    $(this.paper.canvas).bind("mouseenter", mouseenter)
      .bind("mouseleave", mouseleave)
      .bind("click", click)
      .bind("mousemove", mousemove);
  };

  return Stream;
});
