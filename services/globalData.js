/**
 * GlobalData service
 *
 * This holds app-level global data
 * If you want to access this data in your scope, inject this service
 */
angular.module('labServices').factory('GlobalData', ['uuid', '$timeout', '$rootScope',  
    function (uuid, $timeout, $rootScope) {
        var tableItems = (function () {
            // Hashtable of table items
            var root = {
                items: {},
                savedState: {},
                labNotes: ""
            };
            var clearInterval = false;
            
            var methods = {
                items: root.items,
                savedState: root.savedState,
                labNotes: root.labNotes,

                /**
                 * Add new item to the table or parent
                 */
                add: function (item, newParent) {
                    //////////////////////////////
                    // Copy the old item
                    //////////////////////////////
                    var newItem = angular.extend({}, item);


                    //////////////////////////////////////
                    // Remove the old item from old parent
                    //////////////////////////////////////
                    methods.remove(item);

                    //////////////////////////////
                    // Add the copy to new parent
                    /////////////////////////////

                    if (!newItem.uuid) { // if uuid is not set, create new one
                        newItem.uuid = uuid.newWithName(newItem.name);
                    } else {
                        var counter = newItem.uuid.substr(newItem.uuid.indexOf("_")+1);
                        uuid.setCounter(counter);
                    }

                    // if newParent is not given, add to root
                    newItem.parent = angular.isDefined(newParent) ? newParent : root;

                    // Update child items
                    // Child items should register themselves to new parent, that is current item
                    for (var id in newItem.items) {
                        newItem.items[id].parent = newItem;
                    }

                    // Remove the previous item from parent if exists
                    if (angular.isDefined(newParent) && angular.isDefined(newParent.parent)) {
                        var grandParent = newParent.parent;

                        delete grandParent.items[newItem.uuid];
                        delete grandParent[newItem.name];
                    }


                    // if parent's items is not defined, create new object
                    if (angular.isUndefined(newItem.parent.items)) {
                        newItem.parent.items = {};
                    }

                    // Add new item
                    newItem.parent.items[newItem.uuid] = newItem;

                    return newItem;
                },

                /**
                 * Remove the item
                 */
                remove: function (item) {
                    if (!item.parent) {
                        return;
                    }

                    var parent = item.parent;
                    if (parent.items && item.uuid) {
                        delete parent.items[item.uuid];
                    }

                    if (item.name in parent) {
                        delete parent[item.name];
                    }
                },

                /**
                 * Check if the table is empty
                 */
                isEmpty: function () {
                    return $.isEmptyObject(root.items);
                },

                /**
                 * Remove all the items
                 */
                removeAll: function () {
                    for (var id in root.items) {
                        delete root.items[id];
                    }
                },
                
                /**
                 * Save manual notes to variable
                 */
                saveNotes: function (notes) {
                    if (!angular.isDefined(root.savedState)) {
                        root.savedState = {};
                    }
                    root.savedState.notes = notes;
                    
                    //Replace to a call to BE for saving
                    console.log("Saving notes to savedState");                    
                    console.log(JSON.stringify(root.savedState));
                },
                
                /**
                 * Save current table status to variable
                 */
                save: function () {
                    //Empty savedState but preserve notes
                    var notes = "";
                    if (angular.isDefined(root.savedState.notes)) {
                        notes = root.savedState.notes;
                    }
                    root.savedState = {};
                    //If there is any items in the state process them recursivelly
                    if (angular.isDefined(root.items)) {
                        root.savedState = saveRecursive(root.items, true);
                    }
                    root.savedState.notes = notes;
                    
                    //Replace to a call to BE for saving
                    console.log("Saving items");                    
                    console.log(JSON.stringify(root.savedState));
                },
                
                /**
                 * Return an item structure suitable for sending to the api
                 * in the same format as saveTable format the items
                 */
                getItemInSaveFormat: function (element) {
                    var base = {};
                    base[element.uuid] = element;
                    var result =  angular.extend({}, saveRecursive(base, true));
                    return result;
                },
                
                /**
                 * Set the current table state from external variable
                 */
                setState: function (state) {
                    root.savedState = angular.extend({}, state);
                },
                
                /**
                 * Restore table state from state variable
                 */                
                restoreState: function() {
                    //currently savedState is set on page load on labTable.js from a json file
                    //This should be latter replaced by a call to BE to get the state
                    if (angular.isDefined(root.savedState) && !clearInterval) {
                        //Clear the table and reset the uuid counter
                        methods.removeAll();
                        uuid.resetCounter();
                        //We need to give time to the interface to clear the DOM elements
                        clearInterval = $timeout(function () {
                            restoreStatePromise();
                        }, 300);
                    }
                }
            };
            
            /**
             * This function is called from restoreState giving time to the DOM
             * to clear. Now the state is restored recursivelly
             */
            function restoreStatePromise() {
                restoreStateRecursive(root.savedState);
                clearInterval = false;
            }
            
            /**
             * Iterate over all items and restore table status
             * 
             * @param elements  root.savedState or a child of it
             * @param parent    parent element for this iteration
             */
            function restoreStateRecursive(elements, parent) {
                for (var item in elements) {
                    if(item === "notes") {
                        root.labNotes = elements[item];
                        methods.labNotes = elements[item];
                        $rootScope.$broadcast('updateLabNotes');
                    } else {
                        //Get item from the name
                        var name = item.substr(0, item.indexOf("_"));
                        //Grab default item structure from the constants
                        var toolData = angular.copy(initObj.toolsData[name].defaults);
                        //If item type is defined, extend the properties from the type
                        if (angular.isDefined(elements[item].type)) {
                            angular.extend(toolData, toolsData[name].types[elements[item].type]);
                            //Save type if defined in object state so it can be exported
                            toolData.type = elements[item].type;
                        }
                        //Set position
                        if (angular.isDefined(elements[item].x)) {
                            toolData.left = elements[item].x;
                        }
                        if (angular.isDefined(elements[item].y)) {
                            toolData.top = elements[item].y;
                        }
                        toolData.uuid = item;
                        //add the item to the table or parent
                        var newItem;
                        if (angular.isDefined(parent)) {
                            newItem = methods.add(toolData, parent);
                            parent[newItem.name] = newItem;
                        } else {
                            newItem = methods.add(toolData);
                        }
                        //Set item state
                        newItem.label = elements[item].label;
                        newItem.state = newItem.state || {};
                        switch (name) {
                            case 'bunsenburner':
                                newItem.state.flame = elements[item].flame;
                                break;
                            case 'thermometer':
                            case 'pressuregauge':
                                newItem.state.scale = elements[item].scale;
                                break;
                            case 'balance':
                                newItem.state.scale = elements[item].scale;
                                newItem.state.zero = elements[item].zero;
                                break;
                            case 'beaker':
                            case 'crucible':
                            case 'testtube':
                            case 'evaporatingdish':
                            case 'graduatedcylinder':
                            case 'erlenmeyerflask':
                                newItem.state.filledVolume = elements[item].filledVolume;
                                newItem.state.liquidTotal = elements[item].liquidTotal;
                                newItem.state.solidTotal = elements[item].solidTotal;
                                newItem.state.boiling = elements[item].boiling;
                                newItem.state.temperature = elements[item].read.C;
                                newItem.state.liquidColor = elements[item].liquid.color;
                                newItem.state.liquidTrans = elements[item].liquid.transparency;
                                newItem.state.solids = elements[item].solids;
                                if (name == 'erlenmeyerflask') {
                                    newItem.state.isClosed = elements[item].isClosed;
                                    newItem.state.pressure = elements[item].read.Pa;
                                }
                                if (name == 'crucible') {
                                    newItem.state.isClosed = elements[item].isClosed;
                                }
                                break;                        
                        }
                        //Recursivelly process inner elements
                        if (angular.isDefined(elements[item].items)) {
                            restoreStateRecursive(elements[item].items, newItem);
                        }
                    }
                }                                
            }
            
            /**
             * Iterate over all items and generate the correct structure for saving
             * 
             * @param elements
             * @param withPosition
             * 
             */
            function saveRecursive(elements, withPosition) {
                var result = {};
                for (var item in elements) {
                    var newItem = {};
                    // Set the item position if top level element
                    if(withPosition) {
                        newItem.x = elements[item].left || 0;
                        newItem.y = elements[item].top || 0;
                    }
                    newItem.label = elements[item].label;
                    // Check the item type and generate the structure
                    switch (elements[item].name) {
                        case 'bunsenburner':
                            newItem.flame = elements[item].state.flame;
                            break;
                        case 'thermometer':
                        case 'pressuregauge':
                            newItem.scale = elements[item].state.scale;
                            break;
                        case 'balance':
                            newItem.scale = elements[item].state.scale;
                            newItem.zero = elements[item].state.zero;
                            break;
                        case 'beaker':
                        case 'crucible':
                        case 'testtube':
                        case 'evaporatingdish':
                        case 'graduatedcylinder':
                        case 'erlenmeyerflask':
                            var tempTemp = elements[item].state.temperature || initObj.labData.roomTemperature;
                            newItem.filledVolume = elements[item].state.filledVolume;
                            newItem.liquidTotal = elements[item].state.liquidTotal;
                            newItem.solidTotal = elements[item].state.solidTotal;
                            newItem.boiling = elements[item].state.boiling || false;
                            newItem.read = {};
                            // newItem.read.C = parseFloat(parseFloat(tempTemp).toFixed(1));
                            newItem.read.C = tempTemp;
                            // newItem.read.F = parseFloat((parseFloat(tempTemp) * 9 / 5 + 32).toFixed(1));
                            newItem.read.F = tempTemp;
                            // newItem.read.K = parseFloat((parseFloat(tempTemp) + 273.15).toFixed(1));
                            newItem.read.K = tempTemp;
                            newItem.liquid = {};
                            newItem.liquid.color = elements[item].state.liquidColor || "#000000";
                            newItem.liquid.transparency = elements[item].state.liquidTrans || 1;
                            newItem.solids = angular.extend({}, elements[item].state.solids);
                            if (elements[item].name == 'erlenmeyerflask') {
                                var tempPressure = elements[item].state.pressure || initObj.labData.roomPressure;
                                newItem.isClosed = elements[item].state.isClosed || false;
                                // newItem.read.Pa = parseFloat(parseFloat(tempPressure).toFixed(1));
                                newItem.read.Pa = tempPressure;
                            }
                            if (elements[item].name == 'crucible') {
                                newItem.isClosed = elements[item].state.isClosed || false;
                            }
                            if (angular.isDefined(elements[item].type)) {
                                newItem.type = elements[item].type;
                            }
                            break;
                    }
                    
                    //Save the new Item
                    result[elements[item].uuid] = newItem;
                    
                    //Recursivelly process inner elements
                    if (angular.isDefined(elements[item].items)) {
                        result[elements[item].uuid].items = saveRecursive(elements[item].items, false);
                    }
                }
                return result;
            };

            return methods;
        })();

        var dashboardInfo = (function () {
            var info = {
                memory: 0,
                loadTime: 0,
                responseTime: 0,
                objects: 0,
                liquidFps: 0,
                steamFps: 0,
                bubbleFps: 0,
                flameFps: 0
            };

            return info;
        })();

        var eventLogs = (function () {
            var logs = [{
                logType: 'info',
                logTime: '2015-04-03 04:03:25',
                logText: 'Setting Lab Scene: chemistry_intro.flv'
            }, {
                logType: 'system',
                logTime: '2015-04-03 04:05:25',
                logText: 'Lab: Density - A Characteristic Property running'
            }, {
                logType: 'alert',
                logTime: '2015-04-03 04:04:25',
                logText: 'Manufacturer: Google Pepper ^ OS: Mac OS 10.10.2'
            }, {
                logType: 'user',
                logTime: '2015-04-03 04:09:25',
                logText: 'Language: en_US'
            }, {
                logType: 'alert',
                logTime: '2015-04-03 04:07:25',
                logText: 'LabID: 51 | LabSectionID: 51 | UserID: 18657'
            }, {
                logType: 'system',
                logTime: '2015-04-03 04:08:25',
                logText: 'Branch: sprint28'
            }, {
                logType: 'info',
                logTime: '2015-04-03 04:06:25',
                logText: 'Version: sprint28:28:1:Build Date: March 24, 2015'
            }, {
                logType: 'info',
                logTime: '2015-04-03 04:03:25',
                logText: 'Setting Lab Scene: chemistry_intro.flv'
            }, {
                logType: 'system',
                logTime: '2015-04-03 04:05:25',
                logText: 'Lab: Density - A Characteristic Property running'
            }, {
                logType: 'alert',
                logTime: '2015-04-03 04:04:25',
                logText: 'Manufacturer: Google Pepper ^ OS: Mac OS 10.10.2'
            }, {
                logType: 'user',
                logTime: '2015-04-03 04:09:25',
                logText: 'Language: en_US'
            }, {
                logType: 'alert',
                logTime: '2015-04-03 04:07:25',
                logText: 'LabID: 51 | LabSectionID: 51 | UserID: 18657'
            }, {
                logType: 'system',
                logTime: '2015-04-03 04:08:25',
                logText: 'Branch: sprint28'
            }, {
                logType: 'info',
                logTime: '2015-04-03 04:06:25',
                logText: 'Version: sprint28:28:1:Build Date: March 24, 2015'
            }];

            return logs;
        })();

        return {
            tableItems: tableItems,
            dashboardInfo: dashboardInfo,
            eventLogs: eventLogs
        };
    }
]);