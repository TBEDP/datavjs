/*global Raphael, d3, $, _ */
/*!
 * Pie的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) {
      return this[id];
    });
  }
})('Pie', function (require) {
  var DataV = require('DataV');

  /**
   * 构造函数
   * Options:
   * - `width` 图片宽度，默认为800，表示图片高800px
   * - `height` 图片高度，默认为800
   * - `showLegend` 图例是否显示，默认为 true, 显示；设为false则不显示
   * - `showText` 是否显示文字，默认为true
   * - `ms` 动画持续时间，默认300
   * - `easing` 动画类型，默认“bounce”。详见rapheal相关文档，可以使用“linear”，“easeIn”，“easeOut”，“easeInOut”，“backIn”，“backOut”，“elastic”，“bounce”
   *
   * Examples:
   * create Radar Chart in a dom node with id "chart", width is 500; height is 600px;
   * ```
   * var radar = new Radar("chart", {"width": 500, "height": 600});
   * ```
   * @param {Object} container 表示在html的哪个容器中绘制该组件
   * @param {Object} options 为用户自定义的组件的属性，比如画布大小
   */
  var Pie = DataV.extend(DataV.Chart, {
    type: "Pie",
    initialize: function (node, options) {
      this.node = this.checkContainer(node);
      this.sum = 0;
      this.groupNames = []; //数组：记录每个group的名字
      this.groupValue = [];
      this.groups = [];
      this.click = 0;

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
       * 值纬度
       */
      this.dimension.value = {
        type: "number",
        required: true,
        index: 1
      };

      //图的大小设置
      this.defaults.showLegend = true;
      this.defaults.showText = true;
      this.defaults.width = 800;
      this.defaults.height = 800;
      this.defaults.ms = 300;
      this.defaults.easing = "bounce";
      this.defaults.tipStyle = {
        "textAlign": "center",
        "margin": "auto",
        "color": "#ffffff"
      };

      this.formatter.tipFormat = function (name, value, sum) {
        return name + ": " + Math.round(value) + " " + (value * 100 / sum).toFixed(2) + "%";
      };

      //设置用户指定的属性
      this.setOptions(options);

      this.legendArea = [20, (this.defaults.height - 20 - 220), 200, 220];
      if (this.defaults.showLegend) {
        this.xOffset = this.legendArea[2];
      } else {
        this.xOffset = 0;
      }

      this.defaults.radius = Math.min((this.defaults.width - this.xOffset), this.defaults.height) * 0.3;
      this.defaults.protrude = this.defaults.radius * 0.1;
      //创建画布
      this.createCanvas();
    }
  });

  /**
   * 创建画布
   */
  Pie.prototype.createCanvas = function () {
    this.canvas = new Raphael(this.node, this.defaults.width, this.defaults.height);
    var canvasStyle = this.node.style;
    canvasStyle.position = "relative";
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
  Pie.prototype.getColor = function (i) {
    var color = DataV.getColor();
    return color[i % color.length][0];
  };

  /**
   * 绘制饼图
   */
  Pie.prototype.render = function () {
    this.layout();
    var conf = this.defaults;
    var floatTag = this.floatTag;
    var that = this;
    var groups = this.groups;

    //由内外半径、起始角度计算路径字符串
    var pathCalc = d3.svg.arc()
    .innerRadius(conf.radius)
    .outerRadius(conf.radius * 0.2)
    .startAngle(function (d) {
      return d.startAngle;
    }).endAngle(function (d) {
      return d.endAngle;
    });
    var donutEle;
    //获取每个环形的字符串表示
    var spline;
    var tips;
    that.donutGroups = that.canvas.set();

    $(this.node).append(this.floatTag);

    //添加透明效果
    var mouseOver = function () {
      floatTag.html(this.data('text')).css(conf.tipStyle);
      floatTag.css({
        "visibility": "visible"
      });
      var index = this.data("donutIndex");
      if (!this.data('click')) {
        that.underBn[index].attr('opacity', 0.5).show();
      }
      if (that.click === 0) {
        that.donutGroups.forEach(function (d) {
          if (index !== d.data("donutIndex")) {
            d.attr('fill-opacity', 0.5);
          }
        });
      }
      this.attr('fill-opacity', 1);
    };

    var mouseOut = function () {
      floatTag.css({
        "visibility": "hidden"
      });
      var index = this.data("donutIndex");
      //fade(this.data("donutIndex"), 0.6);
      if (!this.data('click')) {
        that.underBn[index].hide();
      }
      if (that.click === 0) {
        that.donutGroups.forEach(function (d) {
          d.attr('fill-opacity', 1);
        });
      } else if (!this.data('click')) {
        this.attr('fill-opacity', 0.5);
      }
    };

    var mouseClick = function () {
      var index = this.data("donutIndex");
      var fan = groups[index];
      var flag = !this.data('click');
      this.data('click', flag);
      var ro = (fan.startAngle + fan.endAngle) * 90 / Math.PI;
      var angle = 0.5 * ((fan.startAngle + fan.endAngle) - Math.PI);
      var center = {
        x: ((conf.width - that.xOffset) / 2 + that.xOffset),
        y: conf.height / 2
      };
      var namePos = {
        x: conf.protrude * Math.cos(angle),
        y: conf.protrude * Math.sin(angle)
      };
      var radius = {
        x: conf.radius * Math.cos(angle) + namePos.x,
        y: conf.radius * Math.sin(angle) + namePos.y
      };
      var offSetPos = {
        x: this.data('nameTag').getBBox().width / 2 * Math.cos(angle),
        y: this.data('nameTag').getBBox().height / 2 * Math.sin(angle)
      };
      if (flag) {
        if (that.click === 0) {
          that.donutGroups.forEach(function (d) {
            if (!d.data('click')) {
              d.attr('fill-opacity', 0.5);
            }
          });
        }
        that.underBn[index].attr('opacity', 1).show();
        this.attr('fill-opacity', 1);
        if (conf.showText) {
          this.data('nameTag').stop().animate({
            transform: "t" + (center.x + radius.x + 2 * namePos.x + offSetPos.x) + " " + (center.y + radius.y + 2 * namePos.y + offSetPos.y)
          }, conf.ms, conf.easing);

          this.data('line').stop().animate({
            transform: "t" + (center.x + radius.x + namePos.x) + " " + (center.y + radius.y + namePos.y) + "r" + ro
          }, conf.ms, conf.easing);

          if (!this.data('hiddenTag')) {
            this.data('nameTag').show();
            this.data('line').show();
          }
        }
        this.stop().animate({
          transform: "t" + (center.x + namePos.x) + " " + (center.y + namePos.y)
        }, conf.ms, conf.easing);
        //this.translate(nameX, nameY);
        that.click += 1;
      } else {
        if (conf.showText) {
          this.data('nameTag').stop().animate({
            transform: "t" + (center.x + radius.x + namePos.x + offSetPos.x) + " " + (center.y + radius.y + namePos.y + offSetPos.y)
          }, conf.ms, conf.easing);
          this.data('line').stop().animate({
            transform: "t" + (center.x + radius.x) + " " + (center.y + radius.y) + "r" + ro
          }, conf.ms, conf.easing);

          if (!this.data('hiddenTag')) {
            this.data('nameTag').hide();
            this.data('line').hide();
          }
        }
        this.stop().animate({
          transform: "t" + center.x + " " + center.y
        }, conf.ms, conf.easing);
        //this.translate(-nameX, - nameY);
        that.click -= 1;
        if (that.click > 0) {
          this.attr('fill-opacity', 0.5);
        }
      }
    };

    //画圆弧
    var i;
    var nameStr;
    var nameX, nameY;
    var ro, angle;
    for (i = 0; i <= groups.length - 1; i++) {
      var fan = groups[i];
      //画外圈的pie图
      //计算每个group的path
      spline = pathCalc(fan);
      var tipFormat = this.getFormatter("tipFormat");
      tips = tipFormat.call(this, fan.nameTag, fan.value, this.sum);
      donutEle = that.canvas.path(spline)
      .translate((conf.width - this.xOffset) / 2 + this.xOffset, conf.height / 2)
      .data("donutIndex", i)
      .data('text', tips)
      .data('click', false)
      .attr({
        "path": spline,
        "fill": that.getColor(i),
        "stroke": '#ffffff'
      })
      .mouseover(mouseOver)
      .mouseout(mouseOut)
      .click(mouseClick);

      //每个donut上显示名称
      ro = (fan.startAngle + fan.endAngle) * 90 / Math.PI;
      angle = 0.5 * ((fan.startAngle + fan.endAngle) - Math.PI);

      if (conf.showText) {
        nameX = (conf.radius + 2 * conf.protrude) * Math.cos(angle);
        nameY = (conf.radius + 2 * conf.protrude) * Math.sin(angle);
        nameStr = "T" + ((conf.width - that.xOffset) / 2 + that.xOffset) + "," + conf.height / 2 + "R" + ro + "T" + nameX + "," + nameY;

        var line = that.canvas.path("M,0,-" + conf.protrude + "L0," + conf.protrude).transform(nameStr).translate(0, conf.protrude);
        var nameTag = that.canvas.text().attr({
          "font": "18px Verdana",
          "text": fan.nameTag
        })
        var offSetPos = {
          x: nameTag.getBBox().width / 2 * Math.cos(angle),
          y: nameTag.getBBox().height / 2 * Math.sin(angle)
        };
        nameTag.translate(((conf.width - that.xOffset) / 2 + that.xOffset) + nameX + offSetPos.x, conf.height / 2 + nameY + offSetPos.y);
        donutEle.data('hiddenTag', true);
        if (i > 0) {
          var fanPrev = groups[i - 1];
          var angleBet = angle - 0.5 * ((fanPrev.startAngle + fanPrev.endAngle) - Math.PI);
          if (that.donutGroups[i - 1].data('hiddenTag')) {
            if (Math.tan(angleBet / 2) * conf.radius * 4 < (that.donutGroups[i - 1].data('nameTag').getBBox().width + nameTag.getBBox().width)) {
              donutEle.data('hiddenTag', false);
              nameTag.hide();
              line.hide();
            }
          }
        }
        donutEle.data('nameTag', nameTag).data('line', line);
      }


      that.donutGroups.push(donutEle);
    }

    if (conf.showLegend) {
      this.drawLegend();
    }
  };

  /**
   * 绘制图例
   */
  Pie.prototype.drawLegend = function () {
    var paper = this.canvas;
    var legendArea = this.legendArea;
    this.rectBn = paper.set();
    var rectBn = this.rectBn;
    this.underBn = [];
    var underBn = this.underBn;
    for (var i = 0, l = this.groups.length; i < l; i++) {
      //底框
      underBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
        "fill": "#ebebeb",
        "stroke": "none"
      }).hide());
      //色框
      paper.rect(legendArea[0] + 10 + 3, legendArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
        "fill": this.getColor(i),
        "stroke": "none"
      });
      //文字
      paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] + 10 + (20 + 3) * i + 10, this.groups[i].nameTag).attr({
        "fill": "black",
        "fill-opacity": 1,
        "font-family": "Verdana",
        "font-size": 12,
        "text-anchor": "start"
      });
      //选框
      rectBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
        "fill": "white",
        "fill-opacity": 0,
        "stroke": "none"
        //"r": 3
      }));
    }
    this.initLegendEvents();
  };

  Pie.prototype.initLegendEvents = function () {
    var rectBn = this.rectBn;
    var underBn = this.underBn;
    var groups = this.groups;
    var that = this;
    var conf = this.defaults;
    rectBn.forEach(function (d, i) {
      var fan = groups[i];
      d.mouseover(function () {
        if (!that.donutGroups[i].data("click")) {
          underBn[i].attr('opacity', 0.5).show();
        }
      }).mouseout(function () {
        if (!that.donutGroups[i].data("click")) {
          underBn[i].hide();
        }
      }).click(function () {
        var ro = (fan.startAngle + fan.endAngle) * 90 / Math.PI;
        var angle = 0.5 * ((fan.startAngle + fan.endAngle) - Math.PI);
        var center = {
          x: ((conf.width - that.xOffset) / 2 + that.xOffset),
          y: conf.height / 2
        };
        var namePos = {
          x: conf.protrude * Math.cos(angle),
          y: conf.protrude * Math.sin(angle)
        };
        var radius = {
          x: conf.radius * Math.cos(angle) + namePos.x,
          y: conf.radius * Math.sin(angle) + namePos.y
        };
        var donut = that.donutGroups[i];
        var offSetPos = {
          x: donut.data('nameTag').getBBox().width / 2 * Math.cos(angle),
          y: donut.data('nameTag').getBBox().height / 2 * Math.sin(angle)
        };
        if (!donut.data("click")) {
          if (that.click === 0) {
            that.donutGroups.forEach(function (d) {
              if (!d.data('click')) {
                d.attr('fill-opacity', 0.5);
              }
            });
          }
          underBn[i].attr('opacity', 1).show();
          donut.data("click", true).attr('fill-opacity', 1);
          if (conf.showText) {
            donut.data('nameTag').stop().animate({
              transform: "t" + (center.x + radius.x + 2 * namePos.x + offSetPos.x) + " " + (center.y + radius.y + 2 * namePos.y + offSetPos.y)
            }, conf.ms, conf.easing);
            donut.data('line').stop().animate({
              transform: "t" + (center.x + radius.x + namePos.x) + " " + (center.y + radius.y + namePos.y) + "r" + ro
            }, conf.ms, conf.easing);

            if (!donut.data('hiddenTag')) {
              donut.data('nameTag').show();
              donut.data('line').show();
            }
          }
          donut.stop().animate({
            transform: "t" + (center.x + namePos.x) + " " + (center.y + namePos.y)
          }, conf.ms, conf.easing);
          that.click += 1;
        } else {
          if (conf.showText) {
            donut.data('nameTag').stop().animate({
              transform: "t" + (center.x + radius.x + namePos.x + offSetPos.x) + " " + (center.y + radius.y + namePos.y + offSetPos.y)
            }, conf.ms, conf.easing);
            donut.data('line').stop().animate({
              transform: "t" + (center.x + radius.x) + " " + (center.y + radius.y) + "r" + ro
            }, conf.ms, conf.easing);

            if (!donut.data('hiddenTag')) {
              donut.data('nameTag').hide();
              donut.data('line').hide();
            }
          }
          donut.stop().animate({
            transform: "t" + center.x + " " + center.y
          }, conf.ms, conf.easing);
          that.click -= 1;
          if (that.click > 0) {
            donut.attr('fill-opacity', 0.5);
          } else {
            that.donutGroups.forEach(function (d) {
              d.attr('fill-opacity', 1);
            });
          }
          underBn[i].hide();
          donut.data("click", false);
        }
      });
    });
  };

  /**
   * 对原始数据进行处理
   * @param {Array} table 将要被绘制成饼图的二维表数据
   */
  Pie.prototype.setSource = function (table, map) {
    map = this.map(map);
    this.groupNames = _.pluck(table, map.label);
    this.groupValue = _.pluck(table, map.value).map(function (item) {
      return parseFloat(item);
    });
  };

  /**
   * 创建pie布局
   */
  Pie.prototype.layout = function () {
    var that = this;

    that.canvas.clear();

    this.sum = DataV.sum(this.groupValue);
    var sum = this.sum;
    this.groups = this.groupValue.map(function (item, index) {
      var ret = {
        index: index,
        value: item,
        nameTag: that.groupNames[index]
      };
      return ret;
    });
    this.groups = _.sortBy(that.groups, function (d) {
      return -d.value;
    });
    var acc = 0;
    this.groups.forEach(function (d) {
      d.startAngle = 2 * acc * Math.PI / sum;
      acc += d.value;
      d.endAngle = 2 * acc * Math.PI / sum;
    });
  };

  return Pie;
});