/*global d3, $, define */
define(function (require, exports, module) {
    var DataV = require("datav");

    /*
     * constructor
     * @param node: the dom node or dom node Id
     *        options: json object for determin treemap style.
     * @example
     * create treemap in a dom node with id "chart", width is 500; height is 600px;
     * "chart", {"width": 500, "height": 600}
     */
    var Treemap = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Treemap";
            this.node = this.checkNode(node);
            this.defaults = {};

            // Properties
            this.selectedTreeNodes = [];//array of nodes on the path from root to recent node 
            this.treeNodeJson = {};
            this.level_ = 2;
            this.defaults.level1BorderWidth = 1;
            this.defaults.level2BorderWidth = 1;

            this.defaults.fontSizeRatio = 1.0;

            // Canvas
            this.defaults.showBackTag = true;
            this.defaults.backHeight = 20;
            this.defaults.width = 750;
            this.defaults.height = 500;
            this.setOptions(options);
            this.createCanvas();
        },
        /*
         * If node is string, return Element by string as id. If node is Dom element, return node.
         * @param node The element Id or Dom element.
         */
        checkNode: function (node) {
            if (!node) {
                throw new Error("Please specify which node to render.");
            }
            if (typeof node === "string") {
                return document.getElementById(node);
            } else if (node.nodeName) {//DOM-element
                return node;
            }
            throw new Error("Please specify which node to render.");
        }
    });

    /*
     * create dom node relate to treemap
     */
    Treemap.prototype.createCanvas = function () {
        var conf = this.defaults,
            floatStyle,
            container = this.node,
            backStyle,
            canvasStyle;

        this.node.style.position = "relative";

        if (conf.showBackTag) {
            this.backTag = document.createElement("div");
            backStyle = this.backTag.style;
            backStyle.width = conf.width + "px";
            backStyle.height = conf.backHeight + "px";
            backStyle.paddingLeft = "5px";
            container.appendChild(this.backTag);
        }

        this.canvas = document.createElement("div");
        canvasStyle = this.canvas.style;
        canvasStyle.position = "relative";
        canvasStyle.width = conf.width + "px";
        canvasStyle.height = conf.height + "px";
        container.appendChild(this.canvas);

        this.floatTag = DataV.FloatTag()(this.canvas);

        this.floatTag.css({"visibility": "hidden"});

        //this.canvas.appendChild(this.floatTag);
    };

    /*
     * get color function according to level 1 node name
     */
    Treemap.prototype._changeLevel1NodeColorIndex = function (nodeName) {
        if (!this._getNodeTheme) {
            this._getNodeTheme = d3.scale.ordinal().range(d3.range(DataV.getColor().length));
        }
        return this._getNodeTheme(nodeName);
    };

    /*
     * @param colorJson way to get color from color theme matrix.
     * @example 
     * // 获取第二种颜色的渐变色。
     * {mode: "gradient", index: 1}
     * // 获取最深的离散色。
     * {mode: "random", ratio: 0}
     * // 获取最浅的离散色。
     * {mode: "random", ratio: 1}
     * // 获取适中的离散色。
     * {mode: "random", ratio: 0.5}
     */
    Treemap.prototype.getColor = function (colorJson) {
        var colorMatrix = DataV.getColor();
        var color;
        var colorStyle = colorJson || {};
        var colorMode = colorStyle.mode || 'default';
        var i, l;

        switch (colorMode) {
        case "multiColorGradient":
            //color = d3.interpolateHsl.apply(null, ["red", "blue"]);
            //color = d3.interpolateHsl.apply(null, [colorMatrix[0][0], colorMatrix[colorMatrix.length - 1][0]]);
            //color = DataV.gradientColor(["#f5f5f6", "#f6f5f5"], 'special');
            //color = DataV.gradientColor([colorMatrix[0][0], colorMatrix[colorMatrix.length - 1][0]], 'special');
            //color = d3.interpolateRgb.apply(null, [colorMatrix[0][0], colorMatrix[colorMatrix.length - 1][0]]);

            color = (function () {
                var c = [];
                colorMatrix.forEach(function (d, i) {
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
            /*
            */
            //color = d3.interpolateRgb.apply(null, ["green", "purple"]);
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
            var colorArray = [];
            for (i = 0, l = colorMatrix.length; i < l; i++) {
                var colorFunc = d3.interpolateRgb.apply(null, [colorMatrix[i][0], colorMatrix[i][1]]);
                colorArray.push(colorFunc(ratio));
            }
            color = d3.scale.ordinal().range(colorArray);
            break;
        }
        return color;
    };

    /*
     * set user-defined options
     * @param options options json object for determin treemap style.
     * @example 
     * set width 500px, height 600px;
     * {"width": 500, "height": 600}
     */
    Treemap.prototype.setOptions = function (options) {
        var prop;
        if (options) {
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }
    };

    /*
     * set treemap source
     * @param source json or 2-d array
     * @example
     *treemap数据输入的格式可以是二维数组。例如下面的数组表示2000年4个季度的天数。
     *第1季度下面还列出了1-3月的天数。数组的第一行为四个固定的字符串"ID"，"name"，"size"和"parentID"。
     *四列数据分别表示层次数据集中各结点的ID，名称，大小和父节点ID。叶子节点必须有大小，根结点不能有父节点ID。各结点的ID、名称必须要有。
     *     [
     *        ["ID", "name", "size", "parentID"],
     *        [0, "2000",  ,  ],
     *        [1, "season1",  , 0],
     *	      [2, "January", 31, 1],
     *        [3, "February", 29, 1],
     *	      [4, "Match", 31, 1],
     *        [5, "season2", 91, 0],
     *        [6, "season3", 92, 0],
     *        [7, "season4", 92, 0]
     *     ]
     *数据还可以是json格式。每个结点都有“name”，如果是父节点则还有“children”，如果为叶节点则还有“size”。以上数组数据对应的json数据如下：
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
     */
    Treemap.prototype.setSource = function (source) {
        if (source instanceof Array) {
            this.rawData = this._arrayToJson(source);
        } else {
            this.rawData = source;
        }
        this.source = this._remapSource(this.rawData);
        this.selectedTreeNodes = [this.source[0]];
    };

    /*
     * change 2-d array source data to json format.
     */
    Treemap.prototype._arrayToJson = function (array) {
        /* ID name size parentID */
        var getColumnIndex = function (columnName) {
            var title = array[0];
            var i, l;
            for (i = 0, l = title.length; i < l; i++) {
                if (title[i] === columnName) {
                    return i;
                }
            }
            return -1;
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

    /*
     * map digit data to layout data format.
     * @param source The digit data source from source.
     */
    Treemap.prototype._remapSource = function (data) {
        var conf = this.defaults;

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

    /*
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

    /*
     * add the clicked leaf to selected tree nodes.
     */
    Treemap.prototype._goToLeaf = function (treemapNode) {
        this.selectedTreeNodes.push(treemapNode);
        this.reRender();
    };

    /*
     * remove recent leaf node, set leaf node's parent node as new leaf node;
     */
    Treemap.prototype._goToRoot = function (idx) {
        this.selectedTreeNodes = this.selectedTreeNodes.slice(0, idx + 1);
        this.reRender();
    };

    /*
     * create treemap layout function
     */
    Treemap.prototype._createTreemap = function () {
        var conf = this.defaults;
        return d3.layout.treemap()
            .size([conf.width, conf.height])
            .value(function (d) { return d.size; });
    };

    /*
     * d3 treemap layout
     */
    Treemap.prototype.layout = function () {
        var treemap = this._createTreemap()
            .sort(function (a, b) { return a.value - b.value; });
        this.nodes = treemap.nodes(this.treeNodeJson);
    };

    /*
     * draw treemap
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
            funcArray = {},
            i,
            l,
            level1Count = 0,
            level1ColorFun,
            goIn = function (event) {
                var treemap = event.data.treemap,
                    treemapNode = event.data.treemapNode,
                    jqueryNode = event.data.jqueryNode;
                jqueryNode.css({'z-index': 30,
                            "backgroundColor": jqueryNode.color})
                    .animate({
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
                    level1NodeArray.forEach(function (d, i, Array) {
                        if (i === index) {
                            d.css("font-size", Array[i].fontSizeValue * 6 / 5 + "px");
                            if (d.treemapNode.children) {
                                Array[i].css("backgroundColor", '');
                            }
                        } else {
                            Array[i].css("backgroundColor",
                                d3.interpolateRgb.apply(null, [Array[i].color, "#fff"])(0.4));
                        }
                    });
                    level1NodeArray[0].treemap.floatTag.css({"visibility" : "visible"});
                };
            },

            level1HoverOut = function (level1NodeArray) {
                return function () {
                    level1NodeArray.forEach(function (d, i, Array) {
                        Array[i].css("backgroundColor", Array[i].color)
                            .css("font-size", Array[i].fontSizeValue + "px");
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

            mousemove = function () {
                var jqNode = this.jqNode,
                    treemap = jqNode.treemap,
                    floatTag = treemap.floatTag;

                //set floatTag content
                floatTag.html('<div style = "text-align: center;margin:auto;color:'
                    //+ jqNode.color
                    + "#fff"
                    + '">' + jqNode.treemapNode.name + '</div>'
                    + '<div style = "text-align: center; margin:auto;color:' 
                    + "#fff"
                    //+ jqNode.color
                    + '">' + jqNode.treemapNode.value + '</div>');
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
                w,
                h,
                left,
                top,
                depthColor,
                depthColorHsl,
                jqNode = $(document.createElement("div"));

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
                            /*
                            level1ColorFun = d3.interpolateRgb.apply(null, [
                                d3.interpolateRgb.apply(null, [depthColor, "#fff"])(0.5),
                                depthColor
                                ]);
                                */
                            depthColorHsl = d3.hsl(depthColor);
                            level1ColorFun = d3.interpolateHsl.apply(null, [
                                d3.hsl((depthColorHsl.h + 180) % 360, depthColorHsl.s, depthColorHsl.l).toString(),
                                depthColor
                            ]);
                        }
                    }
                    jqNode.color = d.parent.children.length === 1 
                        ? level1ColorFun(0)
                        : level1ColorFun((level1Count++) / (d.parent.children.length - 1));
                    color = d3.interpolateRgb.apply(null, [jqNode.color,
                            d3.interpolateRgb.apply(null, [jqNode.color, "#fff"])(0.5)]);
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

            jqNode.css("borderStyle", "solid")
                .css("borderColor", "#d6d6d6")
                .css("overflow", "hidden")
                .css("fontFamily", '黑体')
                //.css("fontFamily", 'sans-serif')
                .css("position", "absolute")
                .css("textIndent", "2px")
                .css("backgroundColor", jqNode.color)
                //.css("color", "#fff");
                .css("color", "white");
                //.css("textAlign", "center");

            if (!d.parent) {
                // level 0 node
                if (!d.children) {
                    jqNode.html(d.name);
                }
            } else if (d.parent && !d.parent.parent) {
                // level 1 node
                jqNode.html(d.name)
                    .css("zIndex", 20);
                if (d.children) {
                    //jqNode.css("backgroundColor", '');
                    jqNode.css("backgroundColor", jqNode.color);
                }
            } else {
                // level 2 node
                jqNode.css("borderColor", "rgba(255, 255, 255, 0.5)");
            }

            //position
            /*// border need adjust, border width is not 1px
            if ((d.parent && !d.parent.parent) || (!d.parent && !d.children)) {
                //level 1   or   level 0 without children
                borderWidth = conf.level1BorderWidth;
                w = Math.max(0, d.dx - borderWidth);
                h = Math.max(0, d.dy - borderWidth);
                jqNode.fontSizeValue = Math.max(conf.fontSizeRatio
                        * parseInt(60 * Math.sqrt(w * h / conf.width / conf.height), 10),
                        12);
                jqNode.css("borderWidth", borderWidth + "px")
                    .css("left", d.x + "px")
                    .css("top", d.y + "px")
                    .css("width", w + "px")
                    .css("height", h + "px")
                    .css("fontSize", jqNode.fontSizeValue + "px");
                    //.css("lineHeight", Math.max(0, d.dy - borderWidth ) + "px");
            } else if (d.parent && d.parent.parent) {
                //level 2
                borderWidth = conf.level2BorderWidth;
                w = Math.max(0, d.dx * (d.parent.dx - conf.level1BorderWidth) / d.parent.dx);
                h = Math.max(0, d.dy * (d.parent.dy - conf.level1BorderWidth) / d.parent.dy);
                left = d.x + conf.level1BorderWidth * (1 - (d.x - d.parent.x) / d.parent.dx);
                top = d.y + conf.level1BorderWidth * (1 - (d.y - d.parent.y) / d.parent.dy);
                jqNode.css("borderWidth", borderWidth + "px")
                    .css("left", left + "px")
                    .css("top", top + "px")
                    .css("width", w + "px")
                    .css("height", h + "px");
                    //.css("lineHeight", Math.max(0, d.dy - borderWidth) + "px");
            }
            */

            //border do not need adjust, still 1 px;
            borderWidth = 1;
            w = Math.max(0, d.dx - borderWidth);
            h = Math.max(0, d.dy - borderWidth);
            jqNode.fontSizeValue = Math.max(conf.fontSizeRatio
                    * parseInt(60 * Math.sqrt(w * h / conf.width / conf.height), 10),
                    12);
            jqNode.css("borderWidth", borderWidth + "px")
                .css("left", d.x + "px")
                .css("top", d.y + "px")
                .css("width", w + "px")
                .css("height", h + "px")
                .css("fontSize", jqNode.fontSizeValue + "px");
                //.css("lineHeight", Math.max(0, d.dy - borderWidth ) + "px");

            if (d.parent && !d.parent.parent) {
                //level 1
                jqNode.css("cursor", "pointer");
                jqNode.clone().insertBefore(jqNode).css("opacity", 0.01);
                jqNode.click({"treemap": this, "treemapNode": d, "jqueryNode": jqNode}, goIn);
                jqNode.mouseover(level1HoverIn(level1NodeArray.length - 1, level1NodeArray));
                jqNode.mouseout(level1HoverOut(level1NodeArray));
                jqNode.mousemove(mousemove);
            }

            if (!d.parent) {
                //level 0; leaf node
                jqNode.mouseover(level0HoverIn);
                jqNode.mouseout(level0HoverOut);
                jqNode.mousemove(mousemove);
            }

            jqNode.bind("contextmenu", {"treemap": this}, goOut);

            // custom interacitves
            var o = {treemapNode : d,
                node : jqNode,
                name : d.name,
                parent : d.parent,
                value : d.value
                };

            if (this.leafNodeClick && d.parent && (!d.parent.parent) && (!d.children)) {
                jqNode.click(customEvent(this.leafNodeClick, o));
            }
    
            if (this.hoverIn) {
                jqNode.mouseover(customEvent(this.hoverIn, o));
            }
    
            if (this.hoverOut) {
                jqNode.mouseout(customEvent(this.hoverOut, o));
            }

            //canvas.appendChild(jqNode[0]);
        }
    };

    /*
     * clean canvas.
     */
    Treemap.prototype.clearCanvas = function () {
        var canvas = this.canvas;
        canvas.innerHTML = "";
    };

    /*
     * set back navi link
     */
    Treemap.prototype._setBackTag = function () {
        if (!this.backTag) {return; }
        var p = document.createElement("p"),
            i,
            l,
            backClick = function (that, idx) {
                return function () {
                    that._goToRoot(idx);
                };
            },
            lastA,
            lastGt;
        for (i = 0, l = this.selectedTreeNodes.length; i < l; i++) {
            var a = document.createElement("a");
            a.innerHTML = this.selectedTreeNodes[i].name;
            if (i < l - 1) {
                a.style.color = "blue";
                a.style.cursor = "pointer";
                a.onclick = backClick(this, i);
            } else {
                lastA = a;
            }
            if (i > 0) {
                var span = document.createElement('span');
                span.innerHTML = " &gt; ";
                p.appendChild(span);
                if (i === l - 1) {
                    lastGt = span;
                }
            }
            p.appendChild(a);
            
        }
        $(lastA).css({"opacity": 0.01, "position": "relative", "left": l === 1 ? 0 : -20})
            .animate({"opacity": 1,  "left": 0}, 1000);
        this.backTag.innerHTML = "";
        this.backTag.appendChild(p);
    };

    /*
     * set user-defined node click handle.
     */
    Treemap.prototype.setLeafNodeClick = function (handler) {
        this.leafNodeClick = handler;
    };

    /*
     * set user-defined node mouseover and mouseout handle.
     */
    Treemap.prototype.hover = function (fin, fout) {
        this.hoverIn = fin;
        this.hoverOut = fout;
    };

    /*
     * compute layout location and reRender.
     */
    Treemap.prototype.reRender = function (options) {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        this.clearCanvas();
        this.setOptions(options);
        this._create2LevelJson(this.selectedTreeNodes[this.selectedTreeNodes.length - 1]);
        this.layout();
        this._setBackTag();
        this.generatePaths();
    };

    /*
     * compute layout location and render from root.
     */
    Treemap.prototype.render = function (options) {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        this.clearCanvas();
        this.setOptions(options);
        this._getNodeTheme = undefined;
        this.selectedTreeNodes = this.selectedTreeNodes.slice(0, 1);
        this._create2LevelJson(this.selectedTreeNodes[0]);
        this.layout();
        this._setBackTag();
        this.generatePaths();
    };

    module.exports = Treemap;
});
