/**
 * Created by shubham.goyal on 3/2/17.
 */
(function () {
    var app = angular.module('bart', ['ngStorage']);

    app.controller('uiController', function ($scope, $http, $interval, $rootScope, $timeout, $localStorage) {

        $scope.$storage = $localStorage;

        $scope.previousOrigin = $scope.$storage.origin;
        $scope.previousDestination = $scope.$storage.destination;
        console.log("Origin " + $scope.previousOrigin);
        console.log("Destination " + $scope.previousDestination);


        // $scope.range = function (min, max) {
        //     var result = [];
        //     for (var i = min; i <= max; i += 3) result.push(i);
        //     return result;
        // };
        //
        // $scope.range2 = function (min, max) {
        //     var result = [];
        //     for (var i = min; i <= max; i += 1) result.push(i);
        //     return result;
        // };

        $http.get("http://localhost:8080/stations").success(function (result) {
            console.log("Stations", result);
            $scope.resultGet = result.root.stations[0].station;
            console.log("resultGet" + $scope.resultGet);
        }).error(function () {
            console.log("error");
        });

        this.stationName = "";
        $scope.showStationDetails = function (stationName) {
            console.log("Show Station Details");
            this.stationName = stationName;
            $http.get("http://localhost:8080/station/" + stationName).success(function (result) {
                console.log("Station Detail" + stationName, result);
                $scope.stationDetail = result.root.stations[0].station[0];
            }).error(function () {
                console.log("error");
            });
        };

        var originStation = "";
        var destinationStation = "";

        $scope.setOriginStation = function (origin) {
            console.log("Origin Stations " + origin);
            $scope.$storage.origin = origin;
            console.log("origin" + $scope.$storage.origin);
            originStation = origin;
            if (destinationStation != "") {
                $scope.getRoutes();
            }
        };

        $scope.setDestinationStation = function (destination) {
            console.log("Destination Stations " + destination);
            $scope.$storage.destination = destination;

            console.log("destination" + $scope.$storage.destination);
            destinationStation = destination;
            if (originStation != "") {
                $scope.getRoutes();
            }
        };

        $scope.timeFound = false;
        $scope.noTrainFound = false;
        $scope.counter = 0;
        var mytimeout;
        $scope.getTimer = function () {
            var currentTime = new Date().getTime();
            var loopRun = true;
            var realDate = currentTime;
            angular.forEach($scope.route.root.schedule[0].request[0].trip, function (trip) {
                if(loopRun){
                    var dateString = trip.$.origTimeDate + trip.$.origTimeMin;
                    realDate = new Date(dateString);
                    realDate = realDate.getTime();
                    if(realDate > currentTime) {
                        loopRun = false;
                    }
                }

            });

            var tempCounter = 60 + Math.floor((realDate - currentTime) / 1000);
            if( tempCounter < 0) {
                $scope.counter = 0;
                $scope.noTrainFound = true;
                $scope.timeFound = false;
            } else {
                $scope.noTrainFound = false;
                $scope.counter = tempCounter;
                $scope.timeFound = true;

            }
            if (!(mytimeout === undefined)) {
                $timeout.cancel(mytimeout);

            }
            $scope.onTimeout = function () {
                if($scope.counter <= 0) {
                    $scope.counter = 0;
                    $scope.getRoutes();
                    $scope.noTrainFound = true;
                    $scope.timeFound = false;

                }
                else {
                    $scope.counter--;
                    $scope.noTrainFound = false;
                    $scope.timeFound = true;

                }
                mytimeout = $timeout($scope.onTimeout, 1000);
            };
            mytimeout = $timeout($scope.onTimeout, 1000);
        };

        $scope.showTrips = false;
        $scope.getRoutes = function () {

            $http.get("http://localhost:8080/trip/" + originStation + "/" + destinationStation).success(function (result) {
                console.log("Stations", result);
                $scope.route = result;
                $scope.showTrips = true;
                console.log("Show trips" + $scope.showTrips);
                if (!($scope.route.root.schedule === undefined)) {
                    $scope.getTimer();
                }
                else {
                    $scope.counter = 0;
                    $timeout.cancel(mytimeout);
                }

            }).error(function () {
                console.log("error");
            });

        };

    });

    app.controller("tripsCtrl", function ($scope) {

        var originLatLang = {
            gtfs_latitude: 37.339133,
            gtfs_longitude: -121.940955
        };

        var destinationLatLang = {
            gtfs_latitude: 37.350105,
            gtfs_longitude: -121.938718
        };

        this.latOrg = "";
        this.latDest = "";
        this.longOrg = "";
        this.longDest = "";

        this.initMap = function (origin, destination) {

            if (!(origin === undefined)) {
                this.latOrg = origin.gtfs_latitude;
                this.longOrg = origin.gtfs_longitude;
            }
            if (!(destination === undefined)) {
                this.latDest = destination.gtfs_latitude;
                this.longDest = destination.gtfs_longitude;
            }

            var pointA = new google.maps.LatLng(this.latOrg, this.longOrg);
            var pointB = new google.maps.LatLng(this.latDest, this.longDest);
            var myOptions = {
                zoom: 8,
                center: pointA,
                mapTypeId: google.maps.MapTypeId.TERRAIN
            };
            var map1 = new google.maps.Map(document.getElementById('map-canvas'), myOptions);

            var markerA = new google.maps.Marker({
                map: map1,
                position: pointA,
                label: "Origin"

            });
            var markerB = new google.maps.Marker({
                map: map1,
                position: pointB,
                label: "Destination"

            });

            // get route from A to B

            var directionsService = new google.maps.DirectionsService();
            var directionsDisplay = new google.maps.DirectionsRenderer({
                map: map1
            });

            this.calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, pointB);


        };

        this.calculateAndDisplayRoute = function (directionsService, directionsDisplay, pointA, pointB) {
            var request = {
                origin: pointA,
                destination: pointB,
                avoidTolls: true,
                avoidHighways: false,
                travelMode: google.maps.TravelMode.TRANSIT
            };

            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                }
                else {
                    console.log('Directions request failed due to ' + status);
                }
            });
        };

        this.initMap(originLatLang, destinationLatLang);
    });

    app.filter('formatTimer', function () {
        return function (input) {
            function z(n) {
                return (n < 10 ? '0' : '') + n;
            }

            var seconds = input % 60;
            var minutes = Math.floor(input / 60);
            var hours = Math.floor(minutes / 60);
            return (z(hours) + ':' + z(minutes) + ':' + z(seconds));
        };
    });

})();
