angular.module('labServices').factory('panzoomService', ['$rootScope',
    function ($rootScope) {
        var panzoomService = (function () {
            var $element;
            var settings = {
                contain: 'invert',
                minScale: 1,
                maxScale: 2,
                increment: 0.2
            };

            var mouseEvents = 'mousedown touchstart';

            return {
                init: function (zoomElement, overrideSettings) {
                    $element = $(zoomElement);
                    settings = angular.extend(settings, overrideSettings || {});

                    $panzoom = $element.panzoom(settings);

                    $element.on(mouseEvents, 'form, a, .light-switch img, .shelf-menus', function (e) {
                        e.stopImmediatePropagation();
                    });

                    $element.on('panzoomchange', function (e, panzoom, newMatrix) {
                        $rootScope.$broadcast('panzoom:change', {matrix: newMatrix});
                    });

                    $(window).on('resize.panzoom', function (e) {
                        $element.panzoom('resetDimensions');
                    });

                    $panzoom.parent().on('mousewheel.focal', function( e ) {
                        e.preventDefault();
                        var delta = e.delta || e.originalEvent.wheelDelta;
                        var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
                        $panzoom.panzoom('zoom', zoomOut, {
                            increment: 0.02,
                            animate: false
                        });
                    });
                },

                destroy: function () {
                    $element.off(mouseEvents);
                    $element.off('panzoomchange');
                    $(window).off('resize.panzoom');
                },

                getMatrix: function () {
                    return $element.panzoom('getMatrix');
                },

                zoomIn: function () {
                    $element.panzoom('zoom');
                },

                zoomOff: function () {
                    $element.panzoom('reset');
                },

                zoomOut: function () {
                    $element.panzoom('zoom', true);
                },

                disable: function() {
                    $element.panzoom('disable');
                },

                enable: function() {
                    $element.panzoom('enable');
                }
            };
        })();

        return panzoomService;
    }
]);