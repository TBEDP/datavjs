/*global Raphael, d3, $, _ */
/*!
 * Stack图的兼容性定义
 */;
(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) {
      return this[id];
    });
  }
})('Stack', function (require) {
  var DataV = require('DataV');

  /**
   * Stack构造函数
   * Creates Stack in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `yBase` 纵坐标的基线值，默认为0，可以设置为任意数值；为undefined时，以数据中的最小值为起始值
   * - `barWidth` 柱子的宽度
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `showPercentage` 显示绝对值或百分比
   * - `xTickNumber` 横轴刻度数
   * - `yTickNumber` 纵轴刻度数
   * - `formatLabel` 横轴提示格式化函数，传入横轴值，默认函数传出原始值
   * - `formatYScale` 纵轴刻度格式化函数，传入纵轴刻度值
   * - `formatValue` 值格式化函数
   *
   * Examples:
   * ```
   * var stack = new Stack("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin stack style.
   */
  var Stack = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Stack";
      this.node = this.checkContainer(node);

      /**
       * 柱纬度
       */
      this.dimension.stack = {
        type: "string",
        required: true,
        index: undefined
      };
      /**
       * 横向纬度
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

      this.defaults.typeNames = [];
      // canvas parameters
      this.defaults.width = 522;
      this.defaults.height = 522;

      this.defaults.margin = [50, 50, 50, 50];

      this.defaults.barWidth = 10;
      this.defaults.circleR = 3;
      this.defaults.barColor = ["#308BE6", "#8EEC00", "#DDDF0D"];
      this.defaults.xTickNumber = 5;
      this.defaults.yTickNumber = 5;
      this.showPercentage = false;

      this.defaults.yBase = 0;

      this.defaults.showLegend = true;
      this.defaults.legendWidth = 100;
      //图例区域的左上顶点坐标x，y，宽，高
      this.defaults.legendArea = [422, 50, 472, 220];
      this.StackSet = [];
      this.legendCluster = [];

      this.defaults.tipStyle = {
        "textAlign": "center",
        "margin": "auto",
        "color": "#ffffff"
      };

      this.setOptions(options);
      this.createCanvas();
      this.initEvents();

    }
  });

  /**
   * 创建画布
   */
  Stack.prototype.createCanvas = function () {
    var conf = this.defaults;
    this.node.style.position = "relative";
    this.canvas = new Raphael(this.node, conf.width, conf.height);
    this.floatTag = DataV.FloatTag()(this.node);
    this.floatTag.css({
      "visibility": "hidden"
    });
  };

  Stack.prototype.initEvents = function () {
    var that = this;
    this.on('legendOver', function (StackIndex) {
      that.StackSet.forEach(function (set, index) {
        if (index !== StackIndex) {
          set.data('colorRect').attr({
            "fill-opacity": 0.5
          });
        }
      });
    });

    this.on('legendOut', function (StackIndex) {
      that.StackSet.forEach(function (set, index) {
        set.data('colorRect').attr({
          "fill-opacity": 0
        });
      });
    });

    this.on('legendClick', function (clicked, StackIndex) {
      that.clicked = clicked;
      that.clickedStackIndex = StackIndex;
      that.StackSet.forEach(function (set, index) {
        if (index !== StackIndex) {
          if (clicked) {
            set.data('colorRect').attr({
              "fill-opacity": 0.7
            });
          } else {
            set.data('colorRect').attr({
              "fill-opacity": 0.5
            });
          }
        } else {
          set.data('colorRect').attr({
            "fill-opacity": 0
          });
        }
      });
    });
  };

  /**
   * 设置数据源
   * Examples：
   * ```
   * stack.setSource(source);
   * ```
   * @param {Array} source 数据源 第一列为排布在x轴的数据，后n列为排布在y轴的数据
   */
  Stack.prototype.setSource = function (source, map) {
    var conf = this.defaults;
    map = this.map(map);
    var dataTable; // = source;
    if (DataV.detect(source) === 'Table_WITH_HEAD') {
      dataTable = DataV.collectionify(source);
    } else {
      dataTable = source;
    }
    // 不指定列，将当前数据作为一列
    this.Stacks = (typeof map.stack === 'undefined') ? {
      stack: dataTable
    } : _.groupBy(dataTable, map.stack);
    var that = this;
    _.each(this.Stacks, function (group, key) {
      that.Stacks[key] = _.sortBy(group, map.x);
    });
    this.StackCount = _.keys(this.Stacks).length;
    conf.xAxisData = _.pluck(_.first(_.values(this.Stacks)), map.x);
    conf.xTickNumber = Math.min(conf.xAxisData.length, conf.xTickNumber);
    // 纵坐标的范围

    var values = _.values(this.Stacks);
    var yExtent = [0, 0];
    for (var i = values[0].length - 1; i >= 0; i--) {
      var total = 0;
      for (var j = 0; j < values.length; j++) {
        total += values[j][i][this.mapping.value]
      }
      if (total > yExtent[1]) {
        yExtent[1] = total;
      }
    };
    /*
    d3.extent(dataTable, function (item)
     {
      return item[map.value];
    });
*/
    // 纵坐标基线值
    if (typeof conf.yBase !== 'undefined') {
      yExtent.push(conf.yBase);
    }
    yExtent = d3.extent(yExtent);
    // 最大值放大1/10
    conf.yExtent = [yExtent[0], yExtent[1] * 1.1];
  };

  /**
   * 设置坐标轴
   */
  Stack.prototype.setAxis = function () {
    var conf = this.defaults;
    if (conf.showLegend) {
      conf.legendArea = [conf.width - conf.legendWidth, 0, conf.width, conf.height];
    } else {
      conf.legendWidth = 0;
      conf.legendArea = [0, 0, 0, 0];
    }

    var margin = conf.margin;
    var diagramArea = this.diagramArea = [margin[3], margin[0], conf.width - conf.legendWidth - margin[1], conf.height - margin[2]];

    //设置x轴
    this.x = d3.scale.linear().domain([0, conf.xAxisData.length]).range([diagramArea[0], diagramArea[2]]);
    //设置y轴
    this.value = d3.scale.linear().domain(conf.yExtent).range([diagramArea[3], diagramArea[1]]);
    var xRange = this.x.range();
    var valueRange = this.value.range();
    this.axisPosition = {
      left: xRange[0],
      right: xRange[1],
      up: valueRange[1],
      down: valueRange[0]
    };
    this.clusterCount = _.max(this.Stacks, function (stack) {
      return stack.length;
    }).length;
    var width = diagramArea[2] - diagramArea[0];
    this.clusterWidth = width / this.clusterCount;
    this.gap = (this.clusterWidth - conf.barWidth) / 2;
  };

  /**
   * 绘制坐标
   */
  Stack.prototype.drawAxis = function () {
    var conf = this.defaults;
    var paper = this.canvas;
    var j;
    //画坐标轴
    var axisLines = paper.set();
    var tickText = paper.set();
    var axis = this.axisPosition;
    // X轴
    var ticks = this.x.ticks(conf.xTickNumber);
    var formatLabel = this.getFormatter('formatLabel');

    // 修复显示不从第一个x轴单位显示的bug
    for (j = 0; j < ticks.length; j++) {
      // 修改x轴单位显示在所有Stack组的中间位置
      // 修复x轴单位对于柱位置的偏移
      var x = this.x(ticks[j]) + this.clusterWidth / 2;
      var text = conf.xAxisData[ticks[j]];
      // 会存在刻度大于数组长度的情况，边界处理
      if (typeof text !== "undefined") {
        tickText.push(paper.text(x, axis.down + 14, formatLabel(text)).rotate(0, x, axis.up));
        // 画x轴刻度线
        axisLines.push(paper.path("M" + x + "," + axis.down + "L" + x + "," + (axis.down + 5)));
      }
    }

    tickText.attr({
      "fill": "#878791",
      "fill-opacity": 0.7,
      "font-size": 12,
      "text-anchor": "middle"
    });

    // 绘制Y轴
    axisLines.push(paper.path("M" + axis.left + "," + axis.up + "L" + axis.left + "," + axis.down));
    axisLines.attr({
      "stroke": "#D7D7D7",
      "stroke-width": 2
    });
    //Y轴
    ticks = this.value.ticks(conf.yTickNumber);
    var formatYScale = this.getFormatter('formatYScale');
    for (j = 0; j < ticks.length; j++) {
      tickText.push(paper.text(axis.left - 8, this.value(ticks[j]), formatYScale(ticks[j])).attr({
        "fill": "#878791",
        "fill-opacity": 0.7,
        "font-size": 12,
        "text-anchor": "end"
      }).rotate(0, axis.right + 6, this.value(ticks[j])));
      axisLines.push(paper.path("M" + axis.left + "," + this.value(ticks[j]) + "L" + (axis.left - 5) + "," + this.value(ticks[j])));
    }
    axisLines.push(paper.path("M" + axis.left + "," + axis.down + "L" + axis.right + "," + axis.down));
    axisLines.attr({
      "stroke": "#D7D7D7",
      "stroke-width": 2
    });

    var numOfHLine = d3.round((axis.down - axis.up) / 30 - 1);
    var hLines = paper.set();
    for (j = 1; j <= numOfHLine; j++) {
      var hLinesPos = axis.down - j * 30;
      hLines.push(paper.path("M" + axis.left + "," + hLinesPos + "L" + axis.right + "," + hLinesPos));
    }
    hLines.attr({
      "stroke": "#ECECEC",
      "stroke-width": 0.1
    });
  };

  /**
   * 进行柱状图的绘制
   */
  Stack.prototype.drawDiagram = function () {
    var that = this;

    var floatTag = this.floatTag;
    var conf = this.defaults;
    var axis = this.axisPosition;
    var paper = this.canvas;
    //bars
    var barWidth = conf.barWidth;
    var StackSet = this.StackSet = [];
    var values = _.values(this.Stacks);
    var formatValue = that.getFormatter('formatValue');
    var labels = _.keys(this.Stacks);


    $(this.node).append(this.floatTag);

    var mouseOver = function () {
      floatTag.html(this.data('text')).css(conf.tipStyle);
      floatTag.css({
        "visibility": "visible"
      });
      var cRect = this;
      that.StackSet.forEach(function (stack) {
        stack.forEach(function (rect, index) {
          if (index === cRect.data('index')) {
            rect.data('colorRect').attr({
              'fill-opacity': 0.6
            });
          }
        });
      });

    }

    var mouseOut = function () {
      floatTag.css({
        "visibility": "hidden"
      });
      that.StackSet.forEach(function (stack) {
        stack.forEach(function (rect) {
          rect.data('colorRect').attr({
            'fill-opacity': 1
          });
        });
      });
    }

    values.forEach(function (stack, index) {
      StackSet[index] = paper.set();
      stack.forEach(function (row, i) {
        var value1 = row[that.mapping.value];
        var tValue = 0;
        var valueLabel = '';
        var value = 0;
        for (var j = 0; j < that.StackCount; j++) {
          if (j <= index) {
            value += values[j][i][that.mapping.value];
          }
          tValue += values[j][i][that.mapping.value];
        }
        if (tValue === 0) {
          tValue = 1;
        }
        for (var j = 0; j < that.StackCount; j++) {
          if (conf.showPercentage) {
            valueLabel += labels[j] + ': ' + formatValue(values[j][i][that.mapping.value] * 100 / tValue) + '%<br>';
          } else {
            valueLabel += labels[j] + ': ' + formatValue(values[j][i][that.mapping.value]) + '<br>';
          }
        }
        var barHeight = that.value(value1);
        var height = that.value(value);
        var x = that.x(i);

        var yPos = height;
        var textWidth = 5 * valueLabel.length + 20;
        var xPos = x + barWidth + that.gap + 8;

        var colorRect = paper.rect(x + that.gap, height, barWidth, axis.down - barHeight).attr({
          "fill": conf.barColor[index],
          "fill-opacity": 1,
          "stroke": "none"
        });

        var rect = paper.rect(x, height, that.gap * 2 + barWidth, axis.down - barHeight).attr({
          "fill": "#ffffff",
          "fill-opacity": 0.1,
          "stroke": "none"
        });
        rect.data('stack', index).data('index', i).data('height', height).data('text', valueLabel).data('colorRect', colorRect);
        StackSet[index].push(rect);
      });
    });


    this.StackSet.forEach(function (stack) {
      stack.forEach(function (rect, index) {
        rect.mouseover(mouseOver).mouseout(mouseOut);
      });
    });

  };
  /**
   * 绘制图例
   */
  Stack.prototype.drawLegend = function () {
    var that = this;
    var paper = this.canvas;
    var legendSet = paper.set();
    var bgSet = paper.set();
    var conf = this.defaults;
    var legendArea = conf.legendArea;
    //legend
    var mouseOverLegend = function () {
      if (legendSet.clicked) {
        return;
      }
      bgSet[this.data('type')].attr({
        "fill-opacity": 0.5
      });
      that.fire('legendOver', this.data('type'));
    };

    var mouseOutLegend = function () {
      if (legendSet.clicked) {
        return;
      }
      bgSet[this.data('type')].attr({
        "fill-opacity": 0
      });
      that.fire('legendOut', this.data('type'));
    };

    var clickLegend = function () {
      if (legendSet.clicked && legendSet.clickedStack === this.data('type')) {
        legendSet.clicked = false;
      } else {
        legendSet.clicked = true;
        legendSet.clickedStack = this.data('type');
      }
      bgSet.attr({
        "fill-opacity": 0
      });
      bgSet[this.data('type')].attr({
        "fill-opacity": legendSet.clicked ? 1 : 0
      });
      that.fire('legendClick', legendSet.clicked, this.data('type'));
    };

    var labels = _.keys(this.Stacks);
    for (var i = 0; i < labels.length; i++) {
      //底框
      bgSet.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
        "fill": "#ebebeb",
        "fill-opacity": 0,
        "stroke": "none"
      }));
      // 色框
      paper.rect(legendArea[0] + 10 + 3, legendArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
        "fill": conf.barColor[i],
        "stroke": "none"
      });
      // 文字
      paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] + 10 + (20 + 3) * i + 10, labels[i]).attr({
        "fill": "black",
        "fill-opacity": 1,
        "font-family": "Verdana",
        "font-size": 12,
        "text-anchor": "start"
      });
      // 选框
      var rect = paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
        "fill": "white",
        "fill-opacity": 0,
        "stroke": "none"
      }).data("type", i);
      //rect.mouseover(mouseOverLegend);
      //rect.mouseout(mouseOutLegend);
      //rect.click(clickLegend);
      legendSet.push(rect);
    }
  };

  /**
   * 绘制柱状图
   * Options:
   *
   *   - `width` 宽度，默认为节点宽度
   *   - `typeNames` 指定y轴上数据类目
   *
   * Examples:
   * ```
   * stack.render({"width": 1024})
   * ```
   * @param {Object} options options json object for determin stack style.
   */
  Stack.prototype.render = function (options) {
    var conf = this.defaults;
    this.setOptions(options);
    this.canvas.clear();
    this.setAxis();
    this.drawAxis();
    this.drawDiagram();
    if (conf.showLegend) {
      this.drawLegend();
    }
  };
  /*!
   * 导出
   */
  return Stack;
});