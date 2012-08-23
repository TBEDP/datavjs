/*global Raphael */
/*global d3 */
define(function (require, exports, module) {
    var DataV = require('datav');

    /*
       Recently, bubble graph can represent five dimensions by xaxis,yaxis,size,color and time.
       You can stop animation by pause() method, start animation by initControls method;
       you can change animation start time by using global variable  this.startTime;
       you can visualize a time point's data by generatePaths(time point) method;
       an inside method drawAllTime(key) is designed for interaction.
    */

    var Bubble = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Bubble";
            this.container = node;
            this.node = this.checkNode(node);
            this.defaults = {};
            // setting display width and height, also they can be changed by options
            this.defaults.width = 800;
            this.defaults.height = 600;
            this.defaults.minRadius = 10;
            this.defaults.maxRadius = 40;
            this.defaults.meshInterval = 20;
            // margin order: left, top, right, bottom
            this.defaults.borderMargin = [200, 30, 0, 80];
            this.defaults.allDimensions = [];   
            this.defaults.dimensions = [];   
            this.defaults.dimensionType = {};
            this.defaults.dimensionDomain = {};
            this.defaults.dotStrokeColor = {"stroke": "#fff"};
            this.defaults.colorBarWidth = 40;
            this.defaults.colorBarHeight = 27;
            this.defaults.colorBarBorder = 10;
            this.defaults.skeletonCircleAttr = {
                "fill": "#000",
                "fill-opacity": 0.6,
                "stroke-width": 0
            }
            this.defaults.skeletonLineAttr = {
                "stroke": "#000",
                "stroke-width": 0.5,
                "stroke-opacity": 0.5
            }
            this.defaults.colorBarAttr = {
                "stroke": "#C9C9C9",
                "stroke-opacity": 0,
                "r": 5
            };
            this.defaults.textAttr = {
                "fill": "#000",
                "fill-opacity": 1,
                "font-family": "雅黑",
                "font-size": 12
                };

            this.setOptions(options);
            this.createCanvas();
        }
    });

    // check node: if there is no node or the node is incorrect, throw error
    Bubble.prototype.checkNode = function (node) {
        if (!node) {
            throw new Error("Please specify which node to render.");
        }
        if (typeof (node) === "string") {
            return document.getElementById(node);
        } else if (node.nodeName) { 
            return node;
        }    
        throw new Error("Please specify which node to render.");
    };

    // set visualization options
    Bubble.prototype.setOptions = function (options) {
        var prop;
        if (options) {
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }
    };

    // create a backCanvas for the visualization
    Bubble.prototype.createCanvas = function () {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        var conf = this.defaults;
            m = conf.borderMargin;
        this.backCanvas = new Raphael(this.node, conf.width, conf.height);
        this.foreCanvas = Raphael(this.node, conf.width, conf.height);
            $(this.node).css("position", "relative");
            $(this.foreCanvas.canvas).css({"position": "absolute", 
                "zIndex": 2, "left": m[0], "top": m[1]});

        this.canvasF = document.getElementById(this.container);
        canvasStyle = this.canvasF.style;
        canvasStyle.position = "relative";
        this.floatTag = DataV.FloatTag()(this.canvasF);

        this.floatTag.css({"visibility": "hidden"});

        $("#" + this.container).append(this.floatTag);
    };

    // choose bubble graph setted visualization dimens orderly
    Bubble.prototype.chooseDimensions = function (dimen) {
        var conf = this.defaults;
        conf.dimensions = [];
        var strInArray = function (str, array) {
            for (var i = 0, l = array.length; i < l; i++){
                if (array[i] === str) {
                    return true;
                }
            }
            return false;
        }
        for(var i = 0, l = dimen.length; i < l; i++){
            if(strInArray(dimen[i], conf.allDimensions)) {
                conf.dimensions.push(dimen[i]);
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

        this.times.uniq();
        this.keys.uniq();
        for (var i = 0,l = this.times.length; i < l; i++) {
            this.timeKeys.push(i);
        }
        this.startTime = 0;
    };

    // set source, get dimensions data, dimension type, and dimension domain 
    // default visualization dimension is setted here
    Bubble.prototype.setSource = function (source) {
        var conf = this.defaults;
        conf.allDimensions = source[0];
        // by default all dimensions show
        conf.dimensions = source[0];

        this.source = [];
        for(var i=1, l=source.length; i < l; i++){
            var dot = {},
                dimen = conf.allDimensions;
            for(var j=0, ll=dimen.length; j < ll; j++){
                dot[dimen[j]] = source[i][j];
            }
            this.source.push(dot);
        }

        // judge dimesions type auto
        conf.dimensionType = {};
        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
        for(var i = 0, l = conf.allDimensions.length; i < l; i++){
            var type = "quantitative";
            for(var j = 1, ll = source.length; j < ll; j++){
                var d = source[j][i];
                if(d && (! isNumber(d))){
                    type = "ordinal";
                    break;
                }
            }
            conf.dimensionType[conf.allDimensions[i]] = type;           
        }

        // set default dimensionDomain     
        for(var i = 0, l = conf.allDimensions.length; i < l; i++){
            var dimen = conf.allDimensions[i];
            if(conf.dimensionType[dimen] === "quantitative"){
                conf.dimensionDomain[dimen] = d3.extent(this.source,
                     function(p){return Math.abs(p[dimen])});
            }else{
                conf.dimensionDomain[dimen] = 
                    this.source.map(function(p){return p[dimen]});
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

        this.times.uniq();
        this.keys.uniq();    
        for (var i = 0,l = this.times.length; i < l; i++) {
            this.timeKeys.push(i);
        }  
        this.startTime = 0;
    };

    // different visualization scale is defined here 
    Bubble.prototype.getScale = function() {
        var conf = this.defaults;
            m = conf.borderMargin,
            w = conf.width - m[0] - m[2],
            h = conf.height - m[1] - m[3],
            colorData = [],
            maxRadius = conf.maxRadius,
            minRadius = conf.minRadius,
            backCanvas = this.backCanvas,
            xDimen = this.xDimen,
            yDimen = this.yDimen,
            sizeDimen = this.sizeDimen,
            colorDimen = this.colorDimen,
            timeDimen = this.timeDimen,
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
            .domain(xDomain).range([m[0], m[0] + w]);
        this.y = {};
        this.y[yDimen] = d3.scale.linear()
            .domain(yDomain).range([h, 0]); 
        this.z = {};
        this.z[sizeDimen] = d3.scale.linear()
            .domain(conf.dimensionDomain[sizeDimen]).range([minRadius, maxRadius]); 
        this.c = {};
        this.c[colorDimen] = this.colorDB({mode: "random", ratio: 0.5});

        for (var i = 0, l = this.keys.length; i < l; i++) {
            c0 = this.getColorData(this.keys[i]);
            colorData.push(c0);
        }
        colorData.uniq();

        // draw colorbar
        var tagArea = [20, (conf.height - m[3] - colorData.length * 23), 200, 220],
            rectBn = backCanvas.set(),
            underBn = [];
        for (var i = 0, l = colorData.length; i < l;i++) {
            var c = this.c[colorDimen](colorData[i]);
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
        that = this;
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

        // pause, restart and related control function
        // var restart = backCanvas.rect(m[0] - conf.colorBarHeight - 2, m[1] + h + 30, conf.colorBarHeight, 
        //     conf.colorBarHeight).attr({"fill": "#aaa", "fill-opacity": 0.9}).attr(conf.dotStrokeColor);
        // var playButtonShadow = backCanvas.rect(0,0,15,15,2).attr({"stroke": "none","fill": "#606060", "fill-opacity":0.4});
        var playButtonBack = backCanvas.rect(0,0,24,24,2).attr({"stroke": "none","fill": "#d6d6d6"});
        var startPatternPath = "M7,18L19,12L7,6V18z";
        var stopPatternPathL = "M7,7sh4v10sh-4z";
        var stopPatternPathR = "M13,7sh4v10sh-4z";
        // var buttonBack = backCanvas.rect(0,0,24,24).attr({"fill": "#606060"});
        var startPattern = backCanvas.path(startPatternPath).attr({"stroke-width": 0, "stroke-linejoin": "round", "fill": "#606060"});
        var stopPattern = backCanvas.set();
        stopPattern.push(backCanvas.path(stopPatternPathL));
        stopPattern.push(backCanvas.path(stopPatternPathR));
        stopPattern.attr({"stroke-width": 0, "stroke-linejoin": "round", "fill": "#606060"});

        // playButtonShadow.transform("t" + (m[0] - conf.colorBarHeight + 3 + 4) + "," + (m[1] + h + 33 + 4));
        playButtonBack.transform("t" + (m[0] - conf.colorBarHeight) + "," + (m[1] + h + 33));
        startPattern.transform("t" + (m[0] - conf.colorBarHeight) + "," + (m[1] + h + 33));
        stopPattern.transform("t" + (m[0] - conf.colorBarHeight) + "," + (m[1] + h + 33));
        startPattern.attr({"stroke-width": 0, "stroke-linejoin": "round", "fill-opacity": 0});

        var playButton = backCanvas.set();
        playButton.push(playButtonBack);
        playButton.push(startPattern);
        playButton.push(stopPattern);

        // var reTest = backCanvas.path(startPattern).attr({"stroke-linejoin": "round"}).transform("t" + (m[0] - conf.colorBarHeight + 3) + "," + (m[1] + h + 33));
        // backCanvas.path(stopPatternL).attr({"stroke-linejoin": "round"}).transform("t" + (m[0] - conf.colorBarHeight + 3) + "," + (m[1] + h + 33));
        // backCanvas.path(stopButtonL).attr({"stroke-linejoin": "round"}).transform("t" + (m[0] - conf.colorBarHeight + 3 + 6) + "," + (m[1] + h + 33));

        playButton.dblclick(
            function() {
                that.clearAnimation();
                that.render();
            }
        );
        playButton.click(
            function() {
                if (that.interval) {
                    stopPattern.attr({"fill-opacity": 0});
                    startPattern.attr({"fill-opacity": 1});
                    that.pause();
                } else {
                    startPattern.attr({"fill-opacity": 0});
                    stopPattern.attr({"fill-opacity": 1});
                    that.initControls();
                }
                    
            }
        );
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

    }

    // draw x-axis, y-axis and related parts
    Bubble.prototype.renderAxis = function () {       
        var conf = this.defaults;
            m = conf.borderMargin,
            w = conf.width - m[0] - m[2],
            h = conf.height - m[1] - m[3],
            colorData = [],
            maxRadius = conf.maxRadius,
            minRadius = conf.minRadius,
            yaxis = DataV.Axis().orient("left"),
            xaxis = DataV.Axis().orient("bottom"),
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
            (backCanvas).attr({transform: "t" + m[0] + "," + (m[1] + h)});

        yaxis.scale(axixY)
            .tickSubdivide(1)
            .tickSize(6, 3, 0)
            .tickPadding(5)
            .tickAttr({"stroke": "#929292"})
            .tickTextAttr({"font-size": "10px", "fill": "#929292"})
            .minorTickAttr({"stroke": "#929292"})
            .domainAttr({"stroke-width": 1, "stroke": "#929292"})
            (backCanvas).attr({transform: "t" + m[0] + "," + m[1]});

        var xText = backCanvas.text(m[0] + w/2, m[1] + h + 40, this.xDimen);
        xText.attr({"font-size": "15px", "font-family": "Arial", "fill": "#000000"});
        var yText = backCanvas.text(m[0] - 50, m[1] + h/2, this.yDimen);
        yText.attr({"font-size": "15px", "font-family": "Arial", "fill": "#000000"}).transform("r-90");     
    };

    // color database
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

    // main visualization method where bubble is drawed inside
    // a time point is the method's only parameter
    Bubble.prototype.generatePaths = function (time) {
        var conf = this.defaults,
            m = conf.borderMargin,
            meshInterval = conf.meshInterval,
            realWidth = conf.width - m[0] - m[2],
            realHeight = conf.height - m[1] - m[3],
            labelSize = 18,
            labelXDistance = realHeight * 0.86,
            foreCanvas = this.foreCanvas,
            x0, y0, r0, c0,
            x, y, r, c, skeletonRadius = 2,
            timeKeys = this.timeKeys,
            keys = this.keys,
            dots = [],
            dotBubbleSet = [];

        // $("#" + this.node).append(this.floatTag);

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
        for (var i = 1;i < verticleMeshNum;i++) {
            meshes.push(foreCanvas.path("M"+(i * meshInterval)+" "+0+"L"+(i * meshInterval)+
                " "+(realHeight-1)).attr({"stroke": "#ebebeb", "stroke-width": 1}));
        }
        for (var i = 1;i < horizontalMeshNUm;i++) {
            meshes.push(foreCanvas.path("M"+1+" "+(realHeight - (i * meshInterval))+"L"+realWidth+
                " "+(realHeight - (i * meshInterval))).attr({"stroke": "#ebebeb", "stroke-dasharray": "-", "stroke-width": 0.5}));
        }

        // get all data by time and key dimension data
        for (var i = 0, l = keys.length; i < l; i++) {
            x0 = this.interpolateData(time, timeKeys, this.getKeyData(xDimen, keys[i]));
            y0 = this.interpolateData(time, timeKeys, this.getKeyData(yDimen, keys[i]));
            r0 = this.interpolateData(time, timeKeys, this.getKeyData(sizeDimen, keys[i]));
            c0 = this.getColorData(keys[i]);

            var dot = {key: keys[i], x0: x0, y0: y0, r0: r0, c0: c0, year: this.times[time.toFixed(0)]};
            dots.push(dot);
        }

        var floatTag = this.floatTag;
        var tip = '<b>' + that.keyDimen + ':{key}</b><br/><b>' 
                    + that.xDimen + ':{xDimen}</b><br/><b>'
                    + that.yDimen + ':{yDimen}</b><br/><b>'
                    + that.sizeDimen + ':{sizeDimen}</b><br/><b>'
                    + that.colorDimen + ':{colorDimen}</b><br/><b>'
                    + that.timeDimen + ':{timeDimen}</b>';


        // control the time label
        var label = foreCanvas.text(20, m[1] + h + 15, this.times[time.toFixed(0)]);
        label.attr({"font-size": labelSize, "fill": "#606060", "text-anchor": "start"});

        dots.sort(function(b,a) { return a.r0 < b.r0 ? -1 : a.r0 > b.r0 ? 1 : 0; });

        // draw the circles
        for (var i = 0, l = dots.length; i < l; i++) {          
            var dot = dots[i],
                x = this.x[xDimen](dot.x0) - m[0],
                y = this.y[yDimen](dot.y0),
                r = this.z[sizeDimen](dot.r0),
                c = this.c[colorDimen](dot.c0),
                dotBubble = foreCanvas.circle(x, y, r);
            dotBubble.attr({"stroke-width":0, "fill": c, "fill-opacity": 0.5})
                .data("key", dot.key).data("colorType", dot.c0);
            dotBubbleSet.push(dotBubble);
        }

        // add hover and click effect for all circles
        dotBubbleSet.forEach(function (d, i) {
            tip = tip.replace('{key}', dots[i].key);
                    tip = tip.replace('{xDimen}', dots[i].x0);
                    tip = tip.replace('{yDimen}', dots[i].y0);
                    tip = tip.replace('{sizeDimen}', dots[i].r0);
                    tip = tip.replace('{colorDimen}', dots[i].c0);
                    tip = tip.replace('{timeDimen}', time);
            d.hover(
                function () {
                    floatTag.html ( '<div style = "text-align: left;margin:auto;color:'
                        //+ jqNode.color
                        + "#ffffff"
                        + '">' + tip + '</div>'
                        );
                    floatTag.css({"visibility" : "visible"});
                    if (!that.choose) {
                        d.attr({"stroke-width": 1, "stroke": "#f00", "fill-opacity": 0.8});
                        meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-", "stroke-width": 1});
                        for (var j = 0, l = dotBubbleSet.length; j < l ; j++) {
                            if (j != i) {
                               dotBubbleSet[j].attr({"stroke-width": 0, "fill-opacity": 0.2});
                            }
                        }
                    }
                },
                function () {
                    floatTag.css({"visibility" : "hidden"});
                    if (!that.choose) {
                        d.attr({"stroke-width": 0, "fill-opacity": 0.5});
                        meshes.attr({"stroke": "#ebebeb", "stroke-dasharray": "-", "stroke-width": 1});
                        for (var j = 0, l = dotBubbleSet.length; j < l ; j++) {
                            if (j != i) {
                               dotBubbleSet[j].attr({"stroke-width": 0, "fill-opacity": 0.5});
                            }
                        }
                    }
                }
            );

            d.click(
                function() {
                    if (time == Math.ceil(time)) {
                        drawAllTime(this.data("key"), i);
                    } else {
                        drawAllTime(this.data("key"), i);
                        this.remove();
                    }
                }
            );
        }); 

        // colorbar interaction for showing all same color history data
        that = this;
        if (this.interactionType) {
            dotBubbleSet.forEach(function (d) {
                if (d.data("colorType") == that.interactionType) {
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
                    if (j != num) {
                        dotBubbleSet[j].attr({"stroke-width": 0, "fill-opacity": 0.2});
                    }
                }

                meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-"});

                var tip = '<b>' + that.keyDimen + ':{key}</b><br/><b>' 
                    + that.xDimen + ':{xDimen}</b><br/><b>'
                    + that.yDimen + ':{yDimen}</b><br/><b>'
                    + that.sizeDimen + ':{sizeDimen}</b><br/><b>'
                    + that.colorDimen + ':{colorDimen}</b><br/><b>'
                    + that.timeDimen + ':{timeDimen}</b>';

                for (var i = 0, l = timeKeys.length; i < l; i++) {
                    var x0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(xDimen, key)),
                        y0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(yDimen, key)),
                        r0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(sizeDimen, key)),
                        c0 = that.getColorData(key),
                        x = that.x[xDimen](x0) - m[0],
                        y = that.y[yDimen](y0),
                        r = that.z[sizeDimen](r0),
                        c = that.c[colorDimen](c0),
                        fOpacity = 0.1 + Math.pow(1.5, i)/Math.pow(1.5, l);
                        historyBubble = foreCanvas.circle(x, y, r);
                        historyBubble.attr({"stroke-width": 0, "fill": c, "fill-opacity": fOpacity});

                    tip = tip.replace('{key}', key);
                    tip = tip.replace('{xDimen}', x0);
                    tip = tip.replace('{yDimen}', y0);
                    tip = tip.replace('{sizeDimen}', r0);
                    tip = tip.replace('{colorDimen}', c0);
                    tip = tip.replace('{timeDimen}', that.times[timeKeys[i]]);

                    if (timeKeys[i] == Math.ceil(time)) {
                        historyBubble.attr({"stroke-width": 1, "stroke": "#f00"});
                        historyBubble.hover(
                            function () {
                                floatTag.html ( '<div style = "text-align: left;margin:auto;color:'
                                //+ jqNode.color
                                    + "#ffffff"
                                    + '">' + tip + '</div>'
                                    );
                                floatTag.css({"visibility" : "visible"});
                                // meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-"});
                            },
                            function () {
                                floatTag.css({"visibility" : "hidden"});
                                // meshes.attr({"stroke": "#ebebeb", "stroke-dasharray": "-"});
                            }
                        );

                    } else {
                        historyBubble.hover(
                            function () {
                                this.attr({"stroke-width": 1, "stroke": "#f00"});
                                floatTag.html ( '<div style = "text-align: left;margin:auto;color:'
                                //+ jqNode.color
                                    + "#ffffff"
                                    + '">' + tip + '</div>'
                                    );
                                floatTag.css({"visibility" : "visible"});
                                // meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-"});
                            },
                            function () {
                                this.attr({"stroke-width": 0});
                                floatTag.css({"visibility" : "hidden"});
                                // meshes.attr({"stroke": "#ebebeb", "stroke-dasharray": "-"});
                            }
                        );
                    }

                    historyBubble.click(
                            function () {
                                that.generatePaths(Math.ceil(time));
                                that.choose = false;
                            }
                        );
                }

                var skeletonLineSet = foreCanvas.set();
                for (var i = 1, l = timeKeys.length; i < l; i++) {
                    var x0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(xDimen, key)),
                        y0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(yDimen, key)),
                        x = that.x[xDimen](x0) - m[0],
                        y = that.y[yDimen](y0),
                        x1 = that.interpolateData(timeKeys[i-1], timeKeys, that.getKeyData(xDimen, key)),
                        y1 = that.interpolateData(timeKeys[i-1], timeKeys, that.getKeyData(yDimen, key)),
                        x2 = that.x[xDimen](x1) - m[0],
                        y2 = that.y[yDimen](y1);
                        skeletonLine = foreCanvas.path("M"+x2+" "+y2+"L"+x+" "+y);
                        skeletonLine.attr(conf.skeletonLineAttr);
                        skeletonLineSet.push(skeletonLine);
                    }

                var skeletonCircleSet = foreCanvas.set();
                for (var i = 0, l = timeKeys.length; i < l; i++) {
                    var x0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(xDimen, key)),
                        y0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(yDimen, key)),
                        r0 = that.interpolateData(timeKeys[i], timeKeys, that.getKeyData(sizeDimen, key)),
                        c0 = that.getColorData(key),
                        x = that.x[xDimen](x0) - m[0],
                        y = that.y[yDimen](y0),
                        r = that.z[sizeDimen](r0),
                        c = that.c[colorDimen](c0),
                        fOpacity = 0.1 + i * 0.9 / timeKeys.length;
                    skeletonCircle = foreCanvas.circle(x,y,skeletonRadius);
                    skeletonCircle.attr(conf.skeletonCircleAttr).attr({"stroke": c});
                    skeletonCircleSet.push(skeletonCircle);

                    if (timeKeys[i] == Math.ceil(time)) {
                        skeletonCircle.attr({"fill": "#f00"});
                        skeletonCircle.click(
                            function () {
                                that.generatePaths(Math.ceil(time));
                            }
                        );
                        skeletonCircle.hover(
                            function () {
                                floatTag.html ( '<div style = "text-align: left;margin:auto;color:'
                                //+ jqNode.color
                                    + "#ffffff"
                                    + '">' + tip + '</div>'
                                    );
                                floatTag.css({"visibility" : "visible"});
                                skeletonCircleSet.attr({"fill-opacity": 0.35});
                                this.attr({"fill-opacity": 1, "r": 5});
                                // meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-"});
                                skeletonLineSet.attr({"opacity": 0.35});
                            },
                            function () {
                                floatTag.css({"visibility" : "hidden"});
                                this.attr(conf.dotStrokeColor);
                                skeletonCircleSet.attr({"fill-opacity": 0.7});
                                this.attr({"r": skeletonRadius});
                                // meshes.attr({"stroke": "#ebebeb", "stroke-dasharray": "-"});
                                skeletonLineSet.attr({"opacity": 0.7});
                            }
                        );
                    } else {
                        skeletonCircle.hover(
                            function () {
                                floatTag.html ( '<div style = "text-align: left;margin:auto;color:'
                                //+ jqNode.color
                                    + "#ffffff"
                                    + '">' + tip + '</div>'
                                    );
                                floatTag.css({"visibility" : "visible"});
                                skeletonCircleSet.attr({"fill-opacity": 0.35});
                                this.attr({"fill-opacity": 1, "r": 5});
                                // meshes.attr({"stroke": "#d6d6d6", "stroke-dasharray": "-"});
                                skeletonLineSet.attr({"opacity": 0.35});
                            },
                            function () {
                                floatTag.css({"visibility" : "hidden"});
                                this.attr(conf.dotStrokeColor);
                                skeletonCircleSet.attr({"fill-opacity": 0.7});
                                this.attr({"r": skeletonRadius});
                                // meshes.attr({"stroke": "#ebebeb", "stroke-dasharray": "-"});
                                skeletonLineSet.attr({"opacity": 0.7});
                            }
                        );
                    }
                }

            }
        }     
    };

    // get key's specific dimension data which include all time points 
    Bubble.prototype.getKeyData = function(dimen,key) {
        var data = [];
        for (var i = 0; i < this.source.length; i++) {
            if (this.source[i][this.keyDimen] === key) {
                data.push(this.source[i][dimen]);
            }
        }
        return data;
    }; 

    // get a unique color specified by key
    Bubble.prototype.getColorData = function(key) {
        for (var i = 0; i < this.source.length; i++) {
            if (this.source[i][this.keyDimen] === key) {
                return this.source[i][this.colorDimen];
            }
        }

    };

    // set up an animation
    Bubble.prototype.initControls = function() {  
        var that = this,
            len = this.times.length -1;
            value = this.startTime;

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

    // interpolated some data between neibourh data point for the animation
    Bubble.prototype.interpolateData = function(year, years, values) {
        var index = Math.ceil(year);
        if (year == years[index]) {
            return values[index];
        }
        var lowerIndex = Math.max(0,index-1);
        var lower = values[lowerIndex];
        var higherIndex = index;
        var higher = values[higherIndex];
        var lowYear = years[lowerIndex];
        var highYear = years[higherIndex];
        var p = (year-lowYear) / (highYear-lowYear);
        var value = +lower + +((higher-lower)*p) ;
        return value;
    };

    // make an array's every element unique by delete other same element 
    Array.prototype.uniq = function () {
        var temp = {},
            len = this.length;

        for (var i = 0; i < len; i++) {
            if (typeof temp[this[i]] == "undefined") {
                temp[this[i]] = 1;
            }
        }
        this.length = 0;
        len = 0;
        for (var i in temp) {
            this[len++] = i;
        }
        return this;
    };

    // clear animation and related artifacts 
    Bubble.prototype.clearAnimation = function () {
        clearInterval(this.interval);
        this.interval = 0;
        this.backCanvas.clear();
        this.foreCanvas.clear();
    };

    // pause the interval
    Bubble.prototype.pause = function () {
        clearInterval(this.interval);
        this.interval = 0;
    };

    // set the rendering process
    Bubble.prototype.render = function (options) {
        clearInterval(this.interval);
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        this.setOptions(options);
        if (!this.interval) {
            this.renderAxis();
        } 
        this.foreCanvas.clear();
 	    this.getScale();
        this.initControls();
    };

    module.exports = Bubble;
});