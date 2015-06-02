module.exports.controller = function(app, router, config, modules, models, middlewares, sessions) {

	app.get('/auth/user', middlewares.checkAuth, function(req, res, next) {
		var id = req.user._id;
		models.User.findOne({
				_id: id
			})
			.select("_id firstname lastname email birthdate")
			.exec(function(err, user) {
				if (err) {
					if (config.debug === true) {
						console.log({
							"error_GET_auth/user": err
						});
					}
					res.json({
						"success": false,
						"error": "An error occurred."
					});
				} else {
					res.json({
						"success": true,
						"data": user
					});
				}
			});
	});


	/**
	 * auth LOCAL
	 **/
	app.post('/auth/local', function(req, res, next) {
		modules.auth.authenticate('local', {}, function(err, user, info) {
			if (err || !user) {
				return res.json({
					"success": false,
					"error": "Invalid email / password."
				});
			}
			req.login(user, function(err) {
				if (err) {
					return next(err);
				}
				//res.cookie('token', user.token, {expires: new Date(Date.now() + config.ttlToken*1000)});
				return res.json({
					"success": true,
					"data": {
						token: user.token
					}
				});
			});
		})(req, res, next);
	});


	/**
	 * oAuth GOOGLE
	 **/
	app.get('/auth/google', modules.auth.authenticate('google', {
		scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
	}));

	app.get('/auth/google/callback', function(req, res, next) {
		modules.auth.authenticate('google', {
			failureRedirect: '/#/auth/error'
		}, function(err, user) {
			if (err || !user) {
				return res.redirect('/#/auth/error');
			}
			req.login(user, function(err) {
				if (err) {
					return next(err);
				}
				//res.cookie('token', user.token, {expires: new Date(Date.now() + config.ttlToken*1000)});
				return res.redirect('/#/auth/success/' + user.token);
			});
		})(req, res, next);
	});


	/**
	 * oAuth FACEBOOK
	 **/
	app.get('/auth/facebook', modules.auth.authenticate('facebook', {
		authType: 'rerequest',
		scope: ['email', 'user_birthday']
	}));

	app.get('/auth/facebook/callback', function(req, res, next) {
		modules.auth.authenticate('facebook', {
			failureRedirect: '/#/auth/error'
		}, function(err, user) {
			if (err || !user) {
				return res.redirect('/#/auth/error');
			}
			req.login(user, function(err) {
				if (err) {
					return next(err);
				}
				//res.cookie('token', user.token, {expires: new Date(Date.now() + config.ttlToken*1000)});
				return res.redirect('/#/auth/success/' + user.token);
			});
		})(req, res, next);
	});


	/**
	 * openId SUPINFO
	 **/
	app.post('/auth/supinfo', modules.auth.authenticate('supinfo', {
		failureRedirect: '/#/auth/error'
	}));

	app.get('/auth/supinfo/callback', function(req, res, next) {
		modules.auth.authenticate('supinfo', {
			failureRedirect: '/#/auth/error'
		}, function(err, user) {
			if (err || !user) {
				return res.redirect('/#/auth/error');
			}
			req.login(user, function(err) {
				if (err) {
					return next(err);
				}
				//res.cookie('token', user.token, {expires: new Date(Date.now() + config.ttlToken*1000)});
				return res.redirect('/#/auth/success/' + user.token);
			});
		})(req, res, next);
	});


	/**
	 * LOGOUT
	 **/
	app.get('/auth/logout', middlewares.checkAuth, function(req, res, next) {
		for (var i = 0; i < sessions.length; i++) {
			if (String(req.user._id) == String(sessions[i].userId)) {
				sessions.splice(i, 1);
			}
		}
		return res.json({
			"success": true
		});
	});
};