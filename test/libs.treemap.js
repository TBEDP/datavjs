module("DataV.Treemap");
/*
changeLevel1NodeColorIndex
getColor
create2LevelJson
goToLeaf
goToRoot
*/
var treemap = new DataV.Treemap(document.createElement("div"), {});
var source = {
 "name": "flare",
 "children": [
  {
   "name": "analytics",
   "children": [
    {
     "name": "cluster",
     "children": [
      	{
	      	"name": "AgglomerativeCluster",
	  	 	"children": [
			      {"name": "CommunityStructure", "size": 3812},
			      {"name": "HierarchicalCluster", "size": 6714},
			      {"name": "MergeEdge", "size": 743}
	  	 	]
  		}
     ]
    }
   ]
  }
  ]
 };
treemap.setSource(source);
//treemap.render();
test("_changeLevel1NodeColorIndex", function () {

    equal(treemap._changeLevel1NodeColorIndex("a"), 0, "first index ok");
    equal(treemap._changeLevel1NodeColorIndex("b"), 1, "second index ok");
    equal(treemap._changeLevel1NodeColorIndex("a"), 0, "first index ok");
});

test("getColor", function () {
	DataV.changeTheme("default");
	var randomC = treemap.getColor();
    equal(randomC("a"), "#03809a", "default param first index ok");
    equal(randomC("b"), "#8fdfa5", "default param second index ok");
    equal(randomC("a"), "#03809a", "default param first index ok");

    var randomC2 = treemap.getColor({"mode": "random", "ratio": 0.5});
    equal(randomC2("a"), "#04aab7", "random model first index ok");
    equal(randomC2("b"), "#afefc0", "random model second index ok");
    equal(randomC2("a"), "#04aab7", "random model first index ok");

	var gradientC = treemap.getColor({"mode": "gradient"});
    equal(gradientC(0), "#03809a", "gradient mode param 0 ok");
    equal(gradientC(0.5), "#04aab7", "gradient mode param 0.5 ok");
    equal(gradientC(1), "#04d4d4", "gradient mode param 1 ok");

    var gradientC2 = treemap.getColor({"mode": "gradient", "index": 1});
    equal(gradientC2(0), "#8fdfa5", "gradient mode 2 param 0 ok");
    equal(gradientC2(0.5), "#afefc0", "gradient mode 2 param 0.5 ok");
    equal(gradientC2(1), "#cefedb", "gradient mode 2 param 1 ok");
});

test("_create2LevelJson", function () {
	treemap._create2LevelJson(treemap.selectedTreeNodes[0]);
    equal(JSON.stringify(treemap.treeNodeJson), "{\"name\":\"flare\",\"children\":[{\"name\":\"analytics\",\"children\":[{\"name\":\"cluster\",\"size\":11269}]}]}", "create2LevelJson test ok");
});

test("_goToLeaf", function () {
	treemap._goToLeaf({name: "analytics", value: 11269});
    equal(treemap.selectedTreeNodes.length, 2, "_goToLeaf ok");
    equal(treemap.selectedTreeNodes[1].name, "analytics", "_goToLeaf ok");
});

test("_goToRoot", function () {
	treemap._goToRoot(0);
    equal(treemap.selectedTreeNodes.length, 1, "_goToRoot ok");
    equal(treemap.selectedTreeNodes[0].name, "flare", "_goToRoot ok");
});


test("_arrayToJson", function () {
var source1 =[ ["ID","name","size","parentID"],
            [2,"name1",1, ]];
var source2 = [["ID", "name", "size", "parentID"], ["0", "flare", "", ""], ["1", "analytics", "", "0"], ["2", "cluster", "", "1"], ["3", "AgglomerativeCluster", "3938", "2"], ["4", "CommunityStructure", "3812", "2"], ["5", "HierarchicalCluster", "6714", "2"], ["6", "MergeEdge", "743", "2"], ["7", "graph", "", "0"], ["8", "BetweennessCentrality", "3534", "7"], ["9", "LinkDistance", "5731", "7"], ["10", "MaxFlowMinCut", "7840", "7"], ["11", "shortestPaths", "5914", "7"], ["12", "SpanningTree", "3416", "7"], ["13", "optimization", "", "1"], ["14", "AspectRatioBanker", "7074", "13"]];        
	var json;
    json= treemap._arrayToJson(source1);
    equal(JSON.stringify(json), "{\"name\":\"name1\",\"size\":1}", "_arrayToJson ok");
	json = treemap._arrayToJson(source2);
    jsonStr = "{\"name\":\"flare\",\"children\":[{\"name\":\"analytics\",\"children\":[{\"name\":\"cluster\",\"children\":[{\"name\":\"AgglomerativeCluster\",\"size\":\"3938\"},{\"name\":\"CommunityStructure\",\"size\":\"3812\"},{\"name\":\"HierarchicalCluster\",\"size\":\"6714\"},{\"name\":\"MergeEdge\",\"size\":\"743\"}]},{\"name\":\"optimization\",\"children\":[{\"name\":\"AspectRatioBanker\",\"size\":\"7074\"}]}]},{\"name\":\"graph\",\"children\":[{\"name\":\"BetweennessCentrality\",\"size\":\"3534\"},{\"name\":\"LinkDistance\",\"size\":\"5731\"},{\"name\":\"MaxFlowMinCut\",\"size\":\"7840\"},{\"name\":\"shortestPaths\",\"size\":\"5914\"},{\"name\":\"SpanningTree\",\"size\":\"3416\"}]}]}";
    equal(JSON.stringify(json), jsonStr, "_arrayToJson ok");

});

