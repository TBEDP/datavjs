/*global Raphael, d3, $, define, _ */
/*!
 * StreamLegend的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Legend', function (require) {
  var DataV = require('DataV');

  var Legend = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.legendIndent = 20;
      this.node = $(container);
      /**
       * 类型纬度
       */
      this.dimension.type = {
          type: "string",
          required: true,
          index: 1
      };
      /**
       * 时间纬度
       */
      this.dimension.x = {
          type: "string",
          required: true,
          index: 0
      };
      /**
       * 值纬度
       */
      this.dimension.value = {
          type: "number",
          required: true,
          index: 2
      };
    }
  });

  Legend.prototype.init = function () {
    var conf = this.owner.defaults;
    this.legend = $("<div></div>");
    this.legend.css({
      "overflow": "hidden",
      "padding": "10px 0 10px 0",
      "width": conf.leftLegendWidth - this.legendIndent + "px"
    });
    this.node.append(this.legend);
  };

  Legend.prototype.setSource = function (source, map) {
    map = this.map(map);
    this.list = _.keys(_.groupBy(source, map.type));
  };

  Legend.prototype.render = function () {
    var that = this;
    this.init();
    this.clear();
    this.legends = [];
    var owner = this.owner;
    var colorFunc = this.defaults.colorFunc,
      hoverIn = function (e) {
        var index = e.data.index;
        owner.fire('hoverIn', index);
        this.highlight(index);
      },
      hoverOut = function (e) {
        var index = e.data.index;
        owner.fire('hoverOut', index);
        this.lowlight(index);
      };

    that.on('hoverIn', function (index) {
      that.highlight(index);
    }).on('hoverOut', function (index) {
      that.lowlight(index);
    });

    var ul = $("<ul></ul>").css({
      "margin": "0 0 0 10px",
      "paddingLeft": 0 
    });
    for (var i = 0, l = this.list.length; i < l && i < this.legendIndent; i++) {
      var color = colorFunc(i);
      var li = $('<li style="color: ' + color + '"><span style="color: black">' + this.list[i] + '</span></li>');
      li.mouseenter({"index": i}, $.proxy(hoverIn, this)).mouseleave({"index": i}, $.proxy(hoverOut, this));
      ul.append(li);
      this.legends.push(li);
    }

    ul.find("li").css({
      "list-style-type": "square",
      "list-style-position": "inside",
      "white-space": "nowrap",
      "padding-left": 5
    });
    this.legend.append(ul);
  };

  Legend.prototype.highlight = function (index) {
    this.legends[index].css({"background": "#dddddd"});
  };
  Legend.prototype.lowlight = function (index) {
    this.legends[index].css({"background": "white"});
  };
  Legend.prototype.clear = function () {
    this.legend.empty();
  };

  var TopLegend = DataV.extend(DataV.Widget, {
    initialize: function (container) {
      this.node = $(container);
      this.defaults.r0 = 5;
      this.defaults.r1 = 7;
    }
  });
  TopLegend.prototype.init = function () {
    var conf = this.owner.defaults;
    this.legend = $("<div></div>").css({
      "width": conf.width,
      "backgroundColor": "#f4f4f4"
    });
    this.node.append(this.legend);
  };

  TopLegend.prototype.render = function () {
    this.init();
    var that = this;
    var owner = this.owner,
      conf = owner.defaults;
    var r0 = this.defaults.r0;
    this.legends = [];
    this.paper = new Raphael(this.legend[0], conf.width, 50);
    var paper = this.paper;

    var m = [10, 20, 10, 20],
      left = m[3],
      top = m[0],
      lineHeight = 25,
      legendInterval = 10,
      lineWidth = conf.width,
      circleW = 18,
      colorFunc = owner.getColor();
    var hoverIn = function () {
      var index = this.data("index");
      that.owner.fire('hoverIn', index);
      that.highlight(index);
    };
    var hoverOut = function () {
      var index = this.data("index");
      that.owner.fire('hoverOut', index);
      that.lowlight(index);
    };

    that.on('hoverIn', function (index) {
      that.highlight(index);
    }).on('hoverOut', function (index) {
      that.lowlight(index);
    });

    var colorArray = owner.displayData.allInfos.map(function (item, index) {
      return colorFunc(index);
    });

    for (var i = 0, l = owner.displayData.allInfos.length; i < l; i++) {
      var text = paper.text(0, 0, owner.getDisplayRowInfo(i).rowName).attr({
        "font-size": conf.fontSize,
        "text-anchor": "start",
        "font-family": "微软雅黑"
      });
      var box = text.getBBox();
      if (left + circleW + box.width >= lineWidth - m[1]) {
        //new line
        left = m[3];
        top += lineHeight;
      }
      var color = colorArray[owner.displayData.rowIndex[i].slicedData];
      var circle = paper.circle(left + circleW / 2, top + lineHeight / 2, r0)
        .attr({
          "stroke": "none",
          "fill": color
        })
        .data("index", i)
        .hover(hoverIn, hoverOut);
      text.transform("t" + (left + circleW) + "," + (top + lineHeight / 2));
      paper.rect(left + circleW, top, box.width, lineHeight).attr({
        "stroke": "none",
        "fill": "#000",
        "opacity": 0
      })
      .data("index", i)
      .hover(hoverIn, hoverOut);

      that.legends.push({"text": text, "circle": circle});

      left += legendInterval + circleW + box.width;
    }
    paper.setSize(lineWidth, top + lineHeight + m[2]);
  };

  TopLegend.prototype.highlight = function (index) {
    this.legends[index].circle.animate({"r": this.defaults.r1, "opacity": 0.5}, 300);
  };
  TopLegend.prototype.lowlight = function (index) {
    this.legends[index].circle.animate({"r": this.defaults.r0, "opacity": 1}, 300);
  };

  return {
    Legend: Legend,
    TopLegend: TopLegend
  };
});