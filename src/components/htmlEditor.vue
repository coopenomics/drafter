<template>
<q-card flat class="q-pa-sm">
  <p class="text-center">Редактор</p>
  <q-input @change="state.parseContext" v-model="state.context" type="textarea" rows="50" class="q-pa-xs" style="word-break: break-all;"></q-input>
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
  name: 'htmlEditor',
});

import { useAppState } from 'src/stores/store';
const state = useAppState()

</script>
