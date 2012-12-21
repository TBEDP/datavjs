/*global Raphael, d3, $, define */
/*!
 * Diff的兼容性定义
 */
;(function (name, definition) {
    if (typeof define === 'function') { // Module
        define(definition);
    } else { // Assign to common namespaces or simply the global object (window)
        this[name] = definition(function (id) {
            return this[id];
        });
    }
})('Diff', function (require) {
    var DataV = require('DataV');

    /**
     * 构造函数
     * @param {Object} node 表示在html的哪个容器中绘制该组件
     * @param {Object} options 为用户自定义的组件的属性，比如画布大小
     */
    var Diff = DataV.extend(DataV.Chart, {
        type: "Diff",
        initialize: function (node, options) {
            this.node = this.checkContainer(node);

            //图的大小设置
            this.defaults.width = 900;
            this.defaults.height = 800;

            //设置用户指定的属性
            this.setOptions(options);

            //创建画布
            this.createCanvas();
        }
    });

    /**
     * 创建画布
     */
    Diff.prototype.createCanvas = function () {
        this.canvas = new Raphael(this.node, this.defaults.width, this.defaults.height);
    };

    /**
     * 绘制弦图
     */
    Diff.prototype.render = function () {
        this.layout();
    };

    // 计算顺序的相似度
    var diffMap = function (list1, list2) {
      var map = [];
      var hit = 0;
      var lastIndex = -1;
      for (var i = 0; i < list1.length; i++) {
        var index = _.indexOf(list2, list1[i]);
        if (index === -1) {
          continue;
        } else {
          if (index > lastIndex) {
            lastIndex = index;
            map.push([i, index]);
          }
          hit++;
        }
      }
      console.log(map);
      console.log(map.length / list1.length);
      console.log(hit / list1.length);
      return map;
    };

    /**
     *对原始数据进行处理
     * @param {Array} table 将要被绘制成饼图的二维表数据
     */
    Diff.prototype.setSource = function (table1, table2) {
        this.rawData = [table1, table2];
        this.diffMap = diffMap(table1, table2);
    };

    /**
     *创建chord布局
     */
    Diff.prototype.layout = function () {
        var that = this;
        var canvas = that.canvas;

        var paddingLeft = 10;
        var paddingTop = 10;
        var height = 20;
        var distance = 50;
        var width = (this.defaults.width - 2 * paddingLeft - distance) / 2;

        for (var j = 0, k = this.rawData.length; j < k; j++) {
            var maped = _.pluck(this.diffMap, j);
            for (var i = 0, l = this.rawData[j].length; i < l; i++) {
                canvas.rect(paddingLeft + j * (width + distance), paddingTop + height * i, width, height).attr({fill: _.indexOf(maped, i) !== -1 ? "#00ff00" : "#ff0000"});
                canvas.text(paddingLeft + j * (width + distance), paddingTop + height * i + height / 2, this.rawData[j][i]).attr({'text-anchor': 'start'});
            }
        }
        for (var i = 0, l = this.diffMap.length; i < l; i++) {
            var line = this.diffMap[i];
            canvas.path("M" + (paddingLeft + width) + ' ' + (paddingTop + height * line[0] + height / 2) + "L" + (paddingLeft + width + distance) + " " + (paddingTop + height * line[1] + height / 2)).attr({stroke: '#00ff00'});
        }
    };

    return Diff;
});