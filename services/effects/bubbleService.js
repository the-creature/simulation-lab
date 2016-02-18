angular.module('labServices').factory('bubbleService', ['$window', '$q', 'fpsService',
    function ($window, $q, FpsService) {
        var BubbleService = function (params) {
            this.canvas = params.canvas;
            this.context = this.canvas.getContext('2d');
            this.width = 75; // width of bubble canvas
            this.height = 50; // height of bubble canvas
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.bubbleSound = params.bubbleSound || null;

            this.isPlaying = false;
            this.bubbleSize = 10; // Size of bubble bubble
            this.bubbleCount = 20; // Number of bubble bubbles
            this.defaultVelocity = 90; // Default bubble rising speed

            this.fps = new FpsService();

            this.bubbleImg = new Image();

            var self = this;

            // Load bubble image
            $(this.bubbleImg).load(function (event) {

            }).prop('src', params.bubbleImgUrl || 'assets/images/effects/boiling/bubble.png');
        };

        // ---
        // STATIC METHODS
        // ---

        BubbleService.factory = function (params) {
            var bubble = new BubbleService(params);

            return bubble;
        };

        // ---
        // INSTANCE METHODS
        // ---

        BubbleService.prototype = {

            constructor: BubbleService,

            // ---
            // PUBLIC METHODS
            // ---

            playSound: function () {
                if (this.bubbleSound) {
                    this.bubbleSound.play();
                }
            },

            stopSound: function () {
                if (this.bubbleSound) {
                    this.bubbleSound.pause();
                    this.bubbleSound.currentTime = 0;
                }
            },

            play: function (velocity) {
                if (this.isPlaying) {
                    return this.promise;
                }

                this.bubbleVelocity = velocity || this.defaultVelocity;
                this.isPlaying = true;
                this.playSound();

                // When bubbling, a promise will be returned to indicate fps
                this.deferred = $q.defer();
                this.promise = this.deferred.promise;

                // Generate bubble bubbles
                this.bubbles = [];
                for (var i = 0; i < this.bubbleCount; i++) {
                    this.bubbles.push({
                        left: Math.random() * (this.width - this.bubbleSize),
                        top: Math.random() * (this.height - this.bubbleSize),
                        opacity: Math.random() * 0.2 + 0.8
                    });
                }

                $window.requestAnimFrame(this.animate.bind(this));

                return this.promise;
            },

            stop: function () {
                if (this.deferred) {
                    this.deferred.notify({
                        fps: 0
                    });
                }
                this.isPlaying = false;
                this.stopSound();

                if (this.deferred) {
                    this.deferred.resolve();
                }
            },

            animate: function () {
                if (this.isPlaying) {
                    $window.requestAnimFrame(this.animate.bind(this));

                    this.deferred.notify({
                        fps: this.fps.getFps()
                    });
                }

                this.drawBubbles();

                // Update bubble positions
                var maxTop = this.height - this.bubbleSize;
                for (var i = 0; i < this.bubbles.length; i++) {
                    var bubble = this.bubbles[i];

                    bubble.top -= this.bubbleVelocity / 60;
                    if (bubble.top < 0) {
                        bubble.top = Math.random() * maxTop;
                    }
                }
            },


            // ---
            // PRIVATE METHODS
            // ---
            
            // Draw bubble bubbles
            drawBubbles: function () {
                this.context.save();

                this.context.clearRect(0, 0, this.width, this.height);

                if (this.isPlaying) { // Draws bubbles only in playing status
                    var maxTop = (this.height - this.bubbleSize);
                    for (var i = 0; i < this.bubbles.length; i++) {
                        var bubble = this.bubbles[i];

                        // Makes bubble sharp as it goes above
                        var scale = 1 - 0.8 * bubble.top / maxTop;
                        this.context.globalAlpha = bubble.opacity;
                        this.context.drawImage(this.bubbleImg,
                            bubble.left,
                            bubble.top,
                            this.bubbleSize * scale,
                            this.bubbleSize * scale
                        );
                    }
                }

                this.context.restore();
            }
        }; 

        return BubbleService;
    }
]);