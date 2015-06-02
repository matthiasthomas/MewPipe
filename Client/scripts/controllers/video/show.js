/**
 * Video show
 */
mewPipeApp.controller('VideoShowCtrl', ['$rootScope', '$http', '$scope', '$route', '$location', '$callService', '$videoService', '$routeParams',
	function ($rootScope, $http, $scope, $route, $location, $callService, $videoService, $routeParams) {

		var video_id = null;
		if ($routeParams.param != null || $routeParams.param == 'undefined') {
			video_id = $routeParams.param
		}

		if (video_id != null) {
			$scope.video = [];
			$callService.request(null, 'video_read', video_id, null, null).then(function (data) {
				$scope.video = $videoService(data, 'play');
				$scope.user = data._user;
			});
		}

	}]);