/*
 * List of valid fields in all vCard versions.
 */

module.exports.singleText = [
	'AGENT',
	'BDAY',
	'BEGIN',
	'END',
	'FN',
	'FULLNAME',
	'GEO',
	'MAILER',
	'NICKNAME',
	'NOTE',
	'REV',
	'ROLE',
	'TITLE',
	'TZ',
	'UID',
	'URL',
	'VERSION',
	'PRODID'
];

module.exports.multipleText = [
	'CATEGORIES',
	'NICKNAME',
	'ORG'
];

module.exports.singleBinary = [
	'KEY',
	'LOGO',
	'PHOTO',
	'SOUND'
];

module.exports.rfc2425 = [
	'NAME',
	'PROFILE',
	'SOURCE'
];

module.exports.structured = [
	'ADR',
	'EMAIL',
	'LABEL',
	'N',
	'PHOTO',
	'TEL'
];
