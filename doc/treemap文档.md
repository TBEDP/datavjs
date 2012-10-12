treemap简介

treemap（树图）通常用来展示层次数据的占比关系。图中的每个矩形代表树的一个节点，大矩形中的小矩形代表父节点包含的子节点。不同的节点用不同的颜色加以区分，节点的值用矩形面积的大小表示。 在DataV的treemap中，一次只展现两层节点。第一层的节点用边界较宽的大矩形表示，其中边界较窄的小矩形代表第二层节点。第一层节点下的小矩形都采用同一类颜色，颜色的深浅代表节点的值的大小。点击第一层节点将把该节点下的两层节点放大显示。点击上方导航条中的链接可以回退到上一层节点。

绘制treemap的javascript代码如下：

      //创建treemap对象，包含于id为”chart”的dom结点，宽、高分别为700、500px。
      var treemap = new DataV.Treemap("chart",  {“width”: 700, “height”: 500});
      //设置数据，输入的数据为一个二维数组，也可以为多层json数据。
      treemap.setSource(source); //source is a 2-d array or hierarchy json data
      //绘制
      treemap.render();

创建treemap对象时，第一个参数是包含treemap的dom结点 或该结点的id， 第二个参数是各种选项，其中最重要的宽和高。

stream数据输入的格式可以是二维数组。例如下面的数组表示2000年4个季度的天数。第1季度下面还列出了1-3月的天数。数组的第一行为四个固定的字符串"ID"，"name"，"size"和"parentID"。四列数据分别表示层次数据集中各结点的ID，名称，大小和父节点ID。叶子节点必须有大小，根结点不能有父节点ID。各结点的ID、名称必须要有。

    [

      ["ID", "name", "size", "parentID"], 
      [0, “2000”,  ,  ],
      [1, “season1”,  , 0],
      [2, “January”, 31, 1], 
      [3, “February”, 29, 1],
      [4, “Match”, 31, 1], 
      [5, “season2”, 91, 0],
      [6, “season3”, 92, 0],
      [7, “season4”, 92, 0]
   ]

数据还可以是json格式。每个结点都有“name”，如果是父节点则还有“children”，如果为叶节点则还有“size”。以上数组数据对应的json数据如下：

{
 "name": "2000",
 "children": [
    {
       "name": "season1",
       "children": [
          {"name": "January", "size": 31},
          {"name": "February", "size": 29},
          {"name": "Match", "size": 31}
       ] 
     },
    {"name": "season2", "size": 91},
    {"name": "season3", "size": 92},
    {"name": "season4", "size": 92},
  ] 
}

以上设置了绘制treemap所需的最重要的属性，调用render()就能完成绘制。 

