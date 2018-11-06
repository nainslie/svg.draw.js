    SVG.Element.prototype.draw.extend('line polyline polygon', {

        init:function(e){
            // When we draw a polygon, we immediately need 2 points.
            // One start-point and one point at the mouse-position

            this.set = new SVG.Set();

            var p = this.startPoint,
                arr = [
                    [p.x, p.y],
                    [p.x, p.y]
                ];

            this.el.plot(arr);

            // We draw little circles around each point
            // This is absolutely not needed and maybe removed in a later release
            this.drawCircles();

            var _this = this;

            SVG.on(window, 'keydown.draw', function (e) {
                if (e.keyCode === 17) {
                    _this._snapTo90 = true;
                }
            });

            SVG.on(window, 'keyup.draw', function (e) {
                if (e.keyCode === 17) {
                    _this._snapTo90 = false;
                }
            });
        },

        // The calc-function sets the position of the last point to the mouse-position (with offset ofc)
        calc:function (e) {
            var arr = this.el.array().valueOf();
            arr.pop();

            if (e) {
                var p = this.transformPoint(e.clientX, e.clientY);

                if (this._snapTo90) {
                    var lastPoint = arr[arr.length - 1];

                    var v = { x: p.x - lastPoint[0], y: lastPoint[1] - p.y };
                    
                    var theta = Math.atan2(v.y, v.x);
                    
                    var q0 = Math.PI / 4.0;
                    var q1 = (3.0 * Math.PI) / 4.0;
                    var q2 = (-3.0 * Math.PI) / 4.0;
                    var q3 = (-1.0 * Math.PI) / 4.0;

                    if (theta >= 0 && theta < q0)
                        p.y = lastPoint[1];
                    else if (theta >= q0 && theta < q1)
                        p.x = lastPoint[0];
                    else if (theta >= q1 && theta < Math.PI)
                        p.y = lastPoint[1];
                    else if (theta < 0 && theta >= q3)
                        p.y = lastPoint[1];
                    else if (theta < q3 && theta >= q2)
                        p.x = lastPoint[0];
                    else if (theta > -Math.PI && theta < q2)
                        p.y = lastPoint[1];
                }

                arr.push(this.snapToGrid([p.x, p.y]));
            }

            this.el.plot(arr);
            this.drawCircles();
        },

        point:function(e){

            if (this.el.type.indexOf('poly') > -1) {
                // Add the new Point to the point-array
                var p = this.transformPoint(e.clientX, e.clientY),
                    arr = this.el.array().valueOf();

                arr.push(this.snapToGrid([p.x, p.y]));

                this.el.plot(arr);
                this.drawCircles();

                // Fire the `drawpoint`-event, which holds the coords of the new Point
                this.el.fire('drawpoint', {event:e, p:{x:p.x, y:p.y}, m:this.m});

                return;
            }

            // We are done, if the element is no polyline or polygon
            this.stop(e);

        },

        clean:function(){

            // Remove all circles
            this.set.each(function () {
                this.remove();
            });

            this.set.clear();

            delete this.set;

            SVG.off(window, 'keydown.draw');
            SVG.off(window, 'keyup.draw');
        },

        drawCircles:function () {
            var array = this.el.array().valueOf()

            this.set.each(function () {
                this.remove();
            });

            this.set.clear();

            for (var i = 0; i < array.length; ++i) {

                this.p.x = array[i][0]
                this.p.y = array[i][1]

                var p = this.p.matrixTransform(this.parent.node.getScreenCTM().inverse().multiply(this.el.node.getScreenCTM()));

                this.set.add(this.parent.circle(this.options.pointSize).stroke(this.options.pointStroke).fill(i === 0 ? (this.options.initialPointFill || this.options.pointFill) : this.options.pointFill).center(p.x, p.y));                
            }
        },

        undo:function() {
            if (this.set.length()) {
                this.set.members.splice(-2, 1)[0].remove();
                this.el.array().value.splice(-2, 1);
                this.el.plot(this.el.array());
                this.el.fire('undopoint');
            }
        },
    });
