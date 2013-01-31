/*global d3, $, _, define */
/*!
 * Treemap兼容定义部分
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id]; });
  }
})('Treemap', function (require) {
  var DataV = require('DataV');

  /*
   * Treemap构造函数，继承自Chart
   * Options:
   * - `width` 数字，图片宽度，默认为750，表示图片高750px
   * - `height` 数字，图片高度，默认为500
   * - `showBackTag` 布尔值，回退操作导航条是否显示，默认为 true, 显示；设为false则不显示
   * - `backHeight` 数字，回退操作导航条宽度，默认为20
   * - `level1BorderWidth` 数字，一级方框的边框宽度，默认为1(1px),不建议修改
   * - `level2BorderWidth` 数字，二级方框的边框宽度，默认为1(1px)，不建议修改
   * - `fontSizeRatio` 数字，表示图中文字大小。默认为1.0(1倍), 若设为2.0，字体大小会加倍;
   *
   * Events:
   * - `leafNodeClick` 函数，表示点击叶子节点的事件响应，默认为空函数
   * - `hoverIn` 函数，表示鼠标移进方框的事件响应，默认为空函数
   * - `hoverOut` 函数，表示鼠标移出方框的事件响应，默认为空函数
   * - `mouseover` 函数，表示在方框内移动鼠标的事件响应，默认为设置浮框的内容，可以替换它修改浮框内容
   * 这些函数可以在创建对象或setOption()时一起设置，也可以通过on函数单独设置。
   *
   * Examples:
   * Create treemap in a dom node with id "chart", width is 500; height is 600px;
   * ```
   * var treemap = new Treemap("chart", {"width": 500, "height": 600});
   * ```
   * @param {Object} node The dom node or dom node Id
   * @param {Object} options JSON object for determin treemap style
   */
  var Treemap = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Treemap";
      this.node = this.checkContainer(node);

      // Properties
      this.selectedTreeNodes = [];//array of nodes on the path from root to recent node
      this.treeNodeJson = {};
      this.level_ = 2;

      //浮框对象，这是个可操作的对象。
      this.floatTag = null;

      // Canvas
      this.defaults.width = 750;
      this.defaults.height = 500;

      this.defaults.showBackTag = true;
      this.defaults.backHeight = 20;

      this.defaults.level1BorderWidth = 1;
      this.defaults.level2BorderWidth = 1;
      this.defaults.fontSizeRatio = 1.0;
      //event
      this.defaults.customEvent = {
        leafNodeClick: function () {},
        hoverIn: function () {},
        hoverOut: function () {},
        mousemove: function () {
          var jqNode = this.jqNode,
            treemapNode = jqNode.treemapNode,
            floatTag = jqNode.treemap.floatTag;

          // et floatTag content
          floatTag.html('<div style="text-align: center; color:#fff;">' +
            treemapNode.name + '</div>' +
            '<div style="text-align: center; color: #fff;">' +
            treemapNode.value + '</div>');
        }
      };
      this.setOptions(options);
      this.createCanvas();
    }
  });

  /**
   * Create dom node relate to treemap
   */
  Treemap.prototype.createCanvas = function () {
    var conf = this.defaults,
      container = $(this.node);

    container.css('position', 'relative');

    if (conf.showBackTag) {
      this.backTag = $('<div></div>').css({
        width: conf.width,
        height: conf.backHeight,
        paddingLeft: "5px"
      });
      container.append(this.backTag);
    }

    this.canvas = $('<div></div>').css({
      position: "relative",
      width: conf.width,
      height: conf.height
    });

    container.append(this.canvas);
    this.floatTag = DataV.FloatTag()(this.canvas);
    this.floatTag.css({"visibility": "hidden"});
  };

  /*!
   * Get color function according to level 1 node name
   * 根据一级节点名获取颜色函数
   */
  Treemap.prototype._changeLevel1NodeColorIndex = function (nodeName) {
    if (!this._getNodeTheme) {
      this._getNodeTheme = d3.scale.ordinal().range(d3.range(DataV.getColor().length));
    }
    return this._getNodeTheme(nodeName);
  };

  /**
   * 获取颜色
   * Examples:
   * ```
   * // 获取第二种颜色的渐变色。
   * {mode: "gradient", index: 1}
   * // 获取最深的离散色。
   * {mode: "random", ratio: 0}
   * // 获取最浅的离散色。
   * {mode: "random", ratio: 1}
   * // 获取适中的离散色。
   * {mode: "random", ratio: 0.5}
   * ```
   * @param {Object} colorJson Way to get color from color theme matrix
   * @return {Array} 返回颜色数组
   */
  Treemap.prototype.getColor = function (colorJson) {
    var colorMatrix = DataV.getColor();
    var color;
    var colorStyle = colorJson || {};
    var colorMode = colorStyle.mode || 'default';
    var i, l;

    switch (colorMode) {
    case "multiColorGradient":
      color = (function () {
        var c = [];
        colorMatrix.forEach(function (d) {
          c.push(d[0]);
        });
        return function (ratio) {
          var index = (c.length - 1) * ratio;
          var floor = Math.floor(index);
          var ceil = Math.ceil(index);
          if (floor === ceil) {
            return c[floor];
          } else {
            return d3.interpolateRgb.apply(null, [c[floor], c[ceil]])(index - floor);
          }
        };
      }());
      break;
    case "gradient":
      var index = colorJson.index || 0;
      index = index < 0 ? 0 : Math.min(index, colorMatrix.length - 1);
      color = d3.interpolateRgb.apply(null, [colorMatrix[index][0], colorMatrix[index][1]]);
      break;
    case "random":
    case "default":
      var ratio = colorStyle.ratio || 0;
      if (ratio < 0) { ratio = 0; }
      if (ratio > 1) { ratio = 1; }
      var colors = [];
      for (i = 0, l = colorMatrix.length; i < l; i++) {
        var colorFunc = d3.interpolateRgb.apply(null, [colorMatrix[i][0], colorMatrix[i][1]]);
        colors.push(colorFunc(ratio));
      }
      color = d3.scale.ordinal().range(colors);
      break;
    }
    return color;
  };

  /*
   * 设置数据源
   * Examples:
   * treemap数据输入的格式可以是二维数组。例如下面的数组表示2000年4个季度的天数。
   * 第1季度下面还列出了1-3月的天数。数组的第一行为四个固定的字符串"ID"，"name"，"size"和"parentID"。
   * 四列数据分别表示层次数据集中各结点的ID，名称，大小和父节点ID。叶子节点必须有大小，根结点不能有父节点ID。各结点的ID、名称必须要有。
   * ```
   *  [
   *      ["ID", "name", "size", "parentID"],
   *      [0, "2000",  ,  ],
   *      [1, "season1",  , 0],
   *      [2, "January", 31, 1],
   *      [3, "February", 29, 1],
   *      [4, "Match", 31, 1],
   *      [5, "season2", 91, 0],
   *      [6, "season3", 92, 0],
   *      [7, "season4", 92, 0]
   *  ]
   * ```
   * 数据还可以是json格式。每个结点都有`name`，如果是父节点则还有`children`，如果为叶节点则还有`size`。以上数组数据对应的json数据如下：
   * ```
   * {
   *   "name": "2000",
   *   "children": [
   *      {
   *       "name": "season1",
   *       "children": [
   *            {"name": "January", "size": 31},
   *            {"name": "February", "size": 29},
   *            {"name": "Match", "size": 31}
   *          ]
   *      },
   *      {"name": "season2", "size": 91},
   *      {"name": "season3", "size": 92},
   *      {"name": "season4", "size": 92},
   *   ]
   * }
   * ```
   * @param {Array|Object} source json or 2-d array
   */
  Treemap.prototype.setSource = function (source) {
    if (_.isArray(source)) {
      this.rawData = this._arrayToJson(source);
    } else {
      this.rawData = source;
    }
    this.source = this._remapSource(this.rawData);
    this.selectedTreeNodes = [this.source[0]];
  };

  /*!
   * Change 2-d array source data to json format.
   * @param {Array} array 待转换的二维数组
   * @return {Object} 返回转换后的对象
   */
  Treemap.prototype._arrayToJson = function (array) {
    // ID name size parentID
    var getColumnIndex = function (columnName) {
      // 从标题行中查找地几列
      return _.indexOf(array[0], columnName);
    };

    var idx = {};
    var column = ["ID", "name", "size", "parentID"];
    var i, l;
    for (i = 0, l = column.length; i < l; i++) {
      if ((idx[column[i]] = getColumnIndex(column[i])) === -1) {
        throw new Error("no column \'" + column[i] + "\'");
      }
    }

    var table = [];
    for (i = 1, l = array.length; i < l; i++) {
      var line = array[i];
      var tableLine = table[i - 1] = [];
      var j, columnL;
      for (j = 0, columnL = column.length; j < columnL; j++) {
        tableLine.push(line[idx[column[j]]]);
      }
    }

    var rootID;
    var h = {};
    table.forEach(function (d, i) {
      if (d[0] === "") {
        throw new Error("ID can not be empty(line:" + (i + 1) + ").");
      }
      if (!d[3]) {
        if (rootID) {
          throw new Error("2 or more lines have an empty parentID(line:" + (i + 1) + ").");
        } else {
          rootID = d[0];
        }
      }
      if (h[d[0]]) {
        throw new Error("2 or more lines have same ID: " + d[0] + "(line:" + (i + 1) + ").");
      }
      h[d[0]] = {name: d[1], size: d[2], child: []};
    });
    if (!rootID) {
      throw new Error("No root node defined.");
    }
    table.forEach(function (d, i) {
      if (d[3]) {
        var record = h[d[3]];
        if (!record) {
          throw new Error("Can not find parent with ID " + d[3] + "(line:" + (i + 1) + ").");
        }
        record.child.push(d[0]);
      }
    });
    var recurse = function (parentID) {
      var record = h[parentID];
      if (record.child.length === 0) {
        if (isNaN(parseFloat(record.size))) {
          throw new Error("Leaf node's size is not a number(name:" + record.name + ").");
        } else {
          return {name: record.name, size: record.size};
        }
      } else {
        var childNode = [];
        record.child.forEach(function (d) {
          childNode.push(recurse(d));
        });
        return {name: record.name, children: childNode};
      }
    };
    return recurse(rootID);
  };

  /*!
   * map digit data to layout data format.
   * @param source The digit data source from source.
   */
  Treemap.prototype._remapSource = function (data) {
    var treemap = this._createTreemap();
    var source = treemap.nodes(data);

    var recurse = function (node) {
      if (!node.children) {
        return node.size;
      }
      var size = 0;
      node.children.forEach(function (d) {
        size += parseFloat(recurse(d), 10);
      });
      node.size = size;
      return node.size;
    };
    recurse(source[0]);
    return source;
  };

  /*!
   * input a node, return a json tree contains the node's level 1 children and level 2 children;
   */
  Treemap.prototype._create2LevelJson = function (node) {
    // return json
    var recurse = function (node, depth) {
      if (depth === 2 && node.refer) {
        node = node.refer;
      }
      if ((!node.children) || depth <= 0) {
        return {name: node.name, size: node.size, refer: node};
      }
      var childNode = [];
      node.children.forEach(function (d) {
        childNode.push(recurse(d, depth - 1));
      });
      return {name: node.name, children: childNode, refer: node};
    };

    this.treeNodeJson = recurse(node, this.level_);
  };

  /*!
   * add the clicked leaf to selected tree nodes.
   */
  Treemap.prototype._goToLeaf = function (treemapNode) {
    this.selectedTreeNodes.push(treemapNode);
    this.reRender();
  };

  /*!
   * remove recent leaf node, set leaf node's parent node as new leaf node;
   */
  Treemap.prototype._goToRoot = function (idx) {
    this.selectedTreeNodes = this.selectedTreeNodes.slice(0, idx + 1);
    this.reRender();
  };

  /*!
   * create treemap layout function
   */
  Treemap.prototype._createTreemap = function () {
    var conf = this.defaults;
    return d3.layout.treemap()
      .size([conf.width, conf.height])
      .value(function (d) { return d.size; });
  };

  /*!
   * d3 treemap layout
   */
  Treemap.prototype.layout = function () {
    var treemap = this._createTreemap().sort(function (a, b) {
      return a.value - b.value;
    });
    this.nodes = treemap.nodes(this.treeNodeJson);
  };

  /*!
   * 生成绘制路径
   */
  Treemap.prototype.generatePaths = function () {
    //add interactive need
    var canvas = this.canvas,
      conf = this.defaults,
      color,
      leafIndex = 0,
      leafCount,
      colorRatio,
      level1Node,
      level1NodeArray = [],
      i, l,
      level1Count = 0,
      level1ColorFun,
      goIn = function (event) {
        var treemap = event.data.treemap,
            treemapNode = event.data.treemapNode,
            jqueryNode = event.data.jqueryNode;
        jqueryNode.css({
          'zIndex': 30,
          "backgroundColor": jqueryNode.color
        }).animate({
          left : 0,
          top : 0,
          width : treemap.defaults.width,
          height : treemap.defaults.height
        }, 1000, function () {
          treemap._goToLeaf(treemapNode);
        });
      },

      goOut = function (event) {
        var treemap = event.data.treemap;
        if (treemap.selectedTreeNodes.length > 1) {
          treemap._goToRoot(treemap.selectedTreeNodes.length - 2);
        }
        return false;
      },

      level1HoverIn = function (index, level1NodeArray) {
        return function () {
          level1NodeArray.forEach(function (node, i) {
            if (i === index) {
              node.css("font-size", node.fontSize * 6 / 5 + "px");
              if (node.treemapNode.children) {
                node.css("backgroundColor", '');
              }
            } else {
              node.css("backgroundColor", d3.interpolateRgb.apply(null, [node.color, "#fff"])(0.4));
            }
          });
          level1NodeArray[0].treemap.floatTag.css({"visibility" : "visible"});
        };
      },

      level1HoverOut = function (level1NodeArray) {
        return function () {
          level1NodeArray.forEach(function (node) {
            node.css({
              "backgroundColor": node.color,
              "fontSize": node.fontSize
            });
          });
          level1NodeArray[0].treemap.floatTag.css({"visibility" : "hidden"});
        };
      },

      level0HoverIn = function () {
        this.jqNode.treemap.floatTag.css({"visibility" : "visible"});
      },

      level0HoverOut = function () {
        this.jqNode.treemap.floatTag.css({"visibility" : "hidden"});
      },

      customEvent = function (f, o) {
        return function () {
          f.call(o);
        };
      };

    $(canvas).append(this.floatTag);//canvas clear before draw, add floatTag.

    for (i = 0, l = this.nodes.length; i < l; i++) {
      var d = this.nodes[i],//treemap node
        borderWidth,
        w, h,
        depthColor,
        depthColorHsl,
        jqNode = $('<div></div>');

      if (!(d.parent && d.parent.parent)) {
        //level 0 and 1
        color = this.getColor({mode: "gradient", index: this._changeLevel1NodeColorIndex(d.name)});
        leafIndex = -1;
        leafCount = d.children ? d.children.length : 0;
        colorRatio = 0.5;

        if (d.parent) {
          //only level 1
          level1NodeArray.push(jqNode);
          level1Node = jqNode;
        }
        jqNode.color = color(colorRatio);
        if (d.parent) {
          //level 1
          if (this.selectedTreeNodes.length === 1) {
            //root
            if (!level1ColorFun) {
              level1ColorFun = this.getColor({mode: "multiColorGradient"});
            }
          } else {
            if (!level1ColorFun) {
              depthColor = this.selectedTreeNodes[this.selectedTreeNodes.length - 1].color;
              depthColorHsl = d3.hsl(depthColor);
              level1ColorFun = d3.interpolateHsl.apply(null, [
                d3.hsl((depthColorHsl.h + 180) % 360, depthColorHsl.s, depthColorHsl.l).toString(),
                depthColor
              ]);
            }
          }
          jqNode.color = d.parent.children.length === 1 ? level1ColorFun(0)
            : level1ColorFun((level1Count++) / (d.parent.children.length - 1));
          color = d3.interpolateRgb.apply(null, [
            jqNode.color,
            d3.interpolateRgb.apply(null, [jqNode.color, "#fff"])(0.5)
          ]);
        } else {
          //level 0
          if (this.selectedTreeNodes.length > 1) {
            jqNode.color = this.selectedTreeNodes[this.selectedTreeNodes.length - 1].color;
          }
        }
      } else {
        //level 2
        leafIndex += 1;
        colorRatio = leafCount === 1 ? 0 : leafIndex / (leafCount - 1);
        jqNode.color = color(colorRatio);
      }
      jqNode.treemapNode = d;
      d.color = jqNode.color;
      jqNode.treemap = this;
      jqNode[0].jqNode = jqNode;
      jqNode.appendTo($(canvas));

      jqNode.css({
        "borderStyle": "solid",
        "borderColor": "#d6d6d6",
        "overflow": "hidden",
        "fontFamily": '黑体',
        "position": "absolute",
        "textIndent": "2px",
        "backgroundColor": jqNode.color,
        "color": "#fff"
      });
      if (!d.parent) {
        // level 0 node
        if (!d.children) {
          jqNode.html(d.name);
        }
      } else if (d.parent && !d.parent.parent) {
        // level 1 node
        jqNode.html(d.name).css("zIndex", 5);
        if (d.children) {
          jqNode.css("backgroundColor", jqNode.color);
        }
      } else {
        // level 2 node
        jqNode.css("borderColor", "rgba(255, 255, 255, 0.5)");
      }

      // position
      // border do not need adjust, still 1 px;
      borderWidth = 1;
      w = Math.max(0, d.dx - borderWidth);
      h = Math.max(0, d.dy - borderWidth);
      var size = conf.fontSizeRatio * parseInt(60 * Math.sqrt(w * h / conf.width / conf.height), 10);
      jqNode.fontSize = Math.max(size, 12);
      jqNode.css({
        borderWidth: borderWidth,
        left: d.x,
        top: d.y,
        width: w,
        height: h,
        fontSize: jqNode.fontSize
      });

      if (d.parent && !d.parent.parent) {
        //level 1
        jqNode.css("cursor", "pointer");
        jqNode.clone().insertBefore(jqNode).css("opacity", 0.01);
        jqNode.click({"treemap": this, "treemapNode": d, "jqueryNode": jqNode}, goIn);
        jqNode.mouseover(level1HoverIn(level1NodeArray.length - 1, level1NodeArray));
        jqNode.mouseout(level1HoverOut(level1NodeArray));
        jqNode.mousemove(conf.customEvent.mousemove);
      }

      if (!d.parent) {
        //level 0; leaf node
        jqNode.mouseover(level0HoverIn);
        jqNode.mouseout(level0HoverOut);
        jqNode.mousemove(conf.customEvent.mousemove);
      }

      jqNode.bind("contextmenu", {"treemap": this}, goOut);

      // custom interacitves
      var o = {
        treemapNode : d,
        node : jqNode,
        name : d.name,
        parent : d.parent,
        value : d.value
      };

      if (d.parent && (!d.parent.parent) && (!d.children)) {
        jqNode.click(customEvent(conf.customEvent.leafNodeClick, o));
      }
      jqNode.mouseover(customEvent(conf.customEvent.hoverIn, o));
      jqNode.mouseout(customEvent(conf.customEvent.hoverOut, o));
    }
  };

  /**
   * 清除画布
   */
  Treemap.prototype.clearCanvas = function () {
    this.canvas.empty();
  };

  /*!
   * set back navi link
   */
  Treemap.prototype._setBackTag = function () {
    if (!this.backTag) {
      return;
    }
    var p = $("<p></p>"),
      backClick = function (that, idx) {
        return function () {
          that._goToRoot(idx);
        };
      },
      lastA,
      lastGt;

    for (var i = 0, l = this.selectedTreeNodes.length; i < l; i++) {
      var a = $("<a></a>").html(this.selectedTreeNodes[i].name);
      if (i < l - 1) {
        a.css({
          color: "blue",
          cursor: "pointer"
        });
        a.bind('click', backClick(this, i));
      } else {
        lastA = a;
      }
      if (i > 0) {
        var span = $('<span> &gt; </span>');
        p.append(span);
        if (i === l - 1) {
          lastGt = span;
        }
      }
      p.append(a);
    }
    lastA.css({
      "opacity": 0.01,
      "position": "relative",
      "left": l === 1 ? 0 : -20
    }).animate({"opacity": 1,  "left": 0}, 1000);
    this.backTag.empty().append(p);
  };

  /**
   * 计算布局，并重新渲染图表
   */
  Treemap.prototype.reRender = function (options) {
    this.clearCanvas();
    this.setOptions(options);
    this._create2LevelJson(this.selectedTreeNodes[this.selectedTreeNodes.length - 1]);
    this.layout();
    this._setBackTag();
    this.generatePaths();
  };

  /**
   * 计算布局位置，并渲染图表
   */
  Treemap.prototype.render = function (options) {
    this.clearCanvas();
    this.setOptions(options);
    this._getNodeTheme = undefined;
    this.selectedTreeNodes = this.selectedTreeNodes.slice(0, 1);
    this._create2LevelJson(this.selectedTreeNodes[0]);
    this.layout();
    this._setBackTag();
    this.generatePaths();
  };

  /**
   * 设置自定义事件
   */
  Treemap.prototype.on = function (eventName, callback) {
    if ($.inArray(eventName, ["leafNodeClick", "hoverIn", "hoverOut", "mousemove"]) !== -1) {
      this.defaults.customEvent[eventName] = callback;
    }
  };

  /*!
   * 导出Treemap
   */
  return Treemap;
});
