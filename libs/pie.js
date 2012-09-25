/*global Raphael */
/*global d3 */
define(function (require, exports, module) {
    var DataV = require('datav');

    //构造函数，container参数表示在html的哪个容器中绘制该组件
    //options对象为用户自定义的组件的属性，比如画布大小
    var Pie = function (container, options) {
        this.type = "Pie";
        this.container = container;
        this.defaults = {};
        this.sum = 0;
        this.groupNames = []; //数组：记录每个group的名字
        this.groupValue = [];
        this.groups = [];
        this.click = 0;

        //图的大小设置
        this.defaults.tag = true;
        this.defaults.width = 800;
        this.defaults.height = 800;

        //设置用户指定的属性
        this.setOptions(options);

        this.tagArea = [20, (this.defaults.height - 20 - 220), 200, 220];
        if (this.defaults.tag) {
            this.xOffset = this.tagArea[2];
        } else {
            this.xOffset = 0;
        }

        this.defaults.radius = Math.min((this.defaults.width - this.xOffset), this.defaults.height) * 0.3;
        this.defaults.protrude = this.defaults.radius * 0.1;
        //创建画布
        this.createCanvas();
    };

    Pie.prototype.checkContainer = function (container) {
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
    Pie.prototype.setOptions = function (options) {
        if (options) {
            var prop;
            for (prop in options) {
                if (options.hasOwnProperty(prop)) {
                    this.defaults[prop] = options[prop];
                }
            }
        }
    };

    Pie.prototype.createCanvas = function () {
        if (!this.container) {
            throw new Error("Please specify on which container to render the chart.");
        }
        this.canvas = new Raphael(this.container, this.defaults.width, this.defaults.height);
        this.canvasF = document.getElementById(this.container);
        var canvasStyle = this.canvasF.style;
        canvasStyle.position = "relative";
        this.floatTag = DataV.FloatTag()(this.canvasF);
        this.floatTag.css({
            "visibility": "hidden"
        });
    };

    Pie.prototype.getColor = function (i) {
        var color = DataV.getColor();
        return color[i % color.length][0];
    };

    Pie.prototype.render = function () {
        var conf = this.defaults;
        var floatTag = this.floatTag;
        var that = this;
        this.layout();
        var groups = this.groups;

        var onCanvasClick = function () {
            that.donutGroups.forEach(function (d) {
                if (d.data('click') === true) {
                    var index = d.data("donutIndex");
                    var angle = 0.5 * ((that.groups[index].startAngle + that.groups[index].endAngle) - Math.PI);
                    var transX = conf.protrude * Math.cos(angle);
                    var transY = conf.protrude * Math.sin(angle);
                    d.data('line').translate(0, conf.protrude);
                    d.data('nameTag').translate(-transX, - transY);
                    d.translate(-transX, - transY);
                    d.data('click', false);
                } else {
                    d.attr('fill-opacity', 1);
                }
            });
            if (that.defaults.tag === true) {
                that.underBn.forEach(function (d) {
                    d.hide();
                });
            }
            that.click = 0;
        };
        var background = this.canvas.rect(0, 0, conf.width, conf.height).attr({
            'fill': '#ffffff',
            'fill-opacity': 0,
            'stroke-opacity': 0
        }).toBack();
        background.click(onCanvasClick);


        //由内外半径、起始角度计算路径字符串
        var pathCalc = d3.svg.arc().innerRadius(conf.radius).outerRadius(0).startAngle(function (d) {
            return d.startAngle;
        }).endAngle(function (d) {
            return d.endAngle;
        });

        // var pathCalc = function (radius,start,end) {

        // }

        var donutEle;
        //获取每个环形的字符串表示
        var spline;
        var tips;
        that.donutGroups = that.canvas.set();

        $("#" + this.container).append(this.floatTag);

        //添加透明效果

        var mouseOver = function () {
            floatTag.html('<div style = "text-align: center;margin:auto;color:' + "#ffffff" + '">' + this.data('text') + '</div>');
            floatTag.css({
                "visibility": "visible"
            });
            var index = this.data("donutIndex");
            if (that.defaults.tag === true) {
                if (this.data('click') === false) {
                    that.underBn[index].attr('opacity', 0.5).show();
                }
            }
            if (that.click === 0) {
                that.donutGroups.forEach(function (d) {
                    if (index !== d.data("donutIndex")) {
                        d.attr('fill-opacity', 0.5);
                    }
                });
            }
            this.attr('fill-opacity', 1);
        };

        var mouseOut = function () {
            floatTag.css({
                "visibility": "hidden"
            });
            var index = this.data("donutIndex");
            //fade(this.data("donutIndex"), 0.6);

            if (that.defaults.tag === true) {
                if (this.data('click') === false) {
                    that.underBn[index].hide();
                }
            }
            if (that.click === 0) {
                that.donutGroups.forEach(function (d) {
                    d.attr('fill-opacity', 1);
                });
            } else if (this.data('click') === false) {

                this.attr('fill-opacity', 0.5);
            }
        };

        var mouseClick = function () {
            var index = this.data("donutIndex");
            var flag = !this.data('click');
            this.data('click', flag);
            var angle = 0.5 * ((that.groups[index].startAngle + that.groups[index].endAngle) - Math.PI);
            var transX = conf.protrude * Math.cos(angle);
            var transY = conf.protrude * Math.sin(angle);
            if (flag === true) {
                if (that.click === 0) {
                    that.donutGroups.forEach(function (d) {
                        if (d.data('click') === false) {
                            d.attr('fill-opacity', 0.5);
                        }
                    });
                }

                if (that.defaults.tag === true) {
                    that.underBn[index].attr('opacity', 1).show();
                }
                this.attr('fill-opacity', 1);
                this.data('nameTag').translate(transX, transY);
                this.data('line').translate(0, - conf.protrude);
                this.translate(transX, transY);
                that.click += 1;
            } else {
                this.data('line').translate(0, conf.protrude);
                this.data('nameTag').translate(-transX, - transY);
                this.translate(-transX, - transY);
                that.click -= 1;
                if (that.click > 0) {
                    this.attr('fill-opacity', 0.5);
                }
            }
        };


        //画圆弧*********************************************************
        var i;
        var transStr;
        var transX, transY;
        var ro, a;
        var line;
        var nameTag;
        for (i = 0; i <= groups.length - 1; i++) {


            //画外圈的pie图**************************************
            //计算每个group的path


            spline = pathCalc(groups[i]);
            tips = that.groupNames[i] + ": " + Math.round(groups[i].value) + " " + (groups[i].value * 100 / this.sum).toFixed(2) + "%";

            donutEle = that.canvas.path(spline).translate((conf.width - this.xOffset) / 2 + this.xOffset, conf.height / 2).data("donutIndex", i).attr({
                "path": spline,
                "fill": that.getColor(i),
                "stroke": '#ffffff',//that.getColor(i),
                'stroke-width': 1.5,
                'stroke-opacity': 0.3
            }).mouseover(mouseOver).mouseout(mouseOut).click(mouseClick);


            //每个donut上显示名称
            ro = (groups[i].startAngle + groups[i].endAngle) * 90 / Math.PI;
            angle = 0.5 * ((groups[i].startAngle + groups[i].endAngle) - Math.PI);
            transX = (conf.radius + 2 * conf.protrude) * Math.cos(angle);
            transY = (conf.radius + 2 * conf.protrude) * Math.sin(angle);
            transStr = "T" + ((conf.width - that.xOffset) / 2 + that.xOffset) + "," + conf.height / 2 + "T" + transX + "," + transY; // + "R" + ro;
            line = that.canvas.path("M,0,-" + (conf.protrude - 3) + "L0," + (conf.protrude - 3)).transform(transStr + "R" + ro).translate(0, conf.protrude + 4).attr({"stroke": "#929292"}).toBack();
            nameTag = that.canvas.text().attr("font", "12px Verdana").attr("text", that.groupNames[i]).transform(transStr).toBack();
            if (angle - Math.PI / 2 > 0) {
                nameTag.translate(-nameTag.getBBox().width / 2, 0);
            } else {
                nameTag.translate(nameTag.getBBox().width / 2, 0);
            }

            donutEle.data('text', tips).data('click', false).data('nameTag', nameTag).data('line', line);
            that.donutGroups.push(donutEle);

        }


        if (conf.tag === true) {
            this.tag();
        }
    };

    Pie.prototype.tag = function () {
        var that = this;
        var conf = this.defaults;
        var paper = this.canvas;
        var tagArea = this.tagArea;
        this.rectBn = paper.set();
        var rectBn = this.rectBn;
        this.underBn = [];
        var underBn = this.underBn;
        var i = 0;
        for (i = 0; i < this.groups.length; i++) {
            //底框
            underBn.push(paper.rect(tagArea[0] + 10, tagArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
                "fill": "#ebebeb",
                "stroke": "none"
                //"r": 3
            }).hide());
            //色框
            paper.rect(tagArea[0] + 10 + 3, tagArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
                "fill": this.getColor(i),
                "stroke": "none"
            });
            //文字
            paper.text(tagArea[0] + 10 + 3 + 16 + 8, tagArea[1] + 10 + (20 + 3) * i + 10, this.groupNames[i]).attr({
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
            }));
        }
        rectBn.forEach(function (d, i) {
            d.mouseover(function () {
                if (that.donutGroups[i].data("click") === false) {
                    underBn[i].attr('opacity', 0.5);
                    underBn[i].show();
                }
            }).mouseout(function () {
                if (that.donutGroups[i].data("click") === false) {
                    underBn[i].hide();
                }
            });
            d.click(function () {
                var angle = 0.5 * ((that.groups[i].startAngle + that.groups[i].endAngle) - Math.PI);
                var transX = conf.protrude * Math.cos(angle);
                var transY = conf.protrude * Math.sin(angle);
                if (that.donutGroups[i].data("click") === false) {
                    if (that.click === 0) {
                        that.donutGroups.forEach(function (d) {
                            if (d.data('click') === false) {
                                d.attr('fill-opacity', 0.5);
                            }
                        });
                    }
                    underBn[i].attr('opacity', 1).show();
                    that.donutGroups[i].data("click", true).attr('fill-opacity', 1);
                    that.donutGroups[i].data('nameTag').translate(transX, transY);
                    that.donutGroups[i].data('line').translate(0, - conf.protrude);
                    that.donutGroups[i].translate(transX, transY);
                    that.click += 1;

                } else if (that.donutGroups[i].data("click") === true) {
                    that.donutGroups[i].data('nameTag').translate(-transX, - transY);
                    that.donutGroups[i].data('line').translate(0, conf.protrude);
                    that.donutGroups[i].translate(-transX, - transY);
                    that.click -= 1;
                    if (that.click > 0) {
                        that.donutGroups[i].attr('fill-opacity', 0.5);
                    } else {
                        that.donutGroups.forEach(function (d) {
                            d.attr('fill-opacity', 1);
                        });
                    }
                    underBn[i].hide();
                    that.donutGroups[i].data("click", false);

                }
            });
        });
    };

    //对原始数据进行处理
    Pie.prototype.setSource = function (table) {
        if (table[0][0] !== null) {
            var t;
            for (t = 0; t < table.length; t++) {
                this.groupNames[t] = table[t][0];
                this.groupValue[t] = Number(table[t][1]);
            }
        }
    };

    //创建pie布局
    Pie.prototype.layout = function () {
        if (!this.container) {
            throw new Error("Please specify on which container to render the chart.");
        }

        var that = this;

        that.canvas.clear();

        var v = [50265, 60555, 38544, 27276, 20506, 26916, 17636, 977, 10406, 6695];
        var acc = 0;
        var i;
        for (i = 0; i < this.groupValue.length; i++) {
            this.sum += this.groupValue[i];
        }
        for (i = 0; i < this.groupValue.length; i++) {
            this.groups[i] = {};
            this.groups[i].index = i;
            this.groups[i].value = this.groupValue[i];
            this.groups[i].startAngle = 2 * acc * Math.PI / this.sum;
            acc += this.groupValue[i];
            this.groups[i].endAngle = 2 * acc * Math.PI / this.sum;
        }
    };

    module.exports = Pie;
});