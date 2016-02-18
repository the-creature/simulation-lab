angular.module('labServices').factory('outlineService', ['$window', '$q', 'fpsService',
    function ($window, $q, FpsService) {
        var OutlineService = function (params) {
            this.canvas = params.canvas;
            this.context = this.canvas.getContext('2d');
            this.width = params.width; // width of canvas
            this.height = params.height; // height of canvas
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.image = new Image();

            this.points = [];

            self = this;

            // Load cover image
            $(this.image).load(function (event) {

            }).prop('src', params.imageUrl || 'assets/images/shelf/containers/beaker/250ml_beaker.png');
        };

        // ---
        // STATIC METHODS
        // ---

        OutlineService.factory = function (params) {
            var outline = new OutlineService(params);

            return outline;
        };

        // ---
        // INSTANCE METHODS
        // ---

        OutlineService.prototype = {

            constructor: OutlineService,

            // ---
            // PUBLIC METHODS
            // ---
            drawOutline: function () {
                // grab the image's pixel data
                this.context.drawImage(this.image, 0, 0, this.width, this.height);
                this.points = MarchingSquares.getBlobOutlinePoints(this.canvas); // returns [x1,y1,x2,y2,x3,y3... etc.]

                this.context.strokeStyle = "#00FFFF";

                this.context.shadowColor = '#00FFFF';
                this.context.shadowBlur = 20;
                this.redraw();

                this.context.restore();

                this.data = [];
                this.points = [];
            },

            redraw: function () {
                // clear the canvas
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

                // draw the image
                this.context.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

                // draw the path (consisting of connected points)
                this.context.beginPath();
                this.context.moveTo(this.points[0], this.points[1]);
                for (var i = 2; i < this.points.length; i += 2) {
                    this.context.lineTo(this.points[i], this.points[i+1]);
                }
                this.context.closePath();
                this.context.stroke();
            },

            reset: function() {
                console.log('reset');
                // clear the canvas
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

                this.points = [];
            }

        };

        return OutlineService;
    }
]);