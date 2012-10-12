力引导布局网络图(Force)简介
力引导布局网络图表现了不同数据元素之间的二元关系。 绘制Force-directed网络图的javascript代码如下：
     //创建Force对象，包含于id为”chart”的dom结点，宽、高分别为700、500px。
     var net = new DataV.Force("chart"，{“width”: 700, “height”: 500});
     //设置net选项，边的目标长度为100。
     net.setOptions({“linkLength”: 100}); //options
     //设置数据，输入的数据为一个二维数组。
     net.setSource(source); //source is a 2-d array
     //绘制
     net.render();
创建Force对象时，第一个参数是包含Force的dom结点 或该结点的id， 第二个参数是各种选项，其中最重要的宽和高。 
设置 Force选项时，可以设置如下属性：
width:画布宽度，默认500px
height：画布高度，默认500px
tag：是否有图例。默认true。
forceValue：代表引力大小，默认为10.
linkLength：代表边长度，默认50， 而一些边的长度在运动过程中会受到点之间作用力的影响而改变。
classNum：对节点进行分组的数目。分组的依据是其节点值的大小，初始值为6。
Iterate：在IE下不会显示开始载入的动态效果。Iterate代表经过多少个周期显示IE中的布局结果，初始值为100。
本组件的数据输入采用二维表格式。数据前半部分输入节点信息，后半部分输入边的信息。按照如下格式：
     [
     [Id,Name,Value],
     [0,Li,0],
     [1,Wang,1],
     [2,Zhang,0],
     [Source,Target,Value],
     [0,1,1],
     [1,2,8],
     [2,0,3]
     ]
如上数据表示了三个节点Li,Wang,Zhang的信息，以及节点之间三条边的信息。每一行对应与一个节点或一条边。节点部分在前半部，Id代表节点编号，Name代表节点的相关信息；Group代表节点分组（可缺省，默认为1）。边部分在后半部，Source与Target代表边的两个节点，无向图中次序不限；Value代表边的值（可缺省，默认为1）。
以上设置了绘制Force所需的最重要的属性，调用render()就能完成绘制。
交互包括：对节点的鼠标悬浮，点击与拖拽。对图例的点击。


弦图简介
弦图通常用来展示多个节点间的连结关系。 绘制Hierarchical Edge Bundling的javascript代码如下：
     //创建Bundle对象，包含于id为”chart”的dom结点，直径为600px。
     var bundle = new DataV.Bundle("chart", {});        
     //设置数据，输入的数据为一个二维数组。
     bundle.setSource(source); //source is a 2-d array
     //绘制
     bundle.render();
创建Bundle对象时，第一个参数是包含Bundle的dom结点 或该结点的id。
设置Chord属性时：
width:画布宽度，默认500px
height：画布高度，默认500px
tag：是否有图例。默认true。
Bundle数据输入的格式为二维表。例如下面的数组共有有一个父节点bundle，他拥有五个子节点a、b、c、d、e，他们的大小分别为4、3、6、2、4，其中他们相互之间又引用关系。比如，a节点引用了d节点；b节点引用了a、e节点等。整张图正是以这个引用关系来绘制的。如果两个节点之间又引用关系，那么在图上绘制一条曲线来表达这种关系。
     [
       [name,size,imports],
       [bundle.a,4,[ bundle.d]],
       [bundle.b,3,[ bundle.a, bundle.e]],
       [bundle.c,6,[ bundle.b, bundle.e]],
       [bundle.d,2,[ bundle.a]],
       [bundle.e,4,[ bundle.d]]
    ]
以上设置了绘制Bundle所需的最重要的属性，调用render()就能完成绘制。
交互包括：对弦与弧的鼠标悬浮和对图例的点击。
