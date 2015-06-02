'use strict';
var MewPipeModule = angular.module('ServiceModule');
MewPipeModule.factory('$callService', [
	'$rootScope', '$http', '$location', 'Upload',
	function ($rootScope, $http, $location, Upload) {
		
		/**
		 * Catch request error 
		 * @Error message
		 * @Code code http error
		 */
		var httpError = function (err, code) {
			if (401 == code) {
				console.error('Error 401');
				$rootScope.isConnect = false;
				config.storage.delete('token');
				$location.path("/");
			} else if (404 == code) {
				$location.path("/");
				console.error('Error 404');
			} else if (500 == code || 503 == code) {
				$location.path("/");
				console.error('Error 500 or 503');
			} else {
				console.error('Error inconue', err, code);
			}
		};

		var $callService = {

			/**
			 * Request Factory
			 * @method {string} HTTP method GET, POST, PUT, DELETE
			 * @model {string} API route
			 * @param {string} url param  (optional)
			 * @data {object} body object  (optional)
			 * @token {bool} add header token  (optional)
			 * @Return {promise} return response object or true or catch error
			 */
			request: function (method, model, param, data, token) {
				var url = config.getApiAddr() + config.api.route[model];
				if (param) { url = url + "/" + param; }
				if (!method) { method = "GET"; }

				return $http({
					url: url,
					method: method,
					headers: {
						'x-access-token': (token) ? $rootScope.app.getToken() : null
						// 'Authorization': 'Basic ' + login_base64
					},
					data: data
				}).then(function (res) {
					if (config.debug) {
						console.log('%cRequest ' + method + ' ' + model + ' at ' + config.api.route[model], 'color: purple');
						console.log(res);
					}
					if (res.data.success) {
						if (res.data.data) {
							return res.data.data;
						} else {
							return true;
						}
					} else {
						return $rootScope.app.showNotif(res.data.error, 'error');
					}
				},
					function (error) {
						return httpError(error.statusText, error.status);
					});
			},

			upload: function (data, callback) {
				var url = config.getApiAddr() + config.api.route['video_upload'];
				Upload.upload({
					url: url,
					method: "POST",
					headers: {
						'x-access-token': $rootScope.app.getToken()
					},
					data: {
						"name": data.name,
						"description": data.description,
						"rights": data.rights
					},
					file: data,
				}).progress(function (evt) {
					$rootScope.dynamic = parseInt(100.0 * evt.loaded / evt.total);
				}).success(function (res, status, headers, config) {
					if (res.success) {
						callback(res.data);
					} else {
						if (config.debug) { console.log('error', res); }
						if (res.error.errors) {
							for (var i in res.error.errors) {
								if (res.error.errors.hasOwnProperty(i)) {
									$rootScope.app.showNotif(res.error.errors[i].message, 'error');
								}
							}
						} else {
							$rootScope.app.showNotif(res.error, 'error');
						}
					}
				})
					.error(function (err, code) {
					httpError(err, code);
				});
			},

		};

		return $callService;
	}]);  