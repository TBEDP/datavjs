/**
* TifBarLevel
*/
var TifBarLevel = function (config) {
  //  4 params must need
  var width = config.width || 320,
      height = config.height || 190;
  var container = typeof config.container === "string" ? document.getElementById(config.container) : config.container; // id or dom node
  var data = config.data || [{name: "18", value: 40}, {name: "25", value: 60}];

  //  other optional params
  var nullWidth = config.nullWidth || 2;
  var nullColor = config.nullColor || 'gray';
  var highlightColor = config.highlightColor || '#3391d4';
  var clickHandle = config.clickHandle || function (d, i) {
    //console.log(d.name);
  };
  var margin = config.margin || {
    "top": 1,
    "left": 1,
    "bottom": 1,
    "right": 1
  };
  var color = this.color = typeof data[0].color !== 'undefined' ?
    data.map(function (d) { return d.color; }) :
    d3.range(data.length).map(function () { return "#3fa9f5"; });
  var wordSpacing = config.wordSpacing || 10; // distance between word and bar

  var titleDefaultStyle = config.titleDefaultStyle || {
    'cursor': 'pointer',
    'border': 'solid 1px #fff',
    'display': 'inline-block',
    'border-radius': 3,
    "font-family": "微软雅黑",
    "font-size": "12px",
    'padding': 1
  };

  var w = height - margin.left - margin.right;
  var h = width - margin.top - margin.bottom;
  var barH = h / data.length;

  // data process;
  var notNullCount = 0;
  data.forEach(function (d) {
    d.isNull = (d.value === null);
    d.v = (d.isNull ? 0 : d.value);
    if (!d.isNull) {
      notNullCount += 1;
    }
  });
  var all = data.every(function (d) {
    return !d.isNull;
  });
  var sum = d3.sum(data, function (d) { return d.v; });
  var max = d3.max(data, function (d) { return d.v; });
  var ratioArr = this.ratioArr = data.map(function (d) {
    if (d.isNull) {
      d.ratio = 0;
    } else {
      d.ratio = sum === 0 ? 0 : (d.v / sum);
    }
    return d.ratio;
  });
  var wArr = this.wArr = data.map(function (d) {
    return max === 0 ? nullWidth : (w - nullWidth) * d.value / max + nullWidth;
  });

  //draw bar
  $(container).css("position", "relative");
  var paper = this.paper = new Raphael(container, width, height);
  var rects = this.rects = paper.set();
  data.forEach(function (d, i) {
    var rect = paper.rect(margin.top + barH * i, margin.top + w - wArr[i], barH, wArr[i] + h / 3)
      .attr({
        "r": 3,
        "cursor": "pointer",
        "fill": d.isNull ? nullColor : color[i],
        "stroke-width": 1,
        "stroke": "#fff"
      });
      console.log(margin.left);
    rects.push(rect);
  });

  // draw words
  var ratioWord = this.ratioWord = paper.set();
  var titles = this.titles = [];
  //var nameWord = this.nameWord = paper.set();
  //var nameBackground = this.nameBackground = paper.set();
  ratioArr.forEach(function (d, i) {
    if (data[i].isNull) {
      return;
    }
    var text = paper.text( 
      margin.top + barH * (i + 0.5) - wordSpacing * 1.5, 
      margin.top + w - wArr[i] - 15,
      Math.round(d * 1000) / 10 + "%" //text string
    ).attr({
      "text-anchor": "start",
      "fill": color[i]
    });
    ratioWord.push(text);
  });
  ratioWord.attr({
    "font-size": "14px"
  });

  data.forEach(function (d, i) {
    var title = $('<div>' + d.name + '</div>').css(titleDefaultStyle);
    if (!all && !d.isNull) {
      title.css({
        'border': 'solid 1px black',
        'background-color': highlightColor
      });
    }
    title.appendTo($(container));
    var tw = title.width();
    var th = title.outerHeight();
    title.css({
      'position': 'absolute',
      'left': margin.top + barH * (i + 0.5) - th,
      'top': h - margin.top * 1.3,
      'text-align': 'right'
    });
    titles.push(title);
  });

  //interaction
  //hover
  var getHoverIn = function (i) {
    var index = i;
    var needChange = !(!all && !data[i].isNull);
    return function () {
      if (needChange) {
        titles[index].css({
          'border': 'solid 1px black',
          'background-color': highlightColor
        });
      }
    };
  };
  var getHoverOut = function (i) {
    var index = i;
    var needChange = !(!all && !data[i].isNull);
    return function () {
      if (needChange) {
        titles[index].css({
          'border': 'solid 1px #fff',
          'background-color': '#fff'
        });
      }
    };
  };
  //click
  var getClick = function (i) {
    var index = i;
    return function () {
      clickHandle(data[index], index);
    };
  };
  data.forEach(function (d, i) {
    var hoverIn = getHoverIn(i);
    var hoverOut = getHoverOut(i);
    var click = getClick(i);
    rects[i].hover(hoverIn, hoverOut);
    rects[i].click(click);
    titles[i].on("mouseenter", hoverIn);
    titles[i].on("mouseleave", hoverOut);
    titles[i].on("click", click);
  });

};