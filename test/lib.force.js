module("Force");

var fdnet = new DataV.Force(document.createElement("div"), {});


test("prototype.createCanvas", function () {
	  equal(fdnet.defaults.width, 500, "width should get 500");
	  equal(fdnet.defaults.height, 500, "height should get 500");

    fdnet.createCanvas();
	
	  equal(typeof fdnet.canvas, "object", "canvas should be an object");
	  equal(fdnet.canvas.width, 500, "canvas width should be 500");
  	equal(fdnet.canvas.height, 500, "canvas height should be 500");
});

test("prototype.setSource", function () {
    var netjson={"nodes":[{"name":"Myriel","group":1},{"name":"Napoleon","group":2},{"name":"Mlle.Baptistine","group":3}],"links":[{"source":1,"target":0,"value":1},{"source":2,"target":0,"value":8}]};
    var source = [['Id','Name','Group'],[0,'Myriel',1],[1,'Napoleon',2],[2,'Mlle.Baptistine',3],['Source','Target','Value'],[1,0,1],[2,0,8]];
    fdnet.setSource(source);

    equal(typeof fdnet.net, "object", "net should be an object");
    deepEqual(fdnet.net, netjson, "net should be equal with json");
});

test("prototype.update", function () {
    var source = [['Id','Name','Group'],[0,'Myriel',1],[1,'Napoleon',2],[2,'Mlle.Baptistine',3],['Source','Target','Value'],[1,0,1],[2,0,8]];
    fdnet.setSource(source);
    fdnet.layout();
    //fdnet.update();
    equal(typeof fdnet.net.nodes, "object", "tree.nodes should be an object");
    equal(fdnet.net.nodes[0].name, "Myriel", "nodes[0]'s name should be Myriel");
    equal(fdnet.net.nodes[0].group, 1, "The nodes[0]'s group should be 1");
});