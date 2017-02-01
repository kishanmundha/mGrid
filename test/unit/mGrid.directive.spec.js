'use strict';

describe('m-grid directive', function () {
    var elm, scope, rootScope, _window;

    beforeEach(module('mGrid'));
    beforeEach(inject(function ($rootScope, $window) {
        scope = $rootScope.$new();
        rootScope = $rootScope;
        _window = $window;
    }));

    function compileDirective(tpl) {
        if (!tpl)
            throw 'template required';

        inject(function ($compile) {
            elm = $compile(tpl)(scope);
            //console.log(elm);
        });
        // $digest is necessary to finalize the directive generation
        scope.$digest();
    }

    it('test', function () {
        expect(function () { compileDirective('<m-grid></m-grid>'); }).toThrow(new Error("mGrid must configure gridOptions and there columns"));

        scope.gridOptions = {
            columnDefs: [{
                field: "column1",
                name: "Column 1"
            }, {
                field: "column2",
                name: "Column 2",
                visible: false,
                format: 'date'
            }, {
                field: "column3",
                name: "Column 3",
                cellTemplate: 'custom template'
            }],
            cardTemplate: '<div>card</div>',
            listTemplate: '<div>list</div>'
        };
        scope.isChecked = false;

        expect(function () { compileDirective('<m-grid grid-options="gridOptions" urlParam="{isChecked:isChecked}"></m-grid>'); }).not.toThrow(new Error());
        expect(scope.gridOptions.columns.length).toEqual(3);

        scope.isChecked = true;
        scope.$digest();

        rootScope.$broadcast('globalSearch', 'search text');
        scope.$digest();
    });
});