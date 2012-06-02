#!/usr/bin/env node

var util  = require('util');
var vCard = require('../vcard');

var file = process.argv[2] || "tests/vcard-4.0.vcf";
var card = new vCard();

card.readFile(file, function(err, json){
		if (err) {
			console.error(err);
		}
		if (json) {
			console.log(util.inspect(json));
		}
});
