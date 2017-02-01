(function () {
    'use strict';

    var app = angular.module('mGrid');

    //We already have a limitTo filter built-in to angular,
    //let's make a startFrom filter
    app.filter('startFrom', function () {
        return function (input, start) {
            if (!angular.isArray(input))
                return input;

            start = +start; //parse to int
            return input.slice(start);
        };
    });

})();
