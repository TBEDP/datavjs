/*global Raphael, d3, $, define, _ */
/*!
 * Column图的兼容性定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Column', function (require) {
  var DataV = require('DataV');

  /**
   * Column构造函数
   * Creates Column in a DOM node with id "chart"
   * Options:
   *
   * - `width` 宽度，默认为522，单位像素
   * - `height` 高度，默认为522，单位像素
   * - `yBase` 纵坐标的基线值，默认为0，可以设置为任意数值；为undefined时，以数据中的最小值为起始值
   * - `gap` 组与组之间的缝隙宽度
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `xTickNumber` 横轴刻度数
   * - `yTickNumber` 纵轴刻度数
   * - `formatLabel` 横轴提示格式化函数，传入横轴值，默认函数传出原始值
   * - `formatYScale` 纵轴刻度格式化函数，传入纵轴刻度值，
   *
   * Examples:
   * ```
   * var column = new Column("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
   * ```
   * @param {Mix} node The dom node or dom node Id
   * @param {Object} options options json object for determin column style.
   */
  var Column = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Column";
      this.node = this.checkContainer(node);

      /**
       * 柱纬度
       */
      this.dimension.column = {
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

      this.defaults.gap = 15;
      this.defaults.circleR = 3;
      this.defaults.barColor = ["#308BE6","#8EEC00","#DDDF0D"];
      this.defaults.xTickNumber = 5;
      this.defaults.yTickNumber = 5;

      this.defaults.yBase = 0;

      this.defaults.showLegend = true;
      this.defaults.legendWidth = 100;
      //图例区域的左上顶点坐标x，y，宽，高
      this.defaults.legendArea = [422, 50, 472, 220];
      //散点矩阵区域的左上顶点坐标x，y，宽，高
      this.defaults.diagramArea = [50, 50, 422, 472];
      this.columnSet = [];
      this.formatLabel = function (text) {
        return text;
      };
      this.formatYScale = function (text) {
        return text;
      };
      this.formatValue = function (value) {
        return value;
      };

      this.setOptions(options);
      this.createCanvas();
      this.initEvents();
    }
  });

  /**
   * 创建画布
   */
  Column.prototype.createCanvas = function () {
    var conf = this.defaults;
    this.node.style.position = "relative";
    this.canvas = new Raphael(this.node, conf.width, conf.height);
  };

  Column.prototype.initEvents = function () {
    var that = this;
    this.on('legendOver', function (columnIndex) {
      that.columnSet.forEach(function (set, index) {
        if (index !== columnIndex) {
          set.attr({
            "fill-opacity": 0.3
          });
        }
      });
    });

    this.on('legendOut', function (columnIndex) {
      that.columnSet.forEach(function (set, index) {
        set.attr({
          "fill-opacity": 1
        });
      });
    });

    this.on('legendClick', function (clicked, columnIndex) {
      that.clicked = clicked;
      that.clickedColumnIndex = columnIndex;
      that.columnSet.forEach(function (set, index) {
        if (index !== columnIndex) {
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
   * column.setSource(source);
   * ```
   * @param {Array} source 数据源 第一列为排布在x轴的数据，后n列为排布在y轴的数据
   */
  Column.prototype.setSource = function (source, map) {
    var conf = this.defaults;
    map = this.map(map);
    var dataTable;
    if (DataV.detect(source) === 'Table_WITH_HEAD') {
      dataTable = DataV.collectionify(source);
    } else {
      dataTable = source;
    }
    // 不指定列，将当前数据作为一列
    this.columns = (typeof map.column === 'undefined') ? {column: dataTable} : _.groupBy(dataTable, map.column);
    var that = this;
    _.each(this.columns, function (group, key) {
      that.columns[key] = _.sortBy(group, map.x);
    });
    this.columnCount = _.keys(this.columns).length;
    conf.xAxisData = _.pluck(_.first(_.values(this.columns)), map.x);
    conf.xTickNumber = Math.min(conf.xAxisData.length, conf.xTickNumber);
    // 纵坐标的范围
    var yExtent = d3.extent(dataTable, function (item) {
      return item[map.value];
    });
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
  Column.prototype.setAxis = function () {
    var conf = this.defaults;
    if (conf.showLegend) {
      conf.legendArea = [conf.width - conf.legendWidth, 0, conf.width, conf.height];
    } else {
      conf.legendWidth = 0;
      conf.legendArea = [0, 0, 0, 0];
    }

    var margin = conf.margin;
    conf.diagramArea = [margin[3], margin[0], conf.width - conf.legendWidth - margin[1], conf.height - margin[2]];

    //设置x轴
    this.x = d3.scale.linear().domain([0, conf.xAxisData.length]).range([conf.diagramArea[0], conf.diagramArea[2]]);
    //设置y轴
    this.value = d3.scale.linear().domain(conf.yExtent).range([conf.diagramArea[3], conf.diagramArea[1]]);
    var xRange = this.x.range();
    var valueRange = this.value.range();
    var axis = this.axisPosition = {
      left: xRange[0],
      right: xRange[1],
      up: valueRange[1],
      down: valueRange[0]
    };
    var columnsMaxLen = _.max(this.columns, function (column) {
      return column.length;
    }).length;
    var width = conf.diagramArea[2] - conf.diagramArea[0];
    var height = conf.diagramArea[3] - conf.diagramArea[1];
    this.barWidth = width / columnsMaxLen / this.columnCount - conf.gap;
  };

  /**
   * 绘制坐标
   */
  Column.prototype.drawAxis = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    var i, j, k, l;
    //画坐标轴
    var axisLines = paper.set();
    var tickText = paper.set();
    var axis = this.axisPosition;
    // X轴
    var ticks = this.x.ticks(conf.xTickNumber);
    var formatLabel = conf.formatLabel || this.formatLabel;

    // 修复显示不从第一个x轴单位显示的bug
    for (j = 0; j < ticks.length; j++) {
      // 修改x轴单位显示在所有Column组的中间位置
      // 修复x轴单位对于柱位置的偏移
      var x = this.x(ticks[j]) + conf.gap / 2 + this.columnCount * this.barWidth / 2;
      var text = conf.xAxisData[ticks[j]];
      tickText.push(paper.text(x, axis.down + 14, formatLabel(text)).rotate(0, x, axis.up));
      // 画x轴刻度线
      axisLines.push(paper.path("M" + x + "," + axis.down + "L" + x + "," + (axis.down + 5)));
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
    var formatYScale = conf.formatYScale || this.formatYScale;
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
  Column.prototype.drawDiagram = function () {
    var that = this;
    var conf = this.defaults;
    var axis = this.axisPosition;
    var paper = this.canvas;
    var dim = that.dimension;
    //bars
    var barWidth = this.barWidth;
    var columnCount = this.columnCount;
    var columnSet = this.columnSet;
    var values = _.values(this.columns);
    var tagSet = paper.set();

    //bars
    var mouseOverBar = function (event) {
      var columnIndex = this.data('column');
      var xIndex = this.data('index');
      if (that.clicked && that.clickedColumnIndex !== columnIndex) {
        return;
      }
      tagSet.remove();
      var currentSet = columnSet.filter(function (set, columnIndex) {
        return that.clicked ? that.clickedColumnIndex === columnIndex : true;
      });
      currentSet.forEach(function (set, columnIndex) {
        set.forEach(function (bar, index) {
          if (index === xIndex) {
            bar.stop().attr({
              "fill-opacity": 1
            });
          } else {
            bar.stop().animate({
              "fill-opacity": 0.3
            }, 100);
          }
        });
      });

      var hovered = currentSet.map(function (set) {
        return set[xIndex];
      });
      var xPos = _.max(hovered, function (item) {
        return item.attrs.x;
      }).attrs.x + barWidth + 8;

      var y = _.map(hovered, function (item) {
        return item.attrs.y;
      });
      // TODO: 防遮罩算法
      for (var i = 1; i < y.length; i++) {
        for (var j = i - 1; j >= 0; j--) {
          var overlapped = y.filter(function (item, index) {
            return index < i && Math.abs(item - y[i]) < 20;
          });
          if (overlapped.length > 0) {
            var extent = d3.extent(overlapped);
            if (y[i] <= extent[0]) {
              y[i] = extent[0] - 20;
            } else {
              y[i] = extent[1] + 20;
            }
          }
        }
      }
      var formatValue = conf.formatValue || that.formatValue;
      hovered.forEach(function (item, columnIndex) {
        var yPos = y[columnIndex];
        var valueLabel = '' + formatValue(values[columnIndex][xIndex][dim.value.index]);
        var textWidth = 5 * valueLabel.length + 20;

        var rect = paper.rect(xPos, yPos - 10, textWidth, 20, 2).attr({
          "fill": conf.barColor[columnIndex],
          "fill-opacity": 1,
          "stroke": "none"
        });
        var path = paper.path("M" + xPos + "," + (yPos - 4) + "L" + (xPos - 8) + "," + yPos + "L" + xPos + "," + (yPos + 4) + "V" + yPos + "Z").attr({
          "fill" : conf.barColor[columnIndex],
          "stroke" : conf.barColor[columnIndex]
        });
        var text = paper.text(xPos + textWidth / 2, yPos, valueLabel).attr({
          "fill": "#ffffff",
          "fill-opacity": 1,
          "font-weight": "bold",
          "font-size": 12,
          "text-anchor": "middle"
        });
        tagSet.push(rect, path, text);
      });

      xPos = hovered.reduce(function (pre, cur) {
        return pre + cur.attrs.x;
      }, 0) / hovered.length + barWidth / 2;
      var formatLabel = conf.formatLabel || this.formatLabel;
      var xLabel = formatLabel(values[columnIndex][xIndex][dim.x.index]);
      var textWidth = 6 * xLabel.length + 20;
      //axis x rect
      var rect = paper.rect(xPos - textWidth / 2, axis.down + 8, textWidth, 20, 2).attr({
        "fill": "#5f5f5f",
        "fill-opacity": 1,
        "stroke": "none"
      });
      // axis x text
      var text = paper.text(xPos, axis.down + 18, xLabel).attr({
        "fill": "#ffffff",
        "fill-opacity": 1,
        "font-weight": "bold",
        "font-size": 12,
        "text-anchor": "middle"
      });
      var arrow = paper.path("M" + (xPos - 4) + "," + (axis.down + 8) + "L" + xPos + "," + axis.down +
        "L" + (xPos + 4) + "," + (axis.down + 8) + "H" + xPos + "Z").attr({
        "fill": "#5F5F5F",
        "stroke": "#5F5F5F"
      });
      tagSet.push(rect, text, arrow);
    };

    var mouseOutBar = function (event) {
      var columnIndex = this.data('column');
      var xIndex = this.data('index');
      var currentSet = columnSet.filter(function (set, columnIndex) {
        return that.clicked ? that.clickedColumnIndex === columnIndex : true;
      });
      tagSet.stop().animate({"opacity": 0}, 300, function () {
        tagSet.remove();
      });
      currentSet.forEach(function (set, columnIndex) {
        set.stop().animate({"fill-opacity": 1}, 100);
      });
    };

    values.forEach(function (column, index) {
      columnSet[index] = paper.set();
      column.forEach(function (row, i) {
        var value = row[dim.value.index];
        var height = that.value(value);
        var x = that.x(i);
        var rect = paper.rect(x + barWidth * index + conf.gap / 2, height, barWidth, axis.down - height).attr({
          "fill": conf.barColor[index],
          "fill-opacity": 1,
          "stroke": "none"
        });
        rect.data('column', index).data('index', i);
        rect.mouseover(_.debounce(mouseOverBar, 300));
        rect.mouseout(_.debounce(mouseOutBar, 300));
        columnSet[index].push(rect);
      });
    });
  };

  /**
   * 绘制图例
   */
  Column.prototype.drawLegend = function () {
    var that = this;
    var paper = this.canvas;
    var legendSet = paper.set();
    var bgSet = paper.set();
    var conf = this.defaults;
    var legendArea = conf.legendArea;
    var columnCount = this.columnCount;
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
      if (legendSet.clicked && legendSet.clickedColumn === this.data('type')) {
        legendSet.clicked = false;
      } else {
        legendSet.clicked = true;
        legendSet.clickedColumn = this.data('type');
      }
      bgSet.attr({"fill-opacity": 0});
      bgSet[this.data('type')].attr({
        "fill-opacity": legendSet.clicked ? 1 : 0
      });
      that.fire('legendClick', legendSet.clicked, this.data('type'));
    };

    var labels = _.keys(this.columns);
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
   * column.render({"width": 1024})
   * ```
   * @param {Object} options options json object for determin column style.
   */
  Column.prototype.render = function (options) {
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
  return Column;
});
