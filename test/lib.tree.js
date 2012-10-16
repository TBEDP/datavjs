/*global EventProxy, d3, Raphael, $ */
module("Tree");

var tree = new DataV.Tree("chart", {});
var emitter = new EventProxy();
var source = [['ID','name','size','parentID'],['0','Taobao','',''],['1','analytics',13,'0'],
              ['2','end',13,'0.1']];

test("prototype.createCanvas", function () {
	equal(tree.defaults.width, 750, "width should get 750");
	equal(tree.defaults.height, 760, "height should get 2000");
	equal(tree.defaults.deep, 180, "deep should get 180");
	equal(tree.defaults.radius, 15, "radius should get 15");


  tree.createCanvas();
	
	equal(typeof tree.canvas, "object", "canvas should be an object");
	equal(tree.canvas.width, 750, "canvas width should be 750");
	equal(tree.canvas.height, 760, "canvas height should be 760");
});

test("prototype.setSource", function () {
  var rawDataEnd = {"children": [{"children": null, "draw": false, "name": "analytics", "num": "1",
      "size": 13, "value": ""},
    {"children": null, "draw": false, "name": "end", "num": "2", "size": 13, "value": ""}],
    "draw": false,
    "name": "Taobao",
    "num": "0",
    "value": ""
    };

  var sourceEnd = {"children": [{"children": null, "draw": false, "name": "analytics", "num": "1",
      "size": 13, "value": ""},
    {"children": null, "draw": false, "name": "end", "num": "2", "size": 13, "value": ""}],
    "draw": false,
    "name": "Taobao",
    "num": "0",
    "value": "",
    "x0": tree.defaults.width/2,
    "y0": tree.defaults.radius * 10
    };  

  var resourceEnd = {
    "children": [
      {
        "children": [
          {
            "children": null,
            "draw": false,
            "name": "end",
            "num": "2",
            "size": 13,
            "value": ""
          }
        ],
        "draw": false,
        "name": "analytics",
        "num": "1",
        "value": ""
      }
    ],
    "draw": false,
    "name": "Taobao",
    "num": "0",
    "value": ""
  };

  tree.setSource(source);
  var addlinknum = 0;
  for (var p in tree.addlink) {
    addlinknum++;
  }

  equal(typeof tree.rawData, "object", "rawData should be an object");
  deepEqual(tree.rawData, rawDataEnd, "rawData should be equal with sourceEnd");
  deepEqual(tree.source, sourceEnd, "tree.source should be equal with source");

  var resource = [['ID','name','size','parentID'],['0','Taobao','',''],['1','analytics',13,'0'],
              ['2','end',13,'1']];

  equal(typeof tree.remapSource(resource), "object", "tree.remapSource(resource) should be an object");
  deepEqual(tree.remapSource(resource), resourceEnd, "tree.remapSource(resource) be equal with resource");
  equal(addlinknum, 1, "the num of addlink should be 1");
});

test("prototype.layout", function () {

  	//tree.setSource(source);
  	tree.layout();

  	equal(typeof tree.nodesData, "object", "tree.nodesData should be an object");
  	equal(tree.nodesData.length, 3, "The lenght of nodes should be 3");
  	equal(tree.nodesData[0].name, "Taobao", "nodes[0]'s name should be Taobao");
  	equal(tree.nodesData[0].children.length, 2, "The lenght of nodesData[0]'s children should be 2");
  	equal(tree.treeDepth, 1, "TreeDepth should be 1");
});

test("prototype.generatePaths", function () {

  	tree.setSource(source);
  	tree.layout();
  	tree.generatePaths();

  	equal(typeof tree.nodesData, "object", "tree.nodes should be an object");
    equal(tree.nodesData.length, 3, "nodes length should be 3");
    equal(tree.nodesData[0].name, "Taobao", "nodes[0]'s name should be Taobao");
    equal(tree.nodesData[0].children.length, 2, "The lenght of nodesData[0]'s children should be 2");
    equal(tree.treeDepth, 1, "TreeDepth should be 1");
    equal(tree.nodes.length, 3, "the num of nodes should be 3");
    equal(tree.path.length, 2, "the num of link should be 2");
    equal(tree.textpath.length, 3, "the num of link should be 3");
});

// test("prototype.update", function () {

//     //tree.setSource(source);
//     //tree.layout();
//     tree.update(1);

//     equal(typeof tree.nodesData, "object", "tree.nodes should be an object");
//     equal(tree.nodesData.length, 3, "nodes length should be 3");
//     equal(tree.nodesData[0].name, "Taobao", "nodes[0]'s name should be Taobao");
//     equal(tree.nodesData[0].children.length, 2, "The lenght of nodesData[0]'s children should be 2");
//     equal(tree.treeDepth, 1, "TreeDepth should be 1");
//     equal(tree.nodes.length, 3, "the num of nodes should be 3");
//     equal(tree.path.length, 2, "the num of link should be 2");
//     equal(tree.textpath.length, 3, "the num of link should be 3");
// });