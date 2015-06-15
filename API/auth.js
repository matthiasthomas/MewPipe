var config = require(__dirname + "/config.js").config;
var User = require(__dirname + "/models/User.js").User;
var localStrategy = require('passport-local').Strategy;
var googleStrategy = require('passport-google-oauth').OAuth2Strategy;
var facebookStrategy = require('passport-facebook').Strategy;
var supinfoStrategy = require('passport-supinfo').Strategy;
var passport = require('passport');
var bcrypt = require("bcrypt-nodejs");
var crypto = require("crypto");
var async = require('async');
passport.sessions = [];


passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

/**
 * auth LOCAL
 **/
passport.use(new localStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},
	function(email, password, done) {
		process.nextTick(function() {
			var key;
			async.waterfall([
					// Create the token key
					function(callback) {
						crypto.randomBytes(48, callback);
					},
					// Get the user
					function(randomKey, callback) {
						key = randomKey.toString("hex");
						User.findOne({
								email: email,
								accessToken: bcrypt.hashSync(password, config.salt)
							})
							.select("firstname lastname email accessToken")
							.lean()
							.exec(callback);
					},
					function(user, callback) {
						if (user) {
							user.token = key;
							var ttlToken = Math.round(+new Date() / 1000) + config.ttlToken;
							for (var i = 0; i < passport.sessions.length; i++) {
								if (String(passport.sessions[i].userId) == String(user._id)) {
									passport.sessions.splice(i, 1);
								}
							}
							passport.sessions.push({
								userId: user._id,
								token: user.token,
								ttl: ttlToken
							});
							return done(null, user);
						} else {
							return done("Check your username and password.");
						}
					}
				],
				function(error) {
					console.log(error);
				});
		});
	}
));

/**
 * oAuth GOOGLE
 **/
passport.use(new googleStrategy({
		clientID: config.oauth.google.clientId,
		clientSecret: config.oauth.google.clientSecret,
		callbackURL: "/auth/google/callback"
	},
	function(accessToken, refreshToken, profile, done) {
		process.nextTick(function() {
			var key;
			async.waterfall([
					// Create the token key
					function(callback) {
						crypto.randomBytes(48, callback);
					},
					// Find the user
					function(randomKey, callback) {
						key = randomKey.toString("hex");
						User.findOne({
								accessToken: profile._json.id
							})
							.select("firstname lastname email accessToken")
							.lean()
							.exec(callback);
					},
					// Return it or create it
					function(user, callback) {
						if (user) {
							user.token = key;
							var ttlToken = Math.round(+new Date() / 1000) + config.ttlToken;
							for (var i = 0; i < passport.sessions.length; i++) {
								if (String(passport.sessions[i].userId) == String(user._id)) {
									passport.sessions.splice(i, 1);
								}
							}
							passport.sessions.push({
								userId: user._id,
								token: user.token,
								ttl: ttlToken
							});
							return done(null, user);
						} else {
							user = {
								firstname: profile._json.name.givenName,
								lastname: profile._json.name.familyName,
								email: profile._json.emails[0].value,
								accessToken: profile._json.id,
								birthdate: profile._json.birthday
							};
							var newUser = new User(user);
							user.token = key;
							var ttlToken = Math.round(+new Date() / 1000) + config.ttlToken;
							newUser.save(function(error, newUser) {
								if (error) {
									console.log(error);
								}
								for (var i = 0; i < passport.sessions.length; i++) {
									if (String(passport.sessions[i].userId) == String(newUser._id)) {
										passport.sessions.splice(i, 1);
									}
								}
								passport.sessions.push({
									userId: newUser._id,
									token: user.token,
									ttl: ttlToken
								});
								return done(error, user);
							});
						}
					}
				],
				function(error) {

				});
		});
	}
));

/**
 * oAuth FACEBOOK
 **/
passport.use(new facebookStrategy({
		clientID: config.oauth.facebook.clientId,
		clientSecret: config.oauth.facebook.clientSecret,
		callbackURL: "/auth/facebook/callback",
		enableProof: false
	},
	function(accessToken, refreshToken, profile, done) {
		process.nextTick(function() {
			var key;
			async.waterfall([
				// Create a random key which will be our user token
				function(callback) {
					crypto.randomBytes(48, callback);
				},
				// Get the user
				function(randomKey, callback) {
					key = randomKey.toString("hex");
					// Check if the user already exists in the db
					User.findOne({
							accessToken: profile._json.id
						})
						.select("firstname lastname email accessToken")
						.lean()
						// Return the user to the next level
						.exec(callback);
				},
				function(user, callback) {
					// If the user does exists in the db
					if (user) {
						user.token = key;
						// Create the Time To Live for our token (date.now + default time to live)
						var ttlToken = Math.round(+new Date() / 1000) + config.ttlToken;
						// Loop through passport sessions
						for (var i = 0; i < passport.sessions.length; i++) {
							// If the user already has an opened session
							if (String(passport.sessions[i].userId) == String(user._id)) {
								// Delete it
								passport.sessions.splice(i, 1);
							}
						}
						// Push its new sessions in the array
						passport.sessions.push({
							userId: user._id,
							token: user.token,
							ttl: ttlToken
						});
						return done(null, user);
					} else {
						// create the new user to add to the DB
						user = {
							firstname: profile._json.first_name,
							lastname: profile._json.last_name,
							email: profile._json.email,
							accessToken: profile._json.id,
							birthdate: profile._json.birthday
						};
						var newUser = new User(user);
						user.token = key;
						var ttlToken = Math.round(+new Date() / 1000) + config.ttlToken;
						newUser.save(function(error, newUser) {
							if (error) {
								console.log(error);
							}
							for (var i = 0; i < passport.sessions.length; i++) {
								if (String(passport.sessions[i].userId) == String(newUser._id)) {
									passport.sessions.splice(i, 1);
								}
							}
							passport.sessions.push({
								userId: newUser._id,
								token: user.token,
								ttl: ttlToken
							});
							return done(error, user);
						});
					}
				}
			], function(error) {
				if (error) console.log(error);
				return;
			});
		});
	}
));

/**
 * openId SUPINFO
 **/
passport.use(new supinfoStrategy({
		returnURL: 'http://' + config.server.address + ':' + config.server.port + '/auth/supinfo/callback',
		realm: 'http://' + config.server.address + ':' + config.server.port + '/',
		profile: true
	},
	function(identifier, profile, done) {
		process.nextTick(function() {
			crypto.randomBytes(48, function(error, randomKey) {
				var key = randomKey.toString("hex");
				User.findOne({
						accessToken: profile.boosterId
					})
					.select("firstname lastname email accessToken")
					.lean()
					.exec(function(error, user) {
						if (user) {
							user.token = key;
							var ttlToken = Math.round(+new Date() / 1000) + config.ttlToken;
							for (var i = 0; i < passport.sessions.length; i++) {
								if (String(passport.sessions[i].userId) == String(user._id)) {
									passport.sessions.splice(i, 1);
								}
							}
							passport.sessions.push({
								userId: user._id,
								token: user.token,
								ttl: ttlToken
							});
							return done(null, user);
						} else {
							var user = {
								firstname: profile.firstname,
								lastname: profile.lastname,
								email: profile.email,
								accessToken: profile.boosterId
							};
							var newUser = new User(user);
							user.token = key;
							var ttlToken = Math.round(+new Date() / 1000) + config.ttlToken;
							newUser.save(function(error, newUser) {
								if (error) {
									console.log(error);
								}
								for (var i = 0; i < passport.sessions.length; i++) {
									if (String(passport.sessions[i].userId) == String(newUser._id)) {
										passport.sessions.splice(i, 1);
									}
								}
								passport.sessions.push({
									userId: newUser._id,
									token: user.token,
									ttl: ttlToken
								});
								return done(error, user);
							});
						}
					});
			});
		});
	}
));


supinfoStrategy.prototype._parseProfileExt = function(params) {
  var profile = {};
  var identifier = params.claimedIdentifier.split('/');
  var fullName = params.fullname.split(' ');
  profile.boosterId = identifier[identifier.length - 1];
  profile.firstname = fullName[0];
  profile.lastname = fullName[fullName.length - 1];
  profile.email = profile.boosterId+"@supinfo.com";
  return profile;
};

module.exports = passport;