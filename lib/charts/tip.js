/*global Raphael, d3, $, define, _ */
/*!
 * StreamLegend的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Tip', function (require) {
  var DataV = require('DataV');
  //floatTag
  var Tip = DataV.extend(DataV.Chart, {
    initialize: function (container) {
      this.container = container;
      this.node = DataV.FloatTag()(this.container);
      /**
       * 类型纬度
       */
      this.dimension.type = {
        type: "string",
        required: true,
        index: 1
      };
      /**
       * 时间纬度
       */
      this.dimension.x = {
        type: "string",
        required: true,
        index: 0
      };
      /**
       * 值纬度
       */
      this.dimension.value = {
        type: "number",
        required: true,
        index: 2
      };
    },
    getContent: function (obj) {
      return obj[this.mapping.x];
    }
  });
  Tip.prototype.setSource = function (source, map) {
    var that = this;
    this.map(map);
    this.rawData = source;
    this.groupedByX = _.groupBy(source, this.mapping.x);
    this.groupedByType = _.groupBy(source, this.mapping.type);
    var sorted = _.sortBy(this.groupedByType, function (group) {
      return -DataV.sum(group, that.mapping.value);
    });
    this.sorted = sorted;
    _.each(sorted, function (list, index) {
      that.groupedByType[list[0][that.mapping.type]].finalRank = index + 1;
    });
    this.axis = _.keys(this.groupedByX);
  };

  Tip.prototype.render = function () {
    this.hidden();
    this.node.css(this.defaults.tipStyle);
  };

  Tip.prototype.setContent = function (rowIndex, columnIndex) {
    var that = this;
    var conf = this.defaults;
    var getContent = conf.getContent || this.getContent;
    var column = this.groupedByX[this.axis[columnIndex]];
    var values = this.sorted;//_.values(this.groupedByType);
    var types;
    if (!conf.more) {
      types = values;
    } else {
      types = DataV.more(values, conf.level, conf.max, function (remains) {
        var row = [];
        for (var i = 0; i < that.axis.length; i++) {
          var col = {};
          col[that.mapping.type] = conf.moreLabel;
          col[that.mapping.x] = that.axis[i];
          col[that.mapping.value] = NaN;// DataV.sum(_.pluck(remains, i), that.mapping.value);
          col.rate = DataV.sum(_.pluck(remains, i), "rate");
          row.push(col);
        }
        return row;
      });
    }
    var row = types[rowIndex];
    var obj = row[columnIndex];

    var index = _.indexOf(_.map(column, function (item) {
      return item[that.mapping.value];
    }).sort(function (a, b) {
      return a > b ? -1 : 1;
    }), obj[that.mapping.value]);
    obj.rank = index === -1 ? NaN : index + 1;
    var html = getContent.call(this, obj);
    this.node.html(html);
  };

  return Tip;
});
