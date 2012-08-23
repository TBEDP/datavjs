//copy codes from d3.js, add 4 functions: tickAttr, tickTextAttr, minorTickAttr and domainAttr;
//axis() changes, need a raphael paper object param, return raphael set object.
//examples in ../examples/axis/ to know the usage.
//a basic part for other data visualization format
/*global d3*/
(function (global) {
    var DataV = global.DataV;

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

    global.DataV.Axis = Axis;
}(window));
