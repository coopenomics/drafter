<template>
  <q-dialog
    v-model="isDialogOpen"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Выбор пути к реестру</div>
        <q-space />
      </q-card-section>

      <q-card-section>
        <p>Укажите путь к директории реестра документов</p>
        <q-input
          v-model="registryPathInput"
          outlined
          label="Путь к реестру"
          class="q-mb-md"
        >
          <template #after>
            <q-btn flat icon="folder" @click="selectDirectory" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Отмена"
          color="primary"
          @click="closeDialog"
          v-if="!isFirstLaunch"
        />
        <q-btn
          flat
          label="Подтвердить"
          color="primary"
          @click="confirmPath"
          :disable="!registryPathInput"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useSettingsStore } from 'src/stores/settings';

export default defineComponent({
  name: 'RegistryPathDialog',

  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    isFirstLaunch: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const settingsStore = useSettingsStore();
    const registryPathInput = ref(settingsStore.registryPath);

    // Вычисляемое свойство для двустороннего связывания диалога
    const isDialogOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    // При первом запуске получаем путь из electron
    onMounted(async () => {
      if (settingsStore.registryPath === '') {
        const path = await window.electronAPI.getRegistryPath();
        if (path) {
          registryPathInput.value = path;
        }
      }
    });

    // Выбор директории через диалог
    const selectDirectory = async () => {
      const selectedPath = await window.electronAPI.selectDirectory();
      if (selectedPath) {
        registryPathInput.value = selectedPath;
      }
    };

    // Подтверждение выбранного пути
    const confirmPath = async () => {
      if (registryPathInput.value) {
        await window.electronAPI.setRegistryPath(registryPathInput.value);
        settingsStore.setRegistryPath(registryPathInput.value);
        isDialogOpen.value = false;
      }
    };

    // Закрытие диалога
    const closeDialog = () => {
      isDialogOpen.value = false;
    };

    return {
      isDialogOpen,
      registryPathInput,
      selectDirectory,
      confirmPath,
      closeDialog,
    };
  },
});
</script>
