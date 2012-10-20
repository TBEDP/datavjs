Change log
==========
## 开发中
- 2012-10-21: 重构defaults和checkContainer方法，容器在构造时检查
- 2012-10-21: 所有Chart继承EventProxy，自带`on`和`trigger`事件
- 2012-10-12: 将目录结构从docs变为doc，从libs变为lib，以更适合标准的包结构
- 2012-10-8: 添加Underscore作为依赖库，以降低代码量
- 2012-10-8: 改动模块定义方式从SeaJS变为可兼容非SeaJS的环境

## 0.1.0
- 基于D3和Rapheal构建开包即用的可视化组件库。Rapheal用于兼容浏览器，承担渲染的职责。D3负责组件数据结构或模型建立的部分。DataV在此基础上构建可视化方法的实现，致力于可视化方法的落地和推广
