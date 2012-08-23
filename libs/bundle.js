/*global EventProxy, d3, Raphael, self, packages, $ */

//function：弦+文字+高亮某弦
define(function (require, exports, module) {
    var DataV = require('datav');

    //构造函数，container参数表示在html的哪个容器中绘制该组件
    //options对象为用户自定义的组件的属性，比如画布大小
    var Bundle = DataV.extend(DataV.Chart, {
        initialize: function (container, options) {
            this.type = "Bundle";
            this.container = this.checkContainer(container);
            this.defaults = {};
            this.jsn = {};
    
            // 图的半径
            this.defaults.diameter = 960;
            this.defaults.radius = this.defaults.diameter / 2;
            this.defaults.innerRadius = this.defaults.radius - 120;
            this.defaults.tension = 0.85;
    
            this.defaults.color = {
                defaultLineColor: "#4065AF",
                defaultWordColor: "#000000",
                lineHoverColor: "#02B0ED",
                nodeHoverColor: "#02B0ED",
                importNodesColor: "#5DA714", //被引用的节点
                exportNodesColor: "#FE3919" //引用当前节点的节点
            };
    
            this.setOptions(options);
            this.createCanvas();
        }
    });

    //返回
    Bundle.prototype.checkContainer = function (container) {
        if (!container) {
            throw new Error("Please specify which container to render.");
        }
        if (typeof (container) === "string") {
            return document.getElementById(container); //如果container为string，但是html中不存在该container，那么return返回空object
        } else if (container.nodeName) { //DOM-element
            return container;
        }
        throw new Error("Please specify which container to render.");
    };

    //设置用户自定义属性
    Bundle.prototype.setOptions = function (options) {
        if (options) {
            var prop;
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                    if (prop === "diameter") {
                        this.defaults.radius = this.defaults.diameter / 2;
                        this.defaults.innerRadius = this.defaults.radius - 120;
                    } else if (prop === "radius") {
                        this.defaults.diameter = this.defaults.radius * 2;
                        this.defaults.innerRadius = this.defaults.radius - 120;
                    } else if (prop === "innerRadius") {
                        this.defaults.radius = this.defaults.innerRadius + 120;
                        this.defaults.diameter = this.defaults.radius * 2;
                    } else if (prop === "width") {
                        this.defaults.diameter = this.defaults.width;
                        this.defaults.radius = this.defaults.diameter / 2;
                        this.defaults.innerRadius = this.defaults.radius - 120;
                    }
                }
            }
        }
    };

    //对原始数据进行处理
    Bundle.prototype.setSource = function (source) {
        if (source[0] && source[0] instanceof Array) {
            // csv or 2d array source
            if (source[0][0] === "name") { 
                source = source.slice(1); // 从第一行开始，第0行舍去
            }
            var nData = [];
            var imports = [];
            //var isNode = true;
            var nodeNum;
            var that = this;
            source.forEach(function (d, i) {
                if (d[0] === "") {
                    throw new Error("name can not be empty(line:" + (i + 1) + ").");
                }
                if (d[1] !== "") {
                    imports = d[1].split(" ");
                }
                nData[i] = {
                    name: d[0],
                    imports: imports
                };
            });
            this.jsn = nData;
        } else {
            // json source
            this.jsn = source;
        }
    };

    Bundle.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.canvas = new Raphael(this.container, conf.diameter, conf.diameter);

        //var c = this.canvas.circle(50, 50, 40);
    };

    Bundle.prototype.layout = function () {
        var packages = {
            // Lazily construct the package hierarchy from class names.
            root: function (classes) {
                var map = {};
                function construct(name, data) {
                    var node = map[name], i;
                    if (!node) {
                        node = map[name] = data || {name: name, children: []};
                        if (name.length) {
                            node.parent = construct(name.substring(0, i = name.lastIndexOf(".")));
                            node.parent.children.push(node);
                            node.key = name.substring(i + 1);
                        }
                    }
                    return node;
                }
          
                classes.forEach(function (d) {
                    construct(d.name, d);
                });
          
                return map[""];
            },
        
            // Return a list of imports for the given array of nodes.
            imports: function (nodes) {
                var map = {},
                    imports = [];
          
                // Compute a map from name to node.
                nodes.forEach(function (d) {
                    map[d.name] = d;
                });
          
                // For each import, construct a link from the source to target node.
                nodes.forEach(function (d) {
                    if (d.imports) {
                        d.imports.forEach(function (i) {imports.push({source: map[d.name], target: map[i]});
                            });
                    }
                });
          
                return imports;
            }
        };
        
        var cluster = d3.layout.cluster()
            .size([360, this.defaults.innerRadius]) //.size(角度，半径)
            .sort(null)
            .value(function (d) {
                return d.size;
            });
        this.nodes = cluster.nodes(packages.root(this.jsn));
        this.links = packages.imports(this.nodes);
    };

    Bundle.prototype.render = function () {
        this.layout();
        this.generatePaths();
    };

    Bundle.prototype.generatePaths = function (options) {
        var that = this;

        if (!this.container) {
            throw new Error("Please specify on which container to render the chart.");
        }

        var canvas = this.canvas;
        var rNodes = canvas.set();
        var rLinks = canvas.set();

        var bundle = d3.layout.bundle();

        var line = d3.svg.line.radial()
            .interpolate("bundle")
            .tension(this.defaults.tension)
            .radius(function (d) {
                return d.y;
            })
            .angle(function (d) {
                return d.x / 180 * Math.PI;
            });

        //定义图中的弦和节点
        var nodes = this.nodes;
        var links = this.links;
        var linksCount = links.length;
        var paths = bundle(links);

        var locateStr = ""; //对文字进行平移和旋转
        var locateBBox = ""; //对文字的bounding box进行平移和旋转
        var r = 0;
        var angle = 0;
        var xTrans = 0;
        var yTrans = 0;
        var anchor; //text-anchor: start or end
        var rotateStr = "";

        //element data cache
        var nodeRelatedElements = {};// {key: {targetLink: [], sourceLink: [], targetNode: [], sourceNode: []}} 
        var nodeElements = {}; //{key: Els}
        var bBoxElements = {}; //{key: Els}

        var i,
            j,
            key,
            textEl,
            bBox,
            bBoxNew,
            tCenterX,
            tCenterY,
            bBoxEl,
            linkEl;

        var mouseoverLink = function () {
            var current = this;
            //var color = that.data("color");
            if (rLinks.preLink) { 
                rLinks.preLink.attr("stroke", that.defaults.color.defaultLineColor)
                    .attr("stroke-width", 1)
                    .attr("stroke-opacity", 0.6);

            }
            rLinks.preLink = this;

            current.attr("stroke", that.defaults.color.lineHoverColor)
                .attr("stroke-width", 2)
                .attr("stroke-opacity", 1.0)
                .toFront(); //把当前弦移到画布最上层            
        };

        /*
        var mouseoutLink = function () {
            var current = this;
            //var color = that.data("color");
            current.attr("stroke", that.defaults.color.defaultLineColor)
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.6);
        };   
        */

        var mouseoverNode = function () {
            var relatedEl = this.data("relatedElements");
            //高亮所选节点的文字颜色
            this.data("relatedNode").attr({"fill": that.defaults.color.nodeHoverColor, 
                "fill-opacity": 1.0, "font-weight": "600"});
            //将包围盒颜色设为透明
            this.attr({"fill": that.defaults.color.nodeHoverColor, "fill-opacity": 0.0/*, "font-weight": "600"*/});
            
            relatedEl.sourceLink.forEach(function (d) { //set green
                d.attr({"stroke": that.defaults.color.importNodesColor, "stroke-width": 1, "stroke-opacity": 0.9})
                    .toFront();
            });
            relatedEl.sourceNode.forEach(function (d) { 
                d.attr({"fill": that.defaults.color.importNodesColor, "font-weight": "600"});
            });
            relatedEl.targetLink.forEach(function (d) { //set red
                d.attr({"stroke": that.defaults.color.exportNodesColor, "stroke-width": 1, "stroke-opacity": 0.9})
                    .toFront();
            });
            relatedEl.targetNode.forEach(function (d) {
                d.attr({"fill": that.defaults.color.exportNodesColor, "font-weight": "600"});
            });
        };   

        var mouseoutNode = function () {
            var relatedEl = this.data("relatedElements");
            this.data("relatedNode").attr({"fill": that.defaults.color.defaultWordColor, 
                "font-weight": "400", "fill-opacity": 1.0});
            relatedEl.targetLink.forEach(function (d) {
                d.attr({"stroke": that.defaults.color.defaultLineColor, "stroke-width": 1, "stroke-opacity": 0.6});
            });
            relatedEl.targetNode.forEach(function (d) {
                d.attr({"fill": that.defaults.color.defaultWordColor, "font-weight": "400"});
            });
            relatedEl.sourceLink.forEach(function (d) {
                d.attr({"stroke": that.defaults.color.defaultLineColor, "stroke-width": 1, "stroke-opacity": 0.6});
            });
            relatedEl.sourceNode.forEach(function (d) {
                d.attr({"fill": that.defaults.color.defaultWordColor, "font-weight": "400"});
            });
        };

        for (j = 0; j < nodes.length; j++) {
            //若为叶子节点
            if (!nodes[j].children) {                    
                locateStr = "T" + that.defaults.radius + "," + that.defaults.radius + "R"; //使用大写T、R、S--绝对，not相对

                //半径: add a padding between lines and words
                r = nodes[j].y + 20;

                //计算旋转角度和水平、竖直方向所需平移的距离
                angle = (nodes[j].x - 90) * Math.PI / 180;
                xTrans = r * Math.cos(angle);
                yTrans = r * Math.sin(angle);

                //计算text-anchor
                if (nodes[j].x < 180) {
                    anchor = "start";
                } else {
                    anchor = "end";
                }

                //计算文字方向是否需要旋转180度
                if (nodes[j].x < 180) {
                    rotateStr = "";
                } else {
                    rotateStr = "R180";
                }

                //计算文字需要如何经过平移和旋转被排列在圆周上
                locateStr += (nodes[j].x - 90) + rotateStr + "T" + xTrans + "," + yTrans;

                //绘制文字
                textEl = canvas.text()
                    .attr("font", "11px arial")
                    .data("color", that.defaults.color)
                    .attr("text", nodes[j].key)
                    //.attr("title", nodes[j].size)
                    .transform(locateStr)
                    .attr("text-anchor", anchor)                        
                    .attr("fill", that.defaults.color.defaultWordColor);

                //获取旋转平移之前文字的bounding box
                bBox = textEl.getBBox(true);

                //canvas.rect(bBox.x, bBox.y, bBox.width, bBox.height);
                //获取旋转平移之后文字的bounding box
                bBoxNew = textEl.getBBox();
                //adjust vml box center
                if (Raphael.vml) {
                    //vml's word bbox is not related to text-anchor, always middle;
                    //svg's word bbox is related to text-anchor;
                    bBoxNew.x = bBoxNew.x + bBox.width / 2 * Math.cos(angle);
                    bBoxNew.y = bBoxNew.y + bBox.width / 2 * Math.sin(angle);
                }
                //canvas.rect(bBoxNew.x, bBoxNew.y, bBoxNew.width, bBoxNew.height);

                //新旧bounding box的中心坐标变化
                tCenterX = bBoxNew.x + bBoxNew.width / 2 - bBox.x - bBox.width / 2;
                tCenterY = bBoxNew.y + bBoxNew.height / 2 - bBox.y - bBox.height / 2;
                //对bounding box进行平移和旋转
                locateBBox = "T" + tCenterX + "," + tCenterY + "R" + (nodes[j].x - 90) + rotateStr;

                // 包围盒
                bBoxEl = canvas.rect(bBox.x, bBox.y, bBox.width, bBox.height)
                    .transform(locateBBox)
                    .data("relatedNode", textEl)
                    .attr({"fill": "#fff", "opacity": 0.01});
                
                key = nodes[j].key;
                nodeElements[key] = textEl;
                bBoxElements[key] = bBoxEl;
                nodeRelatedElements[key] = {targetLink: [], sourceLink: [], targetNode: [], sourceNode: []};

                rNodes.push(textEl);
            }
        }

        //绘制曲线
        for (i = 0; i < linksCount; i++) {
            var l = paths[i];

            //对paths数组中的每一项进行计算，由路径节点信息得到坐标值
            var spline = line(l);
            var sourceKey = links[i].source.key;
            var targetKey = links[i].target.key;
            var tips = "link source: " + sourceKey  + "\n" 
                        + "link target: " + targetKey;

            linkEl = canvas.path(spline)
                //.attr("stroke", that.defaults.defaultLineColor)
                .attr("stroke-opacity", 0.6)
                .attr("title", tips)                    
                .attr("d", spline)
                .attr("stroke", that.defaults.color.defaultLineColor)
                .translate(that.defaults.radius, that.defaults.radius)
                .mouseover(mouseoverLink);
                //.mouseout(mouseoutLink);
            linkEl[0].el = linkEl;

            nodeRelatedElements[sourceKey].targetLink.push(linkEl);
            nodeRelatedElements[sourceKey].targetNode.push(nodeElements[targetKey]);
            nodeRelatedElements[targetKey].sourceLink.push(linkEl);
            nodeRelatedElements[targetKey].sourceNode.push(nodeElements[sourceKey]);
            rLinks.push(linkEl);
        }

        $(this.canvas.canvas).mousemove(function (e) {
                    if(!e.target.el && rLinks.preLink){
                        rLinks.preLink.attr("stroke", that.defaults.color.defaultLineColor)
                            .attr("stroke-width", 1)
                            .attr("stroke-opacity", 0.6);
                        rLinks.preLink = undefined;
                        //console.log("a");
                    }
                });

        //bind text words hover event 
        for (key in bBoxElements) {
            if (bBoxElements.hasOwnProperty(key)) {
                bBoxElements[key].data("relatedElements", nodeRelatedElements[key])
                    .mouseover(mouseoverNode)
                    .mouseout(mouseoutNode);                
            }
        }

    };    

    module.exports = Bundle;
});
