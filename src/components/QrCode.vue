<script setup>
// QR code rendered onto a canvas with the ADAMANT logo in the middle.
import { onMounted, ref, watch } from 'vue';
import QrCodeWithLogo from 'qr-code-with-logo';

const props = defineProps({
  /** Content to encode, e.g. a messenger deep link for an address. */
  content: { type: String, required: true },
  /** Rendered size in CSS pixels. */
  size: { type: Number, default: 220 },
});

const canvas = ref(null);

/** (Re)draws the QR code onto the canvas. */
function draw() {
  if (!canvas.value || !props.content) {
    return;
  }

  QrCodeWithLogo.toCanvas({
    canvas: canvas.value,
    content: props.content,
    width: props.size,
    logo: {
      src: '/adm-qr-invert.png',
      borderSize: 0,
      borderRadius: 50,
      logoSize: 0.25,
    },
  });
}

onMounted(draw);
watch(() => props.content, draw);
</script>

<template>
  <canvas ref="canvas" class="qr-code"></canvas>
</template>
