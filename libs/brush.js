/*global d3*/
/*global Raphael*/
/*global $*/
(function (global) {
    var DataV = global.DataV;

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

    global.DataV.Brush = Brush;
}(window));
