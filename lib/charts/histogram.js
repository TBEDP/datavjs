/*global Raphael, d3, $, define */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) { return this[id];});
    }
})('Histogram', function (require) {
    var DataV = require('DataV');

    /**
     * Histogram构造函数
     * Create histogram in a dom node with id "chart", default width is 522; height is 522px;
     * Options:
     *
     *   - `width` 宽度，默认为节点宽度
     *   - `typeNames` 指定y轴上数据类目
     *
     * Examples:
     * ```
     * var histogram = new Histogram("chart", {"width": 500, "height": 600, "typeNames": ["Y", "Z"]});
     * ```
     * @param {Mix} node The dom node or dom node Id
     * @param {Object} options options json object for determin histogram style.
     */
    var Histogram = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Histogram";
            this.node = this.checkContainer(node);
            this.defaults = {};

            // Properties
            this.defaults.dimensionX = {}; //dimension of X axis(horizonal).  array type
            this.defaults.demensionY = {}; //dimension of Y axis(vertical).  array type
            this.defaults.allDimensions = {};
            this.defaults.dimensionDomain = {};
            this.defaults.typeNames = [];

            // canvas parameters
            this.defaults.width = 522;
            this.defaults.height = 522;
            this.defaults.margin = 50;
            this.defaults.gap = 15;
            this.defaults.circleR = 3;
            this.defaults.barColor = ["#308BE6","#8EEC00"];
            
            //图例区域的左上顶点坐标x，y，宽，高
            this.defaults.legendArea = [422, 50, 472, 220];
            //散点矩阵区域的左上顶点坐标x，y，宽，高
            this.defaults.diagramArea = [50, 50, 422, 472];

            this.defaults.typeName = "undefined"; //默认情况是没有分类
            this.defaults.tagDimen = "undefined";


            this.setOptions(options);
            this.createCanvas();
        }   
    });
	/**
     * 创建画布
     */
	Histogram.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.node.style.position = "relative";
        this.canvas = new Raphael(this.node, conf.width, conf.height);

        this.canvasF = document.getElementById(this.container);
        this.floatTag = DataV.FloatTag()(this.canvasF);
        this.floatTag.css({"visibility": "hidden"});
	};
	/**
     * 设置数据源
     *
     * Examples：
     * ```
     * histogram.setSource(source);
     * ```
     *
     * @param {Array} source 数据源 第一列为排布在x轴的数据，后n列为排布在y轴的数据
     */
	Histogram.prototype.setSource = function (source) {
        var conf = this.defaults;
        var i, j, l;
        var xTemp = [],
            yTemp = [];
        xTemp = source[0][0];
        yTemp = source[0][1];
        
        conf.allDimensions = source[0];
        conf.dimensionX = xTemp;
        conf.dimensionY = yTemp;
        conf.xAxisData = [];
        this.source = [];
        var dimenT = conf.allDimensions;
        if (conf.typeNames == null) {
            conf.typeNames = [];
            for (i = 0, j = source[0].length; i < j; i++) {
                conf.typeNames.push(source[0][i]);
            }
        }
        for (i = 1, l = source.length; i < l; i++) {
            for(j = 1; j <= conf.typeNames.length; j++) {
                var line = {};
                line[dimenT[0]] = i;
                line[dimenT[1]] = source[i][j];
                this.source.push(line);
            }
            conf.xAxisData.push(source[i][0]);
            
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
            conf.dimensionDomain[dimen][0] = 0;
        }
	};
    /**
     * 设置坐标轴
     */
	Histogram.prototype.setAxis = function () {
        var conf = this.defaults;
        var tagWidth = conf.width / 5 > 50 ? 50 : conf.width / 5;
        conf.legendArea = [conf.width - tagWidth - conf.margin, 0, conf.width, conf.height];
        conf.diagramArea = [0, 0, conf.width - tagWidth - conf.margin, conf.height];
    
        var w = conf.diagramArea[2] - 2 * conf.margin;
        var h = conf.diagramArea[3] - conf.margin;
		
        this.x = {};
        this.y = {};
        var x = this.x,
            y = this.y;
        var tickAr = [5];
        //设置x轴
        x[conf.dimensionX] = d3.scale.linear().domain(conf.dimensionDomain[conf.dimensionX]).range([conf.margin, w]);
        x[conf.dimensionX].ticks = x[conf.dimensionX].ticks.apply(x[conf.dimensionX], tickAr);
        //设置y轴
        y[conf.dimensionY] = d3.scale.linear().domain(conf.dimensionDomain[conf.dimensionY]).range([h, conf.margin]);
        y[conf.dimensionY].ticks = y[conf.dimensionY].ticks.apply(y[conf.dimensionY], tickAr);
    };
    /**
     * 进行柱状图的绘制
     */
    Histogram.prototype.drawDiagram = function () {
        var that = this;
        var conf = this.defaults;
        var paper = this.canvas;
        var x = this.x;
        var y = this.y;
        var i, j, k, l;
        //画坐标轴
        var axisLines = paper.set();
        var tickText = paper.set();
        var hLines = paper.set();
        var dimenX = conf.dimensionX;
        var dimenY = conf.dimensionY;
        var leftPos = x[dimenX].range()[0],
            rightPos = x[dimenX].range()[1],
            upPos = y[dimenY].range()[1],
            downPos = y[dimenY].range()[0];
        var linePos,
            lineGap;
        //X轴
        ticks = x[dimenX].ticks;
        for (j = 1; j < ticks.length; j++) {
            tickText.push(paper.text(x[dimenX](ticks[j]), downPos+10, conf.xAxisData[ticks[j]-1]).attr({
                "fill": "#878791",
                "fill-opacity": 0.7,
                "font-family": "宋",
                "font-size": 12
            }).attr({
                "text-anchor": "middle"
            }).rotate(0, x[dimenX](ticks[j]), upPos));
            axisLines.push(paper.path("M" + x[dimenX](ticks[j]) + "," + downPos + "L" + x[dimenX](ticks[j]) + "," + (downPos+5)).attr({
                "stroke": "#D7D7D7",
                "stroke-width": 2
            }));
        }
        axisLines.push(paper.path("M" + leftPos + "," + upPos + "L" + leftPos + "," + downPos).attr({
            "stroke": "#D7D7D7",
            "stroke-width": 2
        }));
        //Y轴
        ticks = y[dimenY].ticks;
        for (j = 0; j < ticks.length; j++) {
            tickText.push(paper.text(leftPos - 10, y[dimenY](ticks[j]), ticks[j]).attr({
                "fill": "#878791",
                "fill-opacity": 0.7,
                "font-family": "宋",
                "font-size": 12
            }).attr({
                "text-anchor": "end"
            }).rotate(0, rightPos + 6, y[dimenY](ticks[j])));
            axisLines.push(paper.path("M" + leftPos + "," + y[dimenY](ticks[j]) + "L" + (leftPos - 5) + "," + y[dimenY](ticks[j])).attr({
                "stroke": "#D7D7D7",
                "stroke-width": 2
            }));
        }
        axisLines.push(paper.path("M" + leftPos + "," + downPos + "L" + rightPos + "," + downPos).attr({
            "stroke": "#D7D7D7",
            "stroke-width": 2
        }));
        var numOfHLine = d3.round((downPos - upPos)/30-1);
        for (j = 1; j <= numOfHLine; j++) {
            hLinesPos = downPos - j * 30;
            hLines.push(paper.path("M" + leftPos + "," + hLinesPos + "L" + rightPos + "," + hLinesPos).attr({
                "stroke": "#ECECEC",
                "stroke-width":1
            }));
        }
        //定义变量
        //bars
        var barWidth = 8;
        this.defaults.bars = paper.set();
        var bars = paper.set();
        //legend
        var legendArea = this.defaults.legendArea;
        var rectBn = paper.set();
        var underBn = [];
        var temp;
        //绘制
        //bars
        var mouseOverBar = function (event) {
            var bars = this.data.container;
            var rectBn = this.data.rectBn;
            var clicked = false;
            var typeSeq = -1;
            var typeNum = this.data.typeNum;
            var seq = this.data.seqNum - this.data.seqNum % typeNum;
            var xPos, yPos;
            var temp;
            var paper = bars[0].paper;
            var i, j, k;
            var textWidth;
            for (i = 0, j = rectBn.length; i < j; i++)
                if(rectBn[i].data.isClicked) {
                    clicked = true;
                    typeSeq = i;
                }
            //hover
            if (clicked) {
                if (typeSeq != this.data.seqNum % typeNum) {
                    return;
                }
                for (i = this.data.seqNum % typeNum, j = bars.length; i < j; i+=typeNum) {
                    bars[i].attr({
                        "fill-opacity":0.3
                    });
                }
                bars[this.data.seqNum].attr({
                    "fill-opacity":1
                });
                xPos = bars[this.data.seqNum].attrs.x + 16;
                yPos = bars[this.data.seqNum].attrs.y;
                textWidth = 5 * bars[this.data.seqNum].data.yAxisLabel.length + 20;
                temp = paper.rect(xPos, yPos - 10, textWidth, 20, 2).attr({
                    "fill": this.data.color[this.data.seqNum % typeNum],
                    "fill-opacity": 1,
                    "stroke": "none"
                });
                bars.push(temp);
                temp = paper.path("M" + xPos + "," + (yPos - 4) + "L" + (xPos - 8) + "," + yPos +
                    "L" + xPos + "," + (yPos + 4) + "V" + yPos + "Z").attr({
                        "fill" : this.data.color[this.data.seqNum % typeNum],
                        "stroke" : this.data.color[this.data.seqNum % typeNum]
                    });
                bars.push(temp);
                temp = paper.text(xPos + 16, yPos, bars[this.data.seqNum].data.yAxisLabel).attr({
                    "fill": "#ffffff",
                    "fill-opacity": 1,
                    "font-family": "宋",
                    "font-weight": "bold",
                    "font-size": 12,
                    "text-anchor": "middle"
                });
                bars.push(temp);
            } else {
                for (i = 0, j = bars.length; i < j; i++) {
                    if(i == seq) {
                        i += typeNum - 1;
                    }
                    else {
                        bars[i].attr({
                            "fill-opacity":0.3
                        });
                    }
                }
                //check if the labels will be overlapped
                var overlapped = false;
                var pos = [];
                for (i = 0; i < typeNum; i++) {
                    pos.push(bars[seq + i].attrs.y);
                }
                pos.sort();
                var sub = [];
                for (i = 0; i < pos.length - 1; i++) {
                    sub.push(pos[i+1] - pos[i]);
                }
                sub.sort();
                if (sub[0] < 20) {
                    overlapped = true;
                }
                for (i = 0; i < typeNum; i++) {
                    xPos = bars[seq].attrs.x + 8 * typeNum + 8;
                    yPos = overlapped?(bars[seq + typeNum - 1].attrs.y + 20 * (typeNum - i - 1)):bars[seq + i].attrs.y;
                    textWidth = 5 * bars[seq + i].data.yAxisLabel.length + 20;
                    temp = paper.rect(xPos, yPos - 10, textWidth, 20, 2).attr({
                        "fill": this.data.color[i],
                        "fill-opacity": 1,
                        "stroke": "none"
                    });
                    bars.push(temp);
                    temp = paper.path("M" + xPos + "," + (yPos - 4) + "L" + (xPos - 8) + "," + yPos +
                        "L" + xPos + "," + (yPos + 4) + "V" + yPos + "Z").attr({
                            "fill" : this.data.color[i],
                            "stroke" : this.data.color[i]
                        });
                    bars.push(temp);
                    temp = paper.text(xPos + 16, yPos, bars[seq + i].data.yAxisLabel).attr({
                        "fill": "#ffffff",
                        "fill-opacity": 1,
                        "font-family": "宋",
                        "font-weight": "bold",
                        "font-size": 12,
                        "text-anchor": "middle"
                    });
                    bars.push(temp);
                }
            }
            //pins
            xPos = bars[seq].attrs.x + 4 * typeNum;
            yPos = bars[seq].attrs.y + bars[seq].attrs.height;
            
            textWidth = 6 * this.data.xAxisLabel.length + 20;
            //axis x rect
            temp = paper.rect(xPos - textWidth/2, yPos + 8, textWidth, 20, 2).attr({
                "fill": "#5f5f5f",
                "fill-opacity": 1,
                "stroke": "none"
            });;
            bars.push(temp);
            //axis x text
            temp = paper.text(xPos, yPos + 18, this.data.xAxisLabel).attr({
                "fill": "#ffffff",
                "fill-opacity": 1,
                "font-family": "宋",
                "font-weight": "bold",
                "font-size": 12,
                "text-anchor": "middle"
            });
            bars.push(temp);
            temp = paper.path("M" + (xPos - 4) + "," + (yPos + 8) + "L" + xPos + "," + yPos +
                "L" + (xPos + 4) + "," + (yPos + 8) + "H" + xPos + "Z").attr({
                    "fill" : "#5F5F5F",
                    "stroke" : "#5F5F5F"
                });
            bars.push(temp);
        };
        
        var mouseOutBar = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum - this.data.seqNum % 2;
            var rectBn = this.data.rectBn;
            var clicked = false;
            var typeSeq = -1;
            var typeNum = this.data.typeNum;
            var temp;
            var i, j, k;
            for (i = 0, j = rectBn.length; i < j; i++) {
                if (rectBn[i].data.isClicked) {
                    clicked = true;
                    typeSeq = i;
                }
            }
            //hover
            if(clicked) {
                if (typeSeq != this.data.seqNum % typeNum) {
                    return;
                }
                for (i = this.data.seqNum % typeNum, j = bars.length; i < j; i+=typeNum) {
                    bars[i].attr({
                        "fill-opacity":1
                    });
                }
                for (i = 0; i < 3; i++) {
                    temp = bars.pop();
                    temp.remove();
                }
            } else {
                for (i = 0, j = bars.length; i < j; i++) {
                    bars[i].attr({
                            "fill-opacity":1
                    });
                }
                for (i = 0, j = typeNum * 3; i < j; i++) {
                    temp = bars.pop();
                    temp.remove();
                }
            }
            //pins
            for (i = 0; i < 3; i++) {
                temp = bars.pop();
                temp.remove();
            }
        };
        
        for (i = 0, j = this.source.length; i < j; i++) {
            for (k = 0, l = conf.typeNames.length; k < l; k++) {
                if (i%l == k) {
                    temp = paper.rect((x[dimenX](this.source[i][dimenX])-barWidth * (l / 2 - i % l)), y[dimenY](this.source[i][dimenY]), 
                        barWidth, downPos - y[dimenY](this.source[i][dimenY])).attr({
                            "fill": conf.barColor[k],
                            "fill-opacity": 1,
                            "stroke": "none"
                            });
                    temp.data = {};
                    temp.data.container = bars;
                    temp.data.seqNum = i;
                    temp.data.rectBn = rectBn;
                    temp.data.typeNum = conf.typeNames.length;
                    temp.data.xAxisLabel = conf.xAxisData[Math.floor(i/l)];
                    temp.data.yAxisLabel = this.source[i][dimenY];
                    temp.data.color = conf.barColor;
                    temp.mouseover(mouseOverBar);
                    temp.mouseout(mouseOutBar);
                    bars.push(temp);
                }
            }
        }
        //legend
        var mouseOverLegend = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum;
            var rectBn = this.data.rectBn;
            var typeNum = this.data.typeNum;
            var i, j, k;
            for (i = 0, j = rectBn.length; i < j; i++)
                if(rectBn[i].data.isClicked)
                    return;
            for (k = 0; k < typeNum; k++) {
                if (seq % typeNum != k) {
                    for (i = k, j = bars.length; i < j; i+=typeNum) {
                        bars[i].attr({
                            "fill-opacity":0.3
                        });
                    }
                }
            }
            this.data.underBn[seq].attr({
                "fill-opacity":0.5
            });
        };
        var mouseOutLegend = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum;
            var rectBn = this.data.rectBn;
            var typeNum = this.data.typeNum;
            var i, j, k;
            for (i = 0, j = rectBn.length; i < j; i++) {
                if(rectBn[i].data.isClicked) {
                    return;
                }
            }
            //
            for (k = 0; k < typeNum; k++) {
                if (seq % typeNum != k) {
                    for (i = k, j = bars.length; i < j; i+=typeNum) {
                        bars[i].attr({
                            "fill-opacity":1
                        });
                    }
                }
            }
            this.data.underBn[seq].attr({
                "fill-opacity":0
            });
        };
        var clickLegend = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum;
            var clicked = false;
            var underBn = this.data.underBn;
            var rectBn = this.data.rectBn;
            var lastClickedSeq;
            var typeNum = this.data.typeNum;
            var i, j, k;
            //check if any legend has been already clicked
            for (i = 0, j = rectBn.length; i < j; i++) {
                if (rectBn[i].data.isClicked) {
                    clicked = true;
                    lastClickedSeq = i;
                    break;
                }
            }
            if(this.data.isClicked) {
                for(i = 0; i < typeNum; i++) {
                    if(i != seq % typeNum) {
                        for(var j = i, m = bars.length; j < m; j+=typeNum) {
                            bars[j].attr({
                                "fill-opacity":0.3
                            });
                        }
                    }
                }
                this.data.isClicked = false;
            } else if(!clicked) {
                for (i = 0; i < typeNum; i++) {
                    if (i != seq % typeNum) {
                        for (j = i, m = bars.length; j < m; j+=typeNum)
                            bars[j].attr({
                                "fill-opacity":0.1
                            });
                    }
                }
                this.data.isClicked = true;
            } else {
                //cancle the clicked button
                underBn[lastClickedSeq].attr({
                    "fill-opacity":0
                });
                for (i = lastClickedSeq % typeNum, j = bars.length; i < j; i+=typeNum) {
                    bars[i].attr({
                        "fill-opacity":0.1
                    });
                }
                for (i = seq % typeNum, j = bars.length; i < j; i+=typeNum) {
                    bars[i].attr({
                        "fill-opacity":1
                    });
                }
                this.data.rectBn[lastClickedSeq].data.isClicked = false;
                this.data.isClicked = true;
            }
            this.data.underBn[seq].attr({
                "fill-opacity":(this.data.isClicked?1:0)
            });
        };
        for (i = 0; i < conf.typeNames.length; i++) {
            //底框
            underBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
                "fill": "#ebebeb",
                "fill-opacity":0,
                "stroke": "none"
            }));
            //色框
            temp = paper.rect(legendArea[0] + 10 + 3, legendArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
                "fill": conf.barColor[i],
                "stroke": "none"
            });
            //文字
            paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] + 10 + (20 + 3) * i + 10, conf.typeNames[i]).attr({
                "fill": "black",
                "fill-opacity": 1,
                "font-family": "Verdana",
                "font-size": 12
            }).attr({
                "text-anchor": "start"
            });
            //选框
            temp = paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
                "fill": "white",
                "fill-opacity": 0,
                "stroke": "none"
                //"r": 3
            }).data("type", i);
            temp.mouseover(mouseOverLegend);
            temp.mouseout(mouseOutLegend);
            temp.click(clickLegend);
            temp.data = {};
            temp.data.seqNum = i;
            temp.data.container = bars;
            temp.data.rectBn = rectBn;
            temp.data.isClicked = false;
            temp.data.underBn = underBn;
            temp.data.typeNum = conf.typeNames.length;
            rectBn.push(temp);
        }
    };
    /**
     * 绘制柱状图
     * Options:
     *
     *   - `width` 宽度，默认为节点宽度
     *   - `typeNames` 指定y轴上数据类目
     *
     * Examples:
     * ```
     * histogram.render({"width": 1024})
     * ```
     * @param {Object} options options json object for determin histogram style.
     */
	Histogram.prototype.render = function (options) {
        this.setOptions(options);
        this.canvas.clear();
        this.setAxis();
        this.drawDiagram();
	};
	return Histogram;
});