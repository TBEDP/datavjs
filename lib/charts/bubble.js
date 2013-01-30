/*global Raphael, d3, $, _ */
/*!
 * Bubble的兼容性定义
 */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) { return this[id];});
    }
})('Bubble', function (require) {
    var DataV = require('DataV');
    var Axis = require('Axis');

    /**
     * Recently, bubble graph can represent five dimensions by xaxis,yaxis,size,color and time.
     * You can stop animation by pause() method, start animation by initControls method;
     * you can change animation start time by using global variable  this.startTime;
     * you can visualize a time point's data by generatePaths(time point) method;
     * an inside method drawAllTime(key) is designed for interaction.
     * Options:
     * - `width`, 图表宽度，默认800
     * - `height`, 图表高度， 默认600
     * - `minRadius`, 最小圆角值
     * - `meshInterval`, 背景网格的间距， 默认20
     * - `showLegend`, 是否显示图例，默认显示
     * - `margin`, 主图的间距，[上, 右, 下, 左], 默认为[30, 0, 80, 200]。当不显示图例时，可调节此处
     * - `tipStyle`, 提示框样式
     * - `skeletonLineAttr`, 龙骨线属性
     * - `skeletonCircleAttr`, 龙骨点属性
     */
    var Bubble = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Bubble";
            this.node = this.checkContainer(node);

            // setting display width and height, also they can be changed by options
            this.defaults.width = 600;
            this.defaults.height = 360;
            this.defaults.minRadius = 10;
            this.defaults.maxRadius = 40;
            this.defaults.meshInterval = 20;
            this.defaults.margin = [30, 0, 80, 100];
            this.defaults.allDimensions = [];
            this.defaults.dimensions = [];
            this.defaults.dimensionType = {};
            this.defaults.dimensionDomain = {};
            this.defaults.dotStrokeColor = {"stroke": "#fff"};
            this.defaults.colorBarHeight = 27;
            this.defaults.showLegend = true;
            this.defaults.skeletonCircleAttr = {
                "fill": "#000",
                "fill-opacity": 0.6,
                "stroke-width": 0
            };
            this.defaults.skeletonLineAttr = {
                "stroke": "#000",
                "stroke-width": 0.5,
                "stroke-opacity": 0.5
            };
            this.defaults.tipStyle = {
                "textAlign": "left",
                "margin": "auto",
                "color": "#ffffff"
            };

            /**
             * @param {String} key 关键字
             * @param {Number} x0 横轴值
             * @param {Number} y0 纵轴值
             * @param {Number} r0 半径值
             * @param {Number} c0 分组值
             * @param {String} time 时间值 
             */
            this.formatter.tipFormat = function (key, x0, y0, r0, c0, time) {
                var tpl = '<b>' + this.keyDimen + ':{key}</b><br />' + 
                    '<b>' + this.xDimen + ':{xDimen}</b><br/>' +
                    '<b>' + this.yDimen + ':{yDimen}</b><br/>' +
                    '<b>' + this.sizeDimen + ':{sizeDimen}</b><br/>' + 
                    '<b>' + this.colorDimen + ':{colorDimen}</b><br/>' + 
                    '<b>' + this.timeDimen + ':{timeDimen}</b>';

                var tip = tpl.replace('{key}', key);
                tip = tip.replace('{xDimen}', x0);
                tip = tip.replace('{yDimen}', y0);
                tip = tip.replace('{sizeDimen}', r0);
                tip = tip.replace('{colorDimen}', c0);
                tip = tip.replace('{timeDimen}', time);
                return tip;
            };

            this.setOptions(options);
            this.createCanvas();
        }
    });

    Bubble.prototype.getTip = function (key, index) {
        var timeKeys = this.timeKeys;
        var value = timeKeys[index];
        var x = this.interpolateData(value, timeKeys, this.getKeyData(this.xDimen, key)),
            y = this.interpolateData(value, timeKeys, this.getKeyData(this.yDimen, key)),
            size = this.interpolateData(value, timeKeys, this.getKeyData(this.sizeDimen, key)),
            color = this.getColorData(key);
        var formatter = this.getFormatter("tipFormat");
        return formatter.call(this, key, x, y, size, color, this.times[value]);
    };

    /**
     * Creates a backCanvas for the visualization
     */
    Bubble.prototype.createCanvas = function () {
        var conf = this.defaults;
        var margin = conf.margin;
        this.backCanvas = new Raphael(this.node, conf.width, conf.height);
        this.foreCanvas = new Raphael(this.node, conf.width, conf.height);

        $(this.node).css("position", "relative");
        $(this.foreCanvas.canvas).css({
            "position": "absolute",
            "zIndex": 2,
            "left": margin[3],
            "top": margin[0]
        });

        this.floatTag = DataV.FloatTag()(this.node);

        this.floatTag.css({"visibility": "hidden"});

        $(this.node).append(this.floatTag);
    };

    /**
     * Chooses bubble graph setted visualization dimens orderly
     */
    Bubble.prototype.chooseDimensions = function (dimen) {
        var conf = this.defaults;
        conf.dimensions = dimen.filter(function (item) {
            return _.indexOf(conf.allDimensions, item) !== -1;
        });

        this.timeDimen = conf.dimensions[0];
        this.keyDimen = conf.dimensions[1];
        this.xDimen = conf.dimensions[2];
        this.yDimen = conf.dimensions[3];
        this.sizeDimen = conf.dimensions[4];
        this.colorDimen = conf.dimensions[5];

        this.keys = [];
        this.times = [];
        this.timeKeys = [];
        for (var i = 0, l = this.source.length; i < l; i++) {
            this.keys.push(this.source[i][this.keyDimen]);
            this.times.push(this.source[i][this.timeDimen]);
        }

        this.times = _.uniq(this.times);
        this.keys = _.uniq(this.keys);
        this.timeKeys = _.range(this.times.length);
        this.startTime = 0;
    };

    /**
     * set source, get dimensions data, dimension type, and dimension domain
     * default visualization dimension is setted here
     */
    Bubble.prototype.setSource = function (source) {
        var conf = this.defaults;
        conf.allDimensions = source[0];
        // by default all dimensions show
        conf.dimensions = source[0];

        this.source = [];
        for (var i = 1, l = source.length; i < l; i++){
            var dot = {},
                dimen = conf.allDimensions;
            for (var j=0, ll=dimen.length; j < ll; j++){
                dot[dimen[j]] = source[i][j];
            }
            this.source.push(dot);
        }

        // judge dimesions type auto
        conf.dimensionType = {};
        for (var i = 0, l = conf.allDimensions.length; i < l; i++){
            var type = "quantitative";
            for (var j = 1, ll = source.length; j < ll; j++){
                var d = source[j][i];
                if(d && (!DataV.isNumeric(d))){
                    type = "ordinal";
                    break;
                }
            }
            conf.dimensionType[conf.allDimensions[i]] = type;
        }

        // set default dimensionDomain
        for (var i = 0, l = conf.allDimensions.length; i < l; i++){
            var dimen = conf.allDimensions[i];
            if (conf.dimensionType[dimen] === "quantitative") {
                conf.dimensionDomain[dimen] = d3.extent(this.source, function (p) {
                    return Math.abs(p[dimen]);
                });
            } else {
                conf.dimensionDomain[dimen] = this.source.map(function(p){
                    return p[dimen];
                });
            }
        }

        this.timeDimen = conf.dimensions[0];
        this.keyDimen = conf.dimensions[1];
        this.xDimen = conf.dimensions[2];
        this.yDimen = conf.dimensions[3];
        this.sizeDimen = conf.dimensions[4];
        this.colorDimen = conf.dimensions[5];

        this.keys = [];
        this.times = [];
        this.timeKeys = [];
        for (var i = 0, l = this.source.length; i < l; i++) {
            this.keys.push(this.source[i][this.keyDimen]);
            this.times.push(this.source[i][this.timeDimen]);
        }

        this.times = _.uniq(this.times);
        this.keys = _.uniq(this.keys);
        for (var i = 0, l = this.times.length; i < l; i++) {
            this.timeKeys.push(i);
        }
        this.startTime = 0;
    };

    /**
     * 绘制图例
     */
    Bubble.prototype.drawLegend = function () {
        var conf = this.defaults;
        var that = this;
        var colorData = _.uniq(this.keys.map(function (key) {
            return that.getColorData(key);
        }));
        // draw colorbar
        var tagArea = [20, (conf.height - conf.margin[2] - colorData.length * 23), 200, 220];
        var backCanvas = this.backCanvas;
        var rectBn = this.backCanvas.set();
        var underBn = [];
        for (var i = 0, l = colorData.length; i < l; i++) {
            var c = this.c[this.colorDimen](colorData[i]);
            // background to add interaction
            underBn.push(backCanvas.rect(tagArea[0] + 10, tagArea[1] + 10 + (20 + 3) * i, 120, 20)
                .attr({"fill": "#ebebeb", "stroke": "none"}).hide());
            // real colorbar
            backCanvas.rect(tagArea[0] + 10 + 3, tagArea[1] + 10 + (20 + 3) * i + 6, 16, 8)
                .attr({"fill": c, "stroke": "none"});
            // colorbar text
            backCanvas.text(tagArea[0] + 10 + 3 + 16 + 8, tagArea[1] + 10 + (20 + 3) * i + 10, colorData[i])
                .attr({"fill": "black", "fill-opacity": 1, "font-family": "Verdana", "font-size": 12})
                .attr({"text-anchor": "start"});
            // just for interaction -- selction
            rectBn.push(backCanvas.rect(tagArea[0] + 10, tagArea[1] + 10 + (20 + 3) * i, 50, 20)
                .attr({"fill": "white", "fill-opacity": 0, "stroke": "none"})
                .data("type", i).data("colorType", colorData[i]));
        }

        // add interaction for colorbar
        this.interactionType = null;
        rectBn.forEach(function (d) {
            d.hover(function () {
                if (!that.interval) {
                    for (var i = 0, l = underBn.length; i < l; i++) {
                        if (i === d.data("type")) {
                            underBn[i].show();
                            that.interactionType = d.data("colorType");
                            that.generatePaths(Math.ceil(that.startTime));
                        }
                    }
                }
            },
            function () {
                for (var i = 0, l = underBn.length; i < l; i++) {
                    if (i === d.data("type")) {
                        underBn[i].hide();
                        that.interactionType = null;
                    }
                }
            });
        });

    };

    /**
     * different visualization scale is defined here
     */
    Bubble.prototype.getScale = function() {
        var that = this;
        var conf = this.defaults,
            margin = conf.margin,
            w = conf.width - margin[3] - margin[1],
            h = conf.height - margin[0] - margin[2],
            maxRadius = conf.maxRadius,
            minRadius = conf.minRadius;
        var backCanvas = this.backCanvas,
            xDimen = this.xDimen,
            yDimen = this.yDimen,
            sizeDimen = this.sizeDimen,
            colorDimen = this.colorDimen,
            xMin = conf.dimensionDomain[xDimen][0],
            yMin = conf.dimensionDomain[yDimen][0],
            xMax = conf.dimensionDomain[xDimen][1],
            yMax = conf.dimensionDomain[yDimen][1],
            xBorder = (maxRadius + 30) * (xMax - xMin)/w,
            yBorder = (maxRadius + 30) * (yMax - yMin)/h,
            xDomain = [xMin - xBorder, xMax + xBorder],
            yDomain = [yMin - yBorder, yMax + yBorder];

        this.x = {};
        this.x[xDimen] = d3.scale.linear()
            .domain(xDomain).range([margin[3], margin[3] + w]);
        this.y = {};
        this.y[yDimen] = d3.scale.linear()
            .domain(yDomain).range([h, 0]);
        this.z = {};
        this.z[sizeDimen] = d3.scale.linear()
            .domain(conf.dimensionDomain[sizeDimen]).range([minRadius, maxRadius]);
        this.c = {};
        this.c[colorDimen] = this.colorDB({mode: "random", ratio: 0.5});

        if (conf.showLegend) {
            this.drawLegend();
        }

        var playButtonBack = backCanvas.rect(0,0,24,24,2).attr({"stroke": "none","fill": "#d6d6d6"});
        var startPatternPath = "M7,18L19,12L7,6V18z";
        var stopPatternPathL = "M7,7sh4v10sh-4z";
        var stopPatternPathR = "M13,7sh4v10sh-4z";

        var startPattern = backCanvas.path(startPatternPath).attr({
            "stroke-width": 0,
            "stroke-linejoin": "round",
            "fill": "#606060"
        });
        var stopPattern = backCanvas.set();
        stopPattern.push(backCanvas.path(stopPatternPathL));
        stopPattern.push(backCanvas.path(stopPatternPathR));
        stopPattern.attr({
            "stroke-width": 0,
            "stroke-linejoin": "round",
            "fill": "#606060"
        });

        playButtonBack.transform("t" + (margin[3] - conf.colorBarHeight) + "," + (margin[0] + h + 33));
        startPattern.transform("t" + (margin[3] - conf.colorBarHeight) + "," + (margin[0] + h + 33));
        stopPattern.transform("t" + (margin[3] - conf.colorBarHeight) + "," + (margin[0] + h + 33));
        startPattern.attr({
            "stroke-width": 0,
            "stroke-linejoin": "round",
            "fill-opacity": 0
        });

        var playButton = backCanvas.set();
        playButton.push(playButtonBack);
        playButton.push(startPattern);
        playButton.push(stopPattern);
        playButton.dblclick(function() {
            that.clearAnimation();
            that.render();
        });
        playButton.click(function() {
            if (that.interval) {
                stopPattern.attr({"fill-opacity": 0});
                startPattern.attr({"fill-opacity": 1});
                that.pause();
            } else {
                startPattern.attr({"fill-opacity": 0});
                stopPattern.attr({"fill-opacity": 1});
                that.initControls();
            }
        });
        playButton.hover(
            function() {
                startPattern.attr({"fill": "#ffffff"});
                stopPattern.attr({"fill": "#ffffff"});
            },
            function() {
                startPattern.attr({"fill": "#606060"});
                stopPattern.attr({"fill": "#606060"});
            }
        );

    };

    /**
     * draw x-axis, y-axis and related parts
     */
    Bubble.prototype.renderAxis = function () {
        var conf = this.defaults,
            margin = conf.margin,
            w = conf.width - margin[3] - margin[1],
            h = conf.height - margin[0] - margin[2],
            maxRadius = conf.maxRadius,
            yaxis = Axis().orient("left"),
            xaxis = Axis().orient("bottom"),
            backCanvas = this.backCanvas,
            xDimen = this.xDimen,
            yDimen = this.yDimen,
            xMin = conf.dimensionDomain[xDimen][0],
            yMin = conf.dimensionDomain[yDimen][0],
            xMax = conf.dimensionDomain[xDimen][1],
            yMax = conf.dimensionDomain[yDimen][1],
            xBorder = (maxRadius + 30) * (xMax - xMin)/w,
            yBorder = (maxRadius + 30) * (yMax - yMin)/h,
            xDomain = [xMin - xBorder, xMax + xBorder],
            yDomain = [yMin - yBorder, yMax + yBorder],
            axixX = d3.scale.linear().domain(xDomain).range([0, w]),
            axixY = d3.scale.linear().domain(yDomain).range([h, 0]);

        backCanvas.clear();

        xaxis.scale(axixX)
            .tickSubdivide(1)
            .tickSize(6, 3, 0)
            .tickPadding(5)
            .tickAttr({"stroke": "#929292"})
            .tickTextAttr({"font-size": "10px", "fill": "#929292"})
            .minorTickAttr({"stroke": "#929292"})
            .domainAttr({"stroke-width": 1, "stroke": "#929292"})
            (backCanvas).attr({transform: "t" + margin[3] + "," + (margin[0] + h)});

        yaxis.scale(axixY)
            .tickSubdivide(1)
            .tickSize(6, 3, 0)
            .tickPadding(5)
            .tickAttr({"stroke": "#929292"})
            .tickTextAttr({"font-size": "10px", "fill": "#929292"})
            .minorTickAttr({"stroke": "#929292"})
            .domainAttr({"stroke-width": 1, "stroke": "#929292"})
            (backCanvas).attr({transform: "t" + margin[3] + "," + margin[0]});

        var xText = backCanvas.text(margin[3] + w/2, margin[0] + h + 40, this.xDimen);
        xText.attr({"font-size": "15px", "font-family": "Arial", "fill": "#000000"});
        var yText = backCanvas.text(margin[3] - 50, margin[0] + h/2, this.yDimen);
        yText.attr({"font-size": "15px", "font-family": "Arial", "fill": "#000000"}).transform("r-90");
    };

    /**
     * color database
     */
    Bubble.prototype.colorDB = function (colorJson) {
        var colorMatrix = DataV.getColor();
        var color;
        var colorStyle = colorJson || {};
        var colorMode = colorStyle.mode || 'default';
        var i, l;

        switch (colorMode) {
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

    /**
     * main visualization method where bubble is drawed inside
     * a time point is the method's only parameter
     */
    Bubble.prototype.generatePaths = function (time) {
        var conf = this.defaults,
            margin = conf.margin,
            meshInterval = conf.meshInterval,
            realWidth = conf.width - margin[3] - margin[1],
            realHeight = conf.height - margin[0] - margin[2],
            labelSize = 18,
            foreCanvas = this.foreCanvas,
            skeletonRadius = 2,
            timeKeys = this.timeKeys,
            keys = this.keys,
            dotBubbleSet = [];

        var that = this;
        if (time < this.times.length - 1) {
            this.startTime = time;
        } else {
            this.startTime = 0;
        }
        
        foreCanvas.clear();

        // draw mesh
        var meshes = foreCanvas.set(),
            verticleMeshNum = realWidth / meshInterval,
            horizontalMeshNUm = realHeight / meshInterval;
        var i;
        for (i = 1;i < verticleMeshNum;i++) {
            meshes.push(foreCanvas.path("M"+(i * meshInterval)+" "+0+"L"+(i * meshInterval)+
                " "+(realHeight-1)).attr({"stroke": "#ebebeb", "stroke-width": 1}));
        }
        for (i = 1; i < horizontalMeshNUm; i++) {
            meshes.push(foreCanvas.path("M"+1+" "+(realHeight - (i * meshInterval))+"L"+realWidth+
                " "+(realHeight - (i * meshInterval))).attr({"stroke": "#ebebeb", "stroke-dasharray": "-", "stroke-width": 0.5}));
        }
        var dots = [];
        // get all data by time and key dimension data
        for (var i = 0, l = keys.length; i < l; i++) {
            var x0 = this.interpolateData(time, timeKeys, this.getKeyData(this.xDimen, keys[i]));
            var y0 = this.interpolateData(time, timeKeys, this.getKeyData(this.yDimen, keys[i]));
            var r0 = this.interpolateData(time, timeKeys, this.getKeyData(this.sizeDimen, keys[i]));
            var c0 = this.getColorData(keys[i]);

            var dot = {key: keys[i], x0: x0, y0: y0, r0: r0, c0: c0};
            dots.push(dot);
        }

        var floatTag = this.floatTag;

        // control the time label
        var label = foreCanvas.text(20, margin[0] + realHeight + 15, this.times[Math.floor(time)]);
        label.attr({"font-size": labelSize, "fill": "#606060", "text-anchor": "start"});

        dots.sort(function(b,a) { return a.r0 < b.r0 ? -1 : a.r0 > b.r0 ? 1 : 0; });

        // draw the circles
        for (var i = 0, l = dots.length; i < l; i++) {
            var dot = dots[i],
                x = this.x[this.xDimen](dot.x0) - margin[3],
                y = this.y[this.yDimen](dot.y0),
                r = this.z[this.sizeDimen](dot.r0),
                c = this.c[this.colorDimen](dot.c0),
                dotBubble = foreCanvas.circle(x, y, r);
            dotBubble.attr({"stroke-width":0, "fill": c, "fill-opacity": 0.5})
                .data("key", dot.key).data("colorType", dot.c0);
            dotBubbleSet.push(dotBubble);
        }

        // add hover and click effect for all circles
        dotBubbleSet.forEach(function (d, i) {
            (function (d, i) {
                d.hover(function () {
                    floatTag.html(that.getTip(d.data("key"), Math.floor(time))).css(conf.tipStyle);
                    floatTag.css({"visibility" : "visible"});
                    if (!that.choose) {
                        d.attr({"stroke-width": 1, "stroke": "#f00", "fill-opacity": 0.8});
                        meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-", "stroke-width": 1});
                        for (var j = 0, l = dotBubbleSet.length; j < l ; j++) {
                            if (j !== i) {
                               dotBubbleSet[j].attr({"stroke-width": 0, "fill-opacity": 0.2});
                            }
                        }
                    }
                }, function () {
                    floatTag.css({"visibility" : "hidden"});
                    if (!that.choose) {
                        d.attr({"stroke-width": 0, "fill-opacity": 0.5});
                        meshes.attr({"stroke": "#ebebeb", "stroke-dasharray": "-", "stroke-width": 1});
                        for (var j = 0, l = dotBubbleSet.length; j < l ; j++) {
                            if (j !== i) {
                               dotBubbleSet[j].attr({"stroke-width": 0, "fill-opacity": 0.5});
                            }
                        }
                    }
                });

                d.click(function() {
                    if (time === Math.ceil(time)) {
                        drawAllTime(this.data("key"), i);
                    } else {
                        drawAllTime(this.data("key"), i);
                        this.remove();
                    }
                });
            }(d, i));
        });

        // colorbar interaction for showing all same color history data
        if (this.interactionType) {
            dotBubbleSet.forEach(function (d) {
                if (d.data("colorType") === that.interactionType) {
                    drawAllTime(d.data("key"));
                }
            });
        }

        // an inside method to visualize a key's all time data
        function drawAllTime (key, num) {
            if (!that.interval) {
                that.choose = true;
                var floatTag = that.floatTag;

                for (var j = 0, l = dotBubbleSet.length; j < l ; j++) {
                    if (j !== num) {
                        dotBubbleSet[j].attr({"stroke-width": 0, "fill-opacity": 0.2});
                    }
                }

                meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-"});
                var i;

                for (i = 0, l = timeKeys.length; i < l; i++) {
                    (function (i) {
                        var x0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(that.xDimen, key)),
                            y0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(that.yDimen, key)),
                            r0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(that.sizeDimen, key)),
                            c0 = that.getColorData(key),
                            x = that.x[that.xDimen](x0) - margin[3],
                            y = that.y[that.yDimen](y0),
                            r = that.z[that.sizeDimen](r0),
                            c = that.c[that.colorDimen](c0),
                            fOpacity = 0.1 + Math.pow(1.5, i)/Math.pow(1.5, l);
                        var historyBubble = foreCanvas.circle(x, y, r);
                        historyBubble.attr({"stroke-width": 0, "fill": c, "fill-opacity": fOpacity});

                        if (timeKeys[i] === Math.ceil(time)) {
                            historyBubble.attr({"stroke-width": 1, "stroke": "#f00"});
                            historyBubble.hover(function () {
                                floatTag.html(that.getTip(key, i)).css(conf.tipStyle);
                                floatTag.css({"visibility" : "visible"});
                            }, function () {
                                floatTag.css({"visibility" : "hidden"});
                            });
                        } else {
                            historyBubble.hover(function () {
                                this.attr({"stroke-width": 1, "stroke": "#f00"});
                                floatTag.html(that.getTip(key, i)).css(conf.tipStyle);
                                floatTag.css({"visibility" : "visible"});
                            }, function () {
                                this.attr({"stroke-width": 0});
                                floatTag.css({"visibility" : "hidden"});
                            });
                        }

                        historyBubble.click(function () {
                            that.generatePaths(Math.ceil(time));
                            that.choose = false;
                        });

                    }(i));
                }

                var skeletonLineSet = foreCanvas.set();
                for (i = 1, l = timeKeys.length; i < l; i++) {
                    var x0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(that.xDimen, key)),
                        y0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(that.yDimen, key)),
                        x = that.x[that.xDimen](x0) - margin[3],
                        y = that.y[that.yDimen](y0),
                        x1 = that.interpolateData(timeKeys[i-1], timeKeys, that.getKeyData(that.xDimen, key)),
                        y1 = that.interpolateData(timeKeys[i-1], timeKeys, that.getKeyData(that.yDimen, key)),
                        x2 = that.x[that.xDimen](x1) - margin[3],
                        y2 = that.y[that.yDimen](y1);
                    var skeletonLine = foreCanvas.path("M"+x2+" "+y2+"L"+x+" "+y);
                        skeletonLine.attr(conf.skeletonLineAttr);
                        skeletonLineSet.push(skeletonLine);
                }

                var skeletonCircleSet = foreCanvas.set();
                for (i = 0, l = timeKeys.length; i < l; i++) {
                    (function (i) {
                        var x0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(that.xDimen, key)),
                            y0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(that.yDimen, key)),
                            c0 = that.getColorData(key),
                            x = that.x[that.xDimen](x0) - margin[3],
                            y = that.y[that.yDimen](y0),
                            c = that.c[that.colorDimen](c0);

                        var skeletonCircle = foreCanvas.circle(x,y,skeletonRadius);
                        skeletonCircle.attr(conf.skeletonCircleAttr).attr({"stroke": c});
                        skeletonCircleSet.push(skeletonCircle);

                        if (timeKeys[i] === Math.ceil(time)) {
                            skeletonCircle.attr({"fill": "#f00"});
                            skeletonCircle.click(function () {
                                that.generatePaths(Math.ceil(time));
                            });
                            skeletonCircle.hover(function () {
                                floatTag.html(that.getTip(key, i)).css(conf.tipStyle);
                                floatTag.css({"visibility" : "visible"});
                                skeletonCircleSet.attr({"fill-opacity": 0.35});
                                this.attr({"fill-opacity": 1, "r": 5});
                                skeletonLineSet.attr({"opacity": 0.35});
                            }, function () {
                                floatTag.css({"visibility" : "hidden"});
                                this.attr(conf.dotStrokeColor);
                                skeletonCircleSet.attr({"fill-opacity": 0.7});
                                this.attr({"r": skeletonRadius});
                                // meshes.attr({"stroke": "#ebebeb", "stroke-dasharray": "-"});
                                skeletonLineSet.attr({"opacity": 0.7});
                            });
                        } else {
                            skeletonCircle.hover(function () {
                                floatTag.html(that.getTip(key, i)).css(conf.tipStyle);
                                floatTag.css({"visibility" : "visible"});
                                skeletonCircleSet.attr({"fill-opacity": 0.35});
                                this.attr({"fill-opacity": 1, "r": 5});
                                skeletonLineSet.attr({"opacity": 0.35});
                            }, function () {
                                floatTag.css({"visibility" : "hidden"});
                                this.attr(conf.dotStrokeColor);
                                skeletonCircleSet.attr({"fill-opacity": 0.7});
                                this.attr({"r": skeletonRadius});
                                skeletonLineSet.attr({"opacity": 0.7});
                            });
                        }
                    }(i));
                }
            }
        }
    };

    /**
     * get key's specific dimension data which include all time points
     */
    Bubble.prototype.getKeyData = function(dimen, key) {
        var that = this;
        return _.map(_.filter(this.source, function (item) {
            return item[that.keyDimen] === key;
        }), function (item) {
            return item[dimen];
        });
    };

    /**
     * get a unique color specified by key
     */
    Bubble.prototype.getColorData = function(key) {
        for (var i = 0; i < this.source.length; i++) {
            if (this.source[i][this.keyDimen] === key) {
                return this.source[i][this.colorDimen];
            }
        }
    };

    /**
     * set up an animation
     */
    Bubble.prototype.initControls = function() {  
        var that = this,
            len = this.times.length -1;
        var value = this.startTime;

        this.interval = setInterval(function() {
            if (value <= len) {
                that.generatePaths(value);
                value += 0.25;
            } else {
                clearInterval(that.interval);
                that.interval = 0;
            }
        }, 250);
    };

    /**
     * interpolated some data between neibourh data point for the animation
     */
    Bubble.prototype.interpolateData = function(year, years, values) {
        var index = Math.ceil(year);
        if (year === years[index]) {
            return values[index];
        }
        var lowerIndex = Math.max(0,index-1);
        var lower = values[lowerIndex];
        var higherIndex = index;
        var higher = values[higherIndex];
        var lowYear = years[lowerIndex];
        var highYear = years[higherIndex];
        var p = (year - lowYear) / (highYear - lowYear);
        var value = +lower + (higher - lower) * p;
        return value;
    };

    /**
     * clear animation and related artifacts
     */
    Bubble.prototype.clearAnimation = function () {
        clearInterval(this.interval);
        this.interval = 0;
        this.backCanvas.clear();
        this.foreCanvas.clear();
    };

    /**
     * pause the interval
     */
    Bubble.prototype.pause = function () {
        clearInterval(this.interval);
        this.interval = 0;
    };

    /**
     * set the rendering process
     */
    Bubble.prototype.render = function (options) {
        clearInterval(this.interval);
        this.setOptions(options);
        if (!this.interval) {
            this.renderAxis();
        }
        this.foreCanvas.clear();
        this.getScale();
        this.initControls();
    };

    return Bubble;
});
