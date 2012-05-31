#!/usr/bin/env node

var vCard = require('../vcard');
var card = new vCard();
card.readFile("tests/vcard.vcf", function(err, json){
		if (err) {
			console.error(err);
		}
});