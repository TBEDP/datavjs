/*global Raphael, d3 */
/*!
 * Radar的兼容定义
 */;
(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) {
      return this[id];
    });
  }
})('Radar', function (require) {
  var DataV = require('DataV');


  /**
   * 构造函数
   * Options:
   *
   *   - `width` 数字，图片宽度，默认为800，表示图片高800px
   *   - `height` 数字，图片高度，默认为800
   *   - `legend` 布尔值，图例是否显示，默认为 true, 显示；设为false则不显示
   *   - `radius` 数字，雷达图半径，默认是画布高度的40%
   *
   * Examples:
   * create Radar Chart in a dom node with id "chart", width is 500; height is 600px;
   * ```
   * var radar = new Radar("chart", {"width": 500, "height": 600});
   * ```
   * @param {Object} container 表示在html的哪个容器中绘制该组件
   * @param {Object} options 为用户自定义的组件的属性，比如画布大小
   */
  var Radar = DataV.extend(DataV.Chart, {
    type: "Radar",
    initialize: function (container, options) {
      this.node = this.checkContainer(container);
      this.click = 0;
      this.clickedNum = 0;

      /**
       * 标签纬度
       */
      this.dimension.label = {
        type: "string",
        required: false,
        index: 0,
        value: "" // 未指定下标时，使用该值作为默认值
      };
      /**
       * 维度名称
       */
      this.dimension.dimName = {
        type: "string",
        required: true,
        index: 1
      };
      /**
       * 维度值
       */
      this.dimension.dimValue = {
        type: "object",
        required: true,
        index: 2
      };

      // Properties
      //this.source is array of line; key is dimension, value is line's value in that dimension
      this.source = [];
      this.allDimensions = [];
      this.dimensionType = {};
      this.dimensionDomain = {};

      this.axises = [];
      //图的大小设置
      this.defaults.legend = true;
      this.defaults.width = 800;
      this.defaults.height = 800;

      //设置用户指定的属性
      this.setOptions(options);

      this.legendArea = [20, this.defaults.height, 200, 220];
      if (this.defaults.legend) {
        this.defaults.xOffset = this.legendArea[2];
      } else {
        this.defaults.xOffset = 0;
      }

      this.defaults.radius = Math.min((this.defaults.width - this.defaults.xOffset), this.defaults.height) * 0.4;
      //创建画布
      this.createCanvas();
      this.groups = this.canvas.set();
    }
  });

  /**
   * 创建画布
   */
  Radar.prototype.createCanvas = function () {
    this.canvas = new Raphael(this.node, this.defaults.width, this.defaults.height);
    this.node.style.position = "relative";
    this.floatTag = DataV.FloatTag()(this.node);
    this.floatTag.css({
      "visibility": "hidden"
    });
  };

  /**
   * 获取颜色
   * @param {Number} i 元素类别编号
   * @return {String} 返回颜色值
   */
  Radar.prototype.getColor = function (i) {
    var color = DataV.getColor();
    return color[i % color.length][0];
  };


  /**
   * 绘制radar chart
   */
  Radar.prototype.render = function () {
    var conf = this.defaults;
    var that = this;
    this.canvas.clear();
    var groups = this.groups;
    var paper = this.canvas;
    var axises = this.axises;

    var lNum = this.allDimensions.length - 1;
    var axisloopStr = "";
    //console.log(lNum);
    for (var i = 0; i < lNum; ++i) {
      var cos = (conf.radius) * Math.cos(2 * Math.PI * i / lNum) * 0.9;
      var sin = (conf.radius) * Math.sin(2 * Math.PI * i / lNum) * 0.9;
      var axis = paper.path("M,0,0,L," + cos + "," + sin).attr({
        'stroke-opacity': 0.5,
        'stroke-width': 1
      });
      axis.data("x", cos).data("y", sin).transform("T" + (conf.radius + conf.xOffset) + "," + conf.radius);
      axises.push(axis);
      var axisText = paper.text().attr({
        "font-family": "Verdana",
        "font-size": 12,
        "text": this.allDimensions[i + 1],
        'stroke-opacity': 1
      }).transform("T" + (conf.radius + cos + conf.xOffset) + "," + (conf.radius + sin));
      axisText.translate(axisText.getBBox().width * cos / 2 / conf.radius, axisText.getBBox().height * sin / 2 / conf.radius); // + "R" + (360 * i / lNum + 90)
      if (i === 0) {
        axisloopStr += "M";
      } else {
        axisloopStr += "L";
      }
      axisloopStr += axises[i].data('x') + " " + axises[i].data('y');
    }
    axisloopStr += "Z";
    paper.circle(conf.radius + conf.xOffset, conf.radius, conf.radius * 0.3).attr({
      'stroke-opacity': 0.5,
      'stroke-width': 1
    });
    paper.circle(conf.radius + conf.xOffset, conf.radius, conf.radius * 0.6).attr({
      'stroke-opacity': 0.5,
      'stroke-width': 1
    });
    paper.circle(conf.radius + conf.xOffset, conf.radius, conf.radius * 0.9).attr({
      'stroke-opacity': 0.5,
      'stroke-width': 1
    });

    var mouseOver = function () {
      if (!this.data('clicked')) {
        if (that.clickedNum === 0) {
          groups.attr({
            'stroke-opacity': 0.5
          });
        }
        var index = this.data('index');
        this.attr({
          'stroke-width': 5,
          'stroke-opacity': 1
        }).toFront();
        that.underBn[index].attr({
          'opacity': 0.5
        }).show();
      }
    }
    var mouseOut = function () {
      if (!this.data('clicked')) {
        if (that.clickedNum === 0) {
          groups.attr({
            'stroke-opacity': 1
          });
        } else {
          this.attr({
            'stroke-opacity': 0.5
          });
        }
        var index = this.data('index');
        this.attr({
          'stroke-width': 2
        });
        that.underBn[index].hide();
      }
    }
    var mouseClick = function () {
      var index = this.data('index');
      if (!this.data('clicked')) {
        if (that.clickedNum === 0) {
          groups.attr({
            'stroke-opacity': 0.5
          });
        }
        this.attr({
          'fill': that.getColor(index),
          'stroke-opacity': 1,
          'fill-opacity': 0.1
        }).toFront();
        that.underBn[index].attr({
          'opacity': 1
        }).show();
        this.data('clicked', true);
        that.clickedNum++;
      } else {
        that.clickedNum--;
        if (that.clickedNum === 0) {
          groups.attr({
            'stroke-opacity': 1
          });
        } else {
          this.attr({
            'stroke-opacity': 0.5
          });
        }
        this.attr({
          'fill': "",
          'fill-opacity': 0
        });
        that.underBn[index].hide();
        this.data('clicked', false);
      }
    }

    var source = this.source;
    var allDimensions = this.allDimensions;
    var dimensionDomain = this.dimensionDomain;

    source.forEach(function (d, i) {
      var pathStr = "";
      allDimensions.forEach(function (prop, j) {
        if (prop !== "name") {
          var rate = 0.1 + 0.8 * (d[prop] - dimensionDomain[prop][0]) / (dimensionDomain[prop][1] - dimensionDomain[prop][0]);
          //console.log(source[i][allDimensions[j]]+","+dimensionDomain[allDimensions[j]][0]+","+dimensionDomain[allDimensions[j]][1]);
          if (j != 1) {
            pathStr += ",L";
          } else {
            pathStr += "M";
          }
          pathStr += rate * axises[j - 1].data('x') + " " + rate * axises[j - 1].data('y');
        }
      });
      pathStr += "Z";
      var loop = paper.path(pathStr).transform("T" + (conf.radius + conf.xOffset) + "," + conf.radius).attr({
        'stroke': that.getColor(i),
        'stroke-width': 2,
        'fill-opacity': 0
      }).data('name', source[i].name).data('index', i).mouseover(mouseOver).mouseout(mouseOut).click(mouseClick);
      groups.push(loop);
    });

    if (conf.legend) {
      this.legend();
    }
  };
  /**
   * get dimension types
   * @return {Object}  {key: dimension name(column name); value: dimenType("ordinal" or "quantitativ")}
   */
  Radar.prototype.getDimensionTypes = function () {
    return $.extend({}, this.dimensionType);
  };

  /**
   * get dimension domain
   * @return {Object}  {key: dimension name(column name); value: extent array;}
   */
  Radar.prototype.getDimensionDomains = function () {
    return $.extend({}, this.dimensionDomain);
  };

  /*!
   * get default ordinal dimension domain
   * @param {array} a: array of source ordinal column values
   * @return {array} unique string array
   */
  Radar.prototype._setOrdinalDomain = function (a) {
    var uniq = [];
    var index = {};
    var i = -1,
      n = a.length,
      ai;
    while (++i < n) {
      if (typeof index[ai = a[i]] === 'undefined') {
        index[ai] = uniq.push(ai) - 1;
      }
    }
    uniq.itemIndex = index;
    return uniq;
  };
  /*!
   * set default dimension domain
   * @param {string} dimen: dimension string
   */
  Radar.prototype._setDefaultDimensionDomain = function (dimen) {
    var conf = this.defaults;
    if (this.dimensionType[dimen] === "quantitative") {
      this.dimensionDomain[dimen] = d3.extent(this.source, function (p) {
        return +p[dimen]
      });
    } else {
      this.dimensionDomain[dimen] = this._setOrdinalDomain(this.source.map(function (p) {
        return p[dimen]
      }));
    }
  };

  /**
   * 对原始数据进行处理
   * @param {Array} table 将要被绘制成磊达图的二维表数据
   */
  Radar.prototype.setSource = function (table, map) {
    var map = this.map(map);
    var that = this;
    //source is 2-dimension array
    var conf = this.defaults;
    this.allDimensions = [];
    this.allDimensions[0] = "name";
    that.dimensionType.name = "ordinal";

    var source = this.source;

    table.forEach(function (row, i) {
      if (that.allDimensions.indexOf(row[map.dimName]) === -1) {
        that.allDimensions.push(row[map.dimName]);
        that.dimensionType[row[map.dimName]] = "quantitative";
      }
      var j = 0;
      for (; j < source.length; j++) {
        if (source[j].name === row[map.label]) {
          break;
        }
      }
      if (j >= source.length) {
        var obj = {};
        obj.name = row[map.label];
        source.push(obj);
      }
      var d = row[map.dimValue];
      if (DataV.isNumeric(row[map.dimValue])) {
        source[j][row[map.dimName]] = parseFloat(row[map.dimValue]);
      } else {
        source[j][row[map.dimName]] = row[map.dimValue];
        that.dimensionType[that.allDimensions[i]] = "ordinal";
      }
    });


    /*

    this.source = DataV.collectionify(table);


    //judge dimesions type auto
    //if all number, quantitative else ordinal
    this.dimensionType = {};
    for (var i = 0, l = this.allDimensions.length; i < l; i++) {
      var type = "quantitative";
      for (var j = 1, ll = table.length; j < ll; j++) {
        var d = table[j][i];
        if (d && (!DataV.isNumeric(d))) {
          type = "ordinal";
          break;
        }
      }
      this.dimensionType[this.allDimensions[i]] = type;
    }
    */
    this.setDimensionDomain();

  };

  /**
   * set dimension domain
   * Examples:
   * ```
   *  parallel.setDimensionDomain({
   *    "cylinders": [4, 8], //quantitative
   *    "year": ["75", "79", "80"] //ordinal
   *  });
   * ```
   * @param {Object} dimenDomain {key: dimension name(column name); value: domain array (quantitative domain is digit array whose length is 2, ordinal domain is string array whose length could be larger than 2;}
   */
  Radar.prototype.setDimensionDomain = function (dimenDomain) {
    //set default dimensionDomain, extent for quantitative type, item array for ordinal type
    var conf = this.defaults;
    var dimen, i, l, domain;

    if (arguments.length === 0) {
      for (i = 0, l = this.allDimensions.length; i < l; i++) {
        dimen = this.allDimensions[i];
        this._setDefaultDimensionDomain(dimen);
      }
    } else {
      for (prop in dimenDomain) {
        if (dimenDomain.hasOwnProperty(prop) && this.dimensionType[prop]) {
          domain = dimenDomain[prop];
          if (!(domain instanceof Array)) {
            throw new Error("domain should be an array");
          } else {
            if (this.dimensionType[prop] === "quantitative" && domain.length !== 2) {
              throw new Error("quantitative's domain should be an array with two items, for example: [num1, num2]");
            }
            if (this.dimensionType[prop] === "quantitative") {
              this.dimensionDomain[prop] = domain;
            } else if (this.dimensionType[prop] === "ordinal") {
              this.dimensionDomain[prop] = this._setOrdinalDomain(domain);
            }
          }
        }
      }
    }
  };

  /**
   * 绘制图例
   */
  Radar.prototype.legend = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    var legendArea = this.legendArea;
    this.rectBn = paper.set();
    var rectBn = this.rectBn;
    this.underBn = [];
    var underBn = this.underBn;
    var groups = this.groups;

    for (var i = 0, l = this.groups.length; i < l; i++) {
      //底框
      underBn.push(paper.rect(legendArea[0] + 10, legendArea[1] - 17 - (20 + 3) * i, 190, 20).attr({
        "fill": "#ebebeb",
        "stroke": "none"
      }).hide());
      //色框
      paper.rect(legendArea[0] + 10 + 3, legendArea[1] - 6 - (20 + 3) * i - 6, 16, 8).attr({
        "fill": this.getColor(i),
        "stroke": "none"
      });
      //文字
      paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] - 10 - (20 + 3) * i, this.groups[i].data('name')).attr({
        "fill": "black",
        "fill-opacity": 1,
        "font-family": "Verdana",
        "font-size": 12,
        "text-anchor": "start"
      });
      //选框
      rectBn.push(paper.rect(legendArea[0] + 10, legendArea[1] - 16 - (20 + 3) * i, 180, 20).attr({
        "fill": "white",
        "fill-opacity": 0,
        "stroke": "none"
      }));
    }
    rectBn.forEach(function (d, i) {
      // TODO 这里的事件建议采用事件委托
      d.mouseover(function () {
        if (!groups[i].data("clicked")) {

          if (that.clickedNum === 0) {
            groups.attr({
              'stroke-opacity': 0.5
            });
          }
          groups[i].attr({
            'stroke-width': 5,
            'stroke-opacity': 1
          });
          underBn[i].attr('opacity', 0.5);
          underBn[i].show();
        }
      }).mouseout(function () {
        if (!groups[i].data("clicked")) {

          if (that.clickedNum === 0) {
            groups.attr({
              'stroke-opacity': 1
            });
          } else {
            groups[i].attr({
              'stroke-opacity': 0.5
            });
          }
          groups[i].attr({
            'stroke-width': 2
          });
          underBn[i].hide();
        }
      });
      d.click(function () {
        if (groups[i].data('clicked')) {
          that.clickedNum--;
          if (that.clickedNum === 0) {
            groups.attr({
              'stroke-opacity': 1
            });
          } else {
            groups[i].attr({
              'stroke-opacity': 0.5
            });
          }
          groups[i].data('clicked', false).attr({
            'stroke-width': 2,
            'fill': "",
            'fill-opacity': 0
          });
          underBn[i].hide();
        } else {
          if (that.clickedNum === 0) {
            groups.attr({
              'stroke-opacity': 0.5
            });
          }
          groups[i].data('clicked', true).attr({
            'stroke-width': 5,
            'stroke-opacity': 1,
            'fill': that.getColor(i),
            'fill-opacity': 0.1
          }).toFront();
          underBn[i].attr({
            'opacity': 1
          }).show();
          that.clickedNum++;
        }

      });
    });
  };

  return Radar;
});