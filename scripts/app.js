/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />


(function () {
  //set up the angular app
  var app = angular.module('myapp', ['ngResource', 'LocalStorageModule', 'yaru22.angular-timeago', 'ngMaterial']);

  //set up any http requests to pass along windwos
  app.config(['$httpProvider',
    function ($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      //$httpProvider.defaults.cache = true;
      //delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
  ]);

  //choosing the colors 
  app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      //.primaryPalette('yellow')
      //.accentPalette('deep-orange');
      .primaryPalette('amber')
      .accentPalette('deep-orange');
  });

  //custom filter to get the object key length 
  app.filter('keyLength', function () {
    return function (input) {
      if (!angular.isObject(input)) {
        return;
      }
      return Object.keys(input).length;
    };
  });

  //a custom set of web calls for calling certain PI Web API functions
  app.factory("PIWebCalls", ['$resource', function PIWebCallsFactory($resource) {
    return {
      //small helper function for reformatting PI Web API arrays into a key-value object
      reformatArray: function reformatArray(arr, keyName) {
        //default parameter keyName
        keyName = (typeof keyName !== 'undefined') ? keyName : 'Name';

        var obj = arr.reduce(function (obj, item) {
          obj[item[keyName]] = item;
          return obj;
        }, {});
        return obj;
      },

      //all the web calls, set up as an angular $resource
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

  //various directives for the different cards in the web app
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

  //this is the main controller and it is actually used for the whole app to keep things simpler and on one $scope
  app.controller('appController', ['$scope', '$http', '$resource', '$filter', 'localStorageService', '$mdSidenav', '$mdDialog', '$mdToast', "PIWebCalls", function ($scope, $http, $resource, $filter, localStorageService, $mdSidenav, $mdDialog, $mdToast, PIWebCalls) {
    //globally available array of errors, to be pushed to and displayed as they arise
    $scope.errors = [];
    //global variable for data, set up initially as an object as angular $scope handles this better
    $scope.data = {};
    //global var for the settings of the currently selected plant
    $scope.currentPlantReportSettings = {};
    //global var for the user preferences 
    $scope.preferences = {};
    //global bool var for whether or not the app is loading anything (for loading spinners)
    $scope.isLoading = false;
    //extra global bool var for whether or not the app is loading anything (for loading spinners)
    $scope.isUpdating = false;
    //previous plant for saving settings and working with multiple plants
    $scope.previousPlant;

    //function to clear any current errors (when the user clicks the x on the errors display)
    $scope.clearErrors = function () {
      $scope.errors = [];
    };

    //function to open/close the right panel that contains the preferences (when the user clicks the settings icon on narrower screens)
    $scope.toggleLeft = function () {
      $mdSidenav('right').toggle();
    };

    //funciton to save the current prefernces to local storage
    //param showToast is a bool, whether or not to show a toast message when the prefs have been saved
    $scope.savePreferences = function (showToast) {
      if ($scope.data.selectedPlant != null && $scope.preferences.plantSettings != null && $scope.preferences.plantSettings[$scope.getCurrentPlantID()] != null) {
        $scope.preferences.plantSettings[$scope.getCurrentPlantID()].plantReportSettings = $scope.currentPlantReportSettings;
      }
      localStorageService.set('preferences', $scope.preferences);
      if (showToast == null || showToast === true) {
        $mdToast.showSimple("Preferences saved!");
      }
    };
    /**
     * For troubleshooting
     * function that deletes the preferences for the currently selected plant
     */
    $scope.deletePlantPrefernces = function () {
      $scope.preferences.plantSettings.remove($scope.getCurrentPlantID());
      $scope.savePreferences(false);
      window.location.reload(true);
    };
    /**
     * 
     * 
     */
    $scope.deleteAllPreferences = function () {
      localStorageService.clearAll();
      window.location.reload(true)
    };

    //check for local storage saved prefs
    //if there are no preferences saved yet on local storage (new user)
    //set them up to defaults
    if (localStorageService.get('preferences') == null) {
      //defaults
      $scope.preferences = {
        plantSettings: {}
      };
      //and save the defaults to the local storage
      $scope.savePreferences(false);
    }
    else {//grab them from local storage
      $scope.preferences = localStorageService.get('preferences');
    }

    //helper functions to set the loading status (and change the spinners)
    $scope.startedLoading = function () {
      $scope.isLoading = true;
    };
    $scope.finishedLoading = function () {
      $scope.isLoading = false;
    };
    $scope.startedUpdating = function () {
      $scope.isUpdating = true;
    };
    $scope.finishedUpdating = function () {
      $scope.isUpdating = false;
    };


    //global var with all the plants as set up in AF
    $scope.data.plants = [];

    //function to refresh the list of plants from AF, and populated in the global var
    $scope.getPlants = function () {
      //get the list of plants 
      $scope.startedUpdating();
      PIWebCalls.plantsCall.get({}, function (resp) {
        //console.log(resp);
        $scope.data.plants = resp.Items;
        $scope.data.plantsAsNames = PIWebCalls.reformatArray(resp.Items);
        $scope.finishedUpdating();
        //if a plant is already selected by the user and was restored from the prefs
        if ($scope.preferences.plantSearchText != null) {
          if ($filter('filter')($scope.data.plants, { Name: $scope.preferences.plantSearchText }).length === 1) {
            //do the same as the autocomplete search and set the current plant if the search finds 1
            //ie: if there is only 1 plant with the name the user has already saved from before, load that one
            $scope.data.selectedPlant.both = $filter('filter')($scope.data.plants, { Name: $scope.preferences.plantSearchText })[0];
          }
        }
      }, function (resp) {
        //there was an error
        $scope.errors.push({ "Error with getting plants": resp });
        $scope.finishedUpdating();
      });
    };
    //call this function now that it's ready and the app is loading at first
    $scope.getPlants();


    //function for when a plant is selected
    $scope.getPlantData = function () {
      //check that an actual plant was selected
      if ($scope.data.selectedPlant != null && $scope.data.selectedPlant.both != null) {
        //save previous plant settings
        if($scope.previousPlant != null)
        {
          $scope.preferences.plantSettings[$scope.previousPlant].plantReportSettings = $scope.currentPlantReportSettings;
        }
        $scope.currentPlantReportSettings = {};
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
      $scope.previousPlant = $scope.getCurrentPlantID();
    };

    //helper function for renaming plant names from "Plant ID xxxx" to just the number, "xxxx"
    $scope.getCurrentPlantID = function () {
      if ($scope.data.selectedPlant != null && $scope.data.selectedPlant.both != null) {
        return $scope.data.selectedPlant.both.Name.replace('Plant ID ', '');
      }
      else {
        return "NoPlant";
      }
    };

    //user has the ability to change the selected tag for using tagWriter
    //this function is for when the user selects a new tag
    $scope.changeTagWriterTag = function () {
      $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag = null;
      //The timeout is needed to make sure that the autocomplete component is rendered at the time of calling focus.
      setTimeout(function () {
        angular.element('#search-input-tags').focus();
      }, 0);
    };

    //function that searches for all tags that belong to the currently selected plant ID
    //and populates the tags variable
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
            //since tagwriter is mostly used for RunHour tags,
            //check for a runhour tag in the list of tags and select it first if it's available
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

    //get the current value of the selected tag
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

    /**
     * Function that stores a new value to a specified webID tag (for TagWriter)
     * 
     */
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

    //helper functions
    //needed for Angualr MD virtual repeater
    $scope.virtualTagsList = {
      getItemAtIndex: function (index) {
        if ($scope.data && $scope.data.tags && $scope.data.tags.length) {
          //return a list that is already filtered by the filter text
          //and ordered by Name
          return $filter('orderBy')($filter('filter')($scope.data.tags, { Name: $scope.selectTagsFiltertext }), 'Name')[index];
        }
        else return null;
      },
      getLength: function () {
        if ($scope.data && $scope.data.tags) {
          //return the length of the filtered list
          return $filter('filter')($scope.data.tags, { Name: $scope.selectTagsFiltertext }).length;
        }
        else return 0;
      }
    };

    //helper functions
    //needed for Angualr MD virtual repeater
    $scope.virtualSelectedTagsList = {
      getItemAtIndex: function (index) {
        if ($scope.currentPlantReportSettings && $scope.currentPlantReportSettings.selectedTags && $scope.currentPlantReportSettings.selectedTags.length) {
          return $filter('orderBy')($scope.currentPlantReportSettings.selectedTags, 'Name')[index];
        }
        else return null;
      },
      getLength: function () {
        if ($scope.currentPlantReportSettings && $scope.currentPlantReportSettings.selectedTags) {
          return $scope.currentPlantReportSettings.selectedTags.length;
        }
        else return 0;
      }
    };

    /**
    * Function to add selected tag to the current report
    * 
    * @param {int} tagToSelect 
    */
    $scope.selectTag = function (tagToSelect) {
      var selectedTag, found = false;
      for (var i = 0; i < $scope.data.tags.length && !found; i++) {
        if ($scope.data.tags[i].WebID === tagToSelect.WebID) {
          selectedTag = $scope.data.tags.splice(i, 1)[0];
          found = true;//since there's no 'break' function in js
        }
      }
      //if this is the first tag, set up the selected tags array
      if ($scope.currentPlantReportSettings.selectedTags == null) {
        $scope.currentPlantReportSettings.selectedTags = [];
      }
      $scope.currentPlantReportSettings.selectedTags.push(selectedTag);
    };

    /**
    * Function to remove a specified tag from the report
    * 
    * @param {int} tagToRemove 
    */
    $scope.removeSelectedTag = function (tagToRemove) {
      var removedTag, found = false;
      for (var i = 0; i < $scope.currentPlantReportSettings.selectedTags.length && !found; i++) {
        if ($scope.currentPlantReportSettings.selectedTags[i].WebID === tagToSelect.WebID) {
          removedTag = $scope.currentPlantReportSettings.selectedTags.splice(i, 1)[0];
          found = true;//since there's no 'break' function in js
        }
      }
      $scope.data.tags.push(selectedTag);
    };

    /**
     *function that goes through and selects (filtered) tags 
     * 
     */
    $scope.selectAllTags = function () {
      if ($scope.selectTagsFiltertext != null && $scope.selectTagsFiltertext !== '') {
        $filter('filter')($scope.data.tags, { Name: $scope.selectTagsFiltertext }).forEach(function (tag, index) {
          $scope.selectTag(tag);
        });
      }
      else {
        //if this is the first tag, set up the selected tags array
        if ($scope.currentPlantReportSettings.selectedTags == null) {
          $scope.currentPlantReportSettings.selectedTags = [];
        }
        $scope.currentPlantReportSettings.selectedTags = $scope.data.tags.concat($scope.currentPlantReportSettings.selectedTags);

        $scope.data.tags = []; //empty the array
      }
    };

    /**
     *function that goes through and removes all selected tags 
     * 
     */
    $scope.removeAllTags = function () {
      $scope.data.tags = $scope.data.tags.concat($scope.currentPlantReportSettings.selectedTags);
      $scope.currentPlantReportSettings.selectedTags = []
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
            $scope.getPrintableValue(newReport.summaryData, tag.WebID, 1) + '\t' +//minimum, this is just the order it is returned by PI web API 
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

    $scope.setUpCSVFile = function () {

    }

    //function that gets the value from a JSON PI Web API value 
    //and puts it in the numerical format that is expected in PI tools
    $scope.getPrintableValue = function (webIDArray, webID, index) {
      var Value = webIDArray[webID].Items[index].Value;
      if (Value.Value != null && typeof Value.Value === 'number') {
        //return the value to 4 decimal places
        return $filter('number')(Value.Value, 4);
      }
      else
        return '0.0000';
    }

    //helper function to get the file name based on the currently set variables
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