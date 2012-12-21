/*global $, define */
/*!
 * Stream的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('StreamComponent', function (require) {
  var DataV = require('DataV');
  var Legend = require('Legend');
  var Navi = require('Navi');
  var Percentage = require('Percentage');
  var Axis = require('StreamAxis');
  var Tip = require('Tip');
  var Stream = require('Stream');
  var Cover = require('Cover');

  /*
   * constructor
   * @param node the dom node or dom node Id
   *        options options json object for determin stream style.
   * @example
   * create stream in a dom node with id "chart", width is 500; height is 600px;
   * "chart", {"width": 500, "height": 600}
   */
  var StreamComponent = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Stream";
      this.node = this.checkContainer(node);
      this.defaults = {};
      // Properties
      this.defaults.offset = "zero";//zero, expand, silhou-ette, wiggle;(d3 stack offset)
      this.defaults.order = "default";//default, reverse, descending, ascending, inside-out(d3 stack order, sort by index of maximum value, then use balanced weighting.), inside-out-reverse(inside-out like, sort by index of maximum value, not descending but ascending);
      this.defaults.normalized = false;//false, true; //ratio data or not;
      //this.defaults.rowDataOrder = "default"; //default, descending, ascending(according to digitdata row sum value);
      this.defaults.columnNameUsed = "auto";
      this.defaults.rowNameUsed = "auto";
      this.defaults.pathLabel = true;
      this.defaults.fontSize = 12;
      this.defaults.colorCount = 20;
      //this.defaults.axisTickNumber = 8; // axis ticks number

      this.defaults.indexMargin = 3; // if dates.length < indexMargin * 2 + 1, do not show label

      this.timeRange = [];
      // paper

      this.defaults.width = 800;
      this.defaults.height = 560;//if only width has value and autoHeight is true, then height will be width * heightWidthRatio.
      this.defaults.autoHeight = true;
      this.defaults.heightWidthRatio = 0.6;

      this.defaults.legendPosition = "top";//"top", "left"
      this.defaults.topLegendHeight = 50;
      this.defaults.leftLegendWidth = 150;
      this.defaults.showLegend = true;

      this.defaults.legendBesidesWidth = undefined;
      this.defaults.legendBesidesHeight = undefined;

      this.defaults.more = false;
      this.defaults.moreLabel = "more";
      this.defaults.max = 20;
      this.defaults.level = 0;

      this.defaults.chartWidth = undefined;//depends on width, do not recommend to change
      this.defaults.chartHeight = undefined;// depends on height, do not recommend to change

      this.defaults.naviHeight = 20;//do not recommend to change
      this.defaults.showNavi = undefined;//ture if moreConfig.more == true, else false;

      this.defaults.axisHeight = 30;//do not recommend to change
      this.defaults.showAxis = true;

      this.defaults.showPercentage = undefined;//true if moreConfig.more == true, else false;
      this.defaults.percentageWidth = 40;

      this.defaults.customEventHandle = {"mousemove": null};

      this.defaults.tipStyle = {};

      this.setOptions(options);
    }
  });

  StreamComponent.prototype.init = function () {
    var that = this;
    var getBack = function () {
      var naviCallBack = function () {
        that.cover.hidden();
        if (typeof that.cover.mouse !== 'undefined') {
          that.hoverLine.show();
          that.tip.show();
          $(that.paper.canvas).trigger("mousemove",[that.cover.mouse.x, that.cover.mouse.y]);
          that.cover.mouse = undefined;
        }
        that.pathLabel.show();
      };

      that.cover.show();
      that.cover.mouse = undefined;

      that.processData("slicedData");
      that.render("renderComponents");

      //hidden
      that.hoverLine.hidden();
      that.tip.hidden();

      that.pathLabel.hidden();
      that.paths.forEach(function (d) {
        d.attr({transform: "s1,0.001,0,0"});
        d.animate({transform: "t0,0"}, 750, "linear", naviCallBack);
      });
    };
    that.on('changeLevelTo', function (level) {
      that.defaults.level = level;
      getBack(that.defaults.moreConfig.level);
    });
    that.on('back', function () {
      that.defaults.level = that.defaults.level - 1;
      getBack(that.defaults.level);
    });
    that.legend.on('hoverIn', function (index) {
      that.stream.highlight(index);
    }).on('hoverOut', function (index) {
      that.stream.lowlight(index);
    });
    that.stream.on('enter', function () {
      that.axis.showTab();
      that.tip.show();
    }).on('leave', function (index) {
      that.axis.hideTab();
      that.tip.hidden();
      if (index !== undefined) {
        that.legend.lowlight(index);
      }
    }).on('move', function (pre, rowIndex, columnIndex) {
      if (pre !== undefined) {
        that.legend.lowlight(pre);
      }
      if (typeof rowIndex === "undefined" || typeof columnIndex === "undefined") {
        return;
      }
      that.legend.highlight(rowIndex);
      that.tip.setContent(rowIndex, columnIndex);
      //axis pop bubble
      that.axis.refreshTab(columnIndex);
    }).on('level_changed', function (start, end, needMore) {
      that.legend.fire('level_changed', start, end, needMore);
    });
  };

  StreamComponent.prototype.setSource = function (source, map) {
    this.source = source;
    this.map = map;
  };

  StreamComponent.prototype.layout = function () {
    var conf = this.defaults;
    if (!conf.showLegend) {
      conf.legendBesidesWidth = conf.width;
      conf.legendBesidesHeight = conf.height;
    } else {
      if (conf.legendPosition === "left") {
        conf.legendBesidesWidth = conf.width - conf.leftLegendWidth;
        conf.legendBesidesHeight = conf.height;
      } else {
        conf.legendBesidesWidth = conf.width;
        conf.legendBesidesHeight = conf.height - conf.topLegendHeight;
      }
    }
    conf.chartWidth = conf.legendBesidesWidth - 2 * conf.percentageWidth;
    conf.chartHeight = conf.legendBesidesHeight - (conf.showNavi ? conf.naviHeight : 0) - (conf.showAxis ? conf.axisHeight : 0);
    var node = $(this.node).css({
      position: "relative",
      width: conf.width
    });
    // 创建DOM节点
    this.streamBox = $("<div></div>").addClass("stream");
    this.legendBox = $("<div></div>").addClass("legend");
    this.axisBox = $("<div></div>").addClass("axis");
    this.naviBox = $("<div></div>").addClass("navi");
    this.percentageBox = $("<div></div>").addClass("percentage");
    this.container = $("<div></div>").addClass("container");
    this.rightBox = $("<div></div>").addClass("right");
    // cover can block stream paper when animating to prevent some default mouse event
    this.coverBox = $("<div></div>").addClass("cover");
    // 插入DOM
    this.streamBox.append(this.coverBox);
    this.container.append(this.percentageBox).append(this.streamBox);
    this.rightBox.append(this.naviBox).append(this.container).append(this.axisBox);
    node.append(this.legendBox).append(this.rightBox);
    // 设置各个节点大小
    this.streamBox.css({
      "position": "relative",
      "float": "left",
      "width": conf.chartWidth,
      "height": conf.chartHeight
    });
    this.percentageBox.css({

    });
    this.container.css({
      "height": conf.chartHeight
    });
    this.rightBox.css({
      "float": "right",
      "width": conf.legendBesidesWidth
    });
    this.legendBox.css({
      "width": conf.leftLegendWidth - 4,
      "float": "left",
      "overflowX": "hidden"
    });
  };

  StreamComponent.prototype.draw = function () {
    var conf = this.defaults;
    //chart and paper
    this.stream = this.own(new Stream(this.streamBox, {"width": conf.chartWidth, "height": conf.chartHeight}));
    this.stream.setSource(this.source, this.map);
    this.stream.render();

    this.legend = this.own(new Legend.Legend(this.legendBox));
    this.legend.setOptions({
      "colorFunc": this.stream.getColor()
    });
    this.legend.setSource(this.source, this.map);
    this.legend.render();

    this.percentage = this.own(new Percentage(this.percentageBox));
    this.percentage.setSource(this.source, this.map);
    this.percentage.render();

    this.axis = this.own(new Axis(this.axisBox));
    this.axis.setSource(this.source, this.map);
    this.axis.render();

    this.navi = this.own(new Navi(this.naviBox));
    this.navi.render();

    // cover can block stream paper when animating to prevent some default mouse event
    this.cover = this.own(new Cover(this.coverBox));

    //floatTag
    this.tip = this.own(new Tip(this.streamBox));
    this.tip.setSource(this.source, this.map);
    this.tip.render();
  };

  StreamComponent.prototype.render = function () {
    this.layout();
    this.draw();
    this.init();
  };

  StreamComponent.prototype.setCustomEvent = function (eventName, callback) {
    this.defaults.customEventHandle[eventName] = callback;
  };

  /*!
   * 导出StreamComponent
   */
  return StreamComponent;
});
