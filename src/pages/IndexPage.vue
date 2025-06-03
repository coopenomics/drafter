<template>
  <q-page>
    <div v-if="!currentTemplate" class="full-height flex flex-center">
      <div class="text-center">
        <q-icon name="description" size="4rem" color="grey-5" />
        <h5 class="text-grey-6 q-mt-md q-mb-md">
          Выберите шаблон для редактирования
        </h5>
        <p class="text-grey-5">
          Используйте меню слева для выбора шаблона из списка
        </p>
      </div>
    </div>

    <div v-else class="q-pa-sm">
      <div class="editor-container">
        <q-splitter v-model="editorSplit" class="full-height">
          <template v-slot:before>
            <htmlEditor class="q-pa-md" />
          </template>

          <template v-slot:after>
            <q-splitter v-model="rightSplit" class="full-height">
              <template v-slot:before>
                <modelViewer class="q-pa-md" />
              </template>

              <template v-slot:after>
                <htmlPreview class="q-pa-md" />
              </template>
            </q-splitter>
          </template>
        </q-splitter>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppState } from 'src/stores/store';
import htmlPreview from 'src/components/htmlPreview.vue';
import htmlEditor from 'src/components/htmlEditor.vue';
import modelViewer from 'src/components/modelViewer.vue';

const appState = useAppState();
const editorSplit = ref(33); // 33% для левой панели
const rightSplit = ref(50); // 50% для средней панели от оставшегося пространства

const currentTemplate = computed(() => appState.currentTemplate);

defineOptions({
  name: 'IndexPage',
});
</script>

<style>
.editor-container {
  height: calc(100vh - 100px);
}

.full-height {
  height: 100%;
}

.q-splitter :deep(.q-splitter__panel) {
  overflow: auto;
}
</style>
