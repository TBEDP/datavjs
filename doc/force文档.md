力引导布局网络图(Force)简介
========================
力引导布局网络图表现了不同数据元素之间的二元关系。 
## 绘制Force图 
绘制Force-directed网络图的javascript代码如下：

```javascript
//创建Force对象，包含于id为”chart”的dom结点，宽、高分别为700、500px。
var net = new DataV.Force("chart"，{“width”: 700, “height”: 500});
//设置net选项，边的目标长度为100。
net.setOptions({"linkLength": 100}); //options
//设置数据，输入的数据为一个二维数组。
net.setSource(source, {id: 0, name: 1, nValue: 2, source: 3, target: 4, lValue: 5}); //source is a 2-d array
//绘制
net.render();
```
创建Force对象时，第一个参数是包含Force的dom结点 或该结点的id， 第二个参数是各种选项，其中最重要的宽和高。 
设置 Force选项时，可以设置如下属性：

- `width`：画布宽度，默认500px
- `height`：画布高度，默认500px
- `legend`： 是否有图例。默认true。
- `forceValue`： 代表引力大小，默认为10.
- `linkLength`： 代表边长度，默认50， 而一些边的长度在运动过程中会受到点之间作用力的影响而改变。
- `classNum`： 对节点进行分组的数目。分组的依据是其节点值的大小，初始值为6。
- `Iterate`： 在IE下不会显示开始载入的动态效果。Iterate代表经过多少个周期显示IE中的布局结果，初始值为100。

## 数据说明
本组件的数据输入采用二维表格式。数据前半部分输入节点信息，后半部分输入边的信息。按照如下格式：

```
[
    [node],
    [0,Li,0],
    [1,Wang,1],
    [2,Zhang,0],
    [link],
    [0,1,1],
    [1,2,8],
    [2,0,3]
]
```

如上数据表示了三个节点Li,Wang,Zhang的信息，以及节点之间三条边的信息。每一行对应与一个节点或一条边。节点部分在前半部，Id代表节点编号，Name代表节点的相关信息；Group代表节点分组（可缺省，默认为1）。边部分在后半部，Source与Target代表边的两个节点，无向图中次序不限；Value代表边的值（可缺省，默认为1）。
以上设置了绘制Force所需的最重要的属性，调用render()就能完成绘制。
交互包括：对节点的鼠标悬浮，点击与拖拽。对图例的点击。
