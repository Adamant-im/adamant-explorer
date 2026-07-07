<script setup>
// Copy-to-clipboard button with a transient "Copied!" tooltip,
// replacing the legacy clipboard.js dependency with the native API.
import { ref } from 'vue';

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
</script>

<template>
  <button type="button" class="copy-button" title="Copy to clipboard" @click="copy">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      />
    </svg>
    <span v-if="copied" class="copy-tooltip">Copied!</span>
    <span v-else-if="failed" class="copy-tooltip">Copy failed</span>
  </button>
</template>
