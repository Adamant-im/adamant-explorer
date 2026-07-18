<script setup>
// Copy-to-clipboard button with a transient "Copied!" tooltip,
// replacing the legacy clipboard.js dependency with the native API.
import { onBeforeUnmount, ref } from 'vue';
import { IconCheck, IconCopy } from '@tabler/icons-vue';

const props = defineProps({
  /** Text placed on the clipboard when the button is clicked. */
  text: { type: String, required: true },
});

const copied = ref(false);
const failed = ref(false);

let hideTimer = null;

/** Copies the text and flashes the feedback tooltip. */
async function copy() {
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
  } catch {
    // Clipboard access can be denied on insecure origins
    failed.value = true;
  }

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    copied.value = false;
    failed.value = false;
  }, 1500);
}

onBeforeUnmount(() => {
  clearTimeout(hideTimer);
});
</script>

<template>
  <button
    type="button"
    class="copy-button"
    :title="copied ? 'Copied' : 'Copy address'"
    :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
    @click="copy"
  >
    <IconCheck v-if="copied" aria-hidden="true" />
    <IconCopy v-else aria-hidden="true" />
    <span v-if="copied" class="copy-tooltip">Copied!</span>
    <span v-else-if="failed" class="copy-tooltip">Copy failed</span>
  </button>
</template>
