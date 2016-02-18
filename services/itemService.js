/**
 * Defines utility methods of items
 *
 * dropItem()           Drops item to item
 * revertItem()         revert item to the position before dragging
 */
angular.module('labServices').factory('itemService', ['GlobalData', 'modalService', 'containerService', '$timeout', '$q',
    function (global, modal, containerService, $timeout, $q) {
        var liquidPour = function(item, dropItem) {
            var maxPour = item.maxAmount - item.state.filledVolume;
            var showPourAll = false;

            if (maxPour > 0) {
                modal.pourModal(maxPour, "mL", showPourAll).then(function (input) {
                    var pourAmount = parseFloat(input);

                    // if pour an empty container, read default liquid color, else read from BE
                    if (item.state.liquidTotal == 0) {
                        API.changeLiquidColor(item.uuid, dropItem.color, dropItem.transparency);
                    } else {
                        // TODO: wait for BE to return the color for the liquid
                    }

                    API.liquidPour(item.uuid, pourAmount, dropItem.name);
                });
            } else {
                modal.errorModal(item.name + ' is full', item.name + ' is full');
            }
        };

        var solidPour = function(item, dropItem) {
            var maxVolume = item.maxAmount - item.state.filledVolume;
            var maxPour = parseFloat((maxVolume/dropItem.mlxmg).toFixed(2));
            var showPourAll = false;

            if (maxPour > 0) {
                modal.pourModal(maxPour, "mG", showPourAll).then(function (input) {
                    var pourAmount = parseFloat(input);
                    API.solidPour(item.uuid, pourAmount, dropItem.name);
                });
            } else {
                modal.errorModal(item.name + ' is full', item.name + ' is full');
            }
        };

        var methods = {
            /**
             * Drops item to item
             *
             * @param scope         scope of the item which accepts the drop
             * @param item          item which accepts the drop
             * @param dropItem      item to be dropped
             * @param event         drop event
             *
             * @returns {boolean}   TRUE if the dropItem has to be reverted, otherwise FALSE
             */
            dropItem: function (scope, item, dropItem, event) {
                var deferred = $q.defer();

                $timeout(function() {

                    var newItem,
                        shouldRevert = true;

                    // Check the drop conditions for each kind of items
                    switch (item.name) {
                        // case 'thermometer':
                        // case 'pressuregauge':
                        case 'bunsenburner':
                        case 'balance':
                            if ('beaker' in item && item.beaker && (!dropItem.uuid || dropItem.uuid != item.beaker.uuid) // beaker is already attached
                            ) {
                                break;
                            }

                            if ('erlenmeyerflask' in item && item.erlenmeyerflask && (!dropItem.uuid || dropItem.uuid != item.erlenmeyerflask.uuid) // erlenmeyerflask is already attached
                            ) {
                                break;
                            }

                            if ('graduatedcylinder' in item && item.graduatedcylinder && (!dropItem.uuid || dropItem.uuid != item.graduatedcylinder.uuid) // graduatedcylinder is already attached
                            ) {
                                break;
                            }

                            if ('crucible' in item && item.crucible && (!dropItem.uuid || dropItem.uuid != item.crucible.uuid) // crucible is already attached
                            ) {
                                break;
                            }

                            if (dropItem.uuid && ((item.beaker && dropItem.uuid == item.beaker.uuid) || (item.erlenmeyerflask && dropItem.uuid == item.erlenmeyerflask.uuid) ||
                                    (item.graduatedcylinder && dropItem.uuid == item.graduatedcylinder.uuid) || (item.crucible && dropItem.uuid == item.crucible.uuid))) { // if dragging grouped thermometer, remove and add again to reset style
                                scope.$apply(function() {
                                    global.tableItems.remove(dropItem);
                                });
                            }

                            shouldRevert = false;

                            // Add the dropped item to current scope item
                            if(!angular.isDefined(dropItem.uuid)) {
                                newItem = angular.copy(dropItem);
                            } else {
                                newItem = dropItem;
                            }
                            newItem = global.tableItems.add(newItem, item);
                            if(!newItem.label) {
                                newItem.label = newItem.uuid;
                            }
                            item[newItem.name] = newItem;
                            break;

                        case 'beaker':
                        case 'erlenmeyerflask':
                        case 'graduatedcylinder':
                        case 'crucible':
                            switch (dropItem.name) {
                                case 'water':
                                case 'sodium_hydroxide':
                                case '6m_hcl':
                                case 'yellowWater':
                                    shouldRevert = false;
                                    liquidPour(item, dropItem);
                                    break;
                                case 'salt':
                                case 'sugar':
                                case 'rock':
                                    shouldRevert = false;
                                    solidPour(item, dropItem);
                                    break;
                                case 'thermometer':
                                    if (('thermometer' in item && item.thermometer && (!dropItem.uuid || dropItem.uuid != item.thermometer.uuid)) // thermometer is already attached
                                    ) {
                                        break;
                                    }

                                    if (item.thermometer && dropItem.uuid && dropItem.uuid == item.thermometer.uuid) { // if dragging grouped thermometer, remove and add again to reset style
                                        scope.$apply(function() {
                                            global.tableItems.remove(dropItem);
                                        });
                                    }

                                    shouldRevert = false;
                                    newItem = global.tableItems.add(dropItem, item);
                                    if(!newItem.label) {
                                        newItem.label = newItem.uuid;
                                    }
                                    item[newItem.name] = newItem;
                                    break;
                                case 'pressuregauge':
                                    if(item.name == 'erlenmeyerflask') {
                                        if (!item.state.isClosed) {
                                            item.state.isClosed = true;
                                        }
                                        if (('pressuregauge' in item && item.pressuregauge && (!dropItem.uuid || dropItem.uuid != item.pressuregauge.uuid)) // PG is already attached
                                        ) {
                                            break;
                                        }

                                        if (item.pressuregauge && dropItem.uuid && dropItem.uuid == item.pressuregauge.uuid) { // if dragging grouped thermometer, remove and add again to reset style
                                            scope.$apply(function() {
                                                global.tableItems.remove(dropItem);
                                            });
                                        }

                                        shouldRevert = false;
                                        newItem = global.tableItems.add(dropItem, item);
                                        if(!newItem.label) {
                                            newItem.label = newItem.uuid;
                                        }
                                        item[newItem.name] = newItem;
                                    }
                                    break;
                                case 'beaker':
                                case 'erlenmeyerflask':
                                case 'graduatedcylinder':
                                case 'crucible':
                                    if (!dropItem.uuid) {
                                        break;
                                    }

                                    shouldRevert = false;
                                    var dstContainer = item;
                                    var srcContainer = dropItem.parent.items[dropItem.uuid];
                                    var transitionDuration = 300;

                                    containerService.pourFromContainerToContainer(srcContainer, dstContainer, transitionDuration, scope, 'item');
                                    break;
                            }
                            break;
                            
                        case 'testtube':
                            switch (dropItem.name) {
                                case 'water':
                                case 'sodium_hydroxide':
                                case '6m_hcl':
                                case 'yellowWater':
                                    shouldRevert = false;
                                    liquidPour(item, dropItem);
                                    break;
                            }
                            break;

                        case 'evaporatingdish':
                            switch (dropItem.name) {
                                case 'water':
                                case 'sodium_hydroxide':
                                case '6m_hcl':
                                case 'yellowWater':
                                    shouldRevert = false;
                                    liquidPour(item, dropItem);
                                    break;
                            }
                            break;
                    }


                    if(typeof(newItem) != "undefined") {
                        var itemData = {
                            parent: global.tableItems.getItemInSaveFormat(item, true),
                            child: global.tableItems.getItemInSaveFormat(newItem, true)
                        }


                        if(newItem.name == "pressuregauge" || newItem.name == "thermometer") {
                            var createItem = {
                                [newItem.uuid] :{
                                    "x":0, "y":0,
                                    "label": newItem.uuid, 
                                    "scale": ( newItem.name == "pressuregauge" ? "Pa" : "C")
                                }
                            }

                            API.onDropToTableFromShelf(createItem);
                        }

                        API.dropsItemToItem(itemData);
                        console.log(itemData)
                    }

                    if (shouldRevert) {
                        deferred.resolve(true);
                    } else {
                        deferred.reject(false);
                    }
                });
                return deferred.promise;
            },

            /**
             * Update the position of item
             *
             * @param item
             * @param event
             */

            updatePosition: function (item, event) {
                var deferred = $q.defer();
                $timeout(function () {
                    if (item.uuid) {
                        var origItem = item.parent.items[item.uuid];

                        origItem.left = event.tx - $(".lab-table").offset().left;
                        origItem.top = event.ty - $(".lab-table").offset().top;
                    }
                    deferred.resolve(true);
                });
                return deferred.promise;
            },

            /**
             * Save the current position of item
             *
             * @param item
             */
            savePosition: function (item) {
                var deferred = $q.defer();
                $timeout(function () {
                    item.beforeLeft = item.left;
                    item.beforeTop = item.top;
                    deferred.resolve(true);
                });
                return deferred.promise;
            },

            /**
             * Reverts item to the position before dragging
             *
             * @param item      item to revert
             */
            revertItem: function (item, event) {
                var deferred = $q.defer();
                $timeout(function () {
                    if (item.uuid) {
                        var element = $("[data-drop-uuid='" + item.uuid + "']");
                        element.addClass('dragTransition');
                        element[0].offsetHeight;
                        var origItem = item.parent.items[item.uuid];
                        origItem.left = origItem.beforeLeft;
                        origItem.top = origItem.beforeTop;
                        element[0].offsetHeight;
                        setTimeout(function () {
                            element.removeClass('dragTransition');
                        }, 500);
                    } else {
                        var el = event.element;
                        el.addClass('dragTransition');
                        el[0].offsetHeight;
                        el.css(event.returnPosition);
                        el[0].offsetHeight;
                        setTimeout(function () {
                            el.removeClass('dragTransition');
                            el.css(event.initialPosition);
                        }, 500);
                    }
                    deferred.resolve(true);
                }, 50);
                return deferred.promise;
            },

            /**
             * Get total item weight
             *
             * @param item      item to get weight from
             */
            getTotalItemWeight: function (item) {
                var totalWeight = item.weight || 0;
                if (angular.isDefined(item.state) && angular.isDefined(item.state.liquidTotal)) {
                    totalWeight += item.state.liquidTotal * 1000;
                }
                if (angular.isDefined(item.state.solids)) {
                    for (solid in item.state.solids) {
                        totalWeight += item.state.solids[solid].amount;
                    }
                }
                if (angular.isDefined(item.items)) {
                    for (element in item.items) {
                        totalWeight += methods.getTotalItemWeight(item.items[element]);
                    }
                }
                return totalWeight;
            }
        };

        return methods;
    }
]);