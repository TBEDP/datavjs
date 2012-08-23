module("DataV.Axis")
//4 new function tickAttr, tickTextAttr, minorTickAttr, domainAttr, others are belong to d3
//view xamples in ../examples/axis/ to know the usage.

var paper = Raphael(document.createElement("div"),900,100);

var x = d3.scale.linear().domain([.05, .95]).range([0, 900]);
var axis = DataV.Axis().scale(x);

test("tickAttr", function () {
	axis.tickAttr({"stroke": "#000"});
    equal(axis.tickAttr().stroke, "#000", "tickAttr set and get ok");
});

test("tickTextAttr", function () {
	axis.tickAttr({"font-size": "10px"});
    equal(axis.tickAttr()["font-size"], "10px", "tickTextAttr set and get ok");
});

test("minorTickAttr", function () {
	axis.tickAttr({"stroke": "#000"});
    equal(axis.tickAttr().stroke, "#000", "minorTickAttr set and get ok");
});

test("domainAttr", function () {
	axis.tickAttr({"stroke": "#000"});
    equal(axis.tickAttr().stroke, "#000", "domainAttr set and get ok");
});

test("axis", function () {
	ok(axis(paper), "axis ok");
});


