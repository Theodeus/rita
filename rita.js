(function(window) {

    /*
        Initialization
    */
    var XMLNS = "http://www.w3.org/2000/svg",
        version = "0.1",
        loopCallbacks = {},
        looping = false,
        Rita = function(element, width, height) {
            if (typeof element === "string") {
                this.el = document.getElementById(element);
            } else if (element instanceof SVGSVGElement) {
                this.el = element;
            } else {
                if (width === undefined) width = 500;
                if (height === undefined) height = 500;
                var svg = document.createElementNS(XMLNS, "svg");
                svg.setAttributeNS(null, "viewBox", "0 0 " + width + " " + height);
                svg.setAttributeNS(null, 'width', width);
                svg.setAttributeNS(null, 'height', height);
                svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
                element.appendChild(svg);
                this.el = svg;
            }
        };

    //SVG Path convenience constants
    Rita.prototype.MOVE_TO_ABSOLUTE = Rita.prototype.MTA = "M";
    Rita.prototype.MOVE_TO_RELATIVE = Rita.prototype.MTR = "m";
    Rita.prototype.LINE_TO_ABSOLUTE = Rita.prototype.LTA = "L";
    Rita.prototype.LINE_TO_RELATIVE = Rita.prototype.LTR = "l";
    Rita.prototype.HORIZONTAL_LINE_TO_ABSOLUTE = Rita.prototype.HLTA = "H";
    Rita.prototype.HORIZONTAL_LINE_TO_RELATIVE = Rita.prototype.HLTR = "h";
    Rita.prototype.VERTICAL_LINE_TO_ABSOLUTE = Rita.prototype.VLTA = "V";
    Rita.prototype.VERTICAL_LINE_TO_RELATIVE = Rita.prototype.VLTR = "v";
    Rita.prototype.CURVE_TO_ABSOLUTE = Rita.prototype.CTA = "C";
    Rita.prototype.CURVE_TO_RELATIVE = Rita.prototype.CTR = "c";
    Rita.prototype.SMOOTH_CURVE_TO_ABSOLUTE = Rita.prototype.SCTA = "S";
    Rita.prototype.SMOOTH_CURVE_TO_RELATIVE = Rita.prototype.SCTR = "s";
    Rita.prototype.QUAD_CURVE_TO_ABSOLUTE = Rita.prototype.QCTA = "Q";
    Rita.prototype.QUAD_CURVE_TO_RELATIVE = Rita.prototype.QCTR = "q";
    Rita.prototype.SMOOTH_QUAD_CURVE_TO_ABSOLUTE = Rita.prototype.SQCTA = "T";
    Rita.prototype.SMOOTH_QUAD_CURVE_TO_RELATIVE = Rita.prototype.SQCTR = "t";
    Rita.prototype.ELIPTIC_ARC_ABSOLUTE = Rita.prototype.EAA = "A";
    Rita.prototype.ELIPTIC_ARC_RELATIVE = Rita.prototype.EAR = "a";
    Rita.prototype.CLOSE_PATH = Rita.prototype.CP = "Z";

    /*
        Utils
    */
    function createSVGElement(type) {
        return document.createElementNS(XMLNS, type);
    }

    function applyAttributes(element, attributes) {
        for (var attr in attributes) {
            element.setAttributeNS(null, attr, attributes[attr]);
        }
    }

    function animatable() {
        var el = this;
        this.styleData = {};

        this.setOrigin = function(x, y, unit) {
            unit = unit || "px";
            this.styleData.origin = {
                x: x,
                y: y,
                unit: unit
            };
        }
        this.rotate = function(deg) {
            if (!this.styleData.transform) this.styleData.transform = {};
            this.styleData.transform.rotate = "rotate(" + deg + "deg)";
        }
        this.translate = function(x, y, unit) {
            unit = unit || "px";
            if (!this.styleData.transform) this.styleData.transform = {};
            this.styleData.transform.translate = "translate(" + x + unit + "," + y + unit + ")";
        }

        this.reset = function() {
            this.styleData = {};
        }

        this.update = function() {
            var styleString = "";

            if (this.styleData.origin) {
                var o = this.styleData.origin;
                styleString += "transform-origin: " + o.x + o.unit + " " + o.y + o.unit + "; ";
            }

            if (this.styleData.transform) {
                var t = this.styleData.transform;
                styleString += "transform: ";
                for (prop in t) {
                    styleString += t[prop] + " ";
                }
                styleString += ";";
            }

            el.setAttributeNS(null, 'style', styleString);
        }
    }


    /*
        Shapes
    */

    //A basic line from startPoint to stopPoint
    Rita.prototype.line = function(startPoint, endPoint, relative, attributes) {
        var el = createSVGElement("path");

        if (!relative) {
            el.setAttributeNS(null, "d", "M" + startPoint.x + ", " + startPoint.y + " L" + endPoint.x + ", " + endPoint.y);
        } else {
            el.setAttributeNS(null, "d", "m" + startPoint.x + ", " + startPoint.y + " l" + endPoint.x + ", " + endPoint.y);
        }

        el.setAttributeNS(null, 'stroke', "#000000");
        el.setAttributeNS(null, 'stroke-width', 1);

        applyAttributes(el, attributes);
        this.el.appendChild(el);
        return el;
    }

    /*TODO: Document the different action formats needed */
    Rita.prototype.path = function(actions, attributes, events, data) {
        var el = createSVGElement("path"),
            pathString = "";
        animatable.call(el);
        var action;
        for (var i = 0; i < actions.length; i++) {
            action = actions[i];
            switch (action.command) {
                case this.MOVE_TO_ABSOLUTE:
                case this.MOVE_TO_RELATIVE:
                    pathString += action.command + action.x + "," + action.y + " ";
                    break;
                case this.HORIZONTAL_LINE_TO_RELATIVE:
                case this.HORIZONTAL_LINE_TO_ABSOLUTE:
                    pathString += action.command + action.x + " ";
                    break;
                case this.VERTICAL_LINE_TO_RELATIVE:
                case this.VERTICAL_LINE_TO_ABSOLUTE:
                    pathString += action.command + action.y + " ";
                    break;
                case this.LINE_TO_ABSOLUTE:
                case this.LINE_TO_RELATIVE:
                case this.CURVE_TO_ABSOLUTE:
                case this.CURVE_TO_RELATIVE:
                case this.SMOOTH_CURVE_TO_ABSOLUTE:
                case this.SMOOTH_CURVE_TO_RELATIVE:
                case this.QUAD_CURVE_TO_ABSOLUTE:
                case this.QUAD_CURVE_TO_RELATIVE:
                case this.SMOOTH_QUAD_CURVE_TO_ABSOLUTE:
                case this.SMOOTH_QUAD_CURVE_TO_RELATIVE:
                    pathString += action.command;
                    for (var j = 0; j < action.coords.length; j++) {
                        pathString += action.coords[j].x + "," + action.coords[j].y + " ";
                    }
                    break;
                case this.ELIPTIC_ARC_RELATIVE:
                case this.ELIPTIC_ARC_ABSOLUTE:
                    pathString += action.command + action.rx + "," + action.ry + " " + action.rotation + " " + action.large + " " + action.sweep + " " + action.x + "," + action.y + " ";
                    break;
                case this.CLOSE_PATH:
                    pathString += action.command;
                    break;
            }
        }
        el.setAttributeNS(null, "d", pathString);
        el.setAttributeNS(null, "fill", "none");
        applyAttributes(el, attributes);

        //add event listeners and bind the context to the path (make "this" in the callbacks be the path object)
        for (var event in events) {
            el.addEventListener(event, events[event].bind(el));
        }
        //add any arbitrary data we want this path to hold (line number or whatever)
        for (var item in data) {
            el[item] = data[item];
        }
        this.el.appendChild(el);
        return el;
    }

    Rita.prototype.rect = function(x, y, width, height, attributes) {
        var el = createSVGElement("rect");

        el.setAttributeNS(null, "x", x || 0);
        el.setAttributeNS(null, "y", y || 0);
        el.setAttributeNS(null, "width", width === undefined ? 10 : width);
        el.setAttributeNS(null, "height", height === undefined ? 10 : height);

        applyAttributes(el, attributes);
        this.el.appendChild(el);
        return el;
    }

    //A basic line from startPoint to stopPoint
    Rita.prototype.text = function(text, x, y, attributes) {
        var el = createSVGElement("text"),
            textNode;

        el.setAttributeNS(null, 'x', x || 0);
        el.setAttributeNS(null, 'y', y || 0);
        el.appendChild(document.createTextNode(text));

        applyAttributes(el, attributes);
        this.el.appendChild(el);
        return el;
    }

    Rita.prototype.group = function(elements) {
        var el = createSVGElement("g"),
            that = this;
        elements.forEach(function(element) {
            that.el.removeChild(element);
            el.appendChild(element);
        });
        this.el.appendChild(el);
        return el;
    }

    /*Animation*/
    Rita.prototype.addLoop = function(id, callback) {
        loopCallbacks[id] = callback;
        this.startLoop();
    }

    Rita.prototype.removeLoop = function(id) {
        delete loopCallbacks[id];
        if (Object.keys(loopCallbacks) <= 0) {
            this.stopLoop();
        }
    }

    Rita.prototype.startLoop = function() {
        if (!looping) {
            looping = true;
            loop();
        }
    }

    Rita.prototype.stopLoop = function() {
        looping = false;
    }

    function loop() {
        if (looping) {
            for (var c in loopCallbacks) {
                loopCallbacks[c]();
            }
            requestAnimationFrame(loop);
        }
    }

    /*
        Interface
    */
    Rita.toString = Rita.prototype.toString = function() {
        return "You are running Rita version " + version;
    };

    //Expose to the global scope via AMD-like modules or a global var
    if (typeof define === "function") {
        define("Rita", [], function() {
            return Rita;
        });
    } else {
        window.Rita = Rita;
    }
})(this);