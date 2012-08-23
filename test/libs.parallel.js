module("DataV.Parallel")
//view xamples in ../examples/parallel/ to know the usage.

//var x = d3.scale.linear().domain([.05, .95]).range([0, 900]);
var parallel = new DataV.Parallel(document.createElement("div"));

test("setSource", function () {
	var source = [
		["name","economy (mpg)","cylinders","displacement (cc)"],
		["AMC Ambassador Brougham","10","a",],
		["AMC Ambassador DPL","15","8","390"],
		["AMC Ambassador SST","17","8","304"],
		[,"6","20.2","6"]
	];
	parallel.setSource(source);
    equal(parallel.defaults.allDimensions.length, 4, "allDimensions length ok");
    equal(parallel.defaults.allDimensions[3], "displacement (cc)", "allDimensions content ok");
    equal(parallel.defaults.dimensions.length, 4, "defaults.dimensions length ok");
    equal(parallel.defaults.dimensions[3], "displacement (cc)", "defaults.imensions content ok");

    equal(parallel.defaults.dimensionType["name"], "ordinal", "defaults.dimensionType ordinal ok");
    equal(parallel.defaults.dimensionType["economy (mpg)"], "quantitative", "defaults.dimensionType quantitative ok");
    equal(parallel.defaults.dimensionType["cylinders"], "ordinal", "defaults.dimensionType ordinal ok");
    equal(parallel.defaults.dimensionType["displacement (cc)"], "quantitative", "defaults.dimensionType quantitative ok");

    equal(parallel.defaults.dimensionDomain["name"].length, 4, "defaults.dimensionDomain length ok");
    equal(parallel.defaults.dimensionDomain["name"][3], undefined, "defaults.dimensionDomain ordinal content ok");
    equal(parallel.defaults.dimensionDomain["cylinders"][0], "a", "defaults.dimensionDomain ordinal content ok");
    equal(parallel.defaults.dimensionDomain["economy (mpg)"][0], "6", "defaults.dimensionDomain quantitative left extent ok");
    equal(parallel.defaults.dimensionDomain["economy (mpg)"][1], "17", "defaults.dimensionDomain quantitative right extent ok");
    equal(parallel.defaults.dimensionDomain["displacement (cc)"][0], 6, "defaults.dimensionDomain quantitative left extent ok");




/*
    equal(parallel.defaults.dimensionDomain["economy (mpg)"], "quantitative", "defaults.dimensionType quantitative ok");
    equal(parallel.defaults.dimensionType["cylinders"], "ordinal", "defaults.dimensionType ordinal ok");
    equal(parallel.defaults.dimensionType["displacement (cc)"], "quantitative", "defaults.dimensionType quantitative ok");
    */
	/*
	axis.tickAttr({"stroke": "#000"});
    equal(axis.tickAttr().stroke, "#000", "tickAttr set and get ok");
    */
});
/*
test("axis", function () {
	ok(axis(paper), "axis ok");
});
*/

