module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,ttf,png,ico,html,json}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};