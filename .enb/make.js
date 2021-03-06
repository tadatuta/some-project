var fs = require('fs'),
	path = require('path'),
	techs = {
		htmlBeautify: require('enb-beautify/techs/enb-beautify-html'),
		// essential
		fileProvider: require('enb/techs/file-provider'),
		fileMerge: require('enb/techs/file-merge'),

		// optimization
		borschik: require('enb-borschik/techs/borschik'),

		// css
		cssStylus: require('enb-stylus/techs/css-stylus'),
		cssAutoprefixer: require('enb-autoprefixer/techs/css-autoprefixer'),

		// js
		browserJs: require('enb-diverse-js/techs/browser-js'),
		prependYm: require('enb-modules/techs/prepend-modules'),

		// bemtree
		// bemtree: require('enb-bemxjst/techs/bemtree-old'),

		// bemhtml
		bemhtml: require('enb-bemxjst/techs/bemhtml-old'),
		htmlFromBemjson: require('enb-bemxjst/techs/html-from-bemjson')

	},
	enbBemTechs = require('enb-bem-techs'),
	merged = require('./techs/merged'),
	levels = [
		{ path: 'libs/bem-core/common.blocks', check: false },
		{ path: 'libs/bem-core/desktop.blocks', check: false },
		'desktop.blocks',
		'form.blocks',
		'template.blocks'
	];

module.exports = function(config) {
	var isProd = process.env.YENV === 'production',
		mergedBundleName = 'merged',
		pathToMargedBundle = path.join('desktop.bundles', mergedBundleName);

	fs.existsSync(pathToMargedBundle) || fs.mkdirSync(pathToMargedBundle);

	merged(config, pathToMargedBundle);

	config.nodes('*.bundles/*', function(nodeConfig) {
		var isMergedNode = path.basename(nodeConfig.getPath()) === mergedBundleName;

		isMergedNode || nodeConfig.addTechs([
			[techs.fileProvider, { target: '?.bemjson.js' }],
			[enbBemTechs.bemjsonToBemdecl]
		]);

		nodeConfig.addTechs([
			// essential
			[enbBemTechs.levels, { levels: levels }],
			[enbBemTechs.depsOld],
			[enbBemTechs.files],

			// css
			[techs.cssStylus, { target: '?.noprefix.css' }],
			[techs.cssAutoprefixer, {
				sourceTarget: '?.noprefix.css',
				destTarget: '?.css',
				browserSupport: ['last 20 versions', 'IE > 8', 'Opera > 11', 'Firefox >= 5', 'Chrome > 10']
			}],

			// bemtree
			// [techs.bemtree, { devMode: process.env.BEMTREE_ENV === 'development' }],

			// bemhtml
			[techs.bemhtml, { devMode: process.env.BEMHTML_ENV === 'development' }],
			[techs.htmlFromBemjson],

			// client bemhtml
			[enbBemTechs.depsByTechToBemdecl, {
				target: '?.bemhtml.bemdecl.js',
				sourceTech: 'js',
				destTech: 'bemhtml'
			}],
			[enbBemTechs.deps, {
				target: '?.bemhtml.deps.js',
				bemdeclFile: '?.bemhtml.bemdecl.js'
			}],
			[enbBemTechs.files, {
				depsFile: '?.bemhtml.deps.js',
				filesTarget: '?.bemhtml.files',
				dirsTarget: '?.bemhtml.dirs'
			}],
			[techs.bemhtml, {
				target: '?.browser.bemhtml.js',
				filesTarget: '?.bemhtml.files',
				devMode: process.env.BEMHTML_ENV === 'development'
			}],

			// js
			[techs.browserJs],
			[techs.fileMerge, {
				target: '?.pre.js',
				sources: ['?.browser.bemhtml.js', '?.browser.js']
			}],
			[techs.prependYm, { source: '?.pre.js' }],

			// borschik
			[techs.borschik, { sourceTarget: '?.js', destTarget: '_?.js', freeze: true, minify: isProd }],
			[techs.borschik, { sourceTarget: '?.css', destTarget: '_?.css', tech: 'cleancss', freeze: true, minify: isProd }],

			//Beautify
			[techs.htmlBeautify]
		]);

		nodeConfig.addTargets([/* '?.bemtree.js', */ '_?.css', '_?.js']);
		isMergedNode || nodeConfig.addTargets(['?.html']);
	});
};