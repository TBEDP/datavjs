Stream图简介

Stream图通常用来展示多个变量随时间的变化趋势。每个变量用一条色带表示。色带的宽度代表了变量在某时间点处的值或占比的大小。 在DataV的Stream提供了自底向上排列，居中排列，扩展排列，平缓排列4种条带布局方式。鼠标移上条带时，可以高亮响应的条带，并在浮动框中显示相应变量在相应时间点处的值。 绘制Stream的javascript代码如下：

       //创建stream对象，包含于id为”chart”的dom结点，宽、高分别为700、500px。
       var stream = new DataV.Stream("chart"，{“width”: 700, “height”: 500});
       //设置 stream选项，排列方式为“zero”， 排列顺序为“reverse”。
       stream.setOptions({“offset”: “zero”, “order”: “reverse”}); //options
       //设置数据，输入的数据为一个二维数组。
       stream.setSource(source); //source is a 2-d array
       //绘制
       stream.render();

创建stream对象时，第一个参数是包含stream的dom结点 或该结点的id， 第二个参数是各种选项，其中最重要的宽和高。

设置 stream选项时，最重要的是offset和order。offset有4个选项：“zero”（从下往上堆叠），“silhouette”（纵向居中堆叠），“expand”（计算占比后堆叠），“wiggle”（前后两个时间点间的变化幅度最小，更平缓）。order有2个选项：“default”和“reverse”。“default”表示个变量以输入数据中的先后顺序从下往上排列；“reverse”表示顺序相反。

stream数据输入的格式为二维数组。例如下面的数组表示2个人在一年4个季度的消费。第一个人在4个季度里消费了1、2、3、9元。第二个人消费了3、4、6、3元。

    [
      [1,2,3,9],
      [3,4,6,3]
    ]

数组中还可以在第一行和第一列加上列名和行名。下面的数据中加入了人名和季节。

    [
      [“”, “season1”, “season2”, “season3”, “season4”],
      [“Wang”, 1, 2, 3, 9],
      [“Li”, 3, 4, 6, 3]
    ]

以上设置了绘制stream所需的最重要的属性，调用render()就能完成绘制。 



























































