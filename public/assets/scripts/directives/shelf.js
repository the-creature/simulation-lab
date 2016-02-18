'use strict';
/*
 * lab shelf directive for lab app.
 */
angular.module('labDirectives').directive('labShelf', ['$rootScope',
    function ($rootScope) {
        return {
            templateUrl: 'templates/shelf.html',
            restrict: 'EA',
            replace: true,
            scope: {},
            link: function (scope, element, attrs) {
                scope.shelfData = initObj.shelfData;

                // Set background image
                element.find('.shelf-menus').css({
                    'background-image': 'url(' + initObj.assetsData.shelf[initObj.labData.sceneassets.shelf].assets.source + ')',
                    'height': initObj.assetsData.shelf[initObj.labData.sceneassets.shelf].assets.height + 'px'
                });

                $('.lab-shelf').css({
                    'width': initObj.assetsData.shelf[initObj.labData.sceneassets.shelf].assets.width + 'px'
                });

                $('.shelf-content').css({
                    'bottom': (initObj.assetsData.shelf[initObj.labData.sceneassets.shelf].assets.height - 18) + 'px'
                })

                //handle tabs clicked event.
                element.find('.shelf-menus a').on('touchstart click', function (e) {
                    e.preventDefault();
                    var tabPanelId = angular.element(this).attr('href');
                    element.find('.shelf-menus li.active').removeClass('active');
                    angular.element(this).parent().addClass('active')
                    element.find('.tab-pane').hide();
                    $(tabPanelId).show();
                });


                // drag event process

                var el = element.find('.shelf-menus')[0];
                var dragObj = null;
                var initialShelfHeight = element.height();
                var initialPageY = 0;
                var minShelfHeightConstrain = 140;
                var maxShelfHeightConstrain = 380;

                var onPress = function(e) {
                    $rootScope.$broadcast('panzoom:disable');
                    dragObj = el;
                    initialShelfHeight = element.height();
                    initialPageY = e.pageY;
                    return false;
                };

                var onMove = function(e) {
                    if (dragObj) {
                        // consider zoom
                        var matrix = $(".workspace").panzoom("getMatrix");
                        var moveDistanceY = (e.pageY - initialPageY) * (1 / Number(matrix[3]));
                        var newShelfHeight = initialShelfHeight + moveDistanceY;
                        var pageYConstrain = 90 * (1 / Number(matrix[3]));
                        if (newShelfHeight >= minShelfHeightConstrain && newShelfHeight <= maxShelfHeightConstrain && e.pageY > pageYConstrain) {
                            element.css('height', newShelfHeight + 'px');
                        }
                        return false;
                    }
                };

                var onRelease = function(e) {
                    $rootScope.$broadcast('panzoom:enable');
                    dragObj = null;
                    return false;
                };

                // mobile
                el.addEventListener('touchstart', onPress, true);
                el.addEventListener('touchmove', onMove, true);
                el.addEventListener('touchend', onRelease, true);

                // chrome
                el.addEventListener('mousedown', onPress, true);
                el.addEventListener('mousemove', onMove, true);
                el.addEventListener('mouseup', onRelease, true);

                // firefox
                el.addEventListener('dragstart', onPress, false);
                el.addEventListener('dragover', onMove, false);
                el.addEventListener('dragend', onRelease, false);
            }
        }
    }
]);