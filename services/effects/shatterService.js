angular.module('labServices').factory('shatterService', ['$window',
    function ($window) {
        var ShatterService = function (params) {
            this.canvas = params.canvas;  // container canvas used to generate cracked pieces
            this.context = this.canvas.getContext('2d');
            this.shatterCanvas = params.shatterCanvas; // shatter canvas to play shatter effect, the size is 3 times of this.canvas
            this.shatterContext = this.shatterCanvas.getContext('2d');
            this.image = new Image();  // the full container image
            this.sound = params.shatterSound || null;
            this.width = params.width || 250;  // the container canvas width
            this.height = params.height || 355; // the container canvas height

            this.fitness = 50;        // more smaller, more fine more more...
            this.particles = [];      // number of cracked pieces
            this.minSpeed = 500.0;   // min move speed
            this.maxSpeed = 1000.0;   // max move speed
            this.minScaleSpeed = 1.0; // min scale speed
            this.maxScaleSpeed = 4.0; // max scale speed
            this.duration = 300;  // shatter duration
            this.end = this.duration / 16.7;
            this.process = 0;

            $(this.image).load(function (event) {
            }).prop('src', params.shatterImgUrl || '');
        };

        /**
         * Get bounding rectangule of multi points
         * @param points, array of points [[x1, y1],[x2, y2],...]
         * @param width, max width
         * @param height, max height
         * @returns {{x: *, y: *, w: number, h: number}}
         */
        var getBoundingRect = function(points, width, height) {
            var r = {x: width, y: height, w: 0, h: 0};
            for (var i = 0; i < points.length; i++) {
                var p = points[i];
                r.x = Math.min(r.x, p[0] > 0 ? p[0] : 0);
                r.y = Math.min(r.y, p[1] > 0 ? p[1] : 0);
            }
            for (var i = 0; i < points.length; i++) {
                var p = points[i];
                r.w = Math.max(r.w, (p[0] > width ? width : p[0]) - r.x);
                r.h = Math.max(r.h, (p[1] > height ? height : p[1]) - r.y);
            }
            return r;
        };

        /**
         * Generate random float number
         * @param min
         * @param max
         * @returns {*}
         */
        var randomFloat = function(min, max) {
            return min + Math.random() * (max - min);
        };

        // ---
        // STATIC METHODS
        // ---

        ShatterService.factory = function (params) {
            var shatter = new ShatterService(params);

            return shatter;
        };

        // ---
        // INSTANCE METHODS
        // ---

        ShatterService.prototype = {

            constructor: ShatterService,

            // ---
            // PUBLIC METHODS
            // ---

            playSound: function () {
                if (this.sound) {
                    this.sound.play();
                }
            },

            stopSound: function () {
                if (this.sound) {
                    this.sound.pause();
                    this.sound.currentTime = 0;
                }
            },

            /**
             * Prepare cracked pieces, call animate function to scatter the pieces
             */
            shatter: function() {
                var vertices = [];
                this.process = 0;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                //this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

                // collection pixels with value of edge greater than 40
                var collectors = [];
                var imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

                Sobel(imgData, function (value, x, y) {
                    if (value > 40) {
                        collectors.push([x, y]);
                    }
                });

                // add some random points
                for (var i = 0; i < 50; i++) {
                    vertices.push([Math.random() * this.canvas.width, Math.random() * this.canvas.height]);
                }

                //add random points to edge, the count is number of edge points divide 50
                var length = ~~(collectors.length / this.fitness), random;
                for (var l = 0; l < length; l++) {
                    random = (Math.random() * collectors.length) << 0;
                    vertices.push(collectors[random]);
                    collectors.splice(random, 1);
                }

                // add four vertices of canvas
                vertices.push([0, 0], [0, this.canvas.height], [this.canvas.width, 0], [this.canvas.width, this.canvas.height]);

                // triangulate using delaunay
                var triangles = Delaunay.triangulate(vertices);

                // prepare shatter pieces
                var x1, x2, x3, y1, y2, y3, cx, cy;
                for (var i = 0; i < triangles.length; i += 3) {
                    x1 = vertices[triangles[i]][0];
                    x2 = vertices[triangles[i + 1]][0];
                    x3 = vertices[triangles[i + 2]][0];
                    y1 = vertices[triangles[i]][1];
                    y2 = vertices[triangles[i + 1]][1];
                    y3 = vertices[triangles[i + 2]][1];

                    var bounding_rect = getBoundingRect([[x1, y1], [x2, y2], [x3, y3]], this.canvas.width, this.canvas.height);
                    //console.log(bounding_rect);
                    var s_canvas = document.createElement('canvas');
                    var s_canvas_context = s_canvas.getContext('2d');

                    s_canvas.width = bounding_rect.w;
                    s_canvas.height = bounding_rect.h;

                    // draw triangle
                    s_canvas_context.beginPath();
                    s_canvas_context.moveTo(x1 - bounding_rect.x, y1 - bounding_rect.y);
                    s_canvas_context.lineTo(x2 - bounding_rect.x, y2 - bounding_rect.y);
                    s_canvas_context.lineTo(x3 - bounding_rect.x, y3 - bounding_rect.y);
                    s_canvas_context.closePath();

                    // clip triangle section
                    s_canvas_context.clip();
                    s_canvas_context.drawImage(this.canvas, bounding_rect.x, bounding_rect.y, bounding_rect.w, bounding_rect.h, 0, 0, bounding_rect.w, bounding_rect.h);

                    // init particles
                    var angle = randomFloat(0, 2 * Math.PI);  // scatter to random angles
                    var speed = randomFloat(this.minSpeed, this.maxSpeed); // random moving speed

                    this.particles.push({
                        canvas: s_canvas,
                        x: bounding_rect.x,
                        y: bounding_rect.y,
                        width: bounding_rect.w,
                        height: bounding_rect.h,
                        velocityX: speed * Math.cos(angle),
                        velocityY: speed * Math.sin(angle),
                        scaleSpeed: randomFloat(this.minScaleSpeed, this.maxScaleSpeed)
                    });
                }

                // reset vertices
                vertices = [];

                // use pixel width instead of changing css. 3 times original container canvas size
                this.shatterCanvas.width = 3 * this.width;
                this.shatterCanvas.height = 3 * this.height;

                $window.requestAnimFrame(this.animate.bind(this));
            },

            /**
             * Scatter the cracked pieces
             *
             *  -------------------
             * | x-offset     |<---|-- y-offset
             * |<-->----------     |
             * |   |          |    |
             * |   |  canvas  |    |
             * |   |          |    |
             * |   |          |    |
             * |    ----------     |
             * |   shatterCanvas   |
             *  -------------------
             *  
             */
            animate: function() {
                var that = this;

                // draw in a bigger canvas, need transform
                var x_offset = (that.shatterCanvas.width - that.canvas.width) / 2;
                var y_offset = (that.shatterCanvas.height - that.canvas.height) / 2;

                that.process++;

                this.playSound();

                this.shatterContext.clearRect(0, 0, this.shatterCanvas.width, this.shatterCanvas.height);

                // draw each particle and update position for next frame
                this.particles.forEach(function(particle) {
                    that.shatterContext.save();
                    that.shatterContext.translate(x_offset, y_offset);
                    that.shatterContext.scale(particle.scale, particle.scale);
                    that.shatterContext.drawImage(particle.canvas, particle.x, particle.y, particle.width, particle.height);
                    that.shatterContext.restore();

                    // moving away from explosion center
                    particle.scale -= particle.scaleSpeed * that.process / 1000.0;

                    if (particle.scale <= 0) {
                        particle.scale = 0;
                    }
                    particle.x += particle.velocityX * that.process / 1000.0;
                    particle.y += particle.velocityY * that.process / 1000.0;
                });

                if (that.process < that.end) {
                    $window.requestAnimFrame(that.animate.bind(that));
                } else {
                    this.shatterContext.clearRect(0, 0, this.shatterCanvas.width, this.shatterCanvas.height);
                    this.stopSound();
                    this.particles = [];
                }
            }
        };

        return ShatterService;
    }
]);