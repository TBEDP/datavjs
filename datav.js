/*global d3 */
define(function (require, exports, module) {
    var DataV = function () {};
    DataV.version = "0.0.1";

    DataV.Themes = {};

    // DataV.Themes["default"] = DataV.Themes.theme0 = {
    //     /* color format:
    //       [
    //        [darkColor1, lightColor1],
    //        [darkColor2, lightColor2],
    //        .....
    //       ]
    //      */
    //     COLOR_ARGS: [
    //         ["#03809a", "#04d4d4"],
    //         ["#8fdfa5", "#cefedb"],
    //         ["#f7cd34", "#feef8d"],
    //         ["#7dab16", "#c2e96c"],
    //         ["#00b8b8", "#3dffff"],
    //         ["#1b6157", "#1fc4ac"]
    //     ]
    //     //FONT_ARGS: {HEADER_FAMILY:"微软雅黑", HEADER_SIZE: 20, PAGE_FAMILY:"微软雅黑", PAGE_SIZE: 5}
    // };
    DataV.Themes["default"] = DataV.Themes.theme0 = {
        

         COLOR_ARGS: [
            ["#3dc6f4", "#8ce3ff"],
            ["#214fd9", "#7396ff"],
            ["#4f21d9", "#9673ff"],
            ["#c43df2", "#e38cff"],
            ["#d8214f", "#ff7396"],
            ["#f3c53c", "#ffe38c"]
        ]

        //FONT_ARGS: {HEADER_FAMILY:"微软雅黑", HEADER_SIZE: 20, PAGE_FAMILY:"微软雅黑", PAGE_SIZE: 5}
    };
    DataV.Themes.theme1 = {
        COLOR_ARGS: [
            ["#e72e8b", "#ff7fbf"],
            ["#d94f21", "#ff9673"],
            ["#f3c53c", "#ffe38c"],
            ["#8be62f", "#bfff7f"],
            ["#14cc14", "#66ff66"],
            ["#2fe68a", "#7fffc0"]
        ]

        //FONT_ARGS: {HEADER_FAMILY:"微软雅黑", HEADER_SIZE: 20, PAGE_FAMILY:"微软雅黑", PAGE_SIZE: 5}
    };
    DataV.Themes.theme2 = {
        COLOR_ARGS: [
            ["#2f8ae7", "#7fc0ff"],
            ["#8a2ee7", "#bf7fff"],
            ["#f33dc6", "#ff8ce3"],
            ["#8be62f", "#bfff7f"],
            ["#14cc14", "#66ff66"],
            ["#2fe68a", "#7fffc0"]
        ]
        //FONT_ARGS: {HEADER_FAMILY:"微软雅黑", HEADER_SIZE: 20, PAGE_FAMILY:"微软雅黑", PAGE_SIZE: 10}
    };
    DataV.Themes.theme3 = {
        COLOR_ARGS: [
            ["#2f8ae7", "#896DA3"],
            ["#8e34df", "#FFADA6"],
            ["#f738c0", "#65FCFC"],
            ["#84e653", "#555566"],
            ["#0cc53e", "#db3f7c"],
            ["#00e793s", "#db3f7c"]
        ]
        //FONT_ARGS: {HEADER_FAMILY:"微软雅黑", HEADER_SIZE: 20, PAGE_FAMILY:"微软雅黑", PAGE_SIZE: 10}
    };
    DataV.Themes.theme4 = {
        COLOR_ARGS: [
            ["#d94f21", "#7a88d1"],
            ["#579ce2", "#87bdf4"],
            ["#3bb4df", "#7fd1ef"],
            ["#a380ff", "#baa0ff"],
            ["#a164c5", "#c28fe1"],
            ["#d93a92", "#ec74b6"],
            ["#b82377", "#d569a7"],
            ["#bb3ca3", "#d381c2"],
            ["#da2d57", "#ec6b8a"],
            ["#4ca716", "#4ca716"],
            ["#5b63c2", "#8e93d7"],
            ["#15a9a3", "#4ecac5"],
            ["#a9ab48", "#e8c670"],
            ["#2aa5f5", "#73c4fa"],
            ["#f67e10", "#feb648"],
            ["#1faa77", "#62c8a2"],
            ["#eb4f20", "#f58563"],
            ["#ffc000", "#ffd659"],
            ["#f16ebc", "#f6a1d3"],
            ["#d23457", "#e27b92"]
        ]
    };

    DataV.Themes.current = "default";
    DataV.Themes._currentTheme = null;

    DataV.Themes.get = function (key) {
        if (!DataV.Themes._currentTheme) {
            DataV.Themes._currentTheme = DataV.Themes[DataV.Themes.current];
        }
        return DataV.Themes._currentTheme[key] || DataV.Themes["default"][key];
    };

    /*
     * set user-define theme
     * @param themeName: a string
     *        theme: json, contain attribute "COLOR_ARGS", theme.COLOR_ARGS is a 2-d array;
     */
    DataV.Themes.set = function (themeName, theme) {
        if (arguments.length < 2) {
            throw new Error("Arguments format error. should be: (themsName, theme)");
        } else if (typeof theme !== "object") {
            throw new Error("second argument theme should be a json object");
        } else if (!theme["COLOR_ARGS"]) {
            throw new Error("theme.COLOR_ARGS needed");
        } else if (!theme["COLOR_ARGS"] instanceof Array) {
            throw new Error("theme.COLOR_ARGS should be an array");
        } else if (!(theme["COLOR_ARGS"][0] instanceof Array)) {
            throw new Error("theme.COLOR_ARGS[0] should be an array");
        }
        DataV.Themes[themeName] = theme;
    };

    /**
     * @return boolean 返回是否切换成功
     */
    DataV.changeTheme = function (themeName) {
        var ret = DataV.Themes[themeName];
        if (ret) {
            DataV.Themes.current = themeName;
            DataV.Themes._currentTheme = null;
        }
        return !!ret;
    };

    DataV.getColor = function () {
        var theme = DataV.Themes;
        var color = theme.get("COLOR_ARGS");
        
        return color;
    };

    //Get discrete color , used for type color
    DataV.getDiscreteColor = function () {
        var theme = DataV.Themes;
        var color = theme.get("COLOR_ARGS");
        if (color.constructor !== Array) {
            throw new Error("The color should be Array");
        }
        var colorCount = color.length;
        var gotColor = [];

        if (color[0] === Array) {
            var i;
            for (i =  0 ; i < colorLineCount ; i++) {
                getColor.push(color[i][0]);
            }
        } else {
            gotColor = color;
        }

        return function (num) {
            var thisColor = gotColor;
            var thisColorCount = colorCount;

            return thisColor[num % thisolorCount];
        };
    }

    //Get gradient color, used for gradient data
    DataV.gradientColor = function (color, method) {
        if (color.constructor !== Array) {
            throw new Error("The color should be Array");
        }

        var startColor = color[0];
        var colorColor;
        var colorCount = color.length;

        var hsb
        if (colorCount === 1) {
            hsb = Raphael.color(color[0]);
            endColor = Raphael.hsb(hsb.h / 360, (hsb.s -30) / 100, 1);
        } else {
            endColor = color[colorCount - 1];
        }

        method = method || "normal ";

        if (method === "special") {
            return function (num) {
                var startHSB = Raphael.color(startColor);
                var endHSB = Raphael.color(endColor);
                var startH = startHSB.h * 360;
                var endH = endHSB.h * 360;
                var startNum = startHSB.h * 20;
                var endNum = endHSB.h * 20;


                var dH;
                var dNum;
                if (startNum >= endNum) {
                    dH = 360 - startH + endH;
                    dNum = colorCount - startNum + endNum;
                } else {
                    dH = endH - startH;
                    dNum = endNum - startNum;
                }
                
                var h = (startH + dH * num) / 360;
                var s = (70 + Math.abs(4 - (startNum + dNum * num) % 8) * 5) / 100;
                var b = (100 - Math.abs(4 - (startNum + dNum * num) % 8) * 5) / 100;

                return Raphael.hsb(h, s, b);
            };
        } else {
            return d3.interpolateRgb.apply(null, [startColor, endColor]);
        }
    }
 
    DataV.json = function (url, callback) {
        d3.json(url, callback);
    };

    DataV.csv = function (url, callback) {
        d3.text(url, "text/csv", function (text) {
            callback(text && d3.csv.parseRows(text));
        });
    };


    // Create a new Chart.
    // @example
    //    var Stream = DataV.extend(DataV.Chart, {
    //        initialize: function () {
    //            this.type = "Stream";
    //        },
    //        clearCanvas: function () {
    //            this.canvas.clear();
    //            this.legend.innerHTML = "";
    //        }
    //    });
    //

    var Chart = function () {
        this.type = "Chart";
    };

    Chart.prototype.getType = function () {
        return this.type;
    };

    DataV.Chart = Chart;

    /**
     * 继承
     */
    DataV.extend = function (parent, properties) {
        if (typeof parent !== "function") {
            properties = parent;
            parent = function () {};
        }

        properties = properties || {};
        var sub = function () {
            // Call the parent constructor.
            parent.apply(this, arguments);
            // Only call initialize in self constructor.
            if (this.constructor === parent && this.initialize) {
                this.initialize.apply(this, arguments);
            }
        };
        sub.prototype = new parent();
        sub.prototype.constructor = parent;
        $.extend(sub.prototype, properties);
        return sub;
    };

    /*********************************************************************************
 * Axis
 */
//copy codes from d3.js, add 4 functions: tickAttr, tickTextAttr, minorTickAttr and domainAttr;
//axis() changes, need a raphael paper object param, return raphael set object.
//examples in ../examples/axis/ to know the usage.
//a basic part for other data visualization format
/*global d3*/

    /**
     * function from d3, get scaleRange of an ordinal scale
     * @param domain, ordinal scale's range
     */
    function d3_scaleExtent(domain) {
        var start = domain[0], stop = domain[domain.length - 1];
        return start < stop ? [start, stop] : [stop, start];
    }

    /**
     * function from d3, get scaleRange of a scale
     */
    function d3_scaleRange(scale) {
        return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
    }

    /**
     * function from d3, get subticks
     * @param scale, scale
     * @param ticks, major ticks of scale
     * @param m, number of subdivide
     */
    function d3_svg_axisSubdivide(scale, ticks, m) {
        var subticks = [];
        if (m && ticks.length > 1) {
            var extent = d3_scaleExtent(scale.domain()),
                i = -1,
                n = ticks.length,
                d = (ticks[1] - ticks[0]) / ++m,
                j,
                v;
            while (++i < n) {
                for (j = m; --j > 0;) {
                    if ((v = +ticks[i] - j * d) >= extent[0]) {
                        subticks.push(v);
                    }
                }
            }
            for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
                subticks.push(v);
            }
        }
        return subticks;
    }

    var Axis = function () {
        var scale = d3.scale.linear(),
            orient = "bottom",
            tickMajorSize = 6,
            tickMinorSize = 6,
            tickEndSize = 6,
            tickPadding = 3,
            tickArguments_ = [10],
            tickFormat_,
            tickSubdivide = 0,

            tickAttr_ = {},
            tickTextAttr_ = {},
            minorTickAttr_ = {},
            domainAttr_ = {};
      
        /**
         * @param paper: raphael's paper object.
         * @return axisSet: raphael's set object.
         */
        function axis(paper) {
            // Ticks for quantitative scale, or domain values for ordinal scale.
            var ticks = scale.ticks ? scale.ticks.apply(scale, tickArguments_) : scale.domain(),
                tickFormat = tickFormat_ === undefined ?
                    (scale.tickFormat ?
                        scale.tickFormat.apply(scale, tickArguments_)
                        : String)
                    : tickFormat_;

            var subticks = d3_svg_axisSubdivide(scale, ticks, tickSubdivide);
            var range = d3_scaleRange(scale);
        
            var axisSet = paper.set();

            switch (orient) {
            case "bottom":
                subticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + tickMinorSize + "V0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + tickMajorSize + "V0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(tickX,  Math.max(tickMajorSize, 0) + tickPadding + 2,
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "middle"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + range[0] + "," + tickEndSize + "V0H" + range[1] + "V" + tickEndSize)
                    .attr(domainAttr_));
                break;

            case "top":
                subticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + -tickMinorSize + "V0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickX = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickX + "," + -tickMajorSize + "V0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(tickX,  -(Math.max(tickMajorSize, 0) + tickPadding + 2),
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "middle"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + range[0] + "," + -tickEndSize + "V0H" + range[1] + "V" + -tickEndSize)
                    .attr(domainAttr_));
                break;

            case "left":
                subticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + -tickMinorSize + "," + tickY + "H0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + -tickMajorSize + "," + tickY + "H0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(-(Math.max(tickMajorSize, 0) + tickPadding),  tickY,
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "end"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + -tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + -tickEndSize)
                    .attr(domainAttr_));
                break;

            case "right":
                subticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickMinorSize + "," + tickY + "H0")
                        .attr(minorTickAttr_));
                });
                ticks.forEach(function (d, i, arr) {
                    var tickY = scale.ticks ? scale(d) : scale(d) + scale.rangeBand() / 2;
                    axisSet.push(paper
                        .path("M" + tickMajorSize + "," + tickY + "H0")
                        .attr(tickAttr_));
                    axisSet.push(paper
                        .text(Math.max(tickMajorSize, 0) + tickPadding,  tickY,
                            typeof tickFormat === "function" ? tickFormat(d) : tickFormat)
                        .attr({"text-anchor": "start"})
                        .attr(tickTextAttr_));
                });
                axisSet.push(paper
                    .path("M" + tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + tickEndSize)
                    .attr(domainAttr_));
                break;
            }

            return axisSet;
        }
      
        /**
         * get or set axis' scale.
         */
        axis.scale = function (x) {
            if (!arguments.length) {
                return scale;
            }
            scale = x;
            return axis;
        };
      
        /**
         * get or set axis' orinet: "bottom", "top", "left", "right", default orient is bottom.
         */
        axis.orient = function (x) {
            if (!arguments.length) {
                return orient;
            }
            orient = x;
            return axis;
        };
      
        /**
         * get or set axis' ticks number.
         */
        axis.ticks = function () {
            if (!arguments.length) {
                return tickArguments_;
            }
            tickArguments_ = arguments;
            return axis;
        };
      
        /**
         * get or set axis' ticks format function, it's a function change format style.
         * from one string format to another string format.
         */
        axis.tickFormat = function (x) {
            if (!arguments.length) {
                return tickFormat_;
            }
            tickFormat_ = x;
            return axis;
        };
      
        /**
         * get or set axis' tick size(length of tick line, unit: px).
         * @param arguments.length === 0, get axis' major tick size.
         * @param arguments.length === 1, set axis' all tick sizes as x.
         * @param arguments.length === 2, get axis' major tick size as x, minor and end size as y.
         * @param arguments.length === 3, get axis' major tick size as x, minor size as y, end size as z.
         */
        axis.tickSize = function (x, y, z) {
            if (!arguments.length) {
                return tickMajorSize;
            }
            var n = arguments.length - 1;
            tickMajorSize = +x;
            tickMinorSize = n > 1 ? +y : tickMajorSize;
            tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
            return axis;
        };
      
        /**
         * get or set axis' tick padding(the distance between tick text and axis).
         * @param x is a number, unit is px; 
         */
        axis.tickPadding = function (x) {
            if (!arguments.length) {
                return tickPadding;
            }
            tickPadding = +x;
            return axis;
        };
      
        /**
         * get or set axis' sub tick divide number(divide number between two major ticks).
         */
        axis.tickSubdivide = function (x) {
            if (!arguments.length) {
                return tickSubdivide;
            }
            tickSubdivide = +x;
            return axis;
        };

        /**
         * get or set axis' tick attribute(Raphael format).
         */
        axis.tickAttr = function (x) {
            if (!arguments.length) {
                return tickAttr_;
            }
            tickAttr_ = x;
            return axis;
        };
      
        /**
         * get or set axis' tick text attribute(Raphael format).
         */
        axis.tickTextAttr = function (x) {
            if (!arguments.length) {
                return tickTextAttr_;
            }
            tickTextAttr_ = x;
            return axis;
        };
      
        /**
         * get or set axis' minor tick attribute(Raphael format).
         */
        axis.minorTickAttr = function (x) {
            if (!arguments.length) {
                return minorTickAttr_;
            }
            minorTickAttr_ = x;
            return axis;
        };
      
        /**
         * get or set axis' domain(axis line) attribute(Raphael format).
         */
        axis.domainAttr = function (x) {
            if (!arguments.length) {
                return domainAttr_;
            }
            domainAttr_ = x;
            return axis;
        };
      
        return axis;
    };

    DataV.Axis = Axis;


/*******************************************************************************
 * brush
 */
/*global d3*/
/*global Raphael*/
/*global $*/

    var d3_svg_brush,
        d3_svg_brushDispatch,
        d3_svg_brushTarget,
        d3_svg_brushX,
        d3_svg_brushY,
        d3_svg_brushExtent,
        d3_svg_brushDrag,
        d3_svg_brushResize,
        d3_svg_brushCenter,
        d3_svg_brushOffset,
        d3_svg_brushEls;

    /*
     * set foreground and resizers' x and width;
     */
    function d3_svg_brushRedrawX(brushEls, extent) {
        brushEls.fg.attr({"x": extent[0][0],
                        "width": extent[1][0] - extent[0][0] });
        brushEls.resizerSet.forEach(function (el) {
            var orient = el.data("resizeOrient");

            if (orient === "n" ||
                    orient === "s" ||
                    orient === "w" ||
                    orient === "nw" ||
                    orient === "sw") {
                el.attr({"x": extent[0][0] - 2});
            } else { // "e" "ne" "se"
                el.attr({"x": extent[1][0] - 2});
            }
            if (orient === "n" || orient === "s") {
                el.attr({"width": extent[1][0] - extent[0][0]});
            }
        });
        /*
        g.select(".extent").attr("x", extent[0][0]);
        g.selectAll(".n,.s,.w,.nw,.sw").attr("x", extent[0][0] - 2);
        g.selectAll(".e,.ne,.se").attr("x", extent[1][0] - 3);
        g.selectAll(".extent,.n,.s").attr("width", extent[1][0] - extent[0][0]);
        */
    }
    
    /*
     * set foreground and resizers' y and height;
     */
    function d3_svg_brushRedrawY(brushEls, extent) {
        brushEls.fg.attr({"y": extent[0][1],
                        "height": extent[1][1] - extent[0][1] });
        brushEls.resizerSet.forEach(function (el) {
            var orient = el.data("resizeOrient");
            if (orient === "n" ||
                    orient === "e" ||
                    orient === "w" ||
                    orient === "nw" ||
                    orient === "ne") {
                el.attr({"y": extent[0][1] - 3});
            } else { // "s" "se" "sw"
                el.attr({"y": extent[1][1] - 4});
            }
            if (orient === "e" || orient === "w") {
                el.attr({"height": extent[1][1] - extent[0][1]});
            }
        });

        /*
        g.select(".extent").attr("y", extent[0][1]);
        g.selectAll(".n,.e,.w,.nw,.ne").attr("y", extent[0][1] - 3);
        g.selectAll(".s,.se,.sw").attr("y", extent[1][1] - 4);
        g.selectAll(".extent,.e,.w").attr("height", extent[1][1] - extent[0][1]);
        */
    }

    /**
     * function from d3, called by d3_svg_brushMove, compute new brush extent after brush moved
     */
    function d3_svg_brushMove1(mouse, scale, i) {
        var range = d3_scaleRange(scale),
            r0 = range[0],
            r1 = range[1],
            offset = d3_svg_brushOffset[i],
            size = d3_svg_brushExtent[1][i] - d3_svg_brushExtent[0][i],
            min,
            max;
      
        // When dragging, reduce the range by the extent size and offset.
        if (d3_svg_brushDrag) {
            r0 -= offset;
            r1 -= size + offset;
        }
      
        // Clamp the mouse so that the extent fits within the range extent.
        min = Math.max(r0, Math.min(r1, mouse[i]));
      
        // Compute the new extent bounds.
        if (d3_svg_brushDrag) {
            max = (min += offset) + size;
        } else {
            // If the ALT key is pressed, then preserve the center of the extent.
            if (d3_svg_brushCenter) {
                offset = Math.max(r0, Math.min(r1, 2 * d3_svg_brushCenter[i] - min));
            }
        
            // Compute the min and max of the offset and mouse.
            if (offset < min) {
                max = min;
                min = offset;
            } else {
                max = offset;
            }
        }

        // Update the stored bounds.
        d3_svg_brushExtent[0][i] = min;
        d3_svg_brushExtent[1][i] = max;
    }

    /**
     * function from d3, after brush moved, compute new brush extent
     * and redraw foreground and resizer.
     */
    function d3_svg_brushMove(e) {
        if (d3_svg_brushOffset) {
            var bgOffset = $(d3_svg_brushTarget).offset();
            var mouse = [e.pageX - bgOffset.left, e.pageY - bgOffset.top];
            
            if (!d3_svg_brushDrag) {
                // If needed, determine the center from the current extent.
                if (e.altKey) {
                    if (!d3_svg_brushCenter) {
                        d3_svg_brushCenter = [
                            (d3_svg_brushExtent[0][0] + d3_svg_brushExtent[1][0]) / 2,
                            (d3_svg_brushExtent[0][1] + d3_svg_brushExtent[1][1]) / 2
                        ];
                    }
            
                    // Update the offset, for when the ALT key is released.
                    d3_svg_brushOffset[0] = d3_svg_brushExtent[+(mouse[0] < d3_svg_brushCenter[0])][0];
                    d3_svg_brushOffset[1] = d3_svg_brushExtent[+(mouse[1] < d3_svg_brushCenter[1])][1];
                } else {
                    // When the ALT key is released, we clear the center.
                    d3_svg_brushCenter = null;
                }
            }
        
            // Update the brush extent for each dimension.
            if (d3_svg_brushX) {
                d3_svg_brushMove1(mouse, d3_svg_brushX, 0);
                d3_svg_brushRedrawX(d3_svg_brushEls, d3_svg_brushExtent);
            }
            if (d3_svg_brushY) {
                d3_svg_brushMove1(mouse, d3_svg_brushY, 1);
                d3_svg_brushRedrawY(d3_svg_brushEls, d3_svg_brushExtent);
            }
        
            // Notify listeners.
            d3_svg_brushDispatch("brush");
        }
    }
    
    /*
     * function from d3,
     * reset brush offset if user presses "space" key while brushing a new area,
     * to ensure foreground's size unchanged while position changing.
     */
    function d3_svg_brushKeydown(e) {
        if (e.keyCode === 32 && d3_svg_brushTarget && !d3_svg_brushDrag) {
            d3_svg_brushCenter = null;
            d3_svg_brushOffset[0] -= d3_svg_brushExtent[1][0];
            d3_svg_brushOffset[1] -= d3_svg_brushExtent[1][1];
            d3_svg_brushDrag = 2;
            e.stopPropagation();
        }
    }

    /*
     * function from d3,
     * reset brush offset if "space" key up to restore normal drush state.
     */    
    function d3_svg_brushKeyup(e) {
        if (e.keyCode === 32 && d3_svg_brushDrag === 2) {
            d3_svg_brushOffset[0] += d3_svg_brushExtent[1][0];
            d3_svg_brushOffset[1] += d3_svg_brushExtent[1][1];
            d3_svg_brushDrag = 0;
            e.stopPropagation();
        }
    }

    /*
     * function from d3,
     * mouse up and stop brushing.
     */ 
    function d3_svg_brushUp(e) {
        if (d3_svg_brushOffset) {
            d3_svg_brushMove(e);
            d3_svg_brushEls.resizerSet.forEach(function (resizer) {
                //adjust all resizers
                var orient = resizer.data("resizeOrient");
                var size = d3_svg_brush.empty() ? 0 : 6;
                if (orient === "n" || orient === "s") {
                    resizer.attr({"height": size});
                } else {
                    resizer.attr({"width": size});
                }
            });
            d3_svg_brushDispatch("brushend");
            d3_svg_brush =
                d3_svg_brushDispatch =
                d3_svg_brushTarget =
                d3_svg_brushX =
                d3_svg_brushY =
                d3_svg_brushExtent =
                d3_svg_brushDrag =
                d3_svg_brushResize =
                d3_svg_brushCenter =
                d3_svg_brushOffset =
                d3_svg_brushEls = null;
            e.stopPropagation();
        }
    }
    
    var d3_svg_brushCursor = {
        n: "ns-resize",
        e: "ew-resize",
        s: "ns-resize",
        w: "ew-resize",
        nw: "nwse-resize",
        ne: "nesw-resize",
        se: "nwse-resize",
        sw: "nesw-resize"
    };
    var vml_brushCursor = {
        n: "row-resize",
        e: "col-resize",
        s: "row-resize",
        w: "col-resize",
        nw: "all-scroll",
        ne: "all-scroll",
        se: "all-scroll",
        sw: "all-scroll"
    };

    var Brush  = function () {
        var event = d3.dispatch("brushstart", "brush", "brushend"),
            x, // x-scale, optional
            y, // y-scale, optional
            extent = [[0, 0], [0, 0]], // [x0, y0], [x1, y1]
            e,
            left,
            top,
            width,
            height,
            backgroundAttr = {"fill": "#dddddd",
                            "stroke": "none",
                            "cursor": "crosshair"
                            },
            foregroundAttr = {"fill": "steelblue",
                            "stroke": "none",
                            "cursor": "move"
                            },
            brushStart = function () {},
            brushing = function () {},
            brushEnd = function () {},

            brushEls = {},
            brushClass;

        /*
         * mouse down and start brushing or dragging.
         */
        function down(e) {
            var target = e.target,
                bgOffset;
            
            // Store some global state for the duration of the brush gesture.
            d3_svg_brush = brush;
            d3_svg_brushTarget = $(brushEls.paper.canvas).parent();
            d3_svg_brushExtent = extent;
            bgOffset = $(d3_svg_brushTarget).offset();

            d3_svg_brushOffset = [e.pageX - bgOffset.left, e.pageY - bgOffset.top];
            d3_svg_brushEls = brushEls;
        
            // If the extent was clicked on, drag rather than brush;
            // store the offset between the mouse and extent origin instead.
            d3_svg_brushDrag = target.__brushNodeType__ === "fg" ? true : false;
            if (d3_svg_brushDrag) {
                d3_svg_brushOffset[0] = extent[0][0] - d3_svg_brushOffset[0];
                d3_svg_brushOffset[1] = extent[0][1] - d3_svg_brushOffset[1];
            } else if (/^resize/.test(target.__brushNodeType__)) {
                // If a resizer was clicked on, record which side is to be resized.
                // Also, set the offset to the opposite side.
                d3_svg_brushResize = target.__brushNodeType__.split("_")[1];
                d3_svg_brushOffset[0] = extent[+(/w$/.test(d3_svg_brushResize))][0];
                d3_svg_brushOffset[1] = extent[+(/^n/.test(d3_svg_brushResize))][1];
            } else if (e.altKey) {
                // If the ALT key is down when starting a brush, the center is at the mouse.
                d3_svg_brushCenter = d3_svg_brushOffset.slice();
            }
        
            // Restrict which dimensions are resized.
            d3_svg_brushX = !/^(n|s)$/.test(d3_svg_brushResize) && x;
            d3_svg_brushY = !/^(e|w)$/.test(d3_svg_brushResize) && y;
        
            // Notify listeners.
            d3_svg_brushDispatch = dispatcher(this, arguments);
            d3_svg_brushDispatch("brushstart");
            d3_svg_brushMove(e);
            e.stopPropagation();
        }

        /*
         * create brush
         * input a Raphael paper, return a brush object.
         */
        function brush(paper) {
            var resizes = x && y ? ["n", "e", "s", "w", "nw", "ne", "se", "sw"]
                : x ? ["e", "w"]
                : y ? ["n", "s"]
                : [];

            if (x) {
                e = d3_scaleRange(x);
                left = e[0];
                width = e[1] - e[0];
            }

            if (y) {
                e = d3_scaleRange(y);
                top = e[0];
                height = e[1] - e[0];
            }

            brushEls.paper = paper;
            brushEls.brushSet = paper.set();
            brushEls.resizerSet = paper.set();
            brushEls.bg = paper.rect(left, top, width, height)
                .attr({"fill": "#dddddd",
                        "stroke": "none",
                        "cursor": "crosshair"
                        })
                .attr(backgroundAttr);
            brushEls.bg.node.__brushNodeType__ = "bg";
            brushEls.bg.node.ondragstart = function () { return false; };//firefox drag bug fix;

            brushClass = "brush" + brushEls.bg.id;

            //$(brushEls.bg.node).addClass("brush bg rvml");  // fail to svg
            brushEls.bg.node.setAttribute("class", "brush bg rvml " + brushClass);
            brushEls.bg.node.setAttribute("className", "brush bg rvml " + brushClass);// IE 6,7

            brushEls.fg = paper.rect(left, top, (x ? 0 : width), (y ? 0 : height))
                .attr({"fill": "steelblue",
                        "stroke": "none",
                        "cursor": "move"
                        })
                .attr(foregroundAttr);
            brushEls.fg.node.__brushNodeType__ = "fg";
            brushEls.fg.node.ondragstart = function () { return false; };//firefox drag bug fix;
            //$(brushEls.fg.node).addClass("brush fg rvml");   //fail to svg
            brushEls.fg.node.setAttribute("class", "brush fg rvml " + brushClass);
            brushEls.fg.node.setAttribute("className", "brush fg rvml " + brushClass);// IE 6,7

            resizes.forEach(function (d) {
                var resizer = paper.rect(left, top, (x ? 6 : width), (y ? 6 : height))
                                .data("resizeOrient", d)
                                .attr({"cursor": d3_svg_brushCursor[d],
                                    "fill": "white",
                                    "stroke": "black",
                                    "opacity": 0});
                if (Raphael.vml) {
                    resizer.attr({"cursor": vml_brushCursor[d]});
                }
                if (brush.empty()) {
                    //hide all resizers
                    if (d === "n" || d === "s") {
                        resizer.attr({"height": 0});
                    } else {
                        resizer.attr({"width": 0});
                    }
                }
                resizer.node.__brushNodeType__ = "resizer_" + d;
                resizer.node.ondragstart = function () { return false; };//firefox drag bug fix;
                //$(resizer.node).addClass("brush rvml " + d3_svg_brushCursor[d]);  //fail to svg
                resizer.node.setAttribute("class", "brush rvml " + brushClass + " " + d3_svg_brushCursor[d]);
                //IE 6,7
                resizer.node.setAttribute("className", "brush rvml " + brushClass + " " + d3_svg_brushCursor[d]);
                brushEls.resizerSet.push(resizer);
            });
            
            if (x) {
                d3_svg_brushRedrawX(brushEls, extent);
            }

            if (y) {
                d3_svg_brushRedrawY(brushEls, extent);
            }

            //$(paper.canvas).delegate(".brush","mousedown", down);
            //$(paper.canvas).undelegate(".brush","mousedown", down);
            //$(paper.canvas).delegate(".brush","mousedown", down);
            //$(paper.canvas).off("mousedown", ".brush", down);
            $(paper.canvas).on("mousedown", "." + brushClass,  down);

            brush.brushElements = brushEls;
            return brush;
        }

        // dispatch event, bind data to golbal variant d3.event.
        var dispatcher = function (that, argumentz) {
            return function (type) {
                var e = d3.event;
                try {
                    d3.event = {type: type, target: brush};
                    event[type].apply(that, argumentz);
                } finally {
                    d3.event = e;
                }
            };
        };

        /**
         * get or set brush's left 
         * @param z, a value in brush scale's domain
         */
        brush.left = function (z) {
            if (!arguments.length) { return left; }
            left = z;
            return brush;
        };

        /**
         * get or set brush's top 
         * @param z, a value in brush scale's domain
         */
        brush.top = function (z) {
            if (!arguments.length) { return top; }
            top = z;
            return brush;
        };

        /**
         * get or set brush's width 
         * @param z, a value in brush scale's domain
         */
        brush.width = function (z) {
            if (!arguments.length) { return width; }
            width = z;
            return brush;
        };

        /**
         * get or set brush's height 
         * @param z, a value in brush scale's domain
         */
        brush.height = function (z) {
            if (!arguments.length) { return height; }
            height = z;
            return brush;
        };

        /**
         * get or set brush's x scale 
         * @param z, d3's sacle object
         */
        brush.x = function (z) {
            if (!arguments.length) { return x; }
            x = z;
            return brush;
        };
      
        /**
         * get or set brush's y scale 
         * @param z, d3's sacle object
         */
        brush.y = function (z) {
            if (!arguments.length) { return y; }
            y = z;
            return brush;
        };
      
        /**
         * get or set brush's extent in scale's domain format. 
         * if both x and y exist, @param z's format is [[x0, y0], [x1, y1]]
         * if only one of x and y exists, @param z's format is [x0, x1] or [y0, y1].
         */
        brush.extent = function (z) {
            var x0, x1, y0, y1, t;
        
            // Invert the pixel extent to data-space.
            if (!arguments.length) {
                if (x) {
                    x0 = extent[0][0]; x1 = extent[1][0];
                    if (x.invert) {
                        x0 = x.invert(x0); x1 = x.invert(x1);
                    }
                    if (x1 < x0) {
                        t = x0; x0 = x1; x1 = t;
                    }
                }
                if (y) {
                    y0 = extent[0][1]; y1 = extent[1][1];
                    if (y.invert) {
                        y0 = y.invert(y0); y1 = y.invert(y1);
                    }
                    if (y1 < y0) {
                        t = y0; y0 = y1; y1 = t;
                    }
                }
                return x && y ? [[x0, y0], [x1, y1]] : x ? [x0, x1] : y && [y0, y1];
            }
        
            // Scale the data-space extent to pixels.
            if (x) {
                x0 = z[0]; x1 = z[1];
                if (y) {
                    x0 = x0[0]; x1 = x1[0];
                }
                if (x.invert) {
                    x0 = x(x0); x1 = x(x1);
                }
                if (x1 < x0) {
                    t = x0; x0 = x1; x1 = t;
                }
                extent[0][0] = x0; extent[1][0] = x1;
            }
            if (y) {
                y0 = z[0]; y1 = z[1];
                if (x) {
                    y0 = y0[1]; y1 = y1[1];
                }
                if (y.invert) {
                    y0 = y(y0); y1 = y(y1);
                }
                if (y1 < y0) {
                    t = y0; y0 = y1; y1 = t;
                }
                extent[0][1] = y0; extent[1][1] = y1;
            }
        
            return brush;
        };
     
        //empty extent and refresh foreground
        brush.clear = function () {
            extent[0][0] = extent[0][1] = extent[1][0] = extent[1][1] = 0;
            brush.refresh();
            return brush;
        };

        //refresh foreground
        brush.refresh = function () {
            if (x) {
                d3_svg_brushRedrawX(brushEls, extent);
            }
            if (y) {
                d3_svg_brushRedrawY(brushEls, extent);
            }
            return brush;
        };

        //remove all brush elements, so users can reset brush attributes and redraw it.
        brush.remove = function () {
            $(paper.canvas).off("mousedown", "." + brushClass,  down);
            brushEls.fg.remove();
            brushEls.bg.remove();
            brushEls.resizerSet.remove();
            return brush;
        };

        // if brush is empty, return true, else false;
        brush.empty = function () {
            return (x && extent[0][0] === extent[1][0]) || (y && extent[0][1] === extent[1][1]);
        };

        // set background attribute.
        brush.backgroundAttr  = function (x) {
            if (!arguments.length) { return backgroundAttr; }
            backgroundAttr = x;
            return brush;
        };
        
        // set foreground attribute.
        brush.foregroundAttr = function (x) {
            if (!arguments.length) { return foregroundAttr; }
            foregroundAttr = x;
            return brush;
        };

        $(document).bind("mousemove", d3_svg_brushMove)
            .bind("mouseup", d3_svg_brushUp)
            .bind("keydown", d3_svg_brushKeydown)
            .bind("keyup", d3_svg_brushKeyup);
      
        return d3.rebind(brush, event, "on");
    };

    DataV.Brush = Brush;

    /******************************************************************/
    // floattag
    var FloatTag = function () {

        var _mousemove = function (e) {
            var jqNode = e.data.jqNode;
            var container = e.data.container;
            var mouseToFloatTag = {x: 20, y: 20};
            var offset = $(container).offset();
            if (!(e.pageX && e.pageY)) {return false;}
            var x = e.pageX - offset.left,
                y = e.pageY - offset.top;
            var position = $(container).position();

            setContent.call(this);

            //set floatTag location
            floatTagWidth = jqNode.outerWidth();
            floatTagHeight = jqNode.outerHeight();
            if (floatTagWidth + x + 2 * mouseToFloatTag.x <=  $(container).width()) {
                x += mouseToFloatTag.x;
            } else {
                x = x - floatTagWidth - mouseToFloatTag.x;
            }
            if (y >= floatTagHeight + mouseToFloatTag.y) {
                y = y - mouseToFloatTag.y - floatTagHeight;
            } else {
                y += mouseToFloatTag.y;
            }
            jqNode.css("left",  x  + "px");
            jqNode.css("top",  y + "px");
        };

        var setContent = function () {
        };
      
        /**
         * @param paper: raphael's paper object.
         * @return axisSet: raphael's set object.
         */
        function floatTag(cont) {
            var container = cont;
            var jqNode = $("<div/>").css({
                "border": "1px solid",
                "border-color": $.browser.msie ? "rgb(0, 0, 0)" : "rgba(0, 0, 0, 0.8)",
                "background-color": $.browser.msie ? "rgb(0, 0, 0)" : "rgba(0, 0, 0, 0.75)",
                "color": "white",
                "border-radius": "2px",
                "padding": "12px 8px",
                //"line-height": "170%",
                //"opacity": 0.7,
                "font-size": "12px",
                "box-shadow": "3px 3px 6px 0px rgba(0,0,0,0.58)",
                "font-familiy": "宋体",
                "z-index": 10000, 
                "text-align": "center",
    
                "visibility": "hidden",
                "position": "absolute"
            });
            $(container).append(jqNode)
                        .mousemove({"jqNode": jqNode, "container": container}, _mousemove);
            return jqNode;
        }

        floatTag.setContent = function (sc) {
            if (arguments.length === 0) {
                return setContent;
            }
            setContent = sc;
        };
      
        return floatTag;
    };

    DataV.FloatTag = FloatTag;

    module.exports = DataV;
});
