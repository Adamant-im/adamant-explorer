'use strict';

var NetworkMonitor = function ($socket, $scope) {
    this.$socket = $socket('/networkMonitor');
    this.$scope  = $scope;

    this.counter = function (peers) {
        return {
            connected: peers.connected.length,
            disconnected: peers.disconnected.length,
            total: peers.connected.length + peers.disconnected.length
        }
    }

    this.map = new NetworkMap();

    this.$socket.on('data', function (res) {
        this.$scope.peers          = res.peers.list;
        this.$scope.counter        = this.counter(res.peers.list);
        this.$scope.lastBlock      = res.lastBlock.block;
        this.$scope.bestBlock      = res.bestBlock.block;
        this.$scope.volAmount      = res.volume.amount;
        this.$scope.volBeginning   = res.volume.beginning;
        this.$scope.volEnd         = res.volume.end;
        this.$scope.volNow         = moment();
    }.bind(this));

    this.$socket.on('locations', function (res) {
        this.map.addLocations(res.locations);
    }.bind(this));

    this.$scope.$on('$destroy', function (event) {
        $socket.removeAllListeners();
    });
}

var NetworkMap = function () {
    this.markers = [];
    this.options = { center: [0, 0], zoom: 1, minZoom: 1, maxZoom: 10 };
    this.map     = L.map('map', this.options);
    this.cluster = L.markerClusterGroup({ maxClusterRadius: 80 });

    L.Icon.Default.imagePath = '/img/leaflet';

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.addLocation = function (l) {
        if (this.markers.indexOf(l.ip) == -1) {
            this.cluster.addLayer(
                L.marker([l.latitude, l.longitude], { title: l.ip }).addTo(this.map)
            );
            this.markers.push(l.ip);
        }
    }

    this.addLocations = function (locations) {
        for (var i = 0; i < locations.length; i++) {
            this.addLocation(locations[i]);
        }
        this.map.addLayer(this.cluster);
    }
}

angular.module('insight.network').factory('networkMonitor',
  function () {
      return function ($socket, $scope) {
          var networkMonitor = new NetworkMonitor($socket, $scope);

          return networkMonitor;
      }
  });
