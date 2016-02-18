'use strict';

/**
 * Balance
 */
angular.module('labDirectives').directive('balance', ['itemService', 'GlobalData', '$window',
    function (itemService, global, $window) {
        return {
            restrict: 'AE',
            templateUrl: 'templates/tools/instruments/balance.html',
            scope: {
                uiData: '='
            },
            link: function (scope, element, attrs) {
                ///////////////////////////////
                // PRIVATE ATTRIBUTES
                ///////////////////////////////
                var nextScales = {
                    'g': 'mg',
                    'mg': 'g'
                };
                                
                scope.currentWeight = 0;
                
                var init = function () {
                    // Initialize state
                    scope.uiData.state = scope.uiData.state || {};
                    //weights will be stored in mg as storing in g may lead to
                    //loose of presition. Still initial unit for the balance will
                    //be grams
                    scope.uiData.state.scale = scope.uiData.state.scale || 'g';
                    scope.uiData.state.zero = scope.uiData.state.zero || 0;

                    element
                        .width(scope.uiData.width)
                        .height(scope.uiData.height);

                    // Set background image
                    element.find('.balance').css('background-image', 'url(' + scope.uiData.images.thumbnail + ')');
                                        
                    $window[scope.uiData.uuid] = scope;
                };

                init();
                
                ///////////////////////////////
                // PUBIC ATTRIBUTES
                ///////////////////////////////

                /**
                 * Click handler for change weight scale
                 */
                scope.changeScale = function () {
                    var currentScale = scope.uiData.state.scale || 'g';
                    scope.uiData.state.scale = nextScales[currentScale];

                    API.balance_userChangeScale(scope.uiData.state.scale);
                };
                
                /**
                 * API calls
                 */
                scope.setScale = function (scale) {
                    if(!(scale in nextScales)) {
                        console.log("Balance scale value not supported: " + scale);
                    } else {
                        scope.uiData.state.scale = scale;
                    }
                };

                scope.setWeight = function (weight) {
                    scope.currentWeight = weight;
                };

                scope.turnOff = function () {
                    element.find('.balance .weight').css('display', 'none');
                };

                scope.turnOn = function () {
                    element.find('.balance .weight').css('display', '');
                };

                /**
                 * Click handler for change balance Zero
                 */
                scope.zeroBalance = function () {
                    scope.uiData.state.zero = scope.currentWeight;
                    API.balance_userSetZero(scope.uiData.uuid);
                };
                
                var updateTotalWeight = function() {
                    var weight = 0;
                    if(angular.isDefined(scope.uiData.items)) {
                        for (var subitem in scope.uiData.items) {
                            weight += itemService.getTotalItemWeight(scope.uiData.items[subitem]);
                        }
                    }
                    return weight;
                };

                scope.$watch('[uiData.beaker.state,uiData.beaker.thermometer.state]', function (newVal, oldVal) {
                    scope.currentWeight = updateTotalWeight();
                    if (newVal) {
                        // Save sub-beaker position relative to parent
                        if (scope.uiData.beaker) {
                            var position = element.find('.sub-beaker').position();

                            scope.uiData.beaker.left = position.left;
                            scope.uiData.beaker.top = position.top;
                        }
                    }
                }, true);
                
                scope.$watch('[uiData.erlenmeyerflask.state,uiData.erlenmeyerflask.thermometer.state, uiData.erlenmeyerflask.pressuregauge.state]', function (newVal, oldVal) {
                    scope.currentWeight = updateTotalWeight();
                    if (newVal) {
                        // Save sub-beaker position relative to parent
                        if (scope.uiData.erlenmeyerflask) {
                            var position = element.find('.sub-erlenmeyerflask').position();

                            scope.uiData.erlenmeyerflask.left = position.left;
                            scope.uiData.erlenmeyerflask.top = position.top;
                        }
                    }
                }, true);

                scope.$watch('[uiData.graduatedcylinder.state,uiData.graduatedcylinder.thermometer.state]', function (newVal, oldVal) {
                    scope.currentWeight = updateTotalWeight();
                    if (newVal) {
                        // Save sub-beaker position relative to parent
                        if (scope.uiData.graduatedcylinder) {
                            var position = element.find('.sub-graduatedcylinder').position();

                            scope.uiData.graduatedcylinder.left = position.left;
                            scope.uiData.graduatedcylinder.top = position.top;
                        }
                    }
                }, true);

                scope.$watch('[uiData.crucible.state,uiData.crucible.thermometer.state]', function (newVal, oldVal) {
                    scope.currentWeight = updateTotalWeight();
                    if (newVal) {
                        // Save sub-beaker position relative to parent
                        if (scope.uiData.crucible) {
                            var position = element.find('.sub-crucible').position();

                            scope.uiData.crucible.left = position.left;
                            scope.uiData.crucible.top = position.top;
                        }
                    }
                }, true);              

                scope.$on('drag-enter', function () {
                    element.find('.balance').css('background-image', 'url(' + scope.uiData.images.overlay + ')');
                });

                scope.$on('drag-leave', function () {
                    element.find('.balance').css('background-image', 'url(' + scope.uiData.images.thumbnail + ')');
                });

                scope.onDropToBeakerComplete = function (data, event) {
                    var itemScope = angular.element("[data-uuid='" + data.uuid + "']").isolateScope();
                    if(angular.isDefined(itemScope)) {
                        itemScope = itemScope.$parent.$parent;
                    } else {
                        itemScope = scope;
                    }
                    itemService.updatePosition(data, event).then(function() {
                        itemService.dropItem(itemScope, scope.uiData.beaker, data, event).then(function() {
                            itemService.revertItem(data);
                        }, function() {
                            if (!data.uuid) {
                                var el = event.element;
                                el.css(event.initialPosition);
                            }
                        });
                    });
                };
                
                scope.onDropToErlenmeyerflaskComplete = function (data, event) {
                    var itemScope = angular.element("[data-uuid='" + data.uuid + "']").isolateScope();
                    if(angular.isDefined(itemScope)) {
                        itemScope = itemScope.$parent.$parent;
                    } else {
                        itemScope = scope;
                    }
                    itemService.updatePosition(data, event).then(function() {
                        itemService.dropItem(itemScope, scope.uiData.erlenmeyerflask, data, event).then(function() {
                            itemService.revertItem(data);
                        }, function() {
                            if (!data.uuid) {
                                var el = event.element;
                                el.css(event.initialPosition);
                            }
                        });
                    });
                };
                
                scope.onDropToGraduatedcylinderComplete = function (data, event) {
                    var itemScope = angular.element("[data-uuid='" + data.uuid + "']").isolateScope();
                    if(angular.isDefined(itemScope)) {
                        itemScope = itemScope.$parent.$parent;
                    } else {
                        itemScope = scope;
                    }
                    itemService.updatePosition(data, event).then(function() {
                        itemService.dropItem(itemScope, scope.uiData.graduatedcylinder, data, event).then(function() {
                            itemService.revertItem(data);
                        }, function() {
                            if (!data.uuid) {
                                var el = event.element;
                                el.css(event.initialPosition);
                            }
                        });
                    });
                };
                
                scope.onDropToCrucibleComplete = function (data, event) {
                    var itemScope = angular.element("[data-uuid='" + data.uuid + "']").isolateScope();
                    if(angular.isDefined(itemScope)) {
                        itemScope = itemScope.$parent.$parent;
                    } else {
                        itemScope = scope;
                    }
                    itemService.updatePosition(data, event).then(function() {
                        itemService.dropItem(itemScope, scope.uiData.crucible, data, event).then(function() {
                            itemService.revertItem(data);
                        }, function() {
                            if (!data.uuid) {
                                var el = event.element;
                                el.css(event.initialPosition);
                            }
                        });
                    });
                };
            }
        }
    }
]);

