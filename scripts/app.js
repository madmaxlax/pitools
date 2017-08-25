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

  app.factory("PIWebCalls", ['$resource', function PIWebCallsFactory($resource) {
    return {
      reformatArray: function reformatArray(arr) {
        var obj = arr.reduce(function (obj, item) {
          obj[item.Name] = item;
          return obj;
        }, {});
        return obj;
      },
      plantsCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/elements?searchFullHierarchy=true&templateName=Plant"),
      elementAttrValuesCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/:webid/value"),
      interfacesCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/elements/:webid/elements?templateName=Interface"),
      updateValueCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streams/:webid/value"),
      getValuesAdHocCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/value"),
      openIssuesEventFramesCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/eventframes?templateName=Issue&searchMode=InProgress&startTime=*-4w"),//default last 8 hours. added 4 weeks in case something is older
      recentIssuesEventFramesCall: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/eventframes?templateName=Issue"), //default last 8 hours. 
      getArchivedValues: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streams/:webid/recorded"),
      //TagSearch: $resource('https://muntse-s-08817.europe.shell.com/piwebapi/dataservers/s0Zwm3Ai1HVUiBciNvrmWsBQU1RDQVBJQ09MTA/points?namefilter=:name&maxCount=:max'),
      TagSearch: $resource('https://muntse-s-08817.europe.shell.com/piwebapi/search/query?scope=pi::piserver&count=:max&q=(name::name AND pointsource::pointsource)'),
      TagValue: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streams/:webid/value"),
      TagValueGroup: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/value"),
      TagRecordedValues: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streams/:webid/recorded?maxCount=:max&startTime=*&endTime=*-5y"),
      TagAttributes: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/points/:webid/attributes"),
      TagAttributesDescriptor: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/points/:webid/attributes/descriptor"),
    };
  }]);

  app.controller('appController', ['$scope', '$http', '$resource', '$filter', 'localStorageService', '$mdSidenav', '$mdDialog', '$mdToast', "PIWebCalls", function ($scope, $http, $resource, $filter, localStorageService, $mdSidenav, $mdDialog, $mdToast, PIWebCalls) {
    $scope.errors = [];
    $scope.data = {};
    $scope.data.returnedTags = [];
    $scope.currentPlantReportSettings = {};
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
      $scope.preferences = {
        plantSettings: {}
      };

      $scope.savepreferences();
    }
    else {
      $scope.preferences = localStorageService.get('preferences');
    }

    $scope.isLoading = false;
    $scope.startedLoading = function () {
      $scope.isLoading = true;
    };
    $scope.finishedLoading = function () {
      $scope.isLoading = false;
    };
    $scope.isUpdating = false;
    $scope.startedUpdating = function () {
      $scope.isUpdating = true;
    };
    $scope.finishedUpdating = function () {
      $scope.isUpdating = false;
    };



    $scope.data.plants = [];
    //function to refresh the plant list
    $scope.getPlants = function () {
      //get the list of plants 
      $scope.startedUpdating();
      PIWebCalls.plantsCall.get({}, function (resp) {
        //console.log(resp);
        $scope.data.plants = resp.Items;
        $scope.data.plantsAsNames = PIWebCalls.reformatArray(resp.Items);
        $scope.data.selectedPlant.Name = "";
        $scope.finishedUpdating();
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting plants": resp });
        $scope.finishedUpdating();
      });
    };
    //now call it for the initial setup
    $scope.getPlants();

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
    
    //when a plant is selected
    $scope.getPlantData = function () {
      //check that an actual plant was selected
      if ($scope.data.selectedPlant != null && $scope.data.selectedPlant.both != null) {
        //retrieve preferences for that plant
        if ($scope.preferences.plantSettings[$scope.data.selectedPlant.Name] != null)//there are already preferences for that plant ID
        {
          $scope.currentPlantReportSettings = $scope.preferences.plantSettings[$scope.data.selectedPlant.Name];
        }

      }
    };


    

    $scope.testTags = ['P999Fic1', 'P999Fic2', 'P999Fic3', 'P999Fic4',]
  }]);
})();