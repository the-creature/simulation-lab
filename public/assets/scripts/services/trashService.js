angular.module('labServices').factory('trashService', ['$window',
    function ($window) {
        var TrashService = function (params) {
            console.log("TrashService");
            this.canvas = params.canvas;
            this.context = this.canvas.getContext('2d');
            this.width = 206;
            this.height = 381;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.sound = params.sound || null;
            this.totalFrames = params.totalFrames;
            this.ticksPerFrame = params.ticksPerFrame;

            // load back image
            var self = this;

            this.trashImg = new Image();
            $(this.trashImg).load(function (event) {
                console.log("load trash image");
                self.frameIndex = 0;
                self.render();
            }).prop('src', params.trashImgUrl || 'assets/images/sprites/biotrash_bin_sprites.png');
        };

        // ---
        // STATIC METHODS
        // ---

        TrashService.factory = function (params) {
            var trash = new TrashService(params);

            return trash;
        };

        // ---
        // INSTANCE METHODS
        // ---

        TrashService.prototype = {

            constructor: TrashService,

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
             * Animate the throwing to trash
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
                this.context.clearRect(0, 0, this.width, this.height);

                // Draw the animation
                this.context.drawImage(this.trashImg,
                    this.frameIndex * this.width,
                    0,
                    this.width,
                    this.height,
                    0,
                    0,
                    this.width,
                    this.height
                );
            }
        };

        return TrashService;
    }
]);