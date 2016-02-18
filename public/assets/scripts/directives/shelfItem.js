'use strict';
/*
 * lab container directive for lab app.
 */
angular.module("labDirectives").directive("shelfItem", ['$timeout',
    function ($timeout) {
        return {
            templateUrl: "templates/shelf-item.html",
            restrict: "EA",
            replace: true,
            scope: {
                "data": "="
            },
            link: function (scope, element, attrs) {
                var init = function () {
                    var name = scope.data.name;
                    // var toolData = angular.copy(toolsData[name].defaults);
                    var toolData = angular.copy(initObj.toolsData[name].defaults);
                    var toolAssets = angular.copy(initObj.shelfItemsData[name]);

                    if (angular.isDefined(scope.data.type)) {
                        angular.extend(toolData, initObj.toolsData[name].types[scope.data.type]);
                        //Save type if defined in object state so it can be exported
                        toolData.type = scope.data.type;
                    }

                    scope.toolData = toolData;
                    scope.sceneassets = toolAssets;

                    if(toolAssets != undefined) {
                        element
                            .width(toolAssets.width)
                            .height(toolAssets.height);
                    } else {
                        element
                            .width(toolData.width)
                            .height(toolData.height);                        
                    }

                    // Set background image
                    element.css('background-image', 'url(' + scope.toolData.images.thumbnail + ')');

                    // Make shelf-item fade in one after another
                    $timeout(function () {
                        var index = element.parent().children('.shelf-item').index(element),
                            fadeInterval = 200,
                            delay = fadeInterval * index;

                        element.css('animation-delay', delay + 'ms');
                    });
                };

                init();
            }
        }
    }
]);