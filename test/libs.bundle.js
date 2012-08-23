module("Bundle");

var fdnet = new DataV.Bundle(document.createElement("div"), {});

test("prototype.createCanvas", function () {
	  equal(fdnet.defaults.diameter, 960, "diameter should be 960 by default");
	  equal(fdnet.defaults.innerRadius, 360, "innerRadius should be 960 by default");

      fdnet.createCanvas();
	
	  equal(typeof fdnet.canvas, "object", "canvas should be an object");
});

test("prototype.setSource", function () {
    var source=[["name","size","imports"], ["flare.vis.data.DataList",2867,"flare.analytics.cluster.CommunityStructure"], ["flare.analytics.cluster.CommunityStructure",1983,"flare.vis.data.DataList"]];
    
    fdnet.setSource(source);
    //fdnet.render();

    equal(typeof fdnet.jsn, "object", "jsn should be an object");
    equal(fdnet.jsn[0].name, "flare.vis.data.DataList", "nodes[0]'s name should be flare.vis.data.DataList");
    equal(fdnet.jsn[1].size, 1983, "nodes[1]'s size should be 1983");
    equal(fdnet.jsn[1].imports, "flare.vis.data.DataList", "nodes[1] has imported flare.vis.data.DataList");    
});

test("prototype.render", function () {
    var source=[["name","size","imports"], ["flare.vis.data.DataList",2867,"flare.analytics.cluster.CommunityStructure"], ["flare.analytics.cluster.CommunityStructure",1983,"flare.vis.data.DataList"]];
    
    fdnet.setSource(source);
    fdnet.render();

    equal(fdnet.nodes[0].name, null, "The root node's name should be ''.");
    equal(fdnet.nodes[0].depth, 0, "The root node's depth should be 0.");
    equal(typeof fdnet.nodes[0].children, "object", "The root node's children should be an object.");
    notEqual(fdnet.nodes[0].children, 0, "The root node's children should not be empty.");
    
});