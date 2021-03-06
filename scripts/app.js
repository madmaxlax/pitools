/// <reference path="C:\Apps\Dropbox\Dev\typings\angularjs\angular.d.ts" />
//Author: Maxwell Struever maxwell.c.struever@shell.com



(function () {
  //set up the angular app
  var app = angular.module('myapp', ['ngResource', 'LocalStorageModule', 'yaru22.angular-timeago', 'ngMaterial', 'ngMessages']);

  //set up any http requests to pass along windwos
  app.config(['$httpProvider',
    function ($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      //$httpProvider.defaults.cache = true;
      //delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
  ]);
  //trun off aria warnings
  app.config(['$mdAriaProvider', function ($mdAriaProvider) {
    $mdAriaProvider.disableWarnings();
  }]);
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
    var _PIWebAPIURL = 'https://muntse-s-08817.europe.shell.com/piwebapi/';
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

      //all the web calls, set up as an angular $resource, and packaged in a factory, which is like a static set of functions
      plantsCall: $resource(_PIWebAPIURL + "assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/elements?searchFullHierarchy=true&templateName=Plant"),
      elementAttrValuesCall: $resource(_PIWebAPIURL + "streamsets/:webid/value"),
      interfacesCall: $resource(_PIWebAPIURL + "elements/:webid/elements?templateName=Interface"),
      updateValueCall: $resource(_PIWebAPIURL + "streams/:webid/value"),
      getValuesAdHocCall: $resource(_PIWebAPIURL + "streamsets/value"),
      openIssuesEventFramesCall: $resource(_PIWebAPIURL + "assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/eventframes?templateName=Issue&searchMode=InProgress&startTime=*-4w"),//default last 8 hours. added 4 weeks in case something is older
      recentIssuesEventFramesCall: $resource(_PIWebAPIURL + "assetdatabases/D0-d52kj1VR0aWEZdcjlIq7g8ZG7ICOjAkiCmRVNEn1oZgU1RDQSBBRiBTRVJWRVJcU1RDQS1BRg/eventframes?templateName=Issue"), //default last 8 hours. 
      getArchivedValues: $resource(_PIWebAPIURL + "streams/:webid/recorded"),
      //TagSearch: $resource(_PIWebAPIURL+'dataservers/s0Zwm3Ai1HVUiBciNvrmWsBQU1RDQVBJQ09MTA/points?namefilter=:name&maxCount=:max'),
      TagSearch: $resource(_PIWebAPIURL + 'search/query?scope=pi::piserver&count=:max&q=(name::name AND pointsource::pointsource)'),
      TagValue: $resource(_PIWebAPIURL + "streams/:webid/value"),
      TagValueGroup: $resource(_PIWebAPIURL + "streamsets/value"),
      CalculatedValues: $resource(_PIWebAPIURL + "streamsets/summary"),
      SampledValues: $resource(_PIWebAPIURL + "streamsets/interpolated"), //can get a set intervals
      TagRecordedValues: $resource(_PIWebAPIURL + "streams/:webid/recorded?maxCount=:max&startTime=*&endTime=*-5y"),
      CompressedValues: $resource(_PIWebAPIURL + "streams/:webid/recorded"),
      TagAttributes: $resource(_PIWebAPIURL + "points/:webid/attributes"),
      TagAttributesDescriptor: $resource(_PIWebAPIURL + "points/:webid/attributes/descriptor"),
      TagAttributesDigitalSet: $resource(_PIWebAPIURL + "points/:webid/attributes/digitalset"),
      getDigitalSet: $resource(_PIWebAPIURL + "enumerationsets/?path=\\\\PIServers[STCAPICOLL]\\StateSets[:statename]"),
      getDigitalSetValues: $resource(_PIWebAPIURL + "enumerationsets/[enumeration set webid]/enumerationvalues")
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
        var mcscope = scope;
        // ngModel.$parsers.push(function(value) {
        //   return '' + value;
        // });
        ngModel.$formatters.push(function (value) {
          return new Date(value);
        });
      }
    };
  });
  app.directive('inPast', function () {
    return {
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$validators.inPast = function (modelValue, viewValue) {
          var currentTime = new Date();
          if (typeof modelValue === 'object' && modelValue > currentTime) {
            return false;
          }
          return true;
        };
      }
    };
  });
  app.directive('validDate', function () {
    return {
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$validators.validDate = function (modelValue, viewValue) {
          if (scope.currentPlantReportSettings != null) {
            scope.combineDateTime();
            return scope.currentPlantReportSettings.endDate > scope.currentPlantReportSettings.startDate;
          }
          //if no variable yet, say its okay
          return true;
        };
      }
    };
  });
  app.directive('tagsSelected', function () {
    return {
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$validators.tagsSelected = function (modelValue, viewValue) {
          if (scope.currentPlantReportSettings && scope.currentPlantReportSettings.selectedTags && scope.currentPlantReportSettings.selectedTags.length === 0) {
            return false;
          }
          return true;
        };
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
    //used for current time
    $scope.now = new Date();

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
    };
    $scope.errorTest = function () {
      setTimeout(function () {
        $scope.errorPush({ "This error was on purpose": "derpus" });
        console.log('error pushed');
      }, 500);
    };

    //check for chrome
    if (!(/chrome/i.test(window.navigator.userAgent))) {
      alert("Please use Chrome!  Just a heads up: \nThis app is developed for and tested in the Google Chrome Browser\n" +
        "We have noticed some issues or functions not working in Internet Explorer\n" +
        "It appears you are using Internet Explorer or a different browser, please switch to Google Chrome\n" +
        "Google Chrome is a company-approved browser and available in the software center if you do not have it");
    }

    //function to open/close the right panel that contains the preferences (when the user clicks the settings icon on narrower screens)
    $scope.toggleLeft = function () {
      $mdSidenav('right').toggle();
    };

    /**
     * UI helper function to bring focus to the next logical spot
     * turned off for now
     */
    $scope.focusNextInput = function (IDtoFocus) {
      // if (angular.element('#' + IDtoFocus) == null) {
      //   return;
      // }
      // if (angular.element('#' + IDtoFocus)[0].nodeType = "INPUT") {
      //   setTimeout(function () {
      //     angular.element('#' + IDtoFocus)[0].focus();
      //   }, 0);
      // }
      // //md-select doesnt work with focus
      // if (angular.element('#' + IDtoFocus)[0].nodeType = "MD-SELECT") {
      //   setTimeout(function () {
      //     angular.element('#' + IDtoFocus)[0].click();
      //   }, 0);
      // }
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

        //reset report generation info since new ones will be generated
        $scope.resetGeneratedReports();

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
        //re check the validation now that new data has been loaded
        $scope.revalidate();
      }
      $scope.previousPlant = $scope.getCurrentPlantID();
    };

    //helper function for renaming plant names from "Plant ID xxxx" to just the number, "xxxx"
    $scope.getCurrentPlantID = function (checkPrefixSetting) {

      if ($scope.data.selectedPlant != null && $scope.data.selectedPlant.both != null) {
        var cleanName = $scope.data.selectedPlant.both.Name.replace('Plant ID ', '');
        if (checkPrefixSetting && $scope.currentPlantReportSettings != null && $scope.currentPlantReportSettings.removeSTCAprefix) {
          cleanName = cleanName.replace("STCA", '');
        }
        return cleanName;
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
      if ($scope.preferences.plantSettings[$scope.getCurrentPlantID()] == null) {
        //plants still loading, exit function
        return;
      }
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
      if ($scope.preferences.plantSettings != null && $scope.preferences.plantSettings[$scope.getCurrentPlantID()] != null && $scope.preferences.plantSettings[$scope.getCurrentPlantID()].selectedTagWriterTag != null) {
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
     * Function to get eventTagInformation like digital states
     * 
     */
    $scope.eventTagSelected = function () {

      if ($scope.currentPlantReportSettings.eventTag && $scope.currentPlantReportSettings.eventTag.DataType == 'digital') {
        //it's a digital tag, get digitalset attribute from eventtag
        PIWebCalls.TagAttributesDigitalSet.get({
          webid: $scope.currentPlantReportSettings.eventTag.WebID
        }, function (resp) {
          //console.log(resp);
          //now get the digital stateweb id
          PIWebCalls.getDigitalSet.get(
            {
              statename: resp.Value
            }, function (resp) {
              //console.log(resp);
              //now get the digital state value possibilities for digital state
              PIWebCalls.getDigitalSetValues.get(
                {
                  //WebId instead of WebID??
                  webid: resp.WebId
                }, function (resp) {
                  //console.log(resp);
                  //now get the digital state value possibilities for digital state
                  $scope.currentPlantReportSettings.eventTag.digitalSetValues = resp.Items;

                  //check if the new set of digital states has a value of the already set one
                  if ($scope.currentPlantReportSettings.eventTagTriggerValue != null) {
                    var found = false;
                    $scope.currentPlantReportSettings.eventTag.digitalSetValues.forEach(function (digitalSetValue, index) {
                      if (digitalSetValue.Name === $scope.currentPlantReportSettings.eventTagTriggerValue.Name) {
                        $scope.currentPlantReportSettings.eventTagTriggerValue = digitalSetValue;
                        found = true;
                      }
                    });
                    if (!found) {
                      $scope.currentPlantReportSettings.eventTagTriggerValue = null;
                    }
                  }
                }
                , function (resp) {
                  //there was an error
                  $scope.errorPush({ "Error with getting EventTag digital set info ": $scope.currentPlantReportSettings.eventTag.Name + ': ' + resp });
                }
              );
            }
            , function (resp) {
              //there was an error
              $scope.errorPush({ "Error with getting EventTag digital set info ": $scope.currentPlantReportSettings.eventTag.Name + ': ' + resp });
            }
          );

        }, function (resp) {
          //there was an error
          $scope.errorPush({ "Error with getting EventTag info ": $scope.currentPlantReportSettings.eventTag.Name + ': ' + resp });
        });
      }
      else {
        if ($scope.currentPlantReportSettings != null && $scope.currentPlantReportSettings.eventTag != null) {
          $scope.currentPlantReportSettings.eventTag.digitalSetValues = [];
          $scope.currentPlantReportSettings.eventTagTriggerValue = null;
        }
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
     * helper function for setting date to now
     * 
     */
    $scope.setEndDateToNow = function () {
      var coeff = 1000 * 60; //round to nearest minute
      var date = new Date();  //or use any other date
      var rounded = new Date(Math.floor(date.getTime() / coeff) * coeff)
      $scope.currentPlantReportSettings.endDate = (rounded);
      $scope.currentPlantReportSettings.endDatePicker = (rounded);
      $scope.currentPlantReportSettings.endDateTime = (rounded);
    }
    /**
     * Function that checks the list of selected tags that were loaded from the settings and:
     * 1 checks that they exist
     * 2 removes them from the 'available' tags so that they aren't duplicated
     */
    $scope.checkSelectedTagsAtStartup = function () {
      //check if there are any tags at all, if not, do nothing
      if ($scope.currentPlantReportSettings == null || $scope.currentPlantReportSettings.selectedTags == null || $scope.currentPlantReportSettings.selectedTags.length === 0) {
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

      matchFound = false;
      //do the same if there's an eventtag chosen and it's not a good one
      if ($scope.currentPlantReportSettings.eventTag != null) {
        //go through all available plant tags looking for a match
        for (var c = 0; c < $scope.data.availableTagWriterTags.length; c++) {
          if ($scope.currentPlantReportSettings.eventTag.WebID === $scope.data.availableTagWriterTags[c].WebID) {
            //eventtag exists,no problem
            return;
          }
        }
        if (!matchFound) {
          //remove eventtag, user will have to select a new one
          $mdToast.showSimple("The selected eventtag " + $scope.currentPlantReportSettings.eventTag.Name + " cannot be found. It has been removed from your settings");
          console.log("The selected eventtag " + $scope.currentPlantReportSettings.eventTag.Name + " cannot be found. It has been removed from your settings");
          $scope.currentPlantReportSettings.eventTag = null;
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
      $scope.piToolsForm.tagFilter.$validate();
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
      console.log($scope.currentPlantReportSettings.selectedTags.length);
      $scope.piToolsForm.tagFilter.$validate();
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
      $scope.currentPlantReportSettings.selectedTags = [];
      $scope.piToolsForm.tagFilter.$validate();
    };

    $scope.resetGeneratedReports = function () {
      $scope.totalAsyncCallsFinished = 0;
      $scope.totalAsyncCallsSent = 0;
      //this will not be saved to the preferences
      $scope.reportGeneration = {};
      //figure out how many periods are in the selected start and end times
      $scope.reportGeneration.periodsCount = 0;
    }
    /**
     * function to force angular to re check the custom validations because these fields can be weird
     * 
     */
    $scope.revalidate = function () {
      $scope.piToolsForm.tagFilter.$validate();
      $scope.piToolsForm.dateCheck.$validate();
    }

    /**
     * function used by $watch to combine date and time inputs into a single DateTime
     * 
     */
    $scope.combineDateTime = function () {
      if ($scope.currentPlantReportSettings != null) {
        if ($scope.currentPlantReportSettings.startDatePicker != null && $scope.currentPlantReportSettings.startDateTime != null) {
          $scope.currentPlantReportSettings.startDate = new Date($filter('date')($scope.currentPlantReportSettings.startDatePicker, 'yyyy-MM-dd ') + $filter('date')($scope.currentPlantReportSettings.startDateTime, 'HH:mm:ss'));
        }

        if ($scope.currentPlantReportSettings.endDatePicker != null && $scope.currentPlantReportSettings.endDateTime != null) {
          $scope.currentPlantReportSettings.endDate = new Date($filter('date')($scope.currentPlantReportSettings.endDatePicker, 'yyyy-MM-dd ') + $filter('date')($scope.currentPlantReportSettings.endDateTime, 'HH:mm:ss'));
        }
        //console.log($scope.currentPlantReportSettings.startDate,$scope.currentPlantReportSettings.endDate);

      }

    };

    //set up a watch on the start and end times to always combine the,
    $scope.$watchGroup(['currentPlantReportSettings.startDatePicker', 'currentPlantReportSettings.startDateTime', 'currentPlantReportSettings.endDatePicker', 'currentPlantReportSettings.endDateTime'], function (newValues, oldValues) {
      $scope.combineDateTime;
      if ($scope.piToolsForm != null && $scope.piToolsForm.dateCheck != null) {
        $scope.piToolsForm.dateCheck.$setTouched();
        $scope.piToolsForm.dateCheck.$validate();
      }
    });


    /**
     * Function that sets off the functions that generate reports from the user info
     * 
     * @returns 
     */
    $scope.generateReports = function () {
      //re check the validation validate just in case
      $scope.revalidate();

      if ($scope.piToolsForm.$valid) {
        //console.log($scope.currentPlantReportSettings.startDate,$scope.currentPlantReportSettings.endDate);
        //reset report generation info since new ones will be generated
        $scope.resetGeneratedReports();
        //grab the run hour tag, same as how tagwriter does it
        $scope.reportGeneration.runhourTag = {};
        if ($filter('filter')($scope.data.availableTagWriterTags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false) !== 0) {
          angular.copy($filter('filter')($scope.data.availableTagWriterTags, { Name: $scope.getCurrentPlantID() + "RunHour" }, false)[0], $scope.reportGeneration.runhourTag);
        }
        else {
          $scope.errorPush({ "No RunHour": "No run hour tag found for this plant to use in the report, using decoy tag instead" });

          //need to have a default tag in its place because the run hour tag kind of drives the rest of the report generation
          $scope.reportGeneration.runhourTag = {
            DataType: "float32",
            Description: "12 Hour Sine Wave",
            ItemType: "pipoint",
            Name: "SINUSOID",
            UniqueID: "\\{02b70967-472d-4855-8172-236fae65ac05}\?1",
            WebID: "P0Zwm3Ai1HVUiBciNvrmWsBQAQAAAAU1RDQVBJQ09MTFxTSU5VU09JRA"
          };
        }
        $scope.reportGeneration.generatedReports = [];

        //find the periods based on intervals
        if ($scope.currentPlantReportSettings.periodMethod === 'interval') {
          //set up new scope var, reportGeneration
          var timeSpan = (new Date($scope.currentPlantReportSettings.endDate)) - (new Date($scope.currentPlantReportSettings.startDate));
          $scope.reportGeneration.periodsCount = Math.floor(timeSpan / ($scope.currentPlantReportSettings.intervalMinutes * 60000));//minutes to milliseconds, then divide to find the periods

          //if there are no periods, we're done here
          if (!($scope.reportGeneration.periodsCount > 0)) {
            $mdToast.showSimple("No periods found!! Check your start/end time and interval then try again");
            return;
          }
          else {
            //if there are a weird amount of periods, confirm with user
            if ($scope.reportGeneration.periodsCount > 100) {
              var response = confirm("You have selected an interval with " + $scope.reportGeneration.periodsCount + " periods, is this correct? Generating this many reports will take a long time");
              if (!response) {
                return;
              }
            }
          }
          $mdToast.showSimple($scope.reportGeneration.periodsCount + " periods found, generating reports");


          //Get the periods via interval interpolation from PI Web API for RunHour, this will set up the reports and timing
          PIWebCalls.SampledValues.get({
            webid: $scope.reportGeneration.runhourTag.WebID,
            startTime: $scope.currentPlantReportSettings.startDate,
            endTime: $scope.currentPlantReportSettings.endDate,
            interval: $scope.currentPlantReportSettings.intervalMinutes + "m",
          }, function (resp) {
            var runhourValues = resp.Items[0];
            for (var i = 0; i < $scope.reportGeneration.periodsCount; i++) {

              //go set up the CSV
              //(in a non-blocking way)
              //period number from the user plus the offset of how many periods have already been generated
              setTimeout($scope.setUpCSVFile(runhourValues.Items[i], runhourValues.Items[i + 1], $scope.currentPlantReportSettings.periodNumber + i), 0);
              //blocking way: $scope.setUpCSVFile(newReport)
            }
          }, function (resp) {
            //there was an error
            $scope.errorPush({ "Error with getting RunHour data for the periods": resp });
          });
        }
        else {
          //Event tag handling
          //-------

          //get the values for the eventTag
          $scope.reportGeneration.periodsCount = 0;
          PIWebCalls.CompressedValues.get({
            webid: $scope.currentPlantReportSettings.eventTag.WebID,
            startTime: $scope.currentPlantReportSettings.startDate,
            endTime: $scope.currentPlantReportSettings.endDate,
            boundaryType: "Outside"
          }, function (resp) {
            // console.log(resp);
            $scope.data.eventTagValues = resp.Items;
            var periodStartTime = null, periodEndTime = null, periodNumber = 0, previousValue = null;
            for (var i = 0; i < $scope.data.eventTagValues.length; i++) {
              if ($scope.currentPlantReportSettings.eventagPeriodType === "anyValueChange") {
                if (i === 0) {
                  //no periods found yet, beginning not found yet
                  //TO DO look back and find start of period
                  //------
                  //for now, start period here

                  periodStartTime = $scope.data.eventTagValues[i].Timestamp;
                  //this is used in the popup dialog showing the 
                  $scope.data.eventTagValues[i].isPeriod = true;
                  previousValue = $scope.data.eventTagValues[i];
                }
                else {
                  //check if this new value is different from the last one
                  if ((previousValue.Value.Value != null && $scope.data.eventTagValues[i].Value.Value != null && previousValue.Value.Value != $scope.data.eventTagValues[i].Value.Value) || (typeof previousValue.Value === 'number' && previousValue.Value !== $scope.data.eventTagValues[i].Value)) {
                    //this is a new value, set up a period
                    //end the period
                    periodEndTime = $scope.data.eventTagValues[i].Timestamp;
                    periodNumber = $scope.currentPlantReportSettings.periodNumber + $scope.reportGeneration.periodsCount;
                    $scope.data.eventTagValues[i].isPeriod = true;
                    $scope.data.eventTagValues[i].periodNumber = periodNumber;
                    $scope.data.eventTagValues[i].periodDurationMinutes = Math.floor((new Date(periodEndTime) - new Date(periodStartTime)) / 1000 / 60);
                    $scope.reportGeneration.periodsCount++;
                    previousValue = $scope.data.eventTagValues[i];

                    $scope.spawnNewPeriod(periodStartTime, periodEndTime, periodNumber);

                    //set the beginning of new period
                    periodStartTime = $scope.data.eventTagValues[i].Timestamp;
                  }
                }
              }
              else // value trigger has been selected
                if ($scope.data.eventTagValues[i].Value.Value === $scope.currentPlantReportSettings.eventTagTriggerValue.Value) {
                  if (i === 0) {
                    //no periods found yet, beginning not found yet
                    //TO DO look back and find start of period
                    //------
                    //for now, skip this period
                    $scope.data.eventTagValues[i].periodSkip = true;
                    // periodStartTime = $scope.data.eventTagValues[i].Timestamp;
                    //this is used in the popup dialog showing the 
                    // $scope.data.eventTagValues[i].isPeriod = true;
                  }
                  else {
                    //look 1 behind, if it's not a trigger value, then we found the start of a period
                    if ($scope.data.eventTagValues[i - 1].Value.Value !== $scope.currentPlantReportSettings.eventTagTriggerValue.Value) {
                      //if this is the first one found
                      if (periodStartTime == null) {
                        periodStartTime = $scope.data.eventTagValues[i].Timestamp;

                        //this is used in the popup dialog showing the 
                        $scope.data.eventTagValues[i].isPeriod = true;
                      }
                      else {
                        //end the period
                        periodEndTime = $scope.data.eventTagValues[i].Timestamp;
                        periodNumber = $scope.currentPlantReportSettings.periodNumber + $scope.reportGeneration.periodsCount;
                        $scope.data.eventTagValues[i].isPeriod = true;
                        $scope.data.eventTagValues[i].periodNumber = periodNumber;
                        $scope.data.eventTagValues[i].periodDurationMinutes = Math.floor((new Date(periodEndTime) - new Date(periodStartTime)) / 1000 / 60);
                        $scope.reportGeneration.periodsCount++;

                        $scope.spawnNewPeriod(periodStartTime, periodEndTime, periodNumber);

                        //set the beginning of new period
                        periodStartTime = $scope.data.eventTagValues[i].Timestamp;
                      }
                    }
                  }
                  //   else {
                  //   //TODO find end of period

                  //   //for now, skip last period

                  // }

                }
                else {
                  //not a trigger value, so this is just part of the period
                }
            }
            $scope.eventTagValuesDialogPromise = $mdDialog.show({
              templateUrl: './scripts/directives/eventtagperiodsdialog.html',
              parent: angular.element(document.body),
              scope: $scope,
              clickOutsideToClose: true,
              disableParentScroll: true,
              preserveScope: true
            })
              .then(function (answer) {
                $scope.status = 'You said the information was "' + answer + '".';
              }, function () {
                $scope.status = 'You cancelled the dialog.';
              });
          }, function (resp) {
            //there was an error
            $scope.errorPush({ "Error with getting RunHour data for the periods": resp });
          });
        }
      }
      else {
        $mdToast.showSimple("You still need to correctly fill some fields before getting reports");
        if (angular.element('.ng-invalid')[1] != null) {
          //scroll to it first
          if ($scope.piToolsForm.dateCheck.$error.validDate) {
            $("html,body").animate({ scrollTop: $('#date-pickers').offset().top - 50 }, "medium");
          }
          else {
            angular.element('.ng-invalid')[1].focus();
          }
        }
      }
    };
    /**
     * little helper function for closing dialogs that is available on the scope
     * 
     */
    $scope.hideDialog = function () {

      $mdDialog.hide();
    };

    /**
     * Function to 
     * was necessary to pass the period number through
     */
    $scope.spawnNewPeriod = function (periodStartTime, periodEndTime, periodNumber) {

      //Get the periods via interval interpolation from PI Web API for RunHour, this will set up the reports and timing
      PIWebCalls.SampledValues.get({
        webid: $scope.reportGeneration.runhourTag.WebID,
        startTime: periodStartTime,
        endTime: periodEndTime,
        interval: Math.floor((new Date(periodEndTime) - new Date(periodStartTime)) / 1000) + 's'
      }, function (resp) {
        var runhourValues = resp.Items[0];

        //go set up the CSV
        //(in a non-blocking way)
        //period number from the user plus the offset of how many periods have already been generated
        setTimeout($scope.setUpCSVFile(runhourValues.Items[0], runhourValues.Items[1], periodNumber), 0);
        //blocking way: $scope.setUpCSVFile(newReport)

      }, function (resp) {
        //there was an error
        $scope.errorPush({ "Error with getting RunHour data for the periods in event tags": resp });
      });
    };

    /**
     * Function that sets up the actual CSV file
     * 
     * @param {object} newReport expected to have the following values: runhourTag (with start and end values), periodStartTime, periodEndTime, periodNumber
     * the rest of the data like selected tags will come from the preferences
     */
    $scope.setUpCSVFile = function (runHourStartValue, runHourEndValue, periodNumber) {
      var newReport = { tags: [], webIDs: [] };
      newReport.runhourTag = $scope.reportGeneration.runhourTag;
      newReport.runhourTag.periodStartValue = runHourStartValue;
      newReport.runhourTag.periodEndValue = runHourEndValue;
      newReport.periodStartTime = runHourStartValue.Timestamp;
      newReport.periodEndTime = runHourEndValue.Timestamp;
      newReport.periodNumber = periodNumber;
      newReport.fourDigitPeriodNumber = (("00000" + newReport.periodNumber).slice(-4));
      newReport.filename = $scope.getCurrentFileName(newReport.fourDigitPeriodNumber);

      var currentTime = Date.now();
      if ($scope.currentPlantReportSettings.reportType === 'hydra') {
        //hydra format .R02
        newReport.csvFile = '[Header]\r\n' +
          'Lay-out version=\t3.0\r\n' +
          'Date=\t' + $filter('date')(currentTime, 'yyyy-MM-dd') + '\r\n' + //current date
          'Time=\t' + $filter('date')(currentTime, 'HH:mm') + '\r\n' + //current time
          'Plant name=\t' + $scope.getCurrentPlantID(true) + '\r\n' +
          'Reactor name=	R101\r\n' +
          'Group name=\t' + $scope.currentPlantReportSettings.experimentName + '\r\n' +
          'Experiment nr=\t' + $scope.currentPlantReportSettings.experimentNumber + '\r\n' +
          'Condition ID=\t' + $scope.currentPlantReportSettings.periodName + '\r\n' +
          'Period nr=\t' + newReport.fourDigitPeriodNumber + '\r\n' + //use period number with the offset
          'Period start date=\t' + $filter('date')(newReport.periodStartTime, 'yyyy-MM-dd') + '\r\n' +
          'Period start time=\t' + $filter('date')(newReport.periodStartTime, 'HH:mm') + '\r\n' +
          'Period end date=\t' + $filter('date')(newReport.periodEndTime, 'yyyy-MM-dd') + '\r\n' +
          'Period end time=\t' + $filter('date')(newReport.periodEndTime, 'HH:mm') + '\r\n' +
          'Start run hour=\t' + $filter('number')(newReport.runhourTag.periodStartValue.Value, 1) + '\r\n' +
          'End run hour=\t' + $filter('number')(newReport.runhourTag.periodEndValue.Value, 1) + '\r\n' +
          '[Data]\r\n' +
          'Tagnames\tSI-units\tMinimum\tMaximum\tAverage\tDeviation\tFirstval\tLastval\r\n';
      }
      else {//runlist format .nox
        newReport.csvFile = 'DATACOL\r\n' +
          '\r\n' +
          '***PERIOD ' + $scope.currentPlantReportSettings.periodName + '' + newReport.fourDigitPeriodNumber + '\r\n' +
          '\r\n' +
          //Period Number must be 4 digits
          '    PLANT ' + $scope.getCurrentPlantID(true) + ' PERIOD ' + $scope.currentPlantReportSettings.periodName + '' +  newReport.fourDigitPeriodNumber  + '  RUNLIST REPORT        EXPERIMENT NR ' + $scope.currentPlantReportSettings.experimentNumber + '\r\n' +
          '    PERIOD START TIME ' + $filter('date')(newReport.periodStartTime, 'HH:mm:ss') + '  ' + $filter('date')(newReport.periodStartTime, 'dd MMM yyyy').toUpperCase() + '  START RUN HOUR ' + $filter('number')(newReport.runhourTag.periodStartValue.Value, 1) + '\r\n' +
          '    PERIOD END   TIME ' + $filter('date')(newReport.periodEndTime, 'HH:mm:ss') + '  ' + $filter('date')(newReport.periodEndTime, 'dd MMM yyyy').toUpperCase() + '  END   RUN HOUR ' + $filter('number')(newReport.runhourTag.periodEndValue.Value, 1) + '\r\n' +
          '   NAME     MINIMUM    MAXIMUM    AVERAGE   DEVIATION  FIRST VAL   LAST VAL\r\n';
      }

      var webIDsShortened = [];
      newReport.summaryData = [];
      newReport.sampledData = [];
      //add the selected tags to the report tags list
      //more than ~40 can't fit in one URL / call (restriction of PI Web API 2015 R2, newer versions allow batch calls)
      newReport.asyncCallsStillWaiting = 0;
      newReport.finishedSendingAllCalls = false;
      $scope.currentPlantReportSettings.selectedTags.forEach(function (tag, index) {
        newReport.tags.push(tag);
        newReport.webIDs.push(tag.WebID);
        webIDsShortened.push(tag.WebID);
        if ((index > 0 && index % 30 === 0) || (index + 1) === $scope.currentPlantReportSettings.selectedTags.length) {
          //set up a counter

          //get the calculated values
          PIWebCalls.CalculatedValues.get({
            webid: webIDsShortened,
            startTime: newReport.periodStartTime,
            endTime: newReport.periodEndTime,
            summaryType: ['Average', 'Minimum', 'Maximum', 'StdDev']
          }, function (resp) {
            // console.log(resp);
            newReport.summaryData = newReport.summaryData.concat(resp.Items);
            // newReport.summaryData = PIWebCalls.reformatArray(resp.Items, 'WebId');
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
          $scope.totalAsyncCallsSent++;

          //get the first and last values
          PIWebCalls.SampledValues.get({
            webid: webIDsShortened,
            startTime: newReport.periodStartTime,
            endTime: newReport.periodEndTime,
            interval: Math.floor((new Date(newReport.periodEndTime) - new Date(newReport.periodStartTime)) / 1000) + 's'
          }, function (resp) {
            // console.log(resp);
            newReport.sampledData = newReport.sampledData.concat(resp.Items);
            // newReport.sampledData = PIWebCalls.reformatArray(resp.Items, 'WebId');
            newReport.asyncCallsStillWaiting--
            $scope.totalAsyncCallsFinished++;
            //check;       
            //in non blocking way
            setTimeout($scope.checkAndFinishReport(newReport), 0);

          }, function (resp) {
            //there was an error
            $scope.errorPush({ "Error with getting first and last value data for tags": resp });
          });
          newReport.asyncCallsStillWaiting++;
          $scope.totalAsyncCallsSent++;
          webIDsShortened = [];
        }
      });
      newReport.finishedSendingAllCalls = true;
      //check once more   
      setTimeout($scope.checkAndFinishReport(newReport), 0);

    };
    /**
     * Checks if there are any outstanding async calls still waiting
     * if not, finishes the report and pushes it to be available for download
     * 
     * @param {any} newReport 
     */
    $scope.checkAndFinishReport = function (newReport) {
      if (newReport.finishedSendingAllCalls && newReport.asyncCallsStillWaiting === 0) {
        newReport.summaryData = PIWebCalls.reformatArray(newReport.summaryData, 'WebId');
        newReport.sampledData = PIWebCalls.reformatArray(newReport.sampledData, 'WebId');
        newReport.tags.forEach(function (tag, index) {
          if ($scope.currentPlantReportSettings.reportType === 'hydra') {//Hydra .R02
            newReport.csvFile += tag.Name + '\t' + (tag.UoM === undefined ? '' : tag.UoM) + '\t' +
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 1).toString() + '\t' +//minimum, this is just the order it is returned by PI web API 
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 2).toString() + '\t' +//maximum
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 0).toString() + '\t' +//average
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 3).toString() + '\t' +//std
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 0).toString() + '\t' +//firstval
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 1).toString() +//lastval
              '\r\n';
          }
          else {//runlist .nox
            //tagname must be shortened to 10 chars
            var tagShortName = ' ' + tag.Name.replace('STCA', '').substr(4, 10);
            while (tagShortName.length < 12) //need to add spaces if < 11 characters
            {
              tagShortName += ' ';
            }
            newReport.csvFile += tagShortName +
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 1, 5).toString().substr(0, 7) + '    ' +//minimum, this is just the order it is returned by PI web API 
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 2, 5).toString().substr(0, 7) + '    ' +//maximum
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 0, 5).toString().substr(0, 7) + '    ' +//average
              $scope.getPrintableValue(newReport.summaryData, tag.WebID, 3, 5).toString().substr(0, 7) + '    ' +//std
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 0, 5).toString().substr(0, 7) + '    ' +//firstval
              $scope.getPrintableValue(newReport.sampledData, tag.WebID, 1, 5).toString().substr(0, 7) + '\r\n';//lastval
          }
        });
        if ($scope.currentPlantReportSettings.reportType === 'run') {
          newReport.csvFile += '\r\n***END OF LIST';
        }
        $scope.reportGeneration.generatedReports.push(newReport);

        //automatically update the periods 
        if ($scope.reportGeneration.periodsCount === $scope.reportGeneration.generatedReports.length) {
          $scope.currentPlantReportSettings.periodNumber += $scope.reportGeneration.periodsCount;

          //check if event tag dialog is open. if it is, skip this message because it causes weird scroll issues
          if ($scope.eventTagValuesDialogPromise == null || $scope.eventTagValuesDialogPromise.$$state.status !== 0) {
            $mdToast.showSimple("Updating Period Count to '" + $scope.currentPlantReportSettings.periodNumber + "' and saving your settings");
          }
          $scope.savePreferences(false);
        }

      }
    };


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
        return $filter('number')(Value.Value, decimals);
      }
      else if (Value != null && typeof Value === 'number') {
        //return the value to 4 decimal places
        return $filter('number')(Value, decimals);
      }
      else
        return $filter('number')(0, decimals);
    };

    //helper function to get the file name based on the currently set variables
    $scope.getCurrentFileName = function (periodNumber) {
      if ($scope.currentPlantReportSettings == null) {
        return '_.NOX';
      }
      //default value for period number
      periodNumber = (typeof periodNumber !== 'undefined') ? periodNumber : $scope.currentPlantReportSettings.periodNumber;
      if (!$scope.currentPlantReportSettings.reportFileNameWithExpPerNums) {
        return 'plant' + $scope.getCurrentPlantID(true) + ($scope.currentPlantReportSettings.reportType === 'hydra' ? '.R02' : '.NOX');
      }
      else {
        if ($scope.currentPlantReportSettings.reportType === 'hydra') {
          return $scope.currentPlantReportSettings.experimentName + $scope.currentPlantReportSettings.experimentNumber + '-' + $scope.currentPlantReportSettings.periodName + periodNumber + '.R02';
        }
        else {
          return $scope.currentPlantReportSettings.experimentName + '_' + $scope.currentPlantReportSettings.experimentNumber + '_' + $scope.currentPlantReportSettings.periodName + '_' + periodNumber + '.NOX';
        }
      }
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
      } else {

        //create an invisible link to a 'blob' of the report, and 'click' it to download it
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

    /**
     * function that, when clicked, downloads all available reports
     * 
     */
    $scope.downloadAll = function () {

      $scope.reportGeneration.generatedReports.forEach(function (report, index) {
        $scope.openReport(index);
      });
    };
  }]);
})();