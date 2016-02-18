angular.module('labApp').controller('introController', ['$scope', '$rootScope', 'imagePreloader', 'imagePlayer',
    function ($scope, $rootScope, preloader, player) {
        $scope.statuses = $rootScope.statuses;

        $scope.imageLocations = [];
        $scope.player = null;
        $rootScope.type;

        $scope.canvas = document.getElementById('intro-stage');

        $rootScope.$on('labExit', function () {
            alert('send info the server so we can get out of here!')
        });

        $scope.$on('API.disconnected', function() {
            $scope.statuses.isIntroPlaying = true;

            $scope.player.play(initObj.introData.INTROS[$rootScope.type].DURATION, true).then(function () {
                $scope.statuses.isIntroPlaying = false;
                $scope.statuses.isClosed = true;
            });
        });

        var init = function (type) {
            console.log('initObj.introData.INTROS[$rootScope.type]')
            console.log(initObj.introData)
            console.log('=====')

            $rootScope.type = type;
            introData = initObj.introData.INTROS[$rootScope.type];
            
            var $workspace = $('.workspace');
            
            // Collect image files to load
            for (var i = 0; i < introData.INTRO_IMAGES.COUNT; i++) {
                var suffix = String("0000" + i).slice(-4);
                var filename = introData.INTRO_IMAGES.PATH + $rootScope.type + '/' + introData.INTRO_IMAGES.PREFIX + suffix
                    + '.' + introData.INTRO_IMAGES.EXTENSION;

                $scope.imageLocations.push(filename);
            }

            var toolImages = [];
            // _.each(initObj.toolsData, function (tool, toolName) {
            angular.forEach(initObj.toolsData, function(tool, toolName) {
                // _.each(tool.defaults.images, function (imgUrl, imgName) {
                angular.forEach(tool.defaults.images, function(imgUrl, imgName) {
                    toolImages.push(imgUrl);
                });
                // If types are defined, load images for each type, too
                if (tool.types) {
                    // _.each(tool.types, function (type, typeName) {
                    angular.forEach(tool.types.images, function(type, typeName) {

                        if (type.images) {
                            // _.each(type.images, function (imgUrl, imgName) {
                            angular.forEach(tool.images, function(imgUrl, imgName) {
                                toolImages.push(imgUrl);
                            });
                        }
                    });
                }
            });

            // Preload lab tools images first
            preloader.preloadImages(toolImages).then(function () {
                // Preload the images; then, update display when returned.
                preloader.preloadImages($scope.imageLocations).then(
                    function handleResolve(images) {

                        // Loading was successful.
                        $scope.statuses.isLoading = false;
                        $scope.statuses.isSuccessful = true;

                        console.info("Preload Successful");

                        $scope.player = player.factory({
                            images: images,
                            canvas: $scope.canvas,
                            width: introData.INTRO_WIDTH,
                            height: introData.INTRO_HEIGHT
                        });

                        console.log('$scope')
                        console.log($scope)

                        $scope.player.fadeIn(images[0], introData.FADE_IN_DURATION).then(function () {
                            // After the first picture fades in, stop a few seconds until intro starts
                            setTimeout(function () {
                                $scope.player.play(introData.DURATION).then(function () {
                                    $scope.statuses.isIntroPlaying = false;
                                    $rootScope.$emit('intro-complete');
                                });
                            }, introData.STOP_DURATION);
                        });

                    },
                    function handleReject(imageLocation) {
                        // Loading failed on at least one image.
                        $scope.statuses.isLoading = false;
                        $scope.statuses.isSuccessful = false;

                        console.info("Preload Failure");

                    },
                    function handleNotify(event) {

                        $scope.statuses.percentLoaded = event.percent;

                    }
                );
            });

            // Set background image
            $workspace.css('background-image', 'url(' + initObj.introData.INTROS[initObj.labData.type].BACKGROUND + ')');
        };

        // $rootScope.$on('API.intro', function(event, data) { 
        //     init(data.type); 
        // });

        init(initObj.labData.type); 
    }
]);