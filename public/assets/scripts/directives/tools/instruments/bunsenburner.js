'use strict';

/**
 * Bunsen Burner
 */
angular.module('labDirectives').directive('bunsenburner', ['$timeout', 'flameService', 'GlobalData', 'itemService', '$window',
    function ($timeout, FlameService, global, itemService, $window) {
        return {
            restrict: 'AE',
            templateUrl: 'templates/tools/instruments/bunsenburner.html',
            scope: {
                uiData: '='
            },
            link: function (scope, element, attrs) {
                var nextFlameStatus = {
                    off: 'low',
                    low: 'medium',
                    medium: 'high',
                    high: 'off'
                };
                var flameStatus = 'off';
                var flame;

                function init() {
                	/**********************************************
                	 * Asset Styling
                	 * Replaces the size & positioning data in less
                	 **********************************************/                	
            		scope.addCssRule = function (rule, css) {
					var css = JSON.stringify(css).replace(/"/g, "").replace(/,/g, ";");
					  
					  $("<style>").prop("type", "text/css").html(rule + css).appendTo("head");
					}
					// Add the styling for the bunsenburner gas tap
 					scope.addCssRule(".bunsenburner .bunsenburner-tap", {
						'width': initObj.toolsData['bunsenburner'].defaults.tapwidth + 'px',
						'height': initObj.toolsData['bunsenburner'].defaults.tapheight + 'px',
						'bottom': initObj.toolsData['bunsenburner'].defaults.tapbottom + '%',
						'left': initObj.toolsData['bunsenburner'].defaults.tapleft + '%'
					});
 					// Add the styling for the bunsenburner tripod
 					scope.addCssRule(".bunsenburner .bunsenburner-tripod", {
						'width': initObj.toolsData['bunsenburner'].defaults.tripodwidth + '%',
						'height': initObj.toolsData['bunsenburner'].defaults.tripodheight + '%',
						'bottom': initObj.toolsData['bunsenburner'].defaults.tripodbottom + '%',
						'left': initObj.toolsData['bunsenburner'].defaults.tripodleft + '%'
					});
 					// Add the styling for the erlenmeyerflash attached to the bunsenburner
 					scope.addCssRule(".bunsenburner .sub-erlenmeyerflask", {
						'bottom': initObj.toolsData['bunsenburner'].defaults.flaskbottom + '%',
						'left': initObj.toolsData['bunsenburner'].defaults.flaskleft + '%'
					});
 					// Add the styling for the beaker attached to the bunsenburner
 					scope.addCssRule(".bunsenburner .sub-beaker", {
						'bottom': initObj.toolsData['bunsenburner'].defaults.beakerbottom + '%',
						'left': initObj.toolsData['bunsenburner'].defaults.beakerleft + '%'
					});
 					// Add the styling for the crucible attached to the bunsenburner
 					scope.addCssRule(".bunsenburner .sub-crucible", {
						'bottom': initObj.toolsData['bunsenburner'].defaults.cruciblebottom + '%',
						'left': initObj.toolsData['bunsenburner'].defaults.crucibleleft + '%'
					});
 					
                   element
                        .width(scope.uiData.width)
                        .height(scope.uiData.height);
                    //Init element flame status in data struc so it can be exported
                    scope.uiData.state = scope.uiData.state || {};
                    scope.uiData.state.flame = scope.uiData.state.flame ||'off';

                    // element.find('.bunsenburner').css('background-image', 'url(' + scope.uiData.images.thumbnail + ')');
                    element.find('.bunsenburner').css('background-image', 'url(' + scope.uiData.images.table + ')');
                    element.find('.bunsenburner-tap').css('background-image', 'url(' + scope.uiData.images.tapImg + ')');

                    flame = FlameService.factory({
                        canvas: element.find('.flame-canvas')[0],
                        flameSound: element.find('.flame-sound')[0]
                    });
                    
                    $window[scope.uiData.uuid] = scope;
                }

                init();

                /**
                 * Notify heating to beaker
                 */
                var notifyHeating = function () {
                    if (flameStatus !== 'off') {
                        scope.$broadcast('heating:start');
                    } else {
                        scope.$broadcast('heating:end');
                    }
                };


                /**
                 * Adjust flame
                 */
                scope.adjustFlame = function () {
                    // Rotate heat tap
                    var tap = element.find('.bunsenburner-tap');

                    tap.addClass('rotate');
                    $timeout(function () {
                        tap.removeClass('rotate');
                    }, 2000);

                    // change flame status
                    flameStatus = nextFlameStatus[flameStatus];
                    //notifyHeating();

                    // Play or stop the sound of fire
                    if (flameStatus === 'off') {
                        // Stop flame
                        flame.setStatus(flameStatus);
                        flame.stop();
                    } else {
                        // draw flame
                        flame.setStatus(flameStatus);
                        flame.play().then(function handleResolve() {

                        }, function handleReject() {

                        }, function handleNotify(event) {
                            global.dashboardInfo.flameFps = event.fps;
                        });
                    }
                    //Adjust element's flame state
                    scope.uiData.state.flame = flameStatus;

                    var itemData = {
                        id: scope.uiData.uuid,
                        flame: scope.uiData.state.flame
                    }

                    API.onBunsenburner_adjustFlame(itemData);
                };

                scope.setFlame = function (status) {
                    // Rotate heat tap
                    var tap = element.find('.bunsenburner-tap');

                    tap.addClass('rotate');
                    $timeout(function () {
                        tap.removeClass('rotate');
                    }, 2000);

                    // change flame status
                    flameStatus = status;
                    //flameStatus = nextFlameStatus[flameStatus];
                    //notifyHeating();

                    // Play or stop the sound of fire
                    if (flameStatus === 'off') {
                        // Stop flame
                        flame.setStatus(flameStatus);
                        flame.stop();
                    } else {
                        // draw flame
                        flame.setStatus(flameStatus);
                        flame.play().then(function handleResolve() {

                        }, function handleReject() {

                        }, function handleNotify(event) {
                            global.dashboardInfo.flameFps = event.fps;
                        });
                    }
                };
                
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

                element.on('$destroy', function () {
                    if (flame && flame.isPlaying) {
                        flame.stop();
                    }
                });

                scope.$watch('uiData.beaker', function (newVal, oldVal) {
                    var flameCanvas = element.find('.flame-canvas');

                    if (newVal) {
                        flameCanvas.addClass('beaker-attached');

                        // Save sub-beaker position relative to parent
                        if (scope.uiData.beaker) {
                            var position = element.find('.sub-beaker').position();

                            scope.uiData.beaker.left = position.left;
                            scope.uiData.beaker.top = position.top;
                        }
                    } else {
                        flameCanvas.removeClass('beaker-attached');
                    }

                    notifyHeating();
                });

                scope.$watch('uiData.erlenmeyerflask', function (newVal, oldVal) {
                    var flameCanvas = element.find('.flame-canvas');

                    if (newVal) {
                        flameCanvas.addClass('beaker-attached');

                        // Save sub-beaker position relative to parent
                        if (scope.uiData.erlenmeyerflask) {
                            var position = element.find('.sub-erlenmeyerflask').position();

                            scope.uiData.erlenmeyerflask.left = position.left;
                            scope.uiData.erlenmeyerflask.top = position.top;
                        }
                    } else {
                        flameCanvas.removeClass('beaker-attached');
                    }

                    notifyHeating();
                });

                scope.$watch('uiData.crucible', function (newVal, oldVal) {
                    var flameCanvas = element.find('.flame-canvas');

                    if (newVal) {
                        flameCanvas.addClass('beaker-attached');

                        // Save sub-beaker position relative to parent
                        if (scope.uiData.crucible) {
                            var position = element.find('.sub-crucible').position();

                            scope.uiData.crucible.left = position.left;
                            scope.uiData.crucible.top = position.top;
                        }
                    } else {
                        flameCanvas.removeClass('beaker-attached');
                    }

                    notifyHeating();
                });             

                scope.$on('drag-enter', function () {
                    element.find('.bunsenburner').css('background-image', 'url(' + scope.uiData.images.highlight + ')');
                });

                scope.$on('drag-leave', function () {
                    element.find('.bunsenburner').css('background-image', 'url(' + scope.uiData.images.table + ')');
                });

                //If the element is created with the flame on (restoring from saved state)
                //then turn it on
                if (scope.uiData.state.flame !== 'off') {
                    scope.adjustFlame(scope.uiData.state.flame);
                }
            }
        }
    }
]);
