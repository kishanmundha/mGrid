'use strict';

describe('start-from filter', function () {
    var startFromFilter;

    beforeEach(module('mGrid'));
    beforeEach(inject(function (_startFromFilter_) {
        startFromFilter = _startFromFilter_;
    }));

    it('Should not do any operation for non array input', function () {
        expect(startFromFilter(undefined)).toBeUndefined();
        expect(startFromFilter(null)).toBe(null);
        expect(startFromFilter('string')).toBe('string');
        expect(startFromFilter(5)).toBe(5);
        expect(startFromFilter({})).toEqual({});
    });

    it('Should remove element from array', function () {
        var inputArray = [];
        for (var i = 0; i < 10; i++) {
            inputArray.push({ "id": (i + 1), "name": "name" + (i + 1) });
        }
        var outputArray = startFromFilter(inputArray, 8);

        expect(outputArray.length).toBe(2);
        expect(outputArray).toEqual([{ "id": 9, "name": "name9" }, { "id": 10, "name": "name10" }]);
    });

    it('Should handle start index for out of index', function() {
        var inputArray = [];
        for (var i = 0; i < 5; i++) {
            inputArray.push({ "id": (i + 1), "name": "name" + (i + 1) });
        }
        var outputArray = startFromFilter(inputArray, 8);

        expect(outputArray.length).toBe(0);
        expect(outputArray).toEqual([]);
    });
});