/**
 * Video upload
 */
mewPipeApp.controller('VideoUploadCtrl', ['$rootScope', '$http', '$scope', '$route', '$location', '$callService', 'Upload',
    function($rootScope, $http, $scope, $route, $location, $callService, Upload) {
        //Declare the files array
        $scope.files = [];

        // function will be called when submitting the form
        $scope.submitUpload = function() {
            if (typeof $scope.files !== 'undefined') {
                async.each($scope.files,
                    function(file, callback) {
                        if (file.size <= 524288000) {
                            $callService.upload(file, function(data) {
                                if (data.success) {
                                    callback();
                                } else {
                                    callback(data.error);
                                }
                            });
                        } else {
                            callback('Video mustn’t exceed 500MB in size.');
                        }
                    },
                    function(error) {
                        console.log("Bonsoir");
                        console.log(error);
                        if (error) $rootScope.app.display(error, 'error');
                        $location.path('/video/user/');
                    });
            } else {
                $rootScope.app.display('No file to upload', 'notice');
            }
        };

        $scope.tags = [{
            name: 'Animation',
            checked: false
        }, {
            name: 'Arts & Design',
            checked: false
        }, {
            name: 'Experimental',
            checked: false
        }, {
            name: 'Tutorial',
            checked: false
        }, {
            name: 'Travel',
            checked: false
        }, {
            name: 'Fashion',
            checked: false
        }, {
            name: 'Food',
            checked: false
        }, {
            name: 'Comedy',
            checked: false
        }, {
            name: 'Documentary',
            checked: false
        }, {
            name: 'Sports',
            checked: false
        }, {
            name: 'Talks',
            checked: false
        }, {
            name: 'Instructionals',
            checked: false
        }, {
            name: 'Music',
            checked: false
        }, {
            name: 'Reporting & Journalism',
            checked: false
        }];
    }
]);