module.exports.controller = function(app, router, config, modules, models, middlewares, sessions) {

	router.get('/', function(req, res) {
		res.send('API is running...');
	});

	router.get('/firstLoad', function(req, res) {

	});
};