'use strict';
/*
 * mediaElement directive for lab app.
 */
angular.module("labDirectives").directive("mediaElement" ,['$timeout', function($timeout){
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        templateUrl: 'templates/media-element.html',
        controller: function($scope) {
            $scope.media = initObj.labData.media;
            $scope.video = true; // show video or sheet switch
            $scope.loading = true; // if in searching video status, show progressbar

            $scope.showVideo = function() {
                $scope.video = true;
            }

            $scope.showSheet = function() {
                $scope.video = false;
            }
        },
        link: function(scope, element, attrs) {
            $timeout(function() {
                scope.loading = false;
                angular.element("#player").mediaelementplayer();
            });
        }
    }
}]);