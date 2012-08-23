/*global Raphael */
/*global d3, $ */
/*global define*/
define(function (require, exports, module) {
    var DataV = require('datav');
    /*
     * return true if input is number, or return false
     */
    var isNumber = function (n) {
        // http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    /*
     * constructor
     * @param node the dom node or dom node Id
     *        options options json object for determin stream style.
     * @example
     * create stream in a dom node with id "chart", width is 500; height is 600px;
     * "chart", {"width": 500, "height": 600}
     */
    var Stream = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Stream";
            this.node = this.checkNode(node);
    
            this.level = 0;
    
            this.defaults = {};
            // Properties
            this.defaults.offset = "zero";//"expand";
            this.defaults.order = "default";
            this.defaults.columnNameUsed = "auto";
            this.defaults.rowNameUsed = "auto";
            this.defaults.topInterval = 0;
            this.defaults.bottomInterval = 0;
            this.defaults.legend = true;
            this.defaults.axis = true;
            this.defaults.pathLabel = true;
            this.defaults.fontSize = 12;
            this.defaults.heightWidthRatio = 0.618;
            //this.defaults.axisTickNumber = 8; // axis ticks number
    
            this.defaults.indexMargin = 3; // if dates.length < indexMargin * 2 + 1, do not show label
    
            this.userConfig = {"more": true, "max": 20, "other": 0.1};

            this.timeRange = [];
            // Canvas
            this.defaults.width = 750;
            this.defaults.height = 360;
            this.defaults.totalWidth = 820; 
            this.defaults.naviBackWidth = 80;
            this.defaults.legendHeight = 50;
            this.defaults.legendWidth = 150;
            this.defaults.legendIndent = 21;
            this.defaults.axisHeight = 30;
            this.defaults.margin = [0, 40, 0, 40];

            this.defaults.customEventHandle = {"mousemove": null};
    
            //test related
            this.defaults.testMakeup = false;
            this.defaults.testDays = 30;
            this.defaults.testDataType = 0; //0: random; 1: false random; 2: same; >2: small change;
    
            this.setOptions(options);
            this.createCanvas();
        }
    });

    Stream.prototype.checkNode = function (node) {
        if (!node) {
            throw new Error("Please specify which node to render.");
        }
        if (typeof node === "string") {
            return document.getElementById(node);
        } else if (node.nodeName) {//DOM-element
            return node;
        }
        throw new Error("Please specify which node to render.");
    };

    Stream.prototype.createCanvas = function () {
        var conf = this.defaults,
            canvasFatherContainer = document.createElement("div"),
            coverStyle,
            naviStyle,
            naviTraceStyle,
            naviBackStyle,
            percentageStyle,
            axisStyle,
            brushStyle,
            getBack;

        this.node.style.position = "relative";
        this.node.style.width = conf.totalWidth + "px";

		this.legend = document.createElement("div");
        //this.legendPaper = new Raphael(this.legend, conf.legendWidth - conf.legendIndent, 500);
        $(this.legend).css({"overflow": "hidden",
                            "width": conf.legendWidth - conf.legendIndent + "px",
                            "padding": "10px 0 10px 0"
                            });
        /*
		legendStyle = this.legend.style;
        legendStyle.overflow = "hidden";
        legendStyle.width = conf.legendWidth - conf.legendIndent + "px";
        */

        //legendStyle.backgroundColor = "#f4f4f4";
        //legendStyle.borderWidth = "1px";
        //legendStyle.borderStyle = "solid";
		//legendStyle.width = conf.totalWidth + "px";

        this.navi = document.createElement("div");
        $(this.navi).css({
            //"width": conf.totalWidth + "px",
            "border-top": "1px solid #ddd",
            "border-bottom": "1px solid #ddd",
            //"height": "22px",
            "padding-top": "5px",
            "padding-bottom": "10px",
            "padding-left": "10px",
            "padding-right": "10px",
            "font": (conf.fontSize + 1) + "px 宋体"
        });
        this.naviTrace = document.createElement("div");
        $(this.naviTrace).css({
            "width": conf.totalWidth - conf.naviBackWidth - 50 + "px",
            "margin-top": "5px"
        });
        /*
        naviTraceStyle = this.naviTrace.style;
        naviTraceStyle.width = conf.totalWidth - conf.naviBackWidth - 50 + "px";
        */
        this.naviBack = document.createElement("div");
        this.naviBack.innerHTML = "返回上层";
        $(this.naviBack).css({
            "width": conf.naviBackWidth + "px",
            "float": "right",
            "background-color": "#f4f4f4",
            "padding-top": "4px",
            "padding-bottom": "4px",
            "border": "1px solid #ddd",
            "border-radius": "2px",
            "cursor": "pointer",
            "text-align": "center",
            "visibility": "hidden"
        });
        //naviBackStyle.float = "right";
        //naviBackStyle.visibility = "hidden";
        this.navi.appendChild(this.naviBack);
        this.navi.appendChild(this.naviTrace);

        this.percentage = document.createElement("div");
        if (this.userConfig.more) {
            this.percentagePaper = new Raphael(this.percentage, conf.margin[3], conf.height);
        }
        percentageStyle = this.percentage.style;
        percentageStyle.width = conf.margin[3] + "px";
        percentageStyle.height = conf.height + "px";
        $(this.percentage).css({
            "float": "left",
            "margin-bottom": "0px",
            "border-bottom": "0px",
            "padding-bottom": "0px"
        });

        this.canvasContainer = document.createElement("div");
        $(this.canvasContainer).css({
            "float": "left",
            "width": conf.width + "px",
            "margin-bottom": "0px",
            "border-bottom": "0px",
            "padding-bottom": "0px"
        })
            .append($(canvasFatherContainer).css({"position": "relative"}));
        this.canvas = new Raphael(canvasFatherContainer, conf.width, conf.height);
        $(this.canvasContainer).height(conf.height);

        /*
        this.floatTag = $("<div/>").css({
            "border": "2px solid white",
            "background-color": $.browser.msie ? "rgb(0, 0, 0)" : "rgba(0, 0, 0, 0.6)",
            "color": "white",
            "border-radius": "6px",
            "padding": "8px",
            "line-height": "170%",
            //"opacity": 0.7,
            "font-size": conf.fontSize + "px",
            "font-familiy": "微软雅黑",

            "visibility": "hidden",
            "position": "absolute"
        });
        */
        this.floatTag = DataV.FloatTag()(canvasFatherContainer);
        this.floatTag.css({"visibility": "hidden"});

        // cover can block stream canvas when animating to prevent some default mouse event
        this.cover = document.createElement("div");
        coverStyle = this.cover.style;
        coverStyle.position = "absolute";
        coverStyle.width = conf.width + "px";
        coverStyle.height = conf.height + "px";
        coverStyle.zIndex = 100;
        coverStyle.visibility = "hidden";
        $(this.cover).bind("mousemove", {stream: this}, function (e) {
            var stream = e.data.stream;
            stream.coverMouse = {x: e.pageX, y: e.pageY};
        });
        $(this.cover).bind("mouseleave", {stream: this}, function (e) {
            var stream = e.data.stream;
            stream.coverMouse = undefined;
        });
        
        this.axis = document.createElement("div");
        this.axisPaper = new Raphael(this.axis, conf.totalWidth - conf.legendWidth, conf.axisHeight);
        //axisStyle = this.axis.style;
        $(this.axis).css({
            "margin-top": "0px",
            "border-top": "1px solid #ddd",
            "height": conf.axisHeight + "px"
        });

        this.leftContainer = document.createElement("div");
        this.rightContainer = document.createElement("div");

        this.leftContainer.appendChild(this.legend);

        this.rightContainer.appendChild(this.navi);
        this.middleContainer = document.createElement("div");
        $(this.middleContainer).css("height", conf.height);
        this.middleContainer.appendChild(this.percentage);
        this.middleContainer.appendChild(this.canvasContainer);
        this.middleContainer.appendChild(this.cover);
        $(this.canvasFatherContainer).append(this.floatTag);
        this.rightContainer.appendChild(this.middleContainer);
        this.rightContainer.appendChild(this.axis);

        this.node.appendChild(this.rightContainer);
        this.node.appendChild(this.leftContainer);
        $(this.rightContainer).css({"float": "right",
                                    //"border": "solid 1px",
                                    "width": conf.totalWidth - conf.legendWidth
                                    });
        $(this.leftContainer).css({ "width": conf.legendWidth - 4 + "px",
                                    //"float": "left",
                                    //"border": "solid 1px",
                                    //"margin-left": "-5px",
                                    //"height": 300,
                                    //"max-height": 300,
                                    //"overflow-y": "scroll",
                                    "overflow-x": "hidden"
                                    });

        /*
        this.node.appendChild(this.percentage);
        this.node.appendChild(this.canvasContainer);
        this.node.appendChild(this.floatTag);
        this.node.appendChild(this.cover);
        this.node.appendChild(this.axis);
        */

        getBack = function (stream) {
            stream.cover.style.visibility = "visible";
            stream.coverMouse = undefined;
            stream.getLevelSource();
            stream.reRender();

            //hidden
            stream.indicatorLine.attr({"stroke": "none"});
            stream.highlightLine.attr({"stroke": "none"});
            stream.floatTag.css({"visibility" : "hidden"});

            stream.paths.forEach(function (d, i, array) {
                d.attr({transform: "s1,0.001,0,0"});
                d.label.hide();
                d.animate({transform: "t0,0"}, 750, "linear", function () {
                    stream.cover.style.visibility = "hidden";
                    if (typeof stream.coverMouse !== 'undefined') {
                        stream.indicatorLine.attr({"stroke": "#000"});
                        stream.highlightLine.attr({"stroke": "white"});
                        stream.floatTag.css({"visibility" : "visible"});
                        $(stream.canvas.canvas).trigger("mousemove", 
                            [stream.coverMouse.x, stream.coverMouse.y]);
                        stream.coverMouse = undefined;
                    }
                    if (d.labelLoc.showLabel) {
                        d.label.show();
                    }
                });
            });
        };
        $(this.naviTrace).on("click", ".navi", {stream: this}, function (e) {
            var stream = e.data.stream;
            stream.level = e.target.data.level;
            getBack(stream);
        });

        $(this.naviBack).on("click", {stream: this}, function (e) {
            var stream = e.data.stream;
            stream.level -= 1;
            getBack(stream);
        });
    };

    Stream.prototype.setOptions = function (options) {
        var prop;
        if (options) {
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }

        if (options.width) {
            this.defaults.totalWidth = this.defaults.width;
            this.defaults.width = this.defaults.totalWidth - this.defaults.margin[1]
                - this.defaults.margin[3] - this.defaults.legendWidth;
        }
        if (options.width && !options.height) {
            this.defaults.autoHeight = true;
            this.defaults.height = this.defaults.width * this.defaults.heightWidthRatio;
        } else if (options.width && options.height) {
            this.defaults.autoHeight = false;
        }
    };

    Stream.prototype.setUserConfig = function (userConfig) {
        this.userConfig = userConfig;
        var prop;
        if (userConfig) {
            for (prop in userConfig) {
                if (userConfig.hasOwnProperty(prop)) {
                    this.defaults[prop] = userConfig[prop];
                }
            }
        }
    };

    /*
     * @param source The data source.
     * @example 
     * // 例如下面的数组表示2个人在一年4个季度的消费。第一个人在4个季度里消费了1、2、3、9元。第二个人消费了3、4、6、3元。
     * [
     *  [1,2,3,9],
     *  [3,4,6,3]
     * ]
     */

    /*
    Stream.prototype.sourceChange = function (source) {
        var conf = this.defaults;
        var i, l;
        var inc = 0;//0.000001;
        var days = conf.testDays;

        var id;
        var infos = [];
        var info = [];
        var newSource = [];
        var values = [];
        var that = this;

        var makeupData = function (values, info) {
            //var r = [-0.2, 0.2, 0.5, 0.2, -0.5, -0.2, -0.0, 0.4, 0.1, -0.5];
            var r = [0.2, 0.8, 0.5, 0.2, 0.7, 0.9, 1.0, 0.4, 0.5, 0.7];
            var i;
            for (i = 0; i < days - 2; i++) {
                if (conf.testDataType === 0) { 
                    values[i + 2] = (values[i + 1] + inc) * ((Math.random() - 0.5) * 0.6 + 1);
                } else if (conf.testDataType === 1) { 
                    values[i + 2] = (values[i + 1] + inc) * (r[i % r.length] * 0.6 + 0.7);
                } else if (conf.testDataType === 2) { 
                    values[i + 2] = values[i + 1];// + 0.001 * (Math.random() - 0.5);
                } else {
                    values[i + 2] = values[i + 1] + 0.001 * (Math.random() - 0.5);
                }

                //values[i+2] = (values[i+1]+inc)*((Math.random() - 0.5)*0.6+1);
                //values[i+2] = (values[i+1]+inc)*(r[i%(r.length)]*0.6+0.7);
                //values[i+2] = values[i+1];// + 0.001 * (Math.random() - 0.5);
                //values[i+2] = values[i+1] + 0.001 * (Math.random() - 0.5);
                info[i + 2] = info[1];
            }
        };
        var makeupDate = function () {
            var dates = [];
            var format = d3.time.format("%Y-%m-%d");
            var date = format.parse(source[0].date); // returns a Date
            var time = +date; // convert a Date object to time in milliseconds
            for (i = 0; i < days; i++) {
                dates.push(format(date));
                time += 1000 * 60 * 60 * 24; // milliseconds in a day
                date = new Date(time);
            }
            //this.dates = dates;
            return dates;
        };

        var getMergeMoreTotal = function (idx) {
            var i, l;
            var d, id;
            var total = 0;
            for (i = idx, l = source.length; i < l; i++) {
                d = source[i];
                if (d.id !== id) {
                    total += d.total;
                }
                id = d.id;
            }
            return total;
        };

        var mergeMoreItem = function (values, infos, total) {
            var i, j, l, ll;
            var columnTotal = [];
            var info = [];
            var totalSum = getMergeMoreTotal(0);
            for (i = 0, l = values.length; i < l; i++) {
                for (j = 0, ll = values[i].length; j < ll; j++) {
                    if (i === 0) {
                        columnTotal[j] = values[i][j];
                    } else {
                        columnTotal[j] += values[i][j];
                    }
                    if (i === l - 1) {
                        columnTotal[j] = totalSum - columnTotal[j];
                    }
                }
            }
            values.push(columnTotal);
            for (i = 0, l = columnTotal.length; i < l; i++) {
                info[i] = {
                    "date": that.date[i],
                    "id": -2,// -1 clickable; -2 not click
                    "name": "其他" + that.userConfig.type,
                    "tip": "<b>其他" + that.userConfig.type + "</b><br/>占比:"
                        + (Math.round(columnTotal[i] * 10000) / 100) + "%<br/>",
                    "total": total,
                    "value": columnTotal[i]
                };
            }
            infos.push(info);
        };    

        source.forEach(function (d, i) {
            d.index = i;
        });

        source.sort(function (a, b) {
            if (b.total - a.total > 0) {
                return 1;
            } else if (b.total - a.total < 0) {
                return -1;
            } else {
                if (b.id === a.id) {
                    return b.index > a.index ?  -1 : 1;
                } else {
                    return parseInt(a.id, 10) - parseInt(b.id, 10);
                }
            }
        });

        this.date = conf.testMakeup ? makeupDate() : conf.date;

        var sumTotal = 0;
        var singleLength = -1;

        for (i = 0, l = source.length; i < l; i++) {
            var d = source[i];
            if (d.id !== id) {
                if (singleLength === -1 && i > 0) {
                    singleLength = i;
                }
                id = d.id;
                if (newSource.length > 0
                        && newSource.length % (this.userConfig.max - 1) === 0
                        && sumTotal >= 1 - this.userConfig.other
                        && l !== (newSource.length + 1) * singleLength) {
                    //mergeMoreItem(newSource, infos, 1 - sumTotal); 
                    mergeMoreItem(newSource, infos, getMergeMoreTotal(i)); 
                    break;
                }
                sumTotal += d.total;
                newSource.push(values = []);
                infos.push(info = []);
            }

            values.push(d.value);
            info.push($.extend({}, d));
            if (conf.testMakeup && values.length === 2) {
                makeupData(values, info);
            }
        }
        this.allInfos = infos;

        return newSource;
    };
    */

    Stream.prototype.hasRowName = function () {
        var i,
            l,
            firstColumn = [],
            source = this.rawData;

        if ((typeof this.defaults.rowNameUsed) === "boolean") {
            return this.defaults.rowNameUsed;
        }
        //first column from 2nd row
        for (i = 1, l = source.length; i < l; i++) {
            firstColumn[i] = source[i][0];
        }
        return !firstColumn.every(isNumber);
    };

    Stream.prototype.hasColumnName = function () {
        var firstRow;
        if ((typeof this.defaults.columnNameUsed) === "boolean") {
            return this.defaults.columnNameUsed;
        }
        //first row from 2nd column
        firstRow = this.rawData[0].slice(1);
        return !firstRow.every(isNumber);
    };

    Stream.prototype.sort = function (source) {
        var i, j, l, ll;
        var rowSum = [];
        var columnSum = [];
        var newSource = [];
        var rowName = [];
        var that = this;

        for (j = 0, ll = source[0].length; j < ll; j++) {
            columnSum[j] = 0;
        }

        for (i = 0, l = source.length; i < l; i++) {
            rowSum[i] = 0;
            for (j = 0, ll = source[0].length; j < ll; j++) {
                rowSum[i] += source[i][j];
                columnSum[j] += source[i][j];
            }
            rowSum[i] = [rowSum[i]];
            rowSum[i].index = i;
        }

        rowSum.sort(function (a, b) {
            return b[0] - a[0];
        });

        rowSum.forEach(function (d, i) {
            newSource[i] = source[d.index];
			if (that.rowName) {
                rowName[i] = that.rowName[d.index];
			}
        });

        for (i = 0, l = rowSum.length; i < l; i++) {
            rowSum[i] = rowSum[i][0];
        }

        //this.mergeOthe

		this.rowName = rowName;
        this.rowSum = rowSum;
        this.columnSum = columnSum;
        this.total = d3.sum(this.rowSum);

        return newSource;
    };

    Stream.prototype.mergeOther = function (source) {
        //change digitData, rowSum, rowName;
    };

    Stream.prototype.getDigitData = function (source) {
		//get first column name, row name and digitData;
        var conf = this.defaults,
            firstRow = source[0],
            firstColumn,
            digitData;

        var i, j, l, ll;

        firstColumn = source.map(function (d) {
            return d[0];
        });

        if (this.hasRowName()) {
            if (this.hasColumnName()) {
                //row names, column names
                this.rowName = firstColumn.slice(1);
                this.columnName = firstRow.slice(1);
                digitData = source.map(function (d) {
                    return d.slice(1);
                }).slice(1);
            } else {
                //row names, no column names
                this.rowName = firstColumn;
                this.columnName = undefined;
                digitData = source.map(function (d) {
                    return d.slice(1);
                });
            }
        } else {
            if (this.hasColumnName()) {
                //no row names, column names
                this.rowName = undefined;
                this.columnName = firstRow;
                digitData = source.slice(1);
            } else {
                //no row names, no column names
                if (conf.columnNameUsed === "auto" && conf.rowNameUsed === "auto" && !isNumber(source[0][0])) {
                    throw new Error("Please specify whether there are column names or row names"); 
                }
                this.rowName = undefined;
                this.columnName = undefined;
                digitData = source;
            }
        }
        for (i = 0, l = digitData.length; i < l; i++) {
            for (j = 0, ll = digitData[0].length; j < ll; j++) {
                digitData[i][j] = parseFloat(digitData[i][j]);
            }
        }
		return digitData;
    };

    Stream.prototype.getInfo = function () {
		var allInfos = [];
		var i, j, l, ll;
		var infos, info;
        var column;
        var digitData = this.digitData;
        var descending = function (a, b) {
                return b.value - a.value;
            }; 
		for (i = 0, l = this.digitData.length; i < l; i++) {
			infos = allInfos[i] = [];
			infos.ratio = this.rowSum[i] / this.total;
			infos.value = this.rowSum[i];
			infos.name = this.rowName[i];
			infos.id = i;
		}
        for (i = 0, l = digitData.length; i < l; i++) {
            column = [];
            for (j = 0, ll = digitData[0].length; j < ll; j++) {
                allInfos[i][j] = column[j] = {
                    /********************/
                    "date": this.columnName[j],
                    "id": i,
                    "name": allInfos[i].name,
                    "tip": "<b>" + allInfos[i].name + "</b><br/>占比:"
                        + (Math.round(digitData[i][j] / this.columnSum[j] * 10000) / 100) + "%<br/>",
                    "total": allInfos[i].ratio,
                    //"value": columnTotal[i]
                    /*****************/
                    "value" : digitData[i][j],
                    "index" : j,
                    "rowInfo" : allInfos[i],
                    "ratio" : digitData[i][j] / this.columnSum[j]
                };
            }

            column.sort(descending);

            for (j = 0, ll = column.length; j < ll; j++) {
                column[j].rank = j;
            }
        }
        return allInfos;
	};

    Stream.prototype.setSource = function (source) {
        /*
        var newSource = this.sourceChange(source);
        var conf = this.defaults,
            firstRow = source[0],
            firstColumn,
            digitData,
            i,
            l;
        */
        this.rawData = source;
		this.digitData = this.getDigitData(this.rawData);

        //get date, sort and allInfos;
        //date
        this.date = source[0].slice(1, source[0].length);
        this.timeRange = [0, this.date.length - 1];
        //sort
        this.digitData = this.sort(this.digitData);
        //merge other
        /*
        if (this.userConfig.more && this.userConfig.other > 0) {
            this.digitData = this.mergeOther(this.digitData);
        }
        */
		//allInfos;
		this.allInfos = this.getInfo(this.digitData);

        this.level = 0;
        this.getLevelSource();
        //this.source = this.remapSource(digitData);
        this.canAnimate = false;
    };

    //if useSting is true, start and end are date string, else start and end are index number;
    Stream.prototype.setTimeRange = function (start, end, useString) {
        var findIndex = function (arr, value) {
            var ctr = "";
            var i;
            for (i = 0; i < arr.length; i++) {
                // use === to check for Matches. ie., identical (===), ;
                if (arr[i] === value) {
                    return i;
                }
            }
            return ctr;
        };
        
        var idx1, idx2, temp;
        if (useString) {
            idx1 = findIndex(this.date, start);
            if (idx1 === "") {
                throw new Error(start + " is not found");
            }
            idx2 = findIndex(this.date, end);
            if (idx2 === "") {
                throw new Error(end + " is not found");
            }
        } else {
            idx1 = start;
            idx2 = end;
        }
        if (idx1 > idx2) {
            temp = idx1;
            idx1 = idx2;
            idx2 = temp;
        }
        if (idx1 === idx2) {
            throw new Error("start index and end index can not be same.");
        }
        if (idx2 > this.date.length - 1) {
            throw new Error("start index or end index is beyond the time range.");
        }
        this.timeRange = [idx1, idx2];
        this.getLevelSource();
    };

    Stream.prototype.getDataByTimeRange = function () {
        if (this.timeRange[0] === 0 && this.timeRange[1] === this.date.length - 1) {
            return this.digitData;
        } else {
            var data = [];
            var tr = this.timeRange;
            this.digitData.forEach(function (d, i) {
                data[i] = d.slice(tr[0], tr[1] + 1);
            });
            return data;
        }
    };

    Stream.prototype.getLevelSource = function () {
        var data = this.getDataByTimeRange(),//this.digitData,
            rowStart = this.level * (this.userConfig.max - 1),
            rowEnd,
            needMoreRow,
            column = data[0].length,
            remap = [],
            i,
            j,
            k,
            m,
            moreRow,
            moreSum,
            totalSum,
            infos = [],
            moreRowInfo = [];

        if (column < 1) {
            throw new Error("Data source is empty.");
        }
        if (this.userConfig.more) {
            if (rowStart + this.userConfig.max >= data.length) {
                if (rowStart + this.userConfig.max === data.length && this.allInfos[data.length - 1][0].id === -2) {
                    //last more sum < this.userConfig.other
                    rowEnd = rowStart + this.userConfig.max - 1;
                    needMoreRow = true;
                } else {
                    rowEnd = data.length;
                    needMoreRow = false;
                }
            } else {
                rowEnd = rowStart + this.userConfig.max - 1;
                needMoreRow = true;
            }
        } else {
            rowStart = 0;
            rowEnd = data.length;
            needMoreRow = false;
        }
        for (i = rowStart; i < rowEnd; i++) {
            k = i - rowStart;
            remap[k] = [];
            for (j = 0; j < column; j++) {
                remap[k][j] = {};
                remap[k][j].x =  j;
                remap[k][j].y =  parseFloat(data[i][j]);
            }
            if (this.timeRange[0] === 0 && this.timeRange[1] === this.date.length - 1) {
                infos[k] = this.allInfos[i];
            } else {
                infos[k] = this.allInfos[i].slice(this.timeRange[0], this.timeRange[1] + 1);
            }
        }
        if (needMoreRow) {
            if (rowStart + this.userConfig.max === data.length && this.allInfos[data.length - 1][0].id === -2) {
                //last more sum < this.userConfig.other
                var valueArray = data[data.length - 1];
                moreRow = [];
                for (j = 0; j < column; j++) {
                    moreRow[j] = {};
                    moreRow[j].x =  j;
                    moreRow[j].y =  valueArray[j];
                }
                moreRowInfo = this.allInfos[data.length - 1];
            } else {
                moreRow = [];
                for (j = 0; j < column; j++) {
                    moreSum = 0;
                    totalSum = 0;
                    for (m = data.length - 1; m >= rowEnd; m--) {
                        moreSum += parseFloat(data[m][j]);
                        totalSum += parseFloat(this.allInfos[m][j].total);
                    }
                    moreRow[j] = {};
                    moreRow[j].x =  j;
                    moreRow[j].y =  moreSum;
                    moreRowInfo[j] = {
                        "date": this.allInfos[0][j].date,
                        "id": -1,// -1 clickable; -2 not click
                        "name": "更多",
                        "tip": "<b>更多</b><br/>占比:" + (Math.round(moreSum * 10000) / 100) + "%<br/>点击查看更多信息<br/>",
                        "total": totalSum,
                        "value": moreSum
                    };
                }
            }
            remap = [moreRow].concat(remap);
            infos = [moreRowInfo].concat(infos);
        }
        this.infos = infos;
        this.source = remap;
    };

    /*
    Stream.prototype.remapSource = function (data) {
        var row = data.length,
            column = data[0].length,
            remap = [],
            i,
            j;
        if (column < 1) {
            throw new Error("Data source is empty.");
        }
        for (i = 0; i < row; i++) {
            remap[i] = [];
            for (j = 0; j < column; j++) {
                remap[i][j] = {};
                remap[i][j].x =  j;
                remap[i][j].y =  parseFloat(data[i][j]);
            }
        }
        return remap;
    };
    */

    Stream.prototype.layout = function () {
        var conf = this.defaults;
        d3.layout.stack().offset(conf.offset).order(conf.order)(this.source);
    };

    Stream.prototype.getColor = function (colorJson) {
        var colorMatrix = DataV.getColor();
        var color;
        var colorStyle = colorJson || {};
        var colorMode = colorStyle.mode || 'default';
        var i, l;

        switch (colorMode) {
        case "gradient":
            l = this.source.length;
            var colorL = Math.round(l / 5);
            if (colorL > colorMatrix.length - 1) {
                colorL = colorMatrix.length - 1;
            }
            var testColor = [colorMatrix[0][0], colorMatrix[colorL][0]];
            var test1 = DataV.gradientColor(testColor, "special");
            var testColorMatrix = [];
            var testColorMatrix1 = [];
            for (i = 0; i < l; i++) {
                testColorMatrix.push([test1(i / (l - 1)), test1(i / (l - 1))]);
            }

            for (i = (l - 1); i >= 0; i--) {
                testColorMatrix1.push(testColorMatrix[i]);
            }

            colorMatrix = testColorMatrix;
            
            break;
        case "random":
        case "default":
            break;
        }

        var ratio = colorStyle.ratio || 0;
        if (ratio < 0) { ratio = 0; }
        if (ratio > 1) { ratio = 1; }
        var colorArray = [];
        for (i = 0, l = colorMatrix.length; i < l; i++) {
            var colorFunc = d3.interpolateRgb.apply(null, [colorMatrix[i][0], colorMatrix[i][1]]);
            colorArray.push(colorFunc(ratio));
        }
        color = d3.scale.ordinal().range(colorArray);

        return color;
    };

    Stream.prototype.generatePaths = function () {
        this.createNavi();
        
        this.createPercentage();

        this.createAxis();

        this.createStreamPaths();

        this.createLegend();
    };

    Stream.prototype.createLegend = function () {
        var conf = this.defaults,
            //paper = this.legendPaper,
            legends = [],
            m = [10, 20, 10, 20],
            left = m[3],
            top = m[0],
            lineHeight = 25,
            legendInterval = 10,
            width = conf.legendWidth - conf.legendIndent,
            r0 = 5,
            r1 = 7,
            circleW = 18,
            x,
            y,
            circle,
            text,
            box,
            ul,
            li,
            color = this.getColor({mode: conf.colorMode}),
            i,
            l,
            leftHeight,
            legendHeight,
            legendTopMargin,
            hoverIn = function (e) {
                /*
                var index = this.data("index");
                var stream = this.data("stream");
                var r = this.data("r1");
                var path = stream.paths[index];
                //stream.legends[stream.preIndex]
                stream.preIndex = index;
                stream.legends[index].circle.animate({"r": r, "opacity": 0.5}, 300);
                path.attr({"opacity": 0.5});
                */
                var index = e.data.index;
                var stream = e.data.stream;
                var path = stream.paths[index];
                //stream.legends[stream.preIndex]
                stream.preIndex = index;
                stream.legends[index].css({"background": "#dddddd"});
                path.attr({"opacity": 0.5});
            },
            hoverOut = function (e) {
                /*
                var index = this.data("index");
                var stream = this.data("stream");
                var r = this.data("r0");
                var path = stream.paths[index];
                stream.preIndex = index;
                stream.legends[index].circle.animate({"r": r, "opacity": 1}, 300);
                path.attr({"opacity": 1.0});
                */
                var index = e.data.index;
                var stream = e.data.stream;
                var path = stream.paths[index];
                stream.preIndex = index;
                stream.legends[index].css({"background": "white"});
                path.attr({"opacity": 1.0});
            };

        ul = $("<ul/>");
        ul.css({ 
            "margin": "0px 0px 0px 10px",
            "padding-left": "0px" 
        });
        $(this.legend).append(ul);

        for (i = 0, l = this.infos.length; i < l; i++) {
            li = $("<li>" + "<span style=\"color: black\">" + this.infos[i][0].name + "</span>" + "</li>");
            li.css({"list-style-type": "square",
                    "list-style-position": "inside",
                    //"background": "gray",
                    "color": color(i),
                    //"display": "inline", 
                    "white-space": "nowrap",
                    "padding-left": 5
                    });
            ul.append(li);
            li.mouseenter({"index": i, "stream": this}, hoverIn);
            li.mouseleave({"index": i, "stream": this}, hoverOut);
            legends.push(li);
            /*
            text = paper.text(0, 0, this.infos[i][0].name)
                .attr({"font-size": conf.fontSize,
                        "text-anchor": "start",
                        "font-family": "微软雅黑"});
            box = text.getBBox();
            //if (left + circleW + box.width >= width - m[1]) {
                //new line
                left = m[3];
                top += lineHeight;
            //}
            circle = paper.circle(left + circleW / 2, top + lineHeight / 2, r0)
                .attr({"stroke": "none", "fill": color(i)})
                .data("index", i)
                .data("stream", this)
                .data("r0", r0)
                .data("r1", r1)
                .hover(hoverIn, hoverOut);
            text.transform("t" + (left + circleW) + "," + (top + lineHeight / 2));
            paper.rect(left + circleW, top, box.width, lineHeight)
                .attr({"stroke": "none",
                        "fill": "#000",
                        "opacity": 0})
                .data("index", i)
                .data("stream", this)
                .data("r0", r0)
                .data("r1", r1)
                .hover(hoverIn, hoverOut);

            legends.push({"text": text, "circle": circle});

            left += legendInterval + circleW + box.width;
            */
        }
        this.legends = legends;
        //paper.setSize(width, top + lineHeight + m[2]);

        //height and margin
        leftHeight = $(this.rightContainer).height();
        legendHeight = $(this.legend).height();
        $(this.leftContainer).css({
            "height": leftHeight
        });
        if (leftHeight > legendHeight) {
            $(this.legend).css({"margin-top": leftHeight - legendHeight - 30});
        } else {
            $(this.legend).css({"margin-top": 0});
        }
    };

    Stream.prototype.createNavi = function () {
        if (!this.userConfig.more) {
            $(this.navi).css({"visibility": "hidden",
                            "position": "absolute"
                            });
        } else {
            $(this.navi).css({"visibility": "visible",
                            "position": "relative"
                            });
        }
        var i,
            span;
        $(this.naviTrace).empty();
        for (i = 0; i <= this.level; i++) {
            $(this.naviTrace).append($("<span> &gt; </span>"));
            span = document.createElement("span");
            span.data = {level: i};
            span = $(span)
                .html(i === 0 ? "第1层"/*this.userConfig.rootName*/ : "第" + (i + 1) + "层")
                .appendTo($(this.naviTrace));
            if (i !== this.level) {
                span.css({"cursor": "pointer", "color": "#1E90FF"})
                    .addClass("navi");
                    //.data("level", i);
            }
        }
        if (this.level > 0) {
            this.naviBack.style.visibility = "visible";
        } else {
            this.naviBack.style.visibility = "hidden";
        }
    };

    Stream.prototype.getMaxPercentage = function () {
        this.maxPercentage = this.allInfos.reduce(function (a, b, i, array) {
            return [{total: a[0].total + b[0].total}];
        })[0].total;
    };

    Stream.prototype.createPercentage = function () {
        if (!this.userConfig.more) {
            return;
        }
        var conf = this.defaults;
        var maxY = this.getMaxY(),
            y;
        if (this.firstRender) {
            this.getMaxPercentage();
        }

        maxY /= this.maxPercentage;
        y = maxY > 0.1 ? (1 - maxY) * conf.height + conf.fontSize * 2 / 3 
            : (1 - maxY) * conf.height - conf.fontSize * 2 / 3;

        if (this.firstRender) {
            this.percentageRect = this.percentagePaper.rect(0, (1 - maxY) * conf.height,
                    conf.margin[3], maxY * conf.height)
                .attr({"fill": "#f4f4f4", "stroke": "#aaa", "stroke-width": 0.5});
            this.percentageText = this.percentagePaper.text(conf.margin[3] / 2, y,
                    Math.round(maxY * 100) + "%")
                .attr({"text-anchor": "middle"});
        } else {
            this.percentageRect.animate({"y": (1 - maxY) * conf.height, "height": maxY * conf.height}, 750);
            this.percentageText.attr({"text": Math.round(maxY * 100) + "%"})
                .animate({"y": y}, 750);
        }
    };

    Stream.prototype.createStreamPaths = function () {
        var canvas = this.canvas,
            paths = [],
            labels = [],
            area = this.generateArea(),
            color = this.getColor({mode: this.defaults.colorMode}),
            conf = this.defaults,
            i,
            l,
            _area,
            pathLegend,
            path,
            pathLegendMouseOver = function () {
                var path = this.path,
                    anchorIndex = path.index;
                path.paths.forEach(function (d, i, array) {
                    if (i !== anchorIndex) {
                        array[i].attr({"fill": d3.interpolateRgb.apply(null, [array[i].color, "#fff"])(0.5)});
                    }
                });
				this.style.backgroundColor = d3.interpolateRgb.apply(null, [path.color, "#fff"])(0.8);
            },
            
            pathLegendMouseOut = function () {
                var path = this.path,
                    anchorIndex = path.index;
                path.paths.forEach(function (d, i, array) {
                    if (i !== anchorIndex) {
                        array[i].attr({"fill": array[i].color});
                    }
                });
				path.legend.style.backgroundColor = path.color;
            },

            getLabelLocation = function (locArray, el) {
                var x = 0,
                    y = 0,
                    i;
                var ratioMargin = 0.15;
                var index = 0;
                var max = 0;
                var box = el.getBBox();
                var xInterval;
                var minTop, maxBottom;
                var showLabel = true;
                var loc;
                var height;

                xInterval = Math.ceil(box.width / (locArray[1].x - locArray[0].x) / 2);
                if (xInterval === 0) {
                    xInterval = 1;
                }

                locArray.forEach(function (d, i, array) {
                    var m = Math.max(ratioMargin * array.length, xInterval);
                    if (i >= m && i <= array.length - m) {
                        if (d.y > max) {
                            minTop = d.y0 - d.y;
                            maxBottom = d.y0;
                            max = d.y;
                            index = i;
                        }
                    }
                });
                for (i = index - xInterval; i <= index + xInterval; i++) {
                    if (i < 0 || i >= locArray.length) {
                        height = 0;
                        showLabel = false;
                        break;
                        //return;
                    }
                    loc = locArray[i];
                    //top's y is small
                    if (loc.y0 - loc.y > minTop) {
                        minTop = loc.y0 - loc.y;
                    }
                    if (loc.y0 < maxBottom) {
                        maxBottom = loc.y0;
                    }
                }

                if (showLabel && maxBottom - minTop >= box.height * 0.8) {
                    x = locArray[index].x;
                    y = (minTop + maxBottom) / 2;
                    //y = locArray[index].y0 - locArray[index].y / 2;
                } else {
                    showLabel = false;
                }
                /*
                x = locArray[index].x;
                y = locArray[index].y0 - locArray[index].y / 2; 
                for (i = index - indexMargin; i <= index + indexMargin; i++) {
                    height += locArray[i].y;
                }
                height = height / (2 * indexMargin + 1);
                */

                return {x: x,
                        y: y,
                        showLabel: showLabel};
            },

            getLabelLocation_old2 = function (locArray, conf) {
                var x, y, height = 0, i;
                var indexMargin = Math.min(conf.indexMargin, Math.floor((locArray.length - 1) / 2));
                var ratioMargin = 0.15;
                var index = indexMargin;
                var max = 0;
                if (locArray.length >= conf.indexMargin * 2 + 1) {
                    locArray.forEach(function (d, i, array) {
                        var m = Math.max(indexMargin, ratioMargin * array.length);
                        if (i >= m && i <= array.length - m) {
                            if (d.y > max) {
                                max = d.y;
                                index = i;
                            }
                        }
                    });
                    x = locArray[index].x;
                    y = locArray[index].y0 - locArray[index].y / 2; 
                    for (i = index - indexMargin; i <= index + indexMargin; i++) {
                        height += locArray[i].y;
                    }
                    height = height / (2 * indexMargin + 1);
                } else {
                    x = -100;
                    y = -100;
                    height = 0;
                }

                return {x: x,
                        y: y,
                        height: height};
            };

        canvas.rect(0, 0, conf.width, conf.height)
            .attr({"stroke": "none",
                    "fill": "#e0e0e0"});
        for (i = 0, l = this.source.length; i < l; i++) {
            _area = area(this.pathSource[i]);
            path = canvas.path(_area).attr({fill: color(i),
                    stroke: color(i),
                    "stroke-width": 1,
                    "stroke-linejoin": "round",
                    "transform":  "t0," + conf.topInterval
                    });
            path.color = color(i);
            path.index = i;
            path.info = this.infos[i];

            path.paths = paths;
            path.topTrans = conf.topInterval; 
            path.bottomTrans = conf.bottomInterval;
            path.stream = this;

            path.node.streamPath = path;
            path.node.setAttribute("class", "streamPath rvml");

            //path.click(pathClick);
            //path.mouseover(pathMouseOver);
            //path.mouseout(pathMouseOut);
            //path.mousemove(pathMouseMove);

            paths[path.index] = path;
            //brush canvas background
        }

        //label
        for (i = 0, l = paths.length; i < l; i++) {
            path = paths[i];
            path.label = this.canvas.text(0, 0,
                    conf.pathLabel ?
                    path.info[0].name + " " + (Math.round(path.info[0].total * 10000) / 100) + "%" : "")
                .attr({"text-anchor": "middle",
                        "fill": "white",
                        "font-size": conf.fontSize,
                        "font-family": "微软雅黑"});
            path.labelLoc = getLabelLocation(this.pathSource[i], path.label);
            /*
            path.labelLoc = getLabelLocation(this.pathSource[i], conf);
            path.label = this.canvas.text(path.labelLoc.x, path.labelLoc.y,
                    path.info[0].name + " " + (Math.round(path.info[0].total * 10000) / 100) + "%")
                .attr({"text-anchor": "middle",
                        "fill": "white",
                        "font-size": conf.fontSize,
                        "font-family": "微软雅黑"});
            if(path.labelLoc.height <= 20){
                path.labelOpacity = 0;
                path.label.attr({"opacity": 0});
            } else {
                path.labelOpacity = 1;
            }
            */
            if (path.labelLoc.showLabel) {
                path.label.attr({"x": path.labelLoc.x,
                                "y": path.labelLoc.y});
            } else {
                path.label.attr({"opacity": 0});
                //path.labelOpacity = 1;
            }
            if (i === 0 && path.info[0].id === -1) {
                path.attr({"cursor": "pointer"});
                path.label.attr({"cursor": "pointer"});
            }
            labels.push(path.label);
            path.label.node.setAttribute("class", "streamPath rvml");
        }

        $(this.canvas.canvas).unbind();

        var mouseenter = function (e) {
                var stream = e.data.stream;
                stream.indicatorLine.attr({"stroke": "#000"});
                stream.highlightLine.attr({"stroke": "white"});
                stream.floatTag.css({"visibility" : "visible"});
                stream.axisPopText.show();
                stream.axisPopBubble.show();
            };

        var mouseleave = function (e) {
                var stream = e.data.stream,
                    circle;
                stream.indicatorLine.attr({"stroke": "none"});
                stream.highlightLine.attr({"stroke": "none"});
                stream.floatTag.css({"visibility" : "hidden"});
                stream.axisPopText.hide();
                stream.axisPopBubble.hide();
                //recover prepath;
                if (typeof stream.prePath !== 'undefined') {
                    stream.prePath.attr({"opacity": 1, "stroke-width": 1});
                    // set legend
                    //circle = stream.legends[stream.prePath.index].circle;
                    //circle.attr({"r": circle.data("r0"), "opacity": 1});
                    stream.legends[stream.prePath.index].css({"background": "white"}); 
                    stream.prePath = undefined;
                }
            };

        var click = function (e) {
                var stream = e.data.stream,
                    position;
                if (typeof stream.prePath !== 'undefined' 
                        && stream.prePath.info[0].id === -1) {
    
                    //hidden 
                    stream.indicatorLine.attr({"stroke": "none"});
                    stream.highlightLine.attr({"stroke": "none"});
                    stream.floatTag.css({"visibility" : "hidden"});

                    stream.level += 1;

                    //set cover
                    position = $(this).parent().position();
                    $(stream.cover).css({left: position.left + "px",
                                        top: position.top + "px"});
                    stream.cover.style.visibility = "visible";
                    stream.coverMouse = {x: e.pageX, y: e.pageY};

                    //redraw
                    stream.getLevelSource();
                    stream.reRender();

                    //hidden
                    stream.indicatorLine.attr({"stroke": "none"});
                    stream.highlightLine.attr({"stroke": "none"});
                    stream.floatTag.css({"visibility" : "hidden"});

                    stream.paths.forEach(function (d, i, array) {
                        d.attr({transform: "s1,0.001,0," + stream.defaults.height});
                        d.label.hide();
                        d.animate({transform: "t0,0"}, 750, "linear", function () {
                            stream.cover.style.visibility = "hidden";
                            if (typeof stream.coverMouse !== 'undefined') {
                                stream.indicatorLine.attr({"stroke": "#000"});
                                stream.highlightLine.attr({"stroke": "white"});
                                stream.floatTag.css({"visibility" : "visible"});
                                $(stream.canvas.canvas).trigger("mousemove", 
                                    [stream.coverMouse.x, stream.coverMouse.y]);
                                stream.coverMouse = undefined;
                            }
                            //if (d.labelOpacity === 1) 
                            if (d.labelLoc.showLabel) {
                                d.label.show();
                            }
                        });
                    });
                }
            };

        var mousemove = function (e, pageX, pageY) {
                var stream = e.data.stream;
                var offset = $(this).parent().offset();
                var position = $(this).parent().position();
                //var offset = $(this).offset();
                var x = (e.pageX || pageX) - offset.left,
                    y = (e.pageY || pageY) - offset.top;
                var floatTag,
                    floatTagWidth,
                    floatTagHeight,
					mouseToFloatTag = {x: 20, y: 20};
                var path,
                    pathSource = stream.pathSource,
                    pathSourceP,
                    pathIndex,
                    circle;
                var i, l;
                var xIdx = Math.floor((x / (stream.defaults.width
                                / (stream.source[0].length - 1) / 2) + 1) / 2);
                var pathsourceP,
                    lineX;

                //get path
                path = undefined;
                pathSource = stream.pathSource;
                for (i = 0, l = pathSource.length; i < l; i++) {
                    if (y >= pathSource[i][xIdx].y0 - pathSource[i][xIdx].y && y <= pathSource[i][xIdx].y0) {
                        path = stream.paths[i];
                        pathIndex = i;
                        break;
                    }
                }
                if (typeof path === 'undefined') {
                    return;
                }


                //recover prepath;
                if (typeof stream.prePath !== 'undefined') {
                    stream.prePath.attr({"opacity": 1, "stroke-width": 1});
                    // set legend
                    /*
                    //circle = stream.legends[stream.prePath.index].circle;
                    //circle.attr({"r": circle.data("r0"), "opacity": 1});
                    */
                    stream.legends[stream.prePath.index].css({"background": "white"});
                }
                //change new path;
                stream.prePath = path;
                path.attr({"opacity": 0.5, "stroke-width": 0});

                // set legend
                /*
                circle = stream.legends[stream.prePath.index].circle;
                circle.attr({"r": circle.data("r1"), "opacity": 0.5});
                */
                stream.legends[stream.prePath.index].css({"background": "#dddddd"});

                //set indicator and highlight line
                lineX = stream.defaults.width * xIdx / (stream.source[0].length - 1);
                pathSourceP = pathSource[pathSource.length - 1][xIdx];
                stream.indicatorLine.attr({path: "M" + lineX
                        + " " + (pathSourceP.y0 - pathSourceP.y)
                        + "V" + pathSource[0][xIdx].y0});

                pathSourceP = pathSource[pathIndex][xIdx];
                stream.highlightLine.attr({path: "M" + lineX
                        + " " + (pathSourceP.y0 - pathSourceP.y)
                        + "V" + pathSourceP.y0});
                if (pathIndex === 0 && path.info[0].id === -1) {
                    stream.highlightLine.attr({"cursor": "pointer"});
                } else {
                    stream.highlightLine.attr({"cursor": "auto"});
                }

                floatTag = stream.floatTag;
                floatTag.html(path.info[xIdx].tip);

                //axis pop bubble
                stream.axisPopText.attr({"text": stream.date[xIdx + stream.timeRange[0]]})
                    .transform("t" + (lineX + stream.defaults.margin[3]) + ",0");
                stream.axisPopBubble.transform("t" + (lineX + stream.defaults.margin[3]) + ",0");

                //customevent;
                if (stream.defaults.customEventHandle.mousemove) {
                    stream.defaults.customEventHandle.mousemove.call(stream,
                            {"timeIndex": xIdx, "pathIndex": pathIndex});
                }
            };

        $(this.canvas.canvas).bind("mouseenter", {"stream": this}, mouseenter);

        $(this.canvas.canvas).bind("mouseleave", {"stream": this}, mouseleave);

        $(this.canvas.canvas).bind("click", {"stream": this}, click);

        $(this.canvas.canvas).bind("mousemove", {"stream": this}, mousemove);


        this.paths = paths;
        this.labels = labels;
        this.indicatorLine = canvas.path("M0 " + conf.topInterval
                + "V" + (conf.height - conf.bottomInterval))
            .attr({stroke: "none", "stroke-width": 1, "stroke-dasharray": "- "});
        this.highlightLine = canvas.path("M0 " + conf.topInterval
                + "V" + (conf.height - conf.bottomInterval))
            .attr({stroke: "none", "stroke-width": 2});

        /*
        canvas.setSize(conf.width*2, conf.height);
        canvas.setViewBox(0, 0, conf.width, conf.height/2, false);
        canvas.setSize(conf.width, conf.height);
        */
    };

    Stream.prototype.createAxis = function () {
        //all date strings' format are same, string length are same 
        var conf = this.defaults,
            date = this.date.slice(this.timeRange[0], this.timeRange[1] + 1),
            left = conf.margin[3],
            //left = conf.margin[3] + conf.legendWidth,
            right = conf.totalWidth - conf.margin[1] - conf.legendWidth,
            tempWord,
            tickNumber,
            getPopPath = function (El) {
                //down pop
                var x = 0,
                    y = 0,
                    size = 4,
                    cw = 23,
                    bb = {height: 8};
                if (El) {
                    bb = El.getBBox();
                    bb.height *= 0.6;
                    cw = bb.width / 2 - size;
                }
                return [
                    'M', x, y,
                    'l', size, size, cw, 0,
                    'a', size, size, 0, 0, 1, size, size,
                    'l', 0, bb.height,
                    'a', size, size, 0, 0, 1, -size, size,
                    'l', -(size * 2 + cw * 2), 0,
                    'a', size, size, 0, 0, 1, -size, -size,
                    'l', 0, -bb.height,
                    'a', size, size, 0, 0, 1, size, -size,
                    'l', cw, 0,
                    'z'
                ].join(',');
            };

        /*
        if (!this.firstRender) {
            return;
        } 
        */

        this.dateScale = d3.scale.linear()
            .domain([0, date.length - 1])
            .range([left, right]);

        tempWord = this.axisPaper.text(0, 0, date[0]);
        tickNumber = Math.floor((right - left)
                / tempWord.getBBox().width / 2) + 1;
        tempWord.remove();
        //tickNumber = 4;

        DataV.Axis().scale(this.dateScale)
            .ticks(tickNumber)
            //.ticks(conf.axisTickNumber)
            .tickSize(6, 3, 3)
            .tickAttr({"stroke": "none"})
            .minorTickAttr({"stroke": "none"})
            .domainAttr({"stroke": "none"})
            //.tickTextAttr({"font-size": conf.fontSize})
            .tickFormat(function (d) {
                return date[d] || "";
            })(this.axisPaper);//.attr({transform: "t0," + (conf.height - 0)});

        this.axisPopText = this.axisPaper.text(0, 11, date[0])
            .attr({ "text-anchor": "middle",
                    "fill": "#fff",
                    //"font-size": conf.fontSize,
                    "transform": "t" + left + ",0"})
            .hide();
        this.axisPopBubble = this.axisPaper.path(getPopPath(this.axisPopText))
            .attr({ "fill": "#000",
                    //"opacity": 0,
                    "transform": "t" + left + ",0"})
            .toBack()
            .hide();
    };

    Stream.prototype.getMaxY = function () {
        return d3.max(this.source, function (d) {
            return d3.max(d, function (d) {
                return d.y0 + d.y;
            });
        });
    };

    Stream.prototype.mapPathSource = function () {
        var conf = this.defaults,
            maxX = this.source[0].length - 1,//this.digitData[0].length - 1,
            maxY = this.getMaxY(), 
            width = conf.width,
            height = conf.height - conf.topInterval - conf.bottomInterval;
        var i, j, l, l2, s, ps;
        this.pathSource = [];
        for (i = 0, l = this.source.length; i < l; i++) {
            this.pathSource[i] = [];
            for (j = 0, l2 = this.source[0].length; j < l2; j++) {
                s = this.source[i][j];
                ps = this.pathSource[i][j] = {};
                ps.x = s.x * width / maxX;
                ps.y0 = height - s.y0 * height / maxY;
                ps.y = s.y * height / maxY;
            }
        }
    };

    Stream.prototype.generateArea = function () {
        this.mapPathSource();
        var area = d3.svg.area()
            .x(function (d) {
                return d.x;
            })
            .y0(function (d) {
                return d.y0;
            })
            .y1(function (d) {
                return d.y0 - d.y; 
            });
        return area;
    };

    Stream.prototype.generateArea_old = function () {
        var conf = this.defaults,
            maxX = this.digitData[0].length - 1,
            maxY = this.getMaxY(), 
            width = conf.width,
            height = conf.height - conf.topInterval - conf.bottomInterval,
            area = d3.svg.area()
                .x(function (d) {
                    return d.x * width / maxX;
                })
                .y0(function (d) {
                    return height - d.y0 * height / maxY;
                })
                .y1(function (d) {
                    return height - (d.y + d.y0) * height / maxY; 
                });
        return area;
    };

    Stream.prototype.clearCanvas = function () {
        this.canvas.clear();
        //this.legend.innerHTML = "";
        /*
        this.legendPaper.clear();
        */
        this.legend.innerHTML = "";
        this.axisPaper.clear();
        /*
        if (this.firstRender) {
            this.axisPaper = undefined;
        }
        */
        //this.percentagePaper.clear();
    };

    Stream.prototype.reRender = function (options) {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        //this.setOptions(options);
        this.clearCanvas();
        this.layout();
        this.generatePaths();
        this.canAnimate = true;
    };

    Stream.prototype.render = function (options) {
        if (!this.node) {
            throw new Error("Please specify which node to render.");
        }
        this.firstRender = true;
        //this.setOptions(options);
        this.clearCanvas();
        this.layout();
        this.generatePaths();
        this.firstRender = false;
        this.canAnimate = true;
    };

    Stream.prototype.resize = function (options) {
        var conf = this.defaults;

        if (!options.width && !options.height) {
            throw new Error("no width and height input");
        } else if (options.width && !options.height) {
            if (conf.autoHeight) {
                this.setOptions({"width": options.width});
            } else {
                this.setOptions({"width": options.width, "height": conf.height});
            }
        } else if (!options.width && options.height) {
            this.setOptions({"width": conf.totalWidth, "height": options.height});
        } else {
            this.setOptions({"width": options.width, "height": options.height});
        }

        this.node.innerHTML = "";
        this.createCanvas();
        this.reRender();
    };
    
    Stream.prototype.on = function (eventName, callback) {
        if (typeof this.defaults.customEventHandle[eventName] !== 'undefined') {
            this.defaults.customEventHandle[eventName] = callback;
        }
    };

    Stream.prototype.animate = function (options, timeDuration) {
        //must after render if new Source has been set;
        if (!this.canAnimate) {
            throw new Error("Function animate must be called after render if new Source has been set.");
        }
        var time = 0,
            area,
            color,
            i,
            l;
        if (arguments.length > 1) {
            time = timeDuration;
        }

        //this.setOptions(options);
        if (options.offset || options.order) {
            this.source = this.remapSource(this.digitData);
            this.layout();
        }
        area = this.generateArea();
        color = this.getColor();
        for (i = 0, l = this.source.length; i < l; i++) {
            var _area = area(this.source[i]);
            var anim = Raphael.animation({path: _area, fill: color(i)}, time);
            this.paths[i].animate(anim);
        }
    };

    module.exports = Stream;
});
