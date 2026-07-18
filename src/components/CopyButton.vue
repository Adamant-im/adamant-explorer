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
const button = ref(null);
const feedbackPosition = ref({});

let hideTimer = null;

/** Keeps teleported feedback beside the button without table overflow clipping it. */
function positionFeedback() {
  const rect = button.value?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  feedbackPosition.value = {
    top: `${rect.top - 6}px`,
    left: `${rect.left + rect.width / 2}px`,
  };
}

/** Removes the short-lived positioning listeners used while feedback is visible. */
function stopTrackingFeedback() {
  window.removeEventListener('scroll', positionFeedback, true);
  window.removeEventListener('resize', positionFeedback);
}

/** Copies the text and flashes the feedback tooltip. */
async function copy() {
  copied.value = false;
  failed.value = false;
  button.value?.dispatchEvent(new Event('tooltip:hide'));

  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
  } catch {
    // Clipboard access can be denied on insecure origins
    failed.value = true;
  }

  positionFeedback();
  window.addEventListener('scroll', positionFeedback, true);
  window.addEventListener('resize', positionFeedback);
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    copied.value = false;
    failed.value = false;
    stopTrackingFeedback();
  }, 1500);
}

onBeforeUnmount(() => {
  clearTimeout(hideTimer);
  stopTrackingFeedback();
});
</script>

<template>
  <button
    ref="button"
    v-tooltip="'Copy to clipboard'"
    type="button"
    class="copy-button"
    :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
    @click="copy"
  >
    <IconCheck v-if="copied" aria-hidden="true" />
    <IconCopy v-else aria-hidden="true" />
  </button>
  <Teleport to="body">
    <span
      v-if="copied || failed"
      class="copy-tooltip"
      :class="{ error: failed }"
      :style="feedbackPosition"
      role="status"
      aria-live="polite"
    >
      {{ copied ? 'Copied!' : 'Copy failed' }}
    </span>
  </Teleport>
</template>
