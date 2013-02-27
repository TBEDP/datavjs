/*global $, _, define */
/*!
 * Stream的兼容定义
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Dag', function (require) {
  var DataV = require('DataV');

  var Dag = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Dag";
      this.node = this.checkContainer(node);
      this.defaults = {};
      // Properties
      this.defaults.width = 500;
      this.defaults.height = 500;

      // Data bind
      /**
       * 柱纬度
       */
      this.dimension.name = {
        type: "string",
        required: true,
        index: 0
      };
      /**
       * 横向纬度
       */
      this.dimension.deps = {
        type: "string",
        required: true,
        index: 1
      };

      /**
       * 横向纬度
       */
      this.dimension.status = {
        type: "string",
        required: true,
        index: 2
      };
      // 设置选项
      this.setOptions(options);
      // 创建画布
      this.createCanvas(); // this.paper
      // 创建菜单
      this.createMenu(); // this.menu
      // 绑定右键事件
      this.initEvents();
      this.cache = {};
      this.connector = [];
    }
  });

  Dag.prototype.setSource = function (source, map) {
    this.source = source;
    this.map(map);
  };

  Dag.prototype.createMenu = function () {
    var that = this;
    var menu = $('<ul></ul>');
    menu.css({
      position: 'absolute',
      margin: 0,
      padding: 0,
      listStyleType: 'none'
    }).wall();
    var item = $('<li class="view_parent">查看父节点</li>');
    item.click(function () {
      that.showDeps();
      menu.wall();
    });
    var item2 = $('<li>查看子节点</li></ul>');
    item2.click(function () {
      that.showDepents();
      menu.wall();
    });
    var item3 = $('<li>隐藏节点</li></ul>');
    item3.click(function () {
      that.hideNode();
      menu.wall();
    });
    menu.append(item).append(item2).append(item3);
    this.menu = menu;
    $(this.node).append(menu);
  };

  Dag.prototype.initEvents = function () {
    var that = this;

    $(this.paper.canvas).on('contextmenu', function (e) {
      var elem = that.paper.getElementByPoint(e.pageX, e.pageY);
      if (elem && elem.data('name')) {
        that.expand(elem);
      }
      return false;
    }).click(function (e) {
      var elem = that.paper.getElementByPoint(e.pageX, e.pageY);
      if (elem && elem.data('name')) {
        that.toggle(elem);
      }
      that.menu.wall();
    }).dblclick(function (e) {
      // TODO: 双击事件
    });
  };

  /**
   * 找出先前节点
   */
  Dag.prototype.showDeps = function () {
    var that = this;
    var deps = this.getDeps(this.menu.data('name'));
    var node = this.menu.data('node');
    var bbox = node.getBBox();
    var pos = {
      x: bbox.x - 50
    };
    var half = (deps.length - 1) / 2;
    deps.forEach(function (name, i) {
      pos.y = bbox.y + (i - half) * 50;
      var from = that.drawNode(name, pos, node);
      that.drawLine(from, node);
    });
  };

  /**
   * 隐藏节点
   */
  Dag.prototype.hideNode = function () {
    var name = this.menu.data('name');
    var froms = _.filter(this.connector, function (line) {
      return line[0] === name && line[3];
    });
    var tos = _.filter(this.connector, function (line) {
      return line[1] === name && line[3];
    });
    var set = this.cache[name].set;
    if (froms.length === 0 && tos.length === 0) {
      alert("唯一节点，不能隐藏");
    } else {
      if (froms.length === 0) {
        set.hide();
        tos.forEach(function (line) {
          line[2].hide();
          line[3] = false;
        });
      } else if (tos.length === 0) {
        set.hide();
        froms.forEach(function (line) {
          line[2].hide();
          line[3] = false;
        });
      } else {
        alert("还有相关节点，不能隐藏");
      }
    }
  };

  Dag.prototype.showDepents = function () {
    var that = this;
    var depents = this.getDependents(this.menu.data('name'));
    var node = this.menu.data('node');
    var bbox = node.getBBox();
    var pos = {
      x: bbox.x2 + 50
    };
    var half = (depents.length - 1) / 2;
    depents.forEach(function (name, i) {
      pos.y = bbox.y + (i - half) * 50;
      var to = that.drawNode(name, pos, node);
      that.drawLine(node, to);
    });
  };

  /**
   * 找出节点的依赖
   */
  Dag.prototype.getDeps = function (name) {
    var mapping = this.mapping;
    var source = this.source;
    var item = _.find(source, function (item) {
      return item[mapping.name] === name;
    });
    var deps = item ? (item[mapping.deps] || []) : [];
    return deps;
  };

  /**
   * 找出依赖它的节点
   */
  Dag.prototype.getDependents = function (name) {
    var mapping = this.mapping;
    var source = this.source;
    return _.filter(source, function (item) {
      return _.indexOf(item[mapping.deps], name) !== -1;
    }).map(function (item) {
      return item[mapping.name];
    });
  };

  /**
   * 展开右键菜单
   */
  Dag.prototype.expand = function (elem) {
    var name = elem.data('name');
    var menu = this.menu;
    var bbox = elem.getBBox();
    menu.css({
      left: bbox.x + (bbox.width) / 2,
      top: bbox.y + (bbox.height) / 2
    })
    .unwall()
    .data('name', name)
    .data('node', elem);
  };

  Dag.prototype.toggle = function (elem) {
    var name = elem.data('name');
    var mapping = this.mapping;
    var node = _.find(this.source, function (item) {
      return item[mapping.name] === name;
    });
    if (node[mapping.status]) {
      node[mapping.status] = false;
      this.cache[name].set[1].attr('fill', '#f00');
    } else {
      node[mapping.status] = true;
      this.cache[name].set[1].attr('fill', '#0f0');
    }
  };

  /**
   * 显示已经绘制的节点
   */
  Dag.prototype.showNode = function (name, direction) {
    this.cache[name].set.show();
    // 显示连接线
    var line = _.find(this.connector, function (item) {
      var index = direction === 'to' ? 0 : 1;
      return item[index] === name;
    });
    if (line) {
      line[2].show();
      line[3] = true;
    }
  };

  /**
   * 绘制节点
   */
  Dag.prototype.drawNode = function (nodeName, opts, direction) {
    var that = this;
    var item = _.find(this.source, function (item) {
      return item[that.mapping.name] === nodeName;
    });
    var name = item ? item[that.mapping.name] : 'unkown';

    if (this.cache[name]) {
      this.showNode(name, direction);
      return this.cache[name].set[0];
    }

    var pos = {
      x: 250,
      y: 250
    };

    if (opts) {
      _.extend(pos, opts);
    }

    var paper = this.paper;
    var set = paper.set();
    var text = paper.text(pos.x, pos.y, name);
    text.data('name', name);
    // Creates circle at x = 50, y = 40, with radius 10
    var width = text.getBBox().width;
    var radius = width / 2 + (width > 50 ? 2 : 5);
    var circle = paper.circle(pos.x, pos.y, radius);
    circle.toBack();
    // Sets the stroke attribute of the circle to white
    circle.attr("fill", "red").attr("stroke", "#000");
    this.cache[name] = {
      pos: pos,
      set: set.push(text, circle)
    };
    return text;
  };

  Dag.prototype.drawLine = function (from, to) {
    var paper = this.paper;
    var pos = from.getMidpoint();
    var mid = to.getMidpoint();
    var path = "M" + pos.x + "," + pos.y + "L" + mid.x + "," + mid.y;
    var line = paper.path(path).toBack();
    this.connector.push([from.data('name'), to.data('name'), line, true]);
  };

  /**
   * 渲染初始节点
   */
  Dag.prototype.render = function (name) {
    this.drawNode(name);
  };

  return Dag;
});
