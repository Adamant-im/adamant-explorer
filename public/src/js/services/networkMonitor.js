'use strict';

var NetworkMonitor = function ($socket, $scope) {
    this.$socket = $socket('/networkMonitor');
    this.$scope  = $scope;

    function Platforms () {
        this.counter   = [0,0,0,0];
        this.platforms = ['Mac', 'Linux', 'Windows', null];

        this.detect = function (platform) {
            if (angular.isNumber(platform)) {
                this.counter[parseInt(platform)]++;
            }
        }

        this.detected = function () {
            return {
                one:     { name: this.platforms[0], counter: this.counter[0] },
                two:     { name: this.platforms[1], counter: this.counter[1] },
                three:   { name: this.platforms[2], counter: this.counter[2] },
                unknown: { name: null,              counter: this.counter[3] }
            }
        }
    }

    function Versions (peers) {
        var inspect = function () {
            if (angular.isArray(peers)) {
                return _.uniq(_.map(peers, function(p) { return p.version; })
                        .sort(), true).reverse().slice(0, 3);
            } else {
                return [];
            }
        }

        this.counter  = [0,0,0,0];
        this.versions = inspect();

        this.detect = function (version) {
            var detected = null;

            if (angular.isString(version)) {
                for (var i = 0; i < this.versions.length; i++) {
                    if (version === this.versions[i]) {
                        detected = version;
                        this.counter[i]++;
                        break;
                    }
                }
            }
            if (detected == null) {
                this.counter[3]++;
            }
        }

        this.detected = function (version) {
            return {
                one:     { num: this.versions[0], counter: this.counter[0] },
                two:     { num: this.versions[1], counter: this.counter[1] },
                three:   { num: this.versions[2], counter: this.counter[2] },
                unknown: { num: null,             counter: this.counter[3] }
            }
        }
    }

    this.counter = function (peers) {
        var platforms = new Platforms(),
            versions  = new Versions(peers.connected);

        for (var i = 0; i < peers.connected.length; i++) {
            var p = peers.connected[i];

            platforms.detect(p.osBrand);
            versions.detect(p.version);
        }

        return {
            connected: peers.connected.length,
            disconnected: peers.disconnected.length,
            total: peers.connected.length + peers.disconnected.length,
            platforms: platforms.detected(), versions: versions.detected()
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
    this.markers = {};
    this.options = { center: [0, 0], zoom: 1, minZoom: 1, maxZoom: 10 };
    this.map     = L.map('map', this.options);
    this.cluster = L.markerClusterGroup({ maxClusterRadius: 80 });

    L.Icon.Default.imagePath = '/img/leaflet';

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    var PlatformIcon = L.Icon.extend({
        options: {
            iconSize:   [32, 41],
            iconAnchor: [16, 41]
        }
    });

    var platformIcons = [
        new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-mac.png' }),
        new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-linux.png' }),
        new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-windows.png' })
    ]

    this.addLocations = function (locations) {
        var connected = [];

        for (var i = 0; i < locations.length; i++) {
            var l = locations[i];

            if (!_.has(this.markers, l.ip)) {
                this.cluster.addLayer(
                    this.markers[l.ip] = L.marker(
                        [l.latitude, l.longitude], { title: l.ip, icon: platformIcons[l.osBrand] }
                    ).addTo(this.map)
                );
            }
            connected.push(l.ip);
        }

        this.removeDisconnected(connected);
        this.map.addLayer(this.cluster);
    }

    this.removeDisconnected = function (connected) {
        for (var ip in this.markers) {
            if (!_.contains(connected, ip)) {
                var m = this.markers[ip];

                this.map.removeLayer(m);
                this.cluster.removeLayer(m);
                delete this.markers[ip];
            }
        }
    }
}

angular.module('insight.network').factory('networkMonitor',
  function () {
      return function ($socket, $scope) {
          var networkMonitor = new NetworkMonitor($socket, $scope);

          return networkMonitor;
      }
  });
