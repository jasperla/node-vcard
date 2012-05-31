#!/usr/bin/env node

var util  = require('util');
var vCard = require('../vcard');

var card = new vCard();
card.readFile("tests/vcard.vcf", function(err, json){
		if (err) {
			console.error(err);
		}
		if (json) {
			console.log(util.inspect(json));
		}
});
