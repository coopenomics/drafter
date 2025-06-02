<template>
  <q-btn @click="download" color="teal" icon="fas fa-download"></q-btn>

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

const download = () => {
  const element = document.createElement('a');
  const file = new Blob([state.getTemplate()], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  const currentDate = new Date().toISOString();
  element.download = `template_${currentDate}.json`;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
}

</script>
