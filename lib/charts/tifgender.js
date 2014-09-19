var TifGender = function (config) {
  //  4 params must need
  var width = config.width || 320,
      height = config.height || 190;
  var container = typeof config.container === "string" ? document.getElementById(config.container) : config.container; // id or dom node
  $(container).css({'position': 'relative'});
  var data = config.data || [{name: "男", value: 40}, {name: "女", value: 60}];

  //  other optional params
  var margin = config.margin || {
    "top": 1,
    "left": 1,
    "bottom": 1,
    "right": 1
  };
  var highlightColor = config.highlightColor || '#3391d4';
  var clickHandle = config.clickHandle || function (d, i) {
    //console.log(d.name);
  };
  var color = this.color = typeof data[0].color !== 'undefined' ?
    data.map(function (d) { return d.color; }) :
    ["#3fa9f5", "#ff88a2",  "#909dd0", "#909dd0", "#ff88a2", "#ff88a2", "#ff88a2"];

  var rotateAngle = Math.PI / 6;

  var w = width - margin.left - margin.right;
  var h = height - margin.top - margin.bottom;
  var r = Math.min(w, h) / 2;
  var center = [margin.left + w / 2, margin.top + h / 2];

  // data process;
  data.forEach(function (d) {
    d.isNull = d.value === null;
    d.v = d.isNull ? 0 : d.value;
  });
  var all = data.every(function (d) {
      return !d.isNull;
    });
  var sum = data[0].v + data[1].v;
  var ratio1 = all ?
    (sum === 0 ? 0.5 : data[0].v / sum) :
    (data[0].isNull ? 0 : 1);
  ratio1 = Math.max(0.000001, Math.min(0.999999, ratio1));//between 0.001 and 0.999 to ensure arc would always be drawn.
  var angle1 = Math.PI * 2 * ratio1;
  var angleStart = -angle1 / 2 - rotateAngle;
  var angleEnd = angleStart + angle1;
  var p1 = [center[0] + r * Math.cos(angleStart), center[1] + r * Math.sin(angleStart)];
  var p2 = [center[0] + r * Math.cos(angleEnd), center[1] + r * Math.sin(angleEnd)];

  //draw circle
  var paper = this.paper = new Raphael(container, width, height);
  var pie1 = this.pie1 = paper.path(
        "M" + center[0] + "," + center[1] +
      "L" + p1[0] + "," + p1[1] +
      "A" + r + "," + r + " 0, " + (ratio1 > 0.5 ? "1" : "0") + "," + "1 " +
      p2[0] + "," + p2[1] + "Z"
      );
  var pie2 = this.pie2 = paper.path(
        "M" + center[0] + "," + center[1] +
      "L" + p1[0] + "," + p1[1] +
      "A" + r + "," + r + " 0, " + (ratio1 > 0.5 ? "0" : "1") + "," + "0 " +
      p2[0] + "," + p2[1] + "Z"
      );
  pie1.attr({
    'cursor': 'pointer',
    'stroke-width': 2,
    'stroke': '#fff',
    'fill': color[0]
  });
  pie2.attr({
    'cursor': 'pointer',
    'stroke-width': 2,
    'stroke': '#fff',
    'fill': color[1]
  });
  var pies = this.pies = [pie1, pie2];

  // draw ratios
  var trans = [
    [r * 1.3 * Math.cos(rotateAngle) + 0.2 * r, -r * 1.3 * Math.sin(rotateAngle) - 0.1 * r],
    [-r * 1.3 * Math.cos(rotateAngle) - 0.8 * r, r * 1.3 * Math.sin(rotateAngle) - 0.2 * r]
  ];
  var ratios = this.ratios = [paper.set(), paper.set()];
  ratios.forEach(function (d, i) {
    if (data[i].isNull) {
      return;
    }
    var v = i === 0 ? Math.round(ratio1 * 100) : 100 - Math.round(ratio1 * 100);
    var numberCount = v < 10 ?  1 : (v === 100 ?  3 : 2);
    d.push(
      paper.text(center[0], center[1] + 10, v).attr({
        "fill": color[i],
        "font-size": "26px",
        "text-anchor": "start"
      }),
      paper.text(center[0] + 15 * numberCount, center[1] + 13, "%").attr({
        "fill": color[i],
        "font-size": "16px",
        "text-anchor": "start"
      })
    );
    d.attr({
      "transform": "translate(t" + trans[i][0] + "," + trans[i][1] + ")"
    });
  });

  // draw title
  var titles = this.titles = [];
  data.forEach(function (d, i) {
    var t = titles[i] = $("<div>" + data[i].name + "</div>").css({
      'position': 'absolute',
      'left': center[0] + trans[i][0],
      'top': center[1] + trans[i][1] - 27,
      'border-radius': 3,
      'padding': 1,
      'cursor': 'pointer',
      'font-size': 14
    }).appendTo($(container));
    if (!all && !data[i].isNull) {
      t.css({
        'border': 'solid 1px black',
        'background-color': highlightColor
      });
    }
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
    pies[i].hover(hoverIn, hoverOut);
    pies[i].click(click);
    titles[i].on("mouseenter", hoverIn);
    titles[i].on("mouseleave", hoverOut);
    titles[i].on("click", click);
  });
};