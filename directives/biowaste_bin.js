angular.module("labDirectives").directive('ngBiowasteBin', ['$window', '$timeout', 'GlobalData', 'trashService', 'explodeService',
    function ($window, $timeout, global, TrashService, ExplodeService) {
        return {
            restrict: 'AE',
            templateUrl: 'templates/biowaste_bin.html',
            scope: {},
            link: function ($scope, element, attrs) {

                var trash, canvas, sound, explode;

                var init = function () {
                    canvas = element.find('#canvas')[0];
                    sound = element.find('#audioTrash')[0];
                    trash = TrashService.factory({
                        canvas: canvas,
                        sound: sound,
                        totalFrames: 16,
                        ticksPerFrame: 2,
                        trashImgUrl: "assets/images/sprites/biowaste_bin_sprites.png"
                    });
                    
                    explode = ExplodeService.factory({
                        canvas: element.find('.exploding-canvas-trash')[0],
                        xFrames: 8,
                        yFrames: 6,
                        fWidth: 256,
                        fHeight: 256,
                        ticksPerFrame: 2,
                        explodeImgUrl: "assets/images/effects/exploding/explode.png",
                        explodeSound: element.find('.explode-sound')[0]
                    });
                };

                init();

                $scope.onDropComplete = function (data, event) {
                    if (data.uuid) {
                        var transitionDuration = 300,
                            $item = $("#" + data.uuid),
                            $bin= element.find("#canvas");

                        //Run wastebin animation
                        trash.play();

                        // Enable transition
                        $item.addClass("hasTransition");

                        // Move item to the above of the trash
                        var matrix = $(".workspace").panzoom("getMatrix");
                        var ceroX = -($(".workspace").width()*(1-matrix[0])/2);
                        var ceroY = -($(".workspace").height()*(1-matrix[3])/2);

                        $item.css({
                            left: ($bin.offset().left + ($bin.width() / 2) - ($item.width() / 2)) * (1/Number(matrix[0])) + (ceroX - matrix[4])*(1/Number(matrix[0])),
                            top: ($bin.offset().top - $item.height()) * (1/Number(matrix[3])) + (ceroY - matrix[5])*(1/Number(matrix[3]))
                        });

                        $window.requestTimeout(function() {
                            
                            //Explode if bunsen is on
                            if(data.name == "bunsenburner" && data.state.flame!="off") {
                                var itemData = angular.element("[data-uuid='" + data.uuid + "']").isolateScope();
                                itemData.setFlame("off");
                                var transitionDuration = 1800;
                                element.find('.exploding-canvas-trash').css('display', 'inherit');
                                explode.play();
                                $window.requestTimeout(function() {
                                    element.find('.exploding-canvas-trash').css('display', 'none');
                                }, transitionDuration);
                            }
                            
                            // Shrink and fade out item moving down to the trash
                            $item.css({
                                opacity: 0,
                                transform: 'scale(0)',
                                top: ($bin.offset().top + $item.height()) * (1/Number(matrix[3])) + (ceroY - matrix[5])*(1/Number(matrix[3]))
                            });

                            $window.requestTimeout(function() {
                                // Disable transition
                                $item.removeClass("hasTransition");

                                // Remote item from table items
                                global.tableItems.remove(data);
                            }, transitionDuration);
                        }, transitionDuration);

                        var itemData = global.tableItems.getItemInSaveFormat(data, true);
                        
                        API.onDropToTrashComplete(itemData);
                    }
                }
            }
        }
    }
]);