mewPipeApp.directive('ngDialog', function () {
	return function (scope, element, attrs) {
		var dlgtrigger = document.querySelectorAll('[data-dialog]');
		for (var i = 0; i < dlgtrigger.length; i++) {
			var somedialog = document.getElementById(dlgtrigger[i].getAttribute('data-dialog'));
			var dlg = new DialogFx(somedialog);
			dlgtrigger[i].addEventListener('click', dlg.toggle.bind(dlg));
		}
	};
});

mewPipeApp.directive('ngProgressbtnn', function () {
	return function (scope, element, attrs) {
		var bttntrigger = document.querySelectorAll('button.progress-button');
		for (var i = 0; i < bttntrigger.length; i++) {
			new ProgressButton(bttntrigger[i], {
				callback: function (instance) {
					var progress = 0,
						interval = setInterval(function () {
							progress = Math.min(progress + Math.random() * 0.1, 1);
							instance._setProgress(progress);

							if (progress === 1) {
								instance._stop(1);
								clearInterval(interval);
							}
						}, 200);
				}
			});
		}
	};
});

mewPipeApp.directive('goClick', function ($location) {
	return function (scope, element, attrs) {
		var path;

		attrs.$observe('goClick', function (val) {
			path = val;
		});

		element.bind('click', function () {
			scope.$apply(function () {
				$location.path(path);
			});
		});
	};
});

mewPipeApp.directive('infiniteScroll', ["$window", "$rootScope", function ($window, $rootScope) {
	return {
		restrict: 'AE',
		scope: {
			loadMore: '&',
			container: '=',
			item: '='
		},
		link: function (scope, ele, attrs) {
			var $$window = angular.element($window);
			var elem = ele[0];
			$$window.on('scroll', function () {
				//calculate condition to trigger loadmore function
				var rect = elem.getBoundingClientRect();
				var needHeight = elem.offsetTop + rect.height;
				var innerHeight = window.innerHeight;
				var scrollHeight = window.scrollY() + innerHeight;
				if (scrollHeight >= needHeight) {
					if (scope.$$phase || $rootScope.$$phase) {
						scope.loadMore();
					} else {
						scope.$apply(scope.loadMore());
					}
				}
			});

		}
    };
}]);