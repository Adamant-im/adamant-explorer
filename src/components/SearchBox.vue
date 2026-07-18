<script setup>
// Universal search: resolves a block id, transaction id, address, or
// delegate name through `/api/search` and navigates to the matching page.
import { onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconSearch } from '@tabler/icons-vue';
import { apiGet } from '../lib/api';

const emit = defineEmits(['found']);

const router = useRouter();
const query = ref('');
const loading = ref(false);
const badQuery = ref(false);

let badQueryTimer = null;

/** Runs the search and navigates to the result page when found. */
async function search() {
  if (!query.value || loading.value) {
    return;
  }

  badQuery.value = false;
  loading.value = true;

  try {
    const data = await apiGet('/api/search', { id: query.value });

    if (data.success !== false && data.id) {
      query.value = '';
      emit('found');
      router.push(`/${data.type}/${data.id}`);
    } else {
      showBadQuery();
    }
  } catch {
    showBadQuery();
  } finally {
    loading.value = false;
  }
}

/** Flashes the "no matching records" hint for two seconds. */
function showBadQuery() {
  badQuery.value = true;
  clearTimeout(badQueryTimer);
  badQueryTimer = setTimeout(() => {
    badQuery.value = false;
  }, 2000);
}

onBeforeUnmount(() => {
  clearTimeout(badQueryTimer);
});
</script>

<template>
  <form class="search-box" role="search" @submit.prevent="search">
    <IconSearch class="search-icon" aria-hidden="true" />
    <input
      v-model.trim="query"
      type="text"
      class="search-input"
      :class="{ error: badQuery, loading }"
      placeholder="Search blocks, transactions, addresses or delegates"
      aria-label="Search"
    />
    <kbd>/</kbd>
    <div v-if="badQuery" class="search-error">No matching records found!</div>
  </form>
</template>
