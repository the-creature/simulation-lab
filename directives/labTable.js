/**
 * labTable directive
 *
 * Defines the lab table
 * It can hold table items placed on it, table items should be draggable.
 * It also holds drag timer
 */
angular.module('labDirectives').directive('labTable', ['$rootScope', 'GlobalData', 'SocketService', 'uuid', 'modalService',
    function ($rootScope, global, SocketService, uuid, modal) {
        return {
            templateUrl: 'templates/lab-table.html',
            restrict: 'EA',
            replace: true,
            scope: {
                tableItems: '='
            },
            link: function (scope, element, attrs) {    
                /* 
                 * Restore table items state variable from onStage
                 */
                global.tableItems.setState(initObj.onStage);

                var attachItem = function(item, event) {
                    var newItem;
                    var isNew = false;

                    if (item.uuid) {
                        newItem = angular.extend({}, item);
                    } else {
                        newItem = angular.copy(item);
                        newItem.uuid = uuid.newWithName(newItem.name);
                        newItem.label = newItem.uuid;
                        isNew = true;
                    }
                    
                    // Update position
                    newItem.left = event.tx;
                    newItem.top = event.ty - element[0].offsetTop;
                    
                    global.tableItems.add(newItem);
                    
                    //If it is a new item, notify onDropToTableFromShelf
                    if(isNew) {
                        var itemData = global.tableItems.getItemInSaveFormat(global.tableItems.items[newItem.uuid], true);

                        API.onDropToTableFromShelf(itemData);
                    }
                    
                    if (global.tableItems.items[newItem.uuid]) {
                        var itemData = global.tableItems.getItemInSaveFormat(global.tableItems.items[newItem.uuid], true);

                        API.onDropComplete(itemData);
                    }
                };

                var createItem = function(data, event) {
                    /* 
                     * Check if the dropped item can be dropped to the table,
                     * by checking it has 'table' in 'canBindTo'
                     */
                    if (data.hasOwnProperty('canBindTo') && data.canBindTo.indexOf('table') > -1) {

                        if ($rootScope.dropFinishedPromise) {
                            $rootScope.dropFinishedPromise.then(function() {
                                attachItem(data, event);
                            });
                        } else {
                            attachItem(data, event);
                        }
                    }
                };
                
                var modalShow = function (evt, obj) {
                    var data = obj.data;
                    var isClosed = false.toString();
                    var labelDesc = 'Label';
                    if (data.name == "erlenmeyerflask" || data.name == "crucible") {
                        isClosed = data.state.isClosed.toString();
                    }

                    if (initObj.shelfData.containers.some(function(item) {  
                        return item.name === data.name;
                    })) {
                        labelDesc = 'Label Container';
                    } else if (initObj.shelfData.instruments.some(function(item) {
                        return item.name === data.name;
                    })) {
                        labelDesc = 'Label Instrument';
                    }

                    modal.itemPropertiesModal(labelDesc, data.label, data.name, isClosed, false, obj.data.uuid).then(function (output) {
                        var itemData = angular.element("[data-uuid='" + data.uuid + "']").isolateScope().uiData;
                        
                        if(itemData.label !== output.label) {
                            API.changeLabel(itemData.uuid, output.label);
                        }

                        itemData.label = output.label;
                        
                        if (data.name == "erlenmeyerflask" || data.name == "crucible")
                            itemData.state.isClosed = (output.state === 'true');
                                                
                        if (data.name == "crucible") {
                            if (output.content)
                                angular.element("[data-uuid='" + data.uuid + "']").isolateScope().showContent();
                        }
                    });
                };
                var mShowFunction = $rootScope.$on('element:dblclick', function (evt, data) {
                    modalShow(null, {data: data.data});
                });
                
                scope.onDropComplete = function (data, event) {
                    
                    if (!event.dragToItem) {
                        createItem(data, event);
                        var el = event.element;
                        if (data.hasOwnProperty('canBindTo') && data.canBindTo.indexOf('table') > -1) {
                            if (el.hasClass('shelf-item')) {
                                el.css(event.initialPosition);
                            }
                        } else {
                            el.addClass('dragTransition');
                            el[0].offsetHeight;
                            el.css(event.returnPosition);
                            el[0].offsetHeight;
                            setTimeout(function () {
                                el.removeClass('dragTransition');
                                el.css(event.initialPosition);
                            }, 500);
                        }
                    }
                };

                /**
                 * API
                 */
                var getItemData = function(name, type) {
                    if (initObj.toolsData[name]) {
                        var toolData = initObj.toolsData[name].defaults;

                        if (angular.isDefined(type)) {
                            angular.extend(toolData, toolsData[name].types[type]);
                            toolData.type = type;
                        }
                        return toolData;
                    } else {
                        return null;
                    }
                };

                var removeItem = function(id) {
                    var itemData = angular.element("[data-uuid='" + id + "']").isolateScope().uiData;
                    global.tableItems.remove(itemData);
                };

                var rootListeners = {
                    'lightSwitchStatusEvent': $rootScope.$on('API.lightSwitchStatus', function (event, data) {
                        angular.element("light-switch").isolateScope().setSwitchStatus(data.status);
                    }),

                    'beaker50CreateEvent': $rootScope.$on('API.beaker50_create', function (event, data) {
                        var itemData = getItemData('beaker', 'beaker_50mL');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'beaker50DeleteEvent': $rootScope.$on('API.beaker50_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'beaker50BoilEvent': $rootScope.$on('API.beaker50_boil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = true;
                    }),

                    'beaker50StopBoilEvent': $rootScope.$on('API.beaker50_stopBoil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = false;
                    }),

                    'beaker50PourLiquid': $rootScope.$on('API.beaker50_pourLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().pourLiquid(data.volume);
                    }),

                    'beaker50ReduceLiquid': $rootScope.$on('API.beaker50_reduceLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().reduceLiquid(data.volume);
                    }),

                    'beaker50GroupEvent': $rootScope.$on('API.beaker50_group', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.child + "']").isolateScope().uiData;
                        var beaker = angular.element("[data-uuid='" + data.id + "']");
                        if (typeof(beaker.scope().$parent.onDropComplete) == "function") { // not group
                            beaker.scope().$parent.onDropComplete(itemData, {
                                tx: beaker.offset().left,
                                ty: beaker.offset().top
                            });
                        } else { // in group
                            beaker.scope().onDropToBeakerComplete(itemData, {
                                tx: beaker.offset().left,
                                ty: beaker.offset().top
                            });
                        }
                    }),

                    'beaker50UnGroupEvent': $rootScope.$on('API.beaker50_unGroup', function (event, data) {
                        var beaker = angular.element("[data-uuid='" + data.id + "']");
                        var itemData = angular.element("[data-uuid='" + data.id + "'] thermometer").isolateScope().uiData;
                        var tx = beaker.offset().left;
                        var ty = beaker.offset().top;
                        if (tx - itemData.width - 100 > 0) {
                            tx = tx - itemData.width - 100;
                        } else {
                            tx = tx + beaker.width() + 100;
                        }
                        attachItem(itemData, {tx: tx, ty: ty});
                    }),

                    'beaker50ExplodeEvent': $rootScope.$on('API.beaker50_explode', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().$emit("API:explode");
                    }),

                    'beaker50TemperatureEvent': $rootScope.$on('API.beaker50_temperature', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.temperature = data.temperature;
                    }),

                    'beaker250CreateEvent': $rootScope.$on('API.beaker250_create', function (event, data) {
                        var itemData = getItemData('beaker', 'beaker_250mL');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'beaker250DeleteEvent': $rootScope.$on('API.beaker250_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'beaker250BoilEvent': $rootScope.$on('API.beaker250_boil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = true;
                    }),

                    'beaker250StopBoilEvent': $rootScope.$on('API.beaker250_stopBoil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = false;
                    }),

                    'beaker250PourLiquid': $rootScope.$on('API.beaker250_pourLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().pourLiquid(data.volume);
                    }),

                    'beaker250ReduceLiquid': $rootScope.$on('API.beaker250_reduceLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().reduceLiquid(data.volume);
                    }),

                    'beaker250GroupEvent': $rootScope.$on('API.beaker250_group', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.child + "']").isolateScope().uiData;
                        var beaker = angular.element("[data-uuid='" + data.id + "']");
                        if (typeof(beaker.scope().$parent.onDropComplete) == "function") { // not group
                            beaker.scope().$parent.onDropComplete(itemData, {
                                tx: beaker.offset().left,
                                ty: beaker.offset().top
                            });
                        } else { // in group
                            beaker.scope().onDropToBeakerComplete(itemData, {
                                tx: beaker.offset().left,
                                ty: beaker.offset().top
                            });
                        }
                    }),

                    'beaker250UnGroupEvent': $rootScope.$on('API.beaker250_unGroup', function (event, data) {
                        var beaker = angular.element("[data-uuid='" + data.id + "']");
                        var itemData = angular.element("[data-uuid='" + data.id + "'] thermometer").isolateScope().uiData;
                        var tx = beaker.offset().left;
                        var ty = beaker.offset().top;
                        if (tx - itemData.width - 100 > 0) {
                            tx = tx - itemData.width - 100;
                        } else {
                            tx = tx + beaker.width() + 100;
                        }
                        attachItem(itemData, {tx: tx, ty: ty});
                    }),

                    'beaker250ExplodeEvent': $rootScope.$on('API.beaker250_explode', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().$emit("API:explode");
                    }),
                    
                    'beaker250TemperatureEvent': $rootScope.$on('API.beaker250_temperature', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.temperature = data.temperature;
                    }),

                    'erlenmeyerflaskCreateEvent': $rootScope.$on('API.erlenmeyerflask_create', function (event, data) {
                        var itemData = getItemData('erlenmeyerflask');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'erlenmeyerflaskDeleteEvent': $rootScope.$on('API.erlenmeyerflask_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'erlenmeyerflaskBoilEvent': $rootScope.$on('API.erlenmeyerflask_boil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = true;
                    }),

                    'erlenmeyerflaskStopBoilEvent': $rootScope.$on('API.erlenmeyerflask_stopBoil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = false;
                    }),

                    'erlenmeyerflaskPourLiquid': $rootScope.$on('API.erlenmeyerflask_pourLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().pourLiquid(data.volume);
                    }),

                    'erlenmeyerflaskReduceLiquid': $rootScope.$on('API.erlenmeyerflask_reduceLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().reduceLiquid(data.volume);
                    }),

                    'erlenmeyerflaskOpen': $rootScope.$on('API.erlenmeyerflask_open', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.isClosed = false;
                    }),

                    'erlenmeyerflaskClose': $rootScope.$on('API.erlenmeyerflask_close', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.isClosed = true
                    }),

                    'erlenmeyerflaskGroupEvent': $rootScope.$on('API.erlenmeyerflask_group', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.child + "']").isolateScope().uiData;
                        var erlenmeyerflask = angular.element("[data-uuid='" + data.id + "']");
                        if (typeof(erlenmeyerflask.scope().$parent.onDropComplete) == "function") { // not group
                            erlenmeyerflask.scope().$parent.onDropComplete(itemData, {
                                tx: erlenmeyerflask.offset().left,
                                ty: erlenmeyerflask.offset().top
                            });
                        } else { // in group
                            erlenmeyerflask.scope().onDropToErlenmeyerflaskComplete(itemData, {
                                tx: erlenmeyerflask.offset().left,
                                ty: erlenmeyerflask.offset().top
                            });
                        }
                    }),

                    'erlenmeyerflaskUnGroupEvent': $rootScope.$on('API.erlenmeyerflask_unGroup', function (event, data) {
                        var erlenmeyerflask = angular.element("[data-uuid='" + data.id + "']");
                        var itemData1 = angular.element("[data-uuid='" + data.id + "'] thermometer").isolateScope().uiData || false;
                        var itemData2 = angular.element("[data-uuid='" + data.id + "'] pressuregauge").isolateScope().uiData || false;
                        if (itemData1) {
                            var tx = erlenmeyerflask.offset().left;
                            var ty = erlenmeyerflask.offset().top;
                            if (tx - itemData1.width - 100 > 0) {
                                tx = tx - itemData1.width - 100;
                            } else {
                                tx = tx + erlenmeyerflask.width() + 100;
                            }
                            attachItem(itemData1, {tx: tx, ty: ty});
                        }
                        if (itemData2) {
                            var tx = erlenmeyerflask.offset().left;
                            var ty = erlenmeyerflask.offset().top;
                            if (tx - itemData2.width - 100 > 0) {
                                tx = tx - itemData2.width - 100;
                            } else {
                                tx = tx + erlenmeyerflask.width() + 100;
                            }
                            attachItem(itemData2, {tx: tx, ty: ty});                            
                        }
                    }),

                    'erlenmeyerflaskExplodeEvent': $rootScope.$on('API.erlenmeyerflask_explode', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().$emit("API:explode");
                    }),

                    'erlenmeyerflaskShatterEvent': $rootScope.$on('API.erlenmeyerflask_shatter', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().$emit("API:shatter");
                    }),
                    
                    'erlenmeyerflaskTemperatureEvent': $rootScope.$on('API.erlenmeyerflask_temperature', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.temperature = data.temperature;
                    }),

                    'erlenmeyerflaskPressureEvent': $rootScope.$on('API.erlenmeyerflask_pressure', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        if (itemData.state.isClosed) {
                            itemData.state.pressure = data.pressure;
                        }
                    }),

                    'graduatedcylinderCreateEvent': $rootScope.$on('API.graduatedcylinder_create', function (event, data) {
                        var itemData = getItemData('graduatedcylinder');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'graduatedcylinderDeleteEvent': $rootScope.$on('API.graduatedcylinder_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'graduatedcylinderBoilEvent': $rootScope.$on('API.graduatedcylinder_boil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = true;
                    }),

                    'graduatedcylinderStopBoilEvent': $rootScope.$on('API.graduatedcylinder_stopBoil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = false;
                    }),

                    'graduatedcylinderPourLiquid': $rootScope.$on('API.graduatedcylinder_pourLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().pourLiquid(data.volume);
                    }),

                    'graduatedcylinderReduceLiquid': $rootScope.$on('API.graduatedcylinder_reduceLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().reduceLiquid(data.volume);
                    }),

                    'graduatedcylinderGroupEvent': $rootScope.$on('API.graduatedcylinder_group', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.child + "']").isolateScope().uiData;
                        var graduatedcylinder = angular.element("[data-uuid='" + data.id + "']");
                        if (typeof(graduatedcylinder.scope().$parent.onDropComplete) == "function") { // not group
                            graduatedcylinder.scope().$parent.onDropComplete(itemData, {
                                tx: graduatedcylinder.offset().left,
                                ty: graduatedcylinder.offset().top
                            });
                        } else { // in group
                            graduatedcylinder.scope().onDropToErlenmeyerflaskComplete(itemData, {
                                tx: graduatedcylinder.offset().left,
                                ty: graduatedcylinder.offset().top
                            });
                        }
                    }),

                    'graduatedcylinderUnGroupEvent': $rootScope.$on('API.graduatedcylinder_unGroup', function (event, data) {
                        var graduatedcylinder = angular.element("[data-uuid='" + data.id + "']");
                        var itemData1 = angular.element("[data-uuid='" + data.id + "'] thermometer").isolateScope().uiData || false;
                        var tx = graduatedcylinder.offset().left;
                        var ty = graduatedcylinder.offset().top;
                        if (tx - itemData1.width - 100 > 0) {
                            tx = tx - itemData1.width - 100;
                        } else {
                            tx = tx + graduatedcylinder.width() + 100;
                        }
                        attachItem(itemData1, {tx: tx, ty: ty});
                    }),

                    'graduatedcylinderExplodeEvent': $rootScope.$on('API.graduatedcylinder_explode', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().$emit("API:explode");
                    }),
                    
                    'graduatedcylinderTemperatureEvent': $rootScope.$on('API.graduatedcylinder_temperature', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.temperature = data.temperature;
                    }),

                    'crucibleCreateEvent': $rootScope.$on('API.crucible_create', function (event, data) {
                        var itemData = getItemData('crucible');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'crucibleDeleteEvent': $rootScope.$on('API.crucible_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'crucibleBoilEvent': $rootScope.$on('API.crucible_boil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = true;
                    }),

                    'crucibleStopBoilEvent': $rootScope.$on('API.crucible_stopBoil', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.boiling = false;
                    }),

                    'cruciblePourLiquid': $rootScope.$on('API.crucible_pourLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().pourLiquid(data.volume);
                    }),

                    'crucibleReduceLiquid': $rootScope.$on('API.crucible_reduceLiquid', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().reduceLiquid(data.volume);
                    }),

                    'crucibleOpen': $rootScope.$on('API.crucible_open', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.isClosed = false;
                    }),

                    'crucibleClose': $rootScope.$on('API.crucible_close', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.isClosed = true
                    }),

                    'crucibleGroupEvent': $rootScope.$on('API.crucible_group', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.child + "']").isolateScope().uiData;
                        var crucible = angular.element("[data-uuid='" + data.id + "']");
                        if (typeof(crucible.scope().$parent.onDropComplete) == "function") { // not group
                            crucible.scope().$parent.onDropComplete(itemData, {
                                tx: crucible.offset().left,
                                ty: crucible.offset().top
                            });
                        } else { // in group
                            crucible.scope().onDropToCrucibleComplete(itemData, {
                                tx: crucible.offset().left,
                                ty: crucible.offset().top
                            });
                        }
                    }),

                    'crucibleUnGroupEvent': $rootScope.$on('API.crucible_unGroup', function (event, data) {
                        var crucible = angular.element("[data-uuid='" + data.id + "']");
                        var itemData1 = angular.element("[data-uuid='" + data.id + "'] thermometer").isolateScope().uiData || false;
                        if (itemData1) {
                            var tx = crucible.offset().left;
                            var ty = crucible.offset().top;
                            if (tx - itemData1.width - 100 > 0) {
                                tx = tx - itemData1.width - 100;
                            } else {
                                tx = tx + crucible.width() + 100;
                            }
                            attachItem(itemData1, {tx: tx, ty: ty});
                        }
                    }),

                    'crucibleExplodeEvent': $rootScope.$on('API.crucible_explode', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().$emit("API:explode");
                    }),
                    
                    'crucibleTemperatureEvent': $rootScope.$on('API.crucible_temperature', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.id + "']").isolateScope().uiData;
                        itemData.state.temperature = data.temperature;
                    }),

                    'changeLiquidColorEvent': $rootScope.$on('API.changeLiquidColor', function(event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().changeLiquidColor(data.color, data.transparency);
                    }),

                    'changeSolidColorEvent': $rootScope.$on('API.changeSolidColor', function(event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().changeSolidColor(data.color, data.transparency, data.material);
                    }),

                    'liquidPourEvent': $rootScope.$on('API.liquidPour', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().pourLiquid(data.volume);
                    }),

                    'solidPourEvent': $rootScope.$on('API.solidPour', function (event, data) {
                        //Convert the mg amount to a volume
                        var material = getItemData(data.material);
                        var volume;
                        if (material !== null && angular.isDefined(material.mlxmg)) {
                            volume = data.amount * material.mlxmg;
                            angular.element("[data-uuid='" + data.id + "']").isolateScope().pourSolid(material, data.amount, volume);
                        } else {
                            console.log ("Unknow material");
                        }
                    }),

                    'reduceSolidEvent': $rootScope.$on('API.reduceSolid', function (event, data) {
                        //Convert the mg amount to a volume
                        var material = getItemData(data.material);
                        var volume;
                        if (material !== null && angular.isDefined(material.mlxmg)) {
                            volume = data.amount * material.mlxmg;
                            angular.element("[data-uuid='" + data.id + "']").isolateScope().reduceSolid(material, data.amount, volume);
                        } else {
                            console.log ("Unknow material");
                        }
                    }),

                    'PourFromItemtoItemEvent': $rootScope.$on('API.PourFromItemtoItem', function (event, data) {
                        //Select elements
                        var itemScope = angular.element("[data-uuid='" + data.src + "']").isolateScope();
                        var itemDataSrc = itemScope.uiData;
                        var itemScopeDst = angular.element("[data-uuid='" + data.dst + "']").isolateScope();
                        var itemDataDst = itemScopeDst.uiData;

                        //Calculate the max amount to pour in volume
                        var newVolume = itemDataSrc.state.filledVolume - data.volume;
                        var toPour = data.volume;
                        if (newVolume < 0) {
                            toPour = itemDataSrc.state.filledVolume;
                        }
                        if (toPour > (itemDataDst.maxAmount - itemDataDst.state.filledVolume)) {
                            toPour = (itemDataDst.maxAmount - itemDataDst.state.filledVolume);
                        }
                        //Calculate what to pour
                        solubleSolids = {};
                        nonsolubleSolids = {};
                        var stotal = 0;
                        var ntotal = 0;
                        var nltotal = 0;
                        var liquidToPour = 0;
                        if (angular.isDefined(itemDataSrc.state.solids)) {
                            for (solid in itemDataSrc.state.solids) {
                                var material = getItemData(solid);
                                if (material.soluble == 1) {
                                    solubleSolids[solid] = {"amount":itemDataSrc.state.solids[solid].amount};
                                    solubleSolids[solid].volume = parseFloat((solubleSolids[solid].amount * material.mlxmg).toFixed(2));
                                    stotal += solubleSolids[solid].volume;
                                } else {
                                    nonsolubleSolids[solid] = {"amount":itemDataSrc.state.solids[solid].amount};
                                    nonsolubleSolids[solid].volume = parseFloat((nonsolubleSolids[solid].amount * material.mlxmg).toFixed(2));
                                    ntotal += nonsolubleSolids[solid].volume;
                                }
                            }
                        }

                        //First we pour liquid plus soluble solids, then we pour non soluble solids
                        //Exept if there is no liquid on the container. In that case we pour proportionally each solid
                        //NOTE: Solid amounts transfered from item to item are based on volume (bot for soluble and not soluble ones)
                        if (itemDataSrc.state.liquidTotal > 0) {
                            if (toPour < stotal + itemDataSrc.state.liquidTotal) {
                                //We only pour liquid and soluble solids
                                if (itemDataSrc.state.liquidTotal != 0) {
                                    liquidToPour = parseFloat((itemDataSrc.state.liquidTotal * toPour / (stotal + itemDataSrc.state.liquidTotal)).toFixed(2));
                                }
                                if (stotal != 0) {
                                    for (solid in solubleSolids) {
                                        var material = getItemData(solid);
                                        solubleSolids[solid].volume = parseFloat((solubleSolids[solid].volume * toPour / (stotal + itemDataSrc.state.liquidTotal)).toFixed(2));
                                        solubleSolids[solid].amount = parseFloat((solubleSolids[solid].volume / material.mlxmg).toFixed(2));
                                    }
                                }
                                nonsolubleSolids = {};
                            } else {
                                liquidToPour = itemDataSrc.state.liquidTotal;
                                toPour -= stotal + itemDataSrc.state.liquidTotal;
                                if (ntotal != 0) {
                                    for (solid in nonsolubleSolids) {
                                        var material = getItemData(solid);
                                        nonsolubleSolids[solid].volume = parseFloat((nonsolubleSolids[solid].volume * toPour / ntotal).toFixed(2));
                                        nonsolubleSolids[solid].amount = parseFloat((nonsolubleSolids[solid].volume / material.mlxmg).toFixed(2));
                                    }                            
                                }
                            }
                        } else {
                            nltotal = stotal + ntotal;
                            if(nltotal != 0) {
                                for (solid in nonsolubleSolids) {
                                    var material = getItemData(solid);
                                    nonsolubleSolids[solid].volume = parseFloat((nonsolubleSolids[solid].volume * toPour / nltotal).toFixed(2));
                                    nonsolubleSolids[solid].amount = parseFloat((nonsolubleSolids[solid].volume / material.mlxmg).toFixed(2));
                                }                                                            
                                for (solid in solubleSolids) {
                                    var material = getItemData(solid);
                                    solubleSolids[solid].volume = parseFloat((solubleSolids[solid].volume * toPour / nltotal).toFixed(2));
                                    solubleSolids[solid].amount = parseFloat((solubleSolids[solid].volume / material.mlxmg).toFixed(2));
                                }                                                            
                            }
                        }
                        
                        //Do the pouring
                        //Liquid
                        itemScope.reduceLiquid(liquidToPour);
                        itemScopeDst.pourLiquid(liquidToPour);
                        //Solids
                        for (solid in solubleSolids) {
                            if (solubleSolids[solid].volume > 0) {
                                var material = getItemData(solid);
                                itemScope.reduceSolid(material, solubleSolids[solid].amount, solubleSolids[solid].volume);
                                itemScopeDst.pourSolid(material, solubleSolids[solid].amount, solubleSolids[solid].volume);
                            }
                        }                                                                                    
                        for (solid in nonsolubleSolids) {
                            if (nonsolubleSolids[solid].volume > 0) {
                                var material = getItemData(solid);
                                itemScope.reduceSolid(material, nonsolubleSolids[solid].amount, nonsolubleSolids[solid].volume);
                                itemScopeDst.pourSolid(material, nonsolubleSolids[solid].amount, nonsolubleSolids[solid].volume);
                            }
                        }   
                    }),

                    'bunsenburnerCreateEvent': $rootScope.$on('API.bunsenburner_create', function (event, data) {
                        var itemData = getItemData('bunsenburner');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'bunsenburnerDeleteEvent': $rootScope.$on('API.bunsenburner_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'bunsenburnerAdjustFlameEvent': $rootScope.$on('API.bunsenburner_adjustFlame', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().setFlame(data.state);
                    }),

                    'bunsenburnerGroupEvent': $rootScope.$on('API.bunsenburner_group', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.beaker + "']").isolateScope().uiData;
                        var bunsenburner = angular.element('#' + data.id);
                        bunsenburner.isolateScope().onDropComplete(itemData, {
                            tx: bunsenburner.offset().left,
                            ty: bunsenburner.offset().top
                        });
                    }),

                    'bunsenburnerUnGroupEvent': $rootScope.$on('API.bunsenburner_unGroup', function (event, data) {
                        var bunsenburner = angular.element('#' + data.id);
                        var bunsenburnerTripod = angular.element('#' + data.id + ' .bunsenburner-tripod');
                        var itemData = bunsenburner.isolateScope().item.beaker;
                        var tx = bunsenburnerTripod.offset().left;
                        var ty = bunsenburnerTripod.top;
                        if (tx - itemData.width - 20 > 0) {
                            tx = tx - itemData.width - 20;
                        } else {
                            tx = tx + bunsenburnerTripod.width() + 20;
                        }
                        scope.onDropComplete(itemData, {tx: tx, ty: ty});
                    }),

                    'bunsenburnerExplodeEvent': $rootScope.$on('API.bunsenburner_explode', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().$emit("API:explode");
                    }),

                    'pressuregaugeCreateEvent': $rootScope.$on('API.pressuregauge_create', function (event, data) {
                        var itemData = getItemData('pressuregauge');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'pressuregaugeDeleteEvent': $rootScope.$on('API.pressuregauge_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'pressuregaugeScaleEvent': $rootScope.$on('API.pressuregauge_scale', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().setScale(data.scale);
                    }),
                    
                    'thermometerCreateEvent': $rootScope.$on('API.thermometer_create', function (event, data) {
                        var itemData = getItemData('thermometer');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'thermometerDeleteEvent': $rootScope.$on('API.thermometer_delete', function (event, data) {
                        removeItem(data.id);
                    }),

                    'thermometerScaleEvent': $rootScope.$on('API.thermometer_scale', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().setScale(data.scale);
                    }),

                    //BALANCE
                    'balanceCreateEvent': $rootScope.$on('API.balance_create', function (event, data) {
                        var itemData = getItemData('balance');
                        itemData.uuid = data.id;
                        createItem(itemData, {tx: data.x, y: data.ty});
                    }),

                    'balanceDeleteEvent': $rootScope.$on('API.balance_delete', function (event, data) {
                        removeItem(data.id);
                    }),
                    
                    'balanceGroupEvent': $rootScope.$on('API.balance_group', function (event, data) {
                        var itemData = angular.element("[data-uuid='" + data.beaker + "']").isolateScope().uiData;
                        var balance = angular.element('#' + data.id);
                        balance.isolateScope().onDropComplete(itemData, {
                            tx: balance.offset().left,
                            ty: balance.offset().top
                        });
                    }),

                    'balanceUnGroupEvent': $rootScope.$on('API.balance_unGroup', function (event, data) {
                        var balance = angular.element('#' + data.id);
                        var itemData = balance.isolateScope().item.beaker;
                        var tx = balance.offset().left;
                        var ty = balance.top;
                        if (tx - itemData.width - 20 > 0) {
                            tx = tx - itemData.width - 20;
                        } else {
                            tx = tx + balance.width() + 20;
                        }
                        scope.onDropComplete(itemData, {tx: tx, ty: ty});
                    }),
                    
                    'balanceSetZeroEvent': $rootScope.$on('API.balance_setZero', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().zeroBalance();
                    }),
                    
                    'balanceScaleEvent': $rootScope.$on('API.balance_scale', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().setScale(data.scale);
                    }),
                    
                    'balanceOff': $rootScope.$on('API.balance_off', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().turnOff();
                    }),
                    
                    'balanceOn': $rootScope.$on('API.balance_on', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().turnOn();
                    }),
                    
                    'balanceRead': $rootScope.$on('API.balance_read', function (event, data) {
                        angular.element("[data-uuid='" + data.id + "']").isolateScope().setWeight(data.weight);
                    }),

                    'drawEvent': $rootScope.$on('API.draw', function (event, data) {
                        if ( angular.element('#circle').length ) {
                            angular.element('#circle').css({left: data.x, top: data.y});
                        } else {
                            var circle = angular.element('<div id="circle"></div>');
                            circle.css({left: data.x, top: data.y});

                            var body = angular.element(document).find('body').eq(0);
                            body.append(circle)
                        }
                    }),

                    'clearDrawEvent': $rootScope.$on('API.clearDraw', function(event, data) {
                        if ( angular.element('#circle').length ) {
                            angular.element('#circle').remove();
                        } else {
                            console.log ("Already clear");
                        }
                    })

                }

                // unbind listeners when destroy
                for (var unbind in rootListeners) {
                    scope.$on('$destroy', rootListeners[unbind]);
                }
                scope.$on('$destroy', mShowFunction);
            }
        }
    }
]);
