<template>
  <q-card flat class="preview-card">
    <q-banner class="bg-green text-white no-border-radius q-px-md q-py-sm">
      <template v-slot:avatar>
        <q-icon name="visibility" />
      </template>
      <q-badge class="q-ml-md" color="white" text-color="green">
        Предпросмотр
      </q-badge>
    </q-banner>
    <div class="preview-content" v-html="state.html"></div>
  </q-card>
</template>

<style scoped>
.preview-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.preview-content {
  flex: 1;
  padding: 0.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
}

.no-border-radius {
  border-radius: 0;
}
</style>

<script setup lang="ts">
defineOptions({
  name: 'htmlPreview',
});

import { useAppState } from 'src/stores/store';
const state = useAppState();
</script>
