'use strict';
/*
 * lab material directive for lab app.
 */
angular.module("labDirectives")
.directive("labTimer" , ["$interval","$rootScope" ,"dateFilter" ,"$timeout" ,"uuid" , function($interval ,$rootScope ,dateFilter ,$timeout, uuid){
	return {
		replace : true,
		restrict : "EA",
		scope : {
            timers: '='
        },
		templateUrl : "templates/lab-timer.html",
		link : function(scope , element , attrs){
            scope.started = false;
            var format,  // date format
                stopTime, // so that we can cancel the time updates
                current,
                time = (new Date("2014-12-03T00:00:00Z")).getTime();//new a specified date with starting time at 00:00:00

            // used to update the UI
            function updateTime() {
                time = time + 1000;
                current = new Date(time);
                element.find(".show-timer").text(dateFilter(new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), current.getUTCHours(), current.getUTCMinutes(), current.getUTCSeconds()), "HH:mm:ss"));
            }

            // listen on DOM destroy (removal) event, and cancel the next UI update
            // to prevent updating time after the DOM element was removed.
            element.on('$destroy', function() {
                $interval.cancel(stopTime);
            });

            //after intro complete, will trigger the event.
            $rootScope.$on("intro-complete" ,function(){
                stopTime = $interval(updateTime, 1000);
                $timeout(function(){
                    scope.started = true;
                },1000)
            });

            // add new draggable timer
            scope.addTimer = function () {
                if (angular.isDefined(scope.timers) && angular.isArray(scope.timers)) {
                    var labTable = angular.element('.lab-table');

                    var timer = {
                        uuid: uuid.newWithName('timer'),
                        hours: 0,
                        seconds: 0,
                        minutes: 0,
                        x: labTable.width() / 2 - 100,
                        y: labTable.offset().top,
                        type: 'timer',
                        timestamp: new Date().getTime()
                    };
                    scope.timers.push(timer);
                    API.timeCreated(timer.uuid);
                }
            }
		}
	}
}]);