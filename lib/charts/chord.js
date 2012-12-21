/*global Raphael, d3, $, define */
/*!
 * Chord的兼容性定义
 */;
(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) {
      return this[id];
    });
  }
})('Chord', function (require) {
  var DataV = require('DataV');

  /**
   * 构造函数
   * @param {Object} node 表示在html的哪个容器中绘制该组件
   * @param {Object} options 为用户自定义的组件的属性，比如画布大小
   */
  var Chord = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Chord";
      this.node = this.checkContainer(node);
      this.matrix = [];
      this.groupNames = []; //数组：记录每个group的名字

      //图的大小设置
      this.defaults.legend = true;
      this.defaults.width = 800;
      this.defaults.height = 800;

      this.dimension.from = {
        type: "string",
        required: true,
        index: 0,
      };

      this.dimension.to = {
        type: "string",
        required: true,
        index: 1,
      };
      /**
       * 值纬度
       */
      this.dimension.value = {
        type: "number",
        required: true,
        index: 2
      };


      //设置用户指定的属性
      this.setOptions(options);

      this.legendArea = [20, (this.defaults.height - 20 - 220), 200, 220];
      if (this.defaults.legend) {
        this.xOffset = this.legendArea[2];
      } else {
        this.xOffset = 0;
      }

      this.defaults.innerRadius = Math.min((this.defaults.width - this.xOffset), this.defaults.height) * 0.38;
      this.defaults.outerRadius = this.defaults.innerRadius * 1.10;
      //创建画布
      this.createCanvas();
    }
  });

  /**
   * 创建画布
   */
  Chord.prototype.createCanvas = function () {
    this.canvas = new Raphael(this.node, this.defaults.width, this.defaults.height);
    canvasStyle = this.node.style;
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
  Chord.prototype.getColor = function (i) {
    var color = DataV.getColor();
    return color[i % color.length][0];
  };

  /**
   * 绘制弦图
   */
  Chord.prototype.render = function () {
    this.layout();
    if (this.defaults.legend) {
      this.drawLegend();
    }
  };

  /**
   * 绘制图例
   */
  Chord.prototype.drawLegend = function () {
    var that = this;
    var paper = this.canvas;
    var legendArea = this.legendArea;
    var rectBn = paper.set();
    this.underBn = [];
    var underBn = this.underBn;
    for (i = 0; i <= this.groupNum; i++) {
      //底框
      underBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
        "fill": "#ebebeb",
        "stroke": "none"
        //"r": 3
      }).hide());
      //色框
      paper.rect(legendArea[0] + 10 + 3, legendArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
        "fill": this.getColor(i),
        "stroke": "none"
      });
      //文字
      paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] + 10 + (20 + 3) * i + 10, this.groupNames[i]).attr({
        "fill": "black",
        "fill-opacity": 1,
        "font-family": "Verdana",
        "font-size": 12
      }).attr({
        "text-anchor": "start"
      });
      //选框
      rectBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
        "fill": "white",
        "fill-opacity": 0,
        "stroke": "none"
        //"r": 3
      })).data("clicked", 0);
    }
    rectBn.forEach(function (d, i) {
      d.mouseover(function () {
        if (d.data("clicked") === 0) {
          underBn[i].attr('opacity', 0.5);
          underBn[i].show();
        }
      }).mouseout(function () {
        if (d.data("clicked") === 0) {
          underBn[i].hide();
        }
      });
      d.click(function () {
        for (j = 0; j < underBn.length; j++) {
          if (j === i) {
            underBn[j].show();
          } else {
            underBn[j].hide();
          }
        }
        rectBn.forEach(function (eachBn) {
          if (eachBn !== d) {
            eachBn.data("clicked", 0);
          }
        });
        if (d.data("clicked") === 0) {
          underBn[i].attr('opacity', 1);
          underBn[i].show();
          that.chordGroups.forEach(function (d) {
            if (d.data('source') !== i && d.data('target') !== i) {
              d.attr({
                'fill-opacity': 0.1
              });
            } else {
              d.attr({
                'fill-opacity': 0.6
              });
            }
          });

          d.data("clicked", 1);
        } else if (d.data("clicked") === 1) {
          underBn[i].hide();
          d.data("clicked", 0);
          that.chordGroups.forEach(function (d) {
            d.attr({
              'fill-opacity': 0.6
            });
          });
        }
      });
    });
  };

  /**
   *对原始数据进行处理
   * @param {Array} table 将要被绘制成饼图的二维表数据
   */
  Chord.prototype.setSource = function (table, map) {
    map = this.map(map);
    var that = this;

    var index = {};
    var groupNum = 0;
    table = table.slice(1); // 从第一行开始，第0行舍去

    table.forEach(function (d) {
      var from = d[map.from];
      if (typeof index[from] === 'undefined') {
        index[from] = groupNum++;
        that.groupNames.push(from);
      }
    });

    table.forEach(function (d) {
      var to = d[map.to];
      if (typeof index[to] === 'undefined') {
        index[to] = groupNum++;
        that.groupNames.push(to);
      }
    });

    this.groupNum = groupNum;

    for (var i = 0; i < groupNum; i++) {
      this.matrix[i] = [];
      for (var j = 0; j < groupNum; j++) {
        this.matrix[i][j] = 0;
      };
    };

    table.forEach(function (d) {
      that.matrix[index[d[map.from]]][index[d[map.to]]] += Number(d[map.value]);
    });
  };

  /**
   *创建chord布局
   */
  Chord.prototype.layout = function () {
    var floatTag = this.floatTag;
    var that = this;

    that.canvas.clear();
    /*var see = [
            [11975, 5871, 8916, 2868],
            [1951, 10048, 2060, 6171],
            [8010, 16145, 8090, 8045],
            [1013, 990, 940, 6907]
        ];*/

    var chordLayout = d3.layout.chord().padding(0.05) //chord segments之间的padding间隔
    .sortSubgroups(d3.descending) //chord segments细分后的排序规则
    .matrix(that.matrix);

    /*var fillColor = d3.scale.ordinal()
            .domain(d3.range(4))
            .range(["#000000", "#FFDD89", "#957244", "#F26223"]);*/

    //groups数组：获取每个组的起始角度、数值、索引等属性
    var groups = chordLayout.groups();

    //由内外半径、起始角度计算路径字符串
    var pathCalc = d3.svg.arc().innerRadius(that.defaults.innerRadius).outerRadius(that.defaults.outerRadius).startAngle(function (d) {
      return d.startAngle;
    }).endAngle(function (d) {
      return d.endAngle;
    });

    var chords = chordLayout.chords();

    //计算弦的路径曲线
    var chordCalc = d3.svg.chord().radius(that.defaults.innerRadius);

    //Raphael: Paper.path()
    var donutEle;
    //获取每个环形的字符串表示
    var spline;
    //表示每条弦的element
    var chordEle;
    //每条弦的字符串表示
    var belt;

    var num; //每个group分割小格数
    var unitAngle; //每个group所占的角度
    var angle;
    var radian;
    var tickLine;
    var tickStr; //每个tick的路径
    var xTrans, yTrans;
    var aX, aY, bX, bY; //每个tick起始端点的坐标
    var anchor;
    var rotateStr;
    var wordStr;
    var word;
    var textEl;
    var wXTrans, wYTrans;
    var tips;
    var minValue = 1000;
    that.chordGroups = that.canvas.set();
    that.donutGroups = that.canvas.set();

    $(this.node).append(this.floatTag);

    //计算某条弦被赋值为target或source的颜色
    var colorCalc = function (index) {
      var i = chords[index].target.value > chords[index].source.value ? chords[index].target.index : chords[index].source.index;
      return i;
    };

    //添加透明效果

    var mouseOverDonut = function () {
      floatTag.html('<div style = "text-align: center;margin:auto;color:'
      //+ jqNode.color
      +
        "#ffffff" + '">' + this.data('text') + '</div>');
      floatTag.css({
        "visibility": "visible"
      });
      that.underBn.forEach(function (d) {
        d.hide();
      });
      index = this.data("donutIndex");
      that.chordGroups.forEach(function (d) {
        if (d.data('source') !== index && d.data('target') !== index) {
          d.attr({
            'fill-opacity': 0.1
          });
        } else {
          d.attr({
            'fill-opacity': 0.6
          });
        }
      });
      //fade(this.data("donutIndex"), 0.2);
      that.underBn[index].attr('opacity', 0.5).show();

    };

    var mouseOutDonut = function () {
      floatTag.css({
        "visibility": "hidden"
      });
      index = this.data("donutIndex");
      that.chordGroups.forEach(function (d) {
        if (d.data('source') !== index && d.data('target') !== index) {
          d.attr({
            'fill-opacity': 0.6
          });
        }
      });
      //fade(this.data("donutIndex"), 0.6);
      that.underBn[index].hide();
    };

    var mouseoverChord = function () {
      floatTag.html('<div style="text-align: center;margin:auto;color:#ffffff">' + this.data('text') + '</div>');
      floatTag.css({
        "visibility": "visible"
      });
      that.underBn.forEach(function (d) {
        d.hide();
      });
      that.chordGroups.forEach(function (d) {
        d.attr("fill-opacity", 0.1);
      });
      if (navigator.appName !== "Microsoft Internet Explorer") {
        this.toFront(); //把当前弦移到画布最上层
      }
      this.attr("fill-opacity", 0.7);
      that.underBn[this.data('source')].attr('opacity', 0.5).show();
    };

    var mouseoutChord = function () {
      floatTag.css({
        "visibility": "hidden"
      });
      //alert("***");
      that.chordGroups.forEach(function (d) {
        d.attr("fill-opacity", 0.6);
      });
      //this.attr("fill-opacity", 0.6);
      that.underBn[this.data('source')].hide();
    };

    //画弦*********************************************************
    var t;
    for (t = 0; t <= chords.length - 1; t++) {
      //alert(chords.length);
      belt = chordCalc(chords[t]);
      //hover到弦上时的效果
      tips = that.groupNames[chords[t].source.index] + " to " + that.groupNames[chords[t].target.index] + ": " + that.matrix[chords[t].source.index][chords[t].target.index] + "," + that.groupNames[chords[t].target.index] + " to " + that.groupNames[chords[t].source.index] + ": " + that.matrix[chords[t].target.index][chords[t].source.index];

      chordEle = that.canvas.path(belt).
      translate((that.defaults.width - this.xOffset) / 2 + this.xOffset, that.defaults.height / 2).attr({
        "path": belt,
        "fill": that.getColor(colorCalc(t)),
        "fill-opacity": 0.6,
        "stroke": "#d6d6d6",
        "stroke-opacity": 0.1
      }).hover(mouseoverChord, mouseoutChord).data("source", chords[t].source.index).data("target", chords[t].target.index);
      //.attr("fill", fillColor(chords[t].target.index))
      chordEle.data('text', tips);
      that.chordGroups.push(chordEle);
    }



    //画圆弧*********************************************************
    var i, r;
    var donutName;
    var nameStr;
    var nameX, nameY;
    var ro, a;
    var sum = 0;
    for (r = 0; r <= groups.length - 1; r++) {
      sum += groups[r].value;
    }

    for (i = 0; i <= groups.length - 1; i++) {
      //画外圈的pie图**************************************
      //计算每个group的path
      spline = pathCalc(groups[i]);
      tips = that.groupNames[i] + ": " + Math.round(groups[i].value) + " " + (groups[i].value * 100 / sum).toFixed(2) + "%";

      donutEle = that.canvas.path(spline).translate((that.defaults.width - this.xOffset) / 2 + this.xOffset, that.defaults.height / 2).data("donutIndex", i).attr({
        "path": spline,
        "fill": that.getColor(i),
        "stroke": that.getColor(i)
      }).mouseover(mouseOverDonut).mouseout(mouseOutDonut);
      donutEle.data('text', tips);
      that.donutGroups.push(donutEle);

      //每个donut上显示名称
      ro = groups[i].startAngle * 180 / Math.PI - 86 + 90;
      a = (groups[i].startAngle * 180 / Math.PI - 86) * Math.PI / 180;
      nameX = ((that.defaults.outerRadius - that.defaults.innerRadius) / 2 + that.defaults.innerRadius) * Math.cos(a);
      nameY = ((that.defaults.outerRadius - that.defaults.innerRadius) / 2 + that.defaults.innerRadius) * Math.sin(a);
      nameStr = "T" + ((that.defaults.width - that.xOffset) / 2 + that.xOffset) + "," + that.defaults.height / 2 + "R" + ro + "T" + nameX + "," + nameY;

      if ((groups[i].endAngle - groups[i].startAngle) * 180 / Math.PI > 10) {
        donutName = that.canvas.text().attr("font", "12px Verdana").attr("text", that.groupNames[i]).transform(nameStr);
      }

      //画刻度和刻度值**************************************
      num = groups[i].value / 5000;
      //最细分的每个小格代表的数值大小
      unitAngle = (groups[i].endAngle - groups[i].startAngle) * 180 / Math.PI / num;

      var j;
      for (j = 0; j <= num; j++) {
        //计算旋转角度和水平、竖直方向所需平移的距离
        radian = ((groups[i].startAngle * 180 / Math.PI - 90) + j * unitAngle);
        angle = radian * Math.PI / 180;
        xTrans = that.defaults.outerRadius * Math.cos(angle);
        yTrans = that.defaults.outerRadius * Math.sin(angle);

        tickStr = "T" + ((that.defaults.width - that.xOffset) / 2 + that.xOffset) + "," + that.defaults.height / 2 + "T" + xTrans + "," + yTrans;

        //刻度线的起点终点坐标
        aX = ((that.defaults.width - that.xOffset) / 2 + that.xOffset) + xTrans;
        aY = that.defaults.height / 2 + yTrans;
        bX = ((that.defaults.width - that.xOffset) / 2 + that.xOffset) + (that.defaults.outerRadius + 6) * Math.cos(angle);
        bY = that.defaults.height / 2 + (that.defaults.outerRadius + 6) * Math.sin(angle);

        tickLine = "M" + aX + "," + aY + "L" + bX + "," + bY;
        that.canvas.path(tickLine).attr({
          'stroke': "#929292",
          "stroke-width": '1px'
        }); //绘制刻度

        //每隔五个刻度，绘制一次文字
        if (j % 2 === 0) {
          //计算text-anchor
          if (radian + 90 < 180) {
            anchor = "start";
          } else {
            anchor = "end";
          }

          //计算文字方向是否需要旋转180度
          if (radian + 90 < 180) {
            rotateStr = null;
          } else {
            rotateStr = "R180";
          }

          wXTrans = (that.defaults.outerRadius + 10) * Math.cos(angle);
          wYTrans = (that.defaults.outerRadius + 10) * Math.sin(angle);

          word = j % 2 ? "" : Math.round(((groups[i].value / num) * j) / 1000);

          wordStr = "T" + ((that.defaults.width - that.xOffset) / 2 + that.xOffset) + "," + that.defaults.height / 2 + "R" + radian
          /*(groups[i].startAngle * 180 / Math.PI - 90)*/
          + rotateStr + "T" + wXTrans + "," + wYTrans;

          //绘制文字
          textEl = that.canvas.text(0, 0, word).attr("font", "12px Verdana").transform(wordStr).attr("text-anchor", anchor).attr('fill', "#929292");
        }
      }
    }

    /*this.canvas.text().attr("font", "12px arial").translate((that.defaults.width - this.xOffset) / 2 + this.xOffset, this.defaults.height).attr("text", "The unit of the scale on the periphery is 1000. \n 刻度值的单位为1000。");
     */
  };

  return Chord;
});