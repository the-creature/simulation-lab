angular.module('labServices').factory('modalService', ['$uibModal',
    function($modal) {
        var pourModal = function (maxPour, unit, showPourAll) {
            var pourModalCtrl = function ($scope, $modalInstance, data) {
                $scope.maxPour = data.maxPour;
                $scope.unit = data.unit;
                $scope.input = 0;
                $scope.showPourAll = data.showPourAll || false; // pour from shelf item to container, hide 'pour all' option, show when pour from container to container

                $scope.getFocus = function (e) {
                    $('input')[0].focus();
                };

                // return with success
                $scope.ok = function () {
                    var input = $scope.pourAll ? maxPour : $scope.input;

                    $modalInstance.close(input);
                };

                // return as cancel
                $scope.cancel = function () {
                    $modalInstance.dismiss('modal cancel');
                };
            };

            var modal = $modal.open({
                templateUrl: 'templates/modals/pourModal.html',
                controller: pourModalCtrl,
                size: 'sm',
                keyboard: false,
                backdrop: false,
                windowClass: "modal-window",
                resolve: {
                    data: function () {
                        return {
                            maxPour: maxPour,
                            unit: unit,
                            showPourAll: showPourAll
                        };
                    }
                }
            });

            return modal.result;
        };

        var errorModal = function (title, message) {
            var errorModalCtrl = function ($scope, $modalInstance, data) {
                $scope.data = data;

                // return with success
                $scope.ok = function () {
                    $modalInstance.close();
                };

                // return as cancel
                $scope.cancel = function () {
                    $modalInstance.dismiss('modal cancel');
                };
            };

            var modal = $modal.open({
                templateUrl: 'templates/modals/errorModal.html',
                controller: errorModalCtrl,
                size: 'sm',
                keyboard: false,
                backdrop: false,
                windowClass: "modal-window",
                resolve: {
                    data: function () {
                        return {
                            title: title,
                            message: message
                        };
                    }
                }
            });

            return modal.result;
        };

        var exitModal = function () {
            var exitModalCtrl = function ($scope, $modalInstance) {

                $scope.ok = function () {
                    $modalInstance.close();
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss('modal cancel');
                };
            };

            var modal = $modal.open({
                templateUrl: 'templates/modals/exitModal.html',
                controller: exitModalCtrl,
                size: 'sm',
                keyboard: false,
                backdrop: false,
                windowClass: "modal-window"
            });

            return modal.result;
        };

        var logModal = function () {
            var logModalCtrl = function ($scope, $modalInstance, GlobalData) {
                $scope.logGridOptions = {
                    dataSource: {
                        data: GlobalData.eventLogs,
                        schema: {
                            model: {
                                fields: {
                                    logType: { type: "string" },
                                    logTime: { type: "date" },
                                    logText: { type: "string" }
                                }
                            }
                        },
                        pageSize: 10,
                        sort: {
                            field: 'logTime',
                            dir: 'desc'
                        }
                    },
                    sortable: true,
                    filterable: false,
                    selectable: 'row',
                    pageable: {
                        input: true,
                        numeric: false
                    },
                    columns: [
                        {
                            field: "logType",
                            title: "Type",
                            width: "70px",
                            template: function(dataItem) {
                                if (dataItem.logType == 'info') {
                                    return '<i class="fa fa-info"></i>';
                                } else if (dataItem.logType == 'system') {
                                    return '<i class="fa fa-desktop"></i>';
                                } else if (dataItem.logType == 'user') {
                                    return '<i class="fa fa-user"></i>';
                                } else if (dataItem.logType == 'alert') {
                                    return '<i class="fa fa-exclamation-triangle"></i>';
                                }
                            }
                        },
                        { field: "logTime", title: "Time", format: "{0:hh:mm:ss tt}", width: "120px" },
                        { field: "logText", title: "Text" }
                    ]
                };

                $scope.ok = function () {
                    $modalInstance.close();
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss('modal cancel');
                };
            };

            var modal = $modal.open({
                templateUrl: 'templates/modals/logModal.html',
                controller: logModalCtrl,
                size: 'lg',
                keyboard: false,
                bacdrop: false,
                windowClass: 'modal-window'
            });

            return modal.result;
        };

        var playerModal = function () {
            var playerModalCtrl = function ($scope, $modalInstance) {
                // return with success
                $scope.ok = function () {
                    API.playerClosed();
                };

                // return as cancel
                $scope.cancel = function () {
                    $modalInstance.dismiss('modal cancel');
                };

                // listen close player event
                $scope.$on('API.playerClosed', function(event, data) {
                    $modalInstance.close();
                });
            };

            var modal = $modal.open({
                templateUrl: 'templates/modals/playerModal.html',
                controller: playerModalCtrl,
                size: 'sm',
                keyboard: false,
                backdrop: false,
                windowClass: "modal-window"
            });

            return modal.result;
        };
        
        var itemPropertiesModal = function (labelDesc, label, type, state, exposed, uuid) {
            var itemPropertiesModalCtrl = function ($scope, $modalInstance, output) {
                $scope.type      = output.type;
                $scope.stateOrg  = output.state;
                $scope.state     = output.state;
                $scope.labelDesc = output.labelDesc;
                $scope.label     = output.label;
                $scope.exposed   = output.exposed;

                // return with success
                $scope.ok = function () {
                    output.label = $scope.label;
                    output.state = $scope.state;
                    output.exposed = $scope.exposed;
                    $modalInstance.close(output);

                    if(type == 'erlenmeyerflask' || type == 'crucible') {
                        if ($scope.stateOrg !== output.state ) {
                            var action = type + ( output.state == 'true' ? '_user_closed' : '_user_opened');
                            API[action](uuid);
                        }
                    }
                };

                // return as cancel
                $scope.cancel = function () {
                    $modalInstance.dismiss('modal cancel');
                };
            };

            var modal = $modal.open({
                templateUrl: 'templates/modals/itemPropertiesModal.html',
                controller: itemPropertiesModalCtrl,
                size: 'sm',
                keyboard: false,
                backdrop: false,
                windowClass: "modal-window",
                resolve: {
                    output: function () {
                        return {
                            state: state,
                            labelDesc: labelDesc,
                            label: label,
                            type: type,
                            exposed: exposed
                        };
                    }
                }
            });

            return modal.result;
        };

        return {
            pourModal: pourModal,
            errorModal: errorModal,
            exitModal: exitModal,
            logModal: logModal,
            playerModal: playerModal,
            itemPropertiesModal: itemPropertiesModal
        };
    }
]);

angular.module('labDirectives').directive('ngEnter', [
    function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    scope.$apply(function (){
                        scope.$eval(attrs.ngEnter);
                    });
     
                    event.preventDefault();
                }
            });
        };
    }
]);