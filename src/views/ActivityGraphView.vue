<script setup>
// Activity Graph: live visualization of the latest blocks, their
// transactions, and the involved accounts. Rendered with sigma.js v3
// over a graphology graph (replacing the unmaintained sigma v1 build),
// fed by the `/activityGraph` socket namespace.
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue';
import Graph from 'graphology';
import Sigma from 'sigma';
import { useNetworkStore } from '../stores/network';
import { useSocket } from '../composables/useSocket';
import { formatCurrency, timeSpan, toAdm } from '../lib/format';

const network = useNetworkStore();

/** Node kinds: 0 transaction, 1 block, 2 account (legacy type codes). */
const NODE_TYPES = { TX: 0, BLOCK: 1, ACCOUNT: 2 };

const COLORS = {
  account: '#0288d1',
  credit: '#7cb342',
  debit: '#d32f2f',
  block: '#f57c00',
  tx: '#5f696e',
  selected: '#5bc0de',
};

/** The graph resets after this many blocks to stay readable. */
const MAX_BLOCKS = 20;
const MAX_NODE_SIZE = 16;

const container = ref(null);
const loading = ref(true);
const renderer = shallowRef(null);

const graph = new Graph({ multi: true });
let blockCount = 0;

/** Currently selected node id and its original color. */
const selected = reactive({ id: null, type: null, prevColor: null });

const statistics = reactive({ txs: 0, volume: 0, blocks: 0, accounts: 0, beginning: 0, end: 0 });

// --- Graph building ---------------------------------------------------

/** Adds a node once; repeated ids are ignored (multigraph edges are not). */
function addNode(id, attributes) {
  if (!graph.hasNode(id)) {
    graph.addNode(id, { x: Math.random(), y: Math.random(), size: 1, ...attributes });
  }
}

/** Adds a directed edge with an arrow head. */
function addEdge(source, target, color) {
  graph.addEdge(source, target, { color, size: 1, type: 'arrow' });
}

/** Adds a transaction node with its sender and recipient edges. */
function addTx(tx) {
  if (graph.hasNode(tx.id)) {
    return;
  }

  addNode(tx.id, {
    label: `${tx.id} (${toAdm(tx.amount)} ADM)`,
    nodeType: NODE_TYPES.TX,
    amount: tx.amount,
    color: COLORS.tx,
  });

  addNode(tx.senderId, {
    label: tx.senderId,
    nodeType: NODE_TYPES.ACCOUNT,
    color: COLORS.account,
  });
  addEdge(tx.senderId, tx.id, COLORS.debit);

  if (tx.recipientId) {
    addNode(tx.recipientId, {
      label: tx.recipientId,
      nodeType: NODE_TYPES.ACCOUNT,
      color: COLORS.account,
    });
    addEdge(tx.id, tx.recipientId, COLORS.credit);
  }
}

/** Adds a block node with its generator and transaction edges. */
function addBlock(block) {
  if (graph.hasNode(block.id)) {
    return;
  }

  if (blockCount + 1 > MAX_BLOCKS) {
    clear();
  }

  addNode(block.id, {
    label: `Block ${block.height}`,
    nodeType: NODE_TYPES.BLOCK,
    timestamp: block.timestamp,
    color: COLORS.block,
  });
  blockCount++;

  addNode(block.generatorId, {
    label: block.generatorId,
    nodeType: NODE_TYPES.ACCOUNT,
    color: COLORS.account,
  });
  addEdge(block.generatorId, block.id, COLORS.account);

  for (const tx of block.transactions ?? []) {
    addTx(tx);
    addEdge(block.id, tx.id, COLORS.block);
  }
}

/** Removes all nodes and resets the block counter and selection. */
function clear() {
  graph.clear();
  blockCount = 0;
  selected.id = null;
}

/** Nodes of one kind, as `[id, attributes]` pairs. */
function nodesByType(type) {
  return graph
    .nodes()
    .map((id) => [id, graph.getNodeAttributes(id)])
    .filter(([, attributes]) => attributes.nodeType === type);
}

/**
 * Lays out nodes on three concentric circles (transactions inside,
 * blocks in the middle, accounts outside) and sizes them by degree.
 */
function layout() {
  for (const type of [NODE_TYPES.TX, NODE_TYPES.BLOCK, NODE_TYPES.ACCOUNT]) {
    const nodes = nodesByType(type);
    const slice = (2 * Math.PI) / nodes.length;

    nodes.forEach(([id], index) => {
      const angle = slice * index;
      graph.setNodeAttribute(id, 'x', (type + 1) * Math.cos(angle));
      graph.setNodeAttribute(id, 'y', (type + 1) * Math.sin(angle));
    });
  }

  graph.forEachNode((id) => {
    graph.setNodeAttribute(
      id,
      'size',
      Math.min(2 + Math.sqrt(graph.degree(id)) * 2, MAX_NODE_SIZE),
    );
  });
}

/** Recomputes the sidebar statistics from the current graph. */
function refreshStatistics() {
  const txs = nodesByType(NODE_TYPES.TX);
  const blocks = nodesByType(NODE_TYPES.BLOCK);
  const stamps = blocks
    .map(([, attributes]) => attributes.timestamp)
    .filter((timestamp) => timestamp > 0);

  statistics.txs = txs.length;
  statistics.volume = txs.reduce((sum, [, attributes]) => sum + attributes.amount, 0);
  statistics.blocks = blocks.length;
  statistics.accounts = nodesByType(NODE_TYPES.ACCOUNT).length;
  statistics.beginning = stamps.length ? Math.min(...stamps) : 0;
  statistics.end = stamps.length ? Math.max(...stamps) : 0;
}

// --- Selection --------------------------------------------------------

/** Highlights a node and remembers it for the "open" action. */
function selectNode(id) {
  deselectNode();
  selected.id = id;
  selected.type = graph.getNodeAttribute(id, 'nodeType');
  selected.prevColor = graph.getNodeAttribute(id, 'color');
  graph.setNodeAttribute(id, 'color', COLORS.selected);
}

/** Restores the previously selected node's color. */
function deselectNode() {
  if (selected.id && graph.hasNode(selected.id)) {
    graph.setNodeAttribute(selected.id, 'color', selected.prevColor);
  }

  selected.id = null;
  selected.type = null;
}

/** Explorer path for the selected node. */
const selectedHref = computed(() => {
  switch (selected.type) {
    case NODE_TYPES.TX:
      return `/tx/${selected.id}`;
    case NODE_TYPES.BLOCK:
      return `/block/${selected.id}`;
    case NODE_TYPES.ACCOUNT:
      return `/address/${selected.id}`;
    default:
      return '#';
  }
});

/** Resets the camera to the default position and zoom. */
function resetCamera() {
  renderer.value?.getCamera().animatedReset();
}

// --- Socket and renderer lifecycle -------------------------------------

const socket = useSocket('/activityGraph');

socket.on('data', (res) => {
  if (!res.block) {
    return;
  }

  addBlock(res.block);
  layout();
  refreshStatistics();

  if (blockCount > 0) {
    loading.value = false;
  }
});

onMounted(() => {
  renderer.value = new Sigma(graph, container.value, {
    renderEdgeLabels: false,
    labelRenderedSizeThreshold: 8,
  });

  renderer.value.on('clickNode', ({ node }) => selectNode(node));
  renderer.value.on('clickStage', () => deselectNode());
});

onBeforeUnmount(() => {
  renderer.value?.kill();
  renderer.value = null;
});
</script>

<template>
  <section>
    <h1>Activity Graph</h1>
    <hr />
    <p>
      The following is a live graphical visualisation of the ADAMANT blockchain. Upon initialization
      only the latest block is shown. Subsequent blocks are added to the graph as they are forged by
      the network. After reaching a maximum of {{ MAX_BLOCKS }} blocks, the graph will automatically
      reset to the current block height and start again.
    </p>

    <div class="graph-layout">
      <div class="graph-canvas-wrap">
        <div id="sigma-canvas" ref="container"></div>
        <div v-if="loading" class="hud hud-loading">
          <span class="text-muted">Loading graph <span class="spinner"></span></span>
        </div>
        <div v-if="selected.id" class="hud hud-node">
          <button type="button" class="btn" title="Cancel node selection" @click="deselectNode">
            ✕
          </button>
          <router-link class="btn" :to="selectedHref" title="Open selected node in the explorer">
            Open
          </router-link>
        </div>
        <div class="graph-controls">
          <button type="button" class="btn" title="Reset camera position/zoom" @click="resetCamera">
            Reset Camera
          </button>
          <p class="text-muted">Updated every 10 seconds.</p>
        </div>
      </div>

      <aside class="graph-sidebar">
        <h4>Legend</h4>
        <p>Use the following legend to help identify nodes and their corresponding interactions.</p>
        <p class="legend">
          <span class="badge badge-account">Account</span>
          <span class="badge badge-block">Block</span>
          <span class="badge badge-tx">Tx</span>
          <span class="badge badge-credit">Credit</span>
          <span class="badge badge-debit">Debit</span>
        </p>

        <hr />

        <h4>Navigation</h4>
        <p>
          To zoom in and out, use the pinch-to-zoom motion on the trackpad/touchscreen or scroll the
          mouse wheel. To pan around the canvas tap/click and drag. Single tap/click on a node to
          inspect it.
        </p>

        <hr />

        <h4>Statistics</h4>
        <div class="table-responsive">
          <table class="table statistics">
            <tbody>
              <tr>
                <th>Txs</th>
                <td>{{ statistics.txs }}</td>
              </tr>
              <tr>
                <th>Volume</th>
                <td>
                  {{ formatCurrency(statistics.volume, network.currency, network.decimalPlaces) }}
                  <span class="text-muted">{{ network.currency.symbol }}</span>
                </td>
              </tr>
              <tr>
                <th>Blocks</th>
                <td>{{ statistics.blocks }}</td>
              </tr>
              <tr>
                <th>Timespan</th>
                <td>
                  {{ statistics.blocks ? timeSpan(statistics.beginning, statistics.end) : '—' }}
                </td>
              </tr>
              <tr>
                <th>Accounts</th>
                <td>{{ statistics.accounts }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  </section>
</template>
