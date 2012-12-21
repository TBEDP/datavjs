Getting Start
================
此处以Pie图为例。

## 引入依赖

```
// 依赖
path/to/deps/compatible.js
path/to/deps/d3.min.js
path/to/deps/raphael.min.js
path/to/deps/eventproxy.js
path/to/deps/underscore-1.4.2.js
path/to/deps/jquery-1.7.1.min.js
// DataV
path/to/datav.js
// Pie
path/to/charts/pie.js
```
问题？[依赖库也太多了吧？]()
## 准备数据

```
var source = [
  '北京', 50265
  '上海', 60555
  '广州', 38544
  '深圳', 27276
  '西安', 20506
  '昆明', 26916
  '武汉', 17636
  '拉萨', 977
  '哈尔滨', 10406
  '乌鲁木齐', 6695
];
```
## 渲染图表

```
// 初始化组件
var pie = new Pie("container", {width: 1000, tag: true});
// 添加数据源
pie.setSource(source);
// 渲染
pie.render();
```

## 结果
![Pie图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/pie.jpg)