/**
 * Video user
 */
mewPipeApp.controller('VideoUserCtrl', ['$rootScope', '$http', '$scope', '$route', '$location', '$callService', '$routeParams', '$videoService',
	function ($rootScope, $http, $scope, $route, $location, $callService, $routeParams, $videoService) {

		$scope.videos = [];
		$callService.request(null, 'video_user', null, null, true).then(function (data) {
			if (data.length > 0) {
				for (var i in data) {
					$scope.videos.push($videoService(data[i], null));
				}
			} else {
				$scope.videos = [];
			}
		});

		$scope.submitDelete = function (id) {
			$callService.request("DELETE", 'video_delete', id, null, true).then(function (data) {
				if (data) {
					$route.reload();
				}
			})
		};

	}]);

/**
 * Video users
 */
mewPipeApp.controller('VideoUsersCtrl', ['$rootScope', '$http', '$scope', '$route', '$location', '$callService', '$routeParams', '$videoService',
	function ($rootScope, $http, $scope, $route, $location, $callService, $routeParams, $videoService) {

		$scope.videos = [];
		if ($routeParams.param) {
			$callService.request(null, 'video_guest', $routeParams.param, null, null).then(function (data) {
				if (data.length > 0) {
					for (var i in data) {
						$scope.videos.push($videoService(data[i], null));
					}
				} else {
					$scope.videos = [];
				}
			});
        } else {
			$location.path('/video/user');
		}

	}]);
