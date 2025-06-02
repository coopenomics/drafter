<template>
  <div>
    <q-btn
      label="Загрузить шаблон"
      @click="openDialog"
      class="full-width"
      color="teal"
    />
    <q-dialog v-model="dialogVisible" :maximized="true">
      <q-card>
        <q-card-section>
          <q-input
            placeholder="Вставьте содержимое файла шаблона"
            full-width
            v-model="htmlInput"
            type="textarea"
            rows="10"
            autogrow
            counter
            :max-height="dialogMaxHeight"
          />
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Сохранить" color="primary" @click="saveHtml" />
          <q-btn label="Отменить" color="negative" @click="closeDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from 'src/stores/store';
import { ref } from 'vue';

defineOptions({
  name: 'templateUploader',
});

const appState = useAppState();
const dialogVisible = ref(false);
const htmlInput = ref('');
const dialogMaxHeight = '70vh';

const openDialog = () => {
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const saveHtml = () => {
  const json = JSON.parse(htmlInput.value);

  // Используем object_model если он есть, иначе используем обычный model
  const modelData = json.object_model || json.model;

  appState.setContext(json.context, {
    vars: json.model || {},
    translation: json.translation || {},
    object_model: modelData || {},
  });

  // console.log(appState.context);
  closeDialog();
  htmlInput.value = '';
  appState.parseContext();
};
</script>
