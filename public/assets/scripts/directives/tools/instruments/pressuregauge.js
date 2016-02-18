'use strict';

/**
 * Pressure Gauge
 */
angular.module('labDirectives').directive('pressuregauge', [
	function () {
        return {
            restrict: 'AE',
            templateUrl: 'templates/tools/instruments/pressuregauge.html',
            scope: {
                uiData: '='
            },
            link: function (scope, element, attrs) {
                ///////////////////////////////
                // PRIVATE ATTRIBUTES
                ///////////////////////////////
                var nextScales = {
                    'Pa': 'Torr',
                    'Torr': 'mmHg',
                    'mmHg': 'inHg',
                    'inHg': 'psi',
                    'psi': 'bar',
                    'bar': 'atm',
                    'atm': 'Pa'
                };

                var init = function () {
				    scope.addCssRule = function (rule, css) {
					var css = JSON.stringify(css).replace(/"/g, "").replace(/,/g, ";");
					  
					  $("<style>").prop("type", "text/css").html(rule + css).appendTo("head");
					}
					// Add the styling for the pressure gauge readout display
 					scope.addCssRule(".pressuregauge .pressure", {
						'font-size': initObj.toolsData['pressuregauge'].defaults.displaysize + 'px',
						'right': initObj.toolsData['pressuregauge'].defaults.displayright + '%',
						'top': initObj.toolsData['pressuregauge'].defaults.displaytop + '%',
						'width': initObj.toolsData['pressuregauge'].defaults.displaywidth + '%'
					});
					// Add the styling for the pressure gauge button
					scope.addCssRule(".pressuregauge .button-scale-change", {
						'font-size': initObj.toolsData['pressuregauge'].defaults.buttonsize + 'px',
						'width': initObj.toolsData['pressuregauge'].defaults.buttonwidth + '%',
						'height': initObj.toolsData['pressuregauge'].defaults.buttonheight + '%',
						'left': initObj.toolsData['pressuregauge'].defaults.buttonleft + '%',
						'top': initObj.toolsData['pressuregauge'].defaults.buttontop + '%'
					});
					
					
                    // Initialize state
                    scope.uiData.state = scope.uiData.state || {};
                    scope.uiData.state.scale = scope.uiData.state.scale || 'Pa';

                    element
                        .width(scope.uiData.width)
                        .height(scope.uiData.height);

                    // Set background image
                    // element.find('.pressuregauge').css('background-image', 'url(' + scope.uiData.images.thumbnail + ')');
                    element.find('.pressuregauge').css('background-image', 'url(' + scope.uiData.images.table + ')');

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
                 * Click handler for change pressure scale
                 */
                scope.changeScale = function ($event) {
                    $event.stopPropagation();
                    var currentScale = scope.uiData.state.scale || 'Pa';
                    scope.uiData.state.scale = nextScales[currentScale];
                    API.pressuregauge_userChangeScale(scope.uiData.uuid, scope.uiData.state.scale);
                };
                
                /**
                 * API calls
                 */
                scope.setScale = function (scale) {
                    if(!(scale in nextScales)) {
                        console.log("Pressure Gauge scale value not supported: " + scale);
                    } else {
                        scope.uiData.state.scale = scale;
                    }
                };
            }
        }
    }
]);

