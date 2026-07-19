<script setup>
import CopyButton from './CopyButton.vue';

defineProps({
  address: { type: String, default: '' },
  label: { type: String, default: '' },
  path: { type: String, default: '' },
});
</script>

<template>
  <div v-if="address" class="identity-cell">
    <router-link v-if="path" :to="path" class="identity-link">
      <span v-if="label && label !== address" class="identity-name">{{ label }}</span>
      <span class="identity-address">{{ address }}</span>
    </router-link>
    <div v-else class="identity-link">
      <span v-if="label && label !== address" class="identity-name">{{ label }}</span>
      <span class="identity-address">{{ address }}</span>
    </div>
    <CopyButton :text="address" />
  </div>
  <span v-else class="text-muted">{{ label || 'Protocol' }}</span>
</template>
