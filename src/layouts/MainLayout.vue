<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          {{ currentTemplate ? currentTemplate.name : 'Редактор шаблонов' }}
        </q-toolbar-title>

        <q-space />

        <!-- Компонент для отображения и изменения пути к реестру -->
        <registry-path-setter />

        <q-btn
          v-if="currentTemplate"
          flat
          dense
          round
          icon="save"
          aria-label="Сохранить"
          color="positive"
          @click="saveCurrentTemplate"
        >
          <q-tooltip>Сохранить шаблон</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-splitter v-model="splitterModel" :limits="[0, 50]" class="full-height">
      <template v-slot:before>
        <div v-if="leftDrawerOpen" class="bg-grey-1 full-height q-pa-sm">
          <TemplatesList @template-selected="closeDrawer" />
        </div>
      </template>

      <template v-slot:after>
        <q-page-container>
          <router-view />
        </q-page-container>
      </template>
    </q-splitter>

    <!-- Диалог выбора пути при первом запуске -->
    <registry-path-dialog v-model="showPathDialog" :is-first-launch="true" />
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAppState } from 'src/stores/store';
import { useSettingsStore } from 'src/stores/settings';
import { useQuasar } from 'quasar';
import TemplatesList from 'src/components/TemplatesList.vue';
import RegistryPathSetter from 'src/components/RegistryPathSetter.vue';
import RegistryPathDialog from 'src/components/RegistryPathDialog.vue';
import { TemplateService } from 'src/services/TemplateService';

const $q = useQuasar();
const appState = useAppState();
const settingsStore = useSettingsStore();
const templateService = new TemplateService();

const leftDrawerOpen = ref(false);
const showPathDialog = ref(false);
const splitterModel = ref(0); // Начальное значение 0 (закрыто)
const savedSplitterWidth = ref(20); // Сохраняем ширину для восстановления

const currentTemplate = computed(() => appState.currentTemplate);

// Проверка при запуске, нужно ли показать диалог выбора пути
onMounted(() => {
  if (settingsStore.isFirstLaunch || !settingsStore.registryPath) {
    showPathDialog.value = true;
  }
});

// Отслеживаем изменение состояния бокового меню
watch(leftDrawerOpen, (isOpen) => {
  if (isOpen) {
    // Открываем боковую панель
    splitterModel.value = savedSplitterWidth.value;
  } else {
    // Сохраняем текущую ширину перед закрытием
    if (splitterModel.value > 0) {
      savedSplitterWidth.value = splitterModel.value;
    }
    // Закрываем боковую панель
    splitterModel.value = 0;
  }
});

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const closeDrawer = () => {
  leftDrawerOpen.value = false;
};

const saveCurrentTemplate = async () => {
  if (!currentTemplate.value) return;

  try {
    // Обновляем данные шаблона из store
    appState.updateCurrentTemplate();

    const success = await templateService.saveTemplate(currentTemplate.value);
    if (success) {
      $q.notify({
        type: 'positive',
        message: `Шаблон "${currentTemplate.value.name}" сохранен`,
        position: 'top',
      });
    } else {
      throw new Error('Save failed');
    }
  } catch (error) {
    console.error('Error saving template:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при сохранении шаблона',
      position: 'top',
    });
  }
};

defineOptions({
  name: 'MainLayout',
});
</script>
