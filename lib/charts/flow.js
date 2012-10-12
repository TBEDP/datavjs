/*global EventProxy, d3, Raphael, $ */
define(function (require, exports, module) {
    var DataV = require('datav');
    var theme = DataV.Themes;

    var Flow = DataV.extend(DataV.Chart, {
        initialize: function (container, options) {
            this.type = "Flow";
            this.container = container;
            this.defaults = {};

            // Properties
            this.font = {};

            // Canvas
            this.defaults.width = 500;
            this.defaults.height = 400;
            this.defaults.deep = 150;
            this.defaults.radius = 50;
            this.defaults.xStep = 300;
            this.defaults.xStart = 200;
            this.defaults.yStart = 50;

            this.setOptions(options);
            this.emitter = new EventProxy();
            this.createCanvas();
        }
    });

    Flow.prototype.on = function (eventName, callback) {
        this.emitter.on(eventName, callback);
    };

    Flow.prototype.setOptions = function (options) {
        var prop;
        if (options) {
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }
    };

    Flow.prototype.setSource = function (source) {
        var conf = this.defaults;

        this.rawData = source;
        this.source = this.remapSource(source);
    };

    Flow.prototype.remapSource = function (data) {
        console.log(data);
        var dataLength = data.length;
        var remapData = [];

        var total;
        var i;
        for (i = 0; i < dataLength; i++){
            if (!data[i][3]) {
                total = data[i][2];
                remapData.push({id: data[i][0], name: data[i][1], value: data[i][2], pid: data[i][3], child: [], deep: 0});
            } else {
                remapData.push({id: data[i][0], name: data[i][1], value: data[i][2], pid: data[i][3], child: [], deep: 0});
            }
        } 

        var conf = this.defaults;
        var width = conf.width;
        var height = conf.height;
        var radius = conf.radius;
        var xStep = conf.xStep;
        var xStart = conf.xStart;
        var yStart = conf.yStart;
        var depth = 0;

        for (i = 0; i < dataLength; i++){
            if (remapData[i].pid) {
                remapData[i].deep = remapData[remapData[i].pid - 1].deep + 1;
                remapData[remapData[i].pid - 1].child.push(remapData[i].id - 1);
                if (remapData[i].deep > depth) {
                    depth = remapData[i].deep;
                }
            } 
            // remapData[remapData[i].pid].child.push(remapData[i].id);
        }

        this.depth = depth;
        radius = Math.min(Math.min((width - xStep * (depth - 1) - xStart * 2) / depth, height*0.55), radius);
        console.log("r:" + radius);
        for (i = 0; i < dataLength; i++){
            remapData[i].percent = remapData[i].value / total;
            remapData[i].radius = radius * remapData[i].percent;
            console.log("r:" + remapData[i].radius + " p:" + remapData[i].percent);
        }

        console.log(remapData);
        return remapData;
        // return data;
    };

    Flow.prototype.layout = function () {
        var conf = this.defaults;
        var width = conf.width;
        var height = conf.height;
        var xStart = conf.xStart;
        var yStart = conf.yStart;
        var xStep = conf.xStep;
        var remapData = this.source;

        //console.log(this.source);
        var circleData = [];

        circleData.push({x: width * 0.24, y: height * 0.42, radius: Math.max(10, remapData[0].radius), deep: remapData[0].deep, name: remapData[0].name, value: remapData[0].value});
        circleData.push({x: width * 0.5, y: height * 0.245, radius: Math.max(10, remapData[1].radius), deep: remapData[1].deep, name: remapData[1].name, value: remapData[1].value});
        circleData.push({x: width * 0.5, y: height * 0.6, radius: Math.max(10, remapData[2].radius), deep: remapData[2].deep, name: remapData[2].name, value: remapData[2].value});
        circleData.push({x: width * 0.72, y: height * 0.5, radius: Math.max(10, remapData[3].radius), deep: remapData[3].deep, name: remapData[3].name, value: remapData[3].value});
        circleData.push({x: width * 0.72, y: height * 0.817, radius: Math.max(10, remapData[4].radius), deep: remapData[4].deep, name: remapData[4].name, value: remapData[4].value});

        for (i = 0;i < circleData.length; i++) {
            console.log(circleData[i].x);
        }

        this.circleData = circleData;
    };

    Flow.prototype.getColor = function () {

        var colorMatrix = DataV.getColor();
        
        return color;
    };

    // Tree.prototype.getFont = function () {
    //     //var conf = this.defaults;

    //     return DataV.getFont();
    // };

    Flow.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.canvas = new Raphael(this.container, conf.width, conf.height);

        this.DOMNode = $(this.canvas.canvas);
        var that = this;
        this.DOMNode.click(function (event) {
            that.emitter.trigger("click", event);
        });
        this.DOMNode.dblclick(function (event) {
            that.emitter.trigger("dblclick", event);
        });

        var mousewheel = document.all ? "mousewheel" : "DOMMouseScroll";  
        this.DOMNode.bind(mousewheel, function (event) {
            that.emitter.trigger("mousewheel", event);
        });

        this.DOMNode.bind("contextmenu", function (event) {
            that.emitter.trigger("contextmenu", event);
        });

        this.DOMNode.delegate("circle", "click", function (event) {
            that.emitter.trigger("circle_click", event);
        });

        this.DOMNode.delegate("circle", "mouseover", function (event) {
            that.emitter.trigger("circle_mouseover", event);
        });

        this.DOMNode.delegate("circle", "mouseout", function (event) {
            that.emitter.trigger("circle_mouseout", event);
        });

        //console.log(this.canvas);
    };


    Flow.prototype.getLinkPath = function (fx, fy, tx, ty) {
        var conf = this.defaults;

        var c1x = fx + (tx - fx) / 1.5;
        var c1y = fy;
        var c2x = tx - (tx - fx) / 4;
        var c2y = ty - (ty - fy) / 2;

        var link_path = [["M", fx, fy], 
            ["S", c1x, c1y, tx, ty]];

        return link_path;  
    };

    Flow.prototype.generatePaths = function () {
        var canvas = this.canvas;
        var source = this.source;
        var conf = this.defaults;
        var radius = conf.radius;
        //canvas.clear();
        // var font = this.getFont();
        var font_family = '微软雅黑';
        var font_size = 8;
        var depth = this.depth;
        var crilceData = this.circleData;
        var l = crilceData.length;
        var getLinkPath = this.getLinkPath;

        canvas.path().attr({stroke:  "#cdcdcd", "stroke-width": 2}).attr({path: getLinkPath(crilceData[0].x, crilceData[0].y, crilceData[1].x, crilceData[1].y)});
        canvas.path().attr({stroke:  "#cdcdcd", "stroke-width": 2}).attr({path: getLinkPath(crilceData[0].x, crilceData[0].y, crilceData[2].x, crilceData[2].y)});
        canvas.path().attr({stroke:  "#cdcdcd", "stroke-width": 2}).attr({path: getLinkPath(crilceData[2].x, crilceData[2].y, crilceData[3].x, crilceData[3].y)});
        canvas.path().attr({stroke:  "#cdcdcd", "stroke-width": 2}).attr({path: getLinkPath(crilceData[2].x, crilceData[2].y, crilceData[4].x, crilceData[4].y)});

        var i, d
        var thisRadius;
        var thisColor;
        var titelPath = [];
        var valuePath = [];
        for (i = 0 ; i < l ; i++) {
            d = crilceData[i];
            thisRadius = Math.max(27, d.radius);
            if (i === 1) {
                thisColor = "#b4e481";
            } else if (i === 4) {
                thisColor = "#cd3a19";
            } else {
                thisColor = "#ffe79d";
            }
            canvas.circle(d.x, d.y, thisRadius)
            .attr({"stroke": "none", fill: thisColor});
            titelPath.push(canvas.text(0, 0, d.name).attr({'font-size': 12}));
            if (i < l - 2) { 
                titelPath[i].transform("t" + d.x + "," + (d.y - thisRadius - titelPath[i].getBBox().height/2 - 5));
            } else {
                titelPath[i].transform("t" + d.x + "," + (d.y - thisRadius - titelPath[i].getBBox().height/2 - 5)).attr({"text-anchor": "start"});
            }

            if (i < l - 1) {
                valuePath.push(canvas.text(d.x, d.y, d.value + "人").attr({'font-size': 12}));
            } else {
                valuePath.push(canvas.text(d.x, d.y, d.value + "人").attr({fill: "#ffffff", 'font-size': 12}));
            }
        }

        var n = 0;

        var node;
        var num = 0;

        var nodes = canvas.set();
        var path = [];
        var textpath = [];
        
        var tree = this;

    };
    

    Flow.prototype.render = function (options) {
        var st = new Date().getTime();
        if (!this.container) {
            throw new Error("Please specify which node to render.");
        }
        this.canvas.clear();
        this.setOptions(options);
        this.layout();
        var st2 = new Date().getTime();
        console.log(st2 - st);

        this.generatePaths();
        var et = new Date().getTime();
        console.log(et - st2);
        //this.canvas.renderfix();
    };

    module.exports = Flow;
});
