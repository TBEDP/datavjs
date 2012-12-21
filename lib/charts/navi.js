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
})('Navi', function (require) {
  var DataV = require('DataV');

  var Navi = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.node = $(container);
    }
  });

  Navi.prototype.init = function () {
    this.naviBackWidth = 80;
    var conf = this.defaults;
    this.node.css({
      "borderTop": "1px solid #ddd",
      "borderBottom": "1px solid #ddd",
      "padding": "5px 10px 10px 10px",
      "fontSize": conf.fontSize + 1,
      "fontFamily": "宋体"
    });
    this.naviTrace = $("<div></div>").css({
      "width": conf.legendBesidesWidth - this.naviBackWidth - 50,
      "margin-top": "5px"
    });

    this.naviBack = $("<div></div>");
    this.naviBack.html("返回上层").css({
      "width": this.naviBackWidth + "px",
      "float": "right",
      "background-color": "#f4f4f4",
      "padding-top": "4px",
      "padding-bottom": "4px",
      "border": "1px solid #ddd",
      "border-radius": "2px",
      "cursor": "pointer",
      "text-align": "center",
      "visibility": "hidden"
    });
    this.node.append(this.naviBack).append(this.naviTrace);

    var that = this;
    this.naviTrace.on("click", ".navi", function (e) {
      that.owner.fire('changeLevelTo', e.target.data('level'));
    });

    this.naviBack.on("back", function () {
      that.owner.fire('changeLevel');
    });
  };

  Navi.prototype.render = function () {
    this.init();
    var level = this.defaults.level;
    this.clear();
    for (var i = 0; i <= level; i++) {
      this.naviTrace.append($("<span> &gt; </span>"));
      var span = $("<span></span>").data("level", i).html("第" + (i + 1) + "层");
      this.naviTrace.append(span);
      if (i !== level) {
        span.css({
          "cursor": "pointer",
          "color": "#1E90FF"
        }).addClass("navi");
      }
    }
    this.naviBack.css('visibility', level > 0 ? "visible" : "hidden");
  };
  Navi.prototype.clear = function () {
    this.naviTrace.empty();
  };

  return Navi;
});