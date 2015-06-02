/**
 * User profile
 */
mewPipeApp.controller('UserProfileCtrl', ['$rootScope', '$http', '$scope', '$route', '$location', '$callService',
	function ($rootScope, $http, $scope, $route, $location, $callService) {

		$callService.request(null, 'user_readOne', null, null, true).then(function (data) {
			$scope.user = data;
			$scope.user.birthdate = moment(data.created).format("MMMM Do YYYY");
			$scope.user.created = moment(data.created).format("MMMM Do YYYY, h:mm");
		});

		$scope.submitDelete = function () {
			$callService.request("DELETE", "user_delete", null, null, true).then(function (data) {
				$location.path('/user/profile');
			});
		};
	}]);