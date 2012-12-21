/*global Raphael, d3 */
/*!
 * Force的兼容性定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) {
      return this[id];
    });
  }
})('Force', function (require) {
  var DataV = require('DataV');
  /**
   * 构造函数
   * @param {Object} node 表示在html的哪个容器中绘制该组件
   * @param {Object} options 为用户自定义的组件的属性，比如画布大小
   */
  var Force = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Force";
      this.node = this.checkContainer(node);
      this.net = {};
      this.linkValeMin = 0;
      this.linkValeMax = 1;
      this.nodeValueMin = 0;
      this.nodeValueMax = 1;
      this.clicked = false;
      this.clickedNum = -1;
      this.legendClicked = false;

      // Properties
      this.font = {};
      /**
       * 节点id
       */
      this.dimension.nodeId = {
        type: "number",
        required: true,
        index: 0,
      };
      /**
       * 节点名称
       */
      this.dimension.nodeName = {
        type: "string",
        required: true,
        index: 1
      };
      /**
       * 节点值
       */
      this.dimension.nodeValue = {
        type: "number",
        required: true,
        index: 2
      };
      /**
       * 边源头节点
       */
      this.dimension.linkSource = {
        type: "number",
        required: true,
        index: 3
      };
      /**
       * 边指向节点
       */
      this.dimension.linkTarget = {
        type: "number",
        required: true,
        index: 4
      };
      /**
       * 边值
       */
      this.dimension.linkValue = {
        type: "number",
        required: true,
        index: 5
      };
      // Canvas
      this.defaults.legend = true;
      this.defaults.width = 500;
      this.defaults.height = 500;
      this.defaults.linkLength = 50;
      this.defaults.linkWidth = 2;
      this.defaults.classNum = 6;
      this.defaults.forceValue = 10;
      this.defaults.iterate = 100;
      this.defaults.browserName = navigator.appName;

      this.setOptions(options);
      this.defaults.charge = -(this.defaults.width + this.defaults.height) / this.defaults.forceValue;
      this.legendArea = [20, (this.defaults.height - 20 - this.defaults.classNum * 20), 200, 220];
      if (this.defaults.legend) {
        this.xOffset = this.legendArea[2];
      } else {
        this.xOffset = 0;
      }

      this.createCanvas();
    }
  });


  /*!
   *Strings in CSV to Numbers
   * @param {Number} value the value of the elemnts in csv table
   */
  Force.prototype._toNum = function (value) {
    var type = typeof value;
    if (type === "number") {
      return value;
    } else if (type === "string" && value !== "") {
      return parseInt(value, 10);
    } else {
      return 1;
    }
  };

  /**
   * Set CSV content to force-directed net
   * @param {Array} table the csv table to be rendered
   */
  Force.prototype.setSource = function (table, map) {
    map = this.map(map);
    //this.net = json;
    if (table[0][0] === "node") {
      table = table.slice(1);
    }
    var nData = [];
    var lData = [];
    var isNode = true;
    var nodeNum;
    var that = this;
    table.forEach(function (d, i) {
      var value;
      if (isNode) {
        if (d[map.nodeId] === "link") {
          isNode = false;
          nodeNum = i + 1;
        } else {
          if (d[map.nodeId] === "") {
            throw new Error("ID can not be empty(line:" + (i + 1) + ").");
          }
          value = that._toNum(d[map.nodeValue]);
          nData[i] = {
            name: d[map.nodeName],
            nodeValue: value
          };
          if (i === 0) {
            that.nodeValueMin = value;
            that.nodeValueMax = value;
          }
          that.nodeValueMin = (value < that.nodeValueMin) ? value : that.nodeValueMin;
          that.nodeValueMax = (value > that.nodeValueMax) ? value : that.nodeValueMax;
        }
      } else {
        if (d[map.linkSource - 3] === "") {
          throw new Error("Source can not be empty(line:" + (i + 1) + ").");
        }
        if (d[map.linkTarget - 3] === "") {
          throw new Error("Target can not be empty(line:" + (i + 1) + ").");
        }
        value = that._toNum(d[map.linkValue - 3]);
        lData[i - nodeNum] = {
          source: that._toNum(d[map.linkSource - 3]),
          target: that._toNum(d[map.linkTarget - 3]),
          value: that._toNum(d[map.linkValue - 3])
        };
        if (i === nodeNum) {
          that.linkValueMin = value;
          that.linkValueMax = value;
        }
        that.linkValueMin = (value < that.linkValueMin) ? value : that.linkValueMin;
        that.linkValueMax = (value > that.linkValueMax) ? value : that.linkValueMax;
      }
    });
    this.net.nodes = nData;
    this.net.links = lData;
    this.nodeValueMax++;
    this.linkValueMax++;
  };


  /**
   * 创建画布
   */
  Force.prototype.createCanvas = function () {
    var conf = this.defaults;
    this.canvas = new Raphael(this.node, conf.width, conf.height);
    //var c = this.canvas.circle(50, 50, 40);
  };

  /**
   * 获取节点颜色
   * @param {Number} i 元素类别编号
   * @return {String} 返回颜色值
   */
  Force.prototype.getColor = function (i) {
    var color = DataV.getColor(this.classNum);
    //var k = color.length * (i - this.nodeValueMin-0.1) / (this.nodeValueMax - this.nodeValueMin);
    //if (k < 0) k = 0;
    return color[i % color.length][0];
  };

  /**
   * 获取节点的半径
   * @param {Number} value 元素对应的数据值
   * @return {Number} 返回半径值
   */
  Force.prototype.getRadius = function (value) {
    var conf = this.defaults;
    return 16.0 * (value - this.nodeValueMin) / (this.nodeValueMax - this.nodeValueMin) + 8;
  };


  /**
   * 获取节点透明度
   * @param {Number} value 元素类别编号
   * @return {Number} 返回透明度值
   */
  Force.prototype.getOpacity = function (value) {
    return 0.083 * (value - this.linkValueMin) / (this.linkValueMax - this.linkValueMin) + 0.078;
  };

  /**
   * update the layout by modify the attributes of nodes and links
   */
  Force.prototype.update = function () {
    var that = this;
    var conf = this.defaults;
    var canvas = this.canvas;

    this.nodes = this.canvas.set();
    this.links = this.canvas.set();
    var nodes = this.nodes;
    var links = this.links;
    var i, j, temp;
    this.force.charge(conf.charge).nodes(this.net.nodes).links(this.net.links).start();

    var nodesData = this.net.nodes;
    var linksData = this.net.links;
    var nodesNum = nodesData.length;
    var linksNum = linksData.length;
    var connectMatrix = [];
    var linkMatrix = [];
    conf.iterate = (nodesNum + linksNum) * 2;

    var onMouseClick = function () {
      that.legendClicked = false;
      that.underBn.forEach(function (d) {
        d.hide();
        d.data('clicked', false);
      });
      that.clicked = true;
      if (!this.data('clicked')) {
        if (conf.browserName !== "Microsoft Internet Explorer") {
          that.force.linkDistance(conf.linkLength * 2).charge(conf.charge * 2).start();
        }
        that.nodes.forEach(function (d) {
          d.data('rect').hide();
          d.data('text').hide();
          d.attr({
            "opacity": 0.2
          });
          d.data('clicked', false);
          d.data('showText', false);
        });
        that.links.forEach(function (d) {
          d.attr({
            'stroke-opacity': 0.0
          });
        });
        that.clickedNum = this.data('index');
        this.data('clicked', true);
        this.data("link").forEach(function (d) {
          d.attr({
            "stroke-opacity": d.data('opacity')
          });
        });
        this.data("node").forEach(function (d) {
          d.attr({
            "opacity": 0.9
          });
          d.data('showText', true);
        });
        that.underBn[this.data('colorType')].data('clicked', true).attr('opacity', 1).show();
      } else {
        that.clicked = false;
        if (conf.browserName !== "Microsoft Internet Explorer") {
          that.force.linkDistance(conf.linkLength).charge(conf.charge).start();
        }
        nodes.forEach(function (d) {
          d.attr({
            "opacity": 0.9
          });
          if (d.data('big')) {
            d.data('showText', true);
          } else {
            d.data('rect').hide();
            d.data('text').hide();
            d.data('showText', false);
          }
        });
        links.forEach(function (d) {
          d.attr({
            'stroke-opacity': d.data('opacity')
          });
        });
        this.data('clicked', false);
        that.underBn[this.data('colorType')].hide();
      }
    };

    var onCanvasClick = function () {
      that.legendClicked = false;
      that.underBn.forEach(function (d) {
        d.hide();
        d.data('clicked', false);
      });
      that.clicked = false;
      if (conf.browserName !== "Microsoft Internet Explorer") {
        that.force.linkDistance(conf.linkLength).charge(conf.charge).start();
      } else {
        that.force.resume();
      }
      nodes.forEach(function (d) {
        d.attr({
          "opacity": 0.9
        });
        if (d.data('big')) {
          d.data('showText', true);
        } else {
          d.data('rect').hide();
          d.data('text').hide();
          d.data('showText', false);
        }
      });
      links.forEach(function (d) {
        d.attr({
          'stroke-opacity': d.data('opacity')
        });
      });
    };

    var topValue = [];
    var topId = [];
    var topNum = 10;
    if (nodesNum < 10) {
      topNum = nodesNum;
    }
    for (i = 0; i < topNum; i++) {
      topValue[i] = nodesData[i].nodeValue;
      topId[i] = i;
    }
    for (i = 0; i < topNum; i++) {
      for (j = 1; j < topNum - i; j++) {
        if (topValue[j] < topValue[j - 1]) {
          temp = topValue[j];
          topValue[j] = topValue[j - 1];
          topValue[j - 1] = temp;
          temp = topId[j];
          topId[j] = topId[j - 1];
          topId[j - 1] = temp;
        }
      }
    }
    //rapheal绘制部分
    for (i = 0; i < nodesNum; i++) {
      nodesData[i].x = (conf.width + this.xOffset) / 2;
      nodesData[i].y = conf.height / 2;
      var n = nodesData[i];
      var k = Math.floor(conf.classNum * (n.nodeValue - this.nodeValueMin) / (this.nodeValueMax - this.nodeValueMin));
      if (k >= conf.classNum) k = conf.classNum - 1;
      var radius = this.getRadius(n.nodeValue);
      var cnode = canvas.circle(n.x, n.y, radius).attr({
        fill: this.getColor(k),
        'stroke': "#ffffff",
        'opacity': 0.9
        //title: n.name
      });
      var nodeText = canvas.text(n.x, n.y - radius, n.name).attr({
        'opacity': 1,
        //'font-family': "微软雅黑",
        'font': '12px Verdana'
      }).hide();
      var nodeRect = canvas.rect(n.x, n.y, nodeText.getBBox().width, nodeText.getBBox().height, 2).attr({
        'fill': "#000000",
        'stroke-opacity': 0,
        'fill-opacity': 0.1
      }).hide();
      cnode.data('r', radius);
      cnode.data("name", n.name);
      cnode.data('text', nodeText);
      cnode.data('rect', nodeRect);
      cnode.data('colorType', k);
      cnode.data('clicked', false);
      cnode.data('index', i);
      cnode.data('big', false);

      if (i >= topNum && topValue[0] < nodesData[i].nodeValue) {
        topValue[0] = nodesData[i].nodeValue;
        topId[0] = i;
        for (j = 1; j < topNum; j++) {
          if (topValue[j] < topValue[j - 1]) {
            temp = topValue[j];
            topValue[j] = topValue[j - 1];
            topValue[j - 1] = temp;
            temp = topId[j];
            topId[j] = topId[j - 1];
            topId[j - 1] = temp;
          } else {
            break;
          }
        }
      }

      nodes.push(cnode);
      connectMatrix[i] = [];
      linkMatrix[i] = [];
      connectMatrix[i].push(nodes[i]);
    }

    for (i = 0; i < topNum; i++) {
      nodes[topId[i]].data("big", true);
    }


    for (i = 0; i < linksNum; i++) {
      var l = linksData[i];
      var clink = canvas.path("M" + l.source.x + "," + l.source.y + "L" + l.target.x + "," + l.target.y).attr({
        'stroke-width': conf.linkWidth,
        'stroke-opacity': this.getOpacity(l.value)
      }).toBack();
      clink.data('opacity', this.getOpacity(l.value));
      links.push(clink);
      connectMatrix[l.source.index].push(nodes[l.target.index]);
      connectMatrix[l.target.index].push(nodes[l.source.index]);
      linkMatrix[l.source.index].push(links[i]);
      linkMatrix[l.target.index].push(links[i]);
    }

    var background = canvas.rect(0, 0, conf.width, conf.height).attr({
      'fill': '#ffffff',
      'stroke-opacity': 0
    }).toBack();
    background.click(onCanvasClick);

    nodes.forEach(function (d, i) {
      d.data("node", connectMatrix[i]);
      d.data("link", linkMatrix[i]);
      if (d.data('big')) {
        d.data('showText', true);
      } else {
        d.data('showText', false);
      }
      d.drag(function (dx, dy) {
        d.data('x', this.ox + dx);
        d.data('y', this.oy + dy);
      }, function () {
        that.force.resume();
        this.ox = this.attr("cx");
        this.oy = this.attr("cy");
        d.data('x', this.ox);
        d.data('y', this.oy);
        d.data('drag', true);
      }, function () {
        that.force.resume();
        d.data('drag', false);
      });
      d.click(onMouseClick); //.mouseup(onmouseup);
      d.mouseover(function () {
        if (conf.browserName !== "Microsoft Internet Explorer") {
          that.force.resume();
        }
        this.attr({
          'r': d.data('r') + 5
        });
        if (!this.data('showText')) {
          //this.attr('title', "");
          this.data('showText', true);
          this.data('hover', true);
        }
        if (!that.underBn[this.data('colorType')].data('clicked')) {
          that.underBn[this.data('colorType')].attr('opacity', 0.5).show();
        }
      }).mouseout(function () {
        this.attr({
          'r': d.data('r')
        });
        //this.attr('title', this.data('name'));
        if (this.data('hover') && !this.data('clicked')) {
          d.data('rect').hide();
          d.data('text').hide();
          this.data('showText', false);
          this.data('hover', false);
        }
        if (!that.underBn[this.data('colorType')].data('clicked')) {
          that.underBn[this.data('colorType')].hide();
        }
      });
    });

  };


  /**
   * 绘制图例
   */
  Force.prototype.legend = function () {
    var that = this;
    var conf = this.defaults;
    var paper = this.canvas;
    var legendArea = this.legendArea;
    var rectBn = paper.set();
    this.underBn = [];
    var underBn = this.underBn;
    for (i = 0; i <= conf.classNum - 1; i++) {
      //底框
      underBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
        "fill": "#ebebeb",
        "stroke": "none",
        'opacity': 1
      }).data('clicked', false).hide());
      //色框
      paper.rect(legendArea[0] + 10 + 3, legendArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
        "fill": that.getColor(i),
        "stroke": "none"
      });
      //文字
      var min = Math.floor(this.nodeValueMin + i * (this.nodeValueMax - this.nodeValueMin) / conf.classNum);
      var max = Math.floor(min + (this.nodeValueMax - this.nodeValueMin) / conf.classNum);
      paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] + 10 + (20 + 3) * i + 10, min + " ~ " + max).attr({
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
        if (!underBn[i].data('clicked')) {
          underBn[i].attr('opacity', 0.5);
          underBn[i].show();
        }
      }).mouseout(function () {
        if (!underBn[i].data('clicked')) {
          underBn[i].hide();
        }
      });
      d.click(function () {
        that.clicked = false;
        if (conf.browserName !== "Microsoft Internet Explorer") {
          that.force.linkDistance(conf.linkLength).charge(conf.charge).start();
        }
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
          that.legendClicked = true;
          underBn[i].attr('opacity', 1);
          underBn[i].data('clicked', true);
          underBn[i].show();
          that.nodes.forEach(function (d) {
            if (d.data('colorType') === i) {
              d.attr({
                "opacity": 0.9
              });
              d.data('showText', true);
            } else {
              d.attr({
                "opacity": 0.2
              });
              d.data('rect').hide();
              d.data('text').hide();
              d.data('showText', false);
            }
          });
          that.links.forEach(function (d) {
            d.attr({
              "stroke-opacity": 0
            });
          });
          d.data("clicked", 1);
        } else if (d.data("clicked") === 1) {
          that.legendClicked = false;
          underBn[i].data('clicked', false);
          underBn[i].hide();
          d.data("clicked", 0);
          that.nodes.forEach(function (d) {
            d.attr({
              "opacity": 0.9
            });
            if (d.data('big')) {
              d.data('showText', true);
            } else {
              d.data('rect').hide();
              d.data('text').hide();
              d.data('showText', false);
            }
          });
          that.links.forEach(function (d) {
            d.attr({
              "stroke-opacity": d.data('opacity')
            });
          });
        }
      });
    });
  };


  /**
   * create the force-direct layout
   */
  Force.prototype.layout = function () {
    var conf = this.defaults;
    this.force = d3.layout.force().linkDistance(conf.linkLength).size([conf.width + this.xOffset, conf.height]).theta(1.5);
  };

  /**
   * update the force-direct layout animation
   */
  Force.prototype.animate = function () {
    var conf = this.defaults;
    var nodes = this.nodes;
    var links = this.links;
    var tick = 0;
    var that = this;

    var nodesData = this.net.nodes;
    var linksData = this.net.links;

    this.force.on("tick", function () {
      if (conf.browserName !== "Microsoft Internet Explorer" || tick > conf.iterate) {
        if (tick % 2 === 0) {
          nodes.forEach(function (d, i) {
            var margin = d.data('r');
            var nd = nodesData[i];
            if (d.data('drag')) {
              nd.x = d.data('x');
              nd.y = d.data('y');
            }
            nd.x = (nd.x < margin + that.xOffset) ? (margin + that.xOffset) : nd.x;
            nd.x = (nd.x > conf.width - margin) ? conf.width - margin : nd.x;
            nd.y = (nd.y < margin) ? margin : nd.y;
            nd.y = (nd.y > conf.height - margin) ? conf.height - margin : nd.y;
            var bx = d.data('text').getBBox().width / 2;
            var by = d.data('text').getBBox().height / 2;

            if (that.clicked) {
              var mx = nodesData[that.clickedNum].x;
              var my = nodesData[that.clickedNum].y;
              var tx, ty;
              if (d.data('clicked')) {

                if (conf.browserName !== "Microsoft Internet Explorer") {
                  nd.x = (conf.width + that.xOffset) / 2;
                  nd.y = conf.height / 2;
                }
                d.data('rect').attr({
                  'x': nd.x - bx,
                  'y': nd.y + d.data('r')
                });
                d.data('text').attr({
                  'x': nd.x,
                  'y': nd.y + by + d.data('r')
                });
                d.data('rect').show();
                d.data('text').show();
              } else if (d.data('showText')) {
                var lx = (nd.x - mx);
                var ly = (nd.y - my);
                var length = Math.sqrt(lx * lx + ly * ly);
                tx = nd.x + bx * lx / length;
                ty = nd.y + by * ly / length;
                tx = (nd.x < mx) ? tx - d.data('r') : tx + d.data('r');
                ty = (nd.y < my) ? ty - d.data('r') : ty + d.data('r');
                tx = (tx < margin + that.xOffset) ? (margin + that.xOffset) : tx;
                tx = (tx > conf.width - margin) ? conf.width - margin : tx;
                ty = (ty < margin) ? margin : ty;
                ty = (ty > conf.height - margin) ? conf.height - margin : ty;
                d.data('rect').attr({
                  'x': tx - bx,
                  'y': ty - by
                });
                d.data('text').attr({
                  'x': tx,
                  'y': ty
                });
                d.data('rect').show();
                d.data('text').show();
              }
            } else if (d.data('showText')) {
              d.data('rect').attr({
                'x': nd.x - bx,
                'y': nd.y - by + 4 + d.data('r')
              });
              d.data('text').attr({
                'x': nd.x,
                'y': nd.y + 4 + d.data('r')
              });
              try {
                d.data('rect').show();
                d.data('text').show();
              } catch (e) {}

            }
            d.attr({
              'cx': nd.x,
              'cy': nd.y
            });
          });
          links.forEach(function (d, i) {
            d.attr('path', "M" + linksData[i].source.x + "," + linksData[i].source.y + "L" + linksData[i].target.x + "," + linksData[i].target.y);
          });
        }
      }++tick;
    });
  };

  /**
   *render the force-directed net on the canvas and keep updating
   * @param {Object} options user options
   */
  Force.prototype.render = function (options) {
    this.setOptions(options);
    this.canvas.clear();
    this.layout();
    if (this.defaults.legend) {
      this.legend();
    }
    this.update();
    this.animate();
  };

  return Force;
});