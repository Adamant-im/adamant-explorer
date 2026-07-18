<script setup>
import { IconMoon, IconSun } from '@tabler/icons-vue';
import { useTheme } from '../composables/useTheme';

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Use light theme' : 'Use dark theme'"
    :title="isDark ? 'Use light theme' : 'Use dark theme'"
    @click="toggleTheme"
  >
    <IconSun v-if="isDark" aria-hidden="true" />
    <IconMoon v-else aria-hidden="true" />
  </button>
</template>
