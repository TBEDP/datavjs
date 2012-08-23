# DataV项目编码规范
一套良好的编码规范如果在团队开发中被遵守，可以降低团队成员之间交流的成本，同时也降低犯错的几率。可以说编码规范只需花费20%的精力来遵循，却可以降低80%的犯低级错误几率。
这一版的编码规范，主要查考了Douglas Crockford的JSLint的检查条件和过去的一些编码经验，整理而出。

## 命名空间
项目的总命名空间为：**`DataV`**。  
除了Rapheal和D3自身的代码外，我们提交的任何方法都应该挂载在`DataV`命名空间中。
例外：某些方法和功能可以独立抽取出来，适用于别的项目。但是也应该由一个命名空间来管理它们。

## 语法
### 缩进规范
由于该项目是普通的前端JavaScript项目，所以缩进采用4个空格的方式。禁止使用tab符号。
推荐更改编辑器中的设置，使得按tab键可以自动插入4个空格。
每一层级之间，要保证缩进是正确的。
### 空格

* `=`前后应该存在一个空格
* `(`前面应该存在一个空格
* `)`后面应该存在一个空格
* `{`前面应该存在一个空格

### 分号
每一个申明或者定义，都应该以分号结尾。

    var username = "Jackson";

    var foo = function () {};
每一行调用都应该明确以分号结尾。

    foo();

### 大括号
请明确使用`{}`来约束代码段。
推荐：

    if (condition) {
        foo = "bar";
    }
不推荐：
    
    if (condition) boo = "bar";

## 命名规范
### 变量
采用驼峰首字母小写，后续单词均需大写首字母，不得在中间包含下划线。
每一个变量都应该通过`var`申明，以防止变量污染。
正确:

    var pipeChart;

错误：
   
    var pipechart;
    var pipe_chart;

### 方法
方法名同变量名，采用驼峰式命名。
定义方法均通过`var foo = function () {};`而不是`function foo () {}`。

    var foo = function () {
        // TODO
    };

方法名应该可以表示方法的行为和暗示方法的返回值。善用`set`、`get`、`is`、`has`等方法前缀。

### 类
由于JavaScript中类和方法的关键字都是`function`，为了区别两者的混淆，类名的定义通常是大写首字母，以表示它是一个作为类来调用的。

    var Person = function () {
        // TODO
    };

类的方法请尽量赋值在`prototype`属性上，使得通过原型链查找的方式降低内存占用。
类的数据请尽量在构造函数中赋值，以加快执行时的查找速度。

    var Person = function (age) {
        this.age = age; // 在构造函数中赋值数据
    };

    // 在原型链中设置方法
    Person.prototype.getAge = function () {
        return this.age;
    };

对于私有方法，在前面添加下划线表示不推荐被外部调用。

    Persion.prototype._sleep = function () {};

### 模块
为了统一规划，我们的类均需通过模块的定义方式，与命名空间结合，以保证环境的干净。

    (function () {
        var private = "I am private";
        var Person = function () {
            this.username = private;
        };

        DataV.Person = Person;
    }());

## 注释
注释对于团队而言是十分重要的，每一个方法都应该包含说明。  
必选的注释是方法的说明，方法的参数，和一个例子。  
任何诡异的地方，都应该附有简单的注释来描述它，以提醒后来人注意，以区别对待。

    /**
     * Create chart panel by passin width and height
     * @param {string} type Type name
     * @param {number} width Chart panel's width value
     * @param {number} height Chart panel's height value
     * @example
     * createChart("pipe", 500, 500);
     */
    var createChart = function (type, width, height) {
        // Trick comments
        trickCall();
    };

通过[jsdoc](http://code.google.com/p/jsdoc-toolkit/w/list)的注释，将利于我们后期导出API文档。

## 文件名
文件名的方式也是通过驼峰式，但是以下划线分割单词，一律小写单词。如：

    d3.js
    child_process.js

## JSLint扫描代码
JSLint的调用方式如下：

    node precommit.js file

配置方式存放在`config.json`中。

## 目录结构说明
目前datav组件库的目录结构如下：

```
JacksonTianmatoMacBook-Pro:datav.js jacksontian$ tree -d
.
├── bin
├── deps
├── docs
├── examples
├── libs
└── test
```
其中详细说明一下：

- `bin`目录用于存放一些可运行的脚本或者工具，例如`jslint`。
- `deps`目录用于存放项目的依赖文件，其中有`raphael`和`d3`的相关文件。
- `docs`目录用于用于存放项目的文档，如API生成文档或一些说明文档。
- `examples`目录存放案例代码。
- `libs`目录为组件库具体代码，根据每个图的类型不同，存为对应文件。
- `test`目录存放单元测试代码或自动化测试代码。
- `datav.js`文件为库的入口代码。

```javascript
   var jacksontian = fafa;
```

## 单元测试
`DataV`项目采用[`QUnit`](http://docs.jquery.com/QUnit)作为测试框架，详细文档请见。  
简单测试例子：

```
// 分模块
module("DataV");
// 测试用例
test("Themes.get", function () {
    // 单个断言
    equal(DataV.Themes.get("inexsit"), undefined, "Should get undefined when key is inexsit");
    equal(DataV.Themes.get("COLOR_MODE"), "gradient", "Should get gradient when key is COLOR_MODE");

    equal(typeof DataV.Themes.get("COLOR_ARGS"), "object", "COLOR_ARGS should be an object");
    equal(DataV.Themes.get("COLOR_ARGS").length, 2, "COLOR_ARGS should have two items");
});
```

## 数据格式
数据格式统一采用二维表的方式，结构比较类似数据库中的表。列名通过文档详细来描述，写在代码的[jsdoc](http://code.google.com/p/jsdoc-toolkit/w/list)的注释中。
标准数据格式例子如下：

```
/**
 * 设置数据源
 * @param source 数据源数组.
 * @example 举个例字，假设下面的数组表示2个人在一年4个季度的消费。第一个人在4个季度里消费了1、2、3、9元。第二个人消费了3、4、6、3元。
 * [
 *  [1,2,3,9],
 *  [3,4,6,3]
 * ]
 */
Stream.prototype.setSource = function (source) {
    // TODO
};
```
所有的组件库的调用都是相同的接口`setSource`：

```
var stream = new DataV.Stream("chart");
stream.setSource(source);
stream.render();
```
## 事件注入
每一个组件都可能向外提供一些事件钩子，包括DOM事件，或者业务逻辑事件。绑定的方式十分简单：

```
stream.on("click", function (event) {
    console.log(event);
});

stream.on("dblclick", function (event) {
    alert("double click");
});

stream.on("contextmenu", function (event) {
    alert("mouse right");
});
```

组件的内部实现是通过`EventProxy`提供自定义方式，在创建画布后，就绑定一些必要的事件到画布节点上，然后将事件触发出去。如果用户如上文，侦听了这些业务事件，将会调用执行。

    Stream.prototype.createCanvas = function () {
        var conf = this.defaults;
        this.canvas = Raphael(this.node, conf.width, conf.height);
        this.DOMNode = $(this.canvas.canvas);
        var that = this;
        this.DOMNode.click(function (event) {
            that.emitter.trigger("click", event);
        });
        this.DOMNode.dblclick(function (event) {
            that.emitter.trigger("dblclick", event);
        });
        this.DOMNode.bind("contextmenu", function (event) {
            that.emitter.trigger("contextmenu", event);
        });

        this.DOMNode.delegate("path", "click", function (event) {
            that.emitter.trigger("path_click", event);
        });

        console.log(this.canvas);
    };