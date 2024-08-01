module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
	  '**/*.{html,js,css,png,jpg,svg,gif,eot,ttf,woff,woff2,ico,json,webmanifest}'
	],
	swDest: 'dist/sw.js',
	runtimeCaching: [{
	  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|eot|ttf|woff|woff2|ico|json|webmanifest)$/,
	  handler: 'CacheFirst',
	  options: {
		cacheName: 'images',
		expiration: {
		  maxEntries: 50,
		},
	  },
	}, {
	  urlPattern: new RegExp('^https://fonts\\.googleapis\\.com/'),
	  handler: 'StaleWhileRevalidate',
	  options: {
		cacheName: 'google-fonts-stylesheets',
	  },
	}, {
	  urlPattern: new RegExp('^https://fonts\\.gstatic\\.com/'),
	  handler: 'CacheFirst',
	  options: {
		cacheName: 'google-fonts-webfonts',
		expiration: {
		  maxEntries: 50,
		},
	  },
	}],
  };
  