/*global Raphael, d3 */
/*!
 * Bullet的兼容性定义
 */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) { return this[id];});
    }
})('Bullet', function (require) {
    var DataV = require('DataV');
    var Axis = require('Axis');

    /**
     * Bullet构造函数
     * Options:
     *
     *   - `width` 数字，图片宽度，默认为200，表示图片高200px
     *   - `height` 数字，图片高度，默认为80
     *   - `orient` string，图片方向，默认为"horizonal"，表示水平方向。若为"vertical"，则表示垂直方向
     *   - `axisStyle` string, 坐标系类型，默认为"linear"，表示坐标系为线性坐标系。若为"log"，则表示对数坐标系
     *   - `logBase` 数字, 采用对数坐标系时的对数基，默认为Math.E
     *   - `tickDivide` 数字，表示坐标的标尺的分段数，默认为5
     *   - `margin` 数字数组，表示图片上、右、下、左的边距，默认为 [20, 20, 20, 20]
     *   - `centerBarRatio` 数字，表示中间的测度条的高度与背景条高度的比值， 默认为0.3
     *   - `markerWidth` 数字，表示标记条的宽度， 默认为4，单位为像素
     *   - `markerRatio` 数字，表示标记条的高度与背景条高度的比值，默认为0.7
     *   - `titleRatio` 数字，表示子弹图title的高度与背景条高度的比值，默认为0.6，此时title与subtitle的比值
     *   - `backgroundColor` string数组，表示背景条颜色的渐变数组，默认为["#666", "#ddd"],背景条颜色就是这两种颜色的渐变
     *   - `measureColor` string数组，表示测度条颜色的渐变数组，默认为["steelblue", "#B0C4DE"],测度条颜色就是这两种颜色的渐变
     *   - `markerColor` string，表示标记条的颜色，默认为"#000"
     *
     * Examples:
     * ```
     * //Create bullet in a dom node with id "chart", width is 500; height is 600px;
     * var bullet = new Bullet("chart", {
     *     "width": 500,
     *     "height": 600,
     *     "margin": [10, 10, 20, 70]
     * });
     * //Create bullet with log base;
     * var log = new Bullet("chart2", {
     *     width: 300,
     *     height: 60,
     *     margin: [10, 10, 20, 70],
     *     backgroundColor: ["#66f", "#ddf"],
     *     measureColor: ["#000", "#000"],
     *     markerColor: "#44f",
     *     axisStyle: "log",
     *     logBase: 10
     * });
     * ```
     * @param {Mix} node The dom node or dom node Id
     * @param {Object} options options json object for determin stream style.
     */
    var Bullet = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Bullet";
            this.node = this.checkContainer(node);
            // Properties
            this.defaults.orient = "horizonal"; // "horizonal", "vertical"
            this.defaults.axisStyle = "linear"; // "linear", "log"
            this.defaults.logBase = Math.E;
            this.defaults.tickDivide = 5;
            this.defaults.margin = [10, 10, 20, 80];//top, right, bottom, left
            this.defaults.centerBarRatio = 0.3;
            this.defaults.markerWidth = 4;
            this.defaults.markerRatio = 0.7;
            this.defaults.titleRatio = 0.6; //title's text height : subtitle's text height = 6:4
            this.defaults.backgroundColor = ["#666", "#ddd"]; //dark, light
            this.defaults.measureColor = ["steelblue", "#B0C4DE"]; //dark, light
            this.defaults.markerColor = "#000";

            // canvas
            this.defaults.width = 200;
            this.defaults.height = 80;

            this.setOptions(options);
            this.createCanvas();
        }
    });

    /*!
     * 创建画布
     */
    Bullet.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.canvas = new Raphael(this.node, conf.width, conf.height);
    };

    /**
     * 设置数据源
     * Examples:
     * ```
     * bullet.setSource({
     *    title: "Sample",
     *    subtitle: "ratio",
     *    ranges: [0, 0.5, 0.8, 1],
     *    measures: [0.7, 0.9],
     *    markers: [0.6],
     *    rangeTitles: ["below 50%", "top 20% - 50%", "top 20%"],
     *    measureTitles: ["value is 0.7", "value is 0.9"],
     *    markerTitles: ["mean is 0.6"]
     * })
     * ```
     * @param {Object} source 数据源
     */
    Bullet.prototype.setSource = function (source) {
        var conf = this.defaults,
            range,
            axisOrient;
        this.data = source;
        if (conf.orient === "horizonal") {
            axisOrient = "bottom";
            range = [conf.margin[3], conf.width - conf.margin[1]];
        } else if (conf.orient === "vertical") {
            axisOrient = "left";
            range = [conf.height - conf.margin[2], conf.margin[0]];
        }

        if (conf.axisStyle === "linear") {
            this.scale = d3.scale.linear();
        } else if (conf.axisStyle === "log") {
            this.scale = d3.scale.log();
        }

        this.data.min = this.data.ranges[0];
        this.data.max = this.data.ranges[this.data.ranges.length - 1];
        this.scale.domain([this.data.min, this.data.max])
            .range(range);

        if (conf.axisStyle === "linear") {
            this.axis = Axis().scale(this.scale).orient(axisOrient).ticks(conf.tickDivide).domainAttr({"stroke": "none"});
        } else if (conf.axisStyle === "log") {
            this.logScale = d3.scale.linear()
                .domain([Math.log(this.data.min)/Math.log(conf.logBase), Math.log(this.data.max)/Math.log(conf.logBase)])
                .range(range);
            this.axis = Axis()
                .orient(axisOrient)
                .scale(this.logScale)
                .ticks(conf.tickDivide)
                .tickFormat(function (d) {return Math.round(Math.pow(conf.logBase, d));})
                .domainAttr({"stroke": "none"});
        }
    };

    /*!
     * generate bullet dom path
     */
    Bullet.prototype.generatePaths = function () {
        var conf = this.defaults;
        //get color function
        if (conf.backgroundColor) {
            this.color = d3.interpolateRgb.apply(null, [conf.backgroundColor[0], conf.backgroundColor[1]]);
        }
        if (conf.measureColor) {
            this.measureColor = d3.interpolateRgb.apply(null, [conf.measureColor[0], conf.measureColor[1]]);
        }

        if (conf.orient === "horizonal") {
            this.paintHorizonal();
        } else if (conf.orient === "vertical") {
            this.paintVertical();
        }
    };

    /*!
     * paint orient horizonal bullet
     */
    Bullet.prototype.paintHorizonal = function () {
        var conf = this.defaults;
        var paper = this.canvas,
            data = this.data,
            m = conf.margin,
            ranges = [],
            measures = [],
            markers = [],
            rangeTitles = [],
            i,
            l,
            rect,
            titleRatio,
            w,
            h = conf.height - m[0] - m[2],
            left;

        //axis
        this.axis(paper).attr({transform: "t" + 0 + ',' + (conf.height - m[2])});
        //color rect
        ranges = data.ranges;
        if (data.rangeTitles) {
            rangeTitles = data.rangeTitles;
        }
        left = m[3];
        for (i = 0, l = ranges.length - 1; i < l; i++) {
            w = this.scale(ranges[i + 1]) - this.scale(ranges[i]);
            rect = paper.rect(left, m[0], w, h)
                .attr({"stroke": "none",
                        "fill": this.color(l === 1 ? 1 : i / (l - 1)),
                        "title": rangeTitles[i] ? rangeTitles[i] : ""});
            left += w;
        }

        //measure bar
        data.measures.forEach(function (d, i) {
                var mTitles = data.measureTitles;
                var mTitle = mTitles && mTitles[i] ? mTitles[i] : "";
                measures.push({measure: d, measureTitle: mTitle});
                });
        measures.sort(function (a, b) { return d3.ascending(a.measure, b.measure); });
        left = this.scale(data.min);
        for (i = 0, l = measures.length; i < l; i++) {
            value = Math.max(data.min, Math.min(data.max, measures[i].measure));
            w = this.scale(value) - left;
            paper.rect(left,
                    m[0] + h * (1 - conf.centerBarRatio) / 2,
                    w,
                    h * conf.centerBarRatio)
                .attr({"stroke": "none", "fill": this.measureColor(l === 1 ? 1 : i / (l - 1)), "title": measures[i].measureTitle});
            left += w;
        }

        //marker bar
        markers = data.markers;
        for (i = 0, l = markers.length; i < l; i++) {
            paper.rect(this.scale(markers[i]) - conf.markerWidth / 2,
                    m[0] + h * (1 - conf.markerRatio) / 2,
                    conf.markerWidth,
                    h * conf.markerRatio)
                .attr({"stroke": "none", "fill": conf.markerColor,
                        "title": data.markerTitles && data.markerTitles[i] ? data.markerTitles[i] : ""});
        }

        //title
        if (data.title) {
            titleRatio = data.subtitle ? conf.titleRatio : 1;
            this.title = paper.text(m[3] - 5, m[0] + h / 2, data.title)
            .attr({"text-anchor": "end", "font-weight": "bold", "font-size": h * titleRatio * 0.9});
        }

        //subtitle
        if (data.subtitle) {
            this.subtitle = paper.text(m[3] - 5, conf.height - m[2], data.subtitle)
            .attr({"text-anchor": "end", "font-size": h * (1 - conf.titleRatio) * 0.9});
        }
    };

    /*!
     * paint orient vertical bullet
     */
    Bullet.prototype.paintVertical = function () {
        var conf = this.defaults;
        var paper = this.canvas,
            data = this.data,
            m = conf.margin,
            ranges = [],
            measures = [],
            markers = [],
            rangeTitles = [],
            i,
            l,
            rect,
            titleRatio,
            w = conf.width - m[1] - m[3],
            h,
            bottom;

        //axis
        this.axis(paper).attr({transform: "t" + m[3] + ',' + 0});

        //color rect
        ranges = data.ranges;
        if (data.rangeTitles) {
            rangeTitles = data.rangeTitles;
        }
        bottom = conf.height - m[2];
        for (i = 0, l = ranges.length - 1; i < l; i++) {
            h = -this.scale(ranges[i + 1]) + this.scale(ranges[i]);
            rect = paper.rect(m[3], bottom - h, w, h)
                .attr({"stroke": "none",
                        "fill": this.color(l === 1 ? 1 : i / (l - 1)),
                        "title": rangeTitles[i] ? rangeTitles[i] : ""});
            bottom -= h;
        }

        //measure bar
        data.measures.forEach(function (d, i) {
                var mTitles = data.measureTitles;
                var mTitle = mTitles && mTitles[i] ? mTitles[i] : "";
                measures.push({measure: d, measureTitle: mTitle});
                });
        measures.sort(function (a, b) { return d3.ascending(a.measure, b.measure); });
        bottom = this.scale(data.min);
        for (i = 0, l = measures.length; i < l; i++) {
            value = Math.max(data.min, Math.min(data.max, measures[i].measure));
            h = -this.scale(value) + bottom;
            paper.rect(m[3] + w * (1 - conf.centerBarRatio) / 2,
                    bottom - h,
                    w * conf.centerBarRatio,
                    h)
                .attr({"stroke": "none", "fill": this.measureColor(l === 1 ? 1 : i / (l - 1)), "title": measures[i].measureTitle});
            bottom -= h;
        }

        //marker bar
        markers = data.markers;
        for (i = 0, l = markers.length; i < l; i++) {
            paper.rect(m[3] + w * (1 - conf.markerRatio) / 2,
                    this.scale(markers[i]) - conf.markerWidth / 2,
                    w * conf.markerRatio,
                    conf.markerWidth)
                .attr({"stroke": "none", "fill": conf.markerColor,
                        "title": data.markerTitles && data.markerTitles[i] ? data.markerTitles[i] : ""});
        }

        //title
        if (data.title) {
            titleRatio = data.subtitle ? conf.titleRatio : 1;
            m[0] *= 0.9; //some ratio adjust;
            this.title = paper.text((conf.width + m[3] - m[1])/ 2, m[0] * titleRatio / 2, data.title)
            .attr({"text-anchor": "middle", "font-weight": "bold", "font-size": m[0] * titleRatio * 0.8});
        }

        //subtitle
        if (data.subtitle) {
            this.subtitle = paper.text((conf.width + m[3] - m[1])/ 2, m[0] * (1 - (1 - titleRatio) / 2), data.subtitle)
            .attr({"text-anchor": "middle", "font-size": m[0] * (1 - titleRatio) * 0.8});
        }
    };

    /*!
     * clean canvas
     */
    Bullet.prototype.clearCanvas = function () {
        this.canvas.clear();
    };

    /**
     * render bullet
     */
    Bullet.prototype.render = function (options) {
        this.setOptions(options);
        this.generatePaths();
    };

    return Bullet;
});

