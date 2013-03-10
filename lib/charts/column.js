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
   * - `barWidth` 柱子的宽度
   * - `autoWidth` 是否柱子的宽度与间隙自动调整
   * - `showLegend` 是否显示图例
   * - `legendWidth` 图例的宽度
   * - `margin` 图表的间距，依次为上右下左
   * - `xTickNumber` 横轴刻度数
   * - `yTickNumber` 纵轴刻度数
   * - `formatLabel` 横轴提示格式化函数，传入横轴值，默认函数传出原始值
   * - `formatYScale` 纵轴刻度格式化函数，传入纵轴刻度值
   * - `formatValue` 值格式化函数
   * - `sortX` 是否将横轴数据排序，默认为true
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

      this.defaults.barWidth = 10;
      this.defaults.autoWidth = false;
      this.defaults.circleR = 3;
      this.defaults.barColor = ["#308BE6", "#8EEC00", "#DDDF0D"];
      this.defaults.sortX = true;
      this.defaults.xTickNumber = 5;
      this.defaults.yTickNumber = 5;

      this.defaults.yBase = 0;

      this.defaults.showLegend = true;
      this.defaults.legendWidth = 100;
      //图例区域的左上顶点坐标x，y，宽，高
      this.defaults.legendArea = [422, 50, 472, 220];
      this.columnSet = [];
      this.legendCluster = [];

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
            "fill-opacity": 0.5
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
    // 排序横轴
    if (conf.sortX) {
      _.each(this.columns, function (group, key) {
        that.columns[key] = _.sortBy(group, map.x);
      });
    }
    this.columnCount = _.keys(this.columns).length;
    // 取数据最多的组作为参照列
    this.refColumn = _.max(_.values(this.columns), function (list) {
      return list.length;
    });
    conf.xAxisData = _.pluck(this.refColumn, map.x);
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
    this.clusterCount = _.max(this.columns, function (column) {
      return column.length;
    }).length;
    var width = diagramArea[2] - diagramArea[0];
    this.clusterWidth = width / this.clusterCount;
    // 如果是自动设置宽度，那么柱子与间隙的比例为2:1
    this.barWidth = conf.autoWidth ? this.clusterWidth / (this.columnCount + 0.5) : conf.barWidth;
    this.gap = (this.clusterWidth - this.columnCount * this.barWidth) / 2;
  };

  /**
   * 绘制坐标
   */
  Column.prototype.drawAxis = function () {
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
      // 修改x轴单位显示在所有Column组的中间位置
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
  Column.prototype.drawDiagram = function () {
    var that = this;
    var conf = this.defaults;
    var axis = this.axisPosition;
    var paper = this.canvas;
    //bars
    var barWidth = this.barWidth;
    var columnSet = this.columnSet = [];
    var values = _.values(this.columns);

    values.forEach(function (column, index) {
      columnSet[index] = paper.set();
      column.forEach(function (row, i) {
        var value = row[that.mapping.value];
        var height = that.value(value);
        var x = that.x(i);
        var rect = paper.rect(x + barWidth * index + that.gap, height, barWidth, axis.down - height).attr({
          "fill": conf.barColor[index],
          "fill-opacity": 1,
          "stroke": "none"
        });
        rect.data('column', index).data('index', i);
        columnSet[index].push(rect);
      });
    });

  };

  Column.prototype.setEvents = function () {
    var that = this;
    var conf = this.defaults;
    var columnSet = this.columnSet;
    var barWidth = this.barWidth;
    var paper = this.canvas;
    //var tagSet = paper.set();
    var axis = this.axisPosition;
    var values = _.values(this.columns);

    var currentClusterIndex = -1;
    var currentColumnIndex = -1;
    var area = this.diagramArea;

    var hideLegend = function (columnIndex) {
      if (typeof that.legendCluster[columnIndex] === 'undefined') {
        return;
      }
      that.legendCluster[columnIndex].bottom.attr({"opacity": 0});
      that.legendCluster[columnIndex].side.forEach(function (d) {
        d.attr({"opacity": 0});
      });
    };

    var createLegend = function (clusterIndex) {
      // hovered cluster
      var legend = {
        bottom: paper.set(),
        side: [] //array of set
      };
      var hovered = columnSet.map(function (set) {
        return set[clusterIndex];
      });
      // 数据残缺的情况
      var actualHovered = hovered.filter(function (elem) {
        return typeof elem !== 'undefined';
      });
      var xPos = _.max(hovered, function (item) {
        return item && item.attrs.x || 0;
      }).attrs.x + barWidth + 8;

      var formatValue = that.getFormatter('formatValue');
      var vals = values.map(function (column) {
        return column[clusterIndex];
      });
      hovered.forEach(function (item, columnIndex) {
        var val = vals[columnIndex];
        var singleSideLegend = paper.set();
        // 数据残缺，不做任何处理
        if (typeof val === 'undefined') {
          legend.side.push(singleSideLegend);
          return;
        }
        var yPos = 0;
        var valueLabel = '' + formatValue(val[that.mapping.value]);
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
        legend.side.push(singleSideLegend.push(rect, path, text));
      });

      xPos = hovered.reduce(function (pre, cur) {
        var x = cur && cur.attrs.x || 0;
        return pre + x;
      }, 0) / actualHovered.length + barWidth / 2;
      var formatLabel = that.getFormatter("formatLabel");
      var xLabel = formatLabel(that.refColumn[clusterIndex][that.mapping.x]);
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
      legend.bottom.push(rect, text, arrow);
      that.legendCluster[clusterIndex] = legend;
    };

    //bars
    this.on("mouseOverBar", function (clusterIndex, columnIndex, oldClusterIndex, oldColumnIndex) {
      if (that.clicked && that.clickedColumnIndex !== columnIndex) {
        return;
      }
      currentColumnIndex = columnIndex;
      currentClusterIndex = clusterIndex;

      var currentSet = columnSet.filter(function (set, columnIndex) {
        return that.clicked ? that.clickedColumnIndex === columnIndex : true;
      });
      // column color change and recover
      currentSet.forEach(function (set) {
        var elem = set[clusterIndex];
        if (elem) {
          elem.attr({
            opacity: 0.6
          });
        }
        if (oldClusterIndex >= 0) {
          var old = set[oldClusterIndex];
          if (old) {
            old.attr({
              opacity: 1
            });
          }
        }
      });

      hideLegend(oldClusterIndex);
      // hovered cluster
      var hovered = currentSet.map(function (set) {
        return set[clusterIndex];
      });

      var y = _.map(hovered, function (item) {
        return item && item.attrs.y || 0;
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

      if (typeof that.legendCluster[clusterIndex] === 'undefined') {
        createLegend(clusterIndex);
      }
      var legend = that.legendCluster[clusterIndex];
      //show legend
      legend.bottom.attr({"opacity": 1});
      var side = legend.side;
      if (that.clicked) {//single column
        // 计算提示显示的位置，尤其是在有数据残缺的情况下
        var offset = 0;
        for (var index = side.length; index > 0; index--) {
          if (side[index - 1].length > 0) {
            break;
          } else {
            offset++;
          }
        }
        side.forEach(function (d, i) {
          if (i === columnIndex) {
            offset = that.columnSet.length - columnIndex - offset - 1;
            d.attr({
              "opacity": 1,
              "transform": "t" + (-that.barWidth * offset) + "," + y[0]
            });
          } else {
            d.attr({"opacity": 0});
          }
        });
      } else {
        side.forEach(function (d, i) {
          d.attr({
            "opacity": 1,
            "transform": "t0," + y[i]
          });
        });
      }
    });

    that.on('mouseOutBar', function () {
      if (currentColumnIndex >= 0 && currentClusterIndex >= 0) {
        var clusterIndex = currentClusterIndex;
        var currentSet = columnSet.filter(function (set, columnIndex) {
          return that.clicked ? that.clickedColumnIndex === columnIndex : true;
        });
        hideLegend(currentClusterIndex);

        currentSet.forEach(function (set) {
          var elem = set[clusterIndex];
          if (elem) {
            elem.attr({
              opacity: 1
            });
          }
        });
        currentColumnIndex = -1;
        currentClusterIndex = -1;
      }
    });

    $(paper.canvas).bind("mousemove", function (event, pageX, pageY) {
      var offset = $(this).parent().offset();
      var x = (event.pageX || pageX) - offset.left,
          y = (event.pageY || pageY) - offset.top;
      var mod;
      var clusterIndex;
      var columnIndex;
      // mouse in?
      if (x > area[0] && x < area[2] && y > area[1] && y < area[3]) {
        mod = (x - area[0]) % that.clusterWidth;
        clusterIndex = Math.floor((x - area[0]) / that.clusterWidth);
        if (mod <= that.gap) {
          // handle mouse on left gap
          columnIndex = 0;
        } else if (mod >= that.clusterWidth - that.gap) {
          // handle mouse on right gap
          columnIndex = that.columnSet.length - 1;
        } else {
          // between gap
          columnIndex = Math.floor((mod - that.gap) / barWidth);
        }
        if (currentClusterIndex !== clusterIndex) {
          that.fire('mouseOverBar', clusterIndex, columnIndex, currentClusterIndex, currentColumnIndex);
        }
      } else {
        that.fire('mouseOutBar');
      }
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
    //legend
    var mouseOverLegend = function () {
      if (legendSet.clicked) {
        return;
      }
      bgSet[this.data('type')].attr({
        "fill-opacity":0.5
      });
      that.fire('legendOver', this.data('type'));
    };

    var mouseOutLegend = function () {
      if (legendSet.clicked) {
        return;
      }
      bgSet[this.data('type')].attr({"fill-opacity": 0});
      that.fire('legendOut', this.data('type'));
    };

    var clickLegend = function () {
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
    this.setEvents();
    if (conf.showLegend) {
      this.drawLegend();
    }
  };
    /*!
     * 导出
     */
  return Column;
});
