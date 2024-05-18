<template>
  <q-card flat>
    <p class="text-center">Предпросмотр</p>
    <pre v-html="state.html" class="line-wrap"></pre>
  </q-card>

</template>

<style scoped>
.line-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

<script setup lang="ts">
defineOptions({
  name: 'htmlPreview',
});

import { useAppState } from 'src/stores/store';
const state = useAppState()

</script>
