module("DataV.Bubble")

var bubble = new DataV.Bubble(document.createElement("div"), {"width": 100, "height": 200});

test("defaults", function() {
    ok(bubble.defaults.width === 100, "set canvas width ok");
    ok(bubble.defaults.height === 200, "set canvas height ok");
});

var source = [
    ["year", "country", "survival", "children", "population", "region"],
    ["1989", "Japan", "0.9935", "1.61", "121832924", "Asia"],
    ["1989", "Jamaica", "0.961", "3.01", "2352279", "America"],
    ["1989", "Italy", "0.99", "1.31", "56824792", "Europe"],
    ["1989", "Israel", "0.988", "3.02", "4384139", "Asia"],
    ["1989", "Ireland", "0.9906", "2.06", "3530188", "Europe"],
    ["1989", "Iraq", "0.9532", "6.05", "16927393", "Arab"],
    ["1989", "Iran", "0.9324", "5.15", "53437770", "Arab"],
    ["1989", "Indonesia", "0.9108", "3.23", "181197879", "Asia"],
    ["1989", "India", "0.8822", "3.99", "855707358", "Asia"],
    ["1989", "Iceland", "0.9934", "2.15", "252179", "Europe"],
    ["1990", "Japan", "0.9936", "1.57", "122251184", "Asia"],
    ["1990", "Jamaica", "0.962", "2.95", "2364909", "America"],
    ["1990", "Italy", "0.9904", "1.3", "56832330", "Europe"],
    ["1990", "Israel", "0.9885", "3", "4499949", "Asia"],
    ["1990", "Ireland", "0.991", "2", "3531219", "Europe"],
    ["1990", "Iraq", "0.9539", "5.99", "17373767", "Arab"],
    ["1990", "Iran", "0.9352", "4.82", "54870583", "Arab"],
    ["1990", "Indonesia", "0.915", "3.12", "184345939", "Asia"],
    ["1990", "India", "0.8852", "3.92", "873785449", "Asia"],
    ["1990", "Iceland", "0.9937", "2.16", "254793", "Europe"],
    ];

test("setSource", function () {
    bubble.setSource(source);
    equal(bubble.defaults.allDimensions,  
        source[0], "set allDimensions ok");
    equal(bubble.defaults.dimensions, bubble.defaults.allDimensions, "set dimensions ok");
    equal(bubble.timeDimen, bubble.defaults.dimensions[0], "set time dimension ok");
    equal(bubble.keyDimen, bubble.defaults.dimensions[1], "set key dimension ok");
    ok(bubble.keys.length === 10, "set keys ok");
    ok(bubble.times.length === 2, "set times ok");
});

test("chooseDimensions", function () {
    bubble.setSource(source);
    bubble.chooseDimensions(["year", "region", "children", "survival", "population", "region"]);  
    equal(bubble.xDimen, "children", "choose X Dimensions dimensions ok");
    equal(bubble.yDimen, "survival", "choose Y Dimensions dimensions ok");
    ok(bubble.keys.length === 4, "change defaults keys ok");
});

test("Animation and clearAnimation", function () {
    bubble.setSource(source);
    bubble.chooseDimensions(["year", "region", "children", "survival", "population", "region"]);  
    bubble.initControls();
    var preInterval = bubble.interval;
    notEqual(preInterval, 0, "set animation ok");
        bubble.clearAnimation();
    var postInterval = bubble.interval;
    equal(postInterval, 0, "clear animation ok");
});

test("uniq", function () {
    var arr1 = [1, 1, 2, 2, 3, 3].uniq();
    ok(arr1.length === 3, "uniq a number array ok");
})