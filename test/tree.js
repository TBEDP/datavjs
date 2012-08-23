module("Tree");

test("prototype.createCanvas", function () {
	var tree = new DataV.Tree("chart");

	var source = { "name": "flare", "children": [
	{ "name": "analytics", "children": [
    { "name": "cluster", "children": [
      {"name": "AgglomerativeCluster", "size": 3938},
      {"name": "CommunityStructure", "size": 3812},
      {"name": "HierarchicalCluster", "size": 6714},
      {"name": "MergeEdge", "size": 743}]
  	}]}]};

	equal(tree.defaults.width, 2000, "width should get 2000");
	equal(tree.defaults.height, 760, "height should get 2000");
	equal(tree.defaults.deep, 180, "deep should get 180");
	equal(tree.defaults.radius, 10, "radius should get 10");


    tree.createCanvas();
	
	equal(typeof tree.canvas, "object", "canvas should be an object");
	equal(tree.canvas.width, 2000, "canvas width should be 2000");
	equal(tree.canvas.height, 760, "canvas height should be 760");
});

test("prototype.setSource", function () {
	var tree = new DataV.Tree("chart");

	var source = { "name": "flare", "children": [
	{ "name": "analytics", "children": [
    { "name": "cluster", "children": [
      {"name": "AgglomerativeCluster", "size": 3938},
      {"name": "CommunityStructure", "size": 3812},
      {"name": "HierarchicalCluster", "size": 6714},
      {"name": "MergeEdge", "size": 743}]
  	}]}]};

  	tree.setSource(source);

  	equal(typeof tree.rawData, "object", "rawData should be an object");
  	equal(tree.rawData, source, "rawData should be equal with source");
  	equal(tree.source, source, "tree.source should be equal with source");

  	var resource = { "name": "flare", "children": [{ "name": "analytics", "size": 743}]};

  	equal(typeof tree.remapSource(resource), "object", "tree.remapSource(resource) should be an object");
  	equal(tree.remapSource(resource), resource, "tree.remapSource(resource) be equal with resource");
});

test("prototype.layout", function () {
	var tree = new DataV.Tree("chart");

	var source = { "name": "flare", "children": [
	{ "name": "analytics", "children": [
    { "name": "cluster", "children": [
      {"name": "AgglomerativeCluster", "size": 3938},
      {"name": "CommunityStructure", "size": 3812},
      {"name": "HierarchicalCluster", "size": 6714},
      {"name": "MergeEdge", "size": 743}]
  	}]}]};

  	tree.setSource(source);
  	tree.layout();

  	equal(typeof tree.nodes, "object", "tree.nodes should be an object");
  	equal(tree.nodes.length, 7, "nodes length should be 7");
  	equal(tree.nodes[0].name, "flare", "nodes[0]'s name should be flare");
  	equal(tree.nodes[0].children.length, 1, "nodes[0]'s name should be flare");
  	equal(tree.nodes[0].name, "flare", "nodes[0]'s name should be flare");
  	equal(tree.treeDepth, 3, "TreeDepth should be 3");
});

test("prototype.generatePaths", function () {
	var tree = new DataV.Tree("chart");

	var source = { "name": "flare", "children": [
	{ "name": "analytics" }] };

  	tree.setSource(source);
  	tree.layout();
  	tree.generatePaths();

  	equal(typeof tree.nodes, "object", "tree.nodes should be an object");
  	equal(tree.nodes.length, 2, "nodes length should be 2");
  	equal(tree.nodes[0].name, "flare", "nodes[0]'s name should be flare");
  	equal(tree.nodes[0].children.length, 1, "num of nodes[0]'s children should be 1");
  	equal(tree.treeDepth, 1, "TreeDepth should be 1");
  	equal(tree.link_paths.length, 1, "the num of link should be 1");
  	equal(tree.circle_paths.length, 2, "the num of link should be 1");
  	equal(tree.text_paths.length, 2, "the num of link should be 1");

  	var source2 = { "name": "flare"};
  	tree.setSource(source2);
  	tree.layout();
  	tree.generatePaths();

  	equal(typeof tree.nodes, "object", "tree.nodes should be an object");
  	equal(tree.nodes.length, 1, "nodes length should be 1");
  	equal(tree.nodes[0].name, "flare", "nodes[0]'s name should be flare");
  	equal(tree.nodes[0].children, undefined, "nodes[0]'s children should be undefined");
  	equal(tree.treeDepth, 0, "TreeDepth should be 0");
  	equal(tree.link_paths.length, 0, "the num of link should be 0");
  	equal(tree.circle_paths.length, 1, "the num of link should be 1");
  	equal(tree.text_paths.length, 1, "the num of link should be 1");
});
