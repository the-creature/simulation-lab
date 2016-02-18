'use strict';

module.exports = function(grunt) {
    // require it at the top and pass in the grunt instance
    require('time-grunt')(grunt);

    var labData = require('./labData/labData.json'),
        //constants = require('./labData/constants.json'),
        introData = require('./labData/introData.json'),
        shelfData = require('./labData/shelfData.json'),
        toolsData = require('./labData/toolsData.json'),
        onStage = require('./labData/onStage.json');


    grunt.initConfig({
        ngconstant: {
            options: {
                name: 'labApp.config'
            },
            labData: {
                options: {
                    dest: 'public/assets/scripts/config/config.js',
                    constants: {
                        labData: labData,
                        //LAB_CONSTANTS: constants,
                        introData: introData,
                        shelfData: shelfData,
                        toolsData: toolsData,
                        onStage: onStage
                    }
                }
            }
        },

        less: {
            options: {
              compress: true
            },
            build: {
              src: ['public/assets/less/app.less'],
              dest: 'public/assets/css/app.css'
            }
        },

        watch: {
          grunt: {
            files: ['Gruntfile.js'],
            tasks: ['default'],
          },
          less: {
            files: ['public/assets/less/**/*.less'],
            tasks: ['less']
          }
        },
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', [
        'ngconstant',
        'less',
        'watch'
    ]);
}