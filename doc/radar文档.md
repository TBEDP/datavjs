雷达图(Radar)简介
========================
雷达图表现了数据的多维属性。 
## 绘制Force图 
绘制Radar图的javascript代码如下：

```javascript
//创建Radar对象，包含于id为”chart”的dom结点，宽、高分别为700、500px。
var radar = new DataV.Radar("chart"，{“width”: 700, “height”: 500});
//设置radar选项，半径为100。
radar.setOptions({"radius": 100}); //options
//设置数据，输入的数据为一个二维数组。
radar.setSource(source，{name: 0, dim: 1, value: 2}); //source is a 2-d array
//绘制
radar.render();
```
创建Radar对象时，第一个参数是包含Radar的dom结点 或该结点的id， 第二个参数是各种选项，其中最重要的宽和高。 
设置 Radar选项时，可以设置如下属性：

- `width`：画布宽度，默认500px
- `height`：画布高度，默认500px
- `legend`： 是否有图例。默认true。
- `radius` 数字，雷达图半径，默认是画布高度的40%

## 数据说明
本组件的数据输入采用二维表格式。按照如下格式：

```
[
    [Cadillac Eldorado,economy,23],
    [Cadillac Eldorado,cylinders,8],
    [Citroen DS-21 Pallas,economy,0],
    [Citroen DS-21 Pallas,cylinders,4]
]
```

如上数据表示了两种车型的信息。每一行对应与一个数据的一个维度。如汽缸容量，经济程度等。
交互包括：对节点的鼠标悬浮，对图例的点击。
