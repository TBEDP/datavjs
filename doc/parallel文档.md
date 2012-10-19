平行坐标轴简介
=====

平行坐标轴(parallel)通常用来展示一组数据在多个维度上的分布情况以及它们相互之间的关系。每个变量用一条线表示，每个维度用一个坐标轴表示。用户可以设置坐标轴的数据类型（离散数据还是连续数据）以及各坐标轴的相互顺序。鼠标在坐标轴上拖动圈选区间，高亮显示该区间内的线。 绘制parallel的javascript代码如下：

```javascript
//创建parallel对象，包含于id为"chart"的dom结点，宽、高分别为950、500px。
var parallel = new Parallel("chart", {"width": 950, "height": 500});
//设置数据，输入的数据为一个二维数组, 第一项为列名数组。
parallel.setSource(dataSource);
//渲染
parallel.render();
```

更详细的设置坐标轴区间，圈选区域，设置事件响应等请参考exmaple目录中的parallel的demo示例。 

