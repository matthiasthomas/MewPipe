mewPipeApp.controller('VideoSearchCtrl', ['$rootScope', '$http', '$scope', '$route', '$location', '$callService', '$routeParams', '$videoService',
	function ($rootScope, $http, $scope, $route, $location, $callService, $routeParams, $videoService) {

		var counter = 0;
		var maxItems = 5;
		$scope.videos = [];
		$scope.param = {
			q: atob($routeParams.param),
			page: counter
			//sort: ['views', 'created', 'name']
		};
		
		if ($routeParams.param) {
			$callService.request('POST', 'video_search', null, $scope.param, null).then(function (data) {
				if (data.length > 0) {
					for (var i in data) {
						$scope.videos.push($videoService(data[i], null));
					}
					counter++;
				} else {
					$scope.videos = [];
				}
			});
		}

		$scope.canLoad = true;
		$scope.loadMore = function () {
			if ($scope.videos.length >= maxItems) {
				$scope.canLoad = false;
				return;
			} else {
				//console.log($scope.param);
				$callService.request('POST', 'video_search', null, $scope.param, null).then(function (data) {
					if (data.length > 0) {
						for (var i in data) {
							$scope.videos.push($videoService(data[i], null));

						}
						counter++;
					}
				});
			}
		};
		
	}]);
