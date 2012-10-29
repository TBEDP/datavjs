;(function (name, definition) {
  if (typeof define === 'function') {
    define(definition);
  } else {
    this[name] = definition(function (id) { return this[id];});
  }
})('Line', function (require) {
  var DataV = require('DataV');
  var theme = DataV.Themes;

  /**
   * Line构造函数
   * Create line in a dom node with id "chart", width is 500px; height is 600px;
   * Examples:
   * ```
   * var line = new Line("chart", {"width": 500, "height": 600});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin line style.
   */
   var Line = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Line";
      this.node = this.checkContainer(node);

      this.defaults = {};

      this.defaults.width = 960;
      this.defaults.height = 500;

      //Properties
      this.defaults.hasDataTitle = true;
      this.defaults.margin = [10, 40, 40, 40];
      this.defaults.title = null;
      this.defaults.subtitle = null;
      this.defaults.tagDepDomain = [];

      this.defaults.clickMode = true;
      this.defaults.hoverMode = true;

      //绘制属性
      this.defaults.lineSize = 2;
      this.defaults.nodeMode = true;
      this.defaults.nodeRadius = 2;
      this.defaults.hasMackLine = true;
      this.defaults.hasXAxis = true;
      this.defaults.hasYAxis = true;
      this.defaults.XAxisTick = 10;
      this.defaults.YAxisTick = 4;
      this.defaults.XAxisOrient = "bottom";
      this.defaults.YAxisOrient = "left";
      this.defaults.XAxisPadding = 10;
      this.defaults.YAxisPadding = 10;
      this.defaults.XAxisDomain = [];
      this.defaults.YAxisDomain = [];
      this.defaults.XAxisFontSize = 10;
      this.defaults.YAxisFontSize = 10;
      this.defaults.YAxisStartDy = 20;
      this.defaults.hasXGrid = true;
      this.defaults.hasYGrid = true;

      //Color
      this.defaults.titleColor = "#000";
      this.defaults.subtitleColor = "#000";
      this.defaults.AxisColor = "#000";
      this.defaults.gridColor = "#efefef";

      //设置用户指定属性
      this.setOptions(options);

      //创建画布
      this.createCanvas();
    }
  });

  /**
   * 创建画布
   */
  Line.prototype.createCanvas = function () {
    var conf = this.defaults;

    this.canvas = new Raphael(this.node, conf.width, conf.height);

    this.canvasF = this.node;

    var canvasStyle = this.canvasF.style;
    canvasStyle.position = "relative";
    this.floatTag = DataV.FloatTag()(this.canvasF);
    this.floatTag.css({
      "visibility": "hidden"
    });
  };

  /**
   * 对原始数据进行处理
   */
  Line.prototype.setSource = function (source) {
    var conf = this.defaults;
    var tagDepDomain = conf.tagDepDomain;
    var dataTable;
    var titles = [];
    var linesData = [];

    if (conf.hasDataTitle) {
      titles = source[0];
      dataTable = source.slice(1);
    } else {
      dataTable = source;
    }

    var j, l;
    var max, min;
    var maxList = [], minList = [];
    var maxLength = 0;
    dataTable.forEach(function (d, i) {
      // initialize the nodes of line
      maxLength = Math.max(maxLength, d.length);
      var line = {name: d[0], id: i, data: [], tags: []};
      for (j = 1, l = d.length; j < l; j++) {
        var nodeData = d[j];
        line.data.push(nodeData);
        if (j === 1) {
          maxList[i] = nodeData;
          minList[i] = nodeData;
        } else {
          maxList[i] = Math.max(maxList[i], nodeData);
          minList[i] = Math.min(minList[i], nodeData);
        }
      }

      // initialize tag content
      l = tagDepDomain.length;
      if (l) {
        var tag = [];
        for (j = 0; j < l; j++){
          var num  = tagDepDomain[j];
          tag = {name: null, data: d[num]};
          var name = titles[num];
          if (name){
            tag.name = name;
          }
          tags.push(tag);
        }
      }

      linesData.push(line);

      if (i === 0) {
        max = maxList[0];
        min = minList[0];
      } else {
        max = Math.max(maxList[i], max);
        min = Math.min(minList[i], min);
      }
    });

    var margin = conf.margin;
    this.xWidth = conf.width - margin[1] - margin[3];
    this.yHeight = conf.height - margin[0] - margin[2];

    this.titles = titles;
    this.maxLength = maxLength - 1;
    this.linesData = linesData;
    this.max = max;
    this.min = min;
    this.maxList = maxList;
    this.minList = minList;

    this.chosen = false;
    this.chosenNum = -1;
  };

  /**
   * 获取颜色函数
   * @return {function} DataV根据主题获取随机离散色函数
   */
  Line.prototype.getColor = function () {
    var colorFunction = DataV.getDiscreteColor();
    return colorFunction;
  };

  /**
   * 绘制X轴
   */
  Line.prototype.setXaxis = function (titles) {
    var conf = this.defaults;
    var canvas = this.canvas;

    if (conf.hasXAxis) {
      var axisColor = conf.AxisColor;
      var gridColor = conf.gridColor;
      var hasDataTitle = conf.hasDataTitle;
      var XAxisPadding = conf.XAxisPadding;
      var margin = conf.margin;
      var startX = margin[3];
      var startY = conf.height - margin[2];
      var xWidth = this.xWidth;
      var maxLength = this.maxLength;
      var yHeight = this.yHeight;
      var fontSize = conf.XAxisFontSize;

      var tickLength;
      if (conf.hasXGrid) {
        tickLength = yHeight;
      } else {
        tickLength = 5;
      }

      var tick = conf.XAxisTick;
      var tickStep;
      if (tick % maxLength === 0) {
        tickStep = xWidth / tick;
      } else {
        tickStep = xWidth / this.maxLength;
        tick = this.maxLength;
      }

      var xAxis = canvas.set();
      var xAxisText = canvas.set();
      xAxis.push(canvas.path("M" + startX + "," + startY + "L" + (startX + xWidth) + "," + startY));

      var l = titles.length;
      for (var i = 0; i < tick; i++) {
        xAxis.push(canvas.path("M" + (startX + i * tickStep) + "," + startY + "L" + (startX + i * tickStep) + "," + (startY - tickLength))
          .attr({"stroke": gridColor}));
        if (hasDataTitle && i < l - 1) {
          xAxisText.push(canvas.text((startX + i * tickStep), startY + XAxisPadding, titles[i + 1]));
        }
      }

      xAxis.attr({fill: axisColor, "stroke-width":2});
      xAxisText.attr({"font-size": fontSize});
      this.xAxis = xAxis;
      this.xAxisText = xAxisText;
      this.xTick = xWidth / maxLength;
    }
  };

  /**
   * 绘制Y轴
   */
  Line.prototype.setYaxis = function () {
    var conf = this.defaults;
    var canvas = this.canvas;

    if (conf.hasYAxis) {
      var axisColor = conf.AxisColor;
      var gridColor = conf.gridColor;
      var margin = conf.margin;
      var YAxisStartDy = conf.YAxisStartDy;
      var yHeight = this.yHeight - YAxisStartDy;
      var xWidth = this.xWidth;
      var startX = margin[3];
      var startY = margin[0] + yHeight;
      var YAxisPadding = conf.YAxisPadding;
      var max = this.max;
      var min = this.min;
      var fontSize = conf.YAxisFontSize;

      var tick = conf.YAxisTick;
      var tickStep = yHeight / tick;

      var d = (max - min) % (tick - 1);
      if (d !== 0) {
        max = max + (tick - 1) - d;
      }
      d = (max - min) / (tick - 1);

      var tickLength;
      if (conf.hasYGrid) {
        tickLength = xWidth;
      } else {
        tickLength = 5;
      }

      var yAxis = canvas.set();
      var yAxisText = canvas.set();
      var dx = 
      yAxis.push(canvas.path("M" + startX + "," + (startY + YAxisStartDy) + "L" + startX + "," + (startY - yHeight)));

      for (var i = 0; i < tick; i++) {
        yAxis.push(canvas.path("M" + startX+ "," + (startY - i * tickStep) + "L" + (startX + tickLength) + "," + (startY - i * tickStep))
          .attr({"stroke": gridColor}));
        yAxisText.push(canvas.text(startX - YAxisPadding, (startY - i * tickStep), (min + i * d)));
      }

      yAxis.attr({fill: axisColor, "stroke-width":2});
      yAxisText.attr({"font-size": fontSize});
      this.yAxis = yAxis;
      this.yAxisText = yAxisText;
      this.yHeight = yHeight;

      this.yMatchNum = tickStep / d;
      this.y0 = startY;
    }
  };

  /**
   * 绘制背景
   */
  Line.prototype.setBackground = function () {
    var conf = this.defaults;
    var canvas = this.canvas;
    var xWidth = this.xWidth;
    var yHeight = this.yHeight;
    var x0 = conf.margin[3];
    var y0 = this.y0;

    var rect = canvas.rect(x0, (y0 - yHeight), xWidth, yHeight).attr({"fill": "#fff","fill-opacity": 0, "stroke": "none"});
    this.background = rect;
  };

  /**
   * 渲染折线图
   * Examples:
   * ```
   * var line = new Line("chart");
   * line.setSource(source);
   * line.render();
   * ```
   * @param {object} options options json object for determin line style.
   */
  Line.prototype.render = function (options) {
    this.canvas.clear();
    this.createCanvas();
    var conf = this.defaults;
    var linesData = this.linesData;
    var nodesList = [];

    this.setXaxis(this.titles);
    this.setYaxis();

    this.setBackground();

    var canvas = this.canvas;
    var nodeMode = conf.nodeMode;
    var getColor = this.getColor();
    var lineSize = conf.lineSize;
    var max = this.max;
    var min = this.min;
    var xTick = this.xTick;
    var yMatchNum = this.yMatchNum;
    var yHeight = this.yHeight;
    var x0 = conf.margin[3];
    var y0 = this.y0;
    var YAxisStartDy = conf.YAxisStartDy;
    var radius = conf.nodeRadius;

    var j, l;
    var lines = canvas.set();
    linesData.forEach(function (d, i) {
      var nodeData = d.data;
      var nodes = canvas.set();
      var color = getColor(i);
      var linePath = "M";

      for (j = 0, l = nodeData.length; j < l; j++) {
        var x = x0 + xTick * (j);
        var y = y0 - ((nodeData[j] - min) * yMatchNum);

        linePath = linePath + x + "," + y;
        
        if (j < l - 1) {
          linePath = linePath + "L";
        }

        if (nodeMode) {
          var thisNode = canvas.circle(x, y, radius * 2).attr({fill: color, "stroke": "none"});
          thisNode.data('num', j);
          thisNode.data('lineNum', i);
          thisNode.data('data', nodeData[j]);
          nodes.push(thisNode);
        }
      }

      lines.push(canvas.path(linePath).attr({"stroke": color, "stroke-width": lineSize}).data('num', i));
      if (nodeMode) {
        nodesList.push(nodes.toFront());
      }
    });

    this.lines = lines;
    this.nodesList = nodesList;

    this.interactive();
  };

  /**
   * 添加交互选项
   */
  Line.prototype.interactive = function () {
    var that = this;
    var conf = this.defaults;
    var hoverMode = conf.hoverMode;
    var clickMode = conf.clickMode;
    var nodeMode = conf.nodeMode;
    var chosen = this.chosen;
    var chosenNum = this.chosenNum;
    var lines = this.lines;
    var nodesList = this.nodesList;
    var xAxisText = this.xAxisText;
    var XAxisFontSize = conf.XAxisFontSize;

    var highLight = function (num) {
      var line = lines[num];
      lines.attr({"stroke-opacity": 0.2});

      nodesList.forEach(function (d) {
        d.attr({"fill-opacity": 0.2});
      });

      line.attr({"stroke-opacity": 1}).toFront();
      nodesList[num].attr({"fill-opacity": 1}).toFront();
    };

    var unhighLinght = function () {
      lines.forEach(function (d) {
        d.attr({"stroke-opacity": 1});
      });
      nodesList.forEach(function (d) {
        d.attr({"fill-opacity": 1});
      });
    };

    var background = this.background;

    if (clickMode){
      background.click(function () {
        if (chosen) {
          unhighLinght();
          chosen = false;
          that.chosen = chosen;
        }
      });
    }

    var floatTag = this.floatTag;
    $(this.node).append(this.floatTag);
    // if (hoverMode) {
    //  background.mouseover(function () {
        
  //    }).mouseout(function () {
  //      floatTag.css({"visibility" : "hidden"});
  //    });
    // }

    lines.forEach(function (d) {
      if (hoverMode) {
        d.mouseover(function () {
          if (!chosen) {
            highLight(d.data('num'));
          }
        }).mouseout(function () {
          if (!chosen) {
            unhighLinght();
          }
        });
      }

      if (clickMode){
        d.click(function () {
          chosenNum = d.data('num');
          highLight(chosenNum);

          chosen = true;
          that.chosen = chosen;
        });
      }
    });

    if (nodeMode){
      var radius = conf.nodeRadius;

      nodesList.forEach(function (d) {
        d.forEach (function (d) {
          if (hoverMode) {
            d.mouseover(function () {
              d.animate({r: (radius + 2) * 2}, 100);
              xAxisText[d.data('num')].animate({'font-size': XAxisFontSize * 2}, 100);
              floatTag.html('<div style="text-align: center;margin:auto;color:#ffffff">' + d.data('data') + '</div>');
                floatTag.css({"visibility": "visible"});
              if (!chosen) {
                highLight(d.data("lineNum"));
              }
            }).mouseout(function () {
              d.animate({r: radius * 2}, 100);
              xAxisText[d.data('num')].animate({'font-size': XAxisFontSize}, 100);
              floatTag.css({"visibility": "hidden"});
              if (!chosen) {
                unhighLinght();             
              }
            });
          }

          if (clickMode){
            d.click(function () {
              chosenNum = d.data('lineNum');
              highLight(chosenNum);

              chosen = true;
              that.chosen = chosen;
            });
          }
        });
      });
    }
  };

  return Line;
});