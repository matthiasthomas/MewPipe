module.exports.controller = function(app, config, modules, models, middlewares, sessions) {

	function getSessionIndexByToken(token) {
		// Loop through the sessions
		for (var i = 0; i < sessions.length; i++) {
			// If a session corresponds
			if (token == sessions[i].token) return i;
		}
		return -1;
	}

	// To check wether the user is authenticated or not
	exports.checkAuth = function(req, res, next) {
		// Get the token from the request headers
		var token = req.headers["x-access-token"];
		// Get the token's session's index
		var sessionIndex = getSessionIndexByToken(token);
		if (sessionIndex >= 0) {
			// Check if it's still alive
			if (sessions[sessionIndex].ttl >= Math.round(+new Date() / 1000)) {
				// Get the corresponding user from the db
				models.User.findOne({
						_id: sessions[sessionIndex].userId
					})
					.exec(function(error, user) {
						if (!user) return res.status(401).end();
						// If a user was found, extend it's session
						sessions[sessionIndex].ttl = Math.round(+new Date() / 1000) + config.ttlToken;
						// Add user object to the request, and next
						req.user = user;
						return next();
					});
				return;
			} else {
				// If the session is out of date, delete it
				sessions.splice(i, 1);
				return res.status(401).end();
			}
		} else {
			return res.status(401).end();
		}
	};

	exports.getUser = function(req, res, next) {
		if (!req.mewPipe) req.mewPipe = {};
		// Get the token for the headers
		var token = req.headers["x-access-token"] || req.params.token;
		// Check the token
		if (token) {
			var sessionIndex = getSessionIndexByToken(token);
			if (sessionIndex >= 0) {
				if (sessions[sessionIndex].ttl >= Math.round(+new Date() / 1000)) {
					// Get the user associated to the session
					models.User.findOne({
							_id: sessions[sessionIndex].userId
						})
						.exec(function(error, user) {
							if (user) {
								req.mewPipe.user = user._id;
							}
							next();
						});
					// If the session is expired
				} else {
					next();
				}
				// If the token doesn't correspond to any session
			} else {
				next();
			}
			// If there's no token in the headers
		} else {
			next();
		}
	};

	exports.getIP = function(req, res, next) {
		if (!req.mewPipe) req.mewPipe = {};
		req.mewPipe.IP = req.headers['x-forwarded-for'] ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			"unknown";
		next();
	};

	exports.header = function(req, res, next) {
		res.header("Cache-Control", "max-age=1");
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		res.header("Access-Control-Allow-Headers", "Content-Type,x-access-token");
		next();
	};
};