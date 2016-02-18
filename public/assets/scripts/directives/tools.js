angular.module('labApp.tools', ['labServices']).directive('tableTools', ['$rootScope', 'GlobalData', 'modalService',
    function ($rootScope, global, modal) {
        return {
            restrict: 'EA',
            templateUrl: "templates/tools.html",
            scope: {
                onClearEvent: '=',
                dragTimers: '='
            },
            link: function (scope, element, attrs) {
                var clearTable = function () {
                    // Remove all items
                    global.tableItems.removeAll();

                    if (angular.isArray(scope.dragTimers)) {
                        scope.dragTimers = [];
                    }
                    if (angular.isFunction(scope.onClearEvent)) {
                        scope.onClearEvent();
                    }
                };

                scope.clearTableItemsClickHandler = function () {
                    var title = 'Clear Table Confirmation';
                    var message = 'Clearing the table will remove all lab materials in use from the work area. ' +
                        'Are you sure you want to remove them?';

                    modal.errorModal(title, message).then(function () {
                        clearTable();
                    });
                };

                scope.exit = function () {
                    modal.exitModal().then(function () {
                        $rootScope.$emit('clearTable');
                        $rootScope.$emit('labExit');
                    });
                };

                scope.showLog = function () {
                    modal.logModal();
                };

                scope.showMediaPlayer = function () {
                    API.playerOpen();
                };

                scope.showAdmin = function () {
                    $('.admin').removeClass('hide');
                };                

                var saveTable = $rootScope.$on('API.saveTable', function(event, data) {
                    global.tableItems.save();
                }); 

                var restoreTable = $rootScope.$on('API.restoreTable', function(event, data) {
                    global.tableItems.restoreState();
                }); 

                var cleanTable = $rootScope.$on('API.cleanTable', function(event, data) {
                    clearTable();
                }); 

                $rootScope.$on('clearTable', function () {
                    clearTable();
                });

                $rootScope.$on('API.playerOpen', function(event, data) {
                    modal.playerModal();
                });

                // unbind listeners when destroy
                scope.$on('destroy', function () {
                    saveTable();
                    restoreTable();
                    cleanTable();
                });
            }
        };
    }
]);