# mGrid [![Build Status](https://travis-ci.org/kishanmundha/mGrid.svg?branch=master)](https://travis-ci.org/kishanmundha/mGrid) [![Coverage Status](https://codecov.io/gh/kishanmundha/mGrid/branch/master/graph/badge.svg)](https://codecov.io/gh/kishanmundha/mGrid)

#### Features
* support offline and online (ajax data) both
* Auto pagination
* Searching
* Sorting
* Column customization
* Custom cell template
* Custom cell formatting
* Export data
* Multiple view like grid, list or card. We can show grid in big screen and card in mobile screen.
* Made with angular directive

#### Dependency

**m-grid** have some dependency

* **progressCircular** directive
* **startFrom** filter (This filter is included in **m-grid** file

#### Uses

In html we simple can use `m-grid` as a html tag.

```html
<m-grid grid-options="gridOptions"></m-grid>
```

Now we need to define columns for grid in controller

```javascript
$scope.gridOptions = {
    columns: [{
        name: "column1",
        field: "column1"
    },{
        name: "column2",
        field: "column2"
    }]
}
```

Now grid is ready, but it's empty because we did't set any data to display. We can set data by below syntax.

```javascript
$scope.gridOptions.data = [] // an array
```

we can set any array data to `$scope.gridOptions.data`.