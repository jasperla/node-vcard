#!/usr/bin/env node

var util  = require('util');
var vCard = require('../vcard');

var file = process.argv[2] || "tests/vcard-4.0.vcf";

var json = vCard.readFile(file);
console.log(util.inspect(json));
