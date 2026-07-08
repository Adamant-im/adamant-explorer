<script setup>
// Minimal justified tab bar; the active tab is controlled via v-model.
defineProps({
  /** Tab definitions in display order. */
  tabs: { type: Array, required: true },
  /** Id of the active tab. */
  modelValue: { type: String, required: true },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="tabs-bar" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="tab-button"
      :class="{ active: tab.id === modelValue }"
      :aria-selected="tab.id === modelValue"
      @click="$emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
