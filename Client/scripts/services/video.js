'use strict';
var MewPipeModule = angular.module('ServiceModule');
MewPipeModule.factory('$videoService', [
	'$rootScope', '$q', '$location', '$sce',
	function ($rootScope, $q, $location, $sce) {

		/**
		 * Generique object videogular with custom functions 
		 * Return {object} videogular formated
		 */
		var $videoService = function (data, action) {

			if (action == "download") {
				action = [{
					src: $sce.trustAsResourceUrl($rootScope.app.getApi() + '/api/videos/download/' + data._id),
					type: "video/" + data.ext
				}];
			} else if (action == "play") {
				action = [{
					src: $sce.trustAsResourceUrl($rootScope.app.getApi() + '/api/videos/play/' + data._id),
					type: "video/" + data.ext
				}];
			} else {
				action = [{
					src: data.sources,
					type: "video/" + data.ext
				}];
			}
			var url = $location.absUrl();
			return {
				_id: data._id,
				_user: data._user,
				name: data.name,
				description: data.description,
				created: moment(data.date).format("DD MMMM YYYY HH:mm"),
				size: bytesToSize(data.size),
				views: data.views,
				rights: data.rights,
				ready : data.ready,
				sources: action,
				plugins: {
					poster: ''
				},
				theme: "lib/videogular-themes-default/videogular.css",
				image: config.getApiAddr() + config.api.route['video_image'] + "/" + data._id,

				link: url,
				stop: function () {

				},
				onPlayerReady: function ($API) {
					console.log($API);
				}
			};
		};

		return $videoService;

	}]);  