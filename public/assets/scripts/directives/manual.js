angular.module("labDirectives").directive('manual', ['$window', '$sce', 'GlobalData', '$http', '$rootScope',
    function ($window, $sce, global, $http, $rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'templates/manual.html',
            replace: true,
            scope: {
                labNotes: '='
            },
            link: function (scope, element, attrs) {
                var status = {'m-background': false, 'm-procedures': false, 'm-notes': false};
                var init = function () {
                    scope.manualData = initObj.labData.labManual;   
                };
                init();
                
                scope.status = 'closed';
                scope.title = initObj.labData.name;


                $http({
                    method: 'get',
                    url: initObj.labData.labManual.background.url
                }).then(function successCallback(response) {
                    scope.background = response.data;
                }, function errorCallback(response) {
                    console.error( 'Error getting manual data background - ' + response );
                    console.dir( response );
                    console.log( '======' );
                });

                $http({
                    method: 'get',
                    url: initObj.labData.labManual.procedure.url
                }).then(function successCallback(response) {
                    scope.procedures = response.data;
                }, function errorCallback(response) {
                    console.error( 'Error getting manual data procedures- ' + response );
                    console.dir( response );
                    console.log( '======' );
                });

                scope.changeStatus = function() {
                    if (scope.status === 'closed') {
                        scope.status = 'open';
                        $rootScope.$broadcast('panzoom:disable');

                        if (!angular.element('.manual').hasClass('manual-hover')) {
                            angular.element('.manual').addClass('manual-hover');
                        }
                    } else {
                        scope.status = 'closed';
                        $rootScope.$broadcast('panzoom:enable');

                        if (angular.element('.manual').hasClass('manual-hover')) {
                            angular.element('.manual').removeClass('manual-hover');
                        }
                    }
                };

                scope.saveNotes = function() {
                    global.tableItems.saveNotes(scope.labNotes);
                };
                scope.printNotes = function() {
                    var value = $('textarea').val(),
                        txtV = '<br/> <hr/> <h1>Lab Notes</h1>' + value.replace(/\r?\n/g,'<br/>'),
                        contents = $(".js-print").html() + txtV,
                        frame1 = $('<iframe />');

                    frame1[0].name = "frame1";
                    frame1.css({ "position": "absolute", "top": "-1000000px" });

                    $("body").append(frame1);

                    var frameDoc = frame1[0].contentWindow ? frame1[0].contentWindow : frame1[0].contentDocument.document ? frame1[0].contentDocument.document : frame1[0].contentDocument;

                    frameDoc.document.open();
                    frameDoc.document.write('<html><head><title>DIV Contents</title>');
                    frameDoc.document.write('</head><body>');
                    frameDoc.document.write('<link href="style.css" rel="stylesheet" type="text/css" />');
                    frameDoc.document.write(contents);
                    frameDoc.document.write('</body></html>');
                    frameDoc.document.close();

                    setTimeout(function () {
                        window.frames["frame1"].focus();
                        window.frames["frame1"].print();
                        frame1.remove();
                    }, 500);
                };

                scope.onExpand = function(e) {
                    status[e.item.id] = true;
                    if (angular.isDefined(scope.manual_widget)) {
                        if(e.item.id == "m-background") {
                            scope.manual_widget.collapse($('#m-procedures'));
                        }
                        if(e.item.id == "m-procedures") {
                            scope.manual_widget.collapse($('#m-background'));
                        }
                    }
                    if (status["m-notes"] && (status["m-procedures"] || status["m-background"])) {
                        $('ul.manual_content textarea').addClass('lab-notes_half');
                        $('ul.manual_content textarea').removeClass('lab-notes');
                        $('ul.manual_content li div.k-content').addClass('scroll_half');
                        $('ul.manual_content li div.k-content').removeClass('scroll');
                    } else {
                        $('ul.manual_content textarea').addClass('lab-notes');
                        $('ul.manual_content textarea').removeClass('lab-notes_half');
                        $('ul.manual_content li div.k-content').addClass('scroll');
                        $('ul.manual_content li div.k-content').removeClass('scroll_half');
                    }
                };

                scope.onCollapse = function(e) {
                    status[e.item.id] = false;
                    if (status["m-notes"] && (status["m-procedures"] || status["m-background"])) {
                        $('ul.manual_content textarea').addClass('lab-notes_half');
                        $('ul.manual_content textarea').removeClass('lab-notes');
                        $('ul.manual_content li div.k-content').addClass('scroll_half');
                        $('ul.manual_content li div.k-content').removeClass('scroll');
                    } else {
                        $('ul.manual_content textarea').addClass('lab-notes');
                        $('ul.manual_content textarea').removeClass('lab-notes_half');
                        $('ul.manual_content li div.k-content').addClass('scroll');
                        $('ul.manual_content li div.k-content').removeClass('scroll_half');
                    }
                };
            }
        }
    }
]);