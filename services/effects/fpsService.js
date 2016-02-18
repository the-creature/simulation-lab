angular.module('labServices').factory('fpsService', [
    function () {
        var FpsService = function () {
            this.startTime = 0;
            this.frameNumber = 0;
        };

        FpsService.prototype = {
            constructor: FpsService,

            getFps: function () {
                this.frameNumber++;
                var d = new Date().getTime(),
                    currentTime = ( d - this.startTime ) / 1000,
                    result = Math.floor(( this.frameNumber / currentTime ));

                if (currentTime > 1) {
                    this.startTime = new Date().getTime();
                    this.frameNumber = 0;
                }
                return result;
            }
        };

        return FpsService;
    }
]);