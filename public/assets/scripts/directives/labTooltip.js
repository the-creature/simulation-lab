/**
 * labTooltip directive
 */
angular.module('labDirectives').directive('labTooltip', ['$timeout',
    function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $timeout(function () {
                    var title = attrs.labTooltip,
                        type = attrs.labTooltipType || "normal",
                        $tooltip, width, height;

                    element.hover(function (event) { // Hover over code
                        scope.timer = 2000;

                        if ($tooltip) {
                            $tooltip.remove();
                        }
                        $(".tooltip").remove();
                        event.stopPropagation();
                        title = attrs.labTooltip;
                        $tooltip = $('<span class="tooltip"></span>').text(title).appendTo('body');
                        if (type == "delayed") {
                            $tooltip.addClass("tooltip-delayed");
                        }
                        width = $tooltip.innerWidth();
                        height = $tooltip.innerHeight();

                        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
                            $timeout(function() {
                                if ($tooltip) {
                                    $tooltip.remove();
                                }
                            }, scope.timer);                        
                        }                    
                    }, function () { //Hover out code
                        if ($tooltip) {
                            $tooltip.remove();
                        }
                    }).mousemove(function (e) {
                        if (angular.isDefined($tooltip) && $tooltip.length > 0) {
                            var mousex = e.pageX - width * 0.5; //Get X coordinates
                            var mousey = e.pageY - height * 1.7; //Get Y coordinates

                            $tooltip.css({top: mousey, left: mousex});
                        }
                    });
                });
            }
        }
    }
]);
