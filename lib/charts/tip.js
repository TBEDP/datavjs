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
      this.hidden();
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
    _.each(sorted, function (list, index) {
      that.groupedByType[list[0][that.mapping.type]].finalRank = index + 1;
    });
    this.axis = _.keys(this.groupedByX);
  };

  Tip.prototype.setContent = function (rowIndex, columnIndex) {
    var that = this;
    var getContent = this.defaults.getContent || this.getContent;
    var column = this.groupedByX[this.axis[columnIndex]];
    var obj = column[rowIndex];
    obj.finalRank = this.groupedByType[obj[this.mapping.type]].finalRank;
    obj.rank = _.indexOf(_.map(column, function (item) {
      return item[that.mapping.value];
    }).sort(function (a, b) {
      return a > b ? -1 : 1;
    }), obj[that.mapping.value]) + 1;
    var html = getContent.call(this, obj);
    this.node.html(html);
  };

  Tip.prototype.setCss = function (cssJson) {
    this.node.css(cssJson);
  };

  return Tip;
});