import * as fs from 'fs';
import * as u from 'underscore';
import * as validFields from './lib/fields';

class vCard {
  /*
     * Read file from disk, validate and parse it.
     */
  readFile(file: any, cb: any) {
    if (fs.existsSync(file)) {
      /* now read the data and pass it to getValidationError() */
      let data;
      try {
        data = fs.readFileSync(file, 'utf-8');
      } catch (error) {
        cb(error);
      }

      this.readData(data, function (err: any, json: any) {
        if (err) {
          cb(err);
        } else {
          cb(null, json);
        }
      });

    } else {
      cb(file + ' not found.Does it exist ? ');
    }
  };

  /*
   * Read the vCard data (as String), validate and parse it.
   */
  readData(card: any, cb: any) {
    let vCards: any, vCardsParsed: any, errors: any, validationError: any, data: any, i: any, vCardCount: any;
    // Massage the data from a string to an array,
    // which makes parsing it later on a lot easier.
    // We only split if a character is directly after a
    // newline because of Base64 PHOTOS.
    data = card.split(/\r\n(?=\S)|\r(?=\S)|\n(?=\S)/);

    // Support for multiple vcards into a file
    // gmail exports the contacts like that:
    // https://support.google.com/mail/answer/1069522?hl=en (export & backup)
    //
    // An array of array elements of lines, in the following format:
    // [['BEGIN:VCARD', ... , 'END:VCARD'], ['BEGIN:VCARD', ... , 'END:VCARD']]
    //
    // A normal vcard file should end up creating just a single element vcards array
    vCards = [[]];
    vCardCount = 0;
    for (i = data.length - 1; i >= 0; i--) {
      // Remove the following things:
      // * empty lines, e.g. in Base64 PHOTOS or at the end
      // * Apple's strange 'item1.' prefix.
      data[i] = data[i].replace(/^item\d+\.|\r\n\s*|\r\s*|\n\s*/g, '');

      // Push each line into the current vCard element
      vCards[vCardCount].unshift(data[i]);

      // scenario: line is vcard start indicator but is not the first line
      // action: push a new vcard element into the array to push lines into
      if (data[i].toUpperCase() === 'BEGIN:VCARD' && i !== 0) {
        ++vCardCount;
        vCards.push([]);
      }
    }

    errors = [];
    vCardsParsed = [];
    vCardCount = 0;

    for (i = 0; i < vCards.length; ++i) {
      validationError = this.getValidationError(vCards[i]);
      if (validationError) {
        errors.push(validationError);
        tryCallback();
      } else {
        this.parsevCard(vCards[i], function (err: any, json: any) {
          if (err) {
            errors.push(err);
          } else if (json) {
            vCardsParsed.push(json);
          }
          tryCallback();
        });
      }
    }

    function tryCallback() {
      if (++vCardCount === vCards.length) {
        if (errors.length > 0) {
          cb(errors.length === 1 ? errors[0] : errors);
        } else {
          cb(null, vCardsParsed.length === 1 ? vCardsParsed[0] : vCardsParsed);
        }
      }
    }

  };


  putValueInObject(json: any, key: any, value: any, fields: any) {
    if (json[key]) {
      if (value.type && value.type.length > 0) {
        const found: any = value.type.find( (t: any) => t.indexOf('=') !== -1) || value.type[0];
        const newKey = key + '-' + found.replace(/TYPE=/g, '');
        if (!json[newKey]) {
          json[newKey] = value;
          return;
        }
      }
      const split = fields[0].split(';');
      for (const index in split) {
        if (!index) {
          continue;
        }
        const newKey = key + '-' + split[index];
        if (!json[newKey]) {
          json[newKey] = value;
          return;
        }
      }
      json[key] = value;
    } else {
      json[key] = value;
    }
  };

  /*
	 * Parse the validated vCard data.
	 * If an error occurs cb(err, null) get's called, otherwise cb(null, json)
	 * with the valid JSON data.
	 */
  parsevCard(data: any, cb: any) {
    let inserted = 0;
    const json: any = {};
    const version = this.getVersion(data);

    for (let f = data.length - 1; f >= 0; f--) {
      const fields = data[f].split(':');

      /* Don't bother puting this fluff into the JSON. */
      if (fields[0].toUpperCase() === 'BEGIN' || fields[0].toUpperCase() === 'END') {
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
    for (let f = data.length - 1; f >= 0; f--) {
      /* XXX: Don't split on http:// .. */
      const fields = data[f].split(':');

      /* Don't bother puting this fluff into the JSON. */
      if (fields[0].toUpperCase() === 'BEGIN' || fields[0].toUpperCase() === 'END') {
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
      *  TEL: { type: [ 'VOICE', 'WORK' ], value: '(111) 555-1212' },
      */

      const d = fields[0].split(';');
      const snippet: any = {};
      const type = [];

      if (version === 3.0) {
        /* Strip off 'TYPE' argument before doing anything else. */
        if (d[1]) {
          d[1] = d[1].replace(/TYPE=/g, '');
        }
      }

      if (version === 2.1 || version === 3.0) {
        /* If we have a structured field, handle the extra
           data before the ':' as types. */
        for (let i = d.length - 1; i >= 1; i--) {
          type.push(d[i]);
        }

        /*
         * Some fields can be structured, but are still
         * just single. So test for that.
                 */
        if (type.length > 0) {
          snippet.type = type;
          snippet.value = fields[1];
          this.putValueInObject(json, d[0], snippet, fields);
        } else {
          /* Be sure to remove any left over control chars, but give a special treat to N */
          if (d[0] === 'N') {
            this.putValueInObject(json, d[0], fields[1].replace(/;+$/g, '').replace(/;/, ', ').replace(/ $/, ''), fields);
          } else {
            this.putValueInObject(json, d[0], fields[1].replace(/;/g, ' '), fields);
          }
        }
      } else if (version === 4) {
        const label: any = [];

        /* Use the TYPE, LABEL and VALUE fields to pop extra data into the snippet. */
        for (let i = d.length - 1; i >= 1; i--) {
          if (d[i].match(/TYPE/)) {
            /* This can be a nested type..split it. */
            const t = d[i].replace(/TYPE=/g, '').replace(/\"/g, '').split(',');
            for (let j = t.length - 1; j >= 0; j--) {
              type.push(t[j]);
            }
          } else if (d[i].match(/LABEL/)) {
            /* Certain labels are quoted, so unquote them now. */
            label.push(d[i].replace(/LABEL=/g, '').replace(/\"/g, ''));
          } else if (d[i].match(/VALUE/)) {
            // value.push(d[i].replace(/VALUE=/g, ''));
          }
        }

        /*
				 * Some fields can be structured, but are still
				 * just single. So test for that.
				 */
        if (type.length > 0) {
          snippet.type = type;
          if (label.length > 0) {
            snippet.value = label[0];
          } else {
            snippet.value = fields[2];
          }
          json[d[0]] = snippet;
        } else {
          /* Be sure to remove any left over control chars, but give a special treat to N */
          if (d[0] === 'N') {
            json[d[0]] = fields[1].replace(/;+$/g, '').replace(/;/, ', ').replace(/ $/, '');
          } else {
            json[d[0]] = fields[1].replace(/;/g, ' ');
          }
        }
      } else {
        /* wut?! */
        cb('Unknown version encountered: %s', version);
      }
    }

    if (inserted > 0) {
      cb(null, json);
    } else {
      cb('No JSON elements found?!');
    }
  };

  /*
	 * Do basic vCard data validation, check the version first and
	 * based on that handle the fields that may exist.
	 * Skipping any X- fields.
	 */
  getValidationError(data: any) {
    let required_elements_found = 0;

    /* Check for valid BEGIN/END fields. */
    if (data[0].toUpperCase() !== 'BEGIN:VCARD' || data[data.length - 1].toUpperCase() !== 'END:VCARD') {
      return 'BEGIN:VCARD or END:VCARD missing.';
    }

    /* Ensure at least the needed fields (VERSION, N and FN) exist, needed in all versions. */
    for (let f = data.length - 1; f >= 0; f--) {
      if (data[f].match(/^(VERSION|FN):/)) {
        required_elements_found++;
      }
    }

    if (required_elements_found.toString() !== '2') {
      return 'One or more required elements are missing (VERSION and FN)';
    }

    const version = this.getVersion(data);

    /* For version 3.0+, we'll also need an N field to be present. */
    if (version > 2.1) {
      for (let f = data.length - 1; f >= 0; f--) {
        if (data[f].match(/^N:/)) {
          required_elements_found++;
        }
      }
      if (required_elements_found !== 3) {
        return 'One or more required elements are missing (VERSION, N and FN)';
      }
    }

    /* XXX: If we run into a line that doesn't start with a field name, figure out what to do. */

    /*
		 * Walk through all the fields, and check if any of the fields aren't listed
		 * as valid or as an extensions.
		 */
    for (let f = data.length - 1; f >= 0; f--) {
      const field = data[f].replace(/(:|;).*/g, '');
      if (!(u.contains(validFields.singleText, field) ||
        u.contains(validFields.multipleText, field) ||
        u.contains(validFields.rfc2425, field) ||
        u.contains(validFields.singleBinary, field) ||
        u.contains(validFields.structured, field) ||
        field.match(/^X-.*/))) {
        return 'Invalid field found: `' + field + '`';
      }
    }
    return null;
  };

  /* Determine the version for the vCard. */
  getVersion(data: any) {
    let version;
    /* Figure out the version of the vCard format. */
    for (let f = data.length - 1; f >= 0; f--) {
      if (data[f].match(/VERSION/)) {
        version = data[f].split(':')[1];
      }
    }

    version = parseFloat(version);
    if (isNaN(version)) {
      return 0;
    } else {
      return version;
    }
  };
}

export  = vCard;
