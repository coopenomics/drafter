<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
<q-card flat>
    <p class="text-center">Переменные и переводы</p>
    <q-tree
      :nodes="nodes"
      node-key="id"
      :label-key="labelKey"
      :children-key="childrenKey"
      :default-expanded="defaultExpanded"
    >
      <template v-slot:default-body="{ node }">
        <div v-if="!node.children" class="q-pa-xs">
          <q-input dense filled v-model="node[displayKey]" @change="updateValue(node)" />
        </div>
      </template>
    </q-tree>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { QTree, QInput, QCard } from 'quasar';
import { useAppState } from 'src/stores/store';

defineOptions({
  name: 'modelViewer',
});

const state = useAppState();
const displayKey = 'value'; // ключ, который отображается в input
const labelKey = 'label';
const childrenKey = 'children';
const defaultExpanded = ref(true);
// Измените строку с определением `nodes` на следующую:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodes = ref<any[]>([]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateStateValue = (keys: string[], val: any, obj: any): void => {
  if (keys.length === 1) {
    obj[keys[0]] = val;
    return;
  }
  const key = keys.shift();
  if (key) {
    if (!obj[key]) {
      obj[key] = {};
    }
    updateStateValue(keys, val, obj[key]);
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateValue = (node: any): void => {
  const keys = node.id.split('|');
  updateStateValue(keys, node.value, state.model);
  state.update()
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateTree = (obj: any, path: string[] = []): any[] => {
  return Object.keys(obj).map((key) => {
    const id = [...path, key].join('|');
    // Временный тип для item, включает возможные children
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item: any = {
      id,
      label: key,
      value: '', // Первоначально value пустое, будет заполнено ниже
    };
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      item.children = generateTree(obj[key], [...path, key]);
    } else {
      item.value = obj[key];
    }
    return item;
  });
};

watchEffect(() => {
  nodes.value = generateTree(state.model);
});
</script>
