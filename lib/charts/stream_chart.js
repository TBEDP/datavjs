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

  Stream.prototype.setSource = function (source) {
    this.source = source;
    this.layoutData = this.remapSource(source.slice());
  };

  Stream.prototype.remapSource = function (data) {
    var row = data.length;
    var column = data[0].length;
    var remap = [];
    for (var i = 0; i < row; i++) {
      remap[i] = [];
      for (var j = 0; j < column; j++) {
        remap[i][j] = {};
        remap[i][j].x =  j;
        remap[i][j].y =  data[i][j];
      }
    }
    return remap;
  };

  Stream.prototype.layout = function () {
    var conf = this.defaults;
    d3.layout.stack().offset(conf.offset).order(conf.order)(this.layoutData);
  };

  Stream.prototype.generateChartElements = function () {
    var conf = this.defaults;
    var paper = this.paper,
      paths = [],
      area = this.generateArea(),
      areaString,
      colorFunc = this.getColor(),
      color,
      path;

    // set div's background instread;
    paper.rect(0, 0, conf.width, conf.height).attr({
      "stroke": "none",
      "fill": "#e0e0e0"
    });

    for (var i = 0, l = this.layoutData.length; i < l; i++) {
      areaString = area(this.pathSource[i]);
      color = colorFunc(i);
      path = paper.path(areaString).attr({
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
    var count = this.defaults.colorCount;
    var color = this.defaults.gradientColor || ["#8be62f", "#1F4FD8"];
    var gradientColor = DataV.gradientColor(color, "special");
    var percent = 1 / count;
    var gotColors = [];

    for (var i = 0; i < count; i++) {
      gotColors.push(gradientColor(i * percent));
    }

    var midderNum = Math.round(count / 2);
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
      maxX = this.layoutData[0].length - 1,//this.digitData[0].length - 1,
      maxY = this.getMaxY(), 
      width = conf.width,
      height = conf.height;
    var i, j, l, l2, s, ps;
    this.pathSource = [];
    for (i = 0, l = this.layoutData.length; i < l; i++) {
      this.pathSource[i] = [];
      for (j = 0, l2 = this.layoutData[0].length; j < l2; j++) {
        s = this.layoutData[i][j];
        ps = this.pathSource[i][j] = {};
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
      var index;
      //recover prepath;
      if (typeof stream.prePath !== 'undefined') {
        stream.prePath.attr({"opacity": 1, "stroke-width": 1});
        // set legend
        index = stream.prePath.index;
        stream.prePath = undefined;
      }
      stream.fire('leave', index);
    };

    //chart click
    var click = function (e) {
      var stream = e.data.stream;
      var count = stream.paths.length;
      var animateCallback = function () {
        count -= 1;
        if (count > 0) {
          return;
        }
        stream.cover.hidden();
        if (typeof stream.cover.mouse !== 'undefined') {
          stream.hoverLine.show();
          stream.floatTag.show();
          var canvas = $(stream.paper.canvas);
          var mouse = stream.cover.mouse;
          canvas.trigger("mousemove", [mouse.x, mouse.y]);
          canvas.trigger("mousemove", [mouse.x, mouse.y]);
          stream.cover.mouse = undefined;
        }
        stream.pathLabel.show();
      };

      //more expand
      var path = stream.prePath;
      if (typeof path !== 'undefined' && path.index === 0 && stream.getDisplayRowInfo(path.index).rowIndex === -1) {
        stream.defaults.moreConfig.level += 1;
        stream.cover.show();
        stream.cover.mouse = {x: e.pageX, y: e.pageY};
        //redraw
        stream.processData("slicedData");
        stream.render("renderComponents");

        //hidden
        stream.hoverLine.hidden();
        stream.floatTag.hidden();

        stream.pathLabel.hidden();
        stream.paths.forEach(function (d) {
          d.attr({transform: "s1,0.001,0," + stream.defaults.chartHeight});
          d.animate({transform: "t0,0"}, 750, "linear", animateCallback);
        });
      }

      //drop
      if (typeof stream.prePath !== 'undefined' && stream.prePath.index > 0) {
        (function (index) {
          var order = d3.range(stream.displayData.digitData.length);
          order.forEach(function (d, i, array) {
            if (i === 0) {
              array[i] = index;
            } else if (i <= index) {
              array[i] = i - 1;
            }
          });

          stream.cover.show();
          stream.cover.mouse = {x: e.pageX, y: e.pageY};

          //stream.displayDataDropReorder(stream.prePath.index);
          stream.getDisplayData({"type": "changeOrder", "order": order});
          stream.chart.setOptions({"animateOrder": order});
          stream.render("renderComponents", "animate");

          stream.pathLabel.hidden();

        }(stream.prePath.index));
      }
    };

    //chart mousemove
    var mousemove = function (e, pageX, pageY) {
      var offset = $(this).parent().offset();
      var x = (e.pageX || pageX) - offset.left,
        y = (e.pageY || pageY) - offset.top;
      var path,
        pathSource = stream.pathSource,
        pathIndex;
      var xIdx = Math.floor((x / (stream.defaults.chartWidth / (stream.source[0].length - 1) / 2) + 1) / 2);
      //get path and pathIndex
      for (var i = 0, l = pathSource.length; i < l; i++) {
        if (y >= pathSource[i][xIdx].y0 - pathSource[i][xIdx].y && y <= pathSource[i][xIdx].y0) {
          path = stream.paths[i];
          pathIndex = i;
          break;
        }
      }
      if (typeof path === 'undefined') {
        return;
      }

      var pre;
      //recover prepath;
      if (typeof stream.prePath !== 'undefined') {
        stream.prePath.attr({"opacity": 1, "stroke-width": 1});
        pre = stream.prePath.index;
      }
      //change new path;
      stream.prePath = path;
      stream.prePath.index = pathIndex;
      path.attr({"opacity": 0.5, "stroke-width": 0});

      stream.fire('move', pre, pathIndex, xIdx);
      //set indicator and highlight line new position
      stream.hoverLine.refresh(xIdx, pathIndex);
      //customevent;
      if (stream.defaults.customEventHandle.mousemove) {
        stream.defaults.customEventHandle.mousemove.call(stream,
          {"timeIndex": xIdx, "pathIndex": pathIndex});
      }
    };
    $(this.paper.canvas).bind("mouseenter", mouseenter)
      .bind("mouseleave", mouseleave)
      .bind("click", click)
      .bind("mousemove", mousemove);
  };

  return Stream;
});
