'use strict';

var NetworkMonitor = function (vm) {
    this.map = new NetworkMap();

    function Platforms () {
        this.counter   = [0,0,0,0];
        this.platforms = ['Darwin', 'Linux', 'FreeBSD'];

        this.detect = function (platform) {
            if (angular.isNumber(platform.group)) {
                this.counter[parseInt(platform.group)]++;
            }
        };

        this.detected = function () {
            return {
                one:   { name: this.platforms[0], counter: this.counter[1] },
                two:   { name: this.platforms[1], counter: this.counter[2] },
                three: { name: this.platforms[2], counter: this.counter[3] },
                other: { name: null,              counter: this.counter[0] }
            };
        };
    }

    function Versions (peers) {
        var inspect = function () {
            if (angular.isArray(peers)) {
                return _.uniq(_.map(peers, function (p) { return p.version; })
                        .sort(), true).reverse().slice(0, 3);
            } else {
                return [];
            }
        };

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
        };

        this.detected = function (version) {
            return {
                one:   { num: this.versions[0], counter: this.counter[0] },
                two:   { num: this.versions[1], counter: this.counter[1] },
                three: { num: this.versions[2], counter: this.counter[2] },
                other: { num: null,             counter: this.counter[3] }
            };
        };
    }

    function Heights (peers) {
        var inspect = function () {
          function sortNumber(a,b) {
            return b - a;
          }
          if (angular.isArray(peers)) {
              return _.uniq(_.map(peers, function (p) { return p.height; })
                      .sort(sortNumber), true).slice(0, 4);
          } else {
              return [];
          }
        };

        this.counter = [0,0,0,0,0];
        this.percent = [0,0,0,0,0];
        this.heights = inspect();

        this.detect = function (height) {
            var detected = null;

            if (height) {
                for (var i = 0; i < this.heights.length; i++) {
                    if (height === this.heights[i]) {
                        detected = height;
                        this.counter[i]++;
                        break;
                    }
                }
            }
            if (detected == null) {
                this.counter[4]++;
            }
        };

        this.detected = function (height) {
            return {
                heights: this.heights,
                counter: this.counter
            };
        };

        this.calculatePercent = function (peers) {
            for (var i = 0; i < this.counter.length; i++) {
              this.percent[i] = Math.round((this.counter[i] / peers.length) * 100);
            }
            return this.percent;
        };
    }

    this.counter = function (peers) {
        var platforms = new Platforms(),
            versions  = new Versions(peers.connected),
            heights   = new Heights(peers.connected);

        for (var i = 0; i < peers.connected.length; i++) {
            var p = peers.connected[i];

            platforms.detect(p.osBrand);
            versions.detect(p.version);
            heights.detect(p.height);
        }

        return {
            connected: peers.connected.length,
            disconnected: peers.disconnected.length,
            total: peers.connected.length + peers.disconnected.length,
            platforms: platforms.detected(),
            versions: versions.detected(),
            heights: heights.detected(),
            percents: heights.calculatePercent (peers.connected)
        };
    };

    this.updatePeers = function (peers) {
        vm.peers   = peers.list;
        vm.counter = this.counter(peers.list);
        this.map.addConnected(peers.list);
    };

    this.updateLastBlock = function (lastBlock) {
        vm.lastBlock = lastBlock.block;
    };

    this.updateBlocks = function (blocks) {
        vm.bestBlock = blocks.best;
        vm.volume    = blocks.volume;
    };
};

var NetworkMap = function () {
    this.markers = {};
    this.options = { center: L.latLng(40, 0), zoom: 1, minZoom: 1, maxZoom: 10 };
    this.map     = L.map('map', this.options);
    this.cluster = L.markerClusterGroup({ maxClusterRadius: 50 });

    L.Icon.Default.imagePath = '/img/leaflet';

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    var PlatformIcon = L.Icon.extend({
        options: {
            iconSize:   [32, 41],
            iconAnchor: [16, 41],
            popupAnchor: [0, -41]
        }
    });

    var platformIcons = {
        darwin:  new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-darwin.png' }),
        linux:   new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-linux.png' }),
        win:     new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-win.png' }),
        freebsd: new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-freebsd.png' }),
        unknown: new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-unknown.png' })
    };

    this.addConnected = function (peers) {
        var connected = [];

        for (var i = 0; i < peers.connected.length; i++) {
            var p = peers.connected[i];

            if (!validLocation(p.location)) {
                //console.warn('Invalid geo-location data received for:', p.ip);
                continue;
            }

            if (!_.has(this.markers, p.ip)) {
                this.cluster.addLayer(
                    this.markers[p.ip] = L.marker(
                        [p.location.latitude, p.location.longitude],
                        { title: p.ipString, icon: platformIcons[p.osBrand.name] }
                    ).bindPopup(popupContent(p))
                );
            }
            connected.push(p.ip);
        }

        this.removeDisconnected(connected);
        this.map.addLayer(this.cluster);
    };

    this.removeDisconnected = function (connected) {
        for (var ip in this.markers) {
            if (!_.contains(connected, ip)) {
                var m = this.markers[ip];

                this.map.removeLayer(m);
                this.cluster.removeLayer(m);
                delete this.markers[ip];
            }
        }
    };

    // Private

    var validLocation = function (location) {
        return location && angular.isNumber(location.latitude) && angular.isNumber(location.longitude);
    };

    var popupContent = function (p) {
        var content = '<p class="ip">'.concat(p.ip, '</p>');

        if (p.location.hostname) {
            content += '<p class="hostname">'
               .concat('<span class="label">Hostname: </span>', p.location.hostname, '</p>');
        }

        content += '<p class="version">'
           .concat('<span class="label">Version: </span>', p.version, '</p>');

        content += '<p class="os">'
           .concat('<span class="label">OS: </span>', p.os, '</p>');

        if (p.location.city) {
            content += '<p class="city">'
               .concat('<span class="label">City: </span>', p.location.city, '</p>');
        }

        if (p.location.region_name) {
            content += '<p class="region">'
               .concat('<span class="label">Region: </span>', p.location.region_name, '</p>');
        }

        if (p.location.country_name) {
            content += '<p class="country">'
               .concat('<span class="label">Country: </span>', p.location.country_name, '</p>');
        }

        return content;
    };
};

angular.module('lisk_explorer.tools').factory('networkMonitor',
  function ($socket, $rootScope) {
      return function (vm) {
          var networkMonitor = new NetworkMonitor(vm),
              ns = $socket('/networkMonitor');

          ns.on('data', function (res) {
              if (res.peers) { networkMonitor.updatePeers(res.peers); }
              if (res.lastBlock) { networkMonitor.updateLastBlock(res.lastBlock); }
              if (res.blocks) { networkMonitor.updateBlocks(res.blocks); }
          });

          ns.on('data1', function (res) {
              if (res.lastBlock) {
                  networkMonitor.updateLastBlock(res.lastBlock);
              }
          });

          ns.on('data2', function (res) {
              if (res.blocks) {
                  networkMonitor.updateBlocks(res.blocks);
              }
          });

          ns.on('data3', function (res) {
              if (res.peers) {
                  networkMonitor.updatePeers(res.peers);
              }
          });

          $rootScope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $rootScope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return networkMonitor;
      };
  });
