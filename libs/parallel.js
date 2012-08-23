/*global Raphael */
/*global d3 */
define(function (require, exports, module) {
    var DataV = require('datav');

    var Parallel = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Parallel";
            this.node = this.checkNode(node);
            this.defaults = {};
            
            // Properties
            this.allDimensions = [];
            this.dimensions = [];
            this.dimensionType = {};
            this.dimensionDomain = {};
            this.dimensionExtent = {};
    
            // Canvas
            this.defaults.width = 750;
            this.defaults.height = 500;
            this.defaults.marginWidth = [20,20,20,20];
            this.defaults.backgroundAttr = {"fill": "none", "stroke": "#ccc", "stroke-opacity": 0.4};
            this.defaults.foregroundAttr = {"fill": "none", "stroke": "steelblue", "stroke-opacity": 0.7};
            this.defaults.domainAttr = {"stroke": "#000"};
            this.defaults.tickAttr = {"stroke": "#000"};
            this.defaults.tickTextAttr = {};
            this.defaults.titleAttr ={};

            this.customEvent = {
                "brushstart": function(){},
                "brushend": function(){},
                "brush": function(){}
            };

            this.setOptions(options);
            this.createCanvas();
        }
    });

    Parallel.prototype.checkNode = function (node) {
        if (!node) {
            throw new Error("Please specify which node to render.");
        }
        if(typeof(node) === "string") {
            return document.getElementById(node);
        } else if (node.nodeName) {//DOM-element
            return node;
        }
        throw new Error("Please specify which node to render.");
    };

    Parallel.prototype.chooseDimensions = function (dimen) {
        var conf = this.defaults;
        this.dimensions = [];
        for (var i=0, l=dimen.length; i<l; i++) {
            if ($.inArray(dimen[i], this.allDimensions)) {
                this.dimensions.push(dimen[i]);
            }
        }
    };

    Parallel.prototype.setDimensionType = function (dimenType) {
        var conf = this.defaults,
            prop,
            type;
        if (dimenType) {
            for (prop in dimenType) {
                if (dimenType.hasOwnProperty(prop) && this.dimensionType[prop]) {
                    var type = dimenType[prop];
                    if (type !== "quantitative" && type !== "ordinal") {
                        throw new Error('Dimension type should be "quantitative" or "ordinal".');
                    }
                    if (this.dimensionType[prop] !== type) {
                        this.dimensionType[prop] = type;
                        this._setDefaultDimensionDomain(prop);
                    }
                }
            }
        }
    };

    Parallel.prototype.getDimensionExtents = function () {
        return $.extend({}, this.dimensionExtent);
    };

    Parallel.prototype.setDimensionExtent = function (dimenExtent) {
        var conf = this.defaults;
        var dimen, i, l, extent;
        var rebrushNeeded = false;
        var ordinalExtent = [];

        if (arguments.length === 0) {
            // clean all extent
            this.dimensionExtent = {};
        } else {
            for (prop in dimenExtent) {
                if (dimenExtent.hasOwnProperty(prop) && this.dimensionType[prop]) {
                    extent = dimenExtent[prop];
                    if (!(extent instanceof Array)) {
                        throw new Error("extent should be an array");
                    } else {
                        if (extent.length !== 2) {
                            throw new Error("extent should be an array with two items, for example: [num1, num2]");
                        } else if (this.dimensionType[prop] === "quantitative") {
                            this.dimensionExtent[prop] = extent;
                            rebrushNeeded = true;
                            if (this.brush) {
                                this.y[prop].brush.extent(extent);
                                this.y[prop].brush.refresh();
                            }
                        } else if (this.dimensionType[prop] === "ordinal") {
                            if (typeof this.dimensionDomain[prop].itemIndex[extent[0]] === 'undefined'
                                    || typeof this.dimensionDomain[prop].itemIndex[extent[1]] === 'undefined') {
                                throw new Error(prop + " does not have value: " + extent[0] + " or " + extent[1]); 
                            } else {
                                rebrushNeeded = true;
                                ordinalExtent = this._getOrdinalExtent(prop, extent);
                                this.dimensionExtent[prop] = extent;
                                if (this.brush) {
                                    this.y[prop].brush.extent(ordinalExtent);
                                    this.y[prop].brush.refresh();
                                }
                            }
                        }
                    }
                }
            }
            if (rebrushNeeded && this.brush) {
                this.brush();
            }
        }
    };

    Parallel.prototype.getDimensionTypes = function () {
        return $.extend({}, this.dimensionType);
    };

    Parallel.prototype.getDimensionDomains = function () {
        return $.extend({}, this.dimensionDomain);
    };

    Parallel.prototype._setOrdinalDomain = function (a) {
        var uniq = [];
        var index = {};
        var i = -1, n = a.length, ai;
        while (++i < n) {
            if (typeof index[ai = a[i]] === 'undefined') {
                index[ai] = uniq.push(ai) - 1;
            }
        }
        uniq.itemIndex = index;
        return uniq;
    };

    Parallel.prototype._setDefaultDimensionDomain = function (dimen) {
        var conf = this.defaults;
        if(this.dimensionType[dimen] === "quantitative"){
            this.dimensionDomain[dimen] = d3.extent(this.source, function(p){return +p[dimen]});
        } else {
            this.dimensionDomain[dimen] = this._setOrdinalDomain(this.source.map(function(p){return p[dimen]}));
        }
    };

    //quant or ordinal different
    Parallel.prototype.setDimensionDomain = function (dimenDomain) {
        //set default dimensionDomain, extent for quantitative type, item array for ordinal type
        var conf = this.defaults;
        var dimen, i, l, domain;

        if (arguments.length === 0) {
            for (i = 0, l = this.allDimensions.length; i < l; i++) {
                dimen = this.allDimensions[i];
                this._setDefaultDimensionDomain(dimen);
            }
        } else {
            for (prop in dimenDomain) {
                if (dimenDomain.hasOwnProperty(prop) && this.dimensionType[prop]) {
                    domain = dimenDomain[prop];
                    if (!(domain instanceof Array)) {
                        throw new Error("domain should be an array");
                    } else {
                        if (this.dimensionType[prop] === "quantitative" && domain.length !== 2) {
                            throw new Error("quantitative's domain should be an array with two items, for example: [num1, num2]");
                        }
                        if (this.dimensionType[prop] === "quantitative") {
                            this.dimensionDomain[prop] = domain;
                        } else if (this.dimensionType[prop] === "ordinal") {
                            this.dimensionDomain[prop] = this._setOrdinalDomain(domain);
                        }
                    }
                }
            }
        }
    };

    Parallel.prototype.on = function (eventName, callback) {
        if (eventName === "brushstart") {
            this.customEvent["brushstart"] = callback;
        } else if (eventName === "brushend") {
            this.customEvent["brushend"] = callback;
        } else if (eventName === "brush") {
            this.customEvent["brush"] = callback;
        }
    };

    Parallel.prototype.setOptions = function (options) {
        var prop;
        if (options) {
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }
    };

    Parallel.prototype.setSource = function (source) {
        //source is 2-dimension array

        var conf = this.defaults;
        this.allDimensions = source[0];

        //by default all dimensions show
        this.dimensions = source[0];

        //this.source is array of line; key is dimension, value is line's value in that dimension 
        this.source = [];
        for(var i=1, l=source.length; i<l; i++){
            var line = {},
                dimen = this.allDimensions;
            for(var j=0, ll=dimen.length; j<ll; j++){
                line[dimen[j]] = source[i][j];
            }
            this.source.push(line);
        }

        //judge dimesions type auto
        //if all number, quantitative else ordinal    
        this.dimensionType = {};
        function isNumber(n) {
            // http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
        for(var i=0, l=this.allDimensions.length; i<l; i++){
            var type = "quantitative";
            for(var j=1, ll=source.length; j<ll; j++){
                var d = source[j][i];
                if(d && (! isNumber(d))){
                    type = "ordinal";
                    break;
                }
            }
            this.dimensionType[this.allDimensions[i]] = type;
        }

        this.setDimensionDomain();

    };

    Parallel.prototype.layout = function () {
        //create x and y dimensions
        var conf = this.defaults,
            domain,
            i,
            j,
            l,
            ll,
            domain;
        
        var m = conf.marginWidth,
            w = conf.width - m[1] - m[3],
            h = conf.height - m[0] - m[2];

        this.x = d3.scale.ordinal().rangePoints([0, w], 1),
        this.y = {};
        this.y2 = {};

        this.x.domain(this.dimensions);
        for(i=0, l=this.dimensions.length; i<l; i++){
            var dimen = this.dimensions[i];
            if(this.dimensionType[dimen] === "quantitative"){
                this.y[dimen] = d3.scale.linear()
                .domain(this.dimensionDomain[dimen])
                .range([h + m[0], m[0]]);
                this.y2[dimen] = d3.scale.linear()
                .domain(this.dimensionDomain[dimen])
                .range([h + m[0], m[0]]);
            }else{
                this.y[dimen] = d3.scale.ordinal()
                .domain(this.dimensionDomain[dimen])
                .rangeBands([h + m[0], m[0]]);
                this.y2[dimen] = d3.scale.linear()
                .domain([0, this.dimensionDomain[dimen].length])
                .range([h + m[0], m[0]]);
            }
        }
    };

    Parallel.prototype.generatePaths = function () {
        var conf = this.defaults;
        var axis = DataV.Axis().orient("left");

        var m = conf.marginWidth;

        var paper = this.canvas;

        this.bg = paper.set();
        for (var i=0, l=this.source.length; i<l; i++) {
            var line = this.source[i];
            this.bg.push(paper.path(this.path(line)));
        }
        this.bg.attr(conf.backgroundAttr).attr({transform: "t" + m[3] + ',0'});
        
        this.fg = paper.set();
        for (var i=0, l=this.source.length; i<l; i++) {
            var line = this.source[i];
            this.fg.push(paper.path(this.path(line)));
        }
        this.fg.attr(conf.foregroundAttr).attr({transform: "t" + m[3] + ',0'});

        var dimensions = this.dimensions;
        
        for(var i=0, l=dimensions.length; i<l; i++){
            var ax=axis.scale(this.y[dimensions[i]])(paper);
            ax.push(paper.text(0, m[0] - 12, dimensions[i]).attr({"text-anchor": "middle"}));
            ax.attr({transform: "t" + (m[3] + this.x.range()[i] ) + ',0'});
        }

        var xInterval = Math.min(this.x.range()[1] - this.x.range()[0] - 20, 16);
        var brushs = [];

        this.statistic = {};
        this.statistic["selected"] = 0;
        this.statistic["all"] = this.source.length;
        this.statistic["items"] = {};
        var that = this;
        this.brush = function() {
                var statistic = that.statistic;
                var dimensionExtents = that.dimensionExtent;
                var actives = that.dimensions.filter(function(p) {
                        var empty = that.y[p].brush.empty();
                        if (empty) {
                            statistic.items[p] = -1;
                            dimensionExtents[p] = undefined;
                        } else {
                            statistic.items[p] = 0;
                        }
                        return !empty;
                    }),
                    extents = actives.map(function(p) {
                            var extent = that.y[p].brush.extent();
                            if (that.dimensionType[p] === "quantitative") {
                                that.dimensionExtent[p] = extent;
                            } else {
                                that.dimensionExtent[p] = [
                                    that.dimensionDomain[p][Math.ceil(extent[0] - 0.5)],
                                    that.dimensionDomain[p][Math.floor(extent[1] - 0.5)]
                                ];
                            }
                            return extent;
                        });
                var i, j, l, ll, p;
                var d, value, inExtent, selected;
                //var brush, dimen;

                statistic["selected"] = 0;
                
                for (j=0, l=that.fg.length; j<l; j++) {
                    d = that.source[j];
                    selected = true;
                    for (i = 0, ll = actives.length; i < ll; i++) {
                        p = actives[i];
                        value = that.dimensionType[p] === "quantitative" ?
                                d[p] : that.dimensionDomain[p].itemIndex[d[p]] + 0.5;
                        inExtent = extents[i][0] <= value && value <= extents[i][1];
                        if (inExtent) { statistic.items[p] += 1;}
                        if (!inExtent) {selected = false;}
                    }
                    if (selected) {
                        statistic["selected"] += 1;
                        that.fg[j].attr({"stroke": "steelblue"});
                    } else {
                        that.fg[j].attr({"stroke": "none"});
                    }
                }

                /*
                //set extent;
                brush = d3.event.target;
                dimen = brush.dimension;
                */

                that.customEvent["brush"].call(that);
            },
            brushstart = function () {
                that.customEvent["brushstart"].call(that);
            },
            brushend = function () {
                that.customEvent["brushend"].call(that);
            };

        var b, start, end, temp;

        for (var i=0, l=dimensions.length; i<l; i++) {
            dimen = dimensions[i];
            b = DataV.Brush().y(this.y2[dimen])
                .left(m[3] + this.x.range()[i] - xInterval/2)
                .width(xInterval)
                .backgroundAttr({"opacity": 0, "fill": "white"})
                .foregroundAttr({"opacity": 0.5, "fill": "gray"})
                .on("brushstart", brushstart)
                .on("brush", this.brush)
                .on("brushend", brushend);
            if (typeof this.dimensionExtent[dimen] !== 'undefined') {
                if (this.dimensionType[dimen] === "quantitative") {
                    b.extent(this.dimensionExtent[dimen]);
                } else {
                    /*
                    start = this.dimensionDomain[dimen].itemIndex[this.dimensionExtent[dimen][0]];
                    end = this.dimensionDomain[dimen].itemIndex[this.dimensionExtent[dimen][1]];
                    if (start > end) {
                        temp = start;
                        start = end;
                        end = temp;
                    }
                    start = Math.max(0, start + 0.5 - 0.5);
                    end = Math.min(this.dimensionDomain[dimen].length, end + 0.5 + 0.5);
                    b.extent([start, end]);
                    */
                    b.extent(this._getOrdinalExtent(dimen, this.dimensionExtent[dimen]));
                }
            }

            this.y[dimen].brush = b(paper);
            //this.y[dimensions[i]].brush.dimension = dimensions[i];
        }
        if (!$.isEmptyObject(this.dimensionExtent)) {
            this.brush();
        }
    };

    Parallel.prototype._getOrdinalExtent = function (dimen, stringArray) {
        start = this.dimensionDomain[dimen].itemIndex[stringArray[0]];
        end = this.dimensionDomain[dimen].itemIndex[stringArray[1]];
        if (start > end) {
            temp = start;
            start = end;
            end = temp;
        }
        start = Math.max(0, start + 0.5 - 0.5);
        end = Math.min(this.dimensionDomain[dimen].length, end + 0.5 + 0.5);
        return [start, end];
    };

    Parallel.prototype.createCanvas = function () {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }

        var conf = this.defaults;
        this.node.style.position = "relative";
        this.canvas = Raphael(this.node, conf.width, conf.height);

        //console.log(this.canvas);
    };

    Parallel.prototype.getColor = function (colorJson) {
        var colorM = DataV.getColor();
        var color;
        var colorStyle = colorJson ? colorJson : {};
        var colorMode = colorStyle.mode ? colorStyle.mode : 'default';
        switch (colorMode){
            case "gradient":
                var index = colorJson.index ? colorJson.index : 0;
                index = index <0 ? 0 : (index>colorM.length-1 ? colorM.length-1 : index);
                color = d3.interpolateRgb.apply(null, [colorM[index][0],colorM[index][1]]);
                break;
            case "random":
            case "default":
                var ratio = colorStyle.ratio ? colorStyle.ratio : 0;
                if(ratio <0 ){ratio=0;}
                if(ratio > 1) { ratio =1;}
                var colorArray =[];
                for (var i=0, l=colorM.length; i<l; i++) {
                    var colorFunc = d3.interpolateRgb.apply(null, [colorM[i][0],colorM[i][1]]);
                    colorArray[colorArray.length]=colorFunc(ratio);
                }
                color = d3.scale.ordinal().range(colorArray);
                break;
        }
        return color;
    };

    Parallel.prototype.render = function (options) {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        this.setOptions(options);
        this.layout();
        this.generatePaths();
    };

    Parallel.prototype.path = function (d) {
        var line = d3.svg.line();
        var conf = this.defaults;
        var y = this.y;
        var x = this.x;
        var dimensions = this.dimensions;
        var dimensionType = this.dimensionType;
        return line(dimensions.map(function(p) {
            var yLoc = y[p](d[p]);
            if(dimensionType[p] === "ordinal"){
                yLoc +=  y[p].rangeBand()/2;
            }
            return [x(p), yLoc];
        }));
    };

    module.exports = Parallel;
});
