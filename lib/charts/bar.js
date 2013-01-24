/*global Raphael, d3, $, define, _ */
/*!
 * Bar图的兼容性定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Bar', function (require) {
  var DataV = require('DataV');

  /**
   * Bar构造函数
   * Creates Bar in a DOM node with id "chart", default width is 522; height is 522px;
   * Options:
   *
   * - `width` 宽度，默认为节点宽度
   * - `yBase` 横坐标的基线值，有的以0为起始值，有的则以数据中的最小值为起始值
   * - `gap` 组与组之间的缝隙宽度
   * - `barColor` 设置每组bar的颜色，数组
   * - `xTickNumber` 横轴刻度数量
   * - `yTickNumber` 纵轴刻度数量
   * - `legendWidth` 设置图例宽度
   * - `showLegend` 设置是否显示图例
   * - `formatLabel` 纵轴刻度格式化函数，传入纵轴刻度值，
   * - `formatXScale` 横轴轴刻度格式化函数，传入横轴刻度值，
   * - `formatValue` 数值格式化函数，传入数值，
   * - `formatLegend` 图里的文字格式化函数，传入图例文字
   *
   * Examples:
   * ```
   * var bar = new Bar("chart", {"width": 500, "height": 600);
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin bar style.
   */
  var Bar = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
        this.type = "Bar";
        this.node = this.checkContainer(node);

        /**
         * 柱纬度
        */
        this.dimension.bar = {
            type: "string",
            required: true,
            index: 0
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
        this.defaults.margin = [10, 20, 30, 50];
        this.defaults.gap = 15;
        this.defaults.barColor = ["#308BE6","#8EEC00","#DDDF0D"];
        this.defaults.xTickNumber = 5;
        this.defaults.yTickNumber = 5;
        this.defaults.legendWidth = 100;
        this.defaults.yBase = 0;
        this.defaults.showLegend = true;
        this.barSet = [];
        this.formatLabel = function (text) {
            return text;
        };
        this.formatXScale = function (text) {
            return text;
        };
        this.formatValue = function (value) {
            return value;
        };
        this.formatLegend = function (legend) {
            return legend;
        }
        this.setOptions(options);
        this.createCanvas();
        this.initEvents();
    }
  });

  /**
   * 创建画布
   */
  Bar.prototype.createCanvas = function () {
    var conf = this.defaults;
    this.node.style.position = "relative";
    this.canvas = new Raphael(this.node, conf.width, conf.height);
  };

  Bar.prototype.initEvents = function () {
    var that = this;
    this.on('legendOver', function (barIndex) {
      that.barSet.forEach(function (set, index) {
        if (index !== barIndex) {
          set.attr({
            "fill-opacity": 0.3
          });
        }
      });
    });

    this.on('legendOut', function (barIndex) {
      that.barSet.forEach(function (set, index) {
        set.attr({
          "fill-opacity": 1
        });
      });
    });

    this.on('legendClick', function (clicked, barIndex) {
      that.clicked = clicked;
      that.clickedBarIndex = barIndex;
      that.barSet.forEach(function (set, index) {
        if (index !== barIndex) {
          if (clicked) {
            set.attr({"fill-opacity": 0.1});
          } else {
            set.attr({"fill-opacity": 0.5});
          }
        } else {
          set.attr({"fill-opacity": 1});
        }
      });
    });
  };

  /**
   * 设置数据源
   * Examples：
   * ```
   * bar.setSource(source ， {
        bar: 0,
        x: 1,
        value: 2
    });
   * ```
   * @param {Array} source 数据源 第一列为排布在y轴的数据，后n列为排布在x轴的数据
   * @param {Object} map 映射方式
   */
  Bar.prototype.setSource = function (source, map) {
    var conf = this.defaults;
    map = this.map(map);
    var dataTable;
    if (DataV.detect(source) === 'Table_WITH_HEAD') {
      dataTable = DataV.collectionify(source);
    } else {
      dataTable = source;
    }
    this.bars = _.groupBy(dataTable, map.bar);
    this.barCount = _.keys(this.bars).length;

    conf.yAxisData = _.pluck(_.first(_.values(this.bars)), map.x);
    conf.yTickNumber = Math.min(conf.yAxisData.length, conf.yTickNumber);
    // 横坐标的范围
    conf.xExtent = d3.extent(dataTable, function (item) {
      return item[map.value];
    });
    // 横坐标基线值
    if (conf.xBase !== undefined) {
      conf.xExtent.push(conf.xBase);
      conf.xExtent = d3.extent(conf.xExtent);
    }
  };

  /**
   * 设置坐标轴
   */
  Bar.prototype.setAxis = function () {
    var conf = this.defaults;
    if (conf.showLegend) {
        conf.legendArea = [conf.width - conf.legendWidth, 0, conf.width, conf.height];
    } else {
        conf.legendWidth = 0;
        conf.legendArea = [0, 0, 0, 0];
    }
    var tagWidth = conf.width / 5 > 50 ? 50 : conf.width / 5;
    var margin = conf.margin;
    conf.diagramArea = [margin[3], margin[0], conf.width - conf.legendWidth - margin[1], conf.height - margin[2]];

    //设置x轴
    this.value = d3.scale.linear().domain(conf.xExtent).range([conf.diagramArea[0], conf.diagramArea[2]]);
    //设置y轴
    this.y = d3.scale.linear().domain([0, conf.yAxisData.length]).range([conf.diagramArea[3], conf.diagramArea[1]]);
    var valueRange = this.value.range();
    var yRange = this.y.range();
    var axis = this.axisPosition = {
      left: valueRange[0],
      right: valueRange[1],
      up: yRange[1],
      down: yRange[0]
    };
    var barsMaxLen = _.max(this.bars, function (bar) {
      return bar.length;
    }).length;
    this.barWidth = (axis.down - axis.up - barsMaxLen * conf.gap) / barsMaxLen / _.keys(this.bars).length;
  };

  /**
   * 绘制坐标
   */
  Bar.prototype.drawAxis = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    var i, j, k, l;
    //画坐标轴
    var axisLines = paper.set();
    var tickText = paper.set();
    var axis = this.axisPosition;
    var ticks;
    // X轴
    var formatXScale = conf.formatXScale || that.formatXScale;
    ticks = this.value.ticks(conf.xTickNumber);
    for (j = 0; j < ticks.length; j++) {
      tickText.push(paper.text(this.value(ticks[j]), axis.down + 14, formatXScale(ticks[j])).attr({
        "fill": "#878791",
        "fill-opacity": 0.7,
        "font-size": 12,
        "text-anchor": "middle"
      }).rotate(0, axis.right + 6, this.value(ticks[j])));
      axisLines.push(paper.path("M" + this.value(ticks[j]) + "," + axis.down + "L" + this.value(ticks[j]) + "," + (axis.down + 5)));
    }
    axisLines.push(paper.path("M" + axis.left + "," + axis.up + "L" + axis.left + "," + axis.down));
    axisLines.attr({
      "stroke": "#D7D7D7",
      "stroke-width": 2
    });

    var numOfHLine = d3.round((axis.down - axis.up) / 30 - 1);
    var hLines = paper.set();
    for (j = 1; j <= numOfHLine; j++) {
      var hLinesPos = axis.right - j * 30;
      hLines.push(paper.path("M" + hLinesPos + "," + axis.up + "L" + hLinesPos + "," + axis.down));
    }
    hLines.attr({
      "stroke": "#ECECEC",
      "stroke-width": 1
    });
    
    //Y轴
    ticks = this.y.ticks(conf.yTickNumber);
    //console.log(ticks);
    var range = this.y.range();
    var formatLabel = conf.formatLabel || that.formatLabel;
    // 修复显示不从第一个x轴单位显示的bug
    for (j = 0; j < ticks.length; j++) {
      // 修改x轴单位显示在所有Bar组的中间位置
      // 修复x轴单位对于柱位置的偏移
      var y = this.y(ticks[j]) - conf.gap / 2 - this.barCount * Math.floor(this.barWidth) / 2;
      tickText.push(paper.text(axis.left - 10, y, formatLabel(conf.yAxisData[ticks[j]])).rotate(45, axis.left - 10, y).attr({
          "fill": "#878791",
          "fill-opacity": 0.7,
          "font-size": 12,
          "text-anchor": "end"
        }));
      axisLines.push(paper.path("M" + axis.left + "," + y + "L" + (axis.left - 5) + "," + y));
    }
    axisLines.push(paper.path("M" + axis.left + "," + axis.down + "L" + axis.right + "," + axis.down));
    axisLines.attr({
      "stroke": "#D7D7D7",
      "stroke-width": 2
    });
  };

  /**
   * 进行柱状图的绘制
   */
  Bar.prototype.drawDiagram = function () {
    var that = this;
    var conf = this.defaults;
    var axis = this.axisPosition;
    var paper = this.canvas;
    var dim = that.dimension;
    //bars
    var barWidth = this.barWidth;
    var barCount = this.barCount;
    var barSet = this.barSet;
    var values = _.values(this.bars);
    var tagSet = paper.set();

    //bars
    var mouseOverBar = function (event) {
        var barIndex = this.data('bar');
        var yIndex = this.data('index');
        if (that.clicked && that.clickedBarIndex !== barIndex) {
            return;
        }
        tagSet.remove();
        var currentSet = barSet.filter(function (set, barIndex) {
            return that.clicked ? that.clickedBarIndex === barIndex : true;
        });
        currentSet.forEach(function (set, barIndex) {
            set.forEach(function (bar, index) {
                if(yIndex == index) {
                    bar.stop().attr({
                        "fill-opacity": 1
                    });
                } else {
                    bar.stop().animate({
                        "fill-opacity": 0.3
                    },100);
                }
            });
        });

        var hovered = currentSet.map(function (set) {
            return set[yIndex];
        });
        var yPos = _.max(hovered, function (item) {
            return item.attrs.y;
        }).attrs.y + barWidth + 8;

        var x = _.map(hovered, function (item) {
            return item.attrs.x + item.attrs.width;
        });
        // TODO: 防遮罩算法
        for (var i = 1; i < x.length; i++) {
            for (var j = i - 1; j >= 0; j--) {
                var overlapped = x.filter(function (item, index) {
                    return index < i && Math.abs(item - x[i]) < 45;
                });
                if (overlapped.length > 0) {
                    var extent = d3.extent(overlapped);
                    if (x[i] <= extent[0]) {
                        x[i] = extent[0] - 45;
                    } else {
                    x[i] = extent[1] + 45;
                    }
                }
            }
        }
        hovered.forEach(function (item, barIndex) {
            var xPos = x[barIndex];
            var formatValue = conf.formatValue || that.formatValue;
            var valueLabel = formatValue('' + values[barIndex][yIndex][dim.value.index]);
            var textWidth = 5 * valueLabel.length + 20;
            var rect = paper.rect(xPos - textWidth / 2, yPos, textWidth, 20, 2).attr({
                "fill": conf.barColor[barIndex],
                "fill-opacity": 1,
                "stroke": "none"
            });
            var path = paper.path("M" + (xPos - 4) + "," + yPos + "L" + xPos + "," + (yPos - 5) + "L" + (xPos +4) + "," + yPos + "H" + (xPos - 4) + "Z").attr({
                "fill" : conf.barColor[barIndex],
                "stroke" : conf.barColor[barIndex]
            });
            var text = paper.text(xPos, yPos + 10, valueLabel).attr({
                "fill": "#ffffff",
                "fill-opacity": 1,
                "font-weight": "bold",
                "font-size": 12,
                "text-anchor": "middle"
            });
            tagSet.push(rect, path, text);
        });

        yPos = hovered.reduce(function (pre, cur) {
            return pre + cur.attrs.y;
        }, 0) / hovered.length + barWidth / 2;
        var formatLabel = conf.formatLabel || that.formatLabel;
        var yLabel = formatLabel('' + values[barIndex][yIndex][dim.x.index]);
        var textWidth = 6 * yLabel.length + 20;
        //axis y rect
        var rect = paper.rect(axis.left - textWidth, yPos - barWidth + 2, textWidth, 20, 2).attr({
            "fill": "#5f5f5f",
            "fill-opacity": 1,
            "stroke": "none"
        }).rotate(45, axis.left, yPos - barWidth + 2, textWidth);
        // axis y text
        var text = paper.text(axis.left - 2, yPos + 2, yLabel).attr({
            "fill": "#ffffff",
            "fill-opacity": 1,
            "font-weight": "bold",
            "font-size": 12,
            "text-anchor": "end"
      }).rotate(45, axis.left - 2, yPos - barWidth + 2, textWidth);
      tagSet.push(rect, text);
    };

    var mouseOutBar = function (event) {
        var barIndex = this.data('bar');
        var yIndex = this.data('index');
        var currentSet = barSet.filter(function (set, barIndex) {
            return that.clicked ? that.clickedBarIndex === barIndex : true;
        });
        tagSet.stop().animate({"opacity": 0}, 300, function () {
            tagSet.remove();
        });
        currentSet.forEach(function (set) {
            set.stop().animate({"fill-opacity": 1}, 100);
        });
    };

    values.forEach(function (bar, index) {
      barSet[index] = paper.set();
      bar.forEach(function (row, i) {
        var value = row[dim.value.index];
        var height = that.value(value);
        var y = that.y(i);
        var rect = paper.rect(axis.left, y - barWidth * (index + 1) - conf.gap / 2, height - axis.left, barWidth).attr({
          "fill": conf.barColor[index],
          "fill-opacity": 1,
          "stroke": "none"
        });
        rect.data('bar', index).data('index', i);
        rect.mouseover(_.debounce(mouseOverBar, 300));
        rect.mouseout(_.debounce(mouseOutBar, 300));
        barSet[index].push(rect);
      });
    });
  };

  /**
   * 绘制图例
   */
  Bar.prototype.drawLegend = function () {
    var that = this;
    var paper = this.canvas;
    var legendSet = paper.set();
    var bgSet = paper.set();
    var conf = this.defaults;
    var legendArea = conf.legendArea;
    var barCount = this.barCount;
    if(!conf.showLegend) {
        return;
    }
    //legend
    var mouseOverLegend = function (event) {
      if (legendSet.clicked) {
        return;
      }
      bgSet[this.data('type')].attr({
        "fill-opacity":0.5
      });
      that.fire('legendOver', this.data('type'));
    };

    var mouseOutLegend = function (event) {
      if (legendSet.clicked) {
        return;
      }
      bgSet[this.data('type')].attr({"fill-opacity": 0});
      that.fire('legendOut', this.data('type'));
    };

    var clickLegend = function (event) {
      if (legendSet.clicked && legendSet.clickedBar === this.data('type')) {
        legendSet.clicked = false;
      } else {
        legendSet.clicked = true;
        legendSet.clickedBar = this.data('type');
      }
      bgSet.attr({"fill-opacity": 0});
      bgSet[this.data('type')].attr({
        "fill-opacity": legendSet.clicked ? 1 : 0
      });
      that.fire('legendClick', legendSet.clicked, this.data('type'));
    };

    var labels = _.keys(this.bars);
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
      paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] + 10 + (20 + 3) * i + 10, that.formatLegend(labels[i])).attr({
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
      rect.mouseover(mouseOverLegend);
      rect.mouseout(mouseOutLegend);
      rect.click(clickLegend);
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
   * bar.render({"width": 1024})
   * ```
   * @param {Object} options options json object for determin bar style.
   */
  Bar.prototype.render = function (options) {
    this.setOptions(options);
    this.canvas.clear();
    this.setAxis();
    this.drawAxis();
    this.drawDiagram();
    this.drawLegend();
  };
    /*!
     * 导出
     */
  return Bar;
});
