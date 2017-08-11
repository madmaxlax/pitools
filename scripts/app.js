/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />

//quick enhancement to add the length to objects, not just arrays
// Object.prototype._length = function () {
//   return Object.keys(this).length;
// };

(function () {
  var app = angular.module('myapp', ['ngResource', 'LocalStorageModule', 'yaru22.angular-timeago', 'ngMaterial']);
  app.config(['$httpProvider',
    function ($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      //$httpProvider.defaults.cache = true;
      //delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
  ]);
  app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      //.primaryPalette('yellow')
      //.accentPalette('deep-orange');
      .primaryPalette('yellow')
      .accentPalette('deep-orange');
  });


  app.controller('appController', ['$scope', '$http', '$resource', '$filter', 'localStorageService', '$mdSidenav', '$mdDialog', '$mdToast', function ($scope, $http, $resource, $filter, localStorageService, $mdSidenav, $mdDialog, $mdToast) {
    $scope.errors = [];
    $scope.data = {};
    $scope.data.returnedTags = [];
    $scope.clearErrors = function () {
      $scope.errors = [];
    };
    $scope.toggleLeft = function () {
      $mdSidenav('right').toggle();
    };

    $scope.savepreferences = function () {
      localStorageService.set('preferences', $scope.preferences);
      $mdToast.showSimple("Preferences saved!");
    };
    $scope.preferences = {};
    //if there are no preferences yet (new user)
    if (localStorageService.get('preferences') == null) {
      //defaults
      $scope.preferences.PIWebAPIURLBase = 'https://muntse-s-08817.europe.shell.com/piwebapi/';
      $scope.preferences.PIWebAPIServer = 'STCAPIColl';
      $scope.preferences.PIWEBAvailableServers = ['', 'STCAPIColl'];
      $scope.preferences.tagSearchAddStarAfter = true;
      $scope.preferences.tagSearchAddStarBefore = false;
      $scope.savepreferences();
    }
    else {
      $scope.preferences = localStorageService.get('preferences');
    }
    $scope.PIWebCalls = {};
    $scope.PIWebCalls.reformatArray = function reformatArray(arr) {
      var obj = arr.reduce(function (obj, item) {
        obj[item.Name] = item;
        return obj;
      }, {});
      return obj;
    };
    $scope.PIWebCalls.getAvailablePIServers = function () {
      $scope.PIWebCalls.GetPIServers.get({}, function (resp) {
        $scope.preferences.PIWEBAvailableServers = [];
        resp.Items.forEach(function (element) {
          $scope.preferences.PIWEBAvailableServers.push(element.Name);
        });
        // console.log('pi servers set');

      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting PI Server names": resp });
      });
    };
    $scope.setPIWebCalls = function () {
      $scope.PIWebCalls.TagSearch = $resource($scope.preferences.PIWebAPIURLBase + 'search/query?scope=pi::piserver&count=:max&q=(name::name)');
      $scope.PIWebCalls.TagValue = $resource($scope.preferences.PIWebAPIURLBase + "streams/:webid/value");
      //TagValueGroup= $resource($scope.preferences.PIWebAPIURLBase + "streamsets/value");
      $scope.PIWebCalls.TagRecordedValues = $resource($scope.preferences.PIWebAPIURLBase + "streams/:webid/recorded?maxCount=:max&startTime=*&endTime=*-5y");
      $scope.PIWebCalls.TagAttributes = $resource($scope.preferences.PIWebAPIURLBase + "points/:webid/attributes");
      $scope.PIWebCalls.TagAttributesDescriptor = $resource($scope.preferences.PIWebAPIURLBase + "points/:webid/attributes/descriptor");
      $scope.PIWebCalls.GetPIServers = $resource($scope.preferences.PIWebAPIURLBase + "dataservers");
      $scope.PIWebCalls.getAvailablePIServers();
    };
    $scope.setPIWebCalls();


    $scope.tagSearch = function () {
      if ($scope.preferences.tagSearchText.length > 2) {
        return $scope.PIWebCalls.TagSearch.get({
          name: ($scope.preferences.tagSearchAddStarBefore ? '*' : '') + $scope.preferences.tagSearchText.replace(" ", " AND name:") + ($scope.preferences.tagSearchAddStarAfter ? '*' : ''),
          max: 20,
          piserver: $scope.preferences.PIWebAPIServer,
        }).$promise.then(function (resp) {
          console.log(resp.Items);
          if (resp.Items.length > 0) {
            $scope.data.returnedTags = resp.Items;
            //if only 1 tag, get recent values
            if (resp.Items.length === 1) {
              $scope.getTagAttributes();
            }
          }
          else {
            $scope.data.returnedTags = [];
          }
          console.log('returning list', $scope.data.returnedTags);
          return $scope.data.returnedTags;
        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with PI tags search": resp });
        });
      }
      else {
        return [];
      }
    };

    $scope.testTags = ['P999Fic1','P999Fic2','P999Fic3','P999Fic4',]
  }]);
})();