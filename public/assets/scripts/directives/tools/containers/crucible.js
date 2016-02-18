'use strict';

/**
 * Crucible
 */
angular.module('labDirectives').directive('crucible', ['$window', '$interval', '$timeout', 'liquidService', 'explodeService',
    'steamService', 'bubbleService', 'GlobalData', 'solidService', 
    function ($window, $interval, $timeout, LiquidService, ExplodeService, SteamService, BubbleService, global, SolidService) {
        return {
            restrict: 'AE',
            templateUrl: 'templates/tools/containers/crucible.html',
            scope: {
                uiData: '='
            },
            link: function (scope, element, attrs) {

                ///////////////////////////////////
                // PRIVATE ATTRIBUTES
                ///////////////////////////////////

                var increaseTempHandler, decreaseTempHandler, evaporateLiquidHandler;
                var solid, liquid, steam, bubble, explode;

                var init = function () {

                	
                	scope.addCssRule = function (rule, css) {
					var css = JSON.stringify(css).replace(/"/g, "").replace(/,/g, ";");
					  
					  $("<style>").prop("type", "text/css").html(rule + css).appendTo("head");
					}
					// Add the styling for the lid position & size
 					scope.addCssRule(".crucible .crucible-lid", {
						'width': initObj.toolsData['crucible'].defaults.lidwidth + '%',
						'height': initObj.toolsData['crucible'].defaults.lidheight + '%',
						'top': initObj.toolsData['crucible'].defaults.lidtop + 'px',
						'right': initObj.toolsData['crucible'].defaults.lidright + '%'
					});

                	
                    // Initialize state
                    scope.uiData.state = scope.uiData.state || {};
                    scope.uiData.state.temperature = scope.uiData.state.temperature || initObj.labData.roomTemperature;
                    scope.uiData.state.liquidTotal = scope.uiData.state.liquidTotal || 0;
                    scope.uiData.state.solidTotal = scope.uiData.state.solidTotal || 0;
                    scope.uiData.state.filledVolume = scope.uiData.state.filledVolume || 0;
                    scope.uiData.state.isClosed = scope.uiData.state.isClosed || true;
                    scope.uiData.state.isPouring = false;
                    scope.uiData.state.isPouringSolid = false;
                    scope.uiData.state.isEmptyLiquid = false;
                    scope.uiData.state.boiling = scope.uiData.state.boiling || false;
                    scope.uiData.state.hasTransition = false;
                    scope.uiData.state.liquidColor = scope.uiData.state.liquidColor || "#fff";
                    scope.uiData.state.liquidTrans = scope.uiData.state.liquidTrans || 0.6;
                    scope.uiData.state.solids = scope.uiData.state.solids || {};

                    element
                        .width(scope.uiData.width)
                        .height(scope.uiData.height);

                    element.find('.crucible').css('background-image', 'url(' + scope.uiData.images.backImg + ')');
                    
                    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
                        element.find('.crucible').find('.crucible-canvas').css('background-image', 'url(' + scope.uiData.images.frontImg + ')');

                    // Center the crucible if attached to burner
                    if (scope.uiData.parent.name == 'bunsenburner') {
                        element.parent().css({
                            'left': '50%',
                            'margin-left': -(scope.uiData.width / 2) + 'px'
                        });
                    }

                    liquid = LiquidService.factory({
                        canvas: element.find('.crucible-canvas')[0],
                        canvassolid: element.find('.crucible-canvas-solid')[0],
                        pourSound: element.find('.pour-sound')[0],
                        coverImgUrl: scope.uiData.images.frontImg,
                        maskImgUrl: scope.uiData.images.maskImg,
                        volume: scope.uiData.volume,
                        maxAmount: scope.uiData.maxAmount,
                        width: 85,
                        height: 83,
                        opaque: true,
                        centerX: {top: 42.5, bottom: 42.5},
                        centerY: {top: 14, bottom: 76},
                        radiusX: {top: 42.5, bottom: 21.5},
                        radiusY: {top: 12, bottom: 6}
                    });

                    solid = SolidService.factory({
                        canvas: element.find('.crucible-canvas-solid')[0],
                        canvas2: element.find('.crucible-canvas-solid2')[0],
                        pourSound: element.find('.pour-sound')[0],
                        volume: scope.uiData.volume,
                        maxAmount: scope.uiData.maxAmount,
                        width: 85,
                        height: 83,
                        centerX: {top: 42.5, bottom: 42.5},
                        centerY: {top: 14, bottom: 76},
                        radiusX: {top: 42.5, bottom: 21.5},
                        radiusY: {top: 12, bottom: 6}
                    });

                    steam = SteamService.factory({
                        canvas: element.find('.steam-canvas')[0],
                        steamImgUrl: scope.uiData.effects.steamImg
                    });

                    bubble = BubbleService.factory({
                        canvas: element.find('.bubble-canvas')[0],
                        bubbleImgUrl: scope.uiData.effects.bubbleImg,
                        bubbleSound: element.find('.bubble-sound')[0]
                    });
                    
                    explode = ExplodeService.factory({
                        canvas: element.find('.exploding-canvas')[0],
                        xFrames: 8,
                        yFrames: 6,
                        fWidth: 256,
                        fHeight: 256,
                        ticksPerFrame: 2,
                        explodeImgUrl: scope.uiData.effects.explodeImg,
                        explodeSound: element.find('.explode-sound')[0]
                    });
                };

                init();

                ////////////////////////////////
                // PUBIC ATTRIBUTES
                ////////////////////////////////

                /**
                 * Check if the liquid is evaporated all
                 * @returns {boolean}
                 */
                scope.isEvaporatedAll = function () {
                    return scope.uiData.state.liquidTotal === 0;
                };

                /**
                 * Change liquid color
                 * @param color
                 * @param transparency
                 */
                scope.changeLiquidColor = function(color, transparency) {
                    scope.uiData.state.liquidColor = color;
                    scope.uiData.state.liquidTrans = transparency;
                };
                
                /**
                 * Change Solid color
                 * @param color
                 * @param transparency
                 * @param material
                 */
                scope.changeSolidColor = function(color, transparency, material) {
                    if(angular.isDefined(scope.uiData.state.solids[material])) {
                        scope.uiData.state.solids[material].color = color;
                        scope.uiData.state.solids[material].transparency = transparency;
                        solid.drawSolid(scope.uiData.state.solids, scope.uiData.state.liquidTotal);
                    } else {
                        console.log("This container does not have " + material);
                    }
                };

                scope.$watch('[uiData.state.liquidColor,uiData.state.liquidTrans]', function (newValue, oldValue) {
                    liquid.setLiquidColor(scope.uiData.state.liquidColor, scope.uiData.state.liquidTrans);
                    if (scope.uiData.state.liquidTotal > 0) {
                        liquid.drawLiquid(scope.uiData.state.filledVolume, scope.uiData.state.liquidTotal);
                    }                   
                }, true);

                /**
                 * Pour liquid to beaker
                 * @param type liquid type
                 * @param volume
                 */
                scope.pourLiquid = function(volume) {
                    if (scope.uiData.state.filledVolume + volume > scope.uiData.maxAmount) {
                        scope.uiData.state.liquidTotal = scope.uiData.maxAmount - scope.uiData.state.solidTotal;
                    } else {
                        scope.uiData.state.liquidTotal += volume;
                    }
                    solid.drawSolid(scope.uiData.state.solids, scope.uiData.state.liquidTotal);
                    scope.uiData.state.filledVolume = scope.uiData.state.liquidTotal + scope.uiData.state.solidTotal;
                    element.find('.crucible').find('.crucible-canvas').removeAttr('style');
                };

                /**
                 * Pour solid to beaker
                 * @param material
                 * @param amount
                 * @param volume
                 */
                scope.pourSolid = function(material, amount, volume) {
                    var status = {};
                    var changeElement = material.name;
                    var changeAmount = amount;
                    if(!angular.isDefined(scope.uiData.state.solids[material.name])) {
                        scope.uiData.state.solids[material.name] = {};
                        scope.uiData.state.solids[material.name].color = material.color;
                        scope.uiData.state.solids[material.name].transparency = material.transparency;
                        scope.uiData.state.solids[material.name].amount = 0;
                    }
                    angular.copy(scope.uiData.state.solids, status);
                    scope.uiData.state.isPouringSolid = true;
                    if (scope.uiData.state.filledVolume + volume > scope.uiData.maxAmount) {
                        scope.uiData.state.solidTotal = scope.uiData.maxAmount - scope.uiData.state.liquidTotal;
                    } else {
                        scope.uiData.state.solidTotal += volume;
                    }
                    scope.uiData.state.solids[material.name].amount += amount;
                    if (volume < 5) {
                        solid.drawSolid(scope.uiData.state.solids, scope.uiData.state.liquidTotal);
                    } else {
                        solid.playPour(status, changeElement, changeAmount, scope.uiData.state.liquidTotal);
                    }
                    scope.uiData.state.filledVolume = scope.uiData.state.liquidTotal + scope.uiData.state.solidTotal;
                };

                /**
                 * Reduce liquid from beaker
                 * @param type liquid type
                 * @param volume
                 */
                scope.reduceLiquid = function(volume) {
                    if (scope.uiData.state.liquidTotal > 0 && scope.uiData.state.liquidTotal - volume <= 0) {
                        scope.uiData.state.isEmptyLiquid = true;
                        scope.uiData.state.liquidTotal = 1;
                    } else {
                        scope.uiData.state.liquidTotal -= volume;
                    }
                    solid.drawSolid(scope.uiData.state.solids, scope.uiData.state.liquidTotal);
                    scope.uiData.state.filledVolume = scope.uiData.state.liquidTotal + scope.uiData.state.solidTotal;
                };

                /**
                 * Reduce solid
                 * @param material
                 * @param amount
                 * @param volume
                 */
                scope.reduceSolid = function(material, amount, volume) {
                    if(angular.isDefined(scope.uiData.state.solids[material.name])) {
                        var status = {};
                        var changeElement = material.name;
                        var changeAmount = -amount;
                        angular.copy(scope.uiData.state.solids, status);
                        if (scope.uiData.state.solids[material.name].amount - amount < 0) {
                            scope.uiData.state.solidTotal -= parseFloat((scope.uiData.state.solids[material.name].amount * volume / amount).toFixed(2));
                            scope.uiData.state.solids[material.name].amount = 0;
                        } else {
                            scope.uiData.state.solids[material.name].amount -= amount;
                            scope.uiData.state.solidTotal -= volume;
                        }
                        if (volume < 5) {
                            solid.drawSolid(scope.uiData.state.solids, scope.uiData.state.liquidTotal);
                        } else {
                            solid.playPour(status, changeElement, changeAmount, scope.uiData.state.liquidTotal);
                        }
                        scope.uiData.state.filledVolume = scope.uiData.state.liquidTotal + scope.uiData.state.solidTotal;
                    }
                };

                scope.showContent = function() {
                    //scope.uiData.state.isPouring = true;
                    solid.drawSolid(scope.uiData.state.solids, scope.uiData.state.liquidTotal);
                    liquid.drawLiquid(scope.uiData.state.liquidTotal, scope.uiData.state.liquidTotal, true);
                    element.find('.bubble-canvas').css('z-index', '1');
                    $window.requestTimeout(function () {
                        liquid.drawLiquid(scope.uiData.state.liquidTotal, scope.uiData.state.liquidTotal, false);
                        element.find('.bubble-canvas').css('z-index', '0');
                    }, 3000);
                };
                
                ///////////////////////////////////
                // WATCHERS
                ///////////////////////////////////

                // When liquid total add from window dialog
                scope.$watch('uiData.state.filledVolume', function (newValue, oldValue) {
                    if (angular.isDefined(newValue)) {
                        newValue = Math.min(newValue, scope.uiData.maxAmount);

                        if (Math.abs(newValue - oldValue) < 5) { // if amount is the same, just draw the beaker
                            scope.uiData.state.isPouring = true;
                            liquid.drawLiquid(newValue, scope.uiData.state.liquidTotal);
                            $window.requestTimeout(function () {
                                scope.uiData.state.isPouringSolid = false;
                                scope.uiData.state.isPouring = false;
                            }, 50);
                        } else {
                            scope.uiData.state.isPouring = true;
                            liquid.playPour(newValue, oldValue, !scope.uiData.state.isPouringSolid, scope.uiData.state.liquidTotal).then(function handleResolve() {

                            }, function handleReject() {
                        
                            }, function handleNotify(event) {
                                global.dashboardInfo.liquidFps = event.fps;
                            }).finally(function () {
                                if (scope.uiData.state.isEmptyLiquid == true) {
                                    scope.uiData.state.isEmptyLiquid = false;
                                    scope.uiData.state.liquidTotal = 0;
                                    solid.drawSolid(scope.uiData.state.solids, scope.uiData.state.liquidTotal);
                                    scope.uiData.state.filledVolume = scope.uiData.state.liquidTotal + scope.uiData.state.solidTotal;
                                    liquid.playPour(newValue - 1, newValue, !scope.uiData.state.isPouringSolid, scope.uiData.state.liquidTotal);
                                }
                                scope.uiData.state.isPouringSolid = false;
                                scope.uiData.state.isPouring = false;
                            });
                        }
                    }
                });

                scope.$on('heating:start', function (evt) {
                    scope.uiData.state.heating = true;
                });

                scope.$on('heating:end', function (evt) {
                    scope.uiData.state.heating = false;
                });

                scope.$watch('uiData.state.boiling', function (newValue, oldValue) {
                    if (angular.isDefined(newValue)) {
                        if(newValue) {
                            // Start steaming
                            if (steam && !steam.isPlaying) {
                                steam.play().then(function handleResolve() {

                                }, function handleReject() {

                                }, function handleNotify(event) {
                                    global.dashboardInfo.steamFps = event.fps;
                                });
                            }

                            // Start bubbling
                            if (bubble && !bubble.isPlaying) {
                                bubble.play().then(function handleResolve() {

                                }, function handleReject() {

                                }, function handleNotify(event) {
                                    global.dashboardInfo.bubbleFps = event.fps;
                                });
                            }
                        } else {
                            // Stop steaming
                            if (steam && steam.isPlaying) {
                                steam.stop();
                            }

                            // Stop bubbling
                            if (bubble && bubble.isPlaying) {
                                bubble.stop();
                            }
                        }
                    }
                });

                scope.$on('API:explode', function (evt) {
                    var transitionDuration = 1800;
                    if(angular.isDefined(scope.uiData.items)) {
                        for (var subitem in scope.uiData.items) {
                            global.tableItems.remove(scope.uiData.items[subitem]);
                        }
                    }
                    scope.uiData.state.isClosed = false;
                    element.find('.exploding-canvas').css('display', 'inherit');
                    explode.play();
                    element.find('.crucible-canvas').remove();
                    element.find('.crucible').css('background-image', 'none');
                    $window.requestTimeout(function() {
                        global.tableItems.remove(scope.uiData);
                    }, transitionDuration);
                });
                
                scope.$on('drag-enter', function () {
                    element.find('.crucible').css('background-image', 'url(' + scope.uiData.images.highlight + ')');
                });

                scope.$on('drag-leave', function () {
                    element.find('.crucible').css('background-image', 'url(' + scope.uiData.images.backImg + ')');
                });

                element.on('$destroy', function () {
                    // Stop steaming
                    if (steam && steam.isPlaying) {
                        steam.stop();
                    }
                    // Stop bubbling
                    if (bubble && bubble.isPlaying) {
                        bubble.stop();
                    }

                    scope.uiData.state.heating = false;
                })
            }
        }
    }
]);

