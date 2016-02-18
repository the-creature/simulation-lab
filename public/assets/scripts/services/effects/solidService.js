angular.module('labServices').factory('solidService', ['$window', '$q', 'fpsService', 
    function ($window, $q, FpsService) {
        var SolidService = function (params) {
            this.canvas = params.canvas;
            this.canvas2 = params.canvas2;
            this.context = this.canvas.getContext('2d');
            this.context2 = this.canvas2.getContext('2d');
            this.width = params.width || 335;
            this.height = params.height || 384;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvas2.width = this.width;
            this.canvas2.height = this.height;
            this.volume = params.volume || 300; // full volume
            this.maxAmount = params.maxAmount || 200;
            this.maxHeight = this.maxAmount * this.height / this.volume;
            this.offset = params.offset || 0;

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

            var self = this;
        };
        
        function getItemData(name) {
            if (angular.isDefined( initObj.toolsData[name] )) {
                var toolData = angular.copy( initObj.toolsData[name].defaults );
                return toolData;
            } else {
                return null;
            }
        }

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

        // ---
        // STATIC METHODS
        // ---

        SolidService.factory = function (params) {
            var solid = new SolidService(params);

            return solid;
        };

        // ---
        // INSTANCE METHODS
        // ---

        SolidService.prototype = {

            constructor: SolidService,

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
            playPour: function (status, changeElement, changeAmount, liquidTotal, soundEffect, velocity) {
                this.status = status;
                this.element = changeElement;
                this.amount = changeAmount;
                this.liquidTotal = liquidTotal
                this.direction = (this.amount > 0) ? 1 : -1;
                this.pourVelocity = velocity || 100;
                this.soundEffect = soundEffect || 0;
                this.finalAmount = status[changeElement].amount + changeAmount;
                
                if (this.direction == 1 && this.soundEffect == 1) {
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
                if (this.status[this.element].amount != this.finalAmount) {
                    this.drawSolid(this.status, this.liquidTotal);
                    
                    var material = getItemData(this.element);
                    
                    this.status[this.element].amount = this.direction == 1 ?
                        Math.min(this.status[this.element].amount + this.pourVelocity / 60 / material.mlxmg, this.finalAmount) :
                        Math.max(this.status[this.element].amount - this.pourVelocity / 60 / material.mlxmg, this.finalAmount);

                    $window.requestAnimFrame(this.pourAnimate.bind(this));

                    // Notify the progress of liquid pouring
                    this.deferred.notify({
                        currentAmount: this.status[this.element].amount,
                        fps: this.fps.getFps()
                    });
                } else {
                    $window.requestAnimFrame(this.drawSolid.bind(this, this.status, this.liquidTotal));
                    if (this.deferred) {
                        this.deferred.notify({
                            fps: 0
                        });
                    }

                    this.stopPourSound();
                    this.deferred.resolve();
                }
            },

            // ---
            // PRIVATE METHODS
            // ---

            drawSolid: function (solids, liquid) {
                var currVol = 0;
                var currHeight = 0;
                
                this.context.save();
                this.context2.save();

                // clear canvas
                this.context.clearRect(0, 0, this.width, this.height);
                this.context2.clearRect(0, 0, this.width, this.height);

                var rx = this.radiusX.bottom;
                var ry = this.radiusY.bottom;
                var cx = this.centerX.bottom;
                var cy = this.centerY.bottom
                var oldcy;
                for (var solid in solids) {
                    var material = getItemData(solid);
                    oldcy = cy;
                    var rgb = hexToRgb(material.color);
                    if (liquid == 0 || material.soluble == 0) {
                        var lineVol = material.solid.height * this.maxAmount / this.maxHeight;
                        var solidVol = solids[solid].amount * material.mlxmg;
                        var solidLines = solidVol/lineVol;
                        var rockImg = new Image();
                        $(rockImg).load(function (event) {
                        }).prop('src', material.solid.image);
                        var rockSrcPos = 0;
                        for (var i = 1; i < solidLines; i++) {
                            this.context.globalCompositeOperation = 'source-over';
                            rx = this.radiusX.bottom + (this.radiusX.top - this.radiusX.bottom) * (currHeight / this.height);
                            ry = this.radiusY.bottom + (this.radiusY.top - this.radiusY.bottom) * (currHeight / this.height);
                            cx = this.centerX.bottom + (this.centerX.top - this.centerX.bottom) * (currHeight / this.height);
                            cy = this.centerY.bottom + (this.centerY.top - this.centerY.bottom) * (currHeight / this.height);
                            for(var ya = cy - ry - material.solid.height; ya <= cy + ry; ya = ya + material.solid.height * 0.8) {
                                for (var xa = cx - rx; xa <= cx + rx; xa = xa + material.solid.width * 0.9) {
                                    this.context2.drawImage(rockImg, material.solid.sp_width * (rockSrcPos % material.solid.sprites), 0, material.solid.sp_width, material.solid.sp_height, xa, ya, material.solid.width, material.solid.height);
                                    rockSrcPos ++;
                                }
                            }
                            this.drawEllipse(this.context, cx, cy, rx, ry, "rgba(" + rgb["r"] + "," +rgb["g"] + "," + rgb["b"] + "," + material.transparency + ")"); 
                            currHeight += material.solid.height;
                        }
                        //TODO: Color are not working well
                    }
                    //Draw las partial line
                    var percent = (solidVol % lineVol) / lineVol;
                    
                    rx = this.radiusX.bottom * percent + (this.radiusX.top - this.radiusX.bottom) * (currHeight / this.height) ;
                    ry = this.radiusY.bottom * percent + (this.radiusY.top - this.radiusY.bottom) * (currHeight / this.height) ;
                    cx = this.centerX.bottom + (this.centerX.top - this.centerX.bottom) * (currHeight / this.height);
                    cy = this.centerY.bottom + (this.centerY.top - this.centerY.bottom) * (currHeight / this.height);
                    for(var ya = cy - ry - material.solid.height; ya <= cy + ry; ya = ya + material.solid.height * 0.8) {
                        for (var xa = cx - rx; xa <= cx + rx; xa = xa + material.solid.width * 0.9) {
                            this.context2.drawImage(rockImg, material.solid.sp_width * (rockSrcPos % material.solid.sprites), 0, material.solid.sp_width, material.solid.sp_height, xa, ya, material.solid.width, material.solid.height);
                            rockSrcPos ++;
                        }
                    }
                    this.drawEllipse(this.context, cx, cy, rx, ry, "rgba(" + rgb["r"] + "," +rgb["g"] + "," + rgb["b"] + "," + material.transparency + ")"); 
                    
                    //Copy rocks over the other canvas
                    this.context.globalCompositeOperation = 'source-in';
                    this.context.drawImage(this.canvas2, 0, 0, this.width, this.height);
                    
                }
                this.context.restore();
                this.context2.restore();
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

        return SolidService;
    }
]);