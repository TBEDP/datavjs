/*global Raphael, _, $ */
;(function (name, definition) {
  if (typeof define === 'function') {
    define(definition);
  } else {
    this[name] = definition(function (id) { return this[id];});
  }
})('Line', function (require) {
  var DataV = require('DataV');

  /**
   * Line构造函数，继承自Chart
   * Options:
   *
   *   - `width` 数字，画布宽度，默认为960，表示图片高960px
   *   - `height` 数字，画布高度，默认为500
   *   - `margin` 数组，这个折线图在画布中四周的留白，长度为4，分别代表[top, right, bottom, left], 默认值为[10, 40, 40, 40]
   *   - `title` 字符串，一级标题， 默认值为null
   *   - `subtitle` 字符串，副标题， 默认值为null
   *   - `imagePath 字符串，折线图提供背景图片加载路径，默认值为null
   *   - `clickMode 布尔值，是否使用默认的点击事件，默认点击事件为点击折线即选中当前折线，点击空白部分取消选中，默认值为true
   *   - `hoverMode 布尔值，是否使用默认的悬停事件，默认悬停事件为当前悬停所在折线高亮，如果在节点上悬停则节点高亮，同一X维度节点也高亮， 默认值为true
   *   - `nodeMode 布尔值，是否需要显示节点，默认值为true
   *   - `lineSize 数字，折线粗细，默认值为2
   *   - `gridSize 数字，网格线粗细，默认值为1
   *   - `nodeRadius 数字，节点圆形半径，默认值为2
   *   - `hasXAxis 布尔值，是否需要绘制x坐标轴，默认值为true
   *   - `hasYAxis 布尔值，是否需要绘制y坐标轴，默认值为true
   *   - `xAxisTick 数字，x轴刻度的跨度，默认值为10
   *   - `yAxisTick 数字，y轴刻度的跨度，默认值为10
   *   - `xAxisOrient 字符串，x坐标轴位置，可选值为"top"和"bottom"，默认值为"bottom"
   *   - `yAxisOrient 字符串，x坐标轴位置，可选值为"left"和"right"，默认值为"left"
   *   - `xAxisPadding 数字，x轴与x轴刻度值说明文字的距离，默认值为10
   *   - `yAxisPadding 数字，y轴与y轴刻度值说明文字的距离，默认值为10
   *   - `xAxisFontSize 数字，x轴说明文字字号，默认值为10
   *   - `yAxisFontSize 数字，y轴说明文字字号，默认值为10
   *   - `xAxisStartDx 数字，x轴刻度起始位置与坐标轴最左端水平距离，默认值为20
   *   - `yAxisStartDy 数字，y轴刻度起始位置与坐标轴最下端垂直距离，默认值为10
   *   - `xAxisEndDx 数字，x轴刻度结束位置与坐标轴最右端水平距离，默认值为10
   *   - `yAxisEndDy 数字，y轴刻度结束位置与坐标轴最上端水平距离，默认值为10
   *   - `textLean 布尔值，是否将x轴说明文字倾斜摆放，默认值为false
   *   - `hasXGrid 布尔值，是否需要绘制与x坐标轴平行的网格线，默认值为true
   *   - `hasYGrid 布尔值，是否需要绘制与x坐标轴平行的网格线，默认值为true
   *   - `backgroundColor 字符串，折线图背景填充色，默认值为"#fff"
   *   - `titleColor 字符串，标题文字颜色，默认值为"#000"
   *   - `subtitleColor 字符串，副标题文字颜色，默认值为"#000"
   *   - `AxisColor 字符串，坐标轴填充颜色，默认值为"#000"
   *   - `gridColor 字符串，网格线填充颜色，默认值为"#000"
   *   - `unchosen0pacity 数字，当有折线被选中时，其他淡出折线的透明度，默认值为0.15
   *   - `grid0pacity 数字，网格线透明度，默认值为0.1
   *   - `chosenGrid0pacity 数字，高亮网格线透明度，默认值为0.5
   * Examples:
   * Create line in a dom node with id "chart", width is 500px; height is 600px;
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

      /**
       * 线纬度
       */
      this.dimension.line = {
          type: "string",
          required: true,
          index: 0
      };
      /**
       * 值纬度
       */
      this.dimension.x = {
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

      this.defaults.width = 960;
      this.defaults.height = 500;

      //Properties
      this.defaults.margin = [10, 40, 40, 40];
      this.defaults.title = null;
      this.defaults.subtitle = null;
      this.defaults.imagePath = null;

      this.defaults.clickMode = true;
      this.defaults.hoverMode = true;

      //绘制属性
      this.defaults.lineSize = 2;
      this.defaults.gridSize = 1;
      this.defaults.nodeMode = true;
      this.defaults.nodeRadius = 2;
      this.defaults.hasXAxis = true;
      this.defaults.hasYAxis = true;
      this.defaults.xAxisTick = 10;
      this.defaults.yAxisTick = 4;
      this.defaults.xAxisOrient = "bottom";
      this.defaults.yAxisOrient = "left";
      this.defaults.xAxisPadding = 10;
      this.defaults.yAxisPadding = 10;
      this.defaults.xAxisFontSize = 10;
      this.defaults.yAxisFontSize = 10;
      this.defaults.xAxisStartDx = 20;
      this.defaults.yAxisStartDy = 10;
      this.defaults.xAxisEndDx = 10;
      this.defaults.yAxisEndDy = 10;

      this.defaults.textLean = false;

      this.defaults.hasXGrid = true;
      this.defaults.hasYGrid = true;

      //Color
      this.defaults.backgroundColor = "#fff";
      this.defaults.titleColor = "#000";
      this.defaults.subtitleColor = "#000";
      this.defaults.AxisColor = "#000";
      this.defaults.gridColor = "#000";
      this.defaults.unchosen0pacity = 0.15;
      this.defaults.grid0pacity = 0.1;
      this.defaults.chosenGrid0pacity = 0.5;

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
  Line.prototype.setSource = function (source, map) {
    map = this.map(map);
    var dataTable;
    if (DataV.detect(source) === 'Table_WITH_HEAD') {
      dataTable = DataV.collectionify(source);
    } else {
      dataTable = source;
    }

    var lines = _.groupBy(dataTable, map.line);
    var linesData = [];

    var maxList = [], minList = [];
    this.maxLength = Math.max.apply(null, _.map(lines, function (line) {
      return line.length;
    }));

    var titles;
    _.forEach(lines, function (points, name) {
      // initialize the nodes of line
      var line = {name: name, id: name, data: [], tags: []};
      line.data = _.pluck(points, map.value);
      titles = _.pluck(points, map.x);
      linesData.push(line);
      maxList[name] = Math.max.apply(null, line.data);
      minList[name] = Math.min.apply(null, line.data);
    });

    var conf = this.defaults;
    var margin = conf.margin;
    this.xWidth = conf.width - margin[1] - margin[3];
    this.yHeight = conf.height - margin[0] - margin[2];

    this.titles = titles;
    this.linesData = linesData;
    this.max = Math.max.apply(null, _.values(maxList));
    this.min = Math.min.apply(null, _.values(minList));
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
      var lineSize = conf.lineSize;
      var gridSize = conf.gridSize;
      var axisColor = conf.AxisColor;
      var gridColor = conf.gridColor;
      var grid0pacity = conf.grid0pacity;
      var xAxisPadding = conf.xAxisPadding;
      var margin = conf.margin;
      var xAxisStartDx = conf.xAxisStartDx;
      var xAxisEndDx = conf.xAxisEndDx;
      var startX = margin[3] + xAxisStartDx;
      var startY = conf.height - margin[2];
      var xWidth = this.xWidth;
      var xDataArea = xWidth - xAxisStartDx - xAxisEndDx;
      var maxLength = this.maxLength;
      var yHeight = this.yHeight;
      var fontSize = conf.xAxisFontSize;
      var textLean = conf.textLean;

      var tickLength;
      if (conf.hasXGrid) {
        tickLength = yHeight;
      } else {
        tickLength = 5;
      }

      // 当内容少于刻度数量时，用内容的数量作为刻度数量
      var tick = Math.min(maxLength, conf.xAxisTick);
      var tickStep = xDataArea / (tick - 1);

      var xAxis = canvas.set();
      var xGrid = canvas.set();
      var xAxisText = canvas.set();
      xAxis.push(canvas.path("M" + (startX - xAxisStartDx) + "," + startY + "L" + (xWidth + margin[3]) + "," + startY));

      var l = titles.length;
      for (var i = 0; i < tick; i++) {
        xGrid.push(canvas.path("M" + (startX + i * tickStep) + "," + startY + "L" + (startX + i * tickStep) + "," + (startY - tickLength)));
        if (i < l) {
          // 绘制横坐标上的文字
          var text = canvas.text((startX + i * tickStep), startY + xAxisPadding, titles[i]);
          if (textLean) {
            var d = text.getBBox().width / 2;
            var angle = 45 / 360 * Math.PI;
            text.transform("r45t" + Math.cos(angle) * d + "," + Math.sin(angle) * d);
          }
          xAxisText.push(text);
        }
      }

      xAxis.attr({fill: axisColor, "stroke-width": lineSize});
      xGrid.attr({"stroke": gridColor, "stroke-width": gridSize, "stroke-opacity": grid0pacity});
      xAxisText.attr({"font-size": fontSize});
      this.xAxis = xAxis;
      this.xGrid = xGrid;
      this.xAxisText = xAxisText;
      this.xTick = xDataArea / (maxLength - 1);
    }
  };

  /**
   * 绘制Y轴
   */
  Line.prototype.setYaxis = function () {
    var conf = this.defaults;
    var canvas = this.canvas;

    if (conf.hasYAxis) {
      var lineSize = conf.lineSize;
      var gridSize = conf.gridSize;
      var axisColor = conf.AxisColor;
      var gridColor = conf.gridColor;
      var grid0pacity = conf.grid0pacity;
      var margin = conf.margin;
      var yAxisStartDy = conf.yAxisStartDy;
      var yAxisEndDy = conf.yAxisEndDy;
      var yHeight = this.yHeight;
      var yDataArea = this.yHeight - yAxisStartDy - yAxisEndDy;
      var xWidth = this.xWidth;
      var startX = margin[3];
      var startY = margin[0] + yHeight - yAxisStartDy;
      var yAxisPadding = conf.yAxisPadding;
      var max = this.max;
      var min = this.min;
      var fontSize = conf.yAxisFontSize;

      var tick = conf.yAxisTick;
      var tickStep = yDataArea / (tick - 1);

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
      var yGrid = canvas.set();
      var yAxisText = canvas.set();
      yAxis.push(canvas.path("M" + startX + "," + (startY + yAxisStartDy) + "L" + startX + "," + margin[0]));

      for (var i = 0; i < tick; i++) {
        yGrid.push(canvas.path("M" + startX + "," + (startY - i * tickStep) + "L" + (startX + tickLength) + "," + (startY - i * tickStep)));
        yAxisText.push(canvas.text(startX - yAxisPadding, (startY - i * tickStep), (min + i * d)));
      }

      yAxis.attr({fill: axisColor, "stroke-width": lineSize});
      yGrid.attr({"stroke": gridColor, "stroke-width": gridSize, "stroke-opacity": grid0pacity});
      yAxisText.attr({"font-size": fontSize});
      this.yAxis = yAxis;
      this.yGrid = yGrid;
      this.yAxisText = yAxisText;
      this.yDataArea = yDataArea;

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
    var backgroundColor = conf.backgroundColor;
    var imagePath = conf.imagePath;
    var xWidth = this.xWidth;
    var yHeight = this.yHeight;
    var yAxisStartDy = conf.yAxisStartDy;
    var x0 = conf.margin[3];
    var y0 = this.y0 + yAxisStartDy;

    var rect;
    if (imagePath !== null) {
      rect = canvas.image(imagePath, x0, (y0 - yHeight), xWidth, yHeight);
    } else {
      rect = canvas.rect(x0, (y0 - yHeight), xWidth, yHeight).attr({"fill": backgroundColor,"fill-opacity": 0, "stroke": "none"});
    }

    rect.toBack();
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
  Line.prototype.render = function () {
    this.canvas.remove();
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
    var min = this.min;
    var xAxisStartDx = conf.xAxisStartDx;
    var xTick = this.xTick;
    var yMatchNum = this.yMatchNum;
    var x0 = conf.margin[3] + xAxisStartDx;
    var y0 = this.y0;
    var radius = conf.nodeRadius;

    var lines = canvas.set();
    linesData.forEach(function (d, i) {
      var nodeData = d.data;
      var nodes = canvas.set();
      var color = getColor(i);
      var linePath = "M";

      for (var j = 0, l = nodeData.length; j < l; j++) {
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
    var uo = conf.unchosen0pacity;
    var nodesList = this.nodesList;
    var xGrid = this.xGrid;
    var grid0pacity = conf.grid0pacity;
    var cgo = conf.chosenGrid0pacity;
    var xAxisText = this.xAxisText;
    var xAxisFontSize = conf.xAxisFontSize;

    var highLight = function (num) {
      var line = lines[num];
      lines.attr({"stroke-opacity": uo});

      nodesList.forEach(function (d) {
        d.attr({"fill-opacity": uo});
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
            var nodeNum = d.data('num');
            d.mouseover(function () {
              d.animate({r: (radius + 2) * 2}, 100);
              xGrid[nodeNum].animate({'stroke-opacity': cgo}, 100);
              xAxisText[nodeNum].animate({'font-size': xAxisFontSize * 2}, 100);
              floatTag.html('<div style="text-align: center;margin:auto;color:#ffffff">' + d.data('data') + '</div>');
                floatTag.css({"visibility": "visible"});
              if (!chosen) {
                highLight(d.data("lineNum"));
                nodesList.forEach(function (d) {
                  if (nodeNum < d.length) {
                    d[nodeNum].attr({"fill-opacity": 1});
                  }
                });
              }
            }).mouseout(function () {
              d.animate({r: radius * 2}, 100);
              xGrid[nodeNum].animate({'stroke-opacity': grid0pacity}, 100);
              xAxisText[nodeNum].animate({'font-size': xAxisFontSize}, 100);
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
