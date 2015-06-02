/**
 * CONFIG
 **/
var config = require(__dirname + "/config.js").config;

/**
 * MODULES
 **/
var modules = {
	async: require('async'),
	fs: require("fs"),
	_: require('lodash-node'),
	crypto: require("crypto"),
	auth: require(__dirname + "/auth.js"),
	multipart: require('connect-multiparty'),
	url: require('url'),
	hbjs: require("handbrake-js"),
	path: require("path"),
	ffmpeg: require('fluent-ffmpeg'),
	bcrypt: require("bcrypt-nodejs")
};
var sessions = modules.auth.sessions;


/**
 * MODELS
 **/
var models = {};
modules.fs.readdirSync(__dirname + "/models").forEach(function(file) {
	var fileName = file.substr(0, file.length - 3);
	var fileExt = file.substr(-3);
	if (fileExt == ".js") {
		if (fileName != "bdd") {
			models[fileName] = require(__dirname + "/models/" + file)[fileName];
		}
	}
});

/**
 * EXPRESS
 **/
var express = require("express");
var errorHandler = require('errorhandler');
var bodyParser = require('body-parser');
var router = express.Router();
var morgan = require('morgan');
var http = require("http");
var app = express();
app.use(express.static(__dirname + '/../Client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(modules.auth.initialize());
app.use(modules.auth.session());
if (!config.debug) {
	app.use(errorHandler());
	app.use(morgan('combined', {}));
}

/**
 * MIDDLEWARES
 **/
var middlewares = require(__dirname + "/middlewares.js");
middlewares.controller(app, config, modules, models, middlewares, sessions);
app.all("*", middlewares.header);
app.use('/api', router);


/**
 * CONTROLLERS
 **/
modules.fs.readdirSync(__dirname + "/controllers").forEach(function(file) {
	if (file.substr(-3) == ".js") {
		route = require(__dirname + "/controllers/" + file);
		route.controller(app, router, config, modules, models, middlewares, sessions);
	}
});

/**
 * CREATE STORAGE DIR
 **/
modules.async.series([
	// Create data if it doesn't exists
	function(callback) {
		modules.fs.mkdir(__dirname + '/data/', function(error) {
			if (!error || error.code == 'EEXIST') return callback(null);
			return callback(error);
		});
	},
	// Create .tmp, videos and thumbnails folders if they do not exist
	function(callback) {
		modules.async.parallel([
			function(callbackSub) {
				modules.fs.mkdir(__dirname + '/data/.tmp', function(error) {
					if (!error || error.code == 'EEXIST') return callbackSub(null);
					return callbackSub(error);
				});
			},
			function(callbackSub) {
				modules.fs.mkdir(__dirname + '/data/videos', function(error) {
					if (!error || error.code == 'EEXIST') return callbackSub(null);
					return callbackSub(error);
				});
			},
			function(callbackSub) {
				modules.fs.mkdir(__dirname + '/data/thumbnails', function(error) {
					if (!error || error.code == 'EEXIST') return callbackSub(null);
					return callbackSub(error);
				});
			}
			// Throw an error if there was one during the creation of subfolders
		], function(error) {
			if (error) return callback(error);
			return callback(null);
		});
	},
	// Empty the tmp folder
	function(callback) {
		modules.fs.readdir(config.tmpDirectory, function(error, files) {
			files.forEach(function(file) {
				modules.fs.unlink(config.tmpDirectory + '/' + file, function(error) {
					return callback(error);
				});
			});
		});
	}
	// Log the error if there is one
], function(error, results) {
	if (error) return console.log(error);
});


/**
 * START LOGS
 **/
console.log("############################ ############################ ############################ ############################");
console.log("#          ***** Mew Pipe *****");
console.log("#          Started since: " + new Date().toISOString());
console.log("#          Environement: " + config.env);
if (true === config.debug) {
	console.log("#          Debug ON");
} else {
	console.log("#          Debug OFF");
}

/**
 * SERVER
 **/
http.createServer(app).listen(config.server.port, function() {
	console.log("#          API listening on " + config.server.address + ":" + config.server.port);
	console.log("############################ ############################ ############################ ############################");
});