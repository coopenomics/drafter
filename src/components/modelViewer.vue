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
        <div v-if="node.isAddButton" class="q-pa-xs">
          <q-btn
            size="sm"
            color="primary"
            icon="add"
            :label="node.label"
            @click="addArrayItemByPath(node.arrayPath)"
          />
        </div>
        <div v-else-if="!node.children" class="q-pa-xs">
          <q-input
            type="textarea"
            rows="3"
            dense
            filled
            v-model="node[displayKey]"
            @update:model-value="updateValue(node, $event)"
          />
        </div>
        <div v-else-if="node.isArray" class="q-pa-xs">
          <div class="row items-center q-mb-sm">
            <div class="col">
              <q-btn
                size="sm"
                color="primary"
                icon="add"
                label="Добавить элемент"
                @click="addArrayItem(node)"
              />
            </div>
          </div>
          <div
            v-for="(item, index) in node.arrayItems"
            :key="index"
            class="q-mb-md q-pa-sm"
            style="border: 1px solid #e0e0e0; border-radius: 4px"
          >
            <div class="row items-center q-mb-sm">
              <div class="col">
                <strong>{{ node.label }} [{{ index }}]</strong>
              </div>
              <div class="col-auto">
                <q-btn
                  size="sm"
                  color="negative"
                  icon="delete"
                  @click="removeArrayItem(node, index)"
                />
              </div>
            </div>
            <div v-for="(value, key) in item" :key="key" class="q-mb-sm">
              <q-input
                :label="String(key)"
                type="textarea"
                rows="2"
                dense
                filled
                v-model="item[key]"
                @change="updateArrayValue(node, index, String(key), item[key])"
              />
            </div>
          </div>
        </div>
      </template>
    </q-tree>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { QTree, QInput, QCard, QBtn } from 'quasar';
import { useAppState } from 'src/stores/store';

defineOptions({
  name: 'modelViewer',
});

const state = useAppState();
const displayKey = 'value';
const labelKey = 'label';
const childrenKey = 'children';
const defaultExpanded = ref(true);
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
const updateValue = (node: any, newValue: any): void => {
  node.value = newValue;

  if (node.arrayElementPath) {
    updateArrayElementValue(node.arrayElementPath, newValue);
  } else {
    const keys = node.id.split('|');

    if (keys[0] === 'translations') {
      // Обновляем переводы
      updateStateValue(
        keys.slice(1),
        newValue,
        state.model.translation as Record<string, any>
      );
    } else {
      // Обновляем в object_model
      updateStateValue(
        keys,
        newValue,
        state.model.object_model as Record<string, any>
      );
    }
  }
  state.update();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateArrayValue = (
  node: any,
  index: number,
  key: string,
  value: any
): void => {
  const arrayName = node.id;
  const objectModel = state.model.object_model as Record<string, any>;
  if (objectModel[arrayName] && objectModel[arrayName][index]) {
    objectModel[arrayName][index][key] = value;
    state.update();
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addArrayItem = (node: any): void => {
  const arrayName = node.id;
  const objectModel = state.model.object_model as Record<string, any>;
  if (!objectModel[arrayName]) {
    objectModel[arrayName] = [];
  }

  // Создаем новый элемент на основе первого элемента массива или с базовыми полями
  const template = objectModel[arrayName][0] || {};
  const newItem: any = {};

  // Копируем структуру, но с пустыми значениями
  Object.keys(template).forEach((key) => {
    newItem[key] = '';
  });

  objectModel[arrayName].push(newItem);
  generateArrayItems(node);
  state.update();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const removeArrayItem = (node: any, index: number): void => {
  const arrayName = node.id;
  const objectModel = state.model.object_model as Record<string, any>;
  if (objectModel[arrayName]) {
    objectModel[arrayName].splice(index, 1);
    generateArrayItems(node);
    state.update();
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateArrayItems = (node: any): void => {
  const arrayName = node.id;
  const objectModel = state.model.object_model as Record<string, any>;
  if (objectModel[arrayName]) {
    node.arrayItems = [...objectModel[arrayName]];
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateTree = (obj?: any, path: string[] = [], isRoot = true): any[] => {
  const result: any[] = [];

  if (isRoot) {
    const objectModel = state.model.object_model as Record<string, any>;
    const translations = state.model.translation as Record<string, any>;

    // Раздел "Данные модели"
    if (Object.keys(objectModel).length > 0) {
      const modelData: any[] = [];

      Object.keys(objectModel).forEach((key) => {
        // Пропускаем только translations - vars должны отображаться!
        if (key === 'translations') {
          return;
        }

        const value = objectModel[key];
        const id = key;

        if (Array.isArray(value)) {
          const arrayNode: any = {
            id,
            label: `${key} (массив: ${value.length} элементов)`,
            isArray: true,
            arrayPath: [key],
            children: [
              ...value.map((item, index) => ({
                id: `${id}|${index}`,
                label: `${key}[${index}]`,
                children:
                  typeof item === 'object' && item !== null
                    ? Object.keys(item).map((itemKey) => ({
                        id: `${id}|${index}|${itemKey}`,
                        label: itemKey,
                        value: item[itemKey] || '',
                        arrayElementPath: [key, index.toString(), itemKey],
                      }))
                    : [
                        {
                          id: `${id}|${index}|value`,
                          label: 'value',
                          value: item || '',
                          arrayElementPath: [key, index.toString()],
                        },
                      ],
              })),
              {
                id: `${id}|_controls`,
                label: '+ Добавить элемент',
                isAddButton: true,
                arrayPath: [key],
              },
            ],
          };
          modelData.push(arrayNode);
        } else if (typeof value === 'object' && value !== null) {
          modelData.push({
            id,
            label: key,
            children: generateTree(value, [key], false),
          });
        } else {
          modelData.push({
            id,
            label: key,
            value: value || '',
          });
        }
      });

      if (modelData.length > 0) {
        const dataModelNode = {
          id: 'data_model',
          label: 'Данные модели',
          children: modelData,
        };
        result.push(dataModelNode);
      }
    }

    // Раздел "Переводы"
    if (Object.keys(translations).length > 0) {
      const translationsNode = {
        id: 'translations',
        label: 'Переводы',
        children: Object.keys(translations).map((key) => ({
          id: `translations|${key}`,
          label: key,
          value: translations[key] || '',
        })),
      };
      result.push(translationsNode);
    }
  } else {
    // Рекурсивная обработка вложенных объектов
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        const id = [...path, key].join('|');
        const value = obj[key];

        if (Array.isArray(value)) {
          const arrayNode: any = {
            id,
            label: `${key} (массив: ${value.length} элементов)`,
            isArray: true,
            arrayPath: [...path, key],
            children: [
              ...value.map((item, index) => ({
                id: `${id}|${index}`,
                label: `${key}[${index}]`,
                children:
                  typeof item === 'object' && item !== null
                    ? Object.keys(item).map((itemKey) => ({
                        id: `${id}|${index}|${itemKey}`,
                        label: itemKey,
                        value: item[itemKey] || '',
                        arrayElementPath: [
                          ...path,
                          key,
                          index.toString(),
                          itemKey,
                        ],
                      }))
                    : [
                        {
                          id: `${id}|${index}|value`,
                          label: 'value',
                          value: item || '',
                          arrayElementPath: [...path, key, index.toString()],
                        },
                      ],
              })),
              {
                id: `${id}|_controls`,
                label: '+ Добавить элемент',
                isAddButton: true,
                arrayPath: [...path, key],
              },
            ],
          };

          result.push(arrayNode);
        } else if (typeof value === 'object' && value !== null) {
          result.push({
            id,
            label: key,
            children: generateTree(value, [...path, key], false),
          });
        } else {
          result.push({
            id,
            label: key,
            value: value || '',
          });
        }
      });
    }
  }

  return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateArrayElementValue = (path: string[], value: any): void => {
  const objectModel = state.model.object_model as Record<string, any>;
  let current = objectModel;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (current[key] === undefined) {
      current[key] = isNaN(Number(path[i + 1])) ? {} : [];
    }
    current = current[key];
  }

  const lastKey = path[path.length - 1];
  current[lastKey] = value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addArrayItemByPath = (path: string[]): void => {
  console.log('Adding array item at path:', path);
  const objectModel = state.model.object_model as Record<string, any>;
  let current = objectModel;

  // Теперь путь напрямую указывает в object_model
  for (const key of path) {
    if (!current[key]) {
      console.log('Path not found:', key, 'in', current);
      return;
    }
    current = current[key];
  }

  if (Array.isArray(current)) {
    const template = current[0] || {};
    const newItem: any = {};

    if (typeof template === 'object' && template !== null) {
      Object.keys(template).forEach((key) => {
        newItem[key] = '';
      });
    } else {
      newItem.value = '';
    }

    current.push(newItem);
    console.log('Added new item to array:', newItem);

    // Принудительно обновляем дерево
    setTimeout(() => {
      nodes.value = generateTree();
      state.update();
    }, 0);
  } else {
    console.log('Target is not an array:', current);
  }
};

watchEffect(() => {
  nodes.value = generateTree();
});
</script>
