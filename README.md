node-vcard
==========

**This project is looking for a maintainer! Please open an issue if you'd like to over.**

Introduction
------------

node-vcard parses vCard data into nice JSON. It can read files from
disk and then parse them with vCard.parseFile(), or the vCard data
can be passed to it for direct parsing with vCard.parse().

This module only does basic validation of the files, so if you have
NICKNAME field (added in version 3.0) in a 2.1 file and this causes
issues elsewhere in the chain, it's your responsibility for now.
Maybe in the future, it'll be ours...

Installation
------------

	npm install vcard

Usage
-----

Please have a look at the stripped demo in bin/vcard-to-json.js. But
basically you do:

	var util = require('util');
	var vCard = require('vcard');
	var card = new vCard();
	/* Use readFile() if the file is on disk. */
	card.readFile("path/to/file.vcf", function(err, json) {
		console.log(util.inspect(json));
	});
	/* Use readData() otherwise. */
	card.readData(String_with_vCard_data, function(err, json) {
		console.log(util.inspect(json));
	});
	
Running the Unit Tests
----------------------

Run the following commands to run the tests:

    npm install
    grunt

The tests will be run as soon as you change code or the vCards in the `spec/` folder.

To add a test, simply add a vCard to the `spec/` folder with the following name convention: `vCard-version-bug.vcf`

### Testing with private vCards

If you want to bulk test you private vCards without running into the risk of commiting them, create the following directory and add the files in there. They will be ignored by `git`.

    mkdir spec/private-vcards

Known bugs/limitations
----------------------

- Entries spanning multiple lines are currently treated as incorrect data.
- Multiple entries (such as two TEL) will result in only the first one
  being recorded into the final JSON.

Author
-------

Copyright (C) 2012 Jasper Lievisse Adriaanse <jasper@humppa.nl>

Distributed under the MIT/X11 license (see the file COPYING)
