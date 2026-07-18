<script setup>
import { IconBrandGithub, IconBrandX, IconExternalLink } from '@tabler/icons-vue';
</script>

<template>
  <footer class="site-footer">
    <div class="container site-footer-inner">
      <p>ADAMANT Explorer <span>•</span> Open-source blockchain data</p>
      <nav class="footer-links" aria-label="Project links">
        <a href="/api/getLastTransactions">Open API <IconExternalLink aria-hidden="true" /></a>
        <a href="https://adamant.im" target="_blank" rel="noopener">
          Adamant.im <IconExternalLink aria-hidden="true" />
        </a>
        <a href="https://github.com/Adamant-im" target="_blank" rel="noopener">
          GitHub <IconBrandGithub aria-hidden="true" />
        </a>
        <a
          href="https://twitter.com/adamant_im"
          target="_blank"
          rel="noopener"
          aria-label="ADAMANT on X"
        >
          <IconBrandX aria-hidden="true" />
        </a>
      </nav>
    </div>
  </footer>
</template>
