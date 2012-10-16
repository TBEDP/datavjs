module("Chord");

var fdnet = new DataV.Chord(document.createElement("div"), {});

test("prototype.createCanvas", function () {
	  equal(fdnet.defaults.width, 800, "width should be 800 by default");
	  equal(fdnet.defaults.innerRadius, 328, "innerRadius should be 328 by default");

      fdnet.createCanvas();
	
	  equal(typeof fdnet.canvas, "object", "canvas should be an object");
});

test("prototype.setSource", function () {
    var source=[
        ["A", "B", "C", "D"],
        [11975, 5871, 8916, 2868],
        [1951, 10048, 2060, 6171],
        [8010, 16145, 8090, 8045],
        [1013, 990, 940, 6907]];
    
    fdnet.setSource(source);

    equal(fdnet.matrix.length, 4, "There should be 4 groups.");
    equal(fdnet.matrix[0].length, fdnet.matrix.length, "There should be 4 groups.");
    equal(fdnet.matrix[0][0], 11975, "The first element in first row and first column should be 11975.");
    
});

test("prototype.render", function () {
    var source=[
        ["A", "B", "C", "D"],
        [11975, 5871, 8916, 2868],
        [1951, 10048, 2060, 6171],
        [8010, 16145, 8090, 8045],
        [1013, 990, 940, 6907]];
    
    fdnet.setSource(source);
    fdnet.render();

    equal(fdnet.chordGroups.length, 10, "There should be 10 chords in the diagram.");
    equal(fdnet.chordGroups[0].type, "path", "chord's type should be path.");
    equal(fdnet.donutGroups.length, 4, "There should be 4 donuts in the diagram.");
    equal(fdnet.donutGroups[0].data("donutIndex"), 0, "The donutIndex of first donut should be 0.");
    
});