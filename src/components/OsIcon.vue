<script setup>
// Operating system icon; the brand name selects a sprite class
// defined in `main.css` (darwin, linux, win, freebsd, unknown).
defineProps({
  /** Full OS string used for the tooltip, e.g. `'linux4.15.0-1044-aws'`. */
  os: { type: String, default: '' },
  /** Brand descriptor from the backend: `{ name: 'linux', group: 2 }`. */
  brand: { type: Object, required: true },
});
</script>

<template>
  <span v-tooltip="os" class="os-icon" :class="`os-${brand.name}`" :aria-label="os"></span>
</template>
