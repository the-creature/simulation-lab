'use strict';

describe('labApp controllers', function() {
    beforeEach(module('labApp'));
    beforeEach(module('labServices'));

    describe('introController', function() {
        var $scope, ctrl, $controller, $rootScope;

        beforeEach(inject(function(_$controller_, _$rootScope_) {
            $controller = _$controller_;
            $rootScope = _$rootScope_;
            $scope = $rootScope.$new();
            ctrl = $controller('introController', {$scope: $scope});
        }));

        it('$scope.imageLocations array should not be empty', function() {
            expect($scope.imageLocations.length).toBeGreaterThan(0);
        });

    });
});