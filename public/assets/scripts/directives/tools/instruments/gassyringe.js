'use strict';

/**
 * Gas Syringe
 */
angular.module('labDirectives').directive('gassyringe', [function () {
        return {
            restrict: 'AE',
            templateUrl: 'templates/tools/instruments/gassyringe.html',
            scope: {
                uiData: '='
            },
            link: function (scope, element, attrs) {
                var init = function () {
                    element
                        .width(scope.uiData.width)
                        .height(scope.uiData.height);

                    // Set background image
                    element.find('.gassyringe').css('background-image', 'url(' + scope.uiData.images.thumbnail + ')');
                };

                init();                
            }
        }
    }
]);

