angular.module('labServices').factory('flameService', ['$window', '$q', 'fpsService',
    function ($window, $q, FpsService) {
        var FlameService = function (params) {
            this.canvas = params.canvas;
            this.context = this.canvas.getContext('2d');
            this.width = 40; // width of flame canvas
            this.height = 100; // height of flame canvas
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.flameSound = params.flameSound || null;

            this.status = 'off';
            this.isPlaying = false;

            this.fps = new FpsService();
        };

        // ---
        // STATIC METHODS
        // ---

        FlameService.factory = function (params) {
            var flame = new FlameService(params);

            return flame;
        };

        // ---
        // INSTANCE METHODS
        // ---

        FlameService.prototype = {

            constructor: FlameService,

            // ---
            // PUBLIC METHODS
            // ---

            playSound: function () {
                if (this.flameSound) {
                    this.flameSound.play();
                }
            },

            stopSound: function () {
                if (this.flameSound) {
                    this.flameSound.pause();
                    this.flameSound.currentTime = 0;
                }
            },

            setStatus: function (status) {
                this.status = status;

                if (this.status === 'off') {
                    this.stop();
                }
            },

            play: function (status) {
                if (this.isPlaying) {
                    return this.promise;
                }

                this.playSound();
                this.isPlaying = true;

                // When flaming, a promise will be returned to indicate fps
                this.deferred = $q.defer();
                this.promise = this.deferred.promise;

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
                this.status = 'off';

                if (this.deferred) {
                    this.deferred.resolve();
                }
            },

            animate: function () {
                if (this.isPlaying) {
                    this.drawFlame();

                    $window.requestAnimFrame(this.animate.bind(this));

                    this.deferred.notify({
                        fps: this.fps.getFps()
                    });
                } else {
                    $window.requestAnimFrame(this.drawFlame.bind(this));

                    this.stopSound();
                    this.deferred.resolve();
                }
            },


            // ---
            // PRIVATE METHODS
            // ---

            /**
             * Draw flame
             */
            drawFlame: function () {
                // prepare increment step
                var a, b;
                a = Math.floor(Math.random() * 18) - 9;
                //a = a + b;
                if (a >= 9) {
                    b = -3;
                }
                if (a <= -9) {
                    b = 3;
                }

                var max = 2;
                var min = -2;

                var c = Math.floor(Math.random() * (max - min)) + min;

                var flameHeight = this.height * 0.85;
                var flameBottom = this.height - 2;


                var halfCanvasWidth = this.width / 2;

                // clear canvas
                this.context.clearRect(0, 0, this.width, this.height);

                if (this.status === 'low') {
                    // coordinates of different layer
                    var redLayerWidth = 8, yellowLayerWidth = 6, whiteLayerWidth = 4;
                    var halfRedLayerWidth = redLayerWidth / 2, halfYellowLayerWidth = yellowLayerWidth / 2, halfWhiteLayerWidth = whiteLayerWidth / 2;

                    // red layer
                    var x_left_point_red = halfCanvasWidth - halfRedLayerWidth;
                    var x_right_point_red = halfCanvasWidth + halfRedLayerWidth;

                    // yellow layer
                    var x_left_point_yellow = halfCanvasWidth - halfYellowLayerWidth;
                    var x_right_point_yellow = halfCanvasWidth + halfYellowLayerWidth;

                    // white layer
                    var x_left_point_white = halfCanvasWidth - halfWhiteLayerWidth;
                    var x_right_point_white = halfCanvasWidth + halfWhiteLayerWidth;

                    // for bottom curve
                    var x_left_ctrl_point_1 = halfCanvasWidth;
                    var y_left_ctrl_point_1 = flameHeight + 10;

                    var x_left_ctrl_point_2 = halfCanvasWidth - 2;
                    var y_left_ctrl_point_2 = flameHeight + 3;

                    var x_right_ctrl_point_1 = halfCanvasWidth + 5;
                    var y_right_ctrl_point_1 = flameHeight + 5;

                    var x_right_ctrl_point_2 = halfCanvasWidth;
                    var y_right_ctrl_point_2 = flameHeight + 2;

                    // red layer
                    this.context.globalAlpha = 0.2;
                    this.context.beginPath();
                    this.context.moveTo(x_left_point_red, flameHeight);
                    this.context.lineTo(halfCanvasWidth, 20);
                    this.context.lineTo(x_right_point_red, flameHeight);

                    this.context.bezierCurveTo(x_right_ctrl_point_1, y_right_ctrl_point_1, x_right_ctrl_point_2, y_right_ctrl_point_2, halfCanvasWidth, flameBottom + c);
                    //this.context.moveTo(x_left_point_red, flameHeight);
                    this.context.bezierCurveTo(x_left_ctrl_point_1, y_left_ctrl_point_1, x_left_ctrl_point_2, y_left_ctrl_point_2, x_left_point_red, flameHeight);

                    this.context.fillStyle = '#eee';
                    this.context.shadowColor = 'orangered';
                    this.context.shadowBlur = 5;
                    this.context.shadowOffsetX = 0;
                    this.context.shadowOffsetY = -5;
                    this.context.fill();

                    // yellow layer
                    this.context.globalAlpha = 0.8;
                    this.context.beginPath();
                    this.context.moveTo(x_left_point_yellow, flameHeight);
                    this.context.lineTo(halfCanvasWidth, 50 + a);
                    this.context.lineTo(x_right_point_yellow, flameHeight);

                    this.context.bezierCurveTo(x_right_ctrl_point_1, y_right_ctrl_point_1, x_right_ctrl_point_2, y_right_ctrl_point_2, halfCanvasWidth, flameBottom + c);
                    //this.context.moveTo(x_left_point_yellow, flameHeight);
                    this.context.bezierCurveTo(x_left_ctrl_point_1, y_left_ctrl_point_1, x_left_ctrl_point_2, y_left_ctrl_point_2, x_left_point_yellow, flameHeight);
                    this.context.fillStyle = 'yellow';
                    this.context.fill();

                    // white layer
                    this.context.globalAlpha = 0.8;
                    this.context.beginPath();
                    this.context.moveTo(x_left_point_white, flameHeight);
                    this.context.lineTo(halfCanvasWidth, 60 + a);
                    this.context.lineTo(x_right_point_white, flameHeight);

                    this.context.bezierCurveTo(x_right_ctrl_point_1, y_right_ctrl_point_1, x_right_ctrl_point_2, y_right_ctrl_point_2, halfCanvasWidth, flameBottom + c);
                    //this.context.moveTo(x_left_point_white, flameHeight);
                    this.context.bezierCurveTo(x_left_ctrl_point_1, y_left_ctrl_point_1, x_left_ctrl_point_2, y_left_ctrl_point_2, x_left_point_white, flameHeight);
                    this.context.fillStyle = 'white';
                    this.context.fill();

                    // outer layer
                    this.context.globalAlpha = 0.2;
                    this.context.beginPath();
                    this.context.moveTo(halfCanvasWidth - 6, this.height);
                    this.context.lineTo(halfCanvasWidth, 20);
                    this.context.lineTo(halfCanvasWidth + 6, this.height);

                    this.context.fillStyle = '#eee';
                    this.context.shadowColor = '#330000';
                    this.context.shadowBlur = 15;
                    this.context.shadowOffsetX = 0;
                    this.context.shadowOffsetY = -5;
                    this.context.fill();
                } else if (this.status === 'medium') {
                    // coordinates of different layer
                    var cyanLayerWidth = 8;
                    var halfCyanLayerWidth = cyanLayerWidth / 2;

                    // cyan layer
                    var x_left_point_cyan = halfCanvasWidth - halfCyanLayerWidth;
                    var x_right_point_cyan = halfCanvasWidth + halfCyanLayerWidth;

                    // for bottom curve
                    var x_left_ctrl_point_1 = halfCanvasWidth;
                    var y_left_ctrl_point_1 = flameHeight + 10;

                    var x_left_ctrl_point_2 = halfCanvasWidth - 2;
                    var y_left_ctrl_point_2 = flameHeight + 3;

                    var x_right_ctrl_point_1 = halfCanvasWidth + 5;
                    var y_right_ctrl_point_1 = flameHeight + 5;

                    var x_right_ctrl_point_2 = halfCanvasWidth;
                    var y_right_ctrl_point_2 = flameHeight + 2;

                    // cyan layer
                    this.context.globalAlpha = 0.5;
                    this.context.beginPath();
                    this.context.moveTo(x_left_point_cyan, flameHeight);
                    this.context.lineTo(halfCanvasWidth, 20);
                    this.context.lineTo(x_right_point_cyan, flameHeight);
                    //context.quadraticCurveTo(250, 0, 265, flameHeight);
                    //context.lineTo(250, flameBottom);
                    this.context.bezierCurveTo(x_right_ctrl_point_1, y_right_ctrl_point_1, x_right_ctrl_point_2, y_right_ctrl_point_2, halfCanvasWidth, flameBottom + c);
                    //this.context.moveTo(x_left_point_cyan, flameHeight);
                    this.context.bezierCurveTo(x_left_ctrl_point_1, y_left_ctrl_point_1, x_left_ctrl_point_2, y_left_ctrl_point_2, x_left_point_cyan, flameHeight);

                    this.context.fillStyle = '#eee';
                    this.context.shadowColor = 'cyan';
                    this.context.shadowBlur = 10;
                    this.context.shadowOffsetX = 0;
                    this.context.shadowOffsetY = 0;
                    this.context.fill();
                } else if (this.status === 'high') {
                    // coordinates of different layer
                    var blueLayerWidth = 8, light_blueLayerWidth = 6, whiteLayerWidth = 4;
                    var halfblueLayerWidth = blueLayerWidth / 2, halfLightBlueLayerWidth = light_blueLayerWidth / 2, halfWhiteLayerWidth = whiteLayerWidth / 2;

                    // blue layer
                    var x_left_point_blue = halfCanvasWidth - halfblueLayerWidth;
                    var x_right_point_blue = halfCanvasWidth + halfblueLayerWidth;

                    // light blue layer
                    var x_left_point_light_blue = halfCanvasWidth - halfLightBlueLayerWidth;
                    var x_right_point_light_blue = halfCanvasWidth + halfLightBlueLayerWidth;

                    // white layer
                    var x_left_point_white = halfCanvasWidth - halfWhiteLayerWidth;
                    var x_right_point_white = halfCanvasWidth + halfWhiteLayerWidth;

                    // for bottom curve
                    var x_left_ctrl_point_1 = halfCanvasWidth;
                    var y_left_ctrl_point_1 = flameHeight + 10;

                    var x_left_ctrl_point_2 = halfCanvasWidth - 2;
                    var y_left_ctrl_point_2 = flameHeight + 3;

                    var x_right_ctrl_point_1 = halfCanvasWidth + 5;
                    var y_right_ctrl_point_1 = flameHeight + 5;

                    var x_right_ctrl_point_2 = halfCanvasWidth;
                    var y_right_ctrl_point_2 = flameHeight + 2;

                    // outer layer
                    this.context.globalAlpha = 0.2;
                    this.context.beginPath();
                    this.context.moveTo(halfCanvasWidth - 6, this.height);
                    this.context.lineTo(halfCanvasWidth, 20);
                    this.context.lineTo(halfCanvasWidth + 6, this.height);

                    this.context.fillStyle = '#eee';
                    this.context.shadowColor = 'blue';
                    this.context.shadowBlur = 15;
                    this.context.shadowOffsetX = 0;
                    this.context.shadowOffsetY = -5;
                    this.context.fill();

                    // blue layer
                    this.context.globalAlpha = 0.2;
                    this.context.beginPath();
                    this.context.moveTo(x_left_point_blue, flameHeight);
                    this.context.lineTo(halfCanvasWidth, 20);
                    this.context.lineTo(x_right_point_blue, flameHeight);

                    this.context.bezierCurveTo(x_right_ctrl_point_1, y_right_ctrl_point_1, x_right_ctrl_point_2, y_right_ctrl_point_2, halfCanvasWidth, flameBottom + c);
                    //this.context.moveTo(x_left_point_blue, flameHeight);
                    this.context.bezierCurveTo(x_left_ctrl_point_1, y_left_ctrl_point_1, x_left_ctrl_point_2, y_left_ctrl_point_2, x_left_point_blue, flameHeight);

                    this.context.fillStyle = '#eee';
                    this.context.shadowColor = 'blue';
                    this.context.shadowBlur = 10;
                    this.context.shadowOffsetX = 0;
                    this.context.shadowOffsetY = 0;
                    this.context.fill();

                    // lightblue layer
                    this.context.globalAlpha = 0.8;
                    this.context.beginPath();
                    this.context.moveTo(x_left_point_light_blue, flameHeight);
                    this.context.lineTo(halfCanvasWidth, 60 + a);
                    this.context.lineTo(x_right_point_light_blue, flameHeight);

                    this.context.bezierCurveTo(x_right_ctrl_point_1, y_right_ctrl_point_1, x_right_ctrl_point_2, y_right_ctrl_point_2, halfCanvasWidth, flameBottom + c);
                    //this.context.moveTo(x_left_point_light_blue, flameHeight);
                    this.context.bezierCurveTo(x_left_ctrl_point_1, y_left_ctrl_point_1, x_left_ctrl_point_2, y_left_ctrl_point_2, x_left_point_light_blue, flameHeight);
                    this.context.fillStyle = 'lightblue';
                    this.context.fill();

                    // white layer
                    this.context.globalAlpha = 0.8;
                    this.context.beginPath();
                    this.context.moveTo(x_left_point_white, flameHeight);
                    this.context.lineTo(halfCanvasWidth, 70 + a);
                    this.context.lineTo(x_right_point_white, flameHeight);

                    this.context.bezierCurveTo(x_right_ctrl_point_1, y_right_ctrl_point_1, x_right_ctrl_point_2, y_right_ctrl_point_2, halfCanvasWidth, flameBottom + c);
                    //this.context.moveTo(x_left_point_white, flameHeight);
                    this.context.bezierCurveTo(x_left_ctrl_point_1, y_left_ctrl_point_1, x_left_ctrl_point_2, y_left_ctrl_point_2, x_left_point_white, flameHeight);
                    this.context.fillStyle = 'white';
                    this.context.fill();
                }
            }
        }; 

        return FlameService;
    }
]);