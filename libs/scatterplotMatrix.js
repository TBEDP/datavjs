/*global EventProxy, d3, Raphael, $ */
define(function (require, exports, module) {
    var DataV = require('datav');

    var ScatterplotMatrix = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "ScatterplotMatrix";
            this.container = node;
            this.node = this.checkNode(node);
            this.defaults = {};

            // Properties
            this.defaults.allDimensions = [];
            this.defaults.dimensionsX = []; //dimension of X axis(horizonal).  array type
            this.defaults.demensionsY = []; //dimension of Y axis(vertical).  array type
            this.defaults.dimensionDomain = {};
            this.defaults.typeNames = [];

            // canvas parameters
            this.defaults.width = 522;
            this.defaults.height = 522;
            this.defaults.margin = 50;
            this.defaults.gap = 15;
            this.defaults.squareWidth = 150;
            this.defaults.circleR = 3;

            //图例区域的左上顶点坐标x，y，宽，高
            this.defaults.tagArea = [20, (this.defaults.height - 20 - 220), 200, 220];
            //简介区域的左上角顶点坐标x，y，宽，高
            this.defaults.introArea = [20, 20, 200, 200];
            //散点矩阵区域的左上顶点坐标x，y，宽，高
            this.defaults.diagramArea = [240, 20, (this.defaults.width - 260), (this.defaults.height - 40)];

            this.defaults.typeName = "NoTypeDefinition"; //默认情况是没有分类
            this.defaults.tagDimen = "NoTagDimen";


            this.setOptions(options);
            this.createCanvas();
        }
    });

    //check the DOM node to draw
    ScatterplotMatrix.prototype.checkNode = function (node) {
        if (!node) {
            throw new Error("Please specify which node to render.");
        }
        if (typeof (node) === "string") {
            return document.getElementById(node);
        } else if (node.nodeName) { //DOM-element
            return node;
        }
        throw new Error("Please specify which node to render.");
    };

    //check if a string is in an array
    var _strInArray = function (str, array) {
        var i = 0,
            l = 0;
        for (i = 0, l = array.length; i < l; i++) {
            if (array[i] === str) {
                return true;
            }
        }
        return false;
    };

    //设置X轴的维度
    ScatterplotMatrix.prototype.setDimensionsX = function (dimen) {
        if (!dimen) {
            throw new Error("Please specify the dimensions.");
        }
        var conf = this.defaults;
        conf.dimensionsX = [];
        var i = 0,
            l = 0;
        for (i = 0, l = dimen.length; i < l; i++) {
            if (_strInArray(dimen[i], conf.allDimensions)) {
                conf.dimensionsX.push(dimen[i]);
            }
        }
    };

    //设置Y轴的维度
    ScatterplotMatrix.prototype.setDimensionsY = function (dimen) {
        if (!dimen) {
            throw new Error("Please specify the dimensions.");
        }
        var conf = this.defaults;
        conf.dimensionsY = [];
        var i = 0,
            l = 0;
        for (i = 0, l = dimen.length; i < l; i++) {
            if (_strInArray(dimen[i], conf.allDimensions)) {
                conf.dimensionsY.push(dimen[i]);
            }
        }
    };

    //设置类型的名字
    ScatterplotMatrix.prototype.setTypeName = function (types) {
        this.defaults.typeNames = types;
    };

    //额外选项
    ScatterplotMatrix.prototype.setOptions = function (options) {
        var prop;
        if (options) {
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }
    };
    //设置源数据
    ScatterplotMatrix.prototype.setSource = function (source) {
        var i, j, l, ll;
        var conf = this.defaults;

        var xTemp = [],
            yTemp = [];
        for (i = 1; i < source[0].length; i++) {
            xTemp[i - 1] = source[0][i];
            yTemp[i - 1] = source[0][i];
        }
        conf.allDimensions = source[0];
        //默认情况下，所有维度都显示
        conf.dimensionsX = xTemp;
        conf.dimensionsY = yTemp;

        //this.source is array of line; key is dimension, value is line's value in that dimension 
        this.source = [];

        for (i = 1, l = source.length; i < l; i++) {
            var line = {}, dimenT = conf.allDimensions;
            for (j = 0, ll = dimenT.length; j < ll; j++) {
                line[dimenT[j]] = source[i][j]; //each line is an array, contains value for each dimension
            }
            this.source.push(line);
        }

        //设置默认的定义域
        var getExtent = function (s, dimen) {
            return d3.extent(s, function (p) {
                return +p[dimen];
            });
        };
        var dimen;
        for (i = 0, l = conf.allDimensions.length; i < l; i++) {
            dimen = conf.allDimensions[i];
            conf.dimensionDomain[dimen] = getExtent(this.source, dimen);
        }
    };

    //设置X轴和Y轴
    ScatterplotMatrix.prototype.setAxis = function () {
        var conf = this.defaults;

        conf.tagArea = [20, (conf.height - 20 - 220), 200, 220];
        conf.introArea = [20, 20, 200, 200];
        conf.diagramArea = [240, 20, /*500, 500*/ (conf.width - 260), (conf.height - 40)];

        var w = conf.diagramArea[2] - 2 * conf.margin,
            h = conf.diagramArea[3] - conf.margin,
            g = conf.gap,
            nX = conf.dimensionsX.length,
            nY = conf.dimensionsY.length,
            wX = d3.round((w - (nX - 1) * g) / nX),
            wY = d3.round((h - (nY - 1) * g) / nY),
            sw = d3.min([wX, wY]);

        this.defaults.squareWidth = sw;
        this.defaults.dX = conf.dimensionsX[0];
        this.defaults.dY = conf.dimensionsY[0];

        this.x = {};
        this.y = {};
        var x = this.x,
            y = this.y;
        var tickAr = [5];

        //设置X轴
        var i, l, dimen, begin, end;
        for (i = 0, l = conf.dimensionsX.length; i < l; i++) {
            dimen = conf.dimensionsX[i];
            begin = i * (sw + g) + conf.diagramArea[0] + 30;
            end = begin + sw;
            x[dimen] = d3.scale.linear().domain(conf.dimensionDomain[dimen]).range([begin, end]);
            x[dimen].ticks = x[dimen].ticks.apply(x[dimen], tickAr);
        }
        //设置Y轴
        for (i = 0, l = conf.dimensionsY.length; i < l; i++) {
            dimen = conf.dimensionsY[i];
            end = i * (sw + g) + conf.diagramArea[1] + 30;
            begin = end + sw;
            y[dimen] = d3.scale.linear().domain(conf.dimensionDomain[dimen]).range([begin, end]);
            y[dimen].ticks = y[dimen].ticks.apply(y[dimen], tickAr);
        }
    };

    //画散点矩阵
    ScatterplotMatrix.prototype.drawDiagram = function () {
        var i, j, k, z, ticks;
        var conf = this.defaults,
            x = this.x,
            y = this.y,
            sw = conf.squareWidth,
            g = conf.gap,
            cR = conf.circleR;

        var paper = this.canvas;
        var sourceData = this.source;

        var dimensionsX = conf.dimensionsX,
            dimensionsY = conf.dimensionsY,
            lx = dimensionsX.length,
            ly = dimensionsY.length;

        var browserName = navigator.appName;
        var that = this;

        $("#" + this.containers).append(this.floatTag);

        //画背景点------------------------------------------------------------------------//
        var circlesBg = paper.set(); //背景点
        var centerPos;
        for (k = 0; k < sourceData.length; k++) {
            for (i = 0; i < lx; i++) {
                for (j = 0; j < ly; j++) {
                    centerPos = this.circleCenter(k, dimensionsX[i], dimensionsY[j]);
                    if (browserName !== "Microsoft Internet Explorer") {
                        circlesBg.push(paper.circle(centerPos[0], centerPos[1], cR).attr({
                            "fill": "gray",
                            "stroke": "none",
                            "opacity": 0.2
                        }));
                    }
                }
            }
        }

        //画矩形框 ------------------------------------------------------------------------// 
        var squares = paper.set();
        var x1, y1;
        for (i = 0; i < lx; i++) {
            for (j = 0; j < ly; j++) {
                x1 = x[dimensionsX[i]].range()[0];
                y1 = y[dimensionsY[j]].range()[1];
                squares.push(paper.rect(x1 - 1, y1 - 1, sw + 2, sw + 2));
            }
        }
        squares.attr({
            "fill": "white",
            "fill-opacity": 0.5, //背景点的蒙版
            "stroke": "#d6d6d6",
            "stroke-width": '1px'
        });

        //画虚线 --------------------------------------------------------------------//
        var reLines = paper.set(),
            tickText = paper.set();
        var tickAr = [10], //set the number of ticks
            leftPos = x[dimensionsX[0]].range()[0],
            rightPos = x[dimensionsX[lx - 1]].range()[1],
            upPos = y[dimensionsY[0]].range()[1],
            downPos = y[dimensionsY[ly - 1]].range()[0];

        var reLineGap = sw / 7; //每个矩形框中画6条虚线
        var reLinePos;

        //画纵向的虚线 ---------------------------------------------------------------------//
        for (i = 0; i < lx; i++) {
            ticks = x[dimensionsX[i]].ticks;
            for (j = 0; j < ticks.length; j++) {
                tickText.push(paper.text((x[dimensionsX[i]](ticks[j])), downPos + 6, ticks[j]).attr({
                    "fill": "#aaaaaa",
                    "fill-opacity": 0.7,
                    "font-family": "雅黑",
                    "font-size": 12
                }).attr({
                    "text-anchor": "end"
                }).rotate(-45, x[dimensionsX[i]](ticks[j]), downPos + 6));
            }
            for (z = 1; z < 7; z++) {
                reLinePos = x[dimensionsX[i]].range()[0] + z * reLineGap;
                reLines.push(paper.path("M" + (reLinePos) + "," + (upPos) + "L" + (reLinePos) + "," + (downPos)).attr({
                    "stroke": "#ebebeb",
                    "stroke-dasharray": "-"
                }));
            }
        }
        //画横向的虚线 ---------------------------------------------------------------------//
        for (i = 0; i < ly; i++) {
            //draw reference lines
            ticks = y[dimensionsY[i]].ticks;
            for (j = 0; j < ticks.length; j++) {
                tickText.push(paper.text(rightPos + 6, y[dimensionsY[i]](ticks[j]), ticks[j]).attr({
                    "fill": "#aaaaaa",
                    "fill-opacity": 0.7,
                    "font-family": "雅黑",
                    "font-size": 12
                }).attr({
                    "text-anchor": "start"
                }).rotate(315, rightPos + 6, y[dimensionsY[i]](ticks[j])));
            }
            for (z = 1; z < 7; z++) {
                reLinePos = y[dimensionsY[i]].range()[1] + z * reLineGap;
                reLines.push(paper.path("M" + (leftPos) + "," + (reLinePos) + "L" + (rightPos) + "," + (reLinePos)).attr({
                    "stroke": "#ebebeb",
                    "stroke-dasharray": "-"
                }));
            }
        }

        //坐标轴名称 --------------------------------------------------------------------------// 
        var axText = paper.set();
        var xPos, yPos;
        var pos = y[dimensionsY[0]].range()[1] - 10;
        for (i = 0; i < lx; i++) {
            xPos = x[dimensionsX[i]].range()[0] + sw / 2;
            axText.push(paper.text(xPos, pos, dimensionsX[i]).attr({
                "fill": "#000000",
                "fill-opacity": 0.7,
                "font-family": "Verdana",
                //"font-weight": "bold",
                "font-size": 12
            }).attr({
                "text-anchor": "middle"
            }));
        }

        pos = x[dimensionsX[0]].range()[0] - 10;
        for (i = 0; i < ly; i++) {
            yPos = y[dimensionsY[i]].range()[1] + sw / 2;
            axText.push(paper.text(pos, yPos, dimensionsY[i]).attr({
                "fill": "#000000",
                "fill-opacity": 0.7,
                "font-family": "Verdana",
                //"font-weight": "bold",
                "font-size": 12
            }).attr({
                "text-anchor": "middle"
            }).rotate(-90, pos, yPos));
        }

        //画前景点 ---------------------------------------------------------------------------// 
        var circlesFg = []; //circles in foreground   
        var circleType = -1;
        var typeMax = -1;

        this.preIndex = "start";
        this.linePosition = [0,0];
        //水平虚线
        that.lineH = paper.path("M" + (leftPos) + "," + (0) + "L" + (rightPos) + "," + (0)).attr({
            "stroke-dasharray": "- ",
            'stroke': '#000000'
        }).hide();
        //垂直虚线
        that.lineV = paper.path("M" + (0) + "," + (upPos) + "L" + (0) + "," + (downPos)).attr({
            "stroke-dasharray": "- ",
            'stroke': '#000000'
        }).hide();
        var hoverTag;
        var circle;
        for (k = 0; k < sourceData.length; k++) {
            if (conf.typeName !== "NoTypeDefinition") { //classify the circles according to their types
                circleType = sourceData[k][conf.typeName] - 1;
                typeMax = Math.max(typeMax, circleType);
            } else {
                circleType = 0;
            }
            for (i = 0; i < lx; i++) {
                for (j = 0; j < ly; j++) {
                    centerPos = this.circleCenter(k, dimensionsX[i], dimensionsY[j]);
                    //前景点
                    circle = paper.circle(centerPos[0], centerPos[1], cR)
                    .data("type", circleType)
                    .data("canHover", 0)
                    .data("position", centerPos)
                    .data('colorType', circleType)
                    .attr({
                        "fill": "#800",
                        "stroke": "none",
                        "opacity": 0.5
                    }).attr({
                        "fill": this.getColor(circleType)
                    });
                    //如果制定了hover要显示的文字，则hover显示的文字
                    if (conf.tagDimen !== "NoTagDimen") {
                        hoverTag = conf.tagDimen + ": " + sourceData[k][conf.tagDimen];
                        circle.data("tag", hoverTag);
                    }
                    circlesFg.push(circle);
                }
            }
        }

        //图例--- ------------------------------------------------------------------//
        if (browserName !== "Microsoft Internet Explorer") {
            var tagArea = this.defaults.tagArea;
            var rectBn = paper.set();
            var underBn = [];
            for (i = 0; i <= typeMax; i++) {
                //底框
                underBn.push(paper.rect(tagArea[0] + 10, tagArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
                    "fill": "#ebebeb",
                    "stroke": "none"
                }).hide());
                //色框
                paper.rect(tagArea[0] + 10 + 3, tagArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
                    "fill": this.getColor(i),
                    "stroke": "none"
                });
                //文字
                paper.text(tagArea[0] + 10 + 3 + 16 + 8, tagArea[1] + 10 + (20 + 3) * i + 10, conf.typeNames[i]).attr({
                    "fill": "black",
                    "fill-opacity": 1,
                    "font-family": "Verdana",
                    "font-size": 12
                }).attr({
                    "text-anchor": "start"
                });
                //选框
                rectBn.push(paper.rect(tagArea[0] + 10, tagArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
                    "fill": "white",
                    "fill-opacity": 0,
                    "stroke": "none"
                    //"r": 3
                }).data("type", i)).data("clicked", 0);
            }

            rectBn.forEach(function (d, i) {
                underBn[i].data('tagclicked', false);
                d.mouseover(function () {
                    if (underBn[i].data('tagclicked') === false) {
                        underBn[i].attr('opacity', 0.5).show();
                    }
                }).mouseout(function () {
                    if (underBn[i].data('tagclicked') === false) {
                        underBn[i].hide();
                    }
                });
                d.click(function () {
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
                        underBn[i].attr('opacity', 1).show();
                        underBn[i].data('tagclicked', true);
                        circlesFg.forEach(function (ec) {
                            if (ec.data("type") !== d.data("type")) {
                                ec.hide();
                                ec.data("canHover", 0);
                            } else {
                                ec.show();
                                ec.data("canHover", 1);
                            }
                        });
                        d.data("clicked", 1);
                    } else if (d.data("clicked") === 1) {
                        underBn[i].hide();
                        underBn[i].data('tagclicked', false);
                        d.data("clicked", 0);
                        circlesFg.forEach(function (ec) {
                            ec.show();
                            ec.data("canHover", 0);
                        });
                    }
                });
            });

            //Bursh函数定义 --------------------------------------------------------------//
            var curBrush;

            function brushstart() {
                if (curBrush !== undefined && curBrush !== d3.event.target) {
                    curBrush.clear();
                }
                var i;
                for (i = 0; i < circlesFg.length; i++) {
                    circlesFg[i].hide();
                    circlesFg[i].data("canHover", 0);
                }
                underBn.forEach(function (ub) {
                    ub.hide();
                });
                rectBn.forEach(function (rb) {
                    rb.data("clicked", 0);
                });
            }

            function brush() {
                curBrush = d3.event.target;

                var e = curBrush.extent(),
                    dimX = d3.event.target.dimX,
                    dimY = d3.event.target.dimY,
                    tempX,
                    tempY,
                    count = lx * ly,
                    i,
                    z;

                for (i = 0; i < sourceData.length; i++) {
                    tempX = sourceData[i][dimX];
                    tempY = sourceData[i][dimY];
                    if (e[0][0] - 1 <= tempX && tempX <= e[1][0] + 1 && e[0][1] - 1 <= tempY && tempY <= e[1][1] + 1) {
                        for (z = 0; z < count; z++) {
                            circlesFg[i * count + z].show();
                        }
                    } else {
                        for (z = 0; z < count; z++) {
                            circlesFg[i * count + z].hide();
                        }
                    }
                }
            }

            function brushend() {
                if (d3.event.target.empty()) {
                    circlesFg.forEach(function (d) {
                        d.show();
                    });
                }
            }

            //Brush交互 -----------------------------------------------------------------------//
            var brushes = [];
            var b;
            for (i = 0; i < lx; i++) {
                for (j = 0; j < ly; j++) {
                    b = DataV.Brush().x(x[dimensionsX[i]]).y(y[dimensionsY[j]]).backgroundAttr({
                        "opacity": 0, //背景颜色：白色、全透明
                        "fill": "white"
                    }).foregroundAttr({ //选框颜色
                        "opacity": 0.2,
                        "fill": "#fff700"
                    }).on("brushstart", brushstart).on("brush", brush).on("brushend", brushend);
                    b(paper);
                    b.dimX = dimensionsX[i];
                    b.dimY = dimensionsY[j];
                    brushes.push(b);
                }
            }
            //hover交互 -------------------------------------------------------------------------//
            //var preIndex = "start";
            var floatTag = this.floatTag;
            $(paper.canvas).bind("mousemove", function (e) {
                var bgOffset = $(this).parent().offset();
                var mouse = [e.pageX - bgOffset.left, e.pageY - bgOffset.top];
                var location = [Math.floor((mouse[0] - leftPos) / (sw + g)), Math.floor((mouse[1] - upPos) / (sw + g))];
                if (that.preIndex !== "start") {
                    that.lineV.hide();
                    that.lineH.hide();
                    if (conf.tagDimen !== "NoTagDimen") {
                        floatTag.css({"visibility" : "hidden"});
                    }
                }
                if (location[0] >= 0 && location[0] <= lx && location[1] >= 0 && location[1] <= ly) {
                    for (i = location[0] * ly + location[1]; i < circlesFg.length; i = i + lx * ly) {
                        var center = circlesFg[i].data("position");
                        var canHover = circlesFg[i].data("canHover");
                        if ((canHover === 1) && (Math.abs(mouse[0] - center[0]) <= cR) && (Math.abs(mouse[1] - center[1]) <= cR)) {
                            that.lineV.translate(center[0] - that.linePosition[0], 0).attr('stroke', that.getColor(circlesFg[i].data('colorType'))).show();
                            that.lineH.translate(0, center[1] - that.linePosition[1]).attr('stroke', that.getColor(circlesFg[i].data('colorType'))).show();
                            that.linePosition = center;
                            if (conf.tagDimen !== "NoTagDimen") {
                                floatTag.html ( '<div style = "text-align: center;margin:auto;color:'
                                //+ jqNode.color
                                + "#ffffff"
                                + '">' + circlesFg[i].data("tag") + '</div>'
                                );
                                floatTag.css({"visibility" : "visible"});
                            }
                            that.preIndex = i;
                            break;
                        }
                    }
                }
            });
        }
    };

    //创建canvas
    ScatterplotMatrix.prototype.createCanvas = function () {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        var conf = this.defaults;
        this.node.style.position = "relative";
        this.canvas = new Raphael(this.node, conf.width, conf.height);

        this.canvasF = document.getElementById(this.container);
        this.floatTag = DataV.FloatTag()(this.canvasF);
        this.floatTag.css({"visibility": "hidden"});
    };

    //根据不同类别得到颜色值
    ScatterplotMatrix.prototype.getColor = function (circleType) {
        var color = DataV.getColor();
        return color[circleType % color.length][0];
    };

    //绘制函数
    ScatterplotMatrix.prototype.render = function (options) {
        //var dBegin = new Date();   //for time-testing
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        this.setOptions(options);
        this.canvas.clear();
        this.setAxis();
        this.drawDiagram();
        //var dEnd = new Date();
        //alert(dEnd.getTime() - dBegin.getTime());
    };

    //计算每个circle的圆心位置
    ScatterplotMatrix.prototype.circleCenter = function (index, xDimen, yDimen) {
        var conf = this.defaults,
            source = this.source,
            y = this.y,
            x = this.x,
            dimensionsX = conf.dimensionsX,
            dimensionsY = conf.dimensionsY,
            dimensionType = conf.dimensionType;

        var xPos = x[xDimen](source[index][xDimen]),
            yPos = y[yDimen](source[index][yDimen]);

        return [xPos, yPos];
    };

    module.exports = ScatterplotMatrix;
});