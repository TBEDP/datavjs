常见错误
===
# 判断一个对象是否是数组
下面是宁朗写的：

```
if (color.constructor !== Array) {
	throw new Error("The color should be Array");
}
```
下面是Underscore的方法：

```
_.isArray = nativeIsArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};
```
