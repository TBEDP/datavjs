//copy codes from d3.js, add 4 functions: tickAttr, tickTextAttr, minorTickAttr and domainAttr;
//axis() changes, need a raphael paper object param, return raphael set object.
//examples in ../examples/axis/ to know the usage.
//a basic part for other data visualization format
/*global d3*/
/*!
 * Axis兼容定义
 */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) { return this[id];});
    }
})('Axis', function (require) {
    /**
     * function from d3, get scaleRange of an ordinal scale
     * @param {Array} domain ordinal scale's range
     */
    function d3_scaleExtent(domain) {
        var start = domain[0], stop = domain[domain.length - 1];
        return start < stop ? [start, stop] : [stop, start];
    }

    /**
     * function from d3, get scaleRange of a scale
     */
    function d3_scaleRange(scale) {
        return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
    }

    /**
     * function from d3, get subticks
     * @param scale, scale
     * @param ticks, major ticks of scale
     * @param m, number of subdivide
     */
    function d3_svg_axisSubdivide(scale, ticks, m) {
        var subticks = [];
        if (m && ticks.length > 1) {
            var extent = d3_scaleExtent(scale.domain()),
                i = -1,
                n = ticks.length,
                d = (ticks[1] - ticks[0]) / ++m,
                j,
                v;
            while (++i < n) {
                for (j = m; --j > 0;) {
                    if ((v = +ticks[i] - j * d) >= extent[0]) {
                        subticks.push(v);
                    }
                }
            }
            for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
                subticks.push(v);
            }
        }
        return subticks;
    }

    var Axis = function () {
        var scale = d3.scale.linear(),
            orient = "bottom",
            tickMajorSize = 6,
            tickMinorSize = 6,
            tickEndSize = 6,
            tickPadding = 3,
            tickArguments_ = [10],
            tickFormat_,
            tickSubdivide = 0,

            tickAttr_ = {},
            tickTextAttr_ = {},
            minorTickAttr_ = {},
            domainAttr_ = {};
      
        /**
         * @param paper: raphael's paper object.
         * @return axisSet: raphael's set object.
         */
        function axis(paper) {
            // Ticks for quantitative scale, or domain values for ordinal scale.
            var ticks = scale.ticks ? scale.ticks.apply(scale, tickArguments_) : scale.domain(),
                tickFormat = tickFormat_ === undefined ?
                    (scale.tickFormat ?
                        scale.tickFormat.apply(scale, tickArguments_)
                        : String)
                    : tickFormat_;

            var subticks = d3_svg_axisSubdivide(scale, ticks, tickSubdivide);
            var range = d3_scaleRange(scale);
        
            var axisSet = paper.set();

            switch (orient) {
            case "bottom":
                subticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + tickMinorSize + "V0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + tickMajorSize + "V0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(tickX,  Math.max(tickMajorSize, 0) + tickPadding + 2,
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "middle"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + range[0] + "," + tickEndSize + "V0H" + range[1] + "V" + tickEndSize)
                    .attr(domainAttr_));
                break;

            case "top":
                subticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + -tickMinorSize + "V0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + -tickMajorSize + "V0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(tickX,  -(Math.max(tickMajorSize, 0) + tickPadding + 2),
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "middle"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + range[0] + "," + -tickEndSize + "V0H" + range[1] + "V" + -tickEndSize)
                    .attr(domainAttr_));
                break;

            case "left":
                subticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + -tickMinorSize + "," + tickY + "H0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + -tickMajorSize + "," + tickY + "H0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(-(Math.max(tickMajorSize, 0) + tickPadding),  tickY,
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "end"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + -tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + -tickEndSize)
                    .attr(domainAttr_));
                break;

            case "right":
                subticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickMinorSize + "," + tickY + "H0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickMajorSize + "," + tickY + "H0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(Math.max(tickMajorSize, 0) + tickPadding,  tickY,
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "start"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + tickEndSize)
                    .attr(domainAttr_));
                break;
            }

            return axisSet;
        }
      
        /**
         * get or set axis' scale.
         */
        axis.scale = function (x) {
            if (!arguments.length) {
                return scale;
            }
            scale = x;
            return axis;
        };
      
        /**
         * get or set axis' orinet: "bottom", "top", "left", "right", default orient is bottom.
         */
        axis.orient = function (x) {
            if (!arguments.length) {
                return orient;
            }
            orient = x;
            return axis;
        };
      
        /**
         * get or set axis' ticks number.
         */
        axis.ticks = function () {
            if (!arguments.length) {
                return tickArguments_;
            }
            tickArguments_ = arguments;
            return axis;
        };
      
        /**
         * get or set axis' ticks format function, it's a function change format style.
         * from one string format to another string format.
         */
        axis.tickFormat = function (x) {
            if (!arguments.length) {
                return tickFormat_;
            }
            tickFormat_ = x;
            return axis;
        };
      
        /**
         * get or set axis' tick size(length of tick line, unit: px).
         * @param arguments.length === 0, get axis' major tick size.
         * @param arguments.length === 1, set axis' all tick sizes as x.
         * @param arguments.length === 2, get axis' major tick size as x, minor and end size as y.
         * @param arguments.length === 3, get axis' major tick size as x, minor size as y, end size as z.
         */
        axis.tickSize = function (x, y, z) {
            if (!arguments.length) {
                return tickMajorSize;
            }
            var n = arguments.length - 1;
            tickMajorSize = +x;
            tickMinorSize = n > 1 ? +y : tickMajorSize;
            tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
            return axis;
        };
      
        /**
         * get or set axis' tick padding(the distance between tick text and axis).
         * @param x is a number, unit is px;
         */
        axis.tickPadding = function (x) {
            if (!arguments.length) {
                return tickPadding;
            }
            tickPadding = +x;
            return axis;
        };

        /**
         * get or set axis' sub tick divide number(divide number between two major ticks).
         */
        axis.tickSubdivide = function (x) {
            if (!arguments.length) {
                return tickSubdivide;
            }
            tickSubdivide = +x;
            return axis;
        };

        /**
         * get or set axis' tick attribute(Raphael format).
         */
        axis.tickAttr = function (x) {
            if (!arguments.length) {
                return tickAttr_;
            }
            tickAttr_ = x;
            return axis;
        };
      
        /**
         * get or set axis' tick text attribute(Raphael format).
         */
        axis.tickTextAttr = function (x) {
            if (!arguments.length) {
                return tickTextAttr_;
            }
            tickTextAttr_ = x;
            return axis;
        };

        /**
         * get or set axis' minor tick attribute(Raphael format).
         */
        axis.minorTickAttr = function (x) {
            if (!arguments.length) {
                return minorTickAttr_;
            }
            minorTickAttr_ = x;
            return axis;
        };
      
        /**
         * get or set axis' domain(axis line) attribute(Raphael format).
         */
        axis.domainAttr = function (x) {
            if (!arguments.length) {
                return domainAttr_;
            }
            domainAttr_ = x;
            return axis;
        };
      
        return axis;
    };

    return Axis;
});

/*global Raphael, d3, $, define, _ */
/*!
 * Stream的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('StreamAxis', function (require) {
  var DataV = require('DataV');
  DataV.Axis = require('Axis');
  var Axis = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.node = $(container);
      /**
       * 时间纬度
       */
      this.dimension.x = {
        type: "string",
        required: true,
        index: 0
      };
    }
  });

  Axis.prototype.setSource = function (source, map) {
    map = this.map(map);
    this.grouped = _.groupBy(source, map.x);
    this.axis = _.keys(this.grouped);
    this.range = [0, this.axis.length - 1];
  };

  Axis.prototype.init = function () {
    var conf = this.defaults;
    this.paper = new Raphael(this.node[0], conf.legendBesidesWidth, conf.axisHeight);
    this.node.css({
      "margin-top": "0px",
      "border-top": "1px solid #ddd",
      "height": conf.axisHeight + "px"
    });
  };

  Axis.prototype.render = function () {
    this.init();
    this.clear();
    //all date strings' format are same, string length are same 
    var conf = this.defaults,
      that = this;
    var getPopPath = function (El) {
        //down pop
        var x = 0,
          y = 0,
          size = 4,
          cw = 23,
          bb = {height: 8};
        if (El) {
          bb = El.getBBox();
          bb.height *= 0.6;
          cw = bb.width / 2 - size;
        }
        return [
          'M', x, y,
          'l', size, size, cw, 0,
          'a', size, size, 0, 0, 1, size, size,
          'l', 0, bb.height,
          'a', size, size, 0, 0, 1, -size, size,
          'l', -(size * 2 + cw * 2), 0,
          'a', size, size, 0, 0, 1, -size, -size,
          'l', 0, -bb.height,
          'a', size, size, 0, 0, 1, size, -size,
          'l', cw, 0,
          'z'
        ].join(',');
      };
    var left = conf.percentageWidth,
      right = conf.legendBesidesWidth - conf.percentageWidth;
    var tempWord = this.paper.text(0, 0, this.axis[0]);
    var tickNumber = Math.floor((right - left) / tempWord.getBBox().width / 2) + 1;
    tempWord.remove();

    this.dateScale = d3.scale.linear()
      .domain([0, this.axis.length - 1])
      .range([left, right]);
    DataV.Axis().scale(this.dateScale)
      .ticks(tickNumber)
      .tickSize(6, 3, 3)
      .tickAttr({"stroke": "none"})
      .minorTickAttr({"stroke": "none"})
      .domainAttr({"stroke": "none"})
      .tickFormat(function (d) {
        return that.axis[d] || "";
      })(this.paper);

    this.axisPopText = this.paper.text(0, 11, this.axis[0])
      .attr({
        "text-anchor": "middle",
        "fill": "#fff",
        "transform": "t" + left + ",0"
      }).hide();
    this.axisPopBubble = this.paper.path(getPopPath(this.axisPopText))
      .attr({
        "fill": "#000",
        "transform": "t" + (-10000) + ",0"
      }).toBack()
      .hide();
  };
  Axis.prototype.hideTab = function () {
    this.axisPopText.hide();
    this.axisPopBubble.hide();
  };
  Axis.prototype.showTab = function () {
    this.axisPopText.show();
    this.axisPopBubble.show();
  };
  Axis.prototype.refreshTab = function (index) {
    var conf = this.defaults;
    var x = conf.chartWidth * index / (this.axis.length - 1);
    var transX = x + this.defaults.percentageWidth;
    this.axisPopText.attr({
      "text": this.axis[index + this.range[0]]
    }).transform("t" + transX + ",0");
    this.axisPopBubble.transform("t" + transX + ",0");
  };
  Axis.prototype.clear = function () {
    this.paper.clear();
  };
  return Axis;
});
/*global Raphael, $, define, _ */
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
      this.defaults.highlightStyle = {"backgroundColor": "#dddddd"};
      this.defaults.lowlightStyle = {"backgroundColor": "white"};
      this.formatLabel = function (text) {
        return text;
      };
      this.init();
    }
  });

  Legend.prototype.init = function () {
    var conf = this.defaults;
    this.legend = $("<div></div>");
    this.legend.css({
      "overflow": "hidden",
      "padding": "10px 0 10px 0",
      "width": conf.leftLegendWidth - this.legendIndent + "px"
    });
    this.node.append(this.legend);
    this.initEvents();
  };

  Legend.prototype.setSource = function (source, map) {
    map = this.map(map);
    var groupedByType = _.groupBy(source, map.type);
    var sorted = _.sortBy(groupedByType, function (group) {
      return -DataV.sum(group, map.value);
    });
    //this.list = _.keys();
    this.list = sorted.map(function (d) { return d[0][map.type]; });
  };

  Legend.prototype.initEvents = function () {
    var that = this;
    that.on('hoverIn', function (index) {
      that.highlight(index);
    }).on('hoverOut', function (index) {
      that.lowlight(index);
    }).on('level_changed', function (start, end, needMore) {
      that.render(start, end, needMore);
    });
  };

  Legend.prototype.render = function (level) {
    var conf = this.defaults;
    conf.level = level || 0;
    var that = this;
    this.clear();
    this.legends = [];
    var colorFunc = conf.colorFunc,
      hoverIn = function (e) {
        var index = e.data.index;
        that.fire('hoverIn', index);
        this.highlight(index);
      },
      hoverOut = function (e) {
        var index = e.data.index;
        that.fire('hoverOut', index);
        this.lowlight(index);
      };
    var ul = $("<ul></ul>").css({
      "margin": "0 0 0 10px",
      "paddingLeft": 0
    });

    var selected;
    if (!conf.more) {
      selected = this.list.slice(0);
    } else {
      selected = DataV.more(this.list, conf.level, conf.max, function () {
        return conf.moreLabel;
      });
    }

    var formatLabel = conf.formatLabel || this.formatLabel;
    for (var i = 0, l = selected.length; i < l; i++) {
      var color = colorFunc(i);
      var li = $('<li style="color: ' + color + '"><span style="color: black" title="' + selected[i] + '">' + formatLabel(selected[i]) + '</span></li>');
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
    if (typeof index !== 'undefined') {
      this.legends[index].css(this.defaults.highlightStyle);
    }
  };
  Legend.prototype.lowlight = function (index) {
    if (typeof index !== 'undefined') {
      this.legends[index].css(this.defaults.lowlightStyle);
    }
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
})('Tip', function (require) {
  var DataV = require('DataV');
  //floatTag
  var Tip = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.container = container;
      this.node = DataV.FloatTag()(this.container);
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
    },
    getContent: function (obj) {
      return obj[this.mapping.x];
    }
  });
  Tip.prototype.setSource = function (source, map) {
    var that = this;
    this.map(map);
    this.rawData = source;
    this.groupedByX = _.groupBy(source, this.mapping.x);
    this.groupedByType = _.groupBy(source, this.mapping.type);
    var sorted = _.sortBy(this.groupedByType, function (group) {
      return -DataV.sum(group, that.mapping.value);
    });
    this.sorted = sorted;
    _.each(sorted, function (list, index) {
      that.groupedByType[list[0][that.mapping.type]].finalRank = index + 1;
    });
    this.axis = _.keys(this.groupedByX);
  };

  Tip.prototype.render = function () {
    this.hidden();
    this.node.css(this.defaults.tipStyle);
  };

  Tip.prototype.setContent = function (rowIndex, columnIndex) {
    var that = this;
    var conf = this.defaults;
    var getContent = conf.getContent || this.getContent;
    var column = this.groupedByX[this.axis[columnIndex]];
    var values = this.sorted;//_.values(this.groupedByType);
    var types;
    if (!conf.more) {
      types = values;
    } else {
      types = DataV.more(values, conf.level, conf.max, function (remains) {
        var row = [];
        for (var i = 0; i < that.axis.length; i++) {
          var col = {};
          col[that.mapping.type] = conf.moreLabel;
          col[that.mapping.x] = that.axis[i];
          col[that.mapping.value] = NaN;// DataV.sum(_.pluck(remains, i), that.mapping.value);
          col.rate = DataV.sum(_.pluck(remains, i), "rate");
          row.push(col);
        }
        return row;
      });
    }
    var row = types[rowIndex];
    var obj = row[columnIndex];

    var index = _.indexOf(_.map(column, function (item) {
      return item[that.mapping.value];
    }).sort(function (a, b) {
      return a > b ? -1 : 1;
    }), obj[that.mapping.value]);
    obj.rank = index === -1 ? NaN : index + 1;
    var html = getContent.call(this, obj);
    this.node.html(html);
  };

  return Tip;
});

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
})('Percentage', function (require) {
  var DataV = require('DataV');

  var Percentage = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.node = $(container);
      this.limit = 20;
      this.from = 0;
      this.to = 0;
      /**
       * 类型纬度
       */
      this.dimension.type = {
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
    }
  });

  Percentage.prototype.init = function () {
    var conf = this.defaults;
    this.paper = new Raphael(this.node[0], conf.percentageWidth, conf.chartHeight);
    this.node.css({
      "width": conf.percentageWidth,
      "height": conf.chartHeight,
      "float": "left",
      "margin-bottom": "0px",
      "border-bottom": "0px",
      "padding-bottom": "0px"
    });
  };

  Percentage.prototype.setSource = function (source, map) {
    map = this.map(map);
    this.grouped = _.groupBy(source, map.type);
    this.types = _.keys(this.grouped);
    if (this.types.length > this.limit) {
      this.to = this.limit;
    }
  };

  Percentage.prototype.render = function () {
    this.init();
    var conf = this.defaults;
    var y = conf.fontSize * 2 / 3;
    if (!this.rect) {//init
      this.rect = this.paper.rect(0, 0, conf.percentageWidth, conf.chartHeight)
      .attr({
        "fill": "#f4f4f4",
        "stroke": "#aaa",
        "stroke-width": 0.5
      });
      this.text = this.paper.text(conf.percentageWidth / 2, y, Math.round(100) + "%")
      .attr({"text-anchor": "middle"});
    }
    // this.rect.animate({"y": (1 - maxY) * conf.chartHeight, "height": maxY * conf.chartHeight}, 750);
    // this.text.attr({
    //   "text": Math.round(maxY * 100) + "%"
    // }).animate({"y": y}, 300);
  };

  return Percentage;
});
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
})('HoverLine', function (require) {
  var DataV = require('DataV');
  var HoverLine = DataV.extend(DataV.Chart, {
    initialize: function () {
    }
  });

  HoverLine.prototype.render = function () {
    this.clear();
    var paper = this.owner.paper;
    var conf = this.defaults;
    this.indicatorLine = paper.path("M0 0V" + conf.chartHeight).attr({
      stroke: "none",
      "stroke-width": 1,
      "stroke-dasharray": "- "
    });
    this.highlightLine = paper.path("M0 0V" + conf.chartHeight).attr({
      stroke: "none",
      "stroke-width": 2
    });
  };
  HoverLine.prototype.hidden = function () {
    this.indicatorLine.attr({"stroke": "none"});
    this.highlightLine.attr({"stroke": "none"});
  };
  HoverLine.prototype.show = function () {
    this.indicatorLine.attr({"stroke": "#000"});
    this.highlightLine.attr({"stroke": "white"});
  };

  HoverLine.prototype.refresh = function (columnIndex, rowIndex) {
    //refresh lines' position
    var owner = this.owner;
    var pathSource = owner.pathSource;
    var lineX = this.defaults.chartWidth * columnIndex / (owner.columnCount - 1);
    var pathSourceCell = pathSource[pathSource.length - 1][columnIndex];
    this.indicatorLine.attr({
      path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSource[0][columnIndex].y0
    });

    if (typeof rowIndex !== 'undefined') {
      pathSourceCell = pathSource[rowIndex][columnIndex];
      this.highlightLine.attr({
        path: "M" + lineX + " " + (pathSourceCell.y0 - pathSourceCell.y) + "V" + pathSourceCell.y0
      });

      if (rowIndex === 0) {
        this.highlightLine.attr({"cursor": "pointer"});
      } else {
        this.highlightLine.attr({"cursor": "auto"});
      }
    }
  };

  HoverLine.prototype.clear = function () {
    this.indicatorLine && this.indicatorLine.remove();
    this.highlightLine && this.highlightLine.remove();
  };

  return HoverLine;
});

/*global Raphael, d3, $, define, _ */
/*!
 * PathLabel的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('PathLabel', function (require) {
  var DataV = require('DataV');
  //pathLabel
  var PathLabel = DataV.extend(DataV.Chart, {
    initialize: function () {
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

  PathLabel.prototype.render = function () {
    this.clear();
    var that = this;
    var owner = this.owner;
    var paths = owner.paths;
    var conf = this.defaults;
    var pathSource = owner.pathSource;
    var labels = [];
    var getLabelLocation = function (locArray, el) {
      var x = 0,
        y = 0,
        i;
      var ratioMargin = 0.15;
      var index = 0;
      var max = 0;
      var box = el.getBBox();
      var xInterval;
      var minTop, maxBottom;
      var showLabel = true;
      var loc;
      var height;

      xInterval = Math.ceil(box.width / (locArray[1].x - locArray[0].x) / 2);
      if (xInterval === 0) {
        xInterval = 1;
      }

      locArray.forEach(function (d, i, array) {
        var m = Math.max(ratioMargin * array.length, xInterval);
        if (i >= m && i <= array.length - m) {
          if (d.y > max) {
            minTop = d.y0 - d.y;
            maxBottom = d.y0;
            max = d.y;
            index = i;
          }
        }
      });
      for (i = index - xInterval; i <= index + xInterval; i++) {
        if (i < 0 || i >= locArray.length) {
            height = 0;
            showLabel = false;
            break;
        }
        loc = locArray[i];
        //top's y is small
        if (loc.y0 - loc.y > minTop) {
            minTop = loc.y0 - loc.y;
        }
        if (loc.y0 < maxBottom) {
            maxBottom = loc.y0;
        }
      }

      if (showLabel && maxBottom - minTop >= box.height * 0.8) {
        x = locArray[index].x;
        y = (minTop + maxBottom) / 2;
      } else {
        showLabel = false;
      }

      return {
        x: x,
        y: y,
        showLabel: showLabel
      };
    };

    var getPathLabel = this.defaults.getPathLabel || this.getPathLabel;
    var selected;
    //var values = _.values(this.groupedByType);
    var values = _.values(this.sorted);
    if (!conf.more) {
      selected = values.slice(0);
    } else {
      selected = DataV.more(values, conf.level, conf.max, function (remains) {
        var obj = {};
        obj.type = conf.moreLabel;
        obj.rank = remains[0].rank;
        obj.sum = DataV.sum(remains, "sum");
        return obj;
      });
    }
    for (var i = 0, l = paths.length; i < l; i++) {
      var path = paths[i];
      var row = selected[i];
      var obj = {
        type: row.type,
        rank: row.rank,
        sum: row.sum,
        total: this.total
      };
      var text = getPathLabel.call(this, obj);
      var label = owner.paper.text(0, 0, text).attr({
        "textAnchor": "middle",
        "fill": "white",
        "fontSize": conf.fontSize,
        "fontFamily": "微软雅黑"
      });
      label.labelLoc = getLabelLocation(pathSource[i], label);

      if (label.labelLoc.showLabel) {
        label.attr({
          "x": label.labelLoc.x,
          "y": label.labelLoc.y
        });
      } else {
        label.attr({"opacity": 0});
      }

      path.attr({"cursor": "auto"});
      label.attr({"cursor": "auto"});
      labels.push(label);
    }
    this.labels = labels;
  };

  /**
   * 生成标签的默认方法，可以通过`setOption({getPathLable: function});`覆盖。
   * Properties:
   * - `type`, 条带类型
   * - `rank`, 条带排名
   * - `sum`, 当前条带总值
   * - `total`, 所有条带总值
   * @param {Object} obj 当前条带的对象
   */
  PathLabel.prototype.getPathLabel = function (obj) {
    return obj.type + " " + "排名: 第" + obj.rank;
  };

  PathLabel.prototype.hidden = function () {
    this.labels.forEach(function (d) {
      d.hide();
    });
  };

  PathLabel.prototype.show = function () {
    this.labels.forEach(function (d) {
      if (d.labelLoc.showLabel) {
        d.show();
      }
    });
  };

  PathLabel.prototype.clear = function () {
    if (this.labels) {
      this.labels.forEach(function (d) {
        d.remove();
      });
    }
  };

  PathLabel.prototype.setSource = function (source, map) {
    var that = this;
    this.map(map);
    this.groupedByType = _.groupBy(source, this.mapping.type);
    var sorted = _.sortBy(this.groupedByType, function (group, type) {
      var sum = DataV.sum(group, that.mapping.value);
      that.groupedByType[type].sum = sum;
      that.groupedByType[type].type = type;
      return -sum;
    });
    this.sorted = sorted;
    this.types = _.keys(this.groupedByType);
    _.each(sorted, function (list, index) {
      that.groupedByType[list[0][that.mapping.type]].rank = index + 1;
    });
    this.total = DataV.sum(_.map(that.groupedByType, function (group) {
      return group.sum;
    }));
  };

  return PathLabel;
});

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
})('Cover', function (require) {
  var DataV = require('DataV');
  //cover
  var Cover = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      var conf = this.defaults;
      this.node = $(container);
      this.node.css({
        "position": "absolute",
        "left": 0,
        "top": 0,
        "width": conf.chartWidth,
        "height": conf.chartHeight,
        "zIndex": 100,
        "visibility": "hidden"
      }).bind("mousemove", $.proxy(function (e) {
        this.mouse = {x: e.pageX, y: e.pageY};
        e.stopPropagation();
      }, this)).bind("mouseleave", $.proxy(function () {
        this.mouse = undefined;
      }, this));
    }
  });

  return Cover;
});
/*global Raphael, d3, $, define, _ */
/*!
 * Stream的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Stream', function (require) {
  var DataV = require('DataV');
  var HoverLine = require('HoverLine');
  var PathLabel = require('PathLabel');
  //streamChart
  var Stream = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.node = this.checkContainer(node);

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

      this.defaults.width = 500;
      this.defaults.height = 300;
      this.defaults.offset = "expand";//zero, expand, silhou-ette, wiggle;
      this.defaults.order = "default";//default, reverse, inside-out //in this Stream application, it will always be default, the real order is adjusted in Stream's data-process.
      this.defaults.animateDuration = 750;
      this.defaults.animateOrder = undefined;
      this.paths = undefined;
      this.source = undefined;
      this.layoutData = undefined;
      this.pathSource = undefined; 
      this.setOptions(options);
      this.createPaper();
    }
  });

  Stream.prototype.createPaper = function () {
    var conf = this.defaults;
    this.paper = new Raphael(this.node, conf.width, conf.height);
  };

  Stream.prototype.setSource = function (source, map) {
    this.map(map);
    this.rawData = source;
    this.rawMap = map;
    var that = this;
    // 按类型分组
    var grouped = _.groupBy(source, this.mapping.type);
    this.rowCount = _.keys(grouped).length;
    this.columnCount = _.keys(_.groupBy(source, this.mapping.x)).length;
    // 组内按横轴排序
    _.forEach(grouped, function (group, type) {
      grouped[type] = _.sortBy(group, that.mapping.x);
    });
    this.sorted = _.sortBy(grouped, function (group) {
      return 0 - DataV.sum(group, that.mapping.value);
    });

    this.remaped = this.remapSource();
    this.layoutData = this.getLayoutData();
  };

  Stream.prototype.remapSource = function () {
    var sorted = this.sorted;
    var remap = [];
    for (var j = 0; j < this.columnCount; j++) {
      var plucked = _.pluck(sorted, j);
      var sum = DataV.sum(plucked, this.mapping.value);
      for (var i = 0; i < this.rowCount; i++) {
        remap[i] = remap[i] || [];
        remap[i][j] = {};
        remap[i][j].x = j;
        var rate = sorted[i][j][this.mapping.value] / sum;
        remap[i][j].y = rate;
        sorted[i][j].rate = rate;
      }
    }
    return remap;
  };

  /*!
   * 获取等级数据
   */
  Stream.prototype.getLayoutData = function () {
    var conf = this.defaults;
    var remaped = this.remaped;
    var that = this;

    if (!conf.more) {
      return remaped;
    } else {
      return DataV.more(remaped, conf.level, conf.max, function (remains) {
        var obj = [];
        for (var i = 0; i < that.columnCount; i++) {
          obj.push({
            x: i,
            y: DataV.sum(_.pluck(remains, i), 'y')
          });
        }
        return obj;
      });
    }
  };

  Stream.prototype.layout = function () {
    var conf = this.defaults;
    d3.layout.stack().offset(conf.offset).order(conf.order)(this.layoutData);
  };

  Stream.prototype.generateChartElements = function () {
    var conf = this.defaults;
    var paper = this.paper,
      paths = [];
    var area = this.generateArea();
    var colorFunc = this.getColor();

    // set div's background instread;
    paper.rect(0, 0, conf.chartWidth, conf.chartHeight).attr({
      "stroke": "none",
      "fill": "#e0e0e0"
    });

    for (var i = 0, l = this.layoutData.length; i < l; i++) {
      var areaString = area(this.pathSource[i]);
      var color = colorFunc(i);
      var path = paper.path(areaString).attr({
        fill: color,
        stroke: color,
        "stroke-width": 1
      });
      paths[i] = path;
    }
    this.paths = paths;
  };

  Stream.prototype.render = function (animate) {
    if (animate !== "animate") {
      this.clear();
      this.layout();
      this.generateChartElements();
    } else {
      this.layout();
      this.animate();
    }
    //hoverLine
    this.hoverLine = this.own(new HoverLine());
    this.hoverLine.render();//lines should be to front, so at last
    //pathLabel
    if (this.defaults.pathLabel) {
      this.pathLabel = this.own(new PathLabel());
      this.pathLabel.setSource(this.rawData, this.rawMap);
      this.pathLabel.render();
    }
    this.createInteractive();
  };

  Stream.prototype.animate = function () {
    var time = 0,
      area,
      colorFunc,
      color,
      i, l,
      _area,
      paths = [],
      order,
      anim,
      count = this.paths.length;
    var that = this;
    var animateCallback = function () {
      count -= 1;
      if (count > 0) {
        return;
      }
      that.animateCallback();
    };
    if (typeof this.defaults.animateDuration !== 'undefined') {
      time = this.defaults.animateDuration;
    }

    // if paths have not been created
    if (typeof this.paths === 'undefined') {
      this.generateChartElements();
    }

    area = this.generateArea();
    colorFunc = this.getColor();
    if (typeof this.defaults.animateOrder !== 'undefined') {
      order = this.defaults.animateOrder;
    } else {
      order = d3.range(this.pathSource.length);
    }
    for (i = 0, l = this.pathSource.length; i < l; i++) {
      _area = area(this.pathSource[i]);
      paths.push(_area);
    }
    for (i = 0, l = this.pathSource.length; i < l; i++) {
      color = colorFunc(i);
      anim = Raphael.animation({"path": paths[i]}, time, animateCallback);
      this.paths[order[i]].animate(anim);
    }
  };

  Stream.prototype.animateCallback = function () {
    var newOrderPaths = [];
    var that = this;
    if (typeof this.defaults.animateOrder !== 'undefined') {
      this.defaults.animateOrder.forEach(function (d, i) {
        newOrderPaths[i] = that.paths[d];
      });
      this.paths = newOrderPaths;
    }
  };

  Stream.prototype.clear = function () {
    this.paper.clear();
  };

  Stream.prototype.getColor = function (colorJson) {
    var colorMatrix = DataV.getColor();
    var color;
    var colorStyle = colorJson || {};
    var colorMode = colorStyle.mode || 'default';
    var i, l;

    switch (colorMode) {
    case "gradient":
      l = this.source.length;
      // 最大为 colorMatrix.length - 1
      var colorL = Math.min(Math.round(l / 5), colorMatrix.length - 1);
      var testColor = [colorMatrix[0][0], colorMatrix[colorL][0]];
      var test1 = DataV.gradientColor(testColor, "special");
      var testColorMatrix = [];
      var testColorMatrix1 = [];
      for (i = 0; i < l; i++) {
        testColorMatrix.push([test1(i / (l - 1)), test1(i / (l - 1))]);
      }

      for (i = l - 1; i >= 0; i--) {
        testColorMatrix1.push(testColorMatrix[i]);
      }
      colorMatrix = testColorMatrix;
      break;
    case "random":
    case "default":
      break;
    }

    var ratio = colorStyle.ratio || 0;
    ratio = Math.max(ratio, 0);
    ratio = Math.min(ratio, 1);

    var colorArray = colorMatrix.map(function () {
      return d3.interpolateRgb.apply(null, [colorMatrix[i][0], colorMatrix[i][1]])(ratio);
    });
    color = d3.scale.ordinal().range(colorArray);

    return color;
  };

  /*

   */
  Stream.prototype.getColor = function () {
    var count = this.layoutData.length;
    var color = this.defaults.gradientColor || ["#8be62f", "#1F4FD8"];
    var gradientColor = DataV.gradientColor(color, "special");
    var percent = 1 / count;
    var gotColors = [];

    for (var i = 0; i < count; i++) {
      gotColors.push(gradientColor(i * percent));
    }
    var midderNum = Math.floor(count / 2);
    return function (num) {
      return num % 2 === 0 ? gotColors[midderNum + num / 2] : gotColors[midderNum - (num + 1) / 2];
    };
  };

  Stream.prototype.getMaxY = function () {
    return d3.max(this.layoutData, function (d) {
      return d3.max(d, function (d) {
        return d.y0 + d.y;
      });
    });
  };

  Stream.prototype.mapPathSource = function () {
    var conf = this.defaults,
      maxX = this.layoutData[0].length - 1,
      maxY = this.getMaxY(), 
      width = conf.chartWidth,
      height = conf.chartHeight;

    this.pathSource = [];
    for (var i = 0, l = this.layoutData.length; i < l; i++) {
      this.pathSource[i] = [];
      for (var j = 0, l2 = this.layoutData[0].length; j < l2; j++) {
        var s = this.layoutData[i][j];
        var ps = this.pathSource[i][j] = {};
        ps.x = s.x * width / maxX;
        ps.y0 = height - s.y0 * height / maxY;
        ps.y = s.y * height / maxY;
      }
    }
  };

  Stream.prototype.generateArea = function () {
    this.mapPathSource();
    var area = d3.svg.area().x(function (d) {
      return d.x;
    }).y0(function (d) {
      return d.y0;
    }).y1(function (d) {
      return d.y0 - d.y; 
    });
    return area;
  };

  Stream.prototype.highlight = function (index) {
    if (typeof index !== 'undefined') {
      this.paths[index].attr({"opacity": 0.5, "stroke-width": 0});
    }
  };
  Stream.prototype.lowlight = function (index) {
    if (typeof index !== 'undefined') {
      this.paths[index].attr({"opacity": 1, "stroke-width": 1});
    }
  };

  Stream.prototype.createInteractive = function () {
    $(this.paper.canvas).unbind();//prevent event rebind.

    //refactor stream chart's animate function, especially change the callback
    var stream = this;
    this.animateCallback = function () {
      var newOrderPaths = [];
      var that = this;
      if (typeof this.defaults.animateOrder !== 'undefined') {
        this.defaults.animateOrder.forEach(function (d, i) {
          newOrderPaths[i] = that.paths[d];
        });
        this.paths = newOrderPaths;
      }

      stream.cover.hidden();
      if (typeof stream.cover.mouse !== 'undefined') {
        stream.hoverLine.show();
        stream.floatTag.show();
        var mouse = stream.cover.mouse;
        $(stream.paper.canvas).trigger("mousemove", [mouse.x, mouse.y]);
        $(stream.floatTag).trigger("mousemove", [mouse.x, mouse.y]);
        stream.cover.mouse = undefined;
      }

      stream.pathLabel.show();
    };

    //chart mouseenter
    var mouseenter = function () {
      stream.hoverLine.show();
      stream.fire('enter');
    };

    //chart mouseleave
    var mouseleave = function () {
      stream.hoverLine.hidden();
      //recover prepath;
      if (typeof stream.preIndex !== 'undefined') {
        stream.lowlight(stream.preIndex);
      }
      stream.fire('leave', stream.preIndex);
      stream.preIndex = undefined;
    };

    //chart click
    var click = function () {};

    //chart mousemove
    var mousemove = function (e, pageX, pageY) {
      var offset = $(this).parent().offset();
      var x = (e.pageX || pageX) - offset.left,
        y = (e.pageY || pageY) - offset.top;
      var pathSource = stream.pathSource,
        rowIndex;
      var columnIndex = Math.floor((x / (stream.defaults.chartWidth / (stream.columnCount - 1) / 2) + 1) / 2);
      //get path and pathIndex
      for (var i = 0, l = pathSource.length; i < l; i++) {
        if (y >= pathSource[i][columnIndex].y0 - pathSource[i][columnIndex].y && y <= pathSource[i][columnIndex].y0) {
          rowIndex = i;
          break;
        }
      }

      //recover prepath;
      if (typeof stream.preIndex !== 'undefined') {
        stream.lowlight(stream.preIndex);
      }
      stream.highlight(rowIndex);

      stream.fire('move', stream.preIndex, rowIndex, columnIndex);
      //set indicator and highlight line new position
      stream.hoverLine.refresh(columnIndex, rowIndex);
      //customevent;
      if (stream.defaults.customEventHandle.mousemove) {
        stream.defaults.customEventHandle.mousemove.call(stream,
          {"timeIndex": columnIndex, "rowIndex": rowIndex});
      }
      //change new path;
      stream.preIndex = rowIndex;
    };
    $(this.paper.canvas).bind("mouseenter", mouseenter)
      .bind("mouseleave", mouseleave)
      .bind("click", click)
      .bind("mousemove", mousemove);
  };

  return Stream;
});

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
