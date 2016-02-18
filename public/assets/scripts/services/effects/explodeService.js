angular.module('labServices').factory('explodeService', ['$window',
    function ($window) {
        var ExplodeService = function (params) {
            this.canvas = params.canvas;
            this.context = this.canvas.getContext('2d');
            this.width = params.fWidth;
            this.height = params.fHeight;
            this.sound = params.explodeSound || null;
            this.totalFrames = params.xFrames * params.yFrames;
            this.xFrames = params.xFrames;
            this.yFrames = params.yFrames;
            this.ticksPerFrame = params.ticksPerFrame;

            // load back image
            var self = this;

            this.expImg = new Image();
            $(this.expImg).load(function (event) {
            }).prop('src', params.explodeImgUrl);
        };

        // ---
        // STATIC METHODS
        // ---

        ExplodeService.factory = function (params) {
            var exp = new ExplodeService(params);

            return exp;
        };

        // ---
        // INSTANCE METHODS
        // ---

        ExplodeService.prototype = {

            constructor: ExplodeService,

            // ---
            // PUBLIC METHODS
            // ---

            reset: function () {
                this.frameIndex = 0;
            },

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
             * Animate the explosion
             * @param velocity
             * @returns {promise}
             */
            play: function () {
                this.playSound();
                this.frameIndex = 0;
                this.tick = 0;
                $window.requestAnimFrame(this.animate.bind(this));
            },

            animate: function () {
                if (this.frameIndex < this.totalFrames - 1) {
                    this.tick++;

                    if (this.tick > this.ticksPerFrame) {
                        this.tick = 0;
                        this.frameIndex++;
                    }
                    this.render();

                    $window.requestAnimFrame(this.animate.bind(this));
                } else {
                    this.stopSound();
                }
            },

            // ---
            // PRIVATE METHODS
            // ---

            render: function () {
                // Clear the canvas
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                // Draw the animation
                this.context.drawImage(this.expImg,
                    (this.frameIndex % this.xFrames) * this.width,
                    Math.floor(this.frameIndex/this.xFrames) * this.height,
                    this.width,
                    this.height,
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height
                );
            }
        };

        return ExplodeService;
    }
]);