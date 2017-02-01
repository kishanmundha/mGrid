"use strict";

module.exports = function (config) {
    config.set({
        basePath: '../',
        files: [
            'src/bower_components/angular/angular.min.js',
            'src/bower_components/angular-mocks/angular-mocks.js',
            'src/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'src/bower_components/jquery/dist/jquery.min.js',
            'src/mGrid/mGrid.module.js',
            'src/mGrid/**/*.js',
            'test/unit/**/*.js'
        ],
        preprocessors: {
            'src/mGrid/**/*.js': ['coverage']
        },
        autoWatch: true,
        frameworks: ['jasmine'],
        browsers: [
            //'Chrome'//,
                    //'Firefox'
            'PhantomJS'
        ],
        plugins: [
            'karma-chrome-launcher',
            //'karma-firefox-launcher',
            "karma-phantomjs-launcher",
            'karma-jasmine',
            'karma-jasmine-html-reporter',
            'karma-coverage'//,
            //'karma-html-reporter'
        ],
        reporters: ['progress',
        //'html',
        'coverage'],
        coverageReporter: {
            type: 'lcov',
            dir: 'coverage'
        }

    });
};
