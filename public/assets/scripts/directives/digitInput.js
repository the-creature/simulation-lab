angular.module('labDirectives').directive('digitInput', [
    function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {
                max: '='
            },
            link: function (scope, element, attr, ctrl) {
                function inputValue(val) {
                    if (val) {
                        var digits = val.replace(/[^0-9.]/g, ''),
                            max = scope.max || 200;

                        if (digits > max)
                            digits = digits.slice(0, -1)

                        if (digits !== val) {
                            ctrl.$setViewValue(digits);
                            ctrl.$render();
                        }

                        return parseFloat(digits);
                    }
                    return undefined;
                }

                ctrl.$parsers.push(inputValue);
            }
        }
    }
]);