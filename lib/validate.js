/*
 * List of valid fields in all vCard versions.
 */

module.exports.simple_fields = [
	'BEGIN',
	'END',
	'LOGO',
	'PHOTO',
	'LABEL',
	'FN',
	'TITLE',
	'SOUND',
	'VERSION',
	'TEL',
	'EMAIL',
	'TZ',
	'GEO',
	'NOTE',
	'URL',
	'BDAY',
	'ROLE',
	'REV',
	'UID',
	'KEY',
	'MAILER',
	'ORG'
];

var rfc2425 = [
	'SOURCE',
	'NAME',
	'PROFILE'
];

module.exports.structured_fields = [
	'TEL',
	'ADR',
	'N',
];