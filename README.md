node-vcard
==========

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

	npm install node-vcard

Usage
-----

An example usage is provided in bin/vcard-to-json.js but it's essense
is reproduced here:

	var vCard = require('vcard');
	var card  = new vCard();
	card.parseFile("input.vcf");

Author
-------

Copyright (C) 2012 Jasper Lievisse Adriaanse <jasper@humppa.nl>

Distributed under the MIT/X11 license (see the file COPYING)
