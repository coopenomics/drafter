<template>
  <q-btn @click="state.update()" color="teal" icon="fas fa-refresh">обновить</q-btn>
</template>

<style scoped>
.line-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

<script setup lang="ts">
defineOptions({
  name: 'updateButton',
});

import { useAppState } from 'src/stores/store';
const state = useAppState()

</script>
