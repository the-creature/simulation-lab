'use strict';
/*
 * lab trash directive for lab app.
 */
angular.module('labDirectives').directive('labWelcome', [
    function () {
        return {
            templateUrl: 'templates/welcome.html',
            restrict: 'EA',
            scope: {
                labPercent: '='
            },
            link: function (scope, element, attrs) {

            }
        }
    }
]);