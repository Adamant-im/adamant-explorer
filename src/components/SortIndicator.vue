<script setup>
import { IconChevronDown, IconChevronUp } from '@tabler/icons-vue';

defineProps({
  reverse: { type: Boolean, required: true },
});
</script>

<template>
  <component
    :is="reverse ? IconChevronUp : IconChevronDown"
    class="sort-arrow"
    aria-hidden="true"
  />
</template>
