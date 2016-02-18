// Karma configuration
var webdriver = require('selenium-webdriver');

module.exports = function(config) {
  config.set({

    basePath: '../',

    frameworks: ['jasmine'],

    customLaunchers: {
        swd_chrome: {
            base: 'SeleniumWebdriver',
            browserName: 'Chrome',
            getDriver: function() {
                var driver = new webdriver.Builder().forBrowser('chrome').build();
                return driver;
            }
        }
    },

    files: [
        'public/assets/scripts/vendors/jquery.min.js',
        'bower_components/angular/angular.js',
        'bower_components/angular-resource/angular-resource.js',
        'bower_components/angular-touch/angular-touch.js',
        'bower_components/angular-resource/angular-resource.js',
        'bower_components/angular-sanitize/angular-sanitize.js',
        'bower_components/angular-mocks/angular-mocks.js',
        'public/assets/scripts/vendors/ui-bootstrap-tpls.min.js',
        'public/assets/scripts/vendors/jquery.panzoom.min.js',
        'public/assets/scripts/vendors/lodash.js',
        'public/assets/scripts/vendors/mediaelement-and-player.min.js',
        'public/assets/scripts/vendors/kendo.all.min.js',
        'public/assets/scripts/vendors/reflection.js',
        'public/assets/scripts/vendors/primus.js',
        'test/unit/global.js',
        'public/assets/scripts/vendors/require.js',
        'public/assets/scripts/vendors/serialijse.js',
        'public/assets/scripts/vendors/assert.js',
        'public/assets/scripts/config/config.js',
        'public/assets/scripts/app.js',
        'public/assets/scripts/controllers/labController.js',
        'public/assets/scripts/controllers/**/*.js',
        'public/assets/scripts/directives/labDirectives.js',
        'public/assets/scripts/directives/**/*.js',
        'public/assets/scripts/services/labServices.js',
        'public/assets/scripts/services/**/*.js',
        'public/assets/scripts/filters/filters.js',
        'public/assets/scripts/filters/**/*.js',
        'public/assets/scripts/api/api.js',
        'test/unit/**/*.js'
    ],

    exclude: [
        //'public/assets/scripts/api/api.js',
        //'public/assets/scripts/vendors/serialijse.js'
    ],

    preprocessors: {
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['swd_chrome'],

    singleRun: false
  })
}
