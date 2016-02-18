'use strict';
/*
 * lab instrument directive for lab app.
 */
angular.module("labDirectives")
    .directive("lightSwitch" ,[function(){
        return {
            templateUrl : 'templates/light-switch.html',
            restrict : "E",
            replace : false,
            scope : {
                "status" : "@"
            },
            link : function(scope , element ,attrs){
                scope.on     = initObj.assetsData.lightSwitch[initObj.labData.sceneassets.lightSwitch].assets.on;
                scope.off    = initObj.assetsData.lightSwitch[initObj.labData.sceneassets.lightSwitch].assets.off;
                scope.image  = scope.on;
                scope.status = 'on';

                scope.changeSwitchStatus = function() {
                    scope.image = (scope.status === 'on' ? scope.on : scope.off );
                    scope.status === 'on' ? API.lightSwitchStatus('off') : API.lightSwitchStatus('on');
                }

                scope.setSwitchStatus = function(status) {
                    scope.status = status;
                    angular.element('html').toggleClass('light-switch-off');
                    $('#audioSwitch')[0].currentTime = 0;
                    $('#audioSwitch')[0].play();
                }
            }
        }
    }]);