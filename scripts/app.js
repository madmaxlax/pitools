/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />
//Author: Maxwell Struever maxwell.c.struever@shell.com

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

  app.directive('piToolsCard', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'scripts/directives/pitools.html'
    };
  });

  //directives to help with the required casting/parsing
  //https://docs.angularjs.org/error/ngModel/numfmt?p0=10
  app.directive('stringToNumber', function () {
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ngModel) {
        // ngModel.$parsers.push(function(value) {
        //   return '' + value;
        // });
        ngModel.$formatters.push(function (value) {
          return parseFloat(value);
        });
      }
    };
  });

  app.directive('stringToDate', function () {
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ngModel) {
        // ngModel.$parsers.push(function(value) {
        //   return '' + value;
        // });
        ngModel.$formatters.push(function (value) {
          return new Date(value);
        });
      }
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
      $mdDialog.hide();
    };

    //set up a watch on the errors var, and show the dialog if there's ever anything
    $scope.errorPush = function (errorObj) {
      $scope.errors.push(errorObj);
      if ($scope.errors.length > 0) {
        $mdDialog.show({
          contentElement: '#errorsDialog',
          parent: angular.element(document.body),
          // targetEvent: ev,
          clickOutsideToClose: true
        });
      }
    };

    //debugging functions
    $scope.toastTest = function () {
      $mdToast.show($mdToast.simple().textContent('Hello!').action("ok").hideDelay(300000));
    }
    $scope.errorTest = function () {
      setTimeout(function () {
        $scope.errorPush({ "This error was on purpose": "derpus" });
        console.log('error pushed');
      }, 500);
    }


    //function to open/close the right panel that contains the preferences (when the user clicks the settings icon on narrower screens)
    $scope.toggleLeft = function () {
      $mdSidenav('right').toggle();
    };


    $scope.focusPeriodTypeSelected = function () {
      if (true) {
        setTimeout(function () {
          angular.element('#interval-minutes-input').focus();
        }, 0);
      }
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
     *For troubleshooting
     *Deletes all saved preferences and restarts
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
        $scope.errorPush({ "Error with getting plants": resp });
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
        if ($scope.previousPlant != null) {
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
      $scope.data.availableTagWriterTags = [];
      $scope.data.availablePlantTags = [];
      $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag = null;
      //make sure the value exists (sometimes doesnt with new users)
      if ($scope.data.selectedPlant != null) {
        PIWebCalls.TagSearch.get({
          name: $scope.getCurrentPlantID() + '*',
          max: 5000, //Covers more than double the max amount of tags plants have as of 2017
          piserver: 'STCAPIColl',
          pointsource: '*'
        }, function (resp) {
          //assign tags for to the tagwriter list of tags
          $scope.data.availableTagWriterTags = resp.Items;
          //then do a separate deep copy to plant tags
          angular.copy($scope.data.availableTagWriterTags, $scope.data.availablePlantTags);
          if ($scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag == null) {
            //since tagwriter is mostly used for RunHour tags,
            //check for a runhour tag in the list of tags and select it first if it's available
            if ($filter('filter')($scope.data.availableTagWriterTags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false) !== 0) {
              $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag = $filter('filter')($scope.data.availableTagWriterTags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false)[0];
              $scope.getTagValue();
            }
          }
          //run the startup check (in a non-blocking way)
          setTimeout($scope.checkSelectedTagsAtStartup, 0);
        }, function (resp) {
          //there was an error
          $scope.errorPush({ "Error with searching for tags": resp });
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
          $scope.errorPush({ "Error with getting values": resp });
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
          $scope.errorPush({ "Error with updating values": resp });
        });
    };

    //helper functions
    //needed for Angualr MD virtual repeater
    $scope.virtualTagsList = {
      getItemAtIndex: function (index) {
        if ($scope.data && $scope.data.availablePlantTags && $scope.data.availablePlantTags.length) {
          //return a list that is already filtered by the filter text
          //and ordered by Name
          return $filter('orderBy')($filter('filter')($scope.data.availablePlantTags, { Name: $scope.selectTagsFiltertext }), 'Name')[index];
        }
        else return null;
      },
      getLength: function () {
        if ($scope.data && $scope.data.availablePlantTags) {
          //return the length of the filtered list
          return $filter('filter')($scope.data.availablePlantTags, { Name: $scope.selectTagsFiltertext }).length;
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
     * Function that checks the list of selected tags that were loaded from the settings and:
     * 1 checks that they exist
     * 2 removes them from the 'available' tags so that they aren't duplicated
     */
    $scope.checkSelectedTagsAtStartup = function () {
      //check if there are any tags at all, if not, do nothing
      if ($scope.currentPlantReportSettings.selectedTags == null || $scope.currentPlantReportSettings.selectedTags.length === 0) {
        return;
      }
      //go through all selected tags, then try to find a match
      for (var i = 0; i < $scope.currentPlantReportSettings.selectedTags.length; i++) {
        var matchFound = false;
        //go through all available plant tags looking for a match
        for (var c = 0; c < $scope.data.availablePlantTags.length; c++) {
          if ($scope.currentPlantReportSettings.selectedTags[i].WebID === $scope.data.availablePlantTags[c].WebID) {
            removedTag = $scope.data.availablePlantTags.splice(c, 1)[0];
            matchFound = true;//since there's no 'break' function in js
          }
        }
        if (!matchFound) {
          //remove it from the available tags list because that tag that was saved in the settings no longer exists in the PI System
          var removedTag = $scope.currentPlantReportSettings.selectedTags.splice(i, 1)[0];
          $mdToast.showSimple("A tag in your saved settings " + removedTag.Name + " was not found on the PI system, it has been removed from your settings");
          console.log("A tag in your saved settings " + removedTag.Name + " was not found on the PI system, it has been removed from your settings");
        }
      }

    };

    /**
    * Function to add selected tag to the current report
    * 
    * @param {int} tagToSelect 
    */
    $scope.selectTag = function (tagToSelect) {
      var selectedTag, found = false;
      //go through all tags, find one that matches (check matching webid) and remove (splice) it, then push it to the other list
      for (var i = 0; i < $scope.data.availablePlantTags.length && !found; i++) {
        if ($scope.data.availablePlantTags[i].WebID === tagToSelect.WebID) {
          selectedTag = $scope.data.availablePlantTags.splice(i, 1)[0];
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
      //go through all tags, find one that matches (check matching webid) and remove (splice) it, then push it to the other list
      for (var i = 0; i < $scope.currentPlantReportSettings.selectedTags.length && !found; i++) {
        if ($scope.currentPlantReportSettings.selectedTags[i].WebID === tagToRemove.WebID) {
          removedTag = $scope.currentPlantReportSettings.selectedTags.splice(i, 1)[0];
          found = true;//since there's no 'break' function in js
        }
      }
      $scope.data.availablePlantTags.push(tagToRemove);
    };

    /**
     *function that goes through and selects (filtered) tags 
     * 
     */
    $scope.selectAllTags = function () {
      if ($scope.selectTagsFiltertext != null && $scope.selectTagsFiltertext !== '') {
        $filter('filter')($scope.data.availablePlantTags, { Name: $scope.selectTagsFiltertext }).forEach(function (tag, index) {
          $scope.selectTag(tag);
        });
      }
      else {
        //if this is the first tag, set up the selected tags array
        if ($scope.currentPlantReportSettings.selectedTags == null) {
          $scope.currentPlantReportSettings.selectedTags = [];
        }
        $scope.currentPlantReportSettings.selectedTags = $scope.data.availablePlantTags.concat($scope.currentPlantReportSettings.selectedTags);

        $scope.data.availablePlantTags = []; //empty the array
      }
      $scope.selectTagsFiltertext = '';
    };

    /**
     *function that goes through and removes all selected tags 
     * 
     */
    $scope.removeAllTags = function () {
      $scope.data.availablePlantTags = $scope.data.availablePlantTags.concat($scope.currentPlantReportSettings.selectedTags);
      $scope.currentPlantReportSettings.selectedTags = []
    };




    /**
     * Function that sets off the functions that generate reports from the user info
     * 
     * @returns 
     */
    $scope.generateReports = function () {
      $scope.totalAsyncCallsFinished = 0;
      $scope.totalAsyncCallsSent = 0;
      //
      //TODO If statement that everything is ok, and tags are selected
      //
      if ($scope.currentPlantReportSettings.selectedTags.length) {
        //set up new scope var, reportGeneration
        //this will not be saved to the preferences
        $scope.reportGeneration = {};
        //figure out how many periods are in the selected start and end times
        $scope.reportGeneration.periodsCount = 0;
        var timeSpan = (new Date($scope.currentPlantReportSettings.endDate)) - (new Date($scope.currentPlantReportSettings.startDate));
        $scope.reportGeneration.periodsCount = Math.floor(timeSpan / ($scope.currentPlantReportSettings.intervalMinutes * 60000));//minutes to milliseconds, then divide to find the periods

        //if there are no periods, we're done here
        if (!($scope.reportGeneration.periodsCount > 0)) {
          $mdToast.showSimple("No periods found!! Check your start/end time and intervals then try again");
          return;
        }
        $mdToast.showSimple($scope.reportGeneration.periodsCount + " periods found, generating reports");

        //grab the run hour tag, same as how tagwriter does it
        $scope.reportGeneration.runhourTag = {};
        if ($filter('filter')($scope.data.availableTagWriterTags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false) !== 0) {
          angular.copy($filter('filter')($scope.data.availableTagWriterTags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false)[0], $scope.reportGeneration.runhourTag);
        }
        else {
          $scope.errorPush({ "No RunHour": "No run hour tag found for this plant to use in the report" });
        }

        $scope.reportGeneration.generatedReports = [];
        var newReport;
        //Get the periods via interval interpolation from PI Web API for RunHour, this will set up the reports and timing
        PIWebCalls.SampledValues.get({
          webid: $scope.reportGeneration.runhourTag.WebID,
          startTime: $scope.currentPlantReportSettings.startDate,
          endTime: $scope.currentPlantReportSettings.endDate,
          interval: $scope.currentPlantReportSettings.intervalMinutes + "m",
        }, function (resp) {
          var runhourValues = resp.Items[0];
          for (var i = 0; i < $scope.reportGeneration.periodsCount; i++) {
            newReport = { tags: [], webIDs: [] };
            newReport.runhourTag = $scope.reportGeneration.runhourTag;
            newReport.runhourTag.periodStartValue = runhourValues.Items[i];
            newReport.runhourTag.periodEndValue = runhourValues.Items[i + 1];
            newReport.periodStartTime = runhourValues.Items[i].Timestamp;
            newReport.periodEndTime = runhourValues.Items[i + 1].Timestamp;
            //period number from the user plus the offset of how many periods have already been generated
            newReport.periodNumber = $scope.currentPlantReportSettings.periodNumber + i;
            //go set up the CSV
            //(in a non-blocking way)
            setTimeout($scope.setUpCSVFile(newReport), 0);
            //blocking way: $scope.setUpCSVFile(newReport)
          }
        }, function (resp) {
          //there was an error
          $scope.errorPush({ "Error with getting RunHour data for the periods": resp });
        });
      }
      else {
        $mdToast.showSimple("You must select tags for the report");
      }
    };

    /**
     * Function that sets up the actual CSV file
     * 
     * @param {object} newReport expected to have the following values: runhourTag (with start and end values), periodStartTime, periodEndTime, periodNumber
     * the rest of the data like selected tags will come from the preferences
     */
    $scope.setUpCSVFile = function (newReport) {

      newReport.filename = $scope.getCurrentFileName(newReport.periodNumber);
      var currentTime = Date.now();
      if ($scope.currentPlantReportSettings.reportType === 'hydra') {
        newReport.csvFile = '[Header]\n' +
          'Lay-out version=\t3.0\n' +
          'Date=\t' + $filter('date')(currentTime, 'yyyy-MM-dd') + '\n' + //current date
          'Time=\t' + $filter('date')(currentTime, 'HH:mm') + '\n' + //current time
          'Plant name=\t' + $scope.getCurrentPlantID() + '\n' +
          'Reactor name=	R101\n' +
          'Group name=\t' + $scope.currentPlantReportSettings.experimentName + '\n' +
          'Experiment nr=\t' + $scope.currentPlantReportSettings.experimentNumber + '\n' +
          'Condition ID=\t' + $scope.currentPlantReportSettings.periodName + '\n' +
          'Period nr=\t' + newReport.periodNumber + '\n' + //use period number with the offset
          'Period start date=\t' + $filter('date')(newReport.periodStartTime, 'yyyy-MM-dd') + '\n' +
          'Period start time=\t' + $filter('date')(newReport.periodStartTime, 'HH:mm') + '\n' +
          'Period end date=\t' + $filter('date')(newReport.periodEndTime, 'yyyy-MM-dd') + '\n' +
          'Period end time=\t' + $filter('date')(newReport.periodEndTime, 'HH:mm') + '\n' +
          'Start run hour=\t' + $filter('number')(newReport.runhourTag.periodStartValue.Value, 1) + '\n' +
          'End run hour=\t' + $filter('number')(newReport.runhourTag.periodEndValue.Value, 1) + '\n' +
          '[Data]\n' +
          'Tagnames\tSI-units\tMinimum\tMaximum\tAverage\tDeviation\tFirstval\tLastval\n';
      }
      else {
        newReport.csvFile = 'DATACOL\n' +
          '\n' +
          '***PERIOD ' + newReport.periodNumber + '\n' +
          '\n' +
          '    PLANT ' + $scope.getCurrentPlantID() + ' PERIOD ' + newReport.periodNumber + '  RUNLIST REPORT        EXPERIMENT NR ' + $scope.currentPlantReportSettings.experimentNumber + '\n' +
          '    PERIOD START TIME ' + $filter('date')(newReport.periodStartTime, 'HH:mm:ss') + '  ' + $filter('date')(newReport.periodStartTime, 'dd MMM yyyy') + '  START RUN HOUR ' + $filter('number')(newReport.runhourTag.periodStartValue.Value, 1) + '\n' +
          '    PERIOD END   TIME ' + $filter('date')(newReport.periodEndTime, 'HH:mm:ss') + '  ' + $filter('date')(newReport.periodEndTime, 'dd MMM yyyy') + '  END   RUN HOUR ' + $filter('number')(newReport.runhourTag.periodEndValue.Value, 1) + '\n' +
          '   NAME     MINIMUM    MAXIMUM    AVERAGE   DEVIATION  FIRST VAL   LAST VAL\n';
      }


      //add the selected tags to the report tags list
      $scope.currentPlantReportSettings.selectedTags.forEach(function (tag, index) {
        newReport.tags.push(tag);
        newReport.webIDs.push(tag.WebID);
      });

      //set up a counter
      newReport.asyncCallsStillWaiting = 0;

      //get the calculated values
      PIWebCalls.CalculatedValues.get({
        webid: newReport.webIDs,
        startTime: newReport.periodStartTime,
        endTime: newReport.periodEndTime,
        summaryType: ['Average', 'Minimum', 'Maximum', 'StdDev']
      }, function (resp) {
        // console.log(resp);
        newReport.summaryData = PIWebCalls.reformatArray(resp.Items, 'WebId');
        newReport.asyncCallsStillWaiting--
        $scope.totalAsyncCallsFinished++;

        //check;    
        //in non blocking way
        setTimeout($scope.checkAndFinishReport(newReport), 0);
      }, function (resp) {
        //there was an error
        $scope.errorPush({ "Error with getting calculated data for tags": resp });
      });
      newReport.asyncCallsStillWaiting++;
      $scope.totalAsyncCallsSent ++;

      //get the first and last values
      PIWebCalls.SampledValues.get({
        webid: newReport.webIDs,
        startTime: newReport.periodStartTime,
        endTime: newReport.periodEndTime,
        interval: (new Date(newReport.periodEndTime) - new Date(newReport.periodStartTime)) / 1000 + 's'
      }, function (resp) {
        // console.log(resp);
        newReport.sampledData = PIWebCalls.reformatArray(resp.Items, 'WebId');
        newReport.asyncCallsStillWaiting--
        $scope.totalAsyncCallsFinished ++;
        //check;       
        //in non blocking way
        setTimeout($scope.checkAndFinishReport(newReport), 0);

      }, function (resp) {
        //there was an error
        $scope.errorPush({ "Error with getting first and last value data for tags": resp });
      });
      newReport.asyncCallsStillWaiting++;
      $scope.totalAsyncCallsSent ++;
    };
    /**
     * Checks if there are any outstanding async calls still waiting
     * if not, finishes the report and pushes it to be available for download
     * 
     * @param {any} newReport 
     */
    $scope.checkAndFinishReport = function (newReport) {
      if (newReport.asyncCallsStillWaiting === 0) {
        //this needs to be moved
        newReport.tags.forEach(function (tag, index) {
          if ($scope.currentPlantReportSettings.reportType === 'hydra') {//Hydra .R02
            newReport.csvFile += tag.Name + '\t' + (tag.UoM === undefined ? '' : tag.UoM) + '\t' +
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 1).toString() + '\t' +//minimum, this is just the order it is returned by PI web API 
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 2).toString() + '\t' +//maximum
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 0).toString() + '\t' +//average
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 3).toString() + '\t' +//std
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 0).toString() + '\t' +//firstval
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 1).toString() +//lastval
              '\n';
          }
          else {//runlist .nox
            //tagname must be shortened to 10 chars
            var tagShortName = ' ' + tag.Name.replace('STCA', '').substr(4, 10);
            while (tagShortName.length < 12) //need to add spaces if < 11 characters
            {
              tagShortName += ' ';
            }
            newReport.csvFile += $scope.getPrintableValue(newReport.summaryData, tag.WebID, 1, 5).toString().substr(0, 7) + '    ' +//minimum, this is just the order it is returned by PI web API 
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 2) + '    ' +//maximum
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 0) + '    ' +//average
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 3) + '    ' +//std
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 0) + '    ' +//firstval
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 1) + '\n';//lastval
          }
        });
        if ($scope.currentPlantReportSettings.reportType === 'run') {
          newReport.csvFile += '\n***END OF LIST'
        }
        $scope.reportGeneration.generatedReports.push(newReport);

        //automatically update the periods 
        if ($scope.reportGeneration.periodsCount === $scope.reportGeneration.generatedReports.length) {
          $scope.currentPlantReportSettings.periodNumber += $scope.reportGeneration.periodsCount;
          $mdToast.showSimple("Updating Period Count to '" + $scope.currentPlantReportSettings.periodNumber + "' and saving your settings");
          $scope.savePreferences(false);
        }

      }
    }


    /**
     * function that gets the value from a JSON PI Web API value 
     * 
     * @param {any} webIDArray object list of tags with the webID as the keys
     * @param {any} webID the webID to get from the array
     * @param {any} index which value to get (if multiple values are provided)
     * @param {any} decimals 
     * @returns 
     */
    $scope.getPrintableValue = function (webIDArray, webID, index, decimals) {
      //default decimal places amount is 4
      decimals = (typeof decimals !== 'undefined') ? decimals : 4;
      var Value = webIDArray[webID].Items[index].Value;
      if (Value.Value != null && typeof Value.Value === 'number') {
        //return the value to 4 decimal places
        return $filter('number')(Value.Value, 4);
      }
      else
        return '0.0000';
    };

    //helper function to get the file name based on the currently set variables
    $scope.getCurrentFileName = function (periodNumber) {
      periodNumber = (typeof periodNumber !== 'undefined') ? periodNumber : $scope.currentPlantReportSettings.experimentNumber;
      //always .nox Hydra files for now, 
      return ($scope.currentPlantReportSettings.reportFileNameWithExpPerNums ? $scope.currentPlantReportSettings.experimentName +
        $scope.currentPlantReportSettings.experimentNumber + '-' + $scope.currentPlantReportSettings.periodName + periodNumber :
        'plant' + $scope.getCurrentPlantID()) + ($scope.currentPlantReportSettings.reportType === 'hydra' ? '.R02' : '.NOX');
    };

    //function to force the download of the file
    //from Jossef Harush https://jsfiddle.net/jossef/m3rrLzk0/ from https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    $scope.openReport = function (reportNumber) {
      var csvFile = $scope.reportGeneration.generatedReports[reportNumber].csvFile;
      var filename = $scope.reportGeneration.generatedReports[reportNumber].filename;
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