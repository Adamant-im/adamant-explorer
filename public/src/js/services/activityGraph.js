'use strict';

var ActivityGraph = function($http) {
    this.$http   = $http;
    this.loading = true;
    this.indexes = [];

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
        minNodeSize: 0.5,
        maxNodeSize: 32,
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

        this.add = function(event) {
            this.remove(event);
            this.node       = event.data.node;
            this.prev_color = this.node.color;
            this.node.color = this.color;
            this.sigma.refresh();
        }

        this.remove = function(event) {
            if (this.node) {
                this.node.color = this.prev_color;
                this.prev_color = undefined;
                this.node       = undefined;
            }
            this.sigma.refresh();
        }

        this.selected = function() {
            return this.node !== undefined;
        }

        this.type = function() {
            if (this.selected()) {
                return this.node.type;
            } else {
                return undefined;
            }
        }

        this.href = function() {
            switch(this.type()) {
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

        this.reset = function() {
            if (this.camera) {
                this.camera.goTo({ x: 0, y: 0, angle: 0, ratio: 1 });
            }
        }
    }

    this.cameraMenu = new CameraMenu(this.sigma.camera);

    function Statistics(graph) {
        this.graph  = graph;
        this.volume = this.txs = this.blocks = this.accounts = 0;

        this.refresh = function() {
            var txs       = this.graph.nodes_by_type(0);
            var blocks    = this.graph.nodes_by_type(1);
            var accounts  = this.graph.nodes_by_type(2);
            this.txs      = txs.size().value();
            this.volume   = txs_volume(txs);
            this.blocks   = blocks.size().value();
            this.timespan = blocks_timespan(blocks);
            this.accounts = accounts.size().value();
        }

        var txs_volume = function(chain) {
            return chain.reduce(function(vol, tx) {
                return vol += tx.amount;
            }, 0).value() / Math.pow(10, 8);
        }

        var epoch_time = function() {
            return parseInt(
                new Date(Date.UTC(2014, 4, 2, 0, 0, 0, 0)
            ).getTime() / 1000);
        }

        var min_time = function(chain) {
            return chain.min(function(block) {
                if (block.timestamp > 0) {
                    return block.timestamp;
                }
            }).value().timestamp;
        }

        var max_time = function(chain) {
            return chain.max(function(block) {
                if (block.timestamp > 0) {
                    return block.timestamp;
                }
            }).value().timestamp;
        }

        var blocks_timespan = function(chain) {
            var max = epoch_time() + max_time(chain) * 1000;
            var min = epoch_time() + min_time(chain) * 1000;
            return moment.duration((max - min)).humanize();
        }
    }

    this.statistics = new Statistics(this);
}

ActivityGraph.prototype.last_transactions = function(callback) {
    this.$http.get("/api/getLastTransactions").success(_.bind(callback, this));
}

ActivityGraph.prototype.last_blocks = function(callback) {
    this.$http.get("/api/lastBlocks").success(_.bind(callback, this));
}

ActivityGraph.prototype.block_transactions = function(id, callback) {
    this.$http.get("/api/getTransactionsByBlock" + "?blockId=" + id).success(_.bind(callback, this));
}

ActivityGraph.prototype.get_block = function(id, callback) {
    this.$http.get("/api/getBlock" + "?blockId=" + id).success(_.bind(callback, this));
}

ActivityGraph.prototype.refresh = function() {
    this.loading = true;
    this.last_transactions(function(res) {
        if (!res.success) { return; }
        _.each(res.transactions, function(tx) {
            this.add_tx(tx);
        }, this);
        this.last_blocks(function(res) {
            if (!res.success) { return; }
            _.each(res.blocks, function(block) {
                this.add_block(block, true);
            }, this);
            if (this.sigma) {
                this.size_nodes();
                this.position_nodes();
                this.statistics.refresh();
                this.loading = false;
                this.sigma.refresh();
            }
        });
    });
}

ActivityGraph.prototype.size_nodes = function() {
    _.each(this.sigma.graph.nodes(), function(node) {
        var deg = this.sigma.graph.degree(node.id);
        node.size = this.settings.maxNodeSize * Math.sqrt(deg);
    }, this);
}

ActivityGraph.prototype.nodes_by_type = function(type) {
    return _.chain(this.sigma.graph.nodes()).filter(function(node) {
        return node.type == type;
    });
}

ActivityGraph.prototype.position_nodes = function() {
    for (type = 0; type < 3; type++) {
        var nodes = this.nodes_by_type(type).value();
        var i, len = nodes.length, slice = 2 * Math.PI / len;

        for (i = 0; i < len; i++) {
            var angle = slice * i, node = nodes[i];
            var graph = this.sigma.graph.nodes(node.id);
            graph.x = (type + 1) * Math.cos(angle);
            graph.y = (type + 1) * Math.sin(angle);
        }
    }
}

ActivityGraph.prototype.add_node = function(node) {
    if (!_.contains(this.indexes, node.id)) {
        node.x = Math.random();
        node.y = Math.random();
        this.indexes.push(node.id);
        this.sigma.graph.addNode(node);
    }
}

ActivityGraph.prototype.add_edge = function(edge) {
    if (!_.contains(this.indexes, edge.id)) {
        this.indexes.push(edge.id);
        this.sigma.graph.addEdge(edge);
    }
}

ActivityGraph.prototype.add_tx = function(tx) {
    if (_.contains(this.indexes, tx.id)) { return; }
    this.add_node({
        id: tx.id,
        label: tx.id,
        type: 0,
        amount: tx.amount,
        color: this.colors.tx,
        size: 1
    });
    this.indexes.push(tx.id);
    this.add_tx_block(tx);
    this.add_tx_sender(tx);
    this.add_tx_recipient(tx);
}

ActivityGraph.prototype.add_account = function(id) {
    this.add_node({
        id: id,
        type: 2,
        label: id,
        color: this.colors.account,
        size: 1
    });
}

ActivityGraph.prototype.amount = function(tx, sign) {
    return (sign + tx.amount / Math.pow(10, 8)) + " XCR";
}

ActivityGraph.prototype.add_tx_sender = function(tx) {
    this.add_account(tx.senderId);
    this.add_edge({
        id: tx.id + tx.senderId + Math.random(),
        label: this.amount(tx, '-'),
        source: tx.senderId,
        target: tx.id,
        color: this.colors.debit,
        size: 1
    });
}

ActivityGraph.prototype.add_tx_recipient = function(tx) {
    this.add_account(tx.recipientId);
    this.add_edge({
        id: tx.id + tx.recipientId + Math.random(),
        label: this.amount(tx, '+'),
        source: tx.id,
        target: tx.recipientId,
        color: this.colors.credit,
        size: 1
    });
}

ActivityGraph.prototype.add_tx_block = function(tx) {
    this.get_block(tx.blockId, function(res) {
        if (!res.success) { return; }
        this.add_block(res.block, false);
        this.add_edge({
            id: tx.id + tx.blockId,
            label: res.block.height.toString(),
            source: tx.blockId,
            target: tx.id,
            color: this.colors.block,
            size: 1
        })
    });
}

ActivityGraph.prototype.add_block = function(block, add_txs) {
    if (_.contains(this.indexes, block.id)) { return; }
    this.add_node({
        id: block.id,
        label: block.id,
        timestamp: block.timestamp,
        type: 1,
        color: this.colors.block,
        size: 1
    });
    this.indexes.push(block.id);
    this.add_block_generator(block);
    if (add_txs) this.add_block_txs(block);
}

ActivityGraph.prototype.generator_id = function(block) {
    if (block.generator !== undefined) {
        return block.generator;
    } else {
        return block.generatorId;
    }
}

ActivityGraph.prototype.add_block_generator = function(block) {
    var generator_id = this.generator_id(block);
    this.add_account(generator_id);
    this.add_edge({
        id: block.id + generator_id,
        label: block.height.toString(),
        source: generator_id,
        target: block.id,
        color: this.colors.account,
        size: 1
    })
}

ActivityGraph.prototype.add_block_txs = function(block) {
    if (block.transactionsCount <= 0) { return; }
    this.block_transactions(block.id, function(res) {
        if (!res.success) { return; }
        _.each(block.transactions, function(tx) {
            this.add_tx(tx);
            this.add_edge({
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
  function($http, $interval) {
      return function(scope) {
          var activityGraph = new ActivityGraph($http);
          activityGraph.refresh();

          $interval(function() {
              activityGraph.refresh();
          }, 30000);

          scope.activityGraph = activityGraph;
          scope.nodeSelect = activityGraph.nodeSelect;
          scope.cameraMenu = activityGraph.cameraMenu;
          scope.statistics = activityGraph.statistics;

          activityGraph.sigma.bind('clickNode', function(event) {
              scope.$apply(function() {
                  activityGraph.nodeSelect.add(event);
              });
          });

          activityGraph.sigma.bind('clickStage doubleClickStage', function(event) {
              scope.$apply(function() {
                  activityGraph.nodeSelect.remove(event);
              });
          });

          return activityGraph;
      }
  });
