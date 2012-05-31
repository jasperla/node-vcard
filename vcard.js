var fs       = require('fs');
var path     = require('path');
var u        = require('underscore');
var util     = require('util');
var validate = require('./lib/validate');

function vCard() {
	/*
	 * Read file from disk, validate and parse it.
	 */
	this.readFile = function(file, cb) {
		if (path.existsSync(file)) {
			/* now read the data and pass it to validatevCard() */
			var data;
			try {
				data = fs.readFileSync(file, 'ascii');
			} catch (error) {
				cb(error);
			}

			this.readData(data, function(err, json) {
				if (err) {
					cb(err);
				} else {
					cb(null, json);
				}
			});

		} else {
			cb(file + " not found. Does it exist?");
		}
	}

	/*
	 * Read the vCard data (as String), validate and parse it.
	 */
	this.readData = function(card, cb) {
		/*
		 * Massage the data from a string to an array,
		 * which makes parsing it later on a lot easier.
		 * Also remove any empty lines.
		 */
		var data = card.split("\n");
		for (var i = data.length-1; i >= 0; i--) {
			if (data[i] == "") {
				data.splice(i, 1);
				break;
			}
		}
		if (this.validatevCard(data)){
			/* valid */
			this.parsevCard(data, function(err, json){
				if (err) {
					cb(err);
				} else {
					cb(null, json);
				}
			});
		} else {
			cb(file + " does not contain valid vCard data.");
		}
	}

	/*
	 * Parse the validated vCard data.
	 * If an error occurs cb(err, null) get's called, otherwise cb(null, json)
	 * with the valid JSON data.
	 */
	this.parsevCard = function(data, cb) {
	}

	/*
	 * Do basic vCard data validation, check the version first and
	 * based on that handle the fields that may exist.
	 * Skipping any X- fields.
	 */
	this.validatevCard = function(data) {
		var invalid_field;
		var required_elements_found = 0;

		/* Check for valid BEGIN/END fields. */
		if (data[0] !== "BEGIN:VCARD" || data[data.length-1] !== "END:VCARD") {
			return false;
		}

		/* Ensure at least the needed fields (VERSION, N and FN) exist, needed in all versions. */
		for (var f = data.length-1; f >= 0; f--){
			if (data[f].match(/^(VERSION|FN):/)) {
				required_elements_found++;
			}
		}

		if (required_elements_found != '2') {
			return false;
		}

		/* Figure out the version of the vCard format. */
		for (var f = data.length-1; f >= 0; f--){
			if (data[f].match(/VERSION/)) {
				version = data[f].split(":")[1];
			}
		}

		var version = parseFloat(version);
		if (isNaN(version)) {
			return false;
		}

		/* For version 3.0+, we'll also need an N field to be present. */
		if (version > '2.1') {
			for (var f = data.length-1; f >= 0; f--){
				if (data[f].match(/^N:/)) {
					required_elements_found++;
				}
			}
			if (required_elements_found != '3') {
				return false;
			}
		}

		/*
		 * Walk through all the fields, and check if any of the fields aren't listed
		 * as valid or as an extensions.
		 */
		for (var f = data.length-1; f >= 0; f--){
			var field = data[f].replace(/(:|;).*/g, '');
			if (!(u.contains(validate.simple_fields, field) ||
			      u.contains(validate.structured_fields, field) ||
			      field.match(/^X-.*/))){
				return false;
			}
		}

		return true;
	}
};

module.exports = vCard;