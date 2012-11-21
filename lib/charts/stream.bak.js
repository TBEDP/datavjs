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
  DataV.Axis = require('Axis');

  var Widget = function () {};
  Widget.prototype.show = function () {
    this.node.css('visibility', 'visible');
    return this;
  };
  Widget.prototype.hidden = function () {
    this.node.css('visibility', 'hidden');
    return this;
  };

  //streamChart
  var StreamChart = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.node = this.checkContainer(node);
      this.defaults = {};
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

  StreamChart.prototype.createPaper = function () {
    var conf = this.defaults;
    this.paper = new Raphael(this.node, conf.width, conf.height);
  };

  StreamChart.prototype.setSource = function (source) {
    this.source = source;
    this.layoutData = this.remapSource(source.slice());
  };

  StreamChart.prototype.remapSource = function (data) {
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

  StreamChart.prototype.layout = function () {
    var conf = this.defaults;
    d3.layout.stack().offset(conf.offset).order(conf.order)(this.layoutData);
  };

  StreamChart.prototype.generateChartElements = function () {
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

  StreamChart.prototype.render = function (animate) {
    if (animate !== "animate") {
      this.clear();
      this.layout();
      this.generateChartElements();
    } else {
      this.layout();
      this.animate();
    }
  };

  StreamChart.prototype.animate = function () {
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

  StreamChart.prototype.animateCallback = function () {
    var newOrderPaths = [];
    var that = this;
    if (typeof this.defaults.animateOrder !== 'undefined') {
      this.defaults.animateOrder.forEach(function (d, i) {
        newOrderPaths[i] = that.paths[d];
      });
      this.paths = newOrderPaths;
    }
  };

  StreamChart.prototype.clear = function () {
    this.paper.clear();
  };

  StreamChart.prototype.getColor = function () {
    return d3.scale.category10();
  };

  StreamChart.prototype.getMaxY = function () {
    return d3.max(this.layoutData, function (d) {
      return d3.max(d, function (d) {
        return d.y0 + d.y;
      });
    });
  };

  StreamChart.prototype.mapPathSource = function () {
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

  StreamChart.prototype.generateArea = function () {
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

  var Legend = function (stream, container) {
    this.stream = stream;
    this.container = container;
    this.legendIndent = 21;
    var conf = stream.defaults;
    this.legend = document.createElement("div");
    $(this.legend).css({
      "overflow": "hidden",
      "padding": "10px 0 10px 0",
      "width": conf.leftLegendWidth - this.legendIndent + "px"
    });
    if (!conf.showLegend) {
      $(this.legend).css({
        "visibility": "hidden",
        "position": "absolute"
      });
    }
    this.container.appendChild(this.legend);
  };

  Legend.prototype.render = function () {
    this.clear();
    var stream = this.stream,
      legends = [],
      li;
    var colorFunc = stream.getColor();
    var colorArray = [],
      color,
      i,
      l,
      leftHeight,
      legendHeight,
      hoverIn = function (e) {
        var index = e.data.index;
        var stream = e.data.stream;
        var path = stream.paths[index];
        stream.preIndex = index;
        this.highlight(index);
        path.attr({"opacity": 0.5});
      },
      hoverOut = function (e) {
        var index = e.data.index;
        var stream = e.data.stream;
        var path = stream.paths[index];
        stream.preIndex = index;
        this.lowlight(index);
        path.attr({"opacity": 1.0});
      };

    var ul = $("<ul/>");
    $(this.legend).append(ul);
    for (i = 0, l = stream.displayData.allInfos.length; i < l; i++) {
      colorArray.push(colorFunc(i));
    }
    for (i = 0, l = stream.displayData.allInfos.length; i < l; i++) {
      color = colorArray[stream.displayData.rowIndex[i].slicedData];
      li = $('<li style="color: "' + color + '"><span style="color: black">' + stream.getDisplayRowInfo(i).rowName + '</span></li>');
      ul.append(li);
      li.mouseenter({"index": i, "stream": stream}, $.proxy(hoverIn, this));
      li.mouseleave({"index": i, "stream": stream}, $.proxy(hoverOut, this));
      legends.push(li);
    }
    ul.css({
      "margin": "0px 0px 0px 10px",
      "padding-left": "0px" 
    });
    ul.find("li").css({
      "list-style-type": "square",
      "list-style-position": "inside",
      "white-space": "nowrap",
      "padding-left": 5
    });

    stream.legends = legends;

    //height and margin
    leftHeight = $(stream.legendBesidesContainer).height();
    legendHeight = $(this.legend).outerHeight();
    $(stream.legendContainer).css({
      "height": leftHeight
    });
    var marginTop = leftHeight > legendHeight ? (leftHeight - legendHeight) / 2 : 0;
    $(this.legend).css({"margin-top": marginTop});
  };

  Legend.prototype.highlight = function (index) {
    this.stream.legends[index].css({"background": "#dddddd"});
  };
  Legend.prototype.lowlight = function (index) {
    this.stream.legends[index].css({"background": "white"});
  };
  Legend.prototype.clear = function () {
    this.legend.innerHTML = "";
  };

  var TopLegend = function (stream, container) {
    this.stream = stream;
    this.container = container;
    var conf = stream.defaults;
    this.legend = document.createElement("div");
    this.legendPaper = new Raphael(this.legend, conf.width, 50);
    $(this.legend).css({"width": conf.width + "px", "backgroundColor": "#f4f4f4"});
    if (!conf.showLegend) {
      $(this.legend).css({
        "visibility": "hidden",
        "position": "absolute"
      });
    }
    this.container.appendChild(this.legend);
  };

  TopLegend.prototype.render = function () {
    this.clear();

    var stream = this.stream,
      conf = stream.defaults,
      paper = this.legendPaper,
      legends = [],
      m = [10, 20, 10, 20],
      left = m[3],
      top = m[0],
      lineHeight = 25,
      legendInterval = 10,
      lineWidth = conf.width,
      r0 = 5,
      r1 = 7,
      circleW = 18,
      circle,
      text,
      box,
      colorFunc = stream.getColor(),
      colorArray = [],
      color,
      i,
      l,
      hoverIn = function () {
        var index = this.data("index");
        var stream = this.data("stream");
        var r = this.data("r1");
        var path = stream.paths[index];
        stream.preIndex = index;
        stream.legends[index].circle.animate({"r": r, "opacity": 0.5}, 300);
        path.attr({"opacity": 0.5});
      },
      hoverOut = function () {
        var index = this.data("index");
        var stream = this.data("stream");
        var r = this.data("r0");
        var path = stream.paths[index];
        stream.preIndex = index;
        stream.legends[index].circle.animate({"r": r, "opacity": 1}, 300);
        path.attr({"opacity": 1.0});
      };

    for (i = 0, l = stream.displayData.allInfos.length; i < l; i++) {
      colorArray.push(colorFunc(i));
    }

    for (i = 0, l = stream.displayData.allInfos.length; i < l; i++) {
      text = paper.text(0, 0, stream.getDisplayRowInfo(i).rowName)
        .attr({
          "font-size": conf.fontSize,
          "text-anchor": "start",
          "font-family": "微软雅黑"
        });
      box = text.getBBox();
      if (left + circleW + box.width >= lineWidth - m[1]) {
          //new line
          left = m[3];
          top += lineHeight;
      }
      color = colorArray[stream.displayData.rowIndex[i].slicedData];
      circle = paper.circle(left + circleW / 2, top + lineHeight / 2, r0)
        .attr({
          "stroke": "none",
          "fill": color
        })
        .data("index", i)
        .data("stream", stream)
        .data("r0", r0)
        .data("r1", r1)
        .hover(hoverIn, hoverOut);
      text.transform("t" + (left + circleW) + "," + (top + lineHeight / 2));
      paper.rect(left + circleW, top, box.width, lineHeight)
        .attr({
          "stroke": "none",
          "fill": "#000",
          "opacity": 0
        })
        .data("index", i)
        .data("stream", stream)
        .data("r0", r0)
        .data("r1", r1)
        .hover(hoverIn, hoverOut);

      legends.push({"text": text, "circle": circle});

      left += legendInterval + circleW + box.width;
    }
    stream.legends = legends;
    paper.setSize(lineWidth, top + lineHeight + m[2]);
  };

  TopLegend.prototype.highlight = function (index) {
    var stream = this.stream;
    var circle = stream.legends[index].circle;
    circle.attr({"r": circle.data("r1"), "opacity": 0.5});
  };
  TopLegend.prototype.lowlight = function (index) {
    var stream = this.stream;
    var circle = stream.legends[index].circle;
    circle.attr({"r": circle.data("r0"), "opacity": 1});
  };
  TopLegend.prototype.clear = function () {
    this.legendPaper.clear();
  };

  var Axis = function (stream, container) {
    this.stream = stream;
    this.axis = container;
    var conf = this.stream.defaults;
    this.axisPaper = new Raphael(this.axis, conf.legendBesidesWidth, conf.axisHeight);
    $(this.axis).css({
      "margin-top": "0px",
      "border-top": "1px solid #ddd",
      "height": conf.axisHeight + "px"
    });
    if (!conf.showAxis) {
      $(this.axis).css({
        "visibility": "hidden",
        "position": "absolute"
      });
    }
  };

  Axis.prototype.render = function () {
    this.clear();
    //all date strings' format are same, string length are same 
    var stream = this.stream,
      conf = stream.defaults,
      date = stream.date.slice(stream.timeRange[0], stream.timeRange[1] + 1),
      left = conf.percentageWidth,
      right = conf.legendBesidesWidth - conf.percentageWidth,
      tempWord,
      tickNumber,
      getPopPath = function (El) {
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

    this.dateScale = d3.scale.linear()
      .domain([0, date.length - 1])
      .range([left, right]);

    tempWord = this.axisPaper.text(0, 0, date[0]);
    tickNumber = Math.floor((right - left) / tempWord.getBBox().width / 2) + 1;
    tempWord.remove();

    DataV.Axis().scale(this.dateScale)
      .ticks(tickNumber)
      .tickSize(6, 3, 3)
      .tickAttr({"stroke": "none"})
      .minorTickAttr({"stroke": "none"})
      .domainAttr({"stroke": "none"})
      .tickFormat(function (d) {
        return date[d] || "";
      })(this.axisPaper);

    this.axisPopText = this.axisPaper.text(0, 11, date[0])
      .attr({
        "text-anchor": "middle",
        "fill": "#fff",
        "transform": "t" + left + ",0"
      })
      .hide();
    this.axisPopBubble = this.axisPaper.path(getPopPath(this.axisPopText))
      .attr({
        "fill": "#000",
        "transform": "t" + (-10000) + ",0"
      })
      .toBack()
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
  Axis.prototype.refreshTab = function (timeText, transX) {
    this.axisPopText.attr({
      "text": timeText
    }).transform("t" + transX + ",0");
    this.axisPopBubble.transform("t" + transX + ",0");
  };
  Axis.prototype.clear = function () {
    this.axisPaper.clear();
  };

  var Percentage = function (stream, container) {
    this.percentage = container;
    this.stream = stream;
    var conf = stream.defaults;
    this.percentagePaper = new Raphael(this.percentage, conf.percentageWidth, conf.chartHeight);
    $(this.percentage).css({
      "width": conf.percentageWidth + "px",
      "height": conf.chartHeight + "px",
      "float": "left",
      "margin-bottom": "0px",
      "border-bottom": "0px",
      "padding-bottom": "0px"
    });
    if (!conf.showPercentage) {
      $(this.percentage).css({"visibility": "hidden"});
    }
    this.statDataMaxY = d3.max(stream.statisticData.columnSum);
  };
  Percentage.prototype.render = function () {
    var stream = this.stream;

    if (!stream.defaults.moreConfig.more) {
      return;
    }
    var conf = stream.defaults;
    var maxY = stream.chart.getMaxY(),
      y;

    maxY /= this.statDataMaxY;
    y = maxY > 0.1 ? (1 - maxY) * conf.chartHeight + conf.fontSize * 2 / 3 
        : (1 - maxY) * conf.chartHeight - conf.fontSize * 2 / 3;

    if (!this.percentageRect) {//init
      this.percentageRect = this.percentagePaper.rect(0, (1 - maxY) * conf.chartHeight,
        conf.percentageWidth, maxY * conf.chartHeight)
      .attr({"fill": "#f4f4f4", "stroke": "#aaa", "stroke-width": 0.5});
      this.percentageText = this.percentagePaper.text(conf.percentageWidth / 2, y,
        Math.round(maxY * 100) + "%")
      .attr({"text-anchor": "middle"});
    }
    this.percentageRect.animate({"y": (1 - maxY) * conf.chartHeight, "height": maxY * conf.chartHeight}, 750);
    this.percentageText.attr({"text": Math.round(maxY * 100) + "%"})
        .animate({"y": y}, 750);
  };

  var Navi = function (stream, container) {
    this.navi = container;
    this.stream = stream;
    this.naviBackWidth = 80;
    var conf = this.stream.defaults;
    $(this.navi).css({
      "border-top": "1px solid #ddd",
      "border-bottom": "1px solid #ddd",
      "padding-top": "5px",
      "padding-bottom": "10px",
      "padding-left": "10px",
      "padding-right": "10px",
      "font": (conf.fontSize + 1) + "px 宋体"
    });
    if (!conf.showNavi) {
      $(this.navi).css({
        "visibility": "hidden",
        "position": "absolute"
      });
    }
    this.naviTrace = document.createElement("div");
    $(this.naviTrace).css({
      "width": conf.legendBesidesWidth - this.naviBackWidth - 50 + "px",
      "margin-top": "5px"
    });

    this.naviBack = document.createElement("div");
    this.naviBack.innerHTML = "返回上层";
    $(this.naviBack).css({
      "width": this.naviBackWidth + "px",
      "float": "right",
      "background-color": "#f4f4f4",
      "padding-top": "4px",
      "padding-bottom": "4px",
      "border": "1px solid #ddd",
      "border-radius": "2px",
      "cursor": "pointer",
      "text-align": "center",
      "visibility": "hidden"
    });
    this.navi.appendChild(this.naviBack);
    this.navi.appendChild(this.naviTrace);

    $(this.naviTrace).on("click", ".navi", {stream: this.stream}, function (e) {
      var stream = e.data.stream;
      stream.defaults.moreConfig.level = e.target.data.level;
      getBack(stream);
    });

    $(this.naviBack).on("click", {stream: this.stream}, function (e) {
      var stream = e.data.stream;
      stream.defaults.moreConfig.level -= 1;
      getBack(stream);
    });
    var getBack = function (stream) {
      var naviCallBack = (function () {
        return function () {
          stream.cover.hidden();
          if (typeof stream.cover.mouse !== 'undefined') {
            stream.hoverLine.show();
            stream.floatTag.show();
            $(stream.paper.canvas).trigger("mousemove",
                [stream.cover.mouse.x, stream.cover.mouse.y]);
            stream.cover.mouse = undefined;
          }
          stream.pathLabel.show();
        };
      }(stream.paths.length));

      stream.cover.show();
      stream.cover.mouse = undefined;

      stream.processData("slicedData");
      stream.render("renderComponents");

      //hidden
      stream.hoverLine.hidden();
      stream.floatTag.hidden();

      stream.pathLabel.hidden();
      stream.paths.forEach(function (d) {
        d.attr({transform: "s1,0.001,0,0"});
        d.animate({transform: "t0,0"}, 750, "linear", naviCallBack);
      });
    };
  };
  Navi.prototype.render = function () {
    var stream = this.stream;
    var level = stream.defaults.moreConfig.level;
    var i, span;
    this.clear();
    for (i = 0; i <= level; i++) {
      $(this.naviTrace).append($("<span> &gt; </span>"));
      span = document.createElement("span");
      span.data = {level: i};
      span = $(span)
        .html(i === 0 ? "第1层"/*this.userConfig.rootName*/ : "第" + (i + 1) + "层")
        .appendTo($(this.naviTrace));
      if (i !== level) {
        span.css({"cursor": "pointer", "color": "#1E90FF"})
        .addClass("navi");
      }
    }
    this.naviBack.style.visibility = level > 0 ? "visible" : "hidden";
  };
  Navi.prototype.clear = function () {
    $(this.naviTrace).empty();
  };

  //hoverline
  var HoverLine = function (stream) {
    this.stream = stream;
  };

  HoverLine.prototype.render = function () {
    this.clear();
    var paper = this.stream.paper;
    var conf = this.stream.defaults;
    this.indicatorLine = paper.path("M0 0V" + conf.chartHeight)
      .attr({stroke: "none", "stroke-width": 1, "stroke-dasharray": "- "});
    this.highlightLine = paper.path("M0 0V" + conf.chartHeight)
      .attr({stroke: "none", "stroke-width": 2});
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
    var stream = this.stream;
    var pathSource = stream.chart.pathSource;
    var lineX = stream.defaults.chartWidth * xIdx / (stream.chart.source[0].length - 1);
    var pathSourceCell = pathSource[pathSource.length - 1][xIdx];
    this.indicatorLine.attr({
      path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSource[0][xIdx].y0
    });

    pathSourceCell = pathSource[pathIndex][xIdx];
    this.highlightLine.attr({
      path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSourceCell.y0
    });
  
    if (pathIndex === 0 && stream.getDisplayRowInfo(pathIndex).rowIndex === -1) {
      this.highlightLine.attr({"cursor": "pointer"});
    } else {
      this.highlightLine.attr({"cursor": "auto"});
    }
  };

  HoverLine.prototype.clear = function () {
    this.indicatorLine && this.indicatorLine.remove();
    this.highlightLine && this.highlightLine.remove();
  };

  //pathLabel
  var PathLabel = function (stream) {
      this.stream = stream;
  };
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
      label = stream.paper.text(0, 0,
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

  //floatTag
  var FloatTag = DataV.extend(Widget, {
    initialize: function (container) {
      this.container = container;
      this.node = DataV.FloatTag()(this.container);
      //$(this.container).append(this.floatTag);//?
      this.hidden();
    }
  });

  FloatTag.prototype.setContent = function (content) {
    this.node.html(content);
  };
  FloatTag.prototype.setCss = function (cssJson) {
    this.node.css(cssJson);
  };

  //cover
  var Cover = DataV.extend(Widget, {
    initialize: function (stream, container) {
      var conf = stream.defaults;
      this.node = $(container);
      this.node.css({
        "position": "absolute",
        "left": "0px",
        "top": "0px",
        "width": conf.chartWidth + "px",
        "height": conf.chartHeight + "px",
        "zIndex": 100,
        "visibility": "hidden"
      }).bind("mousemove", $.proxy(function (e) {
        this.mouse = {x: e.pageX, y: e.pageY};
        e.stopPropagation();
      }, this)).bind("mouseleave", $.proxy(function () {
        this.mouse = undefined;
      }, this));
    }
  });

  /*
   * constructor
   * @param node the dom node or dom node Id
   *        options options json object for determin stream style.
   * @example
   * create stream in a dom node with id "chart", width is 500; height is 600px;
   * "chart", {"width": 500, "height": 600}
   */
  var Stream = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Stream";
      this.node = this.checkContainer(node);
      this.defaults = {};
      // Properties
      this.defaults.offset = "zero";//zero, expand, silhou-ette, wiggle;(d3 stack offset)
      this.defaults.order = "default";//default, reverse, descending, ascending, inside-out(d3 stack order, sort by index of maximum value, then use balanced weighting.), inside-out-reverse(inside-out like, sort by index of maximum value, not descending but ascending);
      this.defaults.normalized = false;//false, true; //ratio data or not;
      //this.defaults.rowDataOrder = "default"; //default, descending, ascending(according to digitdata row sum value);
      this.defaults.columnNameUsed = "auto";
      this.defaults.rowNameUsed = "auto";
      this.defaults.pathLabel = true;
      this.defaults.fontSize = 12;
      //this.defaults.axisTickNumber = 8; // axis ticks number

      this.defaults.indexMargin = 3; // if dates.length < indexMargin * 2 + 1, do not show label

      //this.userConfig = {"more": true, "max": 20, "other": 0.1};
      this.defaults.moreConfig = {"more": true, "level": 0, "max": 20, "other": 0.1};

      this.timeRange = [];
      // paper

      this.defaults.width = 800;
      this.defaults.height = 560;//if only width has value and autoHeight is true, then height will be width * heightWidthRatio.
      this.defaults.autoHeight = true;
      this.defaults.heightWidthRatio = 0.6;

      this.defaults.legendPosition = "top";//"top", "left"
      this.defaults.topLegendHeight = 50;
      this.defaults.leftLegendWidth = 150;
      this.defaults.showLegend = true;

      this.defaults.legendBesidesWidth = undefined;
      this.defaults.legendBesidesHeight = undefined;

      this.defaults.chartWidth = undefined;//depends on width, do not recommend to change
      this.defaults.chartHeight = undefined;// depends on height, do not recommend to change

      this.defaults.naviHeight = 20;//do not recommend to change
      this.defaults.showNavi = undefined;//ture if moreConfig.more == true, else false;

      this.defaults.axisHeight = 30;//do not recommend to change
      this.defaults.showAxis = true;

      this.defaults.showPercentage = undefined;//true if moreConfig.more == true, else false;
      this.defaults.percentageWidth = 40;

      this.defaults.customEventHandle = {"mousemove": null};

      //data
      this.rawData = {};//raw data user sets
      this.statisticData = {};//add statistic info from rawData
      this.processedData = {};//normalized and sorted
      this.slicedData = {};//slice data from processed data according to timerange and more
      this.displayData = {};//adjust from slicedData according to user's interactive like dropping;

      this.setOptions(options);
      //this.createPaper();
    }
  });

  Stream.prototype.createPaper = function () {};

  Stream.prototype.setOptions = function (options) {
    var prop;
    var conf = this.defaults;
    var that = this;
    var setMoreConfig = function (options) {
      var prop;
      var mc = that.defaults.moreConfig;
      if (options) {
        for (prop in options) {
          if (options.hasOwnProperty(prop)) {
            mc[prop] = options[prop];
          }
        }
      }
    };
    if (options) {
      for (prop in options) {
        if (options.hasOwnProperty(prop)) {
          //moreConfig;
          if (prop === "moreConfig") {
            setMoreConfig(options[prop]);
            continue;
          }
          conf[prop] = options[prop];
        }
      }
    }

    if (options.width && !options.height) {
      if (conf.autoHeight) {
        conf.height = conf.width * conf.heightWidthRatio;
      }
    } else if (options.height) {
      conf.autoHeight = false;
    }
  };

  /*
   * @param source The data source.
   * @example 
   * // 例如下面的数组表示2个人在一年4个季度的消费。第一个人在4个季度里消费了1、2、3、9元。第二个人消费了3、4、6、3元。
   * [
   *  [1,2,3,9],
   *  [3,4,6,3]
   * ]
   */
  Stream.prototype.hasRowName = function () {
    var firstColumn = [],
      source = this.rawData.rawData;

    if ((typeof this.defaults.rowNameUsed) === "boolean") {
      return this.defaults.rowNameUsed;
    }
    //first column from 2nd row
    for (var i = 1, l = source.length; i < l; i++) {
      firstColumn[i] = source[i][0];
    }
    return !firstColumn.every(DataV.isNumeric);
  };

  Stream.prototype.hasColumnName = function () {
    var firstRow;
    if ((typeof this.defaults.columnNameUsed) === "boolean") {
        return this.defaults.columnNameUsed;
    }
    //first row from 2nd column
    firstRow = this.rawData.rawData[0].slice(1);
    return !firstRow.every(DataV.isNumeric);
  };

  Stream.prototype.sort = function (source) {
    var i, j, l, ll;
    var rowSum = [];
    var columnSum = [];
    var newSource = [];
    var rowName = [];
    var that = this;

    for (j = 0, ll = source[0].length; j < ll; j++) {
      columnSum[j] = 0;
    }

    for (i = 0, l = source.length; i < l; i++) {
      rowSum[i] = 0;
      for (j = 0, ll = source[0].length; j < ll; j++) {
        rowSum[i] += source[i][j];
        columnSum[j] += source[i][j];
      }
      rowSum[i] = [rowSum[i]];
      rowSum[i].index = i;
    }

    rowSum.sort(function (a, b) {
      return b[0] - a[0];
    });

    rowSum.forEach(function (d, i) {
      newSource[i] = source[d.index];
      if (that.rowName) {
        rowName[i] = that.rowName[d.index];
      }
    });

    for (i = 0, l = rowSum.length; i < l; i++) {
      rowSum[i] = rowSum[i][0];
    }

    this.rowName = rowName;
    this.rowSum = rowSum;
    this.columnSum = columnSum;
    this.total = d3.sum(this.rowSum);

    return newSource;
  };

  Stream.prototype.getRawData = function (source, isRawInfos) {
    var rawData = this.rawData;
    //get column name, row name and digitData;
    var conf = this.defaults,
      firstRow = source[0],
      firstColumn,
      digitData;

    var i, j, l, ll;

    if (!isRawInfos) {
      rawData.rawData = source;
    }

    firstColumn = source.map(function (d) {
      return d[0];
    });

    if (this.hasRowName()) {
      if (this.hasColumnName()) {
        //row names, column names
        digitData = source.map(function (d) {
            return d.slice(1);
        }).slice(1);
        rawData.rowName = firstColumn.slice(1);
        rawData.columnName = firstRow.slice(1);
      } else {
        //row names, no column names
        digitData = source.map(function (d) {
            return d.slice(1);
        });
        rawData.rowName = firstColumn;
        //rawData.columnName = undefined;
        rawData.columnName = d3.range(digitData[0].length)
          .map(function () {
            return "";
          });
      }
    } else {
      if (this.hasColumnName()) {
        //no row names, column names
        digitData = source.slice(1);
        rawData.rowName = d3.range(digitData.length)
          .map(function () {
            return "";
          });
        rawData.columnName = firstRow;
      } else {
        //no row names, no column names
        if (conf.columnNameUsed === "auto" && conf.rowNameUsed === "auto" && !DataV.isNumeric(source[0][0])) {
            //row or column name may be number, can not judge by automatically, need user to specify
            throw new Error("Row or column name may be numbers, program can not judge automatically, Please specify whether there are column names or row names"); 
        }
        digitData = source;
        rawData.rowName = d3.range(digitData.length)
          .map(function () {return "";});
        rawData.columnName = d3.range(digitData[0].length)
          .map(function () {return "";});
      }
    }

    if (!isRawInfos) {
      for (i = 0, l = digitData.length; i < l; i++) {
        for (j = 0, ll = digitData[0].length; j < ll; j++) {
          digitData[i][j] = parseFloat(digitData[i][j]);
        }
      }
      rawData.digitData = digitData;
    } else {
      rawData.rawInfos = digitData;
    }
  };

  Stream.prototype.getStatisticData = function () {
    //get statistic data;  dataRelation;
    var statData = this.statisticData = {};
    var rawData = this.rawData;
    var rowSum = [];
    var columnSum = [];
    var totalSum;
    var columnRatioMatrix = [];
    var digitData;
    var i, j, l, ll;
    //data
    //rowName, columnName, digitData, rawInfos
    statData.rowName = rawData.rowName;
    statData.columnName = rawData.columnName;
    statData.digitData = digitData = rawData.digitData;
    statData.rawInfos = rawData.rawInfos;

    //rowSum, columnSum
    for (j = 0, ll = digitData[0].length; j < ll; j++) {
        columnSum[j] = 0;
    }
    for (i = 0, l = digitData.length; i < l; i++) {
      rowSum[i] = 0;
      for (j = 0, ll = digitData[0].length; j < ll; j++) {
        rowSum[i] += digitData[i][j];
        columnSum[j] += digitData[i][j];
      }
    }
    statData.rowSum = rowSum;
    statData.columnSum = columnSum;

    //totalSum
    statData.totalSum = totalSum = d3.sum(rowSum);

    //rowRatio, columnRatio;
    statData.rowRatio = rowSum.slice();
    statData.rowRatio.forEach(function (d, i, arr) {
      arr[i] = d / totalSum;
    });
    statData.columnRatio = columnSum.slice();
    statData.columnRatio.forEach(function (d, i, arr) {
      arr[i] = d / totalSum;
    });

    //rowIndex
    statData.rowIndex = [];
    for (i = 0, l = digitData.length; i < l; i++) {
      statData.rowIndex[i] = {rawData: i};
    }

    //columnRatioMatrix;
    statData.columnRatioMatrix = columnRatioMatrix = [];
    for (i = 0, l = digitData.length; i < l; i++) {
      columnRatioMatrix[i] = [];
      for (j = 0, ll = digitData[0].length; j < ll; j++) {
        columnRatioMatrix[i][j] = digitData[i][j] / columnSum[j];
      }
    }
  };

  Stream.prototype.getProcessedData = function () {
    //get processed data;  adjust options;  dataRelation;
    var prosData = this.processedData = {};
    var statData = this.statisticData;
    var conf = this.defaults;
    var i, j, l, ll;
    var digitData;
    //data
    prosData.rowName = statData.rowName;
    prosData.rowSum = statData.rowSum;
    prosData.rowRatio = statData.rowRatio;
    prosData.columnName = statData.columnName;
    prosData.columnSum = statData.columnSum;
    prosData.columnRatio = statData.columnRatio;
    prosData.columnRatioMatrix = statData.columnRatioMatrix;
    prosData.totalSum = statData.totalSum;
    prosData.rawInfos = statData.rawInfos;

    digitData = statData.digitData.slice();

    //rowIndex(sort)
    digitData.forEach(function (d, i) {
      d.index = i;
      d.rowSum = prosData.rowSum[i];
    });
    (function () {
      var descending = function (a, b) {
        return b.rowSum - a.rowSum;
      }; 
      var insideOut = function (digitData, rowSum, reverse) {
        var getRowMaxIndex = function (array) {
          var i = 1,
            j = 0,
            v = array[0],
            k,
            n = array.length;
          for (; i < n; ++i) {
            if ((k = array[i]) > v) {
              j = i;
              v = k;
            }
          }
          return j;
        };
        var digitDataSort = [];
        var n = digitData.length,
            i,
            j,
            max = digitData.map(getRowMaxIndex),
            sums = rowSum,
            index = d3.range(n).sort(function(a, b) { return max[a] - max[b]; }),
            top = 0,
            bottom = 0,
            tops = [],
            bottoms = [];
        for (i = 0; i < n; ++i) {
          j = index[i];
          if (top < bottom) {
            top += sums[j];
            tops.push(j);
          } else {
            bottom += sums[j];
            bottoms.push(j);
          }
        }
        index = !reverse ? bottoms.reverse().concat(tops) : bottoms.concat(tops.reverse());

        for (i = 0; i < n; ++i) {
          digitDataSort[i] = digitData[index[i]];
        }
        return digitDataSort;
      };
      var rowDataOrderAdjust = function () {
        var rowName = prosData.rowName = [];
        var rowSum = prosData.rowSum = [];
        var rowRatio = prosData.rowRatio = [];
        var columnRatioMatrix = prosData.columnRatioMatrix = [];
        var rawInfos = prosData.rawInfos = [];
        var statRowName = statData.rowName;
        var statRowSum = statData.rowSum;
        var statRowRatio = statData.rowRatio;
        var statColumnRatioMatrix = statData.columnRatioMatrix;
        var statRawInfos = statData.rawInfos;

        digitData.forEach(function (d, i) {
          rowName[i] = statRowName[d.index];
          rowSum[i] = statRowSum[d.index];
          rowRatio[i] = statRowRatio[d.index];
          columnRatioMatrix[i] = statColumnRatioMatrix[d.index];
          rawInfos[i] = statRawInfos[d.index];
        });
      };
      var getProcessedRowIndex = function () {
        var rowIndex = [];
        digitData.forEach(function (d, i) {
          rowIndex[i] = $.extend({}, statData.rowIndex[d.index]);
          rowIndex[i].statisticData = d.index;
        });
        prosData.rowIndex = rowIndex;
      };
      switch (conf.order) {
        case 'reverse':
          digitData.reverse();
          rowDataOrderAdjust();
          break;
        case 'descending':
          digitData.sort(descending);
          rowDataOrderAdjust();
          break;
        case 'ascending':
          digitData.sort(descending).reverse();
          rowDataOrderAdjust();
          break;
        case 'inside-out':
          digitData = insideOut(digitData, prosData.rowSum);
          rowDataOrderAdjust();
          break;
        case 'inside-out-reverse':
          digitData = insideOut(digitData, prosData.rowSum, true);
          rowDataOrderAdjust();
          break;
        default:
      }
      getProcessedRowIndex();
    }());

    //allInfos
    (function (){
      var allInfos = [];
      var rowInfos = [];
      var columnInfos = [];
      var columnDescending = function (a, b) {
        return b.value - a.value;
      }; 
      //rowinfo
      for (i = 0, l = digitData.length; i < l; i++) {
        rowInfos[i] = {
          "rowName": prosData.rowName[i],
          "rowRatio": prosData.rowRatio[i],
          "rowSum": prosData.rowSum[i],
          "rowIndex": i
        };
      }
      //columninfo
      for (j = 0, ll = digitData[0].length; j < ll; j++) {
        columnInfos[j] = {
          "columnName": prosData.columnName[j],
          "columnRatio": prosData.columnRatio[j],
          "columnSum": prosData.columnSum[j],
          "columnIndex": j
        };
      }
      //allInfo
      for (i = 0, l = digitData.length; i < l; i++) {
        allInfos[i] = [];
        for (j = 0, ll = digitData[0].length; j < ll; j++) {
          allInfos[i][j] = {
            "value": digitData[i][j],
            "ratioInColumn": prosData.columnRatioMatrix[i][j], 
            "rowInfo": rowInfos[i],
            "columnInfo": columnInfos[j]
          };
        }
      }
      //allInfos rank in column
      for (j = 0, ll = digitData[0].length; j < ll; j++) {
        var column = [];
        for (i = 0, l = digitData.length; i < l; i++) {
          column[i] = {"value": digitData[i][j]};
          column[i].index = i;
        }
        column.sort(columnDescending);

        for (i = 0, l = column.length; i < l; i++) {
          allInfos[column[i].index][j].rank = i;
        }
      }
      prosData.allInfos = allInfos;
    }());

    //digitData(origin or normalized)
    prosData.digitData = conf.normalized ? prosData.columnRatioMatrix: digitData;
  };

  Stream.prototype.getSlicedData = function () {
    //get sliced data;  timeRange; more;  
    var slicedData = this.slicedData = {};
    var prosData = this.processedData;
    var digitData, allInfos, topRowRatioSum, rowIndex;
    var conf = this.defaults;
    var moreConfig = conf.moreConfig;
    var i, l;
    var that = this;
    //data
    //digitData, allInfos
    slicedData.digitData = digitData = prosData.digitData;
    slicedData.allInfos = allInfos = prosData.allInfos;
    slicedData.rowIndex = rowIndex = [];

    //time Range Slice
    var timeRangeSlice = function (data) {
      var tr = that.timeRange;
      var sliceData = [];
      if (tr[0] === 0 && tr[1] === digitData.length - 1) {
        return data;
      } else {
        data.forEach(function (d, i) {
          sliceData[i] = d.slice(tr[0], tr[1] + 1);
        });
        return sliceData;
      }
    };
    digitData = slicedData.digitData = timeRangeSlice(digitData);
    allInfos = slicedData.allInfos = timeRangeSlice(allInfos);

    //no more
    if (moreConfig.more !== true) {
      //rowIndex without more
      for (i = 0, l = prosData.rowIndex.length; i < l; i++) {
        rowIndex[i] = $.extend({}, prosData.rowIndex[i]);
        rowIndex[i].processedData = i;
      }
      return;
    }
    //more
    topRowRatioSum = slicedData.topRowRatioSum = [];
    var rowRatio = prosData.rowRatio;
    topRowRatioSum[0] = rowRatio[0];
    for (i = 1, l = rowRatio.length; i < l; i++) {
      topRowRatioSum[i] = topRowRatioSum[i - 1] + rowRatio[i];
    }
    //more's digitData and allInfos
    (function () {
      var rowStart = moreConfig.level * (moreConfig.max - 1),
        max = moreConfig.max,
        rowEnd,
        needMoreRow,
        i, j, l, k,
        moreSum,
        moreRowSum,
        moreRow = [],
        datas = [],
        infos = [],
        moreRowInfo = [];
  
      if (rowStart >= digitData.length) {
        //prevent level is too large after setSource;
        moreConfig.level = 0;
        rowStart = 0;
      }
      if (rowStart + max >= digitData.length) {
        rowEnd = digitData.length;
        needMoreRow = false;
      } else {
        rowEnd = rowStart + max - 1;
        needMoreRow = true;
      }
      for (i = rowStart; i < rowEnd; i++) {
        k = i - rowStart;
        datas[k] = digitData[i];
        infos[k] = allInfos[i];
      }
      if (needMoreRow) {
        moreRowSum = 1 - topRowRatioSum[rowEnd - 1];
        for (j = 0, l = digitData[0].length; j < l; j++) {
          moreSum = 0;
          for (i = digitData.length - 1; i >= rowEnd; i--) {
            moreSum += digitData[i][j];
          }
          moreRow[j] = moreSum;
          moreRowInfo[j] = {
            "value": moreSum,
            "ratioInColumn": moreSum / prosData.columnSum[j],
            "rowInfo": {
              "rowName": "more",
              "rowRatio": moreSum / moreRowSum,
              "rowSum": moreRowSum,
              "rowIndex": -1 // -1, clickable; -2, not clickable
            },
            "columnInfo": $.extend({}, allInfos[0][j])
          };
          moreRowInfo[j].columnInfo.columnRatio = moreSum / moreRowInfo[j].columnInfo.columnSum;
          //if (moreRowSum < this.userConfig.other) {
          if (moreRowSum < conf.moreConfig.other) {
             moreRowInfo[j].rowInfo.rowIndex = -2; // not clickable
          }
        }
        datas = [moreRow].concat(datas);
        infos = [moreRowInfo].concat(infos);
      }
      digitData = slicedData.digitData = datas;
      allInfos = slicedData.allInfos = infos;

      //row Index with more
      for (i = rowStart; i < rowEnd; i++) {
        k = i - rowStart;
        rowIndex[k] = $.extend({}, prosData.rowIndex[i]);
        rowIndex[k].processedData = i;
      }
      if (needMoreRow) {
        rowIndex = [{"processedData": "more"}].concat(rowIndex);
      }
      slicedData.rowIndex = rowIndex;
    }());
  };

  //options examples:
  //undefined, same as init without orderchange
  //{"type": "init", "order": [0,1,2,3,4,...]} ,init and change order
  //{"type": "changeOrder", "order": [0,1,2,3,4,...]}
  Stream.prototype.getDisplayData = function (options) {
    //get display data;  timeRange; more;
    var type = (options && options.type) || "init";
    var order = options && options.order;

    var displayData = this.displayData;
    var slicedData = this.slicedData;
    var digitData, allInfos, rowIndex;

    if (type === "init") {
      displayData.digitData = digitData = slicedData.digitData;
      displayData.allInfos = allInfos = slicedData.allInfos;
      displayData.rowIndex = rowIndex = [];
      if (typeof order === 'undefined') {
        d3.range(digitData.length).forEach(function (d, i) {
          rowIndex[i] = $.extend({}, slicedData.rowIndex[d]);
          rowIndex[i].slicedData = d;
        });
      } else {
        if (order.length !== digitData.length) {
          throw new Error("order's length is different from row number");
        } else {
          digitData = [];
          allInfos = [];
          order.forEach(function (d, i) {
            digitData[i] = slicedData.digitData[d];
            allInfos[i] = slicedData.allInfos[d];
            rowIndex[i] = $.extend({}, slicedData.rowIndex[d]);
            rowIndex[i].slicedData = d;
          });
          displayData.digitData = digitData;
          displayData.allInfos = allInfos;
        }
      }
    } else {//changeOrder
      digitData = displayData.digitData.slice();
      allInfos = displayData.allInfos.slice();
      rowIndex = displayData.rowIndex.slice();
      order.forEach(function (d, i) {
        digitData[i] = displayData.digitData[d];
        allInfos[i] = displayData.allInfos[d];
        rowIndex[i] = displayData.rowIndex[d];
      });
      displayData.digitData = digitData;
      displayData.allInfos = allInfos;
      displayData.rowIndex = rowIndex;
    }
  };

  Stream.prototype.setSource = function (source, rawInfos) {
    this.rawData = {};
    this.getRawData(source);
    if (rawInfos) {
      this.getRawData(rawInfos, true);
    }
    this.timeRange = [0, this.rawData.columnName.length - 1];
    this.date = this.rawData.columnName;
  };

  //if useSting is true, start and end are date string, else start and end are index number;
  Stream.prototype.setTimeRange = function (start, end, useString) {
    var idx1, idx2, temp;
    if (useString) {
      idx1 = this.date.indexOf(start);
      if (idx1 === "") {
        throw new Error(start + " is not found");
      }
      idx2 = this.date.indexOf(end);
      if (idx2 === "") {
        throw new Error(end + " is not found");
      }
    } else {
      idx1 = start;
      idx2 = end;
    }
    if (idx1 > idx2) {
      temp = idx1;
      idx1 = idx2;
      idx2 = temp;
    }
    if (idx1 === idx2) {
      throw new Error("start index and end index can not be same.");
    }
    if (idx2 > this.date.length - 1) {
      throw new Error("start index or end index is beyond the time range.");
    }
    this.timeRange = [idx1, idx2];
    this.getLevelSource();
  };

  Stream.prototype.getDataByTimeRange = function () {
    if (this.timeRange[0] === 0 && this.timeRange[1] === this.date.length - 1) {
      return this.digitData;
    } else {
      var tr = this.timeRange;
      return this.digitData.map(function (d) {
        return d.slice(tr[0], tr[1] + 1);
      });
    }
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
    var count = this.layoutData ? this.layoutData.length : this.labels.length;
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

  Stream.prototype.generatePaths = function () {};

  Stream.prototype.createLegend = function () {};

  Stream.prototype.createNavi = function () {};

  Stream.prototype.getMaxPercentage = function () {};

  Stream.prototype.createPercentage = function () {};

  Stream.prototype.createStreamPaths = function () {};

  Stream.prototype.createAxis = function () {};

  Stream.prototype.getMaxY = function () {
    return d3.max(this.source, function (d) {
      return d3.max(d, function (d) {
        return d.y0 + d.y;
      });
    });
  };

  Stream.prototype.mapPathSource = function () {
    var conf = this.defaults,
      maxX = this.source[0].length - 1,//this.digitData[0].length - 1,
      maxY = this.getMaxY(), 
      width = conf.chartWidth,
      height = conf.height;
    var i, j, l, l2, s, ps;
    this.pathSource = [];
    for (i = 0, l = this.source.length; i < l; i++) {
      this.pathSource[i] = [];
      for (j = 0, l2 = this.source[0].length; j < l2; j++) {
        s = this.source[i][j];
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

  Stream.prototype.clearCanvas = function () {};

  Stream.prototype.reRender = function () {
    this.clearCanvas();
    this.layout();
    this.generatePaths();
    this.canAnimate = true;
  };

  Stream.prototype.processData = function (stage) {
    switch (stage) {
      case undefined:
      case "statisticData":
        this.getStatisticData();
        // break;
      case "processedData":
        this.getProcessedData();
        // break;
      case "slicedData":
        this.getSlicedData();
        // break;
      case "displayData":
        this.getDisplayData();
        // break;
      default:
        break;
    }
  };

  Stream.prototype.createComponents = function () {
    var conf = this.defaults,
      canvasFatherContainer;

    //components height and width compute
    if (conf.moreConfig.more) {
      conf.showNavi = true;
      conf.showPercentage = true;
    } else {
      conf.showNavi = false;
      conf.showPercentage = false;
    }
    if (!conf.showLegend) {
      conf.legendBesidesWidth = conf.width;
      conf.legendBesidesHeight = conf.height;
    } else {
      if (conf.legendPosition === "left") {
        conf.legendBesidesWidth = conf.width - conf.leftLegendWidth;
        conf.legendBesidesHeight = conf.height;
      } else {
        conf.legendBesidesWidth = conf.width;
        conf.legendBesidesHeight = conf.height - conf.topLegendHeight;
      }
    }
    conf.chartWidth = conf.legendBesidesWidth - 2 * conf.percentageWidth;
    conf.chartHeight = conf.legendBesidesHeight - (conf.showNavi ? conf.naviHeight : 0)
        - (conf.showAxis ? conf.axisHeight : 0);

    this.node.style.position = "relative";
    this.node.style.width = conf.width + "px";

    this.canvasContainer = document.createElement("div");
    canvasFatherContainer = document.createElement("div");
    $(this.canvasContainer).css({
      "position": "relative",
      "float": "left",
      "width": conf.chartWidth + "px",
      "height": conf.chartHeight + "px",
      "margin-bottom": "0px",
      "border-bottom": "0px",
      "padding-bottom": "0px"
    }).append($(canvasFatherContainer).css({"position": "relative"}));

    //chart and paper
    this.chart = new StreamChart(canvasFatherContainer, {"width": conf.chartWidth, "height": conf.chartHeight});
    this.chart.getColor = this.getColor;
    this.chart.defaults.gradientColor = this.defaults.gradientColor;
    this.paper = this.chart.paper;

    this.legendContainer = document.createElement("div");
    this.legendBesidesContainer = document.createElement("div");

    //legend
    this.legend = conf.legendPosition === "left" ? new Legend(this, this.legendContainer)
      : new TopLegend(this, this.legendContainer);
    
    //aixs
    this.axisContainer = document.createElement("div");
    this.axis = new Axis(this, this.axisContainer);

    //percentage
    this.percentageContainer = document.createElement("div");
    this.percentage = new Percentage(this, this.percentageContainer);

    //navi
    this.naviContainer = document.createElement("div");
    this.navi = new Navi(this, this.naviContainer);

    //hoverLine
    this.hoverLine = new HoverLine(this);

    //pathLabel
    this.pathLabel = new PathLabel(this);

    //floatTag
    this.floatTag = new FloatTag(canvasFatherContainer);
        
    // cover can block stream paper when animating to prevent some default mouse event
    this.coverContainer = document.createElement("div");
    this.cover = new Cover(this, this.coverContainer);

    this.legendBesidesContainer.appendChild(this.naviContainer);
    this.middleContainer = document.createElement("div");
    $(this.middleContainer).css({
      "height": conf.chartHeight
    });
    this.middleContainer.appendChild(this.percentageContainer);
    this.middleContainer.appendChild(this.canvasContainer);

    this.canvasContainer.appendChild(this.coverContainer);

    this.legendBesidesContainer.appendChild(this.middleContainer);
    this.legendBesidesContainer.appendChild(this.axisContainer);

    if (conf.legendPosition === "left") {
      this.node.appendChild(this.legendBesidesContainer);
      this.node.appendChild(this.legendContainer);
      $(this.legendBesidesContainer).css({
        "float": "right",
        "width": conf.legendBesidesWidth
      });
      $(this.legendContainer).css({
        "width": conf.leftLegendWidth - 4 + "px",
        "overflow-x": "hidden"
      });
    } else {
      this.node.appendChild(this.legendContainer);
      this.node.appendChild(this.legendBesidesContainer);
      $(this.legendBesidesContainer).css({"width": conf.legendBesidesWidth});
      $(this.legendContainer).css({"width": conf.leftLegendWidth + "px"});
    }
  };

  Stream.prototype.renderComponents = function (animate) {
    this.chart.setSource(this.displayData.digitData);
    this.chart.render(animate);// animate if animate === "animate"

    if (this.defaults.pathLabel) {
      this.pathLabel.render();
    }

    this.hoverLine.render();//lines should be to front, so at last

    this.axis.render();
    this.percentage.render();
    this.navi.render();
    //legend should be after legend besides to get right height
    this.legend.render();
  };

  Stream.prototype.createInteractive = function () {
    this.paths = this.chart.paths;
    $(this.paper.canvas).unbind();//prevent event rebind.

    //refactor stream chart's animate function, especially change the callback
    var stream = this;
    this.chart.animateCallback = function () {
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
        $(stream.paper.canvas).trigger("mousemove",
            [stream.cover.mouse.x, stream.cover.mouse.y]);
        $(stream.floatTag).trigger("mousemove",
            [stream.cover.mouse.x, stream.cover.mouse.y]);
        stream.cover.mouse = undefined;
      }

      stream.pathLabel.show();
    };

    //chart mouseenter
    var mouseenter = function (e) {
      var stream = e.data.stream;
      stream.hoverLine.show();
      stream.floatTag.show();
      stream.axis.showTab();
    };

    //chart mouseleave
    var mouseleave = function (e) {
      var stream = e.data.stream;

      stream.hoverLine.hidden();
      stream.floatTag.hidden();

      stream.axis.hideTab();
      //recover prepath;
      if (typeof stream.prePath !== 'undefined') {
        stream.prePath.attr({"opacity": 1, "stroke-width": 1});
        // set legend
        stream.legend.lowlight(stream.prePath.index);
        stream.prePath = undefined;
      }
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
          var cover = stream.cover;
          canvas.trigger("mousemove", [cover.mouse.x, cover.mouse.y]);
          canvas.trigger("mousemove", [cover.mouse.x, cover.mouse.y]);
          cover.mouse = undefined;
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
      var stream = e.data.stream;
      var offset = $(this).parent().offset();
      var x = (e.pageX || pageX) - offset.left,
        y = (e.pageY || pageY) - offset.top;
      var path,
        pathSource = stream.pathSource,
        pathIndex;
      var xIdx = Math.floor((x / (stream.defaults.chartWidth / (stream.chart.source[0].length - 1) / 2) + 1) / 2);
      var lineX;
      //get path and pathIndex
      pathSource = stream.chart.pathSource;
      for (var i = 0, l = pathSource.length; i < l; i++) {
        if (y >= pathSource[i][xIdx].y0 - pathSource[i][xIdx].y && y <= pathSource[i][xIdx].y0) {
          path = stream.chart.paths[i];
          pathIndex = i;
          break;
        }
      }
      if (typeof path === 'undefined') {
        return;
      }

      //recover prepath;
      if (typeof stream.prePath !== 'undefined') {
        stream.prePath.attr({"opacity": 1, "stroke-width": 1});
        // set legend
        stream.legend.lowlight(stream.prePath.index);
      }
      //change new path;
      stream.prePath = path;
      stream.prePath.index = pathIndex;
      path.attr({"opacity": 0.5, "stroke-width": 0});

      // set legend
      stream.legend.highlight(stream.prePath.index);
      //set indicator and highlight line new position
      stream.hoverLine.refresh(xIdx, pathIndex);

      //set floatTag content
      stream.floatTag.setContent(stream.getFloatTagContent(stream.displayData.allInfos[i][0]));
      //axis pop bubble
      lineX = stream.defaults.chartWidth * xIdx / (stream.chart.source[0].length - 1);
      stream.axis.refreshTab(stream.date[xIdx + stream.timeRange[0]], lineX + stream.defaults.percentageWidth);

      //customevent;
      if (stream.defaults.customEventHandle.mousemove) {
        stream.defaults.customEventHandle.mousemove.call(stream,
          {"timeIndex": xIdx, "pathIndex": pathIndex});
      }
    };
    var canvas = $(this.paper.canvas);
    canvas.bind("mouseenter", {"stream": this}, mouseenter)
      .bind("mouseleave", {"stream": this}, mouseleave)
      .bind("click", {"stream": this}, click)
      .bind("mousemove", {"stream": this}, mousemove);
  };

  Stream.prototype.getFloatTagContent = function (info) {
    return "<b>" + info.rowInfo.rowName + "</b><br/>" +
          "<b>" + (Math.floor(info.ratioInColumn * 1000) / 100) + "%</b>";
  };

  Stream.prototype.getDisplayRowInfo = function (index) {
    return this.displayData.allInfos[index][0].rowInfo;
  };
  
  Stream.prototype.getDisplayColumnInfo = function (index) {
    return this.displayData.allInfos[index][0].columnInfo;
  };
  
  Stream.prototype.render = function (stage, animate) {
    switch (stage) {
      case undefined:
      case "processData":
        this.processData();
        // break;
      case "createComponents":
        //clear old components, layout, create, css
        this.node.innerHTML = '';
        this.createComponents();
        // break;
      case "renderComponents":
        //clear old component content, render new content
        this.clearCanvas();
        this.renderComponents(animate);
        // break;
      case "createInteractive":
        this.createInteractive();
        // break;
      default:
        break;
    }
  };

  Stream.prototype.resize = function () {};
    
  Stream.prototype.setCustomEvent = function (eventName, callback) {
    if (typeof this.defaults.customEventHandle[eventName] !== 'undefined') {
      this.defaults.customEventHandle[eventName] = callback;
    }
  };

  Stream.prototype.animate = function (options, timeDuration) {
    //must after render if new Source has been set;
    if (!this.canAnimate) {
      throw new Error("Function animate must be called after render if new Source has been set.");
    }
    var time = 0;
    if (arguments.length > 1) {
      time = timeDuration;
    }

    if (options.offset || options.order) {
      this.source = this.remapSource(this.digitData);
      this.layout();
    }
    var area = this.generateArea();
    var color = this.getColor();
    for (var i = 0, l = this.source.length; i < l; i++) {
      var _area = area(this.source[i]);
      var anim = Raphael.animation({path: _area, fill: color(i)}, time);
      this.paths[i].animate(anim);
    }
  };

  /*!
   * 导出Stream
   */
  return Stream;
});
