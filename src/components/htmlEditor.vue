<template>
  <q-card flat class="editor-card" ref="cardEl">
    <q-banner class="bg-primary text-white no-border-radius q-px-md q-py-sm">
      <template v-slot:avatar>
        <q-icon name="code" />
      </template>
      <q-badge class="q-ml-md" color="white" text-color="primary">
        Шаблон
      </q-badge>
    </q-banner>
    <div
      class="editor-content"
      contenteditable="plaintext-only"
      @input="updateContent"
      ref="contentEl"
    ></div>
  </q-card>
</template>

<style scoped>
.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.editor-content {
  flex: 1;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 70vh;
  outline: none;
  padding: 0.5rem;
}

.no-border-radius {
  border-radius: 0;
}
</style>

<script setup lang="ts">
defineOptions({
  name: 'htmlEditor',
});

import { useAppState } from 'src/stores/store';
import { ref, onMounted, watch } from 'vue';

const state = useAppState();
const contentEl = ref<HTMLDivElement | null>(null);
const cardEl = ref<HTMLDivElement | null>(null);

const updateContent = () => {
  if (contentEl.value) {
    state.context = contentEl.value.innerText;
    state.parseContext();
  }
};

// Обновляем содержимое редактора при изменении state.context извне
watch(
  () => state.context,
  (newValue) => {
    if (contentEl.value && contentEl.value.innerText !== newValue) {
      contentEl.value.innerText = newValue;
    }
  }
);

// Инициализация редактора при монтировании
onMounted(() => {
  if (contentEl.value && state.context) {
    contentEl.value.innerText = state.context;
  }
});
</script>
