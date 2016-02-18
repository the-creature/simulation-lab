angular.module("ngDraggable", []).directive('ngDrag', ['$rootScope', '$parse', '$q',
    function ($rootScope, $parse, $q) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var offset, _centerAnchor = false, _mx, _my, _tx, _ty, _mrx, _mry,
                    _hasTouch = ('ontouchstart' in document.documentElement),
                    _pressEvents = 'touchstart mousedown',
                    _moveEvents = 'touchmove mousemove',
                    _releaseEvents = 'touchend mouseup',
                    $document = $(document),
                    $window = $(window),
                    _data = null,
                    _dragEnabled = false,
                    _dropEnabled = false,// It is set true, this is also droppable element
                    _dragReset = true,
                    _pressTimer = null,
                    _holdTimer = null,
                    onDragBeginCallback = $parse(attrs.ngDragBegin) || null;
                onDragSuccessCallback = $parse(attrs.ngDragSuccess) || null;
                var _first;
                
                // to identify the element in order to prevent getting superflous events when a single element has both drag and drop directives on it.
                var _myid = scope.$id;
                if (angular.isDefined(scope.item)) {
                    _myid = scope.item.uuid;
                }

                var _initialPosition = {
                    left: '',
                    top: '',
                    right: '',
                    bottom: '',
                    position: '',
                    margin: '',
                    'z-index': ''
                };
                var _returnPosition = {
                    left: '',
                    top: '',
                    right: '',
                    bottom: '',
                    position: '',
                    margin: '',
                    'z-index': ''
                };

                var initialize = function () {
                    element.attr('draggable', 'false'); // prevent native drag
                    toggleListeners(true);
                };

                var toggleListeners = function (enable) {
                    // remove listeners
                    if (!enable)return;
                    // add listeners.

                    scope.$on('$destroy', onDestroy);
                    scope.$watch(attrs.ngDrag, onEnableChange);
                    scope.$watch(attrs.ngDragReset, onDragResetChange);
                    scope.$watch(attrs.ngCenterAnchor, onCenterAnchor);
                    scope.$watch(attrs.ngDragData, onDragDataChange);
                    scope.$watch(attrs.ngDrop, onDropChange);

                    element.on(_pressEvents, onPress);
                    element.on('touchstart', onHold);
                    if (!_hasTouch) {
                        element.on('mousedown', function () {
                            return false;
                        }); // prevent native drag
                    }
                };
                var onDestroy = function (enable) {
                    toggleListeners(false);
                };
                var onDragDataChange = function (newVal, oldVal) {
                    _data = newVal;
                };
                var onDragResetChange = function (newVal) {
                    if (angular.isDefined(newVal)) {
                        _dragReset = newVal;
                    }
                };
                var onEnableChange = function (newVal, oldVal) {
                    _dragEnabled = (newVal);
                };
                var onCenterAnchor = function (newVal, oldVal) {
                    //if(angular.isDefined(newVal))
                    //_centerAnchor = (newVal || 'false');
                };
                var onDropChange = function (newVal, oldVal) {
                    if (angular.isDefined(newVal)) {
                        _dropEnabled = newVal;
                    }
                };
                var isClickableElement = function (evt) {
                    return (
                        angular.isDefined(angular.element(evt.target).attr("ng-cancel-drag"))
                    );
                };
                var onHold = function(evt) {
                        cancelHold();
                        _holdTimer = setTimeout(function () {
                            cancelHold();
                            if (angular.isDefined(_data.beforeLeft)) {
                                if (Math.abs(_data.beforeLeft - _tx - $(".lab-table").offset().left) < 1 && 
                                    Math.abs(_data.beforeTop) - Math.abs(_ty - $(".lab-table").offset().top) < 1) {                            
                                    $rootScope.$broadcast('element:dblclick', {data: _data, event: evt});
                                }
                            }
                        }, 600);
                        $document.on('touchmove', cancelHold);
                        $document.on('touchend', cancelHold);
                };
                var cancelHold = function () {
                    clearTimeout(_holdTimer);
                    $document.off('touchmove', cancelHold);
                    $document.off('touchmove', cancelHold);
                };
                /*
                 * When the element is clicked start the drag behaviour
                 * On touch devices as a small delay so as not to prevent native window scrolling
                 */
                var onPress = function (evt) {
                    // Stop propagation, preventing onPress event going up to parent element
                    evt.stopPropagation();

                    if (!_dragEnabled) return;

                    if (isClickableElement(evt)) {
                        return;
                    }

                    /**
                     * Trigger onDragBeginCallback
                     */
                    if (onDragBeginCallback) {
                        scope.$apply(function () {
                            onDragBeginCallback(scope, {$data: _data, $event: evt});
                        });
                    }

                    _initialPosition = {
                        left: element.css('left'),
                        top: element.css('top'),
                        right: element.css('right'),
                        bottom: element.css('bottom'),
                        position: element.css('position'),
                        'z-index': element.css('z-index'),
                        margin: element.css('margin')
                    };
                    _first = true;
                    
                    if (_hasTouch) {
                        cancelPress();
                        _pressTimer = setTimeout(function () {
                            cancelPress();
                            onLongPress(evt);
                        }, 100);
                        $document.on(_moveEvents, cancelPress);
                        $document.on(_releaseEvents, cancelPress);
                    } else {
                        onLongPress(evt);
                    }
                };

                var cancelPress = function () {
                    clearTimeout(_pressTimer);
                    $document.off(_moveEvents, cancelPress);
                    $document.off(_releaseEvents, cancelPress);
                };

                var onLongPress = function (evt) {
                    if (!_dragEnabled)return;
                    evt.preventDefault();
                    element.addClass('dragging');
                    //$(".workspace").panzoom("resetDimensions");
                    //matrix = $(".workspace").panzoom("getMatrix");

                    offset = element.offset();

                    element.centerX = (element.width() / 2);
                    element.centerY = (element.height() / 2);

                    _mx = (evt.pageX || evt.originalEvent.touches[0].pageX);
                    _my = (evt.pageY || evt.originalEvent.touches[0].pageY);

                    _mrx = _mx - offset.left;
                    _mry = _my - offset.top;

                    if (_centerAnchor) {
                        _tx = _mx - element.centerX - $window.scrollLeft();
                        _ty = _my - element.centerY - $window.scrollTop();
                    } else {
                        _tx = offset.left - $window.scrollLeft();
                        _ty = offset.top - $window.scrollTop();
                    }
                    
                    //_tx = _tx * (1 / matrix[0]);
                    //_ty = _ty * (1 / matrix[3]);
                    $document.on(_moveEvents, onMove);
                    $document.on(_releaseEvents, onRelease);
                    $rootScope.$broadcast('draggable:start', {
                        x: _mx, y: _my, tx: _tx, ty: _ty,
                        event: evt,
                        element: element,
                        data: _data,
                        uid: _myid,
                        dropEnabled: _dropEnabled
                    });
                };

                var onMove = function (evt) {
                    if (!_dragEnabled) return;
                    evt.preventDefault();
                    //matrix = $(".workspace").panzoom("getMatrix");

                    _mx = (evt.pageX || evt.originalEvent.touches[0].pageX);
                    _my = (evt.pageY || evt.originalEvent.touches[0].pageY);

                    if (_centerAnchor) {
                        _tx = _mx - element.centerX - $window.scrollLeft();
                        _ty = _my - element.centerY - $window.scrollTop();
                    } else {
                        _tx = _mx - _mrx - $window.scrollLeft();
                        _ty = _my - _mry - $window.scrollTop();
                    }
                    
                    //Adjust position if screen zoomed or panned
                    var matrix = $(".workspace").panzoom("getMatrix");
                    var ceroX = -($(".workspace").width()*(1-matrix[0])/2);
                    var ceroY = -($(".workspace").height()*(1-matrix[3])/2);
                    _tx = _tx * (1/Number(matrix[0])) + (ceroX - matrix[4])*(1/Number(matrix[0]));
                    _ty = _ty * (1/Number(matrix[3])) + (ceroY - matrix[5])*(1/Number(matrix[3]));

                    moveElement(_tx, _ty);
                    $rootScope.$broadcast('draggable:move', {
                        x: _mx, y: _my, tx: _tx, ty: _ty,
                        event: evt,
                        element: element,
                        data: _data,
                        uid: _myid,
                        dropEnabled: _dropEnabled
                    });
                };

                var onRelease = function (evt) {
                    if (!_dragEnabled)return;
                    evt.preventDefault();

                    // Create a promise to notify that drop event handling process has been finished
                    if ($rootScope.totalDropElement > 0) {
                        $rootScope.dropFinishedDeferred = $q.defer();
                        $rootScope.dropFinishedPromise = $rootScope.dropFinishedDeferred.promise;
                    }

                    $rootScope.$broadcast('draggable:end', {
                        x: _mx, y: _my, tx: _tx, ty: _ty,
                        event: evt,
                        element: element,
                        data: _data,
                        dragSuccessCallback: onDragComplete, // this callback is called when the drop is valid, that is, if isTouching() is true
                        dragFailureCallback: onDragFailure,
                        uid: _myid,
                        dropEnabled: _dropEnabled,
                        returnPosition: _returnPosition,
                        initialPosition: _initialPosition
                    });
                    element.removeClass('dragging');

                    $document.off(_moveEvents, onMove);
                    $document.off(_releaseEvents, onRelease);
                };

                /**
                 * Called when the drag succeeds
                 *
                 * @param evt
                 */
                var onDragComplete = function (evt) {
                    if (_dragReset && evt.data.type != 'timer') { // never reset position of timer
                        reset();
                    }
                    if (onDragSuccessCallback) {
                        scope.$apply(function () {
                            onDragSuccessCallback(scope, {$data: _data, $event: evt});
                        });
                    }
                };

                /**
                 * Called when the drag fails, that is, the dragged element is released out of droppable element
                 *
                 * @param evt
                 */
                var onDragFailure = function (evt) {
                    if (evt.data.type != 'timer') { // never reset position of timer
                        element.addClass('dragTransition');
                        element[0].offsetHeight;
                        resetToInitial();
                        element[0].offsetHeight;
                        setTimeout(function () {
                            element.removeClass('dragTransition');
                            reset();
                        }, 500);
                    }
                };

                var reset = function () {
                    element.css(_initialPosition);
                };
                var resetToInitial = function () {
                    element.css(_returnPosition);
                };

                var moveElement = function (x, y) {
                    if (_first) {
                        _first = false;
                        _returnPosition = {
                            left: x,
                            top: y,
                            right: 'auto',
                            bottom: 'auto',
                            position: 'fixed',
                            'z-index': 99999,
                            margin: '0'
                        };
                    }

                    // when start moving object on table:
                    // updating css seems does not update position attribute of table-item quickly,
                    // which cause the position of objects move to around shelf
                    // have to update again to make position changed, weird
                    element.css({
                        left: x,
                        top: y,
                        right: 'auto',
                        bottom: 'auto',
                        position: 'fixed',
                        'z-index': 99999,
                        margin: '0'
                    });
                    element.css({
                        left: x,
                        top: y,
                        right: 'auto',
                        bottom: 'auto',
                        position: 'fixed',
                        'z-index': 99999,
                        margin: '0'
                    });
                };

                initialize();
            }
        }
    }
]).directive('ngDrop', ['$parse', '$rootScope',
    function ($parse, $rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.value = attrs.ngDrop;

                var _myid = scope.$id;
                if (angular.isDefined(scope.item)) {
                    _myid = scope.item.uuid;
                }

                var _dropEnabled = false;
                var _dropName = '';

                var onDropCallback = $parse(attrs.ngDropSuccess) || function () {
                    };
                var initialize = function () {
                    // Track total drop element
                    $rootScope.totalDropElement = $rootScope.totalDropElement || 0;
                    $rootScope.totalDropElement++;

                    toggleListeners(true);
                };

                var toggleListeners = function (enable) {
                    // remove listeners

                    if (!enable)return;
                    // add listeners.
                    attrs.$observe("ngDrop", onEnableChange);
                    attrs.$observe("ngDropName", onNameChange);
                    scope.$on('$destroy', onDestroy);
                    //scope.$watch(attrs.uiDraggable, onDraggableChange);
                    scope.$on('draggable:start', onDragStart);
                    scope.$on('draggable:move', onDragMove);
                    scope.$on('draggable:end', onDragEnd);
                };
                var onDestroy = function (enable) {
                    // Track total drop element
                    $rootScope.totalDropElement--;

                    toggleListeners(false);
                };
                var onEnableChange = function (newVal, oldVal) {
                    _dropEnabled = scope.$eval(newVal);
                };
                var onNameChange = function (newVal, oldVal) {
                    _dropName = scope.$eval(newVal);
                };
                var onDragStart = function (evt, obj) {
                    // don't listen to drop events if this is the element being dragged
                    if (!_dropEnabled || _myid === obj.uid) {
                        return;
                    }
                    isTouching(obj.x, obj.y, obj.element, obj.data);
                };
                var onDragMove = function (evt, obj) {
                    // don't listen to drop events if this is the element being dragged
                    if (!_dropEnabled || _myid === obj.uid) {
                        return;
                    }
                    isTouching(obj.x, obj.y, obj.element, obj.data);
                };
                var onDragEnd = function (evt, obj) {
                    // don't listen to drop events if this is the element being dragged
                    if (!_dropEnabled || _myid === obj.uid || obj.data.type == 'timer') {
                        return;
                    }
                    // Track the count of dragEnd event processed
                    // If this dropCount is reached the total dropElement count,
                    // it means the dragEnd event is processed thoroughly
                    evt.dropCount = evt.dropCount || 0;
                    evt.dropCount++;

                    // check if drag to item
                    obj.dragToItem = dropOnItem(obj);

                    if (isTouching(obj.x, obj.y, obj.element, obj.data)) {
                        // Prevent default action, which is to call dragFailureCallback
                        evt.preventDefault();

                        // Call drag success callback
                        if (obj.dragSuccessCallback) {
                            obj.dragSuccessCallback(obj);
                        }

                        onDropCallback(scope, {$data: obj.data, $event: obj});
                    } else {
                        var totalDropElement = $rootScope.totalDropElement;

                        if (obj.dropEnabled) { // if element being dragged is dropable element, eliminate it
                            totalDropElement--;
                        }

                        // Check if it reached the last drop element
                        if (evt.dropCount == totalDropElement) {
                            // Mark drop event handling has been finished
                            $rootScope.dropFinishedDeferred.resolve();

                            if (!evt.defaultPrevented) {
                                if (angular.isDefined(obj.data.label)) {
                                    $rootScope.$broadcast('draggable:click', {data: obj.data});
                                }
                                // Call drag failure callback
                                if (obj.dragFailureCallback) {
                                    obj.dragFailureCallback(obj);
                                }
                            }
                        }
                    }

                    updateDragStyles(false, obj.element);
                };
                var isTouching = function (mouseX, mouseY, dragElement, dragData) {
                    var touching = hitTest(mouseX, mouseY);
                    updateDragStyles(touching, dragElement, dragData);
                    return touching;
                };
                var updateDragStyles = function (touching, dragElement, dragData) {
                    if (touching && (angular.isDefined(dragData.canBindTo) && dragData.canBindTo.indexOf(_dropName) > -1 ||
                        (angular.isDefined(dragData.canDropTo) && dragData.canDropTo.indexOf(_dropName) > -1))) {
                        element.addClass('drag-enter');
                        dragElement.addClass('drag-over');

                        scope.$broadcast('drag-enter');
                    } else {
                        element.removeClass('drag-enter');
                        dragElement.removeClass('drag-over');

                        scope.$broadcast('drag-leave');
                    }
                };
                var hitTest = function (x, y) {
                    var bounds = element.offset();
                    if (element.hasClass('lab-table') || element.hasClass('side-table')) {
                        var matrix = $(".workspace").panzoom("getMatrix");
                        var ceroX = -($(".workspace").width()*(1-matrix[0])/2);
                        var ceroY = -($(".workspace").height()*(1-matrix[3])/2);
                        y = y * (1/Number(matrix[3])) + (ceroY - matrix[5])*(1/Number(matrix[3]));
                        bounds.top = element[0].offsetTop;
                        bounds.left = element[0].offsetLeft;
                        bounds.right = bounds.left + element.outerWidth();
                        bounds.bottom = bounds.top + element.outerHeight();
                    } else {
                        bounds.right = bounds.left + element.outerWidth();
                        bounds.bottom = bounds.top + element.outerHeight();                        
                    }
                    return x >= bounds.left
                        && x <= bounds.right
                        && y <= bounds.bottom
                        && y >= bounds.top;
                };
                var hitItemTest = function (x, y, drop) {
                    var bounds = drop.offset();
                    bounds.right = bounds.left + drop.outerWidth();
                    bounds.bottom = bounds.top + drop.outerHeight();
                    return x >= bounds.left
                        && x <= bounds.right
                        && y <= bounds.bottom
                        && y >= bounds.top;
                };
                var dropOnItem = function(obj) {
                    var dropOnItem = false;
                    var dropElements = angular.element("[ng-drop='true']");
                    for (var i = 0; i < dropElements.length; i++) {
                        var dropElement = angular.element(dropElements[i]);
                        if (obj.element.data('drop-uuid') != dropElement.data('drop-uuid') &&
                            (!dropElement.hasClass('lab-table') && !dropElement.hasClass('side-table') && !dropElement.hasClass('biowaste')) &&
                            hitItemTest(obj.x, obj.y, dropElement)) {
                            dropOnItem = true;
                            break;
                        }
                    }
                    return dropOnItem;
                };

                initialize();
            }
        }
    }
]);

