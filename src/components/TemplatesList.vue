<template>
  <div class="templates-list">
    <div class="q-pa-md">
      <q-input
        v-model="searchQuery"
        placeholder="Поиск шаблонов..."
        outlined
        dense
        clearable
        @input="filterTemplates"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-list>
      <q-item-label header class="text-grey-8">
        Шаблоны ({{ filteredTemplates.length }})
      </q-item-label>

      <q-item
        v-for="template in sortedTemplates"
        :key="template.id"
        clickable
        v-ripple
        :active="currentTemplate?.id === template.id"
        @click="selectTemplate(template)"
        class="template-item"
      >
        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ template.name }}
          </q-item-label>
          <q-item-label
            caption
            class="text-grey-6"
            v-if="loadedTitles[template.id]"
          >
            {{ loadedTitles[template.id] }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item v-if="filteredTemplates.length === 0">
        <q-item-section>
          <q-item-label class="text-grey-6"> Шаблоны не найдены </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <div class="q-pa-md" v-if="isLoading">
      <q-skeleton height="50px" class="q-mb-sm" v-for="n in 5" :key="n" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useAppState } from 'src/stores/store';
import {
  TemplateService,
  type TemplateFile,
} from 'src/services/TemplateService';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const appState = useAppState();
const templateService = new TemplateService();

const searchQuery = ref('');
const isLoading = ref(false);
const loadedTitles = reactive<Record<string, string>>({});

const currentTemplate = computed(() => appState.currentTemplate);
const templates = computed(() => appState.templates);

// Определяем события, которые компонент может испускать
const emit = defineEmits(['template-selected']);

const filteredTemplates = computed(() => {
  if (!searchQuery.value) {
    return templates.value;
  }

  const query = searchQuery.value.toLowerCase();
  return templates.value.filter(
    (template) =>
      template.name.toLowerCase().includes(query) ||
      template.fileName.toLowerCase().includes(query) ||
      (loadedTitles[template.id] &&
        loadedTitles[template.id].toLowerCase().includes(query))
  );
});

// Сортировка шаблонов по порядковому номеру
const sortedTemplates = computed(() => {
  return [...filteredTemplates.value].sort((a, b) => {
    // Извлекаем числовой номер из начала названия
    const getNumber = (name: string) => {
      const match = name.match(/^(\d+)\./);
      return match ? parseInt(match[1], 10) : 0;
    };

    const numA = getNumber(a.name);
    const numB = getNumber(b.name);

    return numA - numB;
  });
});

const selectTemplate = async (template: TemplateFile) => {
  try {
    isLoading.value = true;

    // Загружаем полные данные шаблона
    const fullTemplate = await templateService.loadTemplate(template.fileName);
    if (fullTemplate) {
      // Сохраняем title шаблона в нашем локальном хранилище
      if (fullTemplate.title && fullTemplate.title !== template.name) {
        loadedTitles[template.id] = fullTemplate.title;
      }

      appState.setCurrentTemplate(fullTemplate);
      appState.parseContext();
      // Испускаем событие выбора шаблона
      emit('template-selected');
    } else {
      throw new Error('Failed to load template');
    }
  } catch (error) {
    console.error('Error selecting template:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке шаблона',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const filterTemplates = () => {
  // Логика фильтрации реализована через computed свойство
};

const loadTemplates = async () => {
  try {
    isLoading.value = true;
    const templatesList = await templateService.loadTemplatesList();
    appState.setTemplates(templatesList);

    // Загружаем titles для всех шаблонов в фоновом режиме
    setTimeout(() => {
      loadTemplateTitles(templatesList);
    }, 100);
  } catch (error) {
    console.error('Error loading templates:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке списка шаблонов',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

// Загрузка titles шаблонов в фоновом режиме
const loadTemplateTitles = async (templatesList: TemplateFile[]) => {
  for (const template of templatesList) {
    try {
      const fullTemplate = await templateService.loadTemplate(
        template.fileName
      );
      if (
        fullTemplate &&
        fullTemplate.title &&
        fullTemplate.title !== template.name
      ) {
        loadedTitles[template.id] = fullTemplate.title;
      }
    } catch (error) {
      console.error(`Error loading title for template ${template.id}:`, error);
    }
  }
};

onMounted(async () => {
  if (!appState.isTemplateListLoaded) {
    await loadTemplates();
  }
});
</script>

<style scoped>
.templates-list {
  height: 100%;
  overflow-y: auto;
}

.template-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.template-item.q-item--active {
  background-color: rgba(25, 118, 210, 0.12);
}
</style>
