<script setup>
import { computed } from 'vue';
import {
  IconAdjustments,
  IconAppWindow,
  IconArrowDown,
  IconArrowUp,
  IconArrowUpRight,
  IconDatabaseImport,
  IconDatabaseExport,
  IconGift,
  IconMessage,
  IconSignature,
  IconUserPlus,
  IconUsersGroup,
  IconWallet,
} from '@tabler/icons-vue';
import { operationMeta } from '../lib/transactionTypes.js';

const props = defineProps({
  tx: { type: Object, required: true },
});

const meta = computed(() => operationMeta(props.tx));
const icons = {
  transfer: IconArrowUpRight,
  gift: IconGift,
  deposit: IconArrowDown,
  withdraw: IconArrowUp,
  signature: IconSignature,
  delegate: IconUserPlus,
  vote: IconWallet,
  multisignature: IconUsersGroup,
  dapp: IconAppWindow,
  message: IconMessage,
  state: IconAdjustments,
  'dapp-deposit': IconDatabaseImport,
  'dapp-withdrawal': IconDatabaseExport,
};
const icon = computed(() => icons[meta.value.icon] || IconAdjustments);
</script>

<template>
  <span class="operation-type" :class="`tone-${meta.tone}`">
    <span class="operation-icon" aria-hidden="true">
      <component :is="icon" />
    </span>
    <span>{{ meta.label }}</span>
  </span>
</template>
