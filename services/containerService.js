angular.module('labServices').factory('containerService', ['$window', 'modalService',
    function ($window, modal) {
        var revertDroppedContainer = function (container) {
            container.state.isLeaned = false;
            // Revert droppped beaker to original position
            container.left = container.beforeLeft;
            container.top = container.beforeTop;
        };

        var methods = {
            /**
             * pours from container to container
             *
             * @param srcContainer                 Source container
             * @param dstContainer                 Destination container
             * @param transitionDuration        Transition duration
             * @param scope                     Scope of source beaker
             * @param srcContainerDataName         Name of source container data in scope given
             */
            pourFromContainerToContainer: function (srcContainer, dstContainer, transitionDuration, scope, srcContainerDataName) {
                if (srcContainer.state.filledVolume > 0) {
                    
                    $window.requestTimeout(function () {
                        // Add transition
                        srcContainer.state.hasTransition = true;

                        // Lean the source beaker
                        srcContainer.state.isLeaned = true;
                        // Move dropped beaker to the right side of destination beaker

                        // Calculate the position based on parent position if parent exists
                        var dstContainerLeft = angular.isDefined(dstContainer.parent.uuid) ? dstContainer.parent.left + dstContainer.left : dstContainer.left;
                        var dstContainerTop = angular.isDefined(dstContainer.parent.uuid) ? dstContainer.parent.top + dstContainer.top : dstContainer.top;
                        switch (dstContainer.name) {
                            case 'erlenmeyerflask':
                                switch (srcContainer.name) {
                                    case 'beaker':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.5;
                                        break;
                                    case 'graduatedcylinder':
                                        srcContainer.left = dstContainerLeft + dstContainer.width;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.3;
                                        break;
                                    case 'erlenmeyerflask':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.5;
                                        break;
                                    case 'crucible':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.8;
                                        break;
                                }
                                break;
                            case 'beaker':
                                switch (srcContainer.name) {
                                    case 'erlenmeyerflask':
                                        srcContainer.left = dstContainerLeft + dstContainer.width;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.5;
                                        break;
                                    case 'graduatedcylinder':
                                        srcContainer.left = dstContainerLeft + dstContainer.width * 1.2;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.5;
                                        break;
                                    case 'beaker':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.7;
                                        break;                                            
                                    case 'crucible':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.9;
                                        break;                                            
                                }
                                break;
                            case 'graduatedcylinder':
                                switch (srcContainer.name) {
                                    case 'erlenmeyerflask':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.5;
                                        break;
                                    case 'beaker':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.5;
                                        break;
                                    case 'graduatedcylinder':
                                        srcContainer.left = dstContainerLeft + dstContainer.width * 1.2;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.5;
                                        break;                                            
                                    case 'crucible':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.8;
                                        break;                                            
                                }
                                break;
                            case 'crucible':
                                switch (srcContainer.name) {
                                    case 'erlenmeyerflask':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.3;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.9;
                                        break;
                                    case 'beaker':
                                        srcContainer.left = dstContainerLeft + dstContainer.width / 1.5;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.9;
                                        break;
                                    case 'graduatedcylinder':
                                        srcContainer.left = dstContainerLeft + dstContainer.width * 1.2;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 0.7;
                                        break;                                            
                                    case 'crucible':
                                        srcContainer.left = dstContainerLeft + dstContainer.width * 0.8;
                                        srcContainer.top = dstContainerTop - srcContainer.height * 1.05;
                                        break;                                            
                                }
                                break;
                            default:
                                srcContainer.left = dstContainerLeft + dstContainer.width * 0.8;
                                srcContainer.top = dstContainerTop - srcContainer.height * 1.1; // Place source beaker a little above dest beaker
                                break;
                        }
                    }, 10);
                    
                    // Calculate max pourable amount based on 2 beakers' amount
                    var maxPour = Math.min(dstContainer.maxAmount - dstContainer.state.filledVolume,
                        srcContainer.state.filledVolume);

                    var unit = '';
                    var showPourAll = true;

                    if (maxPour > 0) {
                        modal.pourModal(maxPour, unit, showPourAll).then(function (input) {
                            var pourAmount = parseFloat(input);

                            if (pourAmount == 0) {

                                // Revert state
                                revertDroppedContainer(srcContainer);
                                $window.requestTimeout(function () {
                                    // Remove transition
                                    srcContainer.state.hasTransition = false;
                                }, transitionDuration);

                                return;
                            }

                            $window.requestTimeout(function () {
                                // Start pour
                                if (dstContainer.state.liquidTotal == 0 && srcContainer.state.liquidTotal > 0) {
                                    API.changeLiquidColor(dstContainer.uuid, srcContainer.state.liquidColor, srcContainer.state.liquidTrans);
                                }
                                API.PourFromItemtoItem(srcContainer.uuid, dstContainer.uuid, pourAmount, "liquid");

                                var unregister = scope.$watch(srcContainerDataName + '.state.isPouring', function (newValue, oldValue) {
                                    if (newValue == false && oldValue == true) {
                                        // Revert state after pouring is complete
                                        revertDroppedContainer(srcContainer);
                                        unregister();

                                        $window.requestTimeout(function () {
                                            // Remove transition
                                            srcContainer.state.hasTransition = false;
                                        }, transitionDuration);
                                    }
                                });

                            }, transitionDuration);
                        }, function () {

                            // Revert state
                            revertDroppedContainer(srcContainer);
                            $window.requestTimeout(function () {
                                // Remove transition
                                srcContainer.state.hasTransition = false;
                            }, transitionDuration);

                            return;
                        });
                    } else {
                        modal.errorModal('Container is full', 'Container is full').finally(function () {

                            // Revert state
                            revertDroppedContainer(srcContainer);
                            $window.requestTimeout(function () {
                                // Remove transition
                                srcContainer.state.hasTransition = false;
                            }, transitionDuration);
                        });
                    }
                } else {
                    modal.errorModal('No liquid in container', 'There is nothing to pour in this container').finally(function () {
                        // Add transition
                        srcContainer.state.hasTransition = true;

                        // Revert state
                        revertDroppedContainer(srcContainer);
                        $window.requestTimeout(function () {
                            // Remove transition
                            srcContainer.state.hasTransition = false;
                        }, transitionDuration);
                    });
                }
            }
        };

        return methods;
    }
]);