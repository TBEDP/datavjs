module("DataV.ScatterplotMatrix");

var scatterplotMatrix = new DataV.ScatterplotMatrix(document.createElement("div"),{"width": 522, "height": 522});

var testData = [
            ["name", "economy (mpg)", "cylinders", "displacement (cc)", "power (hp)"],
            ["A", 13, 8, 360, 175],
            ["B", 15, 8, 390, 190],
            ["C", 17, 8, 304, 150],
            ["D", 20, 6, 232, 90],
            ["E", 18, 6, 199, 97]
        ];


test("createCanvas", function () {
    equal(scatterplotMatrix.defaults.width, 522, "width should get 522");
    equal(scatterplotMatrix.defaults.height, 522, "height should get 522");

    scatterplotMatrix.createCanvas();
    
    equal(typeof scatterplotMatrix.canvas, "object", "canvas should be an object");
    equal(scatterplotMatrix.canvas.width, 522, "canvas width should be 500");
    equal(scatterplotMatrix.canvas.height, 522, "canvas height should be 500");
});

test("setSource", function () {
    scatterplotMatrix.setSource(testData);
    var sDefaults = scatterplotMatrix.defaults;

    //test allDimensions
    equal(sDefaults.allDimensions.length, 5, "lenght of allDimensions should be 5");
    equal(sDefaults.allDimensions[0], "name", "fisrt element of allDimensions should be \"name\"");
    equal(sDefaults.allDimensions[4], "power (hp)", "last element of allDimensions should be \"power (hp)\"");
    //test dimensionsX
    equal(sDefaults.dimensionsX.length, 4, "lenght of dimensionsX should be 4");
    equal(sDefaults.dimensionsX[0], "economy (mpg)", "fisrt element of dimensionsX should be \"economy (mpg)\"");
    equal(sDefaults.dimensionsX[3], "power (hp)", "last element of dimensionsX should be \"power (hp)\"");
    //test dimensionsY
    equal(sDefaults.dimensionsY.length, 4, "lenght of dimensionsY should be 4");
    equal(sDefaults.dimensionsY[0], "economy (mpg)", "fisrt element of dimensionsY should be \"economy (mpg)\"");
    equal(sDefaults.dimensionsY[3], "power (hp)", "last element of dimensionsY should be \"power (hp)\"");
    //test domain 
    equal(sDefaults.dimensionDomain["economy (mpg)"][0], 13, "the min of \"economy (mpg)\" should be 13");
    equal(sDefaults.dimensionDomain["economy (mpg)"][1], 20, "the max of \"economy (mpg)\" should be 20");
});

test("setDimensionsX", function () {
    scatterplotMatrix.setDimensionsX(["economy (mpg)", "power (hp)"]);
    var sDefaults = scatterplotMatrix.defaults;

    equal(sDefaults.dimensionsX.length, 2, "lenght of dimensionsX should be 2");
    equal(sDefaults.dimensionsX[0], "economy (mpg)", "fisrt element of dimensionsX should be \"economy (mpg)\"");
    equal(sDefaults.dimensionsX[1], "power (hp)", "last element of dimensionsX should be \"power (hp)\"");
});

test("setDimensionsY", function () {
    scatterplotMatrix.setDimensionsY(["cylinders", "displacement (cc)"]);
    var sDefaults = scatterplotMatrix.defaults;

    equal(sDefaults.dimensionsY.length, 2, "lenght of dimensionsY should be 2");
    equal(sDefaults.dimensionsY[0], "cylinders", "fisrt element of dimensionsY should be \"cylinders\"");
    equal(sDefaults.dimensionsY[1], "displacement (cc)", "last element of dimensionsY should be \"displacement (cc)\"");
});





