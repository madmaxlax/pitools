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
      .primaryPalette('amber')
      .accentPalette('deep-orange');
  });
  app.filter('keyLength', function () {
    return function (input) {
      if (!angular.isObject(input)) {
        return;
      }
      return Object.keys(input).length;
    };
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
  app.directive('tagWriterCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/tagWriter.html'
    };
  });
  app.directive('reportSettingsCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/reportsettings.html'
    };
  });
  app.directive('pointRetrievalMethodCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/pointretrievalmethod.html'
    };
  });
  app.directive('experimentAndPeriodNumbersCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/experimentandperiodnumbers.html'
    };
  });
  app.directive('tagSelectCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/tagselect.html'
    };
  });
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
      $scope.preferences.plantSettings[$scope.data.selectedPlant.both.Name] = $scope.currentPlantReportSettings;
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
        $scope.finishedUpdating();
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting plants": resp });
        $scope.finishedUpdating();
      });

      //if a tag is already selected
      $scope.preferences.plantSearchText = $scope.preferences.plantSearchText;
    };
    //now call it for the initial setup
    $scope.getPlants();


    //when a plant is selected
    $scope.getPlantData = function () {
      //check that an actual plant was selected
      if ($scope.data.selectedPlant != null && $scope.data.selectedPlant.both != null) {
        //retrieve preferences for that plant
        if ($scope.preferences.plantSettings[$scope.getCurrentPlantID()] != null)//there are already preferences for that plant ID
        {
          $scope.currentPlantReportSettings = $scope.preferences.plantSettings[$scope.getCurrentPlantID()];
        }
        else {
          $mdToast.showSimple("You don't have any settings saved for this plant yet");
        }
        $scope.newTagSearch();

      }
    };

    $scope.getCurrentPlantID = function () {
      if ($scope.data.selectedPlant != null && $scope.data.selectedPlant.both != null) {
        return $scope.data.selectedPlant.both.Name.replace('Plant ID ', '')
      }
      else {
        return "NoPlant";
      }
    };

    $scope.newTagSearch = function () {
      $scope.data.tags = null;
      $scope.data.selectedTag = null;
      //make sure the value exists (sometimes doesnt with new users)
      if ($scope.data.selectedPlant != null) {
        PIWebCalls.TagSearch.get({
          name: $scope.getCurrentPlantID() + '*',
          max: 5000, //should cover most plants
          piserver: 'STCAPIColl',
          pointsource: '*'
        }, function (resp) {
          //console.log(resp);
          $scope.data.tags = resp.Items;
          if ($scope.data.selectedTag == null) {
            if ($filter('filter')($scope.data.tags, "RunHour") != null) {
              $scope.data.selectedTag = $filter('filter')($scope.data.tags, $scope.getCurrentPlantID() + "RunHour")[0];
              $scope.getTagValue();
            }
          }
        });
      }
    };

    $scope.getTagValue = function () {
      $scope.preferences.tagWriterNewTagSearch = "";
      PIWebCalls.TagValue.get({
        webid: $scope.data.selectedTag.WebID
      }, function (valresp) {
        $scope.data.selectedTag.curVal = valresp;
      });
    };

    $scope.updateTagValue = function () {
      PIWebCalls.updateValueCall.save({ webid: $scope.data.selectedTag.WebID },
        {
          "Timestamp": "*",
          "Value": $scope.data.selectedTag.newValue,
          "Good": "true",
          "Questionable": "false"
        },
        function (resp) {
          $mdToast.showSimple("Value saved!");
          $scope.getTagValue();
        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with updating values": resp });
        });
    };

    $scope.testTags = ['P999Fic1', 'P999Fic2', 'P999Fic3', 'P999Fic4'];

    $scope.generateReports = function () {
      $scope.generatedReports = [];
      $scope.generatedReports.push({});
      $scope.generatedReports.push({});
      $scope.generatedReports.push({});
      $scope.generatedReports.push({});
    };
  }]);
})();