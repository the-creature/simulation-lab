angular.module('dragTimer', [])
  .directive('dragTimer', ['$interval', '$rootScope', function ($interval, $rootScope) {
    return {
      restrict: 'AE',
      templateUrl: 'templates/draggable-timer.html',
      replace: true,
      scope: {
        timerData: "=",
        onTimerStopEvent: "="
      },
      link: function ($scope, element, attrs) {
        // Set interval for timer
        $scope.draggable = false;
        $scope.centerAnchor = false;

        $scope.$on('draggable:end', function (event, data) {
          if (data.data.uuid == $scope.timerData.uuid) {
              $scope.timerData.x = data.tx;
              $scope.timerData.y = data.ty;
          }
        });

        $scope.mouseUp = function() {
          //Set timeout for parent events
          setTimeout(function() {
            $scope.draggable = false
          }, 100);
        };

        $scope.timerData.tStop = $interval(function () {
          if ($scope.timerData.seconds++ === 60) {
            $scope.timerData.seconds = 0;
            if ($scope.timerData.minutes++ === 60) {
              $scope.timerData.minutes = 0;
              $scope.timerData.hours++;
            }
          }
        }, 1000);

        $scope.stopTimer = function () {
          if (angular.isDefined($scope.timerData.tStop)) {
            $interval.cancel($scope.timerData.tStop);
            $rootScope.$broadcast('stop-timer-event', $scope.timerData);

            var timerData = {
              id: $scope.timerData.uuid,
              hour: $scope.timerData.hour,
              minutes: $scope.timerData.minutes,
              seconds: $scope.timerData.seconds 
            }

            API.timeRemoved(timerData);

            if (angular.isFunction($scope.onTimerStopEvent)) {
              $scope.onTimerStopEvent($scope.timerData);
            }
          }
        }
      }
    }
  }]);
