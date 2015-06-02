'use strict';
var MewPipeModule = angular.module('ServiceModule', []);
MewPipeModule.factory('$authService', [
	'$rootScope', '$http', '$location', '$callService', '$q',
	function ($rootScope, $http, $location, $callService, $q) {

		var $authService = {
			userId: null,
			isLoggedIn: isLoggedIn,
			login: login,
			logout: logout
		};

		return $authService;

		function isLoggedIn(redirectToLogin) {
			return $http.get(config.getApiAddr() + config.api.route['auth_user'],
				{
					headers: {
						'x-access-token': $rootScope.app.getToken()
					}
				})
				.then(
				function (res) {
					$authService.userId = res.data.data._id;
					return {
						'userId': $authService.userId
					};
				},
				function (error) {
				})
		}

		function login(user) {
			if ($rootScope.app.getToken()) {
				return $rootScope.app.showNotif('You don\'t allow.', 'error');
			} else {
				return $callService.request('POST', 'auth_login', null, user, null).then(function (data) {
					if (data) {
						localStorage.setItem('token', data.token);
						$location.path('/user/profile');
						return true;
					}else {
						return false;
					}
				});
			}
		};

		function logout() {
			if ($rootScope.app.getToken()) {
				$callService.request(null, 'auth_logout', null, null, true).then(function (data) {
					if (data) {
						$rootScope.isConnect = false;
						config.storage.delete('token');
						$location.path('/');
					} else {
						$rootScope.app.showNotif(data, 'notice');
					}
				});
			} else {
				$rootScope.app.showNotif('You don\'t allow.', 'error');
			}
		}

	}]);  