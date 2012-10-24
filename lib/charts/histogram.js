/*global Raphael, d3, $, define */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) { return this[id];});
    }
})('Histogram', function (require) {
    var DataV = require('DataV');

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
	
	Histogram.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.node.style.position = "relative";
        this.canvas = new Raphael(this.node, conf.width, conf.height);

        this.canvasF = document.getElementById(this.container);
        this.floatTag = DataV.FloatTag()(this.canvasF);
        this.floatTag.css({"visibility": "hidden"});
	};
	
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
        
        this.source = [];
        
        for (i = 1, l = source.length; i < l; i++) {
            if (conf.typeNames.length == 1) {
                var line = {}, dimenT = conf.allDimensions;
                for (j = 0, ll = dimenT.length; j < ll; j++) {
                    line[dimenT[j]] = source[i][j]; //each line is an array, contains value for each dimension
                }
                this.source.push(line);
            }
            else if (conf.typeNames.length == 2) {
                var lineY = {}, lineZ = {}, dimenT = conf.allDimensions;
                lineY[dimenT[0]] = source[i][0];
                lineY[dimenT[1]] = source[i][1];
                this.source.push(lineY);
                lineZ[dimenT[0]] = source[i][0];
                lineZ[dimenT[1]] = source[i][2];
                this.source.push(lineZ);
            }
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
        for (j = 0; j < ticks.length; j++) {
            tickText.push(paper.text((x[dimenX](ticks[j])), downPos+10, ticks[j]).attr({
                "fill": "#878791",
                "fill-opacity": 0.7,
                "font-family": "雅黑",
                "font-size": 12
            }).attr({
                "text-anchor": "middle"
            }).rotate(0, x[dimenX](ticks[j]), upPos));
            axisLines.push(paper.path("M" + (x[dimenX](ticks[j])) + "," + (downPos) + "L" + (x[dimenX](ticks[j])) + "," + (downPos+5)).attr({
                "stroke": "#D7D7D7",
                "stroke-width": 2
            }));
        }
        axisLines.push(paper.path("M" + (leftPos) + "," + (upPos) + "L" + (leftPos) + "," + (downPos)).attr({
            "stroke": "#D7D7D7",
            "stroke-width": 2
        }));
        //Y轴
        ticks = y[dimenY].ticks;
        for (j = 0; j < ticks.length; j++) {
            tickText.push(paper.text(leftPos - 10, y[dimenY](ticks[j]), ticks[j]).attr({
                "fill": "#878791",
                "fill-opacity": 0.7,
                "font-family": "雅黑",
                "font-size": 12
            }).attr({
                "text-anchor": "end"
            }).rotate(0, rightPos + 6, y[dimenY](ticks[j])));
            axisLines.push(paper.path("M" + (leftPos) + "," + (y[dimenY](ticks[j])) + "L" + (leftPos - 5) + "," + (y[dimenY](ticks[j]))).attr({
                "stroke": "#D7D7D7",
                "stroke-width": 2
            }));
        }
        axisLines.push(paper.path("M" + (leftPos) + "," + (downPos) + "L" + (rightPos) + "," + (downPos)).attr({
            "stroke": "#D7D7D7",
            "stroke-width": 2
        }));
        var numOfHLine = d3.round((downPos - upPos)/30-1);
        for (j = 1; j <= numOfHLine; j++) {
            hLinesPos = downPos - j * 30;
            hLines.push(paper.path("M" + (leftPos) + "," + hLinesPos + "L" + (rightPos) + "," + hLinesPos).attr({
                "stroke": "#ECECEC",
                "stroke-width":1
            }));
        }
        //定义变量
        //bars
        var barWidth = 8;
        this.defaults.bars = paper.set();
        var bars = paper.set();
        //图例
        var legendArea = this.defaults.legendArea;
        var rectBn = paper.set();
        var underBn = [];
        var temp;
        //绘制
        //bars
        var mouseOverBar = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum - this.data.seqNum % 2;
            var rectBn = this.data.rectBn;
            var clicked = false;
            var typeSeq = -1;
            for(var i = 0, j = rectBn.length; i < j; i++)
                if(rectBn[i].data.isClicked == true) {
                    clicked = true;
                    typeSeq = i;
                }
            for(var i = 0, j = bars.length; i < j; i++) {
                if(i == seq) {
                    i++;
                }
                else {
                    bars[i].attr({
                        "fill-opacity":0.3
                    });
                }
            }
            
        }
        var mouseOutBar = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum - this.data.seqNum % 2;
            for(var i = 0, j = bars.length; i < j; i++) {
                if(i == seq) {
                    i++;
                }
                else {
                    bars[i].attr({
                        "fill-opacity":1
                    });
                }
            }
        }
        
        
        for (i = 0, j = this.source.length; i < j; i++) {
            for (k = 0, l = conf.typeNames.length; k < l; k++)
                if(i%l == k) {
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
                    temp.mouseover(mouseOverBar);
                    temp.mouseout(mouseOutBar);
                    bars.push(temp);
                }
        }
        
        
        
        //图例
        
        var mouseOverLegend = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum;
            var rectBn = this.data.rectBn;
            for(var i = 0, j = rectBn.length; i < j; i++)
                if(rectBn[i].data.isClicked == true)
                    return;
            //
            for(var i = (seq + 1)%2, j = bars.length; i < j; i+=2) {
                bars[i].attr({
                    "fill-opacity":0.3
                });
            }
            this.data.underBn[seq].attr({
                "fill-opacity":0.5
            });
        };
        var mouseOutLegend = function (event) {
            var bars = this.data.container;
            var seq = this.data.seqNum;
            var rectBn = this.data.rectBn;
            for(var i = 0, j = rectBn.length; i < j; i++)
                if(rectBn[i].data.isClicked == true)
                    return;
            //
            for(var i = (seq + 1)%2, j = bars.length; i < j; i+=2) {
                bars[i].attr({
                    "fill-opacity":1
                });
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
            //check if any legend has been already clicked
            for(var i = 0, j = rectBn.length; i < j; i++) {
                if(rectBn[i].data.isClicked) {
                    clicked = true;
                    lastClickedSeq = i;
                    break;
                }
            }
            if(this.data.isClicked) {
                for(var i = 0; i < typeNum; i++) {
                    if(i != seq % typeNum) {
                        for(var j = i, m = bars.length; j < m; j+=typeNum)
                            bars[j].attr({
                                "fill-opacity":0.3
                            });
                    }
                }
                this.data.isClicked = false;
            }else {
                if(!clicked) {
                    for(var i = 0; i < typeNum; i++) {
                        if(i != seq % typeNum) {
                            for(var j = i, m = bars.length; j < m; j+=typeNum)
                                bars[j].attr({
                                    "fill-opacity":0.1
                                });
                        }
                    }
                }else {
                    //cancle the clicked button
                    underBn[lastClickedSeq].attr({
                        "fill-opacity":0.5
                    });
                    for(var i = lastClickedSeq % typeNum, j = bars.length; i < j; i+=typeNum)
                        bars[i].attr({
                            "fill-opacity":0.1
                        });
                    for(var i = seq % typeNum, j = bars.length; i < j; i+=typeNum)
                        bars[i].attr({
                            "fill-opacity":1
                        });
                    this.data.rectBn[lastClickedSeq].data.isClicked = false;
                }
                this.data.isClicked = true;
            }
            //this.data.isClicked = !clicked;
            this.data.underBn[seq].attr({
                "fill-opacity":(this.data.isClicked?1:0.5)
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
    
	Histogram.prototype.render = function (options) {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        this.setOptions(options);
        this.canvas.clear();
        this.setAxis();
        this.drawDiagram();
	};
	return Histogram;
});