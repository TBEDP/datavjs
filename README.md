DataV.js
============
DataV.js是一个JavaScript的数据可视化库，致力于推动数据可视化在普通业务的落地应用。我们的目标是：
> 凡有数据在处，皆能可视化

- [API文档](http://tbedp.github.com/datavjs/index.html)

## Examples
- [Pie](http://datavlab.org/datavjs/#pie)  
![Pie图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/pie.jpg)
- [Treemap](http://datavlab.org/datavjs/#treemap)  
![Treemap图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/treemap.jpg)
- [Tree](http://datavlab.org/datavjs/#tree)  
![Tree图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/tree.jpg)
- [Stream](http://datavlab.org/datavjs/#stream)  
![Stream图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/stream.jpg)
- [ScatterplotMatrix](http://datavlab.org/datavjs/#scatterplotMatrix)  
![ScatterplotMatrix图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/scatterplotMatrix.jpg)
- [Force](http://datavlab.org/datavjs/#force)  
![Force图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/force.jpg)
- [Matrix](http://datavlab.org/datavjs/#matrix)  
![Matrix图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/matrix.jpg)
- [Bubble](http://datavlab.org/datavjs/#bubble)  
![Bubble图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/bubble.jpg)
- [Chord](http://datavlab.org/datavjs/#chord)  
![Chord图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/chord.jpg)

## Quick start
此处以Pie图为例。

### 引入依赖

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
### 准备数据

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
### 渲染图表

```
// 初始化组件
var pie = new Pie("container", {width: 1000, tag: true});
// 添加数据源
pie.setSource(source);
// 渲染
pie.render();
```

### 结果
![Pie图](https://raw.github.com/TBEDP/datavjs/butterfly/doc/assets/pie.jpg)

## Plan
* [Phase 2: Butterfly](https://github.com/TBEDP/datavjs/blob/master/docs/DataV%E7%AC%AC%E4%BA%8C%E6%9C%9F%E8%AE%A1%E5%88%92%E8%9D%B4%E8%9D%B6.md). 欢迎Fork，欢迎Contribute.

## Requirements:
* [D3.js](https://github.com/mbostock/d3).
* [Raphael.js](http://raphaeljs.com/).
* [Sea.js](https://github.com/seajs/seajs).

## Learn more?
- The example site: <http://datavlab.org/datavjs/>
- [API Docs](http://tbedp.github.com/datavjs/)

## Contributors
Thanks goes to the people who have contributed code to this library, see the [GitHub Contributors](https://github.com/TBEDP/datavjs/graphs/contributors) page.

Below is the output from `git-summary`

```
 project  : datavjs
 repo age : 8 weeks
 active   : 34 days
 commits  : 116
 files    : 155
 authors  : 
    87  Jackson Tian            75.0%
    14  jdk137                  12.1%
     5  Theseue                 4.3%
     4  wxtheseue               3.4%
     2  unknown                 1.7%
     2  xie cong                1.7%
     2  xiecong                 1.7%

```

## License
DataV.js is available under the [MIT License](https://github.com/TBEDP/datavjs/blob/master/MIT-License).
