子弹图简介
========

子弹图(bullet)通常用于在有限的空间内展示一个数值区间内的三个维度的信息。通常有background(背景), measure(度量), marker(标记)3个维度。[bullet wiki](https://en.wikipedia.org/wiki/Bullet_graph)。绘制bullet的javascript代码如下：

```javascript
//创建bullet对象，包含于id为"chart"的dom结点，宽、高分别为950、500px。
var bullet = new Bullet("chart", {"width": 950, "height": 500});
//设置数据
bullet.setSource({
    title: "Revenue",
    subtitle: "US.$(1,000s)", 
    ranges: [0, 150, 225, 300],
    measures: [270],
    markers: [249],
    rangeTitles: ["bad", "satisfactory", "good"],
    measureTitles: ["value: 270"],
    markerTitles: ["mean : 249"] 
});
//渲染
bullet.render();
```

bullet各种选项的含义，各种样式的设置等请参考exmaple目录中的bullet的demo示例。 

