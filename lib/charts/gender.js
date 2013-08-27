/*!
 * datavjs - lib/charts/gender.js
 *
 * Gender chart, more demos, @see http://fengmk2.github.io/adc2013/gender.html
 * 
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

(function (name, definition) {
  if (typeof define === 'function') {
    define(definition);
  } else {
    this[name] = definition(function (id) { return this[id];});
  }
})('GenderChart', function (require) {
  var DataV = require('DataV');

  /**
   * Create a Gender chart.
   * 
   * @param {Object} container, jQuery object
   * @param {Object} options
   *  - {String} maleColor
   *  - {String} femalColor
   * @return {Chart}
   */
  var GenderChart = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "GenderChart";
      this.node = this.checkContainer(node);

      this.defaults.maleColor = '#3fa9f5';
      this.defaults.femaleColor = '#ff88a2';
      this.defaults.maleText = '男';
      this.defaults.femaleText = '女';

      this.setOptions(options);
    }
  });

  // 画扇区
  var rad = Math.PI / 180;

  function sector(cx, cy, r, paper, startAngle, endAngle, params) {
    var x1 = cx + r * Math.cos(-startAngle * rad),
      x2 = cx + r * Math.cos(-endAngle * rad),
      y1 = cy + r * Math.sin(-startAngle * rad),
      y2 = cy + r * Math.sin(-endAngle * rad);
    return paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
  }

  /**
   * 设置男女比例数据
   * @param {Array} data, e.g.: `[45.123, 54.787]`
   * @return {this}
   */
  GenderChart.prototype.setSource = function (data) {
    this.rawData = data;
    return this;
  };

  /**
   * 男女比例
   * @param {Array} data, e.g.: `[45.123, 54.787]`
   */
  GenderChart.prototype.render = function (data) {
    data = data || this.rawData;

    // 放大男女到100%
    if (data.length !== 2) {
      return this;
    }
    var total = data[0] + data[1];
    var male = Math.round(data[0] / total * 100);
    var female = 100 - male;
    if (total === 0) {
      male = 0;
      female = 0;
    }
    var $node = $(this.node);
    var width = $node.width();
    var height = $node.height();
    var options = this.defaults;
    var r = new Raphael(this.node, width, height);
    var cx = width / 2;
    var cy = height / 2;
    var cr = (cx > cy ? cy : cx) - 25;

    // 要先画两个角落的图片，以遮住图片中白色的部分
    if (male > 0) {
      // http://img3.tbcdn.cn/tps/i3/T1L9zDXd4qXXXAwuzj-56-58.png => assets/images/male_tips.png
      r.image('http://img3.tbcdn.cn/tps/i3/T1L9zDXd4qXXXAwuzj-56-58.png', 
        cx + cr - 38, 
        cy - cr - 12, 
        50, 51).rotate(-3);
    }

    if (female > 0) {
      // http://img4.tbcdn.cn/tps/i4/T1aGvDXjXoXXbcKz6j-57-59.png => assets/images/female_tips.png
      // image(src, x, y, w, h)
      r.image('http://img4.tbcdn.cn/tps/i4/T1aGvDXjXoXXbcKz6j-57-59.png', 
        cx - cr - 57 / 2 + 19, 
        cy + cr - 59 / 2 - 12, 50, 51).rotate(-5);
      var femaleValue = female;
      if (femaleValue < 3.2) {
        femaleValue = 3.2;
      }
      var angleFemale = femaleValue / 100 * 360 - 0.01;
      if (angleFemale === 360) {
        angleFemale -= 0.01; //fix sector 360 bug
      }
      var femaleSec = sector(cx, cy, cr, r, 180 - angleFemale / 2, 180 + angleFemale / 2, 
        {fill: options.femaleColor, stroke: 'none'});
      femaleSec.rotate(-45, cx, cy);
    }
    if (male > 0) {
      var maleValue = male;
      if (maleValue > 96.8 && maleValue !== 100) {
        maleValue = 96.8;
      } else if (maleValue < 3.2) {
        maleValue = 3.2;
      }
      var angleMale = maleValue / 100 * 360;
      if (angleMale === 360) {
        angleMale -= 0.01; //fix sector 360 bug
      }
      var maleSec = sector(cx, cy, cr, r, -angleMale / 2, angleMale / 2, 
        {fill: options.maleColor, stroke: 'none'});
      maleSec.rotate(-45, cx, cy);
    }

    r.circle(cx, cy, cr - 20).attr({fill: '#ffffff', stroke: 'none'});

    // 中间的tip, http://img1.tbcdn.cn/tps/i4/T1xmPDXh8nXXaDpu6k-59-61.png => assets/images/sex_tips.png
    r.image('http://img1.tbcdn.cn/tps/i4/T1xmPDXh8nXXaDpu6k-59-61.png', cx - 29.5, cy - 30.5, 59, 61);
    // 两侧的说明
    var fontStyle = {
      labelM: {'font-size': '14px', fill: options.maleColor},
      numberM: {'font-size': '30px', fill: options.maleColor},
      percentM: {'font-size': '18px', fill: options.maleColor},
      labelF: {'font-size': '14px', fill: options.femaleColor},
      numberF: {'font-size': '30px', fill: options.femaleColor},
      percentF: {'font-size': '18px', fill: options.femaleColor}
    };
    var labelSize = parseInt(fontStyle.labelM['font-size'], 10);
    var numberSize = parseInt(fontStyle.numberM['font-size'], 10);
    var percentSize = parseInt(fontStyle.percentM['font-size'], 10);
    var halfNumberSize = numberSize / 2;
    // x, y, text
    var center = height / 2 - halfNumberSize + 10;
    var pedding = 0;
    var femaleText = female.toFixed(0);
    if (femaleText.length > 2) {
      pedding = 5;
      fontStyle.percentM['font-size'] = fontStyle.percentF['font-size'] = parseInt(percentSize * 0.9, 10) + 'px';
      fontStyle.numberM['font-size'] = fontStyle.numberF['font-size'] = parseInt(numberSize * 0.9, 10) + 'px';
    }
    r.text(10, center - labelSize - 10, options.femaleText).attr(fontStyle.labelF);
    r.text(18, center, female.toFixed(0)).attr(fontStyle.numberF);
    r.text(44 + pedding, center + 3, '%').attr(fontStyle.percentF);

    var maleText = male.toFixed(0);
    pedding = 0;
    if (maleText.length > 2) {
      pedding = 3;
      fontStyle.percentF['font-size'] = fontStyle.percentM['font-size'] = parseInt(percentSize * 0.9, 10) + 'px';
      fontStyle.numberF['font-size'] = fontStyle.numberM['font-size'] = parseInt(numberSize * 0.9, 10) + 'px';
    }
    r.text(width - 36, center, maleText).attr(fontStyle.numberM);
    r.text(width - 10 + pedding, center + 3, '%').attr(fontStyle.percentM);
    r.text(width - 10 + pedding, center + labelSize + 10, options.maleText).attr(fontStyle.labelM);

    return this;
  };

  return GenderChart;
});
