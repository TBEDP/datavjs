module("ScatterplotMatrix");

var scatterplotMatrix = new DataV.ScatterplotMatrix("chart",{"width": 522, "height": 522});

var testData = [
            ["name", "economy (mpg)", "cylinders", "displacement (cc)", "power (hp)"],
            ["A", 13, 8, 360, 175],
            ["B", 15, 8, 390, 190],
            ["C", 17, 8, 304, 150],
            ["D", 20, 6, 232, 90],
            ["E", 18, 6, 199, 97]
        ];

test("setSource", function () {
    scatterplotMatrix.setSource(testData);

    equal(scatterplotMatrix.defaults.allDimensions.length, 5, "lenght of allDimensions should be 5");
    equal(scatterplotMatrix.defaults.allDimensions[0], "name", "fisrt element of allDimensions should be \"name\"");
    equal(scatterplotMatrix.defaults.allDimensions[4], "power (hp)", "last element of allDimensions should be \"power (hp)\"");
});

test("an", function () {
    equal(scatterplotMatrix.defaults.width, 522, "width should get 522");
    equal(scatterplotMatrix.defaults.height, 522, "height should get 522");

    scatterplotMatrix.createCanvas();
    
    equal(typeof scatterplotMatrix.canvas, "object", "canvas should be an object");
    equal(scatterplotMatrix.canvas.width, 522, "canvas width should be 500");
    equal(scatterplotMatrix.canvas.height, 522, "canvas height should be 500");
});



