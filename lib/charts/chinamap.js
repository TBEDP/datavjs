/*global d3, $, define */
/*!
 * Chinamap兼容定义部分
 */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) { return this[id];});
    }
})('Chinamap', function (require) {
    var DataV = require('DataV');

    /*
     * Chinamap构造函数，继承自Chart
     * Options:
     *
     *   - `width` 数字，图片宽度，默认为750，表示图片高750px
     *   - `height` 数字，图片高度，默认为500
     *   - `showBackTag` 布尔值，回退操作导航条是否显示，默认为 true, 显示；设为false则不显示
     *   - `backHeight` 数字，回退操作导航条宽度，默认为20
     *   - `level1BorderWidth` 数字，一级方框的边框宽度，默认为1(1px),不建议修改
     *   - `level2BorderWidth` 数字，二级方框的边框宽度，默认为1(1px)，不建议修改
     *   - `fontSizeRatio` 数字，表示图中文字大小。默认为1.0(1倍), 若设为2.0，字体大小会加倍;
     *   - `customEvent` 函数对象，其中有4个自定义函数。`leafNodeClick` 函数，表示点击叶子节点的事件响应，默认为空函数; `hoverIn` 函数，表示鼠标移进方框的事件响应，默认为空函数; `hoverOut` 函数，表示鼠标移出方框的事件响应，默认为空函数; `mouseover` 函数，表示在方框内移动鼠标的事件响应，默认为设置浮框的内容，可以替换它修改浮框内容; 这些函数可以在创建对象或setOption()时一起设置，也可以通过on函数单独设置。
     *
     * Examples:
     * create chinamap in a dom node with id "chart", width is 500; height is 600px;
     * ```
     * var chinamap = new Chinamap("chart", {"width": 500, "height": 600});
     * ```
     * @param {Object} node The dom node or dom node Id
     * @param {Object} options JSON object for determin chinamap style
     */
    var Chinamap = DataV.extend(DataV.Chart, {
        initialize: function (node, options) {
            this.type = "Chinamap";
            this.node = this.checkContainer(node);

            // Properties
            /*
            this.floatTag;//浮框对象，这是个可操作的对象。
            */
            this.recentViewBox = [];
            this.areaBoxes = {
                //x, y, width, height when projection scale is 4000
                0: [-1174.6445229087194, -1437.3577680805693, 3039.3970214233723, 2531.19589698184],
                65: [-1174.9404317915883, -1136.0130934711678, 1216.4169237052663, 939.4360818385251],
                54: [-1061.2905098655508, -273.40253896102865, 1182.4138890465167, 728.4762434212385],
                15: [81.92106433333947, -1404.5655158641246, 1337.913665139638, 1168.7030286278964],
                63: [-398.0407413665446, -404.86540158240564, 770.5429460357634, 553.4881569694239],
                51: [34.77351011413543, -24.727858097581816, 654.265749584143, 581.5837904142871],
                23: [1185.0861642873883, -1435.9087566254907, 680.9449423479143, 618.3772597960831],
                62: [-197.5222870378875, -631.2015222269291, 884.6861134736321, 734.2542202456989],
                53: [-4.030270169151834, 326.89754492870105, 561.4971786143803, 565.9079094851168],
                45: [444.4355364538484, 524.7911424174906, 490.6548359068431, 384.1667316158848],
                43: [716.7125751678784, 265.3988842488122, 346.1702652872375, 377.50144051998274],
                61: [508.5948583446903, -399.56997062473215, 321.038690321553, 559.1002147021181],
                44: [790.2032875493967, 572.9640361040085, 494.8279567104971, 388.7112686526252],
                22: [1287.5729431804648, -950.943295028444, 504.33243011403374, 354.162667814153],
                13: [940.0156020671719, -646.4007207319194, 325.33903805510784, 477.4542727272415],
                42: [683.8325394595918, 45.82949601748078, 468.66717545627034, 295.2142095820616],
                52: [392.5021834497175, 337.4483828727408, 375.50579966539516, 320.9420464446699],
                37: [1035.7855473594757, -382.19242168799906, 412.5747391303373, 313.152767793266],
                36: [1012.6841751377355, 236.50140310944056, 295.599802392515, 400.86430917822287],
                41: [785.5419798731749, -185.2911232263814, 362.6977821251186, 340.3902676066224],
                21: [1203.0641741691293, -757.0946871553339, 352.71788824534656, 357.71276541155214],
                14: [776.5185040689469, -493.6204506126494, 212.68572802329425, 448.08485211774945],
                34: [1054.014965660052, -80.43770626104327, 295.73127466484925, 352.03731065611606],
                35: [1172.0955040211252, 341.81292779438445, 288.99462739279807, 339.42845011348845],
                33: [1272.1789620983063, 123.46272678646208, 286.17816622252326, 286.73860446060394],
                32: [1125.161343490302, -134.97368204682834, 356.1806346879009, 291.4961628010442],
                50: [497.78832088614774, 127.0051229616378, 291.91221530072164, 280.8880182020781],
                64: [441.193675072408, -376.31946967355213, 183.76989823787306, 293.0024551112753],
                46: [723.8031601361929, 946.050886515855, 183.33374783084207, 147.66048518654895],
                71: [1459.925544038912, 519.7445429876257, 103.06085087505835, 237.80851484008463],
                11: [1031.6052083127613, -530.1928574952913, 103.23943439987329, 114.66079087790081],
                12: [1106.9649995752443, -479.16508616378724, 71.21176554916747, 120.01987096046025],
                31: [1420.334836525578, 71.79837578328207, 70.41721601016525, 81.99461244072737],
                81: [1061.983645387268, 769.0837862603122, 50.65584483626753, 32.17422147262721],
                82: [1043.1350056914507, 798.0786255550063, 5.387452843479423, 7.564113979470676]
            };
            this.mapCache = {};
            this.states = [];
            this.words = [];
            this.projection = function () {}; // d3 map prejection function
            this.getAreaPath = function () {}; // input geojson feature, return area path string

            // Canvas
            this.defaults = {};
            this.defaults.geoDataPath = "";
            this.defaults.width = 750;
            this.defaults.height = 500;
            this.defaults.mapId = "0";

            /*
            this.defaults.fontSizeRatio = 1.0;
            */

            //event
            this.defaults.customEvent = {
                leafNodeClick : function () {},
                hoverIn : function () {},
                hoverOut : function () {},
                mousemove : function () {}
            };

            this.setOptions(options);
            this.createCanvas();
        }
    });

    /**
     * Create dom node relate to chinamap
     */
    Chinamap.prototype.createCanvas = function () {
        var conf = this.defaults,
            canvasStyle,
            container = this.node;

        this.canvas = document.createElement("div");
        canvasStyle = this.canvas.style;
        canvasStyle.position = "relative";
        canvasStyle.width = conf.width + "px";
        canvasStyle.height = conf.height + "px";
        container.appendChild(this.canvas);

        this.paper = new Raphael(this.canvas, conf.width, conf.height);
        //$(this.node).css("opacity", 0.01);

        /*
        this.node.style.position = "relative";
        this.floatTag = DataV.FloatTag()(this.canvas);
        this.floatTag.css({"visibility": "hidden"});
        */

    };


    /**
     * 获取颜色
     * Examples:
     * ```
     * // 获取第二种颜色的渐变色。
     * {mode: "gradient", index: 1}
     * // 获取最深的离散色。
     * {mode: "random", ratio: 0}
     * // 获取最浅的离散色。
     * {mode: "random", ratio: 1}
     * // 获取适中的离散色。
     * {mode: "random", ratio: 0.5}
     * ```
     * @param {Object} colorJson Way to get color from color theme matrix
     * @return {Array} 返回颜色数组
     */
     Chinamap.prototype.getColor = (function () {
        var color = d3.scale.category10();
        return function (d) {
                return color(d.id);
            };
    }());
    /*
    Chinamap.prototype.getColor = function (colorJson) {
        var colorMatrix = DataV.getColor();
        var color;
        var colorStyle = colorJson || {};
        var colorMode = colorStyle.mode || 'default';
        var i, l;

        switch (colorMode) {
        case "multiColorGradient":
            color = (function () {
                var c = [];
                colorMatrix.forEach(function (d, i) {
                    c.push(d[0]);
                });
                return function (ratio) {
                    var index = (c.length - 1) * ratio;
                    var floor = Math.floor(index);
                    var ceil = Math.ceil(index);
                    if (floor === ceil) {
                        return c[floor];
                    } else {
                        return d3.interpolateRgb.apply(null, [c[floor], c[ceil]])(index - floor);
                    }
                };
            }());
            //color = d3.interpolateRgb.apply(null, ["green", "purple"]);
            break;
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
    */

    /*
     * 设置数据源
     * Examples:
     * treemap数据输入的格式可以是二维数组。例如下面的数组表示2000年4个季度的天数。
     * 第1季度下面还列出了1-3月的天数。数组的第一行为四个固定的字符串"ID"，"name"，"size"和"parentID"。
     * 四列数据分别表示层次数据集中各结点的ID，名称，大小和父节点ID。叶子节点必须有大小，根结点不能有父节点ID。各结点的ID、名称必须要有。
     * ```
     *  [
     *      ["ID", "name", "size", "parentID"],
     *      [0, "2000",  ,  ],
     *      [1, "season1",  , 0],
     *      [2, "January", 31, 1],
     *      [3, "February", 29, 1],
     *      [4, "Match", 31, 1],
     *      [5, "season2", 91, 0],
     *      [6, "season3", 92, 0],
     *      [7, "season4", 92, 0]
     *  ]
     * ```
     * 数据还可以是json格式。每个结点都有`name`，如果是父节点则还有`children`，如果为叶节点则还有`size`。以上数组数据对应的json数据如下：
     * ```
     * {
     *   "name": "2000",
     *   "children": [
     *      {
     *       "name": "season1",
     *       "children": [
     *            {"name": "January", "size": 31},
     *            {"name": "February", "size": 29},
     *            {"name": "Match", "size": 31}
     *          ]
     *      },
     *      {"name": "season2", "size": 91},
     *      {"name": "season3", "size": 92},
     *      {"name": "season4", "size": 92},
     *   ]
     * }
     * ```
     * @param {Array|Object} source json or 2-d array
     */
    Chinamap.prototype.setSource = function (source) {
        /*
        if (source instanceof Array) {
            this.rawData = this._arrayToJson(source);
        } else {
            this.rawData = source;
        }
        this.source = this._remapSource(this.rawData);
        this.selectedTreeNodes = [this.source[0]];
        */
    };

    /*!
     * d3 chinamap layout
     */
    Chinamap.prototype.layout = function () {
        /*
        var chinamap = this._createTreemap()
            .sort(function (a, b) { return a.value - b.value; });
        this.nodes = chinamap.nodes(this.treeNodeJson);
        */
        this.projection = d3.geo.albers()
            .origin([105, 30.5])
            .scale(4000);

        this.getAreaPath = d3.geo.path()
            .projection(this.projection);
    };

    /*!
     * 生成绘制路径
     */
    Chinamap.prototype.generatePaths = function () {
        var conf = this.defaults;
        var map = this;
        var states = map.states;
        var words = map.words;
        var projection = map.projection;
        var getAreaPath = map.getAreaPath;
        var mapCache = map.mapCache;
        var recentViewBox = map.recentViewBox;
        var paper = this.paper;
        var areaBoxes = this.areaBoxes;

        var render = function (areaId, json) {
            var getTitle = function (d) {
                return d.properties.name;
            };
            
            var getCallback = function (d) {
                return function () {
                    parseInt(areaId, 10) === 0 
                          ? (function () {
                              if (parseInt(d.properties.childNum, 10) === 1) {
                                 return;
                              }
                              if (typeof mapCache[d.id] === 'undefined') {
                                  d3.json(conf.geoDataPath + d.id + ".json", function(j) {
                                      render(d.id, j);
                                  });
                              } else {
                                      render(d.id);
                              }
                          }()) 
                          : (function () {
                              /*
                              d3.json("./jsonData/0.json", function(j) {
                                  render(0, j);
                              });
                              */
                              render(0);
                          }());
                };
            };
            var getCenterX = function (d) {
                return projection(d.properties.cp)[0];
            };
            var getCenterY = function (d) {
                return projection(d.properties.cp)[1];
            };
            var getText = function (d) {
                return d.properties.name;
            };
        
            //paper.clear();
            states.forEach(function (d, i) {
              d.hide();
            });
            words.forEach(function (d, i) {
              d.hide();
            });
        
            states = map.states = [];
            words = map.words = [];
        
            if (typeof mapCache[areaId] === 'undefined') {//no cache
                cache = mapCache[areaId] = {
                    states: [],
                    words: []
                };
          
                //state
                json.features.forEach(function (d, i) {
                    var state = paper.path(getAreaPath(d)); 
                    state.attr({
                        "fill": map.getColor(d),
                        "stroke": "#fff"
                        });
                    state.click(getCallback(d));
                    states.push(state);
                    state.node.debugName = d.id;
                    cache.states.push(state);
                });
              
                //word
                json.features.forEach(function (d, i) {
                    var word = paper.text(getCenterX(d), getCenterY(d), getText(d));
                    word.attr({
                        "font-family": '"微软雅黑", "宋体"'
                        });
                    word.click(getCallback(d));
                    words.push(word);
                    cache.words.push(word);
                });
          
            } else {//cached 
                //state
                states = mapCache[areaId].states;
                states.forEach(function (d) {
                        d.show();
                });
              
                //word
                words = mapCache[areaId].words;
                words.forEach(function (d) {
                        d.show();
                });
            }
        
            var getStatesBox = function () {
                var box = {};
                var areabox = areaBoxes[areaId];
                box.x = areabox[0];
                box.y = areabox[1];
                box.width = areabox[2];
                box.height = areabox[3];
                box.x2 = areabox[2] + areabox[0];
                box.y2 = areabox[3] + areabox[1];
                return box;
            };
        
            (function trans () {
                var statesBox = getStatesBox();
                var ratio = Math.max(statesBox.width / conf.width, statesBox.height / conf.height);
                var i, l;
                var newBox = [statesBox.x, statesBox.y, statesBox.width, statesBox.height];
                //console.log(newBox[0] + " " + newBox[1] + " " + newBox[2] + " " + newBox[3]);
        
                for (i = 0, l = states.length; i < l; i++) {
                    states[i].attr({
                        "stroke-width": 1 //2 * ratio
                    });
                    words[i].attr({
                        "font-size": Math.round(Math.max(14 * ratio, 1))//14 * ratio + "px"
                    });
                }
                /*
                svg.transition()
                    .duration(750)
                    .attr("viewBox", statesBox.x + ", " + statesBox.y + ", " + statesBox.width + ", " + statesBox.height )
                    .attr("preserveAspectRatio", "xMidYMid meet");
                    */
                var viewBoxAnim = function (oldBox, newBox, time) {
                    var ti = 30;
                    var flag = true;
                    var start = +new Date();
                    var getBox = function (ratio) {
                        var box = [];
                        var i, l;
                        if (ratio >= 1) {
                            return newBox;
                        }
                        for (i = 0, l = oldBox.length; i < l; i++) {
                            box[i] = (newBox[i] - oldBox[i]) * ratio + oldBox[i];
                        };
                        return box;
                    };
                    var getRatio = function () {
                        var t = +new Date();
                        var ratio = (t - start) / time;
                        if (ratio > 1) {
                            ratio = 1;
                        }
                        var easing = function (n) {
                            return Math.pow(n, 1.7);
                        };
                        return easing(ratio);
                    };
                    var anim = function () {
                        if (flag === false) {
                            return;
                        }
                        //not permit new flame
                        flag = false;
                        //set new flame;
                        var ratio = getRatio();
                        var box = getBox(ratio);
                        //draw
                        paper.setViewBox(box[0], box[1], box[2], box[3], true);
                        //console.log(box[0] + " " + box[1] + " " + box[2] + " " + box[3]);
                    
                        //clearInterval; permit new flame;
                        if (ratio >= 1) {
                            clearInterval(interval);
                        }
                        flag = true;
                    };
                    var interval = setInterval(anim, ti);
                };
                if (recentViewBox.length === 0) { // first render 
                    paper.setViewBox(newBox[0], newBox[1], newBox[2], newBox[3], true);
                    $("#chart").css("opacity", 1);
                } else {
                    if (Raphael.vml) {
                        paper.setViewBox(newBox[0], newBox[1], newBox[2], newBox[3], true);
                    } else {
                        viewBoxAnim(recentViewBox, newBox, 750);
                    }
                }
                recentViewBox = newBox;
            }());
        };
        
        d3.json(conf.geoDataPath + conf.mapId + ".json", function(json) {
            render(conf.mapId, json);
        });

    };

    /**
     * 清除画布
     */
    Chinamap.prototype.clearCanvas = function () {
        //this.canvas.innerHTML = "";
        this.paper.clear();
    };

    /**
     * 计算布局位置，并渲染图表
     */
    Chinamap.prototype.render = function (options) {
        this.setOptions(options);
        this.clearCanvas();
        this.layout();
        this.generatePaths();
    };

    /**
     * 设置自定义事件
     */
    Chinamap.prototype.on = function (eventName, callback) {
        if ($.inArray(eventName, ["leafNodeClick", "hoverIn", "hoverOut", "mousemove"]) !== -1) {
            this.defaults.customEvent[eventName] = callback;
        }
    };

    /*!
     * 导出Chinamap
     */
    return Chinamap;
});
