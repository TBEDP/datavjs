弦图(Chord)简介
========================
弦图通常用来展示多个节点间的连结关系。它使用环内的弦链接外圈的元素，以表示外圈元素之间的关联性。
## 绘制弦图
绘制弦图的javascript代码如下：

```javascript
//创建Chord对象，包含于id为”chart”的dom结点，宽、高分别为700、500px。
var chord = new DataV.Chord("chart", {“width”: 700, “height”: 500});        
//设置数据，输入的数据为一个二维数组。
chord.setSource(source, {from: 0, to: 1, value: 2}); //source is a 2-d array
//绘制
chord.render();
```

设置 Chord选项时，可以设置如下属性：

- `width`：画布宽度，默认500px
- `height`：画布高度，默认500px
- `legend`： 是否有图例。默认true。

##数据说明

```
[
    [from, to, value]
    [北京, 上海, 11880],
    [北京, 广州, 5147],
    [上海, 拉萨, 255]
]
```

如上数据表示了三个节点北京,上海等地之间二元关系的对应值。第一、二列对应弦外圈N个元素名称。第三列表示第一元素到第而个元素对于的弦的值。

以上设置了绘制Chord所需的最重要的属性，调用render()就能完成绘制。
交互包括：对弦与外围圆环的鼠标悬浮。对图例的点击。


