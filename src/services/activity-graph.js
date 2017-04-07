'use strict';

const ActivityGraph = function () {
    this.loading   = true;
    this.blocks    = 0;
    this.maxBlocks = 20;
    this.indexes   = [];

    this.colors = {
        account: '#0288d1', // Steel Blue
        credit:  '#7CB342', // Lawn Green
        debit:   '#d32f2f', // Red
        block:   '#f57c00', // Dark Orange
        tx:      '#5f696e'  // Grey
    };

    this.renderer = {
        container: 'sigma-canvas',
        type: 'canvas'
    };

    this.settings = {
        sideMargin: 1,
        singleHover: true,
        minNodeSize: 0.5,
        maxNodeSize: 16,
        drawLabels: false,
        defaultEdgeType: 'arrow'
    };

    this.sigma = new sigma({
        renderer: this.renderer,
        settings: this.settings
    });

    function NodeSelect(sigma) {
        this.sigma = sigma;
        this.color = '#5bc0de';

        this.add = function (event) {
            this.remove(event);
            this.node       = event.data.node;
            this.prevColor  = this.node.color;
            this.node.color = this.color;
            this.sigma.refresh();
        };

        this.remove = function (event) {
            if (this.node) {
                this.node.color = this.prevColor;
                this.prevColor  = undefined;
                this.node       = undefined;
            }
            this.sigma.refresh();
        };

        this.selected = function () {
            return this.node !== undefined;
        };

        this.type = function () {
            if (this.selected()) {
                return this.node.type;
            } else {
                return undefined;
            }
        };

        this.href = function () {
            switch (this.type()) {
                case 0:
                return `/tx/${this.node.id}`;
                case 1:
                return `/block/${this.node.id}`;
                case 2:
                return `/address/${this.node.id}`;
                default:
                return '#';
            }
        };
    }

    this.nodeSelect = new NodeSelect(this.sigma);

    function CameraMenu(camera) {
        this.camera = camera;

        this.reset = function () {
            if (this.camera) {
                this.camera.goTo({ x: 0, y: 0, angle: 0, ratio: 1 });
            }
        };
    }

    this.cameraMenu = new CameraMenu(this.sigma.camera);

    function Statistics(graph) {
        this.graph  = graph;
        this.volume = this.txs = this.blocks = this.accounts = 0;

        this.refresh = function () {
            const txs      = this.graph.nodesByType(0);
            const blocks   = this.graph.nodesByType(1);
            const accounts = this.graph.nodesByType(2);

            this.txs       = txs.size().value();
            this.volume    = txsVolume(txs);
            this.blocks    = blocks.size().value();
            this.beginning = minTime(blocks);
            this.end       = maxTime(blocks);
            this.accounts  = accounts.size().value();
        };

        var txsVolume = chain => chain.reduce((vol, tx) => vol += tx.amount, 0).value();

        var minTime = chain => chain.min(block => {
            if (block.timestamp > 0) {
                return block.timestamp;
            }
        }).value().timestamp;

        var maxTime = chain => chain.max(block => {
            if (block.timestamp > 0) {
                return block.timestamp;
            }
        }).value().timestamp;
    }

    this.statistics = new Statistics(this);
};

ActivityGraph.prototype.refresh = function (block) {
    if (block) {
        this.addBlock(block);
    }
    if (this.blocks > 0) {
        this.loading = false;
    }
    if (this.sigma) {
        this.sizeNodes();
        this.positionNodes();
        this.statistics.refresh();
        this.sigma.refresh();
    }
};

ActivityGraph.prototype.clear = function () {
    this.blocks  = 0;
    this.indexes = [];
    if (this.sigma) {
        this.sigma.graph.clear();
    }
};

ActivityGraph.prototype.sizeNodes = function () {
    _.each(this.sigma.graph.nodes(), function (node) {
        const deg = this.sigma.graph.degree(node.id);
        node.size = this.settings.maxNodeSize * Math.sqrt(deg);
    }, this);
};

ActivityGraph.prototype.nodesByType = function (type) {
    return _.chain(this.sigma.graph.nodes()).filter(node => node.type === type);
};

ActivityGraph.prototype.positionNodes = function () {
    for (let type = 0; type < 3; type++) {
        const nodes = this.nodesByType(type).value();
        let i;
        const len = nodes.length;
        const slice = 2 * Math.PI / len;

        for (i = 0; i < len; i++) {
            const angle = slice * i;
            const graph = this.sigma.graph.nodes(nodes[i].id);
            graph.x = (type + 1) * Math.cos(angle);
            graph.y = (type + 1) * Math.sin(angle);
        }
    }
};

ActivityGraph.prototype.addNode = function (node) {
    if (!_.contains(this.indexes, node.id)) {
        node.x = Math.random();
        node.y = Math.random();
        this.indexes.push(node.id);
        this.sigma.graph.addNode(node);
    }
};

ActivityGraph.prototype.addEdge = function (edge) {
    if (!_.contains(this.indexes, edge.id)) {
        this.indexes.push(edge.id);
        this.sigma.graph.addEdge(edge);
    }
};

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
};

ActivityGraph.prototype.addAccount = function (id) {
    this.addNode({
        id: id,
        type: 2,
        label: id,
        color: this.colors.account,
        size: 1
    });
};

ActivityGraph.prototype.amount = (tx, sign) => `${sign + tx.amount / Math.pow(10, 8)} LSK`;

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
};

ActivityGraph.prototype.addTxRecipient = function (tx) {
    if (!tx.recipientId) { return; }
    this.addAccount(tx.recipientId);
    this.addEdge({
        id: tx.id + tx.recipientId + Math.random(),
        label: this.amount(tx, '+'),
        source: tx.id,
        target: tx.recipientId,
        color: this.colors.credit,
        size: 1
    });
};

ActivityGraph.prototype.addBlock = function (block) {
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
    this.addBlockTxs(block);
};

ActivityGraph.prototype.addBlockGenerator = function (block) {
    this.addAccount(block.generatorId);
    this.addEdge({
        id: block.id + block.generatorId,
        label: block.height.toString(),
        source: block.generatorId,
        target: block.id,
        color: this.colors.account,
        size: 1
    });
};

ActivityGraph.prototype.addBlockTxs = function (block) {
    if (!_.isEmpty(block.transactions)) {
        _.each(block.transactions, function (tx) {
            this.addTx(tx);
            this.addEdge({
                id: block.id + tx.id,
                source: block.id,
                target: tx.id,
                color: this.colors.block,
                size: 1
            });
        }, this);
    }
};

angular.module('lisk_explorer.tools').factory('activityGraph',
  ($socket, $rootScope) => vm => {
      const activityGraph = new ActivityGraph(), ns = $socket('/activityGraph');

      vm.activityGraph = activityGraph;
      vm.nodeSelect = activityGraph.nodeSelect;
      vm.cameraMenu = activityGraph.cameraMenu;
      vm.statistics = activityGraph.statistics;

      activityGraph.sigma.bind('clickNode', event => {
        // $rootScope.$apply(function () {
              activityGraph.nodeSelect.add(event);
        // });
      });

      activityGraph.sigma.bind('clickStage doubleClickStage', event => {
        // $rootScope.$apply(function () {
              activityGraph.nodeSelect.remove(event);
        // });
      });

      ns.on('data', res => { activityGraph.refresh(res.block); });

      $rootScope.$on('$destroy', event => {
          ns.removeAllListeners();
      });

      $rootScope.$on('$stateChangeStart', (event, next, current) => {
          ns.emit('forceDisconnect');
      });

      return activityGraph;
  });
