/*!
 * datavjs - lib/charts/level.js
 *
 * 层级图
 * 
 * Copyright(c) 2013 hlqf <daishengxiang@gmail.com>
 * MIT Licensed
 */
(function (name, def) {
  if (typeof define === 'function') {
    define(def);
  } else {
    this[name] = def(function (id) {
      return this[id];
    });
  }
})('LevelChart', function (require) {
  var DataV = require('DataV');

  //init level chart,set default params
  var LevelChart = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = 'LevelChart';
      this.node = this.checkContainer(node);

      this.defaults.labels = [ '低', '偏低', '中', '偏高', '高' ];
      this.defaults.width = 235;
      this.defaults.height = 200;

      this.setOptions(options);
    }
  });

  LevelChart.prototype.drawGridConsume = function (r, x, y, w, h, wv, hv, color, options) {
    color = color || "#999999";
    var path = [];
    var conf = this.defaults;
    var rowHeight = h / hv,
      columnWidth = w / wv;
    for (var i = 0; i < hv; i++) {
      if (i === hv - 1) {
        r.path(["M", Math.round(x) - 0.5, Math.round(y + i * rowHeight) - 0.5, "H", Math.round(x + w) + 0.5]).attr({'stroke-width': 1, 'stroke': '#999999'});
        continue;
      }
      path = path.concat(["M", Math.round(x) + 0.5, Math.round(y + i * rowHeight) + 0.5, "H", Math.round(x + w) + 0.5]);
    }
    for (i = 0; i < wv; i++) {
      path = path.concat(["M", Math.round(x + i * columnWidth) + 0.5, Math.round(y) + 0.5, "V", Math.round(y + h) + 0.5]);
    }
    if ((!options || !options.tipImg) && (!options || !options.nobase)) {
      r.image('http://img03.taobaocdn.com/tps/i3/T1aS6GXhFgXXcm5wzo-77-19.png', x + w - 80, 0, 77, 19);
    } else if (!!options.tipImg) {
      r.image(options.tipImg, x + w - 80, 0, 77, 19);
    }
    return r.path(path.join(",")).attr({ stroke: color, opacity: 0.7, 'stroke-width': 1});
  }

  LevelChart.prototype.createCanvas = function () {
      var conf = this.defaults;
      this.canvas = new Raphael(this.node, conf.width, conf.height);
  };

  LevelChart.prototype.render = function (data, options) {

    if (options && options.labels) {
      var labels = options.labels;
    } else {
      var labels = this.defaults.labels;
    }
    // var labesl = options.labels ? options.labels : this.defaults.labels;
    var nobase = options && options.nobase;
    var nopercent = options && options.nopercent;

    var conf = this.defaults;
    var $node = $(this.node);
    var width = conf.width;
    var height = conf.height;
    var leftGutter = 10;
    var bottomGutter = 5;
    var topGutter = 20;
    var padding = 10;

    var r = Raphael($node[0], width, height);
    var localMax = Math.max.apply(Math, data);
    var globalMax = options && options.max || localMax || 100;
    var globalBase = options && options.globalBase || [8, 17, 50, 17, 10];
    
    if (!nobase && globalMax < 50) {
      globalMax = 50;
    }

    this.drawGridConsume(r, 0, topGutter + 0.5, width, height - topGutter - bottomGutter, 0, 6, '#cccbbb', options);

    var globalBasePlot = [];

    var columnWidth = Math.floor(width / labels.length) - leftGutter - padding;
    var columnHeight = Math.floor(height - topGutter - bottomGutter);

    //判断是否需要分条
    var is2dFlag = 0;
    for (var x = 0; x < data.length; x++) {
      if (Object.prototype.toString.call(data[x]) === '[object Array]') {
        is2dFlag = 1;
      }
    }

    if (is2dFlag === 1){ //当出现多维同柱对比时
      var x = [];
      var y = [];
      var tmpMax = [];
      // 重赋多维基数默认值
      globalBase = Object.prototype.toString.call(globalBase) === '[object Array]' ? globalBase : [[ 10, 20, 30, 10, 15 ], [ 15, 28, 40, 20, 20 ]];

      var globalMax;
      for (var n in data) {
        //获得多维数据中的最大值
        for (var i = 0; i < data[n].length; i++) {
          tmpMax.push(Math.max.apply(Math, data[n]));
        }
        globalMax = Math.max.apply(Math, tmpMax);
      }

      for (var n in data) {
        var color = [];
        for (var i = 0; i < data[n].length; i++) {
          var k = i + n * data[n].length;
          var dwidth = columnWidth / data.length;

          x.push(Math.floor((columnWidth + leftGutter + padding) * i) + 10 + dwidth * n);
          var dheight = Math.ceil((columnHeight - 18) * (data[n][i] / globalMax)) * 0.75;
          y.push(columnHeight * 6 / 7 - dheight + topGutter - 5.5);
          var attr = {'font-family': 'Arial', 'font-size': 12, 'fill': '#666666'};
          var value = data[n][i];

          r.text(x[i] + columnWidth / 2, height - topGutter, labels[i]).attr(attr);
          var rect = r.rect(x[k], y[k], dwidth, dheight);

          var unit = '';
          if (!nopercent) {
            unit = '%';
          }

          var text = r.text(x[k] + columnWidth / 4, y[k] - 10, value + unit).attr({'font-size': 10});
          if (n <= 2) {
            color = ['#3fa9f5','#ff89a3'];
          } else {
            var c = 'rgb(300, 200, ' + n * 100 + ')';
            color.push(c);
          }
          
          rect.attr({'fill': color[n], 'stroke': color[n], 'opacity': 0.7});

          rect.indexI = i;
          rect.indexN = n;
          if (!nobase) {
            // hover效果
            rect.hover(function () {
              var li = this.indexI + this.indexN * labels.length; //标记在globalBase中当前柱状坐标的下标
              this.attr({'opacity': 1.0});
              var maxLen = labels.length - 1;
              var x = globalBasePlot[this.indexI][0] + columnWidth;
              //处理最右侧的元素
              x = this.indexI === maxLen ? x - columnWidth * 2 - 7 : x;
              var y = globalBasePlot[li][1] - 10;
              this.tooltipImage = r.image('http://img01.taobaocdn.com/tps/i1/T15H_GXiJjXXc.LCDe-40-21.gif', x, y, 40, 21);
              if (this.indexI === maxLen) {
                this.tooltipImage.rotate(180);
                x -= maxLen;
              }
              this.tooltipText = r.text(x + 23, y + 11, globalBase[this.indexN][this.indexI] + '%').attr({'fill': '#fff', 'font-size': 12});  
            }, function () {
              this.attr({'opacity': 0.7});
              if (this.tooltipImage) {
                this.tooltipImage.remove();
              }
              if (this.tooltipText) {
                this.tooltipText.remove();
              }
            });
            
            // 计算全网基数坐标
            globalBasePlot[k] = [x[k], columnHeight * 6 / 7
              - (Math.ceil((columnHeight - 18) * (globalBase[n][i] / globalMax)) * 0.75) + topGutter - 6,
              x[k] + columnWidth / 2 , columnHeight * 6 / 7
                - (Math.ceil((columnHeight - 18) * (globalBase[n][i] / globalMax)) * 0.75) + topGutter - 6];
          }
        }
      }
    } else { //当为单条时
      for (var i = 0; i < data.length; i++) {
        // 计算依赖的值
        var x = Math.floor((columnWidth + leftGutter + padding) * i) + 10;
        var dwidth = columnWidth;
        // 与全局最高值之间做变换
        var dheight = Math.ceil((columnHeight - 18) * (data[i] / globalMax)) * 0.75;
        var y = columnHeight * 6 / 7 - dheight + topGutter - 6;
        var attr = {'font-family': 'Arial', 'font-size': 12, 'fill': '#666666'};
        var value = data[i];

        // 画坐标轴
        r.text(x + columnWidth / 2, height - topGutter, labels[i]).attr(attr);
        // 画柱状
        var rect = r.rect(x, y, dwidth, dheight);
        var unit = '';
        if (!nopercent) {
          unit = '%';
        }
        var text = r.text(x + columnWidth / 2, y - 10, value + unit);
        rect.attr({fill: '#3fa9f5', 'stroke': '#3fa9f5', 'opacity': 0.7});
        attr['font-size'] = 14;
        text.attr(attr);
        rect.indexI = i;
        if (!nobase) {
          // hover效果
          rect.hover(function () {
            this.attr({'opacity': 1.0});
            var maxLen = labels.length - 1;
            var x = globalBasePlot[this.indexI][0] + columnWidth;
            //处理最右侧的元素
            x = this.indexI === maxLen ? x - columnWidth * 2 - 7 : x;
            var y = globalBasePlot[this.indexI][1] - 10;
            this.tooltipImage = r.image('http://img01.taobaocdn.com/tps/i1/T15H_GXiJjXXc.LCDe-40-21.gif', x, y, 40, 21);
            if (this.indexI === maxLen) {
              this.tooltipImage.rotate(180);
              x -= maxLen;
            }
            this.tooltipText = r.text(x + 23, y + 11, globalBase[this.indexI] + '%').attr({'fill': '#fff', 'font-size': 12});
          }, function () {
            this.attr({'opacity': 0.7});
            if (this.tooltipImage) {
              this.tooltipImage.remove();
            }
            if (this.tooltipText) {
              this.tooltipText.remove();
            }
          });
          // 计算全网基数坐标
          globalBasePlot[i] = [x, columnHeight * 6 / 7
            - (Math.ceil((columnHeight - 18) * (globalBase[i] / globalMax)) * 0.75) + topGutter - 6,
            x + columnWidth , columnHeight * 6 / 7
              - (Math.ceil((columnHeight - 18) * (globalBase[i] / globalMax)) * 0.75) + topGutter - 6];
        }
      }
    }
      
      if (!nobase && is2dFlag === 0) {
        // 画全网基数线,单维时
        var globalBasePath = [];
        for (var i = 1; i < globalBasePlot.length; i++) {
          globalBasePath.push('M' + globalBasePlot[i - 1].join(' ') + 'L' + globalBasePlot[i].join(' '));
        }
        r.path(globalBasePath.join(",")).attr({'stroke': '#999999'});
      } else {
        //多维时的全网基线之间不相连接,只画在柱状上
        var globalBasePath = [];
        for (var i = 1; i < globalBasePlot.length + 1; i++) {
          globalBasePath.push('M' + globalBasePlot[i - 1].join(' '));
        }
        r.path(globalBasePath.join(",")).attr({'stroke': '#999999', 'stroke-dasharray': '-', 'stroke-width': 2});
      }

    };

    return LevelChart;

});