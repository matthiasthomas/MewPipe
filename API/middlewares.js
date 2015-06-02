module.exports.controller = function(app, config, modules, models, middlewares, sessions) {

	exports.checkAuth = function(req, res, next) {
		var token = req.headers["x-access-token"];
		for (var i = 0; i < sessions.length; i++) {
			if (token == sessions[i].token) {
				if (sessions[i].ttl >= Math.round(+new Date() / 1000)) {
					models.User.findOne({
							_id: sessions[i].userId
						})
						.exec(function(error, user) {
							if (user) {
								sessions[i].ttl = Math.round(+new Date() / 1000) + config.ttlToken;
								req.user = user;
								return next();
							} else {
								return res.status(401).end();
							}
						});
					return;
				} else {
					sessions.splice(i, 1);
					return res.status(401).end();
				}
			}
		}
		return res.status(401).end();
	};

	exports.checkViews = function(req, res, next) {
		var token = req.headers["x-access-token"];
		var ip = req.headers['x-forwarded-for'] ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			"unknown";

		if (token) {
			for (var i = 0; i < sessions.length; i++) {
				if (token == sessions[i].token) {
					if (sessions[i].ttl >= Math.round(+new Date() / 1000)) {
						models.User.findOne({
								_id: sessions[i].userId
							})
							.exec(function(error, user) {
								if (user) {
									req.viewsIdentifierUser = user._id;
									next();
								} else {
									req.viewsIdentifierIp = ip;
									next();
								}
							});
						return;
					} else {
						req.viewsIdentifierIp = ip;
						next();
					}
				}
			}
			req.viewsIdentifierIp = ip;
			next();
		} else {
			req.viewsIdentifierIp = ip;
			next();
		}

	};

	exports.checkAdmin = function(req, res, next) {

	};

	exports.header = function(req, res, next) {
		res.header("Cache-Control", "max-age=1");
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		res.header("Access-Control-Allow-Headers", "Content-Type,x-access-token");
		next();
	};

	exports.multipart = modules.multipart({
		uploadDir: config.tmpDirectory
	});

};