/*
 * Define a controller for lab.
 */
angular.module('labApp').controller('labController', ['$scope', '$rootScope', 'panzoomService',
    'GlobalData', '$window', '$timeout', 'keyboardManager', 'modalService',
    function ($scope, $rootScope, panzoom, global, $window, $timeout, keyboardManager, modal) {
        $scope.statuses = $rootScope.statuses;

        // Init table items
        $scope.tableItems = global.tableItems.items;
        $scope.labNotes = global.tableItems.labNotes;

        $scope.fullScreen = false;

        // Zoom action signal, values: none, zoomIn, zoomOut
        var zoomAction = '';
        var zoomInterval = 100;

        //Initialize draggable times list
        $scope.dragTimers = [];

        // current zoom pan matrix
        $scope.matrix = [1, 0, 0, 1, 0, 0];

        $scope.$on('updateLabNotes', function(event, data) {
            $scope.labNotes = global.tableItems.labNotes;
        });
        
        $scope.$on('stop-timer-event', function (event, data) {
            var index = $scope.dragTimers.indexOf(data);
            $scope.dragTimers.splice(index, 1);
        });

        $scope.$on('panzoom:change', function (evt, args) {
            var newMatrix = args.matrix;

            //update table items coordinates based on zoom
            //for (var id in $scope.tableItems) {
            //    $scope.tableItems[id].left = $scope.tableItems[id].left * newMatrix[0] / $scope.matrix[0];
            //    $scope.tableItems[id].top = $scope.tableItems[id].top * newMatrix[3] / $scope.matrix[3];
            //}

            $scope.matrix = newMatrix;
        });

        $scope.$on('panzoom:disable', function() {
            panzoom.disable();
        });

        $scope.$on('panzoom:enable', function() {
            panzoom.enable();
        });

        $scope.$on('destroy', function () {
            panzoom.destroy();
        });

        angular.element($window).bind('resize', function() {
            API.sendScreenSize($window.innerWidth, $window.innerHeight);
        });

        var init = function () {
            var $workspace = $('.workspace');

            // Init panzoom service
            panzoom.init($workspace);

            // Add keyboard events
            // + keystroke
            keyboardManager.bind('plus', function() {
                panzoom.zoomIn();
            }, {
                'type': 'keypress',
                'inputDisabled': true
            });
            keyboardManager.bind('shift+plus', function() {
                panzoom.zoomIn();
            }, {
                'type': 'keypress',
                'inputDisabled': true
            });

            // - keystroke
            keyboardManager.bind('', function() {
                panzoom.zoomOut();
            }, {
                'type': 'keypress',
                'inputDisabled': true,
                'keyCode': 45
            });

            // r & R stroke
            keyboardManager.bind('r', function() {
                panzoom.zoomOff();
            }, {
                'type': 'keypress',
                'inputDisabled': true
            });

            keyboardManager.bind('l', function() {
                modal.logModal();
            }, {
                'type': 'keypress',
                'inputDisabled': true
            });

            keyboardManager.bind('shift+p', function() {
                API.playerOpen();
            }, {
                'type': 'keypress',
                'inputDisabled': true
            });

            API.sendScreenSize($window.innerWidth, $window.innerHeight);
        };

        init();


        $scope.keyPress = function (e) {
            console.log(e);
        };

        var performZoomIn = function() {
            if (zoomAction === 'zoomIn') {
                $timeout(function() {
                    panzoom.zoomIn();
                    performZoomIn();
                }, zoomInterval);
            }
        };

        var performZoomOut = function() {
            if (zoomAction === 'zoomOut') {
                $timeout(function() {
                    panzoom.zoomOut();
                    performZoomOut();
                }, zoomInterval);
            }
        };

        /**
         * Stop zoomIn or zoomOut
         */
        $scope.stopZoom = function() {
            zoomAction = '';
        };

        $scope.zoomIn = function () {
            zoomAction = 'zoomIn';
            performZoomIn();
        };

        $scope.zoomOut = function () {
            zoomAction = 'zoomOut';
            performZoomOut();
        };

        $scope.zoomOff = function () {
            panzoom.zoomOff();
        };

        $scope.isTableEmpty = function () {
            return global.tableItems.isEmpty();
        };

    }
]);