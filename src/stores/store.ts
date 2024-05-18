/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia';
import { getBodyContent } from 'src/shared/lib';

export const useAppState = defineStore('app', {
  state: () => ({
    context: '',
    model: {
      vars: {},
      translation: {},
    },
    html: '',
  }),
  actions: {
    setContext(context: string) {
      this.context = context;
    },
    async update() {
      this.html = await getBodyContent(
        this.context,
        this.model.vars,
        this.model.translation
      );
    },
    parseContext() {
      // Regex для поиска переменных
      const variableRegex = /{{\s*([\w\.]+)\s*}}/g;
      // Regex для поиска переводов
      const translationRegex = /{% trans '([^']+)' %}/g;

      // Regex для поиска if операторов
      const ifRegex = /{% if ([\w\.]+) %}/g;

      // Объекты для хранения найденных переменных и переводов
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variables: any = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const translations: any = {};

      // Извлечение переменных
      let match;

      // Извлечение логических значений из условий if
      while ((match = ifRegex.exec(this.context)) !== null) {
        variables[match[1]] = '';
      }

      while ((match = variableRegex.exec(this.context)) !== null) {
        variables[match[1]] = '';
      }

      // Извлечение переводов
      while ((match = translationRegex.exec(this.context)) !== null) {
        translations[match[1]] = '';
      }

      // Преобразуем найденные переменные и переводы в объекты с значениями true
      const jsonData: {
        vars: Record<string, boolean>;
        translation: Record<string, boolean>;
      } = {
        vars: variables,
        translation: translations,
      };

      // Определите вспомогательную рекурсивную функцию для слияния объектов
      const mergeWithPreservation = (target: any, source: any) => {
        Object.keys(target).forEach((key) => {
          if (!source.hasOwnProperty(key)) {
            delete target[key];
          } else if (
            typeof target[key] === 'object' &&
            typeof source[key] === 'object'
          ) {
            mergeWithPreservation(target[key], source[key]);
          }
        });

        Object.keys(source).forEach((key) => {
          if (!target.hasOwnProperty(key)) {
            target[key] = source[key];
          }
          // Если ключ существует, его значение уже было обработано в предыдущем цикле
        });
      };

      // Используйте вспомогательную функцию для слияния старых данных и нового jsonData
      if (this.model && this.model.vars && this.model.translation) {
        mergeWithPreservation(this.model.vars, jsonData.vars);
        mergeWithPreservation(this.model.translation, jsonData.translation);
      } else {
        this.model = jsonData;
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
        paths: ['context', 'model', 'html'],
      },
    ],
  },
});
