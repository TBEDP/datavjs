/*global EventProxy, d3, Raphael, $ */
/*!
 * Tree的兼容性定义
 */
;(function (name, definition) {
    if (typeof define === 'function') {
        define(definition);
    } else {
        this[name] = definition(function (id) { return this[id];});
    }
})('Tree', function (require) {
    var DataV = require('DataV');
    var theme = DataV.Themes;

    /**
     * Tree的构造函数
     * Examples:
     * ```
     * var tree = new Tree("container");
     * tree.setSource(source);
     * tree.render();
     * ```
     * Options:
     * - `width`: 画布的宽度
     * - `height`: 画布的高度
     */
    var Tree = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Tree";
            this.node = this.checkContainer(node);

            this.addlink = {};

            // Properties
            this.treeDepth = 0;
            this.font = {};

            // Canvas
            this.defaults.width = 750;
            this.defaults.height = 760;
            this.defaults.deep = 180;
            this.defaults.radius = 15;

            this.setOptions(options);
            this.createCanvas();
        }
    });

    /**
     * 饼图纬度描述
     */
    Tree.dimension = {};
    /**
     * ID标签
     */
    Tree.dimension.id = {
        type: "string",
        required: true
    };
    /**
     * 父ID标签
     */
    Tree.dimension.pid = {
        type: "string",
        required: true
    };

    Tree.prototype.hierarchyTableToJson = function (table) {
        if (table[0][0] === "ID") {
            table = table.slice(1);
        }

        var rootID;
        var hierarchy = {};
        var addlink = {}; //for multi-fathernode
        // var ids = _.pluck(table, 0);
        // var pids = _.pluck(table, 3);
        // var roots = _.difference(pids, ids);
        // if (roots.length === 0) {
        //     throw new Error("root node is empty");
        // } else if (roots.length > 1) {
        //     throw new Error("root nodes are too many");
        // }

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
            if (hierarchy[d[0]]) {
                throw new Error("2 or more lines have same ID: " + d[0] + "(line:" + (i + 1) + ").");
            }

            var value = "";
            var j, length;
            if (d.length > 4) {
                for (j = 4, length = d.length; j < length; j++) {
                    if (j < length - 1) {
                        value = value + d[j] + ",";
                    } else {
                        value = value + d[j];
                    }
                }
            }
            hierarchy[d[0]] = {name: d[1], size: d[2], child: [], id: d[0], value: value};
        });
        if (!rootID) {
            throw new Error("No root node defined.");
        }
        table.forEach(function (d, i) {
            if (d[3]) {
                var record;
                var ids = d[3].split(',');
                if (ids.length === 1) {
                    record = hierarchy[d[3]];
                    record.child.push(d[0]);
                } else {
                    record = hierarchy[ids[0]];
                    record.child.push(d[0]);
                    addlink[d[0]] = {child: [], path: [], pnode: []};

                    var j, length;
                    for (j = 1, length = ids.length; j < length;  j++) {
                        addlink[d[0]].child.push(ids[j]);
                    }
                }
                if (!record) {
                    throw new Error("Can not find parent with ID " + d[3] + "(line:" + (i + 1) + ").");
                }
            }
        });

        this.addlink = addlink;

        var recurse = function (rootID) {
            var record = hierarchy[rootID];
            if (record.child.length === 0) {
                if (isNaN(parseFloat(record.size))) {
                    throw new Error("Leaf node's size is not a number(ID:" + (rootID + 1) + ").");
                } else {
                    return {
                        name: record.name,
                        size: record.size,
                        num: record.id,
                        children: null,
                        draw: false,
                        value: record.value
                    };
                }
            } else {
                var childNode = [];
                record.child.forEach(function (d) {
                    childNode.push(recurse(d));
                });
                return {name: record.name, children: childNode, num: record.id, draw: false, value: record.value};
            }
        };

        return recurse(rootID);
    };

    Tree.prototype.setSource = function (source) {
        var conf = this.defaults;

        this.rawData = this.hierarchyTableToJson(source);
        this.source = this.remapSource(source);
        
        this.source.x0 = conf.width / 2;
        this.source.y0 = conf.radius * 10;

        this.source.children.forEach(function collapse(d) {
            if (d.children) {
                // d._children = d.children;
                // d._children.forEach(collapse);
                // d.children = null;
                d._children = null;
                d.children.forEach(collapse);
            }
        });
    };

    Tree.prototype.remapSource = function (data) {
        return this.hierarchyTableToJson(data);
        // return data;
    };

    Tree.prototype.layout = function () {
        var conf = this.defaults;
        var tree = d3.layout.tree()
            .size([conf.width, conf.height]);

        this.nodesData = tree.nodes(this.source);

        var treedepth = 0;
        var id = 0;

        this.nodesData.forEach(function (d) {
            if (d.depth > treedepth) {
                treedepth = d.depth;
            }
        });

        this.treeDepth = treedepth;
        conf.deep = conf.height / (treedepth + 1);

        this.nodesData.forEach(function (d) {
            d.y = conf.radius * 3 + d.depth * conf.deep;
            d.id = id;
            id++;
        });
    };

    Tree.prototype.getColor = function () {
        var colorMatrix = DataV.getColor();
        var color;
        if (colorMatrix.length > 1 && colorMatrix[0].length > 1) {
            color = [colorMatrix[0][0], colorMatrix[1][0]];
        } else {
            color = colorMatrix[0];
        }

        return DataV.gradientColor(color, "special");
    };

    Tree.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.canvas = new Raphael(this.node, conf.width, conf.height);
        this.node.style.position = "relative";
        this.floatTag = DataV.FloatTag()(this.node);

        this.floatTag.css({"visibility": "hidden"});

        this.DOMNode = $(this.canvas.canvas);
        var that = this;
        this.DOMNode.click(function (event) {
            that.trigger("click", event);
        });
        this.DOMNode.dblclick(function (event) {
            that.trigger("dblclick", event);
        });

        var mousewheel = document.all ? "mousewheel" : "DOMMouseScroll";
        this.DOMNode.bind(mousewheel, function (event) {
            that.trigger("mousewheel", event);
        });

        this.DOMNode.bind("contextmenu", function (event) {
            that.trigger("contextmenu", event);
        });

        this.DOMNode.delegate("circle", "click", function (event) {
            that.trigger("circle_click", event);
        });

        this.DOMNode.delegate("circle", "mouseover", function (event) {
            that.trigger("circle_mouseover", event);
        });

        this.DOMNode.delegate("circle", "mouseout", function (event) {
            that.trigger("circle_mouseout", event);
        });
    };

    Tree.prototype.zoom = function (d) {
        var multiple = d || 2;
        var conf = this.defaults;
        conf.width = conf.width * multiple;

        if (conf.height <= this.treeDepth * conf.deep) {
            conf.height = conf.height * multiple;
        }

        //this.createCanvas();
        this.canvas.setSize(conf.width, conf.height);
        this.canvas.setViewBox(0, 0, conf.width, 800);
        this.defaults = conf;

        this.render();
    };


    Tree.prototype.getLinkPath = function (fx, fy, tx, ty) {
        var conf = this.defaults;

        var c1x = fx;
        var c1y = fy + (ty - fy) / 2;
        var c2x = tx;
        var c2y = ty - (ty - fy) / 2;

        var link_path = [["M", fx, fy + conf.radius],
            ["C", c1x, c1y, c2x, c2y, tx, ty - conf.radius]];

        return link_path;
    };

    Tree.prototype.generatePaths = function () {
        var canvas = this.canvas;
        var source = this.source;
        var conf = this.defaults;
        var radius = conf.radius;
        //canvas.clear();
        var color = this.getColor();
        // var font = this.getFont();
        var font_family = '微软雅黑';
        var font_size = 8;
        var treedepth = this.treeDepth;
        var nodesData = this.nodesData;

        var n = 0;

        var addlink = this.addlink;
        var node;
        var num = 0;

        var nodes = canvas.set();
        var path = [];
        var textpath = [];
        
        var tree = this;
        var nodeupdate = function () {
            tree.update(this.data("num"));
        };

        $(this.node).append(this.floatTag);

        var i, nodesLength;
        for (i = 0, nodesLength = nodesData.length; i < nodesLength;  i++) {
            var d =  nodesData[i];
            var parent = d.parent;

            if (addlink[d.num]) {
                var j, k, childLength;
                for (j = 0, childLength = addlink[d.num].child.length; j < childLength; j++) {
                    for (k = 0; k < nodesLength;  k++) {
                        if (nodesData[k].num === addlink[d.num].child[j]) {
                            addlink[d.num].pnode[j] = k;
                            addlink[d.num].path[j] = canvas.path()
                                .attr({ stroke:  "#939598", "stroke-width": 0.5});
                        }
                    }
                }
            }

            var startX;
            var startY;

            if (parent && d.draw) {
                startX = parent.x;
                startY = parent.y;
            } else {
                startX = d.x;
                startY = d.y;
            }
            if (parent) {
                path.push(canvas.path().attr({stroke:  "#939598", "stroke-width": 0.5}));
            }

            nodes.push(
                canvas.circle(startX, startY, radius)
                    .attr({fill: color(d.depth / treedepth),
                        stroke: "#ffffff",
                        "stroke-width": 1,
                        "fill-opacity": 0.4,
                        "data": 12})
                    .data("num", i)
                    .animate({cx: d.x, cy: d.y}, 500, "backOut")
            );

            if (d.children || d._children) {
                nodes[i].click(nodeupdate);
            }

            if (d._children) {
                nodes[i].attr({
                    stroke: color(d.depth / treedepth),
                    "stroke-width": radius,
                    "stroke-opacity": 0.4,
                    "fill-opacity": 1,
                    "r": radius / 2
                });
            }

            if (d.children) {
                textpath.push(canvas.text(d.x, d.y - radius - 7, d.name).attr({'font-size': 12}));
            } else {
                textpath.push(canvas.text(d.x, d.y + radius + 7, d.name).attr({'font-size': 12}));
            }
        }

        // var back = function(pid, x, y){
        //     s.forEach(function (d, i){
        //         if (d.data('pid') == pid){
        //             d.animate({cx: x, cy: y}, 200, "backOut");
        //             if (nodes[i].children)
        //             back(d.data('num'), d.attr('cx'), d.attr('cy'));
        //         }
        //     });
        // };

        // s.forEach(function(d, i) {
        //     d.click(function(){
        //         if (nodes[i].children)
        //         back(d.data('num'), d.attr('cx'), d.attr('cy'));
        //         tree.update(d.data("num"));
        //     });
        // });
        var floatTag = this.floatTag;
        nodes.forEach(function (d, i) {
            $(d.node).attr('value', nodesData[i].value);
            var textY = textpath[i].attr('y');
            var thisradius = d.attr('r');
            var thisstrokewidth = d.attr('stroke-width');
            d.mouseover(function () {
                if (!nodesData[i]._children) {
                    this.animate({r: thisradius + 2, "fill-opacity": 0.75}, 100);
                } else {
                    this.animate({r: thisradius + 2, "stroke-opacity": 0.75}, 100);
                }

                textpath[i].attr({'font-size': 20});

                if (i > 0) {
                    if (!nodesData[i].children) {
                        textpath[i].animate({'y': textY + 12}, 100, "backOut");
                    } else {
                        textpath[i].animate({'y': textY - 12}, 100, "backOut");
                    }
                }

                var getFline = function (node, num) {
                    var parent = node.parent;
                    if (parent) {
                        path[node.id - 1].attr({"stroke-width": 4, "stroke-opacity": num});
                        if ( num > 0.5) {
                            num = num - 0.1;
                        }
                        getFline(parent, num);
                    }
                };

                getFline(nodesData[i], 0.9);

                var thisparent = nodesData[i].parent;
                var j, textpathLength;
                for (j = 0, textpathLength = textpath.length; j < textpathLength; j++) {
                    var parent = nodesData[j].parent;
                    if (parent === thisparent && j !== i) {
                        textpath[j].animate({'fill-opacity': 0.4});
                    }
                }

                console.log(nodesData[i]);
                floatTag.html('<div style = "text-align: center;margin:auto;color:#ffffff">' + nodesData[i].name + '</div>');
                floatTag.css({"visibility" : "visible"});
            })
            .mouseout(function () {
                floatTag.css({"visibility" : "hidden"});
                if (!nodesData[i]._children) {
                    this.animate({r: thisradius, "fill-opacity": 0.4}, 100);
                } else {
                    this.animate({r: thisradius, "stroke-width": thisstrokewidth, "stroke-opacity": 0.4}, 100);
                }
                textpath[i].attr({'font-size': 12});
                textpath[i].animate({'y': textY}, 100, "backOut");

                var getFline = function (node) {
                    var parent = node.parent;
                    if (parent) {
                        path[node.id - 1].attr({"stroke-width": 0.5, "stroke-opacity": 1});
                        getFline(parent);
                    }
                };
                getFline(nodesData[i]);

                var thisparent = nodesData[i].parent;
                var j, textpathLength;
                for (j = 0, textpathLength = textpath.length; j < textpathLength; j++) {
                    var parent = nodesData[j].parent;
                    if (parent === thisparent && j !== i) {
                        textpath[j].animate({'fill-opacity': 1});
                    }
                }
            });
        });

        nodes.onAnimation(function () {
            var pathNum = 0;
            var i, nodeslength;
            
            for (i = 1, nodeslength = nodes.length; i < nodeslength;  i++) {
                var d = nodes[i];
                var node = nodesData[i];
                var parent = node.parent;
                
                path[pathNum]
                    .attr({path: tree.getLinkPath(parent.x, parent.y, d.attr("cx"), d.attr("cy"))});
                    
                pathNum++;

                if (addlink[node.num]) {
                    var j, k, linkchildLength, nodesLength;
                    for (j = 0, linkchildLength = addlink[node.num].child.length; j < linkchildLength; j++) {
                        for (k = 0, nodesLength = nodesData.length; k < nodesLength;  k++) {
                            var anparent = nodesData[k];
                            if (anparent.num === addlink[node.num].child[j]) {
                                var link_path = tree.getLinkPath(anparent.x, anparent.y, d.attr("cx"), d.attr("cy"));
                                addlink[node.num].path[j].attr({path: link_path});
                            }
                        }
                    }
                }
            }
        });

        this.nodes = nodes;
        this.path = path;
        this.textpath = textpath;
    };
    
    Tree.prototype.update = function (i) {
        var source = this.source;
        var conf = this.defaults;

        source.children.forEach(function clearDraw(d) {
            d.draw = false;
            if (d.children) {
                d.children.forEach(clearDraw);
            }
        });

        source.children.forEach(function find(d) {
            if (d.id === i) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    if (d.children) {
                        d.children.forEach(function drawn(child) {
                            child.draw = true;
                            if (child.children) {
                                child.children.forEach(drawn);
                            }
                        });
                    }
                    d._children = null;
                }
            } else {
                if (d.children) {
                    d.children.forEach(find);
                }
            }
        });
        this.source = source;
        this.source.x0 = conf.width / 2;
        this.source.y0 = conf.radius * 2;
        this.render();
    };
    
    /**
     * 渲染Tree
     */
    Tree.prototype.render = function (options) {
        this.canvas.clear();
        this.setOptions(options);
        this.layout();
        // var st2 = new Date().getTime();
        this.generatePaths();
        // var et = new Date().getTime();
        //this.canvas.renderfix();
    };

    return Tree;
});
