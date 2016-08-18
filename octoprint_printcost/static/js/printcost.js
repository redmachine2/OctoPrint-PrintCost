/**
 * Created by redmachine2 on 8/16/2016.
 */
$(function() {
	function PrintCostViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];

		self.totalTime = ko.observable();
		self.totalUsage = ko.observable();
		self.isPrinting = ko.observable();
		self.pureData = {};
		self.newCost = ko.observable();

		self.listHelper = new ItemListHelper(
			"historyItems",
			{
				"fileNameAsc": function (a, b) {
					// sorts ascending
					if (a["fileName"].toLocaleLowerCase() < b["fileName"].toLocaleLowerCase()) return -1;
					if (a["fileName"].toLocaleLowerCase() > b["fileName"].toLocaleLowerCase()) return 1;
					return 0;
				},
				"fileNameDesc": function (a, b) {
					// sorts ascending
					if (a["fileName"].toLocaleLowerCase() < b["fileName"].toLocaleLowerCase()) return 1;
					if (a["fileName"].toLocaleLowerCase() > b["fileName"].toLocaleLowerCase()) return -1;
					return 0;
				},
				"timestampAsc": function(a, b) {
					// sorts descending
					if (a["timestamp"] > b["timestamp"]) return 1;
					if (a["timestamp"] < b["timestamp"]) return -1;
					return 0;
				},
				"timestampDesc": function(a, b) {
					// sorts descending
					if (a["timestamp"] > b["timestamp"]) return -1;
					if (a["timestamp"] < b["timestamp"]) return 1;
					return 0;
				},
				"printTimeAsc": function(a, b) {
					// sorts descending
					if (typeof (a["printTime"]) === 'undefined') return 1;
					if (typeof (b["printTime"]) === 'undefined') return 0;

					if (a["printTime"] > b["printTime"]) return 1;
					if (a["printTime"] < b["printTime"]) return -1;
					return 0;
				},
				"printTimeDesc": function(a, b) {
					// sorts descending
					if (typeof (a["printTime"]) === 'undefined') return 1;
					if (typeof (b["printTime"]) === 'undefined') return 0;

					if (a["printTime"] > b["printTime"]) return -1;
					if (a["printTime"] < b["printTime"]) return 1;
					return 0;
				}
			},
			{
				"successful": function(file) {
					return (file["success"] == true);
				}
			},
			"timestamp",
			[],
			["successful"],
			10
		);

		self.fileNameSort = function() {
			if (self.listHelper.currentSorting() == "fileNameAsc") {
				self.listHelper.changeSorting("fileNameDesc");
			} else {
				self.listHelper.changeSorting("fileNameAsc");
			}
		};

		self.timeStampSort = function() {
			if (self.listHelper.currentSorting() == "timestampDesc") {
				self.listHelper.changeSorting("timestampAsc");
			} else {
				self.listHelper.changeSorting("timestampDesc");
			}
		};

		self.printTimeSort = function() {
			if (self.listHelper.currentSorting() == "printTimeDesc") {
				self.listHelper.changeSorting("printTimeAsc");
			} else {
				self.listHelper.changeSorting("printTimeDesc");
			}
		};

		self.sortOrder = function(orderType) {
			var order = "";

			if (orderType == "fileName") {
				order = (self.listHelper.currentSorting() == 'fileNameAsc') ? '(' + _('ascending') + ')' : (self.listHelper.currentSorting() == 'fileNameDesc') ? '(' + _('descending') + ')' : '';
			} else if (orderType == "timestamp") {
				order = (self.listHelper.currentSorting() == 'timestampAsc') ? '(' + _('ascending') + ')' : (self.listHelper.currentSorting() == 'timestampDesc') ? '(' + _('descending') + ')' : '';
			} else {
				order = (self.listHelper.currentSorting() == 'printTimeAsc') ? '(' + _('ascending') + ')' : (self.listHelper.currentSorting() == 'printTimeDesc') ? '(' + _('descending') + ')' : '';
			}

			return order;
		};

		self.fromCurrentData = function (data) {
			var isPrinting = data.state.flags.printing;

			if (isPrinting != self.isPrinting()) {
				self.requestData();
			}

			self.isPrinting(isPrinting);
		};

		self.requestData = function(){
			$.ajax({
				url: 'plugin/printhistory/history',
				type: 'GET',
				dataType: 'json',
				success: self.fromResponse
			})
		};

		self.fromResponse = function(data) {
			//console.log('Callback - data: ' + data);

			var dataRows = [];
			self.pureData = data.history;
			var totalTime = 0;
			var totalUsage = {};
			var totalCost = 0;

			totalUsage["length"] = 0;
			totalUsage["volume"] = 0;

			_.each(_.keys(self.pureData), function(key) {
				dataRows.push({
					key: key,
					fileName: self.pureData[key].fileName,
					success: self.pureData[key].success,
					filamentUsage: (self.pureData[key].success == true) ? self.formatFilament(self.pureData[key]) : "-",
					filamentCost: self.calculateCost(self.pureData[key].filamentLength),
					timestamp: self.pureData[key].timestamp,
					printTime: self.pureData[key].printTime,
					note: self.pureData[key].hasOwnProperty('note') ? self.pureData[key].note : ""
				});

				totalTime += (self.pureData[key].printTime !== undefined) ? self.pureData[key].printTime : 0;
				if (self.pureData[key].success == true) {
					if (self.pureData[key].hasOwnProperty('filamentLength')) {
						totalUsage["length"] += self.pureData[key].filamentLength;
						totalUsage["volume"] += self.pureData[key].filamentVolume;
						totalCost += self.calculateCost(self.pureData[key].filamentLength);
					}

					if (self.pureData[key].hasOwnProperty('filamentLength2')) {
						totalUsage["length"] += self.pureData[key].filamentLength2;
						totalUsage["volume"] += self.pureData[key].filamentVolume2;
						totalCost += self.calculateCost(self.pureData[key].filamentLength2);
					}
				}
			});

			self.totalTime(formatDuration(totalTime));
			self.totalUsage(formatFilament(totalUsage));

			self.listHelper.updateItems(dataRows);

		};

		self.calculateCost = function(length){
			return +(parseFloat(self.newCost()) * parseFloat(length)).toFixed(2);
		};

		self.formatFilament = function(data) {
			var tool0 = "";
			var tool1 = "";
			var output = "";

			if (data.hasOwnProperty('filamentLength') && data.filamentLength != 0) {
				tool0 += formatFilament({length: data.filamentLength, volume: data.filamentVolume});
			}

			if (data.hasOwnProperty('filamentLength2') && data.filamentLength2 != 0) {
				tool1 += formatFilament({length: data.filamentLength2, volume: data.filamentVolume2});
			}

			if (tool0 !== "" && tool1 !== "") {
				output = "Tool0: " + tool0 + "<br>Tool1: " + tool1;
			} else {
				if (tool0 !== "") {
					output = tool0;
				} else {
					output = tool1;
				}
			}

			return output;
		};

		// This will get called before the PrintCostViewModel gets bound to the DOM, but after its
		// dependencies have already been initialized. It is especially guaranteed that this method
		// gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
		// the SettingsViewModel been properly populated.
		self.onBeforeBinding = function() {
			self.newCost(self.settings.settings.plugins.printcost.cost());
		};

		self.onStartupComplete = function(){
			self.requestData();
		}
	}

	// This is how our plugin registers itself with the application, by adding some configuration
	// information to the global variable OCTOPRINT_VIEWMODELS
	OCTOPRINT_VIEWMODELS.push([
		// This is the constructor to call for instantiating the plugin
		PrintCostViewModel,

		// This is a list of dependencies to inject into the plugin, the order which you request
		// here is the order in which the dependencies will be injected into your view model upon
		// instantiation via the parameters argument
		["settingsViewModel"],

		// Finally, this is the list of selectors for all elements we want this view model to be bound to.
		["#tab_plugin_printcost"]
	]);
});