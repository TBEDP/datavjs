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
  var Navi = function (stream, container) {
    this.node = container;
    this.stream = stream;
    this.naviBackWidth = 80;
    var conf = this.stream.defaults;
    $(this.navi).css({
      "border-top": "1px solid #ddd",
      "border-bottom": "1px solid #ddd",
      "padding-top": "5px",
      "padding-bottom": "10px",
      "padding-left": "10px",
      "padding-right": "10px",
      "font": (conf.fontSize + 1) + "px 宋体"
    });
    if (!conf.showNavi) {
      $(this.navi).css({
        "visibility": "hidden",
        "position": "absolute"
      });
    }
    this.naviTrace = document.createElement("div");
    $(this.naviTrace).css({
      "width": conf.legendBesidesWidth - this.naviBackWidth - 50 + "px",
      "margin-top": "5px"
    });

    this.naviBack = document.createElement("div");
    this.naviBack.innerHTML = "返回上层";
    $(this.naviBack).css({
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
    this.navi.appendChild(this.naviBack);
    this.navi.appendChild(this.naviTrace);

    $(this.naviTrace).on("click", ".navi", {stream: this.stream}, function (e) {
      var stream = e.data.stream;
      stream.defaults.moreConfig.level = e.target.data.level;
      getBack(stream);
    });

    $(this.naviBack).on("click", {stream: this.stream}, function (e) {
      var stream = e.data.stream;
      stream.defaults.moreConfig.level -= 1;
      getBack(stream);
    });
    var getBack = function (stream) {
      var naviCallBack = (function () {
        return function () {
          stream.cover.hidden();
          if (typeof stream.cover.mouse !== 'undefined') {
            stream.hoverLine.show();
            stream.floatTag.show();
            $(stream.paper.canvas).trigger("mousemove",
                [stream.cover.mouse.x, stream.cover.mouse.y]);
            stream.cover.mouse = undefined;
          }
          stream.pathLabel.show();
        };
      }(stream.paths.length));

      stream.cover.show();
      stream.cover.mouse = undefined;

      stream.processData("slicedData");
      stream.render("renderComponents");

      //hidden
      stream.hoverLine.hidden();
      stream.floatTag.hidden();

      stream.pathLabel.hidden();
      stream.paths.forEach(function (d) {
        d.attr({transform: "s1,0.001,0,0"});
        d.animate({transform: "t0,0"}, 750, "linear", naviCallBack);
      });
    };
  };
  Navi.prototype.render = function () {
    var stream = this.stream;
    var level = stream.defaults.moreConfig.level;
    var i, span;
    this.clear();
    for (i = 0; i <= level; i++) {
      $(this.naviTrace).append($("<span> &gt; </span>"));
      span = document.createElement("span");
      span.data = {level: i};
      span = $(span)
        .html(i === 0 ? "第1层"/*this.userConfig.rootName*/ : "第" + (i + 1) + "层")
        .appendTo($(this.naviTrace));
      if (i !== level) {
        span.css({"cursor": "pointer", "color": "#1E90FF"})
        .addClass("navi");
      }
    }
    this.naviBack.style.visibility = level > 0 ? "visible" : "hidden";
  };
  Navi.prototype.clear = function () {
    $(this.naviTrace).empty();
  };

  return Navi;
});