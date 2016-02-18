angular.module("labDirectives").directive('tableItem', ['$timeout', '$rootScope', 'GlobalData', 'itemService',
    function ($timeout, $rootScope, global, itemService) {
        return {
            templateUrl: 'templates/table-item.html',
            restrict: 'EA',
            replace: true,
            scope: {
                item: "="
            },
            link: function (scope, element, attrs) {
                console.log(scope.item.name)
                var check = $.grep(initObj.shelfData.containers, function(e){ return e.name == scope.item.name; });

                scope.toolTip = (check.length == 1 || scope.item.name == 'beaker' ? true : false);

                scope.onDragBegin = function (data, event) {
                    var itemData = global.tableItems.getItemInSaveFormat(scope.item, true);

                    API.onDragBegin(itemData);

                    // Save position before dragging
                    itemService.savePosition(scope.item);
                };

                scope.onDblClick = function (data, event) {
                    console.dir(scope.item)
                    console.log('======')

                    var result = $.grep(initObj.shelfData.containers, function(e){ return e.name == data.name; });

                    if(result.length == 1 || scope.item.name == 'beaker')
                        $rootScope.$broadcast('element:dblclick', {data: data, event: event});
                };
                
                scope.onDropComplete = function (data, event) {

                    // Reject dropFinishedDeferred so that the drop to table event handler does not get run
                    if ($rootScope.dropFinishedDeferred) {
                        $rootScope.dropFinishedDeferred.reject();
                    }

                    itemService.updatePosition(data, event).then(function() {
                        var shouldRevert = true;

                        // Check if the dropped item can be dropped to the this item type,
                        // by checking it has this table's name in 'canBindTo'
                        if ((data.hasOwnProperty('canBindTo') && data.canBindTo.indexOf(scope.item.name) > -1) ||
                            (data.hasOwnProperty('canDropTo') && data.canDropTo.indexOf(scope.item.name) > -1)) {
                            // Drops the dropped item to the current item
                            itemService.dropItem(scope, scope.item, data, event).then(function() {
                                itemService.revertItem(data, event);
                            }, function() {
                                if (!data.uuid) {
                                    var el = event.element;
                                    el.css(event.initialPosition);
                                }
                            });
                        } else {
                            itemService.revertItem(data, event);
                        }
                    });
                }
            }
        }
    }
]);