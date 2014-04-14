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
	'PRODID',
	'REV',
	'ROLE',
	'TITLE',
	'TZ',
	'UID',
	'URL',
	'VERSION'
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
	'IMPP',
	'LABEL',
	'N',
	'PHOTO',
	'TEL'
];
