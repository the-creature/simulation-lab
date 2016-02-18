'use strict';

describe('labApp services', function() {
    beforeEach(function(){
        jasmine.addMatchers({
            toEqualData: function(util, customEqualityTesters) {
                return {
                    compare: function(actual, expected) {
                        var result = {};
                        result.pass = angular.equals(actual, expected);
                        return result;
                    }
                };
            }
        });
    });

    beforeEach(module('labApp'));

    describe('globalData', function() {
        var globalData;

        beforeEach(inject(function(_GlobalData_) {
            globalData = _GlobalData_;
        }));

        it('should be defined', function() {
            expect(globalData).toBeDefined();
        });

        it('tableItems should be empty object', function() {
            expect(globalData.tableItems.items).toEqualData({});
        });

        it('dashboardInfo should be same as info', function() {
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

            expect(globalData.dashboardInfo).toEqualData(info);
        });

        it('eventLogs should not be empty', function() {
            expect(globalData.eventLogs.length).toBeGreaterThan(0);
        });
    })
});