angular.module('labFilters', [])
    // Displays formatted temperature,
    // it accepts temperature in Celsius and temperature unit
    .filter('temperature', function () {
        return function (input, unit) {
            unit = unit || 'C';

            var num = 0;
            if (angular.isUndefined(input) || isNaN(input)) {
                return '';
            } else {
                switch (unit) {
                    case 'C':
                        num = parseFloat(input).toFixed(1);
                        break;
                    case 'F':
                        num = (parseFloat(input) * 9 / 5 + 32).toFixed(1);
                        break;
                    case 'K':
                        num = (parseFloat(input) + 273.15).toFixed(1);
                        break;
                }
            }

            return num + unit;
        };
    })
    // Displays formatted pressure,
    // it accepts pressure in Pascals and pressure unit
    .filter('pressure', function () {
        return function (input, unit) {
            unit = unit || 'Pa';

            var num = 0;
            if (angular.isUndefined(input) || isNaN(input)) {
                return '';
            } else {
                switch (unit) {
                    case 'Pa':
                        num = parseFloat(input).toFixed(0);
                        break;
                    case 'Torr':
                    case 'mmHg':
                        num = (parseFloat(input) / 1000 * 7.50062).toFixed(1);
                        break;
                    case 'psi':
                        num = (parseFloat(input) / 1000 * 0.145038).toFixed(1);
                        break;
                    case 'inHg':
                        num = (parseFloat(input) / 1000 * 0.295300).toFixed(1);
                        break;
                    case 'bar':
                        num = (parseFloat(input) / 100000).toFixed(1);
                        break;
                    case 'atm':
                        num = (parseFloat(input) / 1000 * 0.009869233).toFixed(1);
                        break;
                }
            }

            return num;
        };
    })
    // Displays formatted weight,
    // it accepts weight in grams and unit as g or gm (miligrams)
    .filter('weight', function () {
        return function (input, unit) {
            unit = unit || 'g';

            var num = 0;
            if (angular.isUndefined(input) || isNaN(input)) {
                return '';
            } else {
                switch (unit) {
                    case 'g':
                        num = (parseFloat(input) / 1000).toFixed(2);
                        break;
                    case 'mg':
                        num = parseFloat(input).toFixed(2);
                        break;
                }
            }
            return num + unit;
        };
    })
    .filter('megabyte', function () {
        return function (input) {
            return input ? input + 'MB' : '';
        };
    })
    .filter('millisecond', function () {
        return function (input) {
            return input ? input + 'ms' : '';
        }
    })
    .filter('trusted', ['$sce', function ($sce) {
        return function(url) {
            return $sce.trustAsResourceUrl(url);
        };
    }]);
