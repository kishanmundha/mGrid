(function () {
    'use strict';

    var app = angular.module('mGrid');

    app.directive('mGrid', ['$log', '$filter', '$compile', '$rootScope', '$http', '$timeout', function ($log, $filter, $compile, $rootScope, $http, $timeout) {
        /* jshint laxbreak: true */
        return {
            scope: {
                gridOptions: '=',
                ajaxEnabled: '=',
                countUrl: '@',
                gridDataUrl: '@',
                urlParam: '='
            },
            replace: true,
            template:
            '<div>'
            + '</div>',
            link: function ($scope, element, attr) {

                // Handle undefined gridOptions
                if(!$scope.gridOptions)
                    throw new Error('mGrid must configure gridOptions and there columns');

                // options for ajax loading data
                $scope.gridData = {
                    data: [], // data
                    total: 0, // total record
                    loading: false, // is we are fetching data from xhr request
                    loadingFull: false, // only fetching a page. We show a small loding image in side of pagination control if we are not loading full
                    firstLoaded: false
                };

                // pagination option
                $scope.startFrom = 0;
                $scope.currentPage = 1;
                $scope.displayLimit = 10;

                // enable watch in value change event after once fully init
                var enableWatchEvent = false;

                // store old url param to compare with new object
                // angular fire $watch event when some refrence
                // change but no value change
                // we need to refresh only if url param change
                var oldUrlParam = JSON.stringify($scope.urlParam);

                // refresh data on url parameters change from outside
                $scope.$watch('urlParam', function (value) {
                    $log.debug(value);

                    if (enableWatchEvent && oldUrlParam !== JSON.stringify($scope.urlParam)) {
                        oldUrlParam = JSON.stringify($scope.urlParam);
                        refreshAjaxData();
                    }
                });

                var searchTimer;

                $scope.$on('globalSearch', function (event, value) {

                    $timeout.cancel(searchTimer);

                    // search on finish typing
                    searchTimer = $timeout(function () {
                        if ($scope.search !== value) {
                            $scope.search = value;
                            refreshAjaxData();
                        }
                    }, 500);
                });

                // set columnsDefs in columns when columns not passed
                // supporting to old angular-ui grid
                // that grid using column in columnDefs
                if ($scope.gridOptions.columns === undefined) {
                    $scope.gridOptions.columns = $scope.gridOptions.columnDefs;
                }

                if (!$scope.gridOptions.viewOptions)
                    $scope.gridOptions.viewOptions = {};

                var viewOptions = $scope.gridOptions.viewOptions;

                // list, card, table -- for technical word
                // list, grid, table-list -- for ui word
                var availableMode = [];

                /*
                 * table mode always available and it is default mode if not passed
                 * 
                 * 
                 */

                availableMode.push('table');

                if ($scope.gridOptions.cardTemplate)
                    availableMode.push('card');

                if ($scope.gridOptions.listTemplate)
                    availableMode.push('list');

                var defaultMode, currentMode, currentMedia;

                if (!viewOptions.defaultMode)
                    viewOptions.defaultMode = 'table';

                defaultMode = viewOptions.defaultMode;

                if (!viewOptions.currentMode)
                    viewOptions.currentMode = 'table';

                currentMode = viewOptions.currentMode;

                if (!$scope.gridOptions.viewOptions.media)
                    $scope.gridOptions.viewOptions.media = {};

                var media = viewOptions.media;

                if (!media.xs) {
                    media.xs = {
                        defaultMode: defaultMode,
                        currentMode: currentMode,
                        availableMode: angular.copy(availableMode)
                    };
                }
                if (!media.sm) {
                    media.sm = {
                        defaultMode: defaultMode,
                        currentMode: currentMode,
                        availableMode: angular.copy(availableMode)
                    };
                }
                if (!media.md) {
                    media.md = {
                        defaultMode: defaultMode,
                        currentMode: currentMode,
                        availableMode: angular.copy(availableMode)
                    };
                }
                if (!media.lg) {
                    media.lg = {
                        defaultMode: defaultMode,
                        currentMode: currentMode,
                        availableMode: angular.copy(availableMode)
                    };
                }

                $scope.gridOptions.viewOptions = $scope.gridOptions.viewOptions || {};

                var windowResized = function () {
                    $log.debug('window.resize event fire');

                    var windowWidth = $(window).width();

                    var _currentMedia = 'xs';

                    if (windowWidth >= 768)
                        _currentMedia = 'sm';

                    if (windowWidth >= 992)
                        _currentMedia = 'md';

                    if (windowWidth >= 1200)
                        _currentMedia = 'lg';

                    $scope.gridOptions.viewOptions.currentMedia = currentMedia = _currentMedia;
                    $scope.gridOptions.viewOptions.currentMode = media[_currentMedia].currentMode;

                    forceApply();
                };

                var forceApplyPromise;

                var forceApply = function () {

                    if (forceApplyPromise !== undefined)
                        return;

                    forceApplyPromise = $timeout(function () {
                        forceApplyPromise = undefined;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        } else {
                            forceApply();
                        }
                    }, 500);
                };

                $(window).resize(windowResized);

                windowResized();

                $scope.$on('$destroy', function () {
                    $log.debug("destroy mGrid");
                    $(window).off('resize', windowResized);

                    if (forceApplyPromise) {
                        $timeout.cancel(forceApplyPromise);
                    }
                });

                /////////////////////////////

                // compile html
                (function () {
                    var html = '';

                    if ($scope.gridOptions.cardTemplate) {
                        html += '<div ng-if="gridOptions.viewOptions.currentMode==\'card\'" style="padding-top:' + ($scope.gridOptions.cardTemplatePadTop || 0) + 'px;">';

                        html += '<div ng-repeat="item in getData()" class="' + ($scope.gridOptions.cardTemplateCss || '') + '">'
                            + $scope.gridOptions.cardTemplate
                            + '</div>';

                        html += '<div class="clearfix"></div>';
                        html += '</div>';

                        //element.removeAttr("class");

                        $log.debug('bmfGrid -> attr => ', attr);
                    } // else {
                    if ($scope.gridOptions.listTemplate) {
                        html += '<div ng-if="gridOptions.viewOptions.currentMode==\'list\'" class="list-group">';

                        html += '<div ng-repeat="item in getData()" class="list-group-item">'
                            + $scope.gridOptions.listTemplate
                            + '</div>';

                        html += '</div>';
                    }
                    {
                        html += '<div style="overflow-x:auto;width: 100%;" ng-if="gridOptions.viewOptions.currentMode==\'table\'">'
                            + '<table class="table table-striped">'
                            + '<thead>'
                            + '<tr>'
                            + '<th ng-repeat="column in ::gridOptions.columns" ng-if="!column.exportOnly" style="text-transform: capitalize" ng-style="{\'width\':column.width||\'auto\',\'min-width\':column.minWidth||\'auto\',\'text-align\':column.textAlign||\'left\',\'display\':(column.visible!==false?\'table-cell\':\'none\')}">'
                            + '<a href="" ng-click="order(column.field, (column.sorting !== undefined ? column.sorting : gridOptions.sorting))" ng-bind="column.name" style="cursor:pointer; color:black; text-decoration:none;">Name</a>'
                            + '<span class="sortorder" ng-show="predicate === column.field" ng-class="{reverse:reverse}"></span>'
                            + '</th>'
                            + '</tr>'
                            + '<tbody ng-hide="gridData.loading && gridData.loadingFull">'
                            + '<tr ng-repeat="item in getData()">'  // get data from function it will return conditional data
                            ;

                        angular.forEach($scope.gridOptions.columns, function (item) {

                            var cellTemplate = '<td ng-if="' + (!item.exportOnly) + '" ng-style="{\'text-align\':\'' + (item.textAlign || 'left') + '\',\'display\':' + (item.visible !== false ? '\'table-cell\'' : '\'none\'') + '}">';

                            cellTemplate += (!item.cellTemplate ?
                                '<span ng-bind="::item[\'' + item.field + '\']' + (item.format ? ' | ' + item.format : '') + '"></span>'
                                : '<div ng-init="row={\'entity\':item}">' + item.cellTemplate + '</div>'
                            );

                            cellTemplate += '</td>';

                            html += cellTemplate;
                        });

                        html += ''
                            + '</tr>'
                            ;

                        html += ''
                            + '</tbody>'
                            + '</thead>'
                            + '</table>'
                            + '</div>'
                            ;
                    }


                    html += '<div ng-show="getRecordCount() == 0 && (!ajaxEnabled || gridData.firstLoaded) && !gridData.loading" style="text-align:center; margin: 20px auto 10px;"><h3>No record found</h3></div>'
                        + '<div ng-show="ajaxEnabled && ((gridData.loading && gridData.loadingFull) || !gridData.firstLoaded)" style="text-align:center; margin: 20px auto 10px;"><progress-circular></progress-circular></div>'
                        //+ '<hr />'
                        + '<div ng-hide="getRecordCount() == 0" class="panel-footer" style="">'
                        + '<uib-pagination class="pagination-sm pull-left" style="margin: 0px;" direction-links="false" total-items="getRecordCount()" max-size="3" boundary-links="true" ng-model="currentPage" items-per-page="displayLimit" rotate="false" ng-change="currentPageChange()"></uib-pagination>'
                        + '<div class="pull-left" style=" margin-left: 10px;">'
                        + '<select class="form-control input-sm hidden-xs" style="display:inline-block; width: 70px; height: 29px;" type="text" ng-model="displayLimit" ng-options="o.value as o.text for o in displayLimitOptions"></select>'
                        + '<span class="hidden-xs"> items per page</span>'
                        + '<span ng-if="gridData.loading && !gridData.loadingFull && gridData.firstLoaded" style="display:inline-block; vertical-align: middle; margin-left: 10px; height:22px;">'
                        + '<progress-circular size="sm"></progress-circular>'
                        + '</span>'
                        + '</div>'
                        + '<div class="pull-right hidden-xs" ng-bind="getStatusString()" style="margin-top:5px;"></div>'
                        + '<div class="clearfix"></div>'
                        + '</div>';

                    element.append(html);

                    //$log.debug('compile mGrid html =>', html);

                    $compile(element.contents())($scope);
                })();

                /////////////////////////////////////

                // make a external scope
                // it will retrun a `state` obejct from `$parent` scope
                $scope.getExternalScopes = function () {
                    return $scope.$parent.states || {};
                };

                /**********************************************
                 * Ajax methods
                 *********************************************/

                var getAjaxDataUrl = function (skip, take) {

                    if (skip === undefined)
                        skip = $scope.startFrom;

                    if (take === undefined)
                        take = $scope.displayLimit;

                    var gridDataUrl = $scope.gridDataUrl;

                    gridDataUrl = gridDataUrl.replace('{skip}', skip);
                    gridDataUrl = gridDataUrl.replace('{take}', take);
                    gridDataUrl = gridDataUrl.replace('{page}', $scope.currentPage);
                    gridDataUrl = gridDataUrl.replace('{limit}', take);

                    gridDataUrl = gridDataUrl.replace('{term}', $scope.search || '');

                    var orderBy = '';
                    if ($scope.predicate) {
                        orderBy = ($scope.reverse ? '-' : '') + $scope.predicate;
                    }

                    gridDataUrl = gridDataUrl.replace('{orderBy}', orderBy);

                    if ($scope.urlParam && angular.isObject($scope.urlParam)) {
                        for (var key in $scope.urlParam) {
                            gridDataUrl = gridDataUrl.replace('{' + key + '}', $scope.urlParam[key]);
                        }
                    }

                    return gridDataUrl;
                };

                var getAjaxDataCountUrl = function () {
                    var countUrl = $scope.countUrl;
                    countUrl = countUrl.replace('{term}', $scope.search || '');

                    var orderBy = '';
                    if ($scope.predicate) {
                        orderBy = ($scope.reverse ? '-' : '') + $scope.predicate;
                    }

                    countUrl = countUrl.replace('{orderBy}', orderBy);
                    if ($scope.urlParam && angular.isObject($scope.urlParam)) {
                        for (var key in $scope.urlParam) {
                            countUrl = countUrl.replace('{' + key + '}', $scope.urlParam[key]);
                        }
                    }

                    return countUrl;
                };

                // get data from ajax request
                var getAjaxPageData = function () {

                    if ($scope.ajaxEnabled !== true)
                        return;

                    $log.debug('bmfGrid.getAjaxPageData called');

                    $scope.gridData.loading = true;

                    var gridDataUrl = getAjaxDataUrl();

                    $http.get(gridDataUrl).success(function (response) {

                        $scope.gridData.data
                            = $scope.gridOptions.data
                            = response;

                        $scope.gridData.loading = false;
                        $scope.gridData.firstLoaded = true;
                    }).error(function (error) {
                        $scope.gridData.loading = false;
                        $scope.gridData.firstLoaded = true;
                    });
                };

                // refresh full list when using ajax
                var refreshAjaxData = function () {

                    if ($scope.ajaxEnabled !== true)
                        return;

                    $log.debug('bmfGrid.refreshAjaxData called');

                    $scope.gridData.loadingFull = true;
                    var countUrl = getAjaxDataCountUrl();

                    $scope.gridData.loading = true;

                    $http.get(countUrl).success(function (response) {
                        $log.debug(response);
                        $scope.gridData.total = response;

                        getAjaxPageData();
                    }).error(function (error) {
                        $scope.gridData.loading = false;
                        $log.debug(error);
                    });
                };

                var oldDisplayLimit = $scope.displayLimit;

                $scope.$watch('displayLimit', function () {
                    $scope.gridData.loadingFull = false;

                    if (enableWatchEvent && oldDisplayLimit !== $scope.displayLimit) {
                        oldDisplayLimit = $scope.displayLimit;
                        getAjaxPageData();
                    }
                });

                $scope.displayLimitOptions = [
                    { "text": 10, "value": 10 },
                    { "text": 20, "value": 20 },
                    { "text": 50, "value": 50 },
                    { "text": 100, "value": 100 }
                ];

                $scope.currentPageChange = function () {
                    $scope.startFrom = ($scope.currentPage - 1) * $scope.displayLimit;

                    $scope.gridData.loadingFull = false;

                    if (enableWatchEvent) {
                        getAjaxPageData($scope.currentPage);
                    }
                };

                $scope.getStatusString = function () {
                    // 1 - 10 of 327 items
                    var len = $scope.getRecordCount();

                    return ($scope.startFrom + 1) + " - " + Math.min(($scope.startFrom + $scope.displayLimit), len) + " of " + len + " items";
                };

                $scope.predicate = '';
                $scope.reverse = false;
                $scope.order = function (predicate, sorting) {
                    if (!sorting)
                        return;
                    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
                    $scope.predicate = predicate;

                    $scope.currentPage = 1;
                    $scope.currentPageChange();
                };

                // get conditionaly apge count
                $scope.getRecordCount = function () {
                    var count = 0;
                    if ($scope.ajaxEnabled) {
                        count = $scope.gridData.total;
                    } else {
                        count = _getFilteredData().length;
                    }
                    //return $scope.ajaxEnabled === true ? $scope.gridData.total : $scope.gridOptions.length;

                    return count;
                };

                // get conditionaly data
                $scope.getData = function () {
                    var data = [];
                    if ($scope.ajaxEnabled) {
                        data = $scope.gridData.data || [];
                    } else {
                        data =
                            $filter('limitTo')(
                                $filter('startFrom')(_getFilteredData(), $scope.startFrom), // | orderBy:predicate:reverse | filter:search | startFrom: startFrom | limitTo: displayLimit"
                                $scope.displayLimit
                            );
                    }

                    //$log.debug('data => ', data);

                    return data;
                };

                // inner function for `getRecordCount` and `getData`
                var _getFilteredData = function () {
                    var data =
                        $filter('filter')(
                            $filter('orderBy')($scope.gridOptions.data || [], $scope.predicate, $scope.reverse), // | orderBy:predicate:reverse | filter:search | startFrom: startFrom | limitTo: displayLimit"
                            $scope.search
                        );

                    //$log.debug(data);

                    return data;
                };

                // set default order by
                if ($scope.gridOptions.defaultSorting) {
                    var _fieldname = $scope.gridOptions.defaultSorting;

                    if (_fieldname.indexOf("-") === 0) { // reverse sorting
                        _fieldname = _fieldname.substring(1);
                        $scope.predicate = _fieldname;
                    }

                    $scope.order(_fieldname, true);
                }

                /**
                 * @public
                 * 
                 * @description Export function to export data to grid
                 */
                var exportGrid = function () {
                    var data = [];
                    if ($scope.ajaxEnabled) {
                        data = $scope.gridData.data || [];

                        var url = getAjaxDataUrl(0, $scope.gridData.total);

                        $http.get(url).success(function (response) {

                            data = response;
                            _export(data);
                        }).error(function (error) {
                            $scope.gridData.loading = false;
                            $log.debug(error);
                        });
                    }
                    else {
                        data = _getFilteredData();

                        _export(data);
                    }
                };

                // export data to excel
                // from json data
                var _export = function (data) {
                    /*
                     * Get all data first
                     *
                     * 1. custom template defined
                     * 2. default template
                     * 3. default with custom some field
    
                     * Header
                     * 1. Include or not
                     * 2. Header weight
                     */

                    var html = '<html><body><table>';

                    var columns = $scope.gridOptions.columns;

                    // make header
                    html += '<thead><tr>';

                    html += columns.map(function (item) {
                        if (item.noexport)
                            return '';
                        return '<th>' + (item.name || '') + '</th>';
                    }).join('');

                    html += '</tr></thead>';

                    // for loop for rows
                    // for loop for columns inside rows

                    html += '<tbody>';

                    data.forEach(function (row) {
                        html += '<tr>';

                        columns.forEach(function (item) {
                            if (item.noexport)
                                return;

                            html += '<td>';
                            html += (row[item.field] || '');
                            html += '</td>';
                        });

                        html += '</tr>';
                    });

                    html += '</tbody>';

                    html += '</table></body></html>';

                    $log.debug('mGrid.export->html => ', html);

                    // base 64 not work for non ansi words
                    // so we will use BLOB
                    //var base64data = "base64," + btoa(html);
                    //var url = 'data:application/vnd.ms-excel;filename=exportData.xls;' + base64data;
                    //$log.debug(url);

                    var url = URL.createObjectURL(new Blob([html] , {type:'application/vnd.ms-excel'}));

                    var a = document.createElement('a');
                    a.href = url;
                    a.download = ($scope.gridOptions.exportFileName || "exportData") + ".xls";
                    a.click();
                };

                $scope.gridOptions.export = exportGrid;

                // finally update data if data from ajax request
                if ($scope.ajaxEnabled) {
                    refreshAjaxData();
                }

                enableWatchEvent = true;
            }
        };
    }]);

})();
