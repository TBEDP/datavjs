# 服务器端配置
## 为何需要服务器？
由于我们项目中加载数据文件是通过ajax的方式，ajax在普通从磁盘文件方式打开时，浏览器是不启用ajax功能的，会导致demo无法跑通。

## 怎么安装？
推荐通过Node.js来搭建，十分方便快捷。
### 下载安装
从这里下载<http://nodejs.org/#download>适合你平台的Node二进制文件，并安装。Linux需要编译。
### 执行
通过命令行进入源码的bin目录下，执行如下命令
```
npm install connect
```
安装完成后，执行`node app.js`。
### 访问服务器
通过浏览器打开<http://localhost:8001>即可看到目录结构。
