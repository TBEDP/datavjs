/*global EventProxy, d3, Raphael, $ */
define(function (require, exports, module) {
    var DataV = require('datav');
    var theme = DataV.Themes;

    var Matrix = DataV.extend(DataV.Chart, {
        initialize: function (container, options) {
            this.type = "Matrix";
            this.container = container;
            this.defaults = {};

            // Properties
            this.font = {};

            // Canvas
            this.defaults.width = 1200;
            this.defaults.height = 1200;
            this.defaults.axisWidth = 40;

            this.setOptions(options);
            this.emitter = new EventProxy();
            this.createCanvas();
            this.move = false;
        }
    });

    Matrix.prototype.on = function (eventName, callback) {
        this.emitter.on(eventName, callback);
    };

    Matrix.prototype.setOptions = function (options) {
        var prop;
        if (options) {
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }
    };

    Matrix.prototype.getDataTable = function (table) {
        var title = table[0];
        table = table.slice(1);

        var titleLength = title.length;
        var tableWidth = table[0].length;
        var tableHeight = table.length;

        this.tableWidth = tableWidth;
        this.tableHeight = tableHeight;

        //for symmetric matrix
        if (tableWidth !== title.length || tableHeight !== title.length) {
            throw new Error("This matrix is not symmetric matrix!!!");
        } else {
            this.tableWidth = tableWidth;
            this.tableHeight = tableHeight;
        }

        this.title = title;
        return table;
    };

    Matrix.prototype.setSource = function (source) {
        var conf = this.defaults;

        this.source = this.getDataTable(source);
        this.hasSort = false;
        // this.source = this.remapSource(source);
    };

    // Matrix.prototype.remapSource = function (data) {
    //     return this.getDataTable(data);
    //     // return data;
    // };

    Matrix.prototype.layout = function () {
        var conf = this.defaults;
        var width = conf.width;
        var height = conf.height;
        var tableWidth = this.tableWidth;
        var tableHeight = this.tableHeight;
        var axisWidth = conf.axisWidth;

        this.cellWidth = Math.min((width - axisWidth) / tableWidth, (height - axisWidth) / tableHeight);

        var startX;
        var startY;
        var bRectWidth;
        var matrixWidth;

        if (width > height) {
            startX = (width - height)/2 + axisWidth;
            startY = axisWidth;
            bRectWidth = height - axisWidth;
            matrixWidth = bRectWidth - axisWidth;
        } else if (height > width) {
            startX = axisWidth;
            startY = (height - width) + axisWidth;
            bRectWidth = width - axisWidth;
        } else {
            startX = axisWidth;
            startY = axisWidth;
            bRectWidth = width - axisWidth;
            matrixWidth = bRectWidth - axisWidth;
        }

        this.startX = startX;
        this.startY = startY;
        this.bRectWidth = bRectWidth;
        this.matrixWidth = matrixWidth;
    };

    Matrix.prototype.getColor = function (i) {
        var colorMatrix = DataV.getColor();
        var length = colorMatrix.length;
        var num = i % length;
        //var color = '#939598';
        var color = '#FFFFFF'
        
        if (num !== 0) {
            color = colorMatrix[num][0];
        }

        return color;
    };

    Matrix.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.canvas = new Raphael(this.container, conf.width, conf.height);

        this.DOMNode = $(this.canvas.canvas);
        var that = this;
        this.DOMNode.click(function (event) {
            that.emitter.trigger("click", event);
            that.update();
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
    };

    Matrix.prototype.generatePaths = function () {
        var canvas = this.canvas;
        var source = this.source;
        var conf = this.defaults;
        var width = conf.width;
        var height = conf.height;
        var startX = this.startX;
        var startY = this.startY;
        var cellWidth = this.cellWidth;
        var tableWidth = this.tableWidth;
        var tableHeight = this.tableHeight;
        var bRectWidth = this.bRectWidth;
        var matrixWidth = this.matrixWidth;

        //canvas.clear();
        // var color = this.getColor();
        // var font = this.getFont();
        var font_family = '微软雅黑';
        var font_size = 8;

        var title = this.title;

        var row = [];
        var columnLine = [];
        var columnText = [];

        var backgroundRect = canvas.rect(startX, startY, bRectWidth, bRectWidth);
        //backgroundRect.attr({fill: "#939598", stroke: "none", "fill-opacity": 0.8});
        backgroundRect.attr({fill: "#ffffff", stroke: "none", "fill-opacity": 0.8});
        backgroundRect.toBack();

        var sort;
        if (this.hasSort) {
            sort = this.sort;
        }
        var i, j, a, b, color, rect;
        var rects = [];  //for column change move rect
        for (i = 0; i < tableHeight; i++) {
            if (!this.hasSort){
                a = i;
            } else {
                for (j = 0; j < sort.length; j++) {
                    if (sort[j] === i) {
                        a = j;
                    } 
                }
            }
            var rowRect = canvas.set();
            //rowRect.push(canvas.path("M0 0L" + width + " 0").attr({stroke: "#ffffff"}));
            canvas.path("M" + startX + " " + (startY + cellWidth * i) + "L" + (startX + matrixWidth + 10 + cellWidth) + " "
             + (startY + cellWidth * i)).attr({stroke: "#D1D1D1", "stroke-width": 1});
            rowRect.push(canvas.text(-20, cellWidth / 2, title[i])
                .attr({"fill": "#000000",
                    "fill-opacity": 0.7,
                    "font-family": "Verdana",
                    //"font-weight": "bold",
                    "font-size": 12}));

            for (j = 0; j < tableWidth; j++) {
                if (!this.hasSort){ 
                    color = this.getColor(source[i][j]);
                } else {
                    color = this.getColor(source[i][sort[j]]);
                }
                rect = canvas.rect(cellWidth * j, 0, cellWidth, cellWidth)
                    .attr({stroke: "none", fill: color, "fill-opacity": 0.8});
                rowRect.push(rect);
                rects.push(rect);
            }

            rowRect.transform("t" + startX + ", " + (startY + cellWidth * a));
            row.push(rowRect);
        }

        canvas.path("M" + startX + " " + (startY + cellWidth * tableHeight) + "L" + (startX + matrixWidth + 10 + cellWidth) + " "
             + (startY + cellWidth * tableHeight)).attr({stroke: "#D1D1D1", "stroke-width": 1});

        for (i = 0; i < tableWidth; i++) {
            // var columnLine = canvas.set();
            // var columnText = canvas.set();
            if (!this.hasSort){
                a = i;
            } else {
                for (j = 0; j < sort.length; j++) {
                    if (sort[j] === i) {
                        a = j;
                    } 
                }
            }
            columnLine.push(canvas.path("M0 0L0 " + matrixWidth + 10 + cellWidth)
                .attr({stroke: "#D1D1D1", "stroke-width": 1})
                .transform("t" + (startX + cellWidth * a) + ", " + startY));
            columnText.push(canvas.text(cellWidth / 2, -20, title[i])
                .attr({"fill": "#000000",
                    "fill-opacity": 0.7,
                    "font-family": "Verdana",
                    //"font-weight": "bold",
                    "font-size": 12})
                .transform("t" + (startX + cellWidth * a) + ", " + startY + "r90"));

            // for (j = i * (tableWidth - 1); j < (i + 1) * (tableWidth - 1); j++){
            //     columnRect.push(rects[j]);
            // }

            //columnRect.transform("t" + (startX + cellWidth * i) + ", " + startY);
            // column.push(columnRect);
        }

        columnLine.push(canvas.path("M0 0L0 " + matrixWidth + 10 + cellWidth)
                .attr({stroke: "#D1D1D1", "stroke-width": 1})
                .transform("t" + (startX + cellWidth * tableWidth) + ", " + startY));

        this.row = row;
        this.columnText = columnText;
        this.columnLine = columnLine;
        this.rects = rects;
    };

    Matrix.prototype.getSort = function (source) {
        var sumQueue = [];
        var sort = [];
        var rowData;
        var rowLength;
        var sum;
        var means;
        var matrixD = [];
        var quareSum;
        var rowquareSum = [];

        var i, j, k;
        for (i = 0 ; i < source.length ; i++) {
            rowData = source[i];
            rowLength = rowData.length;
            sum = 0;
            quareSum = 0;

            for (j = 0 ; j < rowLength ; j++) {
                sum = sum + rowData[j];
            }

            means = sum / rowLength;
            for (j = 0 ; j < rowLength ; j++) {
                rowData[j] = rowData[j] - means;
                quareSum = quareSum + Math.pow(rowData[j], 2);
            }

            quareSum = Math.sqrt(quareSum);

            rowquareSum.push(quareSum);
            matrixD.push(rowData);
        }

        var rowI;
        var rowJ;
        var matrixR = [];

        for (i = 0 ; i < source.length ; i++) {
            matrixR[i] = [];
            for (j = 0 ; j < source.length ; j++) {
                matrixR[i][j] = 0;
            }
        }

        for (i = 0 ; i < source.length ; i++) {
            rowI = matrixD[i];
            matrixR[i][i] = source[i][i];
            for (j = i + 1 ; j < source.length ; j++) {
                sum = 0;
                rowJ = matrixD[j];
                for (k = 0; k < rowLength; k++) {
                    sum = sum + rowI[k] * rowJ[k];
                }

                sum = sum / (rowquareSum[i] * rowquareSum[j]);
                matrixR[i][j] = sum;
                matrixR[j][i] = sum;
            }
        }



        return matrixR;
    }
    
    Matrix.prototype.update = function () {
        var i, j;
        var source = [];
        for(i = 0; i < this.source.length ; i++){
            source[i] = this.source[i].concat();
        }

        var sort = [];
        for (i = 0; i < source[0].length; i++) {
            sort.push(i);
        }

        if (this.hasSort) {
            this.sort = sort;
            this.hasSort = false;
        } else {
            var getSort = this.getSort;
            var i, j;
            var pt;
            var nowSort = [];
            var iterations = 12;

            for (i = 0; i < iterations; i++) {
                source = getSort(source);
            }

            nowSort = source[0];

            var a, b;
            for (i = 1; i < sort.length; i++) {
                a = sort[i];
                for (j = i + 1; j < sort.length; j++) {
                    b = sort[j];
                    if (nowSort[a] < nowSort[b]) {
                        pt = sort[i];
                        sort[i] = sort[j];
                        sort[j] = pt;
                    }
                }
            }
            sort = [0,7,5,2,8,3,1,9,6,14,15,4,13,10,16,11,12];
            this.sort = sort;
            this.hasSort = true;
        }

        if (!this.move) { 
            this.move = true;
            var rects = this.rects;
            var num;
            var startX = this.startX;
            var startY = this.startY;
            var cellWidth = this.cellWidth;

            var rowAnim;
            var columnLineAnim;
            var columnTextAnim;
            var anim;

            for (i = 0; i < sort.length; i++) {
                num = sort[i];
                // if (num != i) {
                rowAnim = Raphael.animation({transform: ["t", startX, (startY + cellWidth * i)]}, 200, "<>");
                this.row[num].animate(rowAnim.delay(100 * i));
                // }
            }

            var that = this;
            var moveEnd = function () {
                that.move = false;
            };

            for (i = 0; i < sort.length; i++) {
                num = sort[i];
                // if (num != i) {
                //columnLineAnim = Raphael.animation({transform: ["t", (startX + cellWidth * i), startY]}, 1000, "<>");
                columnTextAnim = Raphael.animation({transform: ["t", (startX + cellWidth * i), startY, "r", 90]}, 
                    200, "<>");
                //this.columnLine[num].animate(columnLineAnim.delay(500 * (i + sort.length + 1)));
                this.columnText[num].animate(columnTextAnim.delay(100 * (i + sort.length + 1)));

                for (j = 0; j < sort.length; j++) {
                    if (i === sort.length - 1 && j === sort.length - 1) {
                        anim = Raphael.animation({'x': cellWidth * i}, 200, "<>", moveEnd);
                    } else {
                        anim = Raphael.animation({'x': cellWidth * i}, 200, "<>");
                    }
                    rects[j * sort.length + num].animate(anim.delay(100 * (i + sort.length + 1)));
                }
                // }
            }
        }
    };


    Matrix.prototype.render = function (options) {
        if (!this.container) {
            throw new Error("Please specify which node to render.");
        }

        if (!this.move) {
            this.canvas.clear();
            this.setOptions(options);
            this.layout();
            this.generatePaths();
        }

        //this.canvas.renderfix();
    };
    
    module.exports = Matrix;
});