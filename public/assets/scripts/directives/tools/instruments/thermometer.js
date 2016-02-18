'use strict';

/**
 * Beaker
 */
angular.module('labDirectives').directive('thermometer', [
    function () {
        return {
            restrict: 'AE',
            templateUrl: 'templates/tools/instruments/thermometer.html',
            scope: {
                uiData: '='
            },
            link: function (scope, element, attrs) {
                ///////////////////////////////
                // PRIVATE ATTRIBUTES
                ///////////////////////////////
                var nextScales = {
                    'C': 'F',
                    'F': 'K',
                    'K': 'C'
                };

                var init = function () {
                	scope.addCssRule = function (rule, css) {
					var css = JSON.stringify(css).replace(/"/g, "").replace(/,/g, ";");
					  
					  $("<style>").prop("type", "text/css").html(rule + css).appendTo("head");
					}
					// Add the styling for the thermometer readout display
 					scope.addCssRule(".thermometer .temperature", {
						'font-size': initObj.toolsData['thermometer'].defaults.displaysize + 'px',
						'right': initObj.toolsData['thermometer'].defaults.displayright + '%',
						'top': initObj.toolsData['thermometer'].defaults.displaytop + '%',
						'width': initObj.toolsData['thermometer'].defaults.displaywidth + '%'
					});
					// Add the styling for the thermometer gauge button
					scope.addCssRule(".thermometer .button-scale-change", {
						'font-size': initObj.toolsData['thermometer'].defaults.buttonsize + 'px',
						'width': initObj.toolsData['thermometer'].defaults.buttonwidth + 'px',
						'height': initObj.toolsData['thermometer'].defaults.buttonheight + '%',
						'left': initObj.toolsData['thermometer'].defaults.buttonleft + '%',
						'top': initObj.toolsData['thermometer'].defaults.buttontop + '%'
					});
                    // Initialize state
                    scope.uiData.state = scope.uiData.state || {};
                    scope.uiData.state.scale = scope.uiData.state.scale || 'C';

                    element
                        .width(scope.uiData.width)
                        .height(scope.uiData.height);

                    // Set background image
                    // element.find('.thermometer').css('background-image', 'url(' + scope.uiData.images.thumbnail + ')');
                    element.find('.thermometer').css('background-image', 'url(' + scope.uiData.images.table + ')');

                    // Stop click event bubbling up to parent element
                    element.bind('click', function (e) {
                        e.stopPropagation();
                    });
                };

                init();



                ///////////////////////////////
                // PUBIC ATTRIBUTES
                ///////////////////////////////

                /**
                 * Click handler for change temperature scale
                 */
                scope.changeScale = function ($event) {
                    $event.stopPropagation();
                    var currentScale = scope.uiData.state.scale || 'C';
                    scope.uiData.state.scale = nextScales[currentScale];
                    API.thermometer_userChangeScale(scope.uiData.uuid, scope.uiData.state.scale);
                };
                
                /**
                 * API calls
                 */
                scope.setScale = function (scale) {
                    if(!(scale in nextScales)) {
                        console.log("Thermometer scale value not supported: " + scale);
                    } else {
                        scope.uiData.state.scale = scale;
                    }
                };
            }
        }
    }
]);

