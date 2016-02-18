angular.module('labServices').factory('imagePlayer', ['$window', '$q',
    function ($window, $q) {
        var DEFAULT_DURATION = 3000;

        var ImagePlayer = function (params) {
            this.images = params.images || [];
            this.canvas = params.canvas;
            this.context = this.canvas.getContext('2d');
            this.width = params.width || this.images[0].width || 1024;
            this.height = params.height || this.images[0].height || 768;

            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.playing = false;
            this.fading = false;
            this.playingHandler = undefined;
        };

        // ---
        // STATIC METHODS
        // ---

        ImagePlayer.factory = function (params) {
            var player = new ImagePlayer(params);

            return player;
        };

        // ---
        // INSTANCE METHODS
        // ---
        ImagePlayer.prototype = {

            constructor: ImagePlayer,

            // ---
            // PUBLIC METHODS
            // ---

            isPlaying: function () {
                return this.playing;
            },

            /**
             * Plays images in sequence
             *
             * @param duration  duration to play
             * @param reverse   If true, plays in reverse direction
             * @returns {Promise}
             */
            play: function (duration, reverse) {
                if (this.isPlaying()) {
                    return this.promise;
                }

                var duration = duration || DEFAULT_DURATION;
                var reverse = reverse || false;
                var interval = duration / this.images.length;
                var player = this;

                this.playing = true;

                // When playing the images, a promise will be returned to indicate
                // when the playing has completed
                this.deferred = $q.defer();
                this.promise = this.deferred.promise;

                this.playingHandler = $window.requestInterval(function (elapsed) {
                    if (elapsed > duration) {
                        $window.clearRequestInterval(player.playingHandler);
                        player.playing = false;

                        player.deferred.resolve();
                    } else {
                        var currentImageId = Math.floor(elapsed / interval);

                        if (reverse) {
                            currentImageId = player.images.length - currentImageId - 1;
                        }

                        player.drawImage(player.images[currentImageId]);
                    }
                }, interval);

                return this.promise;
            },

            /**
             * Fades in the image
             *
             * @param image     image to fade in
             * @param duration  duration
             * @returns {Promise}
             */
            fadeIn: function (image, duration) {
                if (this.fading) {
                    return this.fadePromise;
                }

                var duration = duration || DEFAULT_DURATION;
                var interval = 1000 / 60;
                var self = this;

                this.fading = true;
                this.fadeDeferred = $q.defer();
                this.fadePromise = this.fadeDeferred.promise;

                this.drawImage(image);

                console.log('$window')
                console.log($window)
                console.log($window.requestInterval())
                console.log('======')
                this.fadeHandler = $window.requestInterval(function (elapsed) {
                    if (elapsed > duration) {
                        $window.clearRequestInterval(self.fadeHandler);
                        self.fading = false;

                        $(self.canvas).css('opacity', 1);

                        self.fadeDeferred.resolve();
                    } else {
                        var opacity = (elapsed / duration);

                        $(self.canvas).css('opacity', opacity);
                    }
                }, interval);

                return this.fadePromise;
            },

            // ---
            // PRIVATE METHODS
            // ---
            drawImage: function (image) {
                var player = this;

                requestAnimationFrame(function () {
                    player.context.drawImage(image, 0, 0, player.width, player.height);
                });
            }
        };

        return ImagePlayer;
    }
]);