/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia';
import { getBodyContent } from 'src/shared/lib';
import type { TemplateFile } from 'src/services/TemplateService';

interface ModelState {
  vars: Record<string, any>;
  translation: Record<string, any>;
  object_model: Record<string, any>;
}

export const useAppState = defineStore('app', {
  state: () => ({
    context: '',
    model: {
      vars: {} as Record<string, any>,
      translation: {} as Record<string, any>,
      object_model: {} as Record<string, any>,
    } as ModelState,
    html: '',
    // Новые поля для работы с множественными шаблонами
    currentTemplate: null as TemplateFile | null,
    templates: [] as TemplateFile[],
    isTemplateListLoaded: false,
  }),
  actions: {
    setContext(context: string, model: any) {
      console.log('🔧 setContext called with:', {
        contextLength: context?.length || 0,
        modelVarsKeys: Object.keys(model.vars || {}),
        modelTranslationKeys: Object.keys(model.translation || {}),
        modelObjectModelKeys: Object.keys(model.object_model || {}),
        modelObjectModelSample:
          JSON.stringify(model.object_model || {}).substring(0, 200) + '...',
      });

      this.context = context;
      this.model = {
        vars: model.vars || {},
        translation: model.translation || {},
        object_model: model.object_model || {},
      };

      console.log('✅ Context and model set:', {
        contextLength: this.context.length,
        modelKeys: {
          vars: Object.keys(this.model.vars),
          translation: Object.keys(this.model.translation),
          object_model: Object.keys(this.model.object_model),
        },
      });
    },

    // Новые actions для работы с множественными шаблонами
    setTemplates(templates: TemplateFile[]) {
      this.templates = templates;
      this.isTemplateListLoaded = true;
    },

    setCurrentTemplate(template: TemplateFile) {
      console.log('🎯 Setting current template:', {
        templateId: template.id,
        templateName: template.name,
        hasExampleData: !!(
          template.exampleData && Object.keys(template.exampleData).length > 0
        ),
        exampleDataKeys: Object.keys(template.exampleData || {}),
        exampleDataSample:
          JSON.stringify(template.exampleData || {}).substring(0, 200) + '...',
        contextLength: template.context?.length || 0,
      });

      this.currentTemplate = template;
      // Полностью перезаписываем данные новым шаблоном, не сохраняя старые
      const modelData = {
        vars: {},
        translation: template.translation,
        object_model: template.exampleData || {}, // Если нет exampleData, используем пустой объект
      };

      console.log('📝 Setting context with model:', {
        contextLength: template.context?.length || 0,
        translationKeys: Object.keys(modelData.translation || {}),
        objectModelKeys: Object.keys(modelData.object_model || {}),
        objectModelSample:
          JSON.stringify(modelData.object_model).substring(0, 200) + '...',
      });

      this.setContext(template.context, modelData);
    },

    updateCurrentTemplate() {
      if (this.currentTemplate) {
        this.currentTemplate.context = this.context;
        this.currentTemplate.translation = this.model.translation;
        this.currentTemplate.exampleData = this.model.object_model;
      }
    },

    async update() {
      // Используем object_model для рендеринга, если он есть
      const renderData =
        Object.keys(this.model.object_model).length > 0
          ? this.model.object_model
          : this.model.vars;

      this.html = await getBodyContent(
        this.context,
        renderData,
        this.model.translation
      );
      console.log('this.model', this.model);

      // Обновляем текущий шаблон
      this.updateCurrentTemplate();
    },

    parseContext() {
      console.log('🔍 parseContext started with current state:', {
        currentTemplateId: this.currentTemplate?.id || 'none',
        currentTemplateHasExampleData: !!(
          this.currentTemplate?.exampleData &&
          Object.keys(this.currentTemplate.exampleData).length > 0
        ),
        currentModelObjectModelKeys: Object.keys(this.model.object_model || {}),
        contextLength: this.context?.length || 0,
      });

      const variableRegex = /{{\s*([\w\.]+)(?:\s*\|\s*\w+)?\s*}}/g;
      // Обновлённый translationRegex для работы с переменными без именования
      const translationRegex = /{% trans '([^']+)'(?:,\s*([\w\.]+))* %}/g;
      const ifRegex = /{% (?:if|elif) ([\w\.]+)(?:\s*==\s*'(.*?)')? %}/g;
      // Добавляем регекс для парсинга циклов for
      const forRegex = /{% for (\w+) in (\w+) %}/g;

      const variables: Record<string, any> = {};
      const translations: Record<string, any> = {};
      const objectModel: Record<string, any> = {};
      const loopVariables = new Set<string>(); // Набор переменных циклов

      let match;

      // Сначала собираем все переменные циклов
      while ((match = forRegex.exec(this.context)) !== null) {
        const loopVar = match[1]; // переменная цикла (например, "question")
        const arrayName = match[2]; // название массива (например, "questions")

        loopVariables.add(loopVar); // Запоминаем переменную цикла

        // Если в object_model уже есть массив, используем его
        if (
          this.model.object_model[arrayName] &&
          Array.isArray(this.model.object_model[arrayName])
        ) {
          objectModel[arrayName] = this.model.object_model[arrayName];
        } else {
          // Создаем пустой массив с одним элементом для начала
          objectModel[arrayName] = [{}];
        }
      }

      // Сбрасываем позицию регекса
      forRegex.lastIndex = 0;

      while ((match = ifRegex.exec(this.context)) !== null) {
        const varPath = match[1];
        // Проверяем, не является ли это переменной цикла
        const rootVar = varPath.split('.')[0];
        if (loopVariables.has(rootVar)) {
          continue; // Пропускаем переменные циклов
        }

        if (varPath.includes('.')) {
          const parts = varPath.split('.');
          let current = objectModel;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = '';
        } else {
          // Простые переменные из if попадают в корень object_model
          objectModel[varPath] = '';
        }
      }

      while ((match = variableRegex.exec(this.context)) !== null) {
        const varPath = match[1];
        // Проверяем, не является ли это переменной цикла
        const rootVar = varPath.split('.')[0];
        if (loopVariables.has(rootVar)) {
          continue; // Пропускаем переменные циклов (question.title, question.context и т.д.)
        }

        // ВСЕ переменные попадают в object_model структурированно
        if (varPath.includes('.')) {
          const parts = varPath.split('.');
          let current = objectModel;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = '';
        } else {
          // Простые переменные типа {{dd}} попадают в КОРЕНЬ object_model
          objectModel[varPath] = '';
        }
      }

      while ((match = translationRegex.exec(this.context)) !== null) {
        translations[match[1]] = '';
        // Обработка переменных без имен, перечисленных после названия перевода
        const args = match[0]
          .slice(match[0].indexOf("'") + 1, -3)
          .split(',')
          .slice(1);
        args.forEach((arg) => {
          const varMatch = arg.trim();
          if (varMatch) {
            // Проверяем, не является ли это переменной цикла
            const rootVar = varMatch.split('.')[0];
            if (loopVariables.has(rootVar)) {
              return; // Пропускаем переменные циклов
            }

            if (varMatch.includes('.')) {
              const parts = varMatch.split('.');
              let current = objectModel;
              for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                  current[parts[i]] = {};
                }
                current = current[parts[i]];
              }
              current[parts[parts.length - 1]] = '';
            } else {
              // Простые переменные из переводов тоже в корень object_model
              objectModel[varMatch] = '';
            }
          }
        });
      }

      // Мержим существующие данные только для текущего шаблона
      const mergeWithPreservation = (
        target: Record<string, any>,
        source: Record<string, any>
      ) => {
        Object.keys(target).forEach((key) => {
          if (!source.hasOwnProperty(key)) {
            delete target[key];
          } else if (
            typeof target[key] === 'object' &&
            typeof source[key] === 'object' &&
            !Array.isArray(target[key]) &&
            !Array.isArray(source[key])
          ) {
            mergeWithPreservation(target[key], source[key]);
          }
        });

        Object.keys(source).forEach((key) => {
          if (!target.hasOwnProperty(key)) {
            target[key] = source[key];
          }
        });
      };

      if (this.model && this.model.vars && this.model.translation) {
        mergeWithPreservation(this.model.vars, variables);
        mergeWithPreservation(this.model.translation, translations);

        // Если есть exampleData в текущем шаблоне, используем его как базу
        if (
          this.currentTemplate &&
          this.currentTemplate.exampleData &&
          Object.keys(this.currentTemplate.exampleData).length > 0
        ) {
          // Мержим с exampleData как базой
          const baseObjectModel = { ...this.currentTemplate.exampleData };
          mergeWithPreservation(baseObjectModel, objectModel);
          this.model.object_model = baseObjectModel;
        } else {
          // Если нет exampleData, используем только парсинг из контекста
          this.model.object_model = objectModel;
        }

        console.log('После парсинга:', {
          loopVariables: Array.from(loopVariables),
          vars: this.model.vars,
          object_model: this.model.object_model,
          hasExampleData: !!(
            this.currentTemplate &&
            Object.keys(this.currentTemplate.exampleData || {}).length > 0
          ),
        });
      } else {
        this.model = {
          vars: variables,
          translation: translations,
          object_model: objectModel,
        };
      }

      this.update();
    },
  },
  getters: {
    getTemplate: (state) => () => {
      return JSON.stringify(
        {
          context: state.context,
          model: state.model.vars,
          translation: state.model.translation,
          exampleData: state.model.object_model,
        },
        null,
        2
      );
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'app',
        storage: localStorage,
        paths: ['context', 'html', 'currentTemplate'],
      },
    ],
  },
});
