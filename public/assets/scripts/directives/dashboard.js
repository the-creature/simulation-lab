        'use strict';
/*
 * lab instrument directive for lab app.
 */
angular.module('labDirectives').directive('dashboard', ['$rootScope', '$interval', 'GlobalData',
    function ($rootScope, $interval, global) {
        return {
            templateUrl: 'templates/dashboard.html',
            restrict: 'E',
            replace: false,
            scope: {},
            link: function (scope, element, attrs) {
                var perfData = window.performance.timing;
                var intervalId;

                scope.info = global.dashboardInfo;

                function refreshDashboard() {
                    // only chrome support memory monitoring
                    scope.info.memory = performance.memory && performance.memory.usedJSHeapSize ?
                        (Math.round(performance.memory.usedJSHeapSize / 10000, 2) / 100) : 0;

                    // Calculate request response times:
                    scope.info.responseTime = perfData.responseEnd - perfData.requestStart;

                    // Calculate the total time required to load a page:
                    if (perfData.loadEventEnd - perfData.navigationStart < 0) {
                        scope.info.loadTime = "TBD ";
                    } else {
                        scope.info.loadTime = perfData.loadEventEnd - perfData.navigationStart;
                    }

                    // Calculate the total objects count
                    scope.info.objects = Object.keys(global.tableItems.items).length;
                }

                $rootScope.$on('clearTable', function () {
                    scope.info.liquidFps = 0;
                    scope.info.steamFps = 0;
                    scope.info.bubbleFps = 0;
                    scope.info.flameFps = 0;
                });

                intervalId = $interval(function () {
                    refreshDashboard();
                }, 1000);

                element.on('$destroy', function () {
                    $interval.cancel(intervalId);
                });
            }
        }
    }
]);