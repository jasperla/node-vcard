var fs            = require('fs');
var path          = require('path');
var u             = require('underscore');
var util          = require('util');
var validFields   = require('./lib/fields');

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
			this.parsevCard(data, function(err, json){
				if (err) {
					cb(err);
				} else {
					cb(null, json);
				}
			});
		} else {
			cb("Invalid vCard data.");
		}
	}

	/*
	 * Parse the validated vCard data.
	 * If an error occurs cb(err, null) get's called, otherwise cb(null, json)
	 * with the valid JSON data.
	 */
	this.parsevCard = function(data, cb) {
		var inserted = 0;
		var json = {};
		var version = getVersion(data);

		for (var f = data.length-1; f >= 0; f--){
			var fields = data[f].split(":");

			/* Don't bother puting this fluff into the JSON. */
			if (fields[0] === "BEGIN" || fields[0] === "END") {
				continue;
			}

			/* Do the simple bits first, the singleText and extension fields. */
			if (u.contains(validFields.singleText, fields[0]) ||
			    u.contains(validFields.rfc2425, fields[0]) ||
			    fields[0].match(/^X-.*/)) {
				json[fields[0]] = fields[1];
				/* Shrink the data buffer with what has just been added. */
				data.splice(f, 1);
				inserted++;
			}
		}


		/* Now go through it again, but take care of structured fields. */
		for (var f = data.length-1; f >= 0; f--) {
			var fields = data[f].split(":");

			/* Don't bother puting this fluff into the JSON. */
			if (fields[0] === "BEGIN" || fields[0] === "END") {
				continue;
			}

			/*
			 * Based on the version we're looking at a different way the structured fields
			 * are declared. For example
			 * 2.1: TEL;WORK;VOICE:(111) 555-1212
			 * 3.0: TEL;TYPE=WORK,VOICE:(111) 555-1212
			 * 4.0: TEL;TYPE="work,voice";VALUE=uri:tel:+1-111-555-1212
			 *
			 * These will all result in:
			 * {
			 *    "tel":
			 *    {
			 *      "type":
			 *      [
			 *        "work",
			 *	  "voice"
			 *      ],
			 *      "value": "(111) 555-1212"
			 *    }
			 *  }
			 */
			if (version === 2.1) {
				var d = fields[0].split(";");
				var snippet = {};
				var type = [];

				/* If we have a structured field, handle the extra
				   data before the ':' as types. */
				for (var i = d.length-1; i >= 1; i--){
					type.push(d[i]);
				}

				/*
				 * Some fields can be structured, but are still
				 * just single. So test for that.
				 */
				if (type.length > 0) {
					snippet.type = type;
					snippet.value = fields[1];
					json[d[0]] = snippet;
				} else {
					json[d[0]] = fields[1];
				}
			} else if (version === 3) {

			} else if (version === 4) {

			} else {
				/* wut?! */
				cb("Unknown version encountered: %s", version);
			}
		}

		if (inserted > 0) {
			cb(null, json);
		} else {
			cb("No JSON elements found?!");
		}
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

		var version = getVersion(data);

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
			if (!(u.contains(validFields.singleText, field) ||
			      u.contains(validFields.multipleText, field) ||
			      u.contains(validFields.rfc2425, field) ||
			      u.contains(validFields.singleBinary, field) ||
			      u.contains(validFields.structured, field) ||
			      field.match(/^X-.*/))){
				return false;
			}
		}

		return true;
	}

	/* Determine the version for the vCard. */
	getVersion = function(data) {
		/* Figure out the version of the vCard format. */
		for (var f = data.length-1; f >= 0; f--){
			if (data[f].match(/VERSION/)) {
				version = data[f].split(":")[1];
			}
		}

		var version = parseFloat(version);
		if (isNaN(version)) {
			return 0;
		} else {
			return version;
		}
	}
};

module.exports = vCard;
