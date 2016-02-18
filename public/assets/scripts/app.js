var labApp = angular.module("labApp", [
        'labFilters',
        'labDirectives',
        'labServices',
        'ngDraggable',
        'labApp.tools',
        'dragTimer',
        'ngTouch',
        'ui.bootstrap',
        'kendo.directives',
        'ngSanitize'
    ]);

labApp.run(['$window',
    function($window) {
        //requestAnimationFrame() shim
        $window.requestAnimFrame = (function () {
            return $window.requestAnimationFrame ||
                $window.webkitRequestAnimationFrame ||
                $window.mozRequestAnimationFrame ||
                $window.oRequestAnimationFrame ||
                $window.msRequestAnimationFrame ||
                function (callback) {
                    $window.setTimeout(callback, 1000 / 60);
                }
        })();

        /**
         * Behaves the same as setInterval except uses requestAnimationFrame() where possible for better performance
         * @param {function} fn The callback function
         * @param {int} delay The delay in milliseconds
         */
        $window.requestInterval = function(fn, delay) {
            if( !$window.requestAnimationFrame       &&
                !$window.webkitRequestAnimationFrame &&
                !($window.mozRequestAnimationFrame && $window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
                !$window.oRequestAnimationFrame      &&
                !$window.msRequestAnimationFrame)
                return $window.setInterval(fn, delay);

            var start = new Date().getTime(),
                elapsed = 0,
                handle = new Object();

            function loop() {
                handle.value = $window.requestAnimFrame(loop);

                var current = new Date().getTime(),
                    delta = current - start;

                if (delta >= delay) {
                    elapsed += delta;
                    start = new Date().getTime();
                    fn.call(null, elapsed);
                }
            };

            handle.value = $window.requestAnimFrame(loop);
            return handle;
        };

        /**
         * Behaves the same as clearInterval except uses cancelRequestAnimationFrame() where possible for better performance
         * @param {int|object} fn The callback function
         */
        $window.clearRequestInterval = function(handle) {
            $window.cancelAnimationFrame ? $window.cancelAnimationFrame(handle.value) :
                $window.webkitCancelAnimationFrame ? $window.webkitCancelAnimationFrame(handle.value) :
                    $window.webkitCancelRequestAnimationFrame ? $window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
                        $window.mozCancelRequestAnimationFrame ? $window.mozCancelRequestAnimationFrame(handle.value) :
                            $window.oCancelRequestAnimationFrame    ? $window.oCancelRequestAnimationFrame(handle.value) :
                                $window.msCancelRequestAnimationFrame ? $window.msCancelRequestAnimationFrame(handle.value) :
                                    $window.clearInterval(handle);
        };

        /**
         * Behaves the same as setTimeout except uses requestAnimationFrame() where possible for better performance
         * @param {function} fn The callback function
         * @param {int} delay The delay in milliseconds
         */

        $window.requestTimeout = function(fn, delay) {
            if( !$window.requestAnimationFrame          &&
                !$window.webkitRequestAnimationFrame &&
                !($window.mozRequestAnimationFrame && $window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
                !$window.oRequestAnimationFrame      &&
                !$window.msRequestAnimationFrame)
                return $window.setTimeout(fn, delay);

            var start = new Date().getTime(),
                handle = new Object();

            function loop(){
                var current = new Date().getTime(),
                    delta = current - start;

                delta >= delay ? fn.call() : handle.value = $window.requestAnimFrame(loop);
            };

            handle.value = $window.requestAnimFrame(loop);
            return handle;
        };

        /**
         * Behaves the same as clearTimeout except uses cancelRequestAnimationFrame() where possible for better performance
         * @param {int|object} fn The callback function
         */
        $window.clearRequestTimeout = function(handle) {
            $window.cancelAnimationFrame ? $window.cancelAnimationFrame(handle.value) :
                $window.webkitCancelAnimationFrame ? $window.webkitCancelAnimationFrame(handle.value) :
                    $window.webkitCancelRequestAnimationFrame ? $window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
                        $window.mozCancelRequestAnimationFrame ? $window.mozCancelRequestAnimationFrame(handle.value) :
                            $window.oCancelRequestAnimationFrame    ? $window.oCancelRequestAnimationFrame(handle.value) :
                                $window.msCancelRequestAnimationFrame ? $window.msCancelRequestAnimationFrame(handle.value) :
                                    $window.clearTimeout(handle);
        };
    }
]).run(['$rootScope',
    function ($rootScope) {
        // keep track of the state of the loading images.
        $rootScope.statuses = {
            isLoading: true,
            isSuccessful: false,
            percentLoaded: 0,
            isIntroPlaying: true,
            isClosed: false
        };
    }
])
.factory('$exceptionHandler', function ($injector) {
    return function (exception, cause) {
        var $rootScope = $injector.get('$rootScope');
        $rootScope.errors = $rootScope.errors || [];
        $rootScope.errors.push(exception.message);
        
        console.log('exceptionHandler Error!!!!!!!!!!');
        console.log($rootScope.errors);
        console.log('=======');
    };
});