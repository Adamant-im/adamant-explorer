import AppNetworkMonitor from './network-monitor.module';
import L from 'leaflet';
import 'leaflet.markercluster';

const NetworkMap = function () {
    this.markers = {};
    this.options = { center: L.latLng(40, 0), zoom: 1, minZoom: 1, maxZoom: 10 };
    this.map     = L.map('map', this.options);
    this.cluster = L.markerClusterGroup({ maxClusterRadius: 50 });

    L.Icon.Default.imagePath = '../../assets/img/leaflet';

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const PlatformIcon = L.Icon.extend({
        options: {
            iconSize:   [32, 41],
            iconAnchor: [16, 41],
            popupAnchor: [0, -41]
        }
    });

    const platformIcons = {
        darwin:  new PlatformIcon({ iconUrl: './leaflet/marker-icon-darwin.png' }),
        linux:   new PlatformIcon({ iconUrl: './leaflet/marker-icon-linux.png' }),
        win:     new PlatformIcon({ iconUrl: './leaflet/marker-icon-win.png' }),
        freebsd: new PlatformIcon({ iconUrl: './leaflet/marker-icon-freebsd.png' }),
        unknown: new PlatformIcon({ iconUrl: './leaflet/marker-icon-unknown.png' })
    };

    this.addConnected = function (peers) {
        const connected = [];

        for (let item of peers.connected) {
            if (!validLocation(item.location)) {
                continue;
            }

            if (!Object.keys(this.markers).includes(item.ip)) {
                this.cluster.addLayer(
                    this.markers[item.ip] = L.marker(
                        [item.location.latitude, item.location.longitude],
                        { title: item.ipString, icon: platformIcons[item.osBrand.name] }
                    ).bindPopup(popupContent(item))
                );
            }
            connected.push(item.ip);
        }

        this.removeDisconnected(connected);
        this.map.addLayer(this.cluster);
    };

    this.removeDisconnected = function (connected) {
        for (const ip in this.markers) {
            if (!connected.includes(ip)) {
                const m = this.markers[ip];

                this.map.removeLayer(m);
                this.cluster.removeLayer(m);
                delete this.markers[ip];
            }
        }
    };

    // Private
    var validLocation = location => location && angular.isNumber(location.latitude) && angular.isNumber(location.longitude);

    var popupContent = p => {
        let content = '<p class="ip">'.concat(p.ip, '</p>');

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

const NetworkMonitor = function (vm) {
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

    const uniq = (arrArg) => {
        return arrArg.filter((elem, pos, arr) => {
            return arr.indexOf(elem) == pos;
        });
    };

    function Versions (peers) {
        const inspect = () => {
            if (angular.isArray(peers)) {
                return uniq(peers.map(p => p.version)
                        .sort()).reverse().slice(0, 3); 
            } else {
                return [];
            }
        };

        this.counter  = [0,0,0,0];
        this.versions = inspect();

        this.detect = function (version) {
            let detected = null;

            if (angular.isString(version)) {
                for (let i = 0; i < this.versions.length; i++) {
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
        const inspect = () => {
            if (angular.isArray(peers)) {
                return uniq(peers.map(p => p.height)
                            .sort((a, b) => (a - b))).reverse().slice(0, 4);
            } else {
                return [];
            }
        };

        this.counter = [0,0,0,0,0];
        this.percent = [0,0,0,0,0];
        this.heights = inspect();

        this.detect = function (height) {
            let detected = null;

            if (height) {
                for (let i = 0; i < this.heights.length; i++) {
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
            for (let i = 0; i < this.counter.length; i++) {
                this.percent[i] = Math.round((this.counter[i] / peers.length) * 100);
            }

            return this.percent;
        };
    }

    this.counter = peers => {
        const platforms = new Platforms(), versions  = new Versions(peers.connected), heights   = new Heights(peers.connected);

        for (let item of peers.connected) {
            platforms.detect(item.osBrand);
            versions.detect(item.version);
            heights.detect(item.height);
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
        const connected = peers.list.connected;
        const disconnected = peers.list.disconnected;

        connected.forEach((p, i) => {
            const count = connected.filter(pp => pp.id == p.id).length;
            if (count === 1) return;
            connected[i].id = false;
        });

        disconnected.forEach((p, i) => {
            const count = disconnected.filter(pp => pp.id == p.id).length;
            if (count === 1) return;
            disconnected[i].id = false;
        });
        
        peers.list.connected = connected.filter(p => p.id);
        peers.list.disconnected = disconnected.filter(p => p.id);

        vm.peers = peers.list;
        vm.counter = this.counter(peers.list);
        this.map.addConnected(peers.list);
    };

    this.updateLastBlock = lastBlock => {
        vm.lastBlock = lastBlock.block;
    };

    this.updateBlocks = blocks => {
        vm.bestBlock = blocks.best;
        vm.volume    = blocks.volume;
    };
};

AppNetworkMonitor.factory('networkMonitor',
  ($socket, $rootScope) => vm => {
      const networkMonitor = new NetworkMonitor(vm), ns = $socket('/networkMonitor');

      ns.on('data', res => {
          if (res.peers) { networkMonitor.updatePeers(res.peers); }
          if (res.lastBlock) { networkMonitor.updateLastBlock(res.lastBlock); }
          if (res.blocks) { networkMonitor.updateBlocks(res.blocks); }
      });

      ns.on('data1', res => {
          if (res.lastBlock) {
              networkMonitor.updateLastBlock(res.lastBlock);
          }
      });

      ns.on('data2', res => {
          if (res.blocks) {
              networkMonitor.updateBlocks(res.blocks);
          }
      });

      ns.on('data3', res => {
          if (res.peers) {
              networkMonitor.updatePeers(res.peers);
          }
      });

      $rootScope.$on('$destroy', event => {
          ns.removeAllListeners();
      });

      $rootScope.$on('$locationChangeStart', (event, next, current) => {
          ns.emit('forceDisconnect');
      });

      return networkMonitor;
  });
