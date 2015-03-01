'use strict';

var ActivityGraph = function ($http) {
    this.$http     = $http;
    this.loading   = true;
    this.blocks    = 0;
    this.maxBlocks = 20;
    this.indexes   = [];

    this.colors = {
        account: "#3465a4", // Steel Blue
        credit:  "#73d216", // Lawn Green
        debit:   "#cc0000", // Red
        block:   "#f57900", // Dark Orange
        tx:      "#888a85"  // Grey
    }

    this.renderer = {
        container: "sigma-canvas",
        type: "canvas"
    }

    this.settings = {
        sideMargin: 1,
        singleHover: true,
        minNodeSize: 0.5,
        maxNodeSize: 16,
        drawLabels: false,
        defaultEdgeType: "arrow"
    }

    this.sigma = new sigma({
        renderer: this.renderer,
        settings: this.settings
    });

    function NodeSelect(sigma) {
        this.sigma = sigma;
        this.color = "#5bc0de";

        this.add = function (event) {
            this.remove(event);
            this.node       = event.data.node;
            this.prevColor  = this.node.color;
            this.node.color = this.color;
            this.sigma.refresh();
        }

        this.remove = function (event) {
            if (this.node) {
                this.node.color = this.prevColor;
                this.prevColor  = undefined;
                this.node       = undefined;
            }
            this.sigma.refresh();
        }

        this.selected = function () {
            return this.node !== undefined;
        }

        this.type = function () {
            if (this.selected()) {
                return this.node.type;
            } else {
                return undefined;
            }
        }

        this.href = function () {
            switch (this.type()) {
                case 0:
                return "/tx/" + this.node.id;
                case 1:
                return "/block/" + this.node.id;
                case 2:
                return "/address/" + this.node.id;
                default:
                return "#";
            }
        }
    }

    this.nodeSelect = new NodeSelect(this.sigma);

    function CameraMenu(camera) {
        this.camera = camera;

        this.reset = function () {
            if (this.camera) {
                this.camera.goTo({ x: 0, y: 0, angle: 0, ratio: 1 });
            }
        }
    }

    this.cameraMenu = new CameraMenu(this.sigma.camera);

    function Statistics(graph) {
        this.graph  = graph;
        this.volume = this.txs = this.blocks = this.accounts = 0;

        this.refresh = function () {
            var txs       = this.graph.nodesByType(0);
            var blocks    = this.graph.nodesByType(1);
            var accounts  = this.graph.nodesByType(2);
            this.txs      = txs.size().value();
            this.volume   = txsVolume(txs);
            this.blocks   = blocks.size().value();
            this.timespan = blocksTimespan(blocks);
            this.accounts = accounts.size().value();
        }

        var txsVolume = function (chain) {
            return chain.reduce(function (vol, tx) {
                return vol += tx.amount;
            }, 0).value() / Math.pow(10, 8);
        }

        var epochTime = function () {
            return parseInt(
                new Date(Date.UTC(2014, 4, 2, 0, 0, 0, 0)
            ).getTime() / 1000);
        }

        var minTime = function (chain) {
            return chain.min(function (block) {
                if (block.timestamp > 0) {
                    return block.timestamp;
                }
            }).value().timestamp;
        }

        var maxTime = function (chain) {
            return chain.max(function (block) {
                if (block.timestamp > 0) {
                    return block.timestamp;
                }
            }).value().timestamp;
        }

        var blocksTimespan = function (chain) {
            var max = epochTime() + maxTime(chain) * 1000;
            var min = epochTime() + minTime(chain) * 1000;
            return moment.duration((max - min)).humanize();
        }
    }

    this.statistics = new Statistics(this);
}

ActivityGraph.prototype.lastBlock = function (callback) {
    this.$http.get("/api/statistics/getLastBlock").success(_.bind(callback, this));
}

ActivityGraph.prototype.blockTransactions = function (id, callback) {
    this.$http.get("/api/getTransactionsByBlock" + "?blockId=" + id).success(_.bind(callback, this));
}

ActivityGraph.prototype.refresh = function () {
    this.loading = true;
    this.lastBlock(function (res) {
        if (!res.success) { return; }
        this.addBlock(res.block, true);

        if (this.sigma) {
            this.sizeNodes();
            this.positionNodes();
            this.statistics.refresh();
            this.loading = false;
            this.sigma.refresh();
        }
    });
}

ActivityGraph.prototype.clear = function () {
    this.blocks  = 0;
    this.indexes = [];
    if (this.sigma) {
        this.sigma.graph.clear();
    }
}

ActivityGraph.prototype.sizeNodes = function () {
    _.each(this.sigma.graph.nodes(), function (node) {
        var deg = this.sigma.graph.degree(node.id);
        node.size = this.settings.maxNodeSize * Math.sqrt(deg);
    }, this);
}

ActivityGraph.prototype.nodesByType = function (type) {
    return _.chain(this.sigma.graph.nodes()).filter(function (node) {
        return node.type == type;
    });
}

ActivityGraph.prototype.positionNodes = function () {
    for (type = 0; type < 3; type++) {
        var nodes = this.nodesByType(type).value();
        var i, len = nodes.length, slice = 2 * Math.PI / len;

        for (i = 0; i < len; i++) {
            var angle = slice * i, node = nodes[i];
            var graph = this.sigma.graph.nodes(node.id);
            graph.x = (type + 1) * Math.cos(angle);
            graph.y = (type + 1) * Math.sin(angle);
        }
    }
}

ActivityGraph.prototype.addNode = function (node) {
    if (!_.contains(this.indexes, node.id)) {
        node.x = Math.random();
        node.y = Math.random();
        this.indexes.push(node.id);
        this.sigma.graph.addNode(node);
    }
}

ActivityGraph.prototype.addEdge = function (edge) {
    if (!_.contains(this.indexes, edge.id)) {
        this.indexes.push(edge.id);
        this.sigma.graph.addEdge(edge);
    }
}

ActivityGraph.prototype.addTx = function (tx) {
    if (_.contains(this.indexes, tx.id)) { return; }
    this.addNode({
        id: tx.id,
        label: tx.id,
        type: 0,
        amount: tx.amount,
        color: this.colors.tx,
        size: 1
    });
    this.indexes.push(tx.id);
    this.addTxSender(tx);
    this.addTxRecipient(tx);
}

ActivityGraph.prototype.addAccount = function (id) {
    this.addNode({
        id: id,
        type: 2,
        label: id,
        color: this.colors.account,
        size: 1
    });
}

ActivityGraph.prototype.amount = function (tx, sign) {
    return (sign + tx.amount / Math.pow(10, 8)) + " XCR";
}

ActivityGraph.prototype.addTxSender = function (tx) {
    this.addAccount(tx.senderId);
    this.addEdge({
        id: tx.id + tx.senderId + Math.random(),
        label: this.amount(tx, '-'),
        source: tx.senderId,
        target: tx.id,
        color: this.colors.debit,
        size: 1
    });
}

ActivityGraph.prototype.addTxRecipient = function (tx) {
    this.addAccount(tx.recipientId);
    this.addEdge({
        id: tx.id + tx.recipientId + Math.random(),
        label: this.amount(tx, '+'),
        source: tx.id,
        target: tx.recipientId,
        color: this.colors.credit,
        size: 1
    });
}

ActivityGraph.prototype.addBlock = function (block, addTxs) {
    if (_.contains(this.indexes, block.id)) { return; }
    if ((this.blocks + 1) > this.maxBlocks) { this.clear(); }
    this.addNode({
        id: block.id,
        label: block.id,
        timestamp: block.timestamp,
        type: 1,
        color: this.colors.block,
        size: 1
    });
    this.blocks++;
    this.indexes.push(block.id);
    this.addBlockGenerator(block);
    if (addTxs) this.addBlockTxs(block);
}

ActivityGraph.prototype.generatorID = function (block) {
    if (block.generator !== undefined) {
        return block.generator;
    } else {
        return block.generatorId;
    }
}

ActivityGraph.prototype.addBlockGenerator = function (block) {
    var generatorID = this.generatorID(block);
    this.addAccount(generatorID);
    this.addEdge({
        id: block.id + generatorID,
        label: block.height.toString(),
        source: generatorID,
        target: block.id,
        color: this.colors.account,
        size: 1
    })
}

ActivityGraph.prototype.addBlockTxs = function (block) {
    if (block.numberOfTransactions <= 0) { return; }
    this.blockTransactions(block.id, function (res) {
        if (!res.success) { return; }
        _.each(res.transactions, function (tx) {
            this.addTx(tx);
            this.addEdge({
                id: block.id + tx.id,
                source: block.id,
                target: tx.id,
                color: this.colors.block,
                size: 1
            })
        }, this);
    });
}

angular.module('insight.activity').factory('activityGraph',
  function ($http, $interval) {
      return function (scope) {
          var activityGraph = new ActivityGraph($http);
          activityGraph.refresh();

          $interval(function () {
              activityGraph.refresh();
          }, 30000);

          scope.activityGraph = activityGraph;
          scope.nodeSelect = activityGraph.nodeSelect;
          scope.cameraMenu = activityGraph.cameraMenu;
          scope.statistics = activityGraph.statistics;

          activityGraph.sigma.bind('clickNode', function (event) {
              scope.$apply(function () {
                  activityGraph.nodeSelect.add(event);
              });
          });

          activityGraph.sigma.bind('clickStage doubleClickStage', function (event) {
              scope.$apply(function () {
                  activityGraph.nodeSelect.remove(event);
              });
          });

          return activityGraph;
      }
  });
