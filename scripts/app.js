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
      reformatArray: function reformatArray(arr, keyName) {
        //default parameter
        keyName = (typeof keyName !== 'undefined') ? keyName : 'Name';
        var obj = arr.reduce(function (obj, item) {
          obj[item[keyName]] = item;
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
      CalculatedValues: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/summary"),
      SampledValues: $resource("https://muntse-s-08817.europe.shell.com/piwebapi/streamsets/interpolated"), //can get a set intervals
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

    $scope.savepreferences = function (showToast) {
      if ($scope.data.selectedPlant != null && $scope.preferences.plantSettings != null && $scope.preferences.plantSettings[$scope.getCurrentPlantID()] != null) {
        $scope.preferences.plantSettings[$scope.getCurrentPlantID()].plantReportSettings = $scope.currentPlantReportSettings;
      }
      localStorageService.set('preferences', $scope.preferences);
      if (showToast == null || showToast === true) {
        $mdToast.showSimple("Preferences saved!");
      }
    };

    $scope.preferences = {};
    //if there are no preferences yet (new user)
    if (localStorageService.get('preferences') == null) {
      //defaults
      $scope.preferences = {
        plantSettings: {}
      };

      $scope.savepreferences(false);
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
        //if a tag is already selectedan restored from the prefs
        if ($scope.preferences.plantSearchText != null) {
          if ($filter('filter')($scope.data.plants, { Name: $scope.preferences.plantSearchText }).length === 1) {
            //do the same as the autocomplete search and set the current plant if the search finds 1
            $scope.data.selectedPlant.both = $filter('filter')($scope.data.plants, { Name: $scope.preferences.plantSearchText })[0];
          }
        }
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting plants": resp });
        $scope.finishedUpdating();
      });


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
          $scope.currentPlantReportSettings = $scope.preferences.plantSettings[$scope.getCurrentPlantID()].plantReportSettings;
          $mdToast.showSimple("Restoring your locally saved settings for this plant");
        }
        else {
          $mdToast.showSimple("You don't have any settings saved for this plant yet");
          $scope.preferences.plantSettings[$scope.getCurrentPlantID()] = {};
        }
        $scope.newTagSearch();

      }
    };

    $scope.getCurrentPlantID = function () {
      if ($scope.data.selectedPlant != null && $scope.data.selectedPlant.both != null) {
        return $scope.data.selectedPlant.both.Name.replace('Plant ID ', '');
      }
      else {
        return "NoPlant";
      }
    };

    $scope.changeTagWriterTag = function () {
      $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag = null;
      //The timeout is needed to make sure that the autocomplete component is rendered at the time of calling focus.
      setTimeout(function () {
        angular.element('#search-input-tags').focus();
      }, 0);
    };


    $scope.newTagSearch = function () {
      $scope.data.tags = null;
      $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag = null;
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
          if ($scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag == null) {
            if ($filter('filter')($scope.data.tags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false) !== 0) {
              $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag = $filter('filter')($scope.data.tags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false)[0];
              $scope.getTagValue();
            }
          }
        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with searching for tags": resp });
        });
      }
    };

    $scope.getTagValue = function () {
      $scope.preferences.tagWriterNewTagSearch = "";
      if ($scope.preferences.plantSettings != null && $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag != null) {
        PIWebCalls.TagValue.get({
          webid: $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag.WebID
        }, function (valresp) {
          $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag.curVal = valresp;
        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with getting values": resp });
        });
      }
    };

    //for tagWriter, stores a new value to the specified PI tag
    $scope.updateTagValue = function () {
      PIWebCalls.updateValueCall.save({ webid: $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag.WebID },
        {
          "Timestamp": "*",
          "Value": $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag.newValue,
          "Good": "true",
          "Questionable": "false"
        },
        function (resp) {
          $mdToast.showSimple("Value saved! " + $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag.Name + " Set to " + resp.Value);
          $scope.getTagValue();
        }, function (resp) {
          //there was an error
          $scope.errors.push({ "Error with updating values": resp });
        });
    };

    //needed for virtual repeater
    $scope.virtualTagsList = {
      getItemAtIndex: function (index) {
        if ($scope.data && $scope.data.tags && $scope.data.tags.length) {
          // | filter:{Name:selectTagsFiltertext}
          //$filter('filter')($scope.data.plants, { Name: $scope.preferences.plantSearchText }).length
          return $filter('filter')($scope.data.tags, { Name: $scope.selectTagsFiltertext })[index];
        }
        else return null;

      },
      getLength: function () {
        if ($scope.data && $scope.data.tags) {
          // | filter:{Name:selectTagsFiltertext}
          return $filter('filter')($scope.data.tags, { Name: $scope.selectTagsFiltertext }).length;
        }
        else return 0;
      }
    };

    /**
     *function that goes through and selects or clears all (filtered) tags 
     * 
     * @param {boolean} select 
     * @param {boolean} useFilter 
     */
    $scope.selectAllTags = function (select, useFilter) {
      if (useFilter) {
        angular.forEach($filter('filter')($scope.data.tags, { Name: $scope.selectTagsFiltertext }), function (tag, index) {
          tag.selected = (select ? true : false);
        });
      }
      else {
        $scope.data.tags.forEach(function (tag, index) {
          tag.selected = (select ? true : false);
        });
      }
    };


    //function that actually generates the reports
    $scope.generateReports = function () {
      $scope.currentPlantReportSettings.generatedReports = [];
      var newReport = { tags: [], webIDs: [] };
      var filename = $scope.getCurrentFileName();
      var csvFile = 'Report number \nDATACOL\tsecondcolumn\n' +
        'col1\tcol2\col3\n' +
        '1\t2\t3\n' +
        '\n***PERIOD A0000011\nPLANT 0266 PERIOD A0000011  RUNLIST REPORT        EXPERIMENT NR 22\n' +
        'Tagnames\tSI-Units\tMinimum\tMaximum\tAverage\tDeviation\tFirstval\tLastval\n';

      //add the selected tags to the report tags list
      $scope.data.tags.forEach(function (tag, index) {
        if (tag.selected) {
          newReport.tags.push(tag);
          newReport.webIDs.push(tag.WebID);
        }
      });
      var reportStartTime = '*-1h';
      var reportEndTime = '*';

      //get the calculated values
      PIWebCalls.CalculatedValues.get({
        webid: newReport.webIDs,
        startTime: reportStartTime,
        endTime: reportEndTime,
        summaryType: ['Average', 'Minimum', 'Maximum', 'StdDev']
      }, function (resp) {
        console.log(resp);
        newReport.summaryData = PIWebCalls.reformatArray(resp.Items, 'WebId');
       
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting calculated data for tags": resp });
      });

      //get the first and last values
      PIWebCalls.SampledValues.get({
        webid: newReport.webIDs,
        startTime: reportStartTime,
        endTime: reportEndTime
      }, function (resp) {
        console.log(resp);
        newReport.sampledData = PIWebCalls.reformatArray(resp.Items, 'WebId');
        //this needs to be moved
        newReport.tags.forEach(function (tag, index) {
          csvFile += tag.Name + '\t' + (tag.UoM === undefined ? '' : tag.UoM) + '\t' +
            $scope.getPrintableValue(newReport.summaryData, tag.WebID, 1) + '\t' +//minimum
            $scope.getPrintableValue(newReport.summaryData, tag.WebID, 2) + '\t' +//maximum
            $scope.getPrintableValue(newReport.summaryData, tag.WebID, 0) + '\t' +//average
            $scope.getPrintableValue(newReport.summaryData, tag.WebID, 3) + '\t' +//std
            $scope.getPrintableValue(newReport.sampledData, tag.WebID, 0) + '\t' +//firstval
            $scope.getPrintableValue(newReport.sampledData, tag.WebID, 1) +//lastval
            '\n';
        });
        newReport.csvFile = csvFile;
        $scope.currentPlantReportSettings.generatedReports.push(newReport);
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting calculated data for tags": resp });
      });

    };

    $scope.setUpCSVFile = function(){
      
    }

    $scope.getPrintableValue = function (webIDArray, webID, index) {
      var Value = webIDArray[webID].Items[index].Value;
      if (Value.Value != null && typeof Value.Value === 'number') {
        //return the value to 4 decimal places
        return $filter('number')(Value.Value, 4);
      }
      else
        return '0.0000';
    }

    $scope.getCurrentFileName = function () {
      return ($scope.currentPlantReportSettings.reportFileNameWithExpPerNums ? '[exp#]-[per#]' : 'plant[currentplant]') + ($scope.currentPlantReportSettings.reportType === 'hydra' ? '.nox' : '.R02');
    }

    //function to force the download of the file
    //from Jossef Harush https://jsfiddle.net/jossef/m3rrLzk0/ from https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    $scope.openReport = function (reportNumber) {
      var csvFile = $scope.currentPlantReportSettings.generatedReports[reportNumber].csvFile;
      var filename = $scope.getCurrentFileName();
      var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
      //IE allows direct saving
      if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
      } else {//create an invisible link to a 'blob' of the report, and 'click' it to download it
        var url = URL.createObjectURL(blob);
        // Browsers that support HTML5 download attribute
        var link = document.createElement("a");
        link.style.visibility = 'hidden';
        if (link.download !== undefined) { // feature detection
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
        }
        else {
          window.open(url, "_blank");
        }
        document.body.removeChild(link);
      }
    };
  }]);
})();