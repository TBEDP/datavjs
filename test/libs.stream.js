module("DataV.Stream")
//4 new function tickAttr, tickTextAttr, minorTickAttr, domainAttr, others are belong to d3
//view xamples in ../examples/axis/ to know the usage.

var stream = new DataV.Stream(document.createElement("div"),100,100);
test("Stream", function () {
    equal(stream.type, "Stream", "Type should be Stream");
    equal(stream instanceof DataV.Chart, true, "instanceof Chart");
    equal(stream instanceof DataV.Stream, true, "instanceof Stream");
    equal(typeof stream.getType, "function", "getTheme should be function");
});

test("setSource", function () {
    stream.setSource([[1,2]]);
    equal(stream.rawData.length, 1, "setSource no columnName ok");
    equal(stream.rowName, undefined, "setSource no columnName ok");
    equal(stream.columnName, undefined, "setSource no columnName ok");
    equal(stream.source.length, 1, "setSource no columnName ok");
    equal(stream.rowName, undefined, "setSource no columnName ok");

    stream.setSource([[1,2],[3,4]]);
    equal(stream.rawData.length, 2, "setSource no columnName ok");
    equal(stream.rowName, undefined, "setSource no columnName ok");
    equal(stream.columnName, undefined, "setSource no columnName ok");
    equal(stream.source.length, 2, "setSource no columnName ok");

    stream.setSource([["a","b"],[1,2]]);
    equal(stream.rawData.length, 2, "setSource with columnName ok");
    equal(stream.rowName, undefined, "setSource no rowName ok");
    equal(stream.columnName.length, 2, "setSource with columnName ok");
    equal(stream.columnName[0], "a", "setSource with columnName ok");
    equal(stream.source.length, 1, "setSource with columnName ok");

    stream.setSource([["a",1],["b",2]]);
    equal(stream.rawData.length, 2, "setSource with rowName ok");
    equal(stream.rowName.length, 2, "setSource with rowName ok");
    equal(stream.rowName[0], "a", "setSource with rowName ok");
    equal(stream.columnName, undefined, "setSource no columnName ok");
    equal(stream.source.length, 2, "setSource with rowName ok");

    stream.setSource([[,"a","b"],["c",1,2],["d",3,4]]);
    equal(stream.rawData.length, 3, "setSource with rowName ok");
    equal(stream.rowName.length, 2, "setSource with rowName ok");
    equal(stream.rowName[0], "c", "setSource with rowName ok");
    equal(stream.columnName.length, 2, "setSource with columnName ok");
    equal(stream.columnName[0], "a", "setSource with columnName ok");
    equal(stream.source.length, 2, "setSource with rowName ok");

    stream.setOptions({columnNameUsed: true});
    stream.setSource([[1,2,3],[4,5,6],[7,8,9]]);
    equal(stream.rawData.length, 3, "setSource with forced columnNameUsed ok");
    equal(stream.rowName, undefined, "");
    equal(stream.columnName.length, 3, "");
    equal(stream.columnName[2], 3, "");
    equal(stream.source.length, 2, "");

    stream.setOptions({columnNameUsed: "auto", rowNameUsed: true});
    stream.setSource([[1,2,3],[4,5,6],[7,8,9]]);
    equal(stream.rawData.length, 3, "setSource with forced rowNameUsed ok");
    equal(stream.rowName.length, 3, "");
    equal(stream.rowName[2], 7, "");
    equal(stream.columnName, undefined, "");
    equal(stream.source.length, 3, "");

    stream.setOptions({columnNameUsed: true, rowNameUsed: true});
    stream.setSource([[1,2,3],[4,5,6],[7,8,9]]);
    equal(stream.rawData.length, 3, "setSource with forced rowNameUsed and columnNameUsed ok");
    equal(stream.rowName.length, 2, "");
    equal(stream.rowName[1], 7, "");
    equal(stream.columnName.length, 2, "");
    equal(stream.columnName[1], 3, "");
    equal(stream.source.length, 2, "");

    stream.setOptions({columnNameUsed: "auto", rowNameUsed: "auto"});
    raises(function(){
            stream.setSource([[,2,3],[4,5,6],[7,8,9]]);
        }, "setSource can not judge column or row situation, throw an error");
});


