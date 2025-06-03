<template>
  <q-btn-dropdown
    flat
    no-caps
    :label="shortPath"
    icon="folder"
    class="registry-path-dropdown"
  >
    <q-card class="no-shadow">
      <q-card-section>
        <div class="text-subtitle2">Текущий путь к реестру</div>
        <div class="registry-path">{{ registryPath }}</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Изменить" color="primary" @click="openDialog" />
      </q-card-actions>
    </q-card>
  </q-btn-dropdown>

  <registry-path-dialog v-model="showDialog" :is-first-launch="false" />
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useSettingsStore } from 'src/stores/settings';
import RegistryPathDialog from './RegistryPathDialog.vue';

export default defineComponent({
  name: 'RegistryPathSetter',

  components: {
    RegistryPathDialog,
  },

  setup() {
    const settingsStore = useSettingsStore();
    const showDialog = ref(false);

    const registryPath = computed(() => settingsStore.registryPath);

    // Сокращенный путь для отображения в кнопке
    const shortPath = computed(() => {
      const path = registryPath.value;
      if (!path) return 'Путь не выбран';

      const parts = path.split('/');
      if (parts.length <= 2) return path;

      return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    });

    const openDialog = () => {
      showDialog.value = true;
    };

    return {
      registryPath,
      shortPath,
      showDialog,
      openDialog,
    };
  },
});
</script>

<style scoped>
.registry-path {
  word-break: break-all;
  max-width: 300px;
}

.registry-path-dropdown {
  max-width: 300px;
  text-align: left;
}
</style>
