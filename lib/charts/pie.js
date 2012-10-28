/*global Raphael, d3 */
/*!
 * Pie的兼容定义
 */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) {
            return this[id];
        });
    }
})('Pie', function (require) {
    var DataV = require('DataV');

    /**
     * 构造函数
     * @param {Object} node 表示在html的哪个容器中绘制该组件
     * @param {Object} options 为用户自定义的组件的属性，比如画布大小
     */
    var Pie = DataV.extend(DataV.Chart, {
        type: "Pie",
        initialize: function (node, options) {
            this.node = this.checkContainer(node);
            this.sum = 0;
            this.groupNames = []; //数组：记录每个group的名字
            this.groupValue = [];
            this.groups = [];
            this.click = 0;

            //图的大小设置
            this.defaults.legend = true;
            this.defaults.width = 800;
            this.defaults.height = 800;

            //设置用户指定的属性
            this.setOptions(options);

            this.legendArea = [20, (this.defaults.height - 20 - 220), 200, 220];
            if (this.defaults.legend) {
                this.xOffset = this.legendArea[2];
            } else {
                this.xOffset = 0;
            }

            this.defaults.radius = Math.min((this.defaults.width - this.xOffset), this.defaults.height) * 0.3;
            this.defaults.protrude = this.defaults.radius * 0.1;
            //创建画布
            this.createCanvas();
        }
    });

    /**
     * 饼图纬度描述
     */
    Pie.dimension = {};
    /**
     * 标签纬度
     */
    Pie.dimension.label = {
        type: "string",
        required: false
    };
    /**
     * 值纬度
     */
    Pie.dimension.value = {
        type: "number",
        required: true
    };

    /**
     * 创建画布
     */
    Pie.prototype.createCanvas = function () {
        this.canvas = new Raphael(this.node, this.defaults.width, this.defaults.height);
        var canvasStyle = this.node.style;
        canvasStyle.position = "relative";
        this.floatTag = DataV.FloatTag()(this.node);
        this.floatTag.css({
            "visibility": "hidden"
        });
    };

    /**
     * 获取颜色
     * @param {Number} i 元素类别编号
     * @return {String} 返回颜色值
     */
    Pie.prototype.getColor = function (i) {
        var color = DataV.getColor();
        return color[i % color.length][0];
    };

    /**
     * 绘制饼图
     */
    Pie.prototype.render = function () {
        var conf = this.defaults;
        var floatTag = this.floatTag;
        var that = this;
        this.layout();
        var groups = this.groups;

        //由内外半径、起始角度计算路径字符串
        var pathCalc = d3.svg.arc()
        .innerRadius(conf.radius)
        .outerRadius(0)
        .startAngle(function (d) {
            return d.startAngle;
        }).endAngle(function (d) {
            return d.endAngle;
        });

        var donutEle;
        //获取每个环形的字符串表示
        var spline;
        var tips;
        that.donutGroups = that.canvas.set();

        $(this.node).append(this.floatTag);

        //添加透明效果

        var mouseOver = function () {
            floatTag.html('<div style="text-align:center;margin:auto;color:#ffffff">' + this.data('text') + '</div>');
            floatTag.css({
                "visibility": "visible"
            });
            var index = this.data("donutIndex");
            if (!this.data('click')) {
                that.underBn[index].attr('opacity', 0.5).show();
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
            if (!this.data('click')) {
                that.underBn[index].hide();
            }
            if (that.click === 0) {
                that.donutGroups.forEach(function (d) {
                    d.attr('fill-opacity', 1);
                });
            } else if (!this.data('click')) {

                this.attr('fill-opacity', 0.5);
            }
        };

        var mouseClick = function () {
            var index = this.data("donutIndex");
            var flag = !this.data('click');
            this.data('click', flag);
            var a = 0.5 * ((that.groups[index].startAngle + that.groups[index].endAngle) - Math.PI);
            var nameX = conf.protrude * Math.cos(a);
            var nameY = conf.protrude * Math.sin(a);
            if (flag) {
                if (that.click === 0) {
                    that.donutGroups.forEach(function (d) {
                        if (!d.data('click')) {
                            d.attr('fill-opacity', 0.5);
                        }
                    });
                }
                that.underBn[index].attr('opacity', 1).show();
                this.attr('fill-opacity', 1);
                this.data('nameTag').translate(0, - conf.protrude);
                this.data('line').translate(0, - conf.protrude);
                this.translate(nameX, nameY);
                that.click += 1;
            } else {
                this.data('nameTag').translate(0, conf.protrude);
                this.data('line').translate(0, conf.protrude);
                this.translate(-nameX, - nameY);
                that.click -= 1;
                if (that.click > 0) {
                    this.attr('fill-opacity', 0.5);
                }
            }
        };


        //画圆弧
        var i;
        var nameStr;
        var nameX, nameY;
        var ro, a;
        for (i = 0; i <= groups.length - 1; i++) {
            //画外圈的pie图
            //计算每个group的path
            spline = pathCalc(groups[i]);
            tips = that.groupNames[i] + ": " + Math.round(groups[i].value) + " " + (groups[i].value * 100 / this.sum).toFixed(2) + "%";

            donutEle = that.canvas.path(spline)
            .translate((conf.width - this.xOffset) / 2 + this.xOffset, conf.height / 2)
            .data("donutIndex", i)
            .attr({
                "path": spline,
                "fill": that.getColor(i),
                "stroke": '#ffffff'
            })
            .mouseover(mouseOver)
            .mouseout(mouseOut)
            .click(mouseClick);

            //每个donut上显示名称
            ro = (groups[i].startAngle + groups[i].endAngle) * 90 / Math.PI;
            a = 0.5 * ((groups[i].startAngle + groups[i].endAngle) - Math.PI);
            nameX = (conf.radius + 2 * conf.protrude) * Math.cos(a);
            nameY = (conf.radius + 2 * conf.protrude) * Math.sin(a);
            nameStr = "T" + ((conf.width - that.xOffset) / 2 + that.xOffset) + "," + conf.height / 2 + "R" + ro + "T" + nameX + "," + nameY;

            var line = that.canvas.path("M,0,-" + conf.protrude + "L0," + conf.protrude).transform(nameStr).translate(0, conf.protrude + 9);
            var nameTag = that.canvas.text().attr("font", "18px Verdana").attr("text", that.groupNames[i]).transform(nameStr);

            donutEle.data('text', tips).data('click', false).data('nameTag', nameTag).data('line', line);
            that.donutGroups.push(donutEle);
        }

        if (conf.legend) {
            this.legend();
        }
    };

    /**
     * 绘制图例
     */
    Pie.prototype.legend = function () {
        var that = this;
        var conf = this.defaults;
        var paper = this.canvas;
        var legendArea = this.legendArea;
        this.rectBn = paper.set();
        var rectBn = this.rectBn;
        this.underBn = [];
        var underBn = this.underBn;
        for (var i = 0, l = this.groups.length; i < l; i++) {
            //底框
            underBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
                "fill": "#ebebeb",
                "stroke": "none"
                //"r": 3
            }).hide());
            //色框
            paper.rect(legendArea[0] + 10 + 3, legendArea[1] + 10 + (20 + 3) * i + 6, 16, 8).attr({
                "fill": this.getColor(i),
                "stroke": "none"
            });
            //文字
            paper.text(legendArea[0] + 10 + 3 + 16 + 8, legendArea[1] + 10 + (20 + 3) * i + 10, this.groupNames[i]).attr({
                "fill": "black",
                "fill-opacity": 1,
                "font-family": "Verdana",
                "font-size": 12,
                "text-anchor": "start"
            });
            //选框
            rectBn.push(paper.rect(legendArea[0] + 10, legendArea[1] + 10 + (20 + 3) * i, 180, 20).attr({
                "fill": "white",
                "fill-opacity": 0,
                "stroke": "none"
                //"r": 3
            }));
        }
        rectBn.forEach(function (d, i) {
            // TODO 这里的事件建议采用事件委托
            d.mouseover(function () {
                if (!that.donutGroups[i].data("click")) {
                    underBn[i].attr('opacity', 0.5);
                    underBn[i].show();
                }
            }).mouseout(function () {
                if (!that.donutGroups[i].data("click")) {
                    underBn[i].hide();
                }
            });
            d.click(function () {
                var a = 0.5 * ((that.groups[i].startAngle + that.groups[i].endAngle) - Math.PI);
                var nameX = conf.protrude * Math.cos(a);
                var nameY = conf.protrude * Math.sin(a);
                if (!that.donutGroups[i].data("click")) {
                    if (that.click === 0) {
                        that.donutGroups.forEach(function (d) {
                            if (!d.data('click')) {
                                d.attr('fill-opacity', 0.5);
                            }
                        });
                    }
                    underBn[i].attr('opacity', 1).show();
                    that.donutGroups[i].data("click", true).attr('fill-opacity', 1);
                    that.donutGroups[i].data('nameTag').translate(0, - conf.protrude);
                    that.donutGroups[i].data('line').translate(0, - conf.protrude);
                    that.donutGroups[i].translate(nameX, nameY);
                    that.click += 1;

                } else if (that.donutGroups[i].data("click")) {
                    that.donutGroups[i].data('nameTag').translate(0, conf.protrude);
                    that.donutGroups[i].data('line').translate(0, conf.protrude);
                    that.donutGroups[i].translate(-nameX, - nameY);
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

    /**
     * 对原始数据进行处理
     * @param {Array} table 将要被绘制成饼图的二维表数据
     */
    Pie.prototype.setSource = function (table) {
        this.groupNames = _.pluck(table, 0);
        this.groupValue = _.pluck(table, 1).map(function (item) {
            return parseFloat(item);
        });
    };

    /**
     * 创建pie布局
     */
    Pie.prototype.layout = function () {
        var that = this;

        that.canvas.clear();

        var acc = 0;
        this.sum = DataV.sum(this.groupValue);
        var sum = this.sum;
        this.groups = this.groupValue.map(function (item, index) {
            var startAngle = 2 * acc * Math.PI / sum;
            acc += item;
            var endAngle = 2 * acc * Math.PI / sum;
            var ret = {
                index: index,
                value: item,
                startAngle: startAngle,
                endAngle: endAngle
            };
            return ret;
        });
    };

    return Pie;
});