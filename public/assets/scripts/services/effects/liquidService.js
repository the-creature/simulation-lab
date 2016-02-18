angular.module('labServices').factory('liquidService', ['$window', '$q', 'fpsService',
    function ($window, $q, FpsService) {
        var LiquidService = function (params) {
            this.canvas = params.canvas;
            this.canvassolid = params.canvassolid;
            this.context = this.canvas.getContext('2d');
            this.width = params.width || 335;
            this.height = params.height || 384;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.volume = params.volume || 300; // full volume
            this.maxAmount = params.maxAmount || 200;
            this.offset = params.offset || 0;
            this.opaque = params.opaque || false;

            this.pourSound = params.pourSound || null;

            this.centerX = params.centerX || { // beaker surface oval centerX
                top: 182,
                bottom: 182
            };
            this.centerY = params.centerY || { // beaker surface oval centerY
                top: 56,
                bottom: 316
            };
            this.radiusX = params.radiusX || { // horizontal radius of beaker surface
                top: 138,
                bottom: 120
            };
            this.radiusY = params.radiusY || { // vertical radius of beaker surface oval
                top: 42,
                bottom: 63
            };

            this.fps = new FpsService();

            this.coverImg = new Image();
            this.maskImg = new Image();
            
            this.color = params.color || '#fff';  // liquid color
            this.transparency = params.transparency || 1; // liquid color transparency

            var self = this;

            // load back image
            $(this.coverImg).load(function (event) {
                //self.context.drawImage(this, 0, 0, self.width, self.height);
            }).prop('src', params.coverImgUrl || '');
            $(this.maskImg).load(function (event) {
                //self.context.drawImage(this, 0, 0, self.width, self.height);
            }).prop('src', params.maskImgUrl || '');                    
        };

        function hexToRgb(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        /**
         * function used to change color luminosity
         * colorLuminance("#69c", 0);		// returns "#6699cc"
         * colorLuminance("6699CC", 0.2);	// "#7ab8f5" - 20% lighter
         * colorLuminance("69C", -0.5);	// "#334d66" - 50% darker
         * colorLuminance("000", 1);		// "#000000" - true black cannot be made lighter!
         * @param hex a hex color value such as “#abc” or “#123456″ (the hash is optional)
         * @param lum the luminosity factor, i.e. -0.1 is 10% darker, 0.2 is 20% lighter, etc.
         * @returns {string}
         */
        function colorLuminance(hex, lum) {

            // validate hex string
            hex = String(hex).replace(/[^0-9a-f]/gi, '');
            if (hex.length < 6) {
                hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
            }
            lum = lum || 0;

            // convert to decimal and change luminosity
            var rgb = "#", c, i;
            for (i = 0; i < 3; i++) {
                c = parseInt(hex.substr(i*2,2), 16);
                c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
                rgb += ("00"+c).substr(c.length);
            }

            return rgb;
        }

        // ---
        // STATIC METHODS
        // ---

        LiquidService.factory = function (params) {
            var liquid = new LiquidService(params);

            return liquid;
        };

        // ---
        // INSTANCE METHODS
        // ---

        LiquidService.prototype = {

            constructor: LiquidService,

            // ---
            // PUBLIC METHODS
            // ---
            playPourSound: function () {
                if (this.pourSound) {
                    this.pourSound.play();
                }
            },

            stopPourSound: function () {
                if (this.pourSound) {
                    this.pourSound.pause();
                    this.pourSound.currentTime = 0;
                }
            },

            /**
             * Animate the pouring of liquid
             * @param newAmount
             * @param oldAmount
             * @param velocity
             * @returns {promise}
             */
            playPour: function (newAmount, oldAmount, soundEffect, liquidTotal, velocity) {
                this.newAmount = newAmount;
                this.currentAmount = oldAmount;
                this.direction = (newAmount > oldAmount) ? 1 : -1;
                this.pourVelocity = velocity || 100;
                this.soundEffect = soundEffect;
                this.liquidTotal = liquidTotal || 0;
                if (this.direction == 1 && this.soundEffect) {
                    this.playPourSound();
                }

                // When pouring liquid, a promise will be returned to indicate
                // current amount and FPS
                this.deferred = $q.defer();
                this.promise = this.deferred.promise;

                $window.requestAnimFrame(this.pourAnimate.bind(this));

                return this.promise;
            },

            pourAnimate: function () {
                if (this.currentAmount != this.newAmount) {
                    this.drawLiquid(this.currentAmount, this.liquidTotal);

                    this.currentAmount = this.direction == 1 ?
                        Math.min(this.currentAmount + this.pourVelocity / 60, this.newAmount) :
                        Math.max(this.currentAmount - this.pourVelocity / 60, this.newAmount);

                    $window.requestAnimFrame(this.pourAnimate.bind(this));

                    // Notify the progress of liquid pouring
                    this.deferred.notify({
                        currentAmount: this.currentAmount,
                        fps: this.fps.getFps()
                    });
                } else {
                    $window.requestAnimFrame(this.drawLiquid.bind(this, this.currentAmount, this.liquidTotal));
                    if (this.deferred) {
                        this.deferred.notify({
                            fps: 0
                        });
                    }

                    this.stopPourSound();
                    this.deferred.resolve();
                }
            },

            setLiquidColor: function(color, transparency) {
                this.color = color;
                this.transparency = transparency;
            },

            // ---
            // PRIVATE METHODS
            // ---

            drawLiquid: function (amount, liquidTotal, showContent) {
                amount = amount || 0;
                amount = Math.min(amount, this.maxAmount);

                this.context.save();

                // clear canvas
                this.context.clearRect(0, 0, this.width, this.height);

                if (amount > 0 && liquidTotal > 0) { // Don't draw liquid if empty
                    var rx = this.radiusX.bottom + (this.radiusX.top - this.radiusX.bottom) * (amount / this.volume);
                    var ry = this.radiusY.bottom + (this.radiusY.top - this.radiusY.bottom) * (amount / this.volume);
                    var cx = this.centerX.bottom + (this.centerX.top - this.centerX.bottom) * (amount / this.volume);
                    var cy = this.centerY.bottom + (this.centerY.top - this.centerY.bottom) * (amount / this.volume);

                    var rgb = hexToRgb(this.color);
                    var surfaceColorRgb = hexToRgb(colorLuminance(this.color, -0.5));

                    // Draw surface
                    this.drawEllipse(this.context, cx, cy, rx, ry, "rgba(" + surfaceColorRgb["r"] + "," +surfaceColorRgb["g"] + "," + surfaceColorRgb["b"] + "," + this.transparency + ")"); //#bbbec2
                    
                    // Draw liquid
                    this.context.globalCompositeOperation = 'destination-over';

                    this.context.fillStyle = "rgba(" + rgb["r"] + "," +rgb["g"] + "," + rgb["b"] + "," + this.transparency + ")";

                    if (this.radiusX.top == this.radiusX.bottom) {
                        this.context.fillRect(cx - rx, cy + this.offset, 2 * rx, this.height - cy);
                    } else {
                        this.context.fillRect(cx - this.width / 2, cy + this.offset, this.width, this.height - cy);
                    }
                }

                //Draw solid if any from canvas-solid
                this.context.globalCompositeOperation = 'source-over';
                this.context.drawImage(this.canvassolid, 0, 0, this.width, this.height); 

                if(this.opaque) {
                    this.context.globalCompositeOperation = 'destination-atop';
                    this.context.drawImage(this.maskImg, 0, 0, this.width, this.height);
                    //this.context.globalCompositeOperation = 'destination-in';
                }

                if (angular.isDefined(showContent) && showContent === true) {
                    //do nothing
                } else {
                    // Draw container
                    if(this.opaque) {
                        this.context.globalCompositeOperation = 'source-over';
                        this.context.drawImage(this.coverImg, 0, 0, this.width, this.height);
                    } else {
                        this.context.globalCompositeOperation = 'destination-atop';
                        this.context.drawImage(this.coverImg, 0, 0, this.width, this.height);                        
                    }
                }
                
                this.context.restore();
            },

            // cx,cy - center, r - horizontal radius X
            drawEllipse: function (ctx, cx, cy, rx, ry, style) {
                ctx.save(); // save state
                ctx.beginPath();
                ctx.translate(cx - rx, cy - ry + this.offset);
                ctx.scale(rx, ry);
                ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);
                ctx.restore(); // restore to original state
                ctx.save();
                if (style) {
                    ctx.strokeStyle = style;
                    ctx.fillStyle = style;
                }
                ctx.stroke();
                ctx.fill();
                ctx.restore();
            }
        };

        return LiquidService;
    }
]);