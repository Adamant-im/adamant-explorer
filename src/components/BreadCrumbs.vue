<script setup>
// Breadcrumb trail built from `meta.parent` route references.
// Each route names its parent; the chain is walked up to `home`.
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

/** Human-readable crumb label from a route name like `delegate-monitor`. */
function label(name) {
  return String(name).replace(/-/g, ' ');
}

/**
 * Builds the path for an ancestor crumb. Parents with a dynamic segment
 * derive their parameter from the current route: the `address` parent of
 * a delegate page points at the delegate's own address.
 */
function parentPath(name) {
  switch (name) {
    case 'blocks':
      return '/blocks';
    case 'address':
      return `/address/${route.params.delegateId ?? route.params.address ?? ''}`;
    default:
      return router.resolve({ name }).path;
  }
}

const crumbs = computed(() => {
  const trail = [{ name: route.name, path: null }];
  let parent = route.meta.parent;

  // Walk up the parent chain; route metas are static, so this terminates
  while (parent) {
    trail.unshift({ name: parent, path: parentPath(parent) });
    parent = router.getRoutes().find((r) => r.name === parent)?.meta.parent;
  }

  return trail;
});
</script>

<template>
  <ol v-if="crumbs.length > 1" class="breadcrumbs">
    <li v-for="crumb in crumbs" :key="crumb.name">
      <router-link v-if="crumb.path" :to="crumb.path">{{ label(crumb.name) }}</router-link>
      <span v-else>{{ label(crumb.name) }}</span>
    </li>
  </ol>
</template>
