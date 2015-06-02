/**
 * Video upload
 */
mewPipeApp.controller('VideoUploadCtrl', ['$rootScope', '$http', '$scope', '$route', '$location', '$callService', 'Upload',
    function ($rootScope, $http, $scope, $route, $location, $callService, Upload) {
          
        $scope.files = [];
        $scope.submitUpload = function () {
            if (typeof $scope.files !== 'undefined') {
                var length = $scope.files.length;
                for (var i = 0; i < $scope.files.length; i++) {
                    var file = $scope.files[i];
                    if(config.debug) { console.log(bytesToSize(file.size)); }
                    if (file.size <= 524288000) {
                        $callService.upload(file, function(data){
                            if(config.debug) { console.log('success', data); }
                            $scope.files = [];
                            
                        });
                        if (i == length - 1) {
                            $location.path('/video/user/');
                        }
                    } else {
                        $rootScope.app.showNotif('Video allowed on the platform mustn’t exceed 500MB size.', 'error');
                    }
                }
            } else {
                $rootScope.app.showNotif('Nothing file to upload', 'notice');
            }
        };

        $scope.tags = [{ name: 'Animation', checked: false },
            { name: 'Arts & Design', checked: false },
            { name: 'Cameras & Techniques', checked: false },
            { name: 'Comedy', checked: false },
            { name: 'Documentary', checked: false },
            { name: 'Experimental', checked: false },
            { name: 'Fashion', checked: false },
            { name: 'Food', checked: false },
            { name: 'Instructionals', checked: false },
            { name: 'Music', checked: false },
            { name: 'Narrative', checked: false },
            { name: 'Personal', checked: false },
            { name: 'Reporting & Journalism', checked: false },
            { name: 'Sports', checked: false },
            { name: 'Talks', checked: false },
            { name: 'Travel', checked: false },
        ];
        
        // $scope.$watch('files', function () {
        //     console.log($scope.files);
        // });

    }]);