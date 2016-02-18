angular.module('labServices').factory('steamService', ['$window', '$q', 'fpsService',
    function ($window, $q, FpsService) {
        var SteamService = function (params) {
            this.canvas = params.canvas;
            this.context = this.canvas.getContext('2d');
            this.width = params.width || 100; // width of steam canvas
            this.height = params.height || 160; // height of steam canvas
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.isPlaying = false;

            this.cloudSize = 60; // Size of steam cloud
            this.cloudCount = 30; // Number of steam clouds
            this.defaultVelocity = 240; // Default steam rising speed

            this.fps = new FpsService();

            this.steamImg = new Image();

            var self = this;

            // Load steam image
            $(this.steamImg).load(function (event) {

            }).prop('src', params.steamImgUrl || 'assets/images/effects/boiling/steam.png');
        };

        // ---
        // STATIC METHODS
        // ---

        SteamService.factory = function (params) {
            var steam = new SteamService(params);

            return steam;
        };

        // ---
        // INSTANCE METHODS
        // ---

        SteamService.prototype = {

            constructor: SteamService,

            // ---
            // PUBLIC METHODS
            // ---

            play: function (velocity) {
                if (this.isPlaying) {
                    return this.promise;
                }

                this.steamVelocity = velocity || this.defaultVelocity;
                this.isPlaying = true;

                // When steaming, a promise will be returned to indicate fps
                this.deferred = $q.defer();
                this.promise = this.deferred.promise;

                // Generate steam clouds
                this.clouds = [];
                for (var i = 0; i < this.cloudCount; i++) {
                    this.clouds.push({
                        left: Math.random() * (this.width - this.cloudSize),
                        top: Math.random() * (this.height - this.cloudSize) * 5,
                        opacity: Math.random() * 0.8 + 0.2
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

                this.drawSteam();

                // Update cloud positions
                var maxTop = this.height - this.cloudSize;
                for (var i = 0; i < this.clouds.length; i++) {
                    var cloud = this.clouds[i];

                    cloud.top -= this.steamVelocity / 60;
                    if (cloud.top < 0) {
                        cloud.top = Math.random() * maxTop * 5;
                    }
                }
            },


            // ---
            // PRIVATE METHODS
            // ---
            
            // Draw steam clouds
            drawSteam: function () {
                this.context.save();

                this.context.clearRect(0, 0, this.width, this.height);

                if (this.isPlaying) { // Draws steams only in playing status
                    var maxTop = (this.height - this.cloudSize);
                    for (var i = 0; i < this.clouds.length; i++) {
                        var cloud = this.clouds[i];

                        if (cloud.top <= maxTop) {
                            // Makes cloud transparent at start and at the top
                            var opacity = cloud.opacity * (1 - Math.abs(cloud.top - maxTop / 2) / maxTop / 2);
                            this.context.globalAlpha = opacity;
                            this.context.drawImage(this.steamImg,
                                cloud.left,
                                cloud.top,
                                this.cloudSize,
                                this.cloudSize
                            );
                        }
                    }
                }

                this.context.restore();
            }
        }; 

        return SteamService;
    }
]);