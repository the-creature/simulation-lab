'use strict';

/**
 * Temperature Bath
 */
angular.module('labDirectives').directive('temperaturebath', [function () {
        return {
            restrict: 'AE',
            templateUrl: 'templates/tools/instruments/temperaturebath.html',
            scope: {
                uiData: '='
            },
            link: function (scope, element, attrs) {
                var init = function () {
                    element
                        .width(scope.uiData.width)
                        .height(scope.uiData.height);

                    // Set background image
                    element.find('.temperaturebath').css('background-image', 'url(' + scope.uiData.images.thumbnail + ')');
                };

                init();                
            }
        }
    }
]);

