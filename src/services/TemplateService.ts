export interface TemplateFile {
  id: string;
  name: string;
  title: string;
  fileName: string;
  context: string;
  translation: Record<string, any>;
  exampleData: Record<string, any>;
}

export class TemplateService {
  private cooptypesPath: string;

  constructor() {
    this.cooptypesPath =
      import.meta.env.VITE_COOPTYPES_REGISTRY_PATH ||
      '../cooptypes/src/cooperative/registry';
  }

  async loadTemplatesList(): Promise<TemplateFile[]> {
    try {
      // Проверяем, доступен ли Electron API
      if (window.electronAPI) {
        const templateDirs = await window.electronAPI.listCooptypeDirectories();
        return templateDirs.map((dirName) => {
          const id = dirName;
          const name = this.formatTemplateName(dirName);
          const fileName = `${dirName}.json`; // Для совместимости

          return {
            id,
            name,
            title: name,
            fileName,
            context: '',
            translation: {},
            exampleData: {},
          };
        });
      } else {
        // Fallback для веб-версии
        return this.getHardcodedTemplatesList();
      }
    } catch (error) {
      console.error('Error loading templates list:', error);
      return this.getHardcodedTemplatesList();
    }
  }

  async loadTemplate(fileName: string): Promise<TemplateFile | null> {
    try {
      const templateId = fileName.replace('.json', '');
      console.log('🔄 Loading template:', { fileName, templateId });

      // Проверяем, доступен ли Electron API
      if (window.electronAPI) {
        // Загружаем данные из cooptypes
        console.log('📁 Reading cooptype file via Electron API...');
        const cooptypeContent = await window.electronAPI.readCooptypeFile(
          templateId
        );
        console.log(
          '📄 Raw cooptype content preview:',
          cooptypeContent.substring(0, 300) + '...'
        );

        const cooptypeData = this.parseCooptypeFile(cooptypeContent);
        console.log('🔍 Parsed cooptype data:', {
          contextLength: cooptypeData.context?.length || 0,
          translationsKeys: Object.keys(cooptypeData.translations || {}),
          exampleDataKeys: Object.keys(cooptypeData.exampleData || {}),
          hasExampleData: !!(
            cooptypeData.exampleData &&
            Object.keys(cooptypeData.exampleData).length > 0
          ),
        });

        const context = cooptypeData.context || '';
        const translation = cooptypeData.translations?.ru || {};
        const exampleData = cooptypeData.exampleData || {};
        // Используем извлеченный title или формируем из имени шаблона
        const title = cooptypeData.title || this.formatTemplateName(templateId);

        console.log('✅ Final template data:', {
          id: templateId,
          contextLength: context.length,
          translationKeys: Object.keys(translation),
          exampleDataKeys: Object.keys(exampleData),
          exampleDataSample:
            JSON.stringify(exampleData).substring(0, 200) + '...',
        });

        return {
          id: templateId,
          name: this.formatTemplateName(templateId),
          title: title,
          fileName,
          context,
          translation,
          exampleData,
        };
      } else {
        // Fallback для веб-версии - используем fetch
        console.log('🌐 Fallback: using fetch for web version...');
        const response = await fetch(`/api/cooptypes/${templateId}`);
        if (!response.ok) {
          throw new Error('Template not found');
        }

        const data = await response.text();
        const cooptypeData = this.parseCooptypeFile(data);
        const title = cooptypeData.title || this.formatTemplateName(templateId);

        return {
          id: templateId,
          name: this.formatTemplateName(templateId),
          title: title,
          fileName,
          context: cooptypeData.context || '',
          translation: cooptypeData.translations?.ru || {},
          exampleData: cooptypeData.exampleData || {},
        };
      }
    } catch (error) {
      console.error('❌ Error loading template:', error);
      return null;
    }
  }

  async saveTemplate(template: TemplateFile): Promise<boolean> {
    try {
      // Проверяем, доступен ли Electron API
      if (window.electronAPI) {
        // Обновляем только файл в cooptypes
        await this.updateCooptypeFile(template);
        return true;
      } else {
        // Fallback для веб-версии
        const response = await fetch(`/api/cooptypes/${template.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: template.context,
            translation: template.translation,
            exampleData: template.exampleData,
          }),
        });

        return response.ok;
      }
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  }

  private parseCooptypeFile(content: string): any {
    try {
      // Извлекаем title из файла
      const titleMatch = content.match(/export const title = ['"`](.*?)['"`]/);
      let title = '';
      if (titleMatch) {
        title = titleMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }

      // Извлекаем context с учетом экранированных символов и переносов строк
      const contextMatch = content.match(
        /export const context = ['"`]([\s\S]*?)['"`](?=\s*export|\s*$)/
      );
      let context = '';
      if (contextMatch) {
        // Правильно обрабатываем экранированные символы
        context = contextMatch[1]
          .replace(/\\n/g, '\n') // Заменяем \\n на реальные переносы строк
          .replace(/\\t/g, '\t') // Заменяем \\t на табуляцию
          .replace(/\\'/g, "'") // Заменяем \\' на одинарные кавычки
          .replace(/\\"/g, '"') // Заменяем \\" на двойные кавычки
          .replace(/\\\\/g, '\\'); // Заменяем \\\\ на обратные слеши
      }

      // Функция для извлечения содержимого объекта с учетом вложенных скобок
      const extractObjectContent = (
        text: string,
        startPattern: string
      ): string | null => {
        const startIndex = text.indexOf(startPattern);
        if (startIndex === -1) return null;

        const objectStart = text.indexOf('{', startIndex);
        if (objectStart === -1) return null;

        let braceCount = 0;
        let current = objectStart;

        while (current < text.length) {
          const char = text[current];
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;

          if (braceCount === 0) {
            // Найдена закрывающая скобка объекта
            return text.substring(objectStart + 1, current);
          }
          current++;
        }

        return null;
      };

      // Извлекаем translations с более надежным подходом
      let translations = {};
      const translationsContent = extractObjectContent(
        content,
        'export const translations = {'
      );
      if (translationsContent) {
        try {
          // Создаем временную функцию для безопасного выполнения кода
          const translationsCode = `return {${translationsContent}}`;
          const func = new Function(translationsCode);
          translations = func();
        } catch (e) {
          console.warn(
            'Could not parse translations, trying alternative method:',
            e
          );
          // Альтернативный метод - ищем ru секцию
          const ruMatch = translationsContent.match(
            /ru:\s*\{([\s\S]*?)\}(?=\s*,?\s*[a-zA-Z_]|\s*$)/
          );
          if (ruMatch) {
            try {
              const ruCode = `return {${ruMatch[1]}}`;
              const ruFunc = new Function(ruCode);
              translations = { ru: ruFunc() };
            } catch (e2) {
              console.warn('Alternative parsing also failed:', e2);
              console.log('Failed ru content:', ruMatch[1]);
            }
          }
        }
      }

      // Извлекаем exampleData если есть
      let exampleData = {};
      const exampleDataContent = extractObjectContent(
        content,
        'export const exampleData = {'
      );
      if (exampleDataContent) {
        try {
          const exampleDataCode = `return {${exampleDataContent}}`;
          const func = new Function(exampleDataCode);
          exampleData = func();
        } catch (e) {
          console.warn('Could not parse exampleData:', e);
          console.log(
            'Failed exampleData content:',
            exampleDataContent.substring(0, 200) + '...'
          );
        }
      }

      console.log('Parsed cooptype file:', {
        contextLength: context.length,
        translationsKeys: Object.keys(translations),
        exampleDataKeys: Object.keys(exampleData),
        contextPreview:
          context.substring(0, 200) + (context.length > 200 ? '...' : ''),
      });

      return {
        title,
        context,
        translations,
        exampleData,
      };
    } catch (error) {
      console.error('Error parsing cooptype file:', error);
      return {
        title: '',
        context: '',
        translations: {},
        exampleData: {},
      };
    }
  }

  private async updateCooptypeFile(template: TemplateFile): Promise<void> {
    try {
      if (!window.electronAPI) return;

      // Читаем существующий файл cooptype
      let existingContent = await window.electronAPI.readCooptypeFile(
        template.id
      );

      // Максимально простой и надежный подход - используем грубую замену текста
      // на основе идентификации строк начала и конца блока контекста

      // Находим начало блока контекста
      const contextStartPattern = 'export const context =';
      const contextStartIndex = existingContent.indexOf(contextStartPattern);

      if (contextStartIndex === -1) {
        console.error('Блок context не найден в файле');
        return;
      }

      // Ищем первый символ после "export const context ="
      let quoteStartIndex = contextStartIndex + contextStartPattern.length;
      // Пропускаем пробелы
      while (existingContent[quoteStartIndex] === ' ') {
        quoteStartIndex++;
      }

      // Определяем тип кавычки
      const quoteChar = existingContent[quoteStartIndex];

      if (quoteChar !== "'" && quoteChar !== '"' && quoteChar !== '`') {
        console.error('Не удалось определить тип кавычки в блоке context');
        return;
      }

      // Ищем конец блока (закрывающую кавычку с учетом экранирования)
      let quoteEndIndex = quoteStartIndex + 1;
      let escaped = false;

      // Поиск закрывающей кавычки с учетом вложенных кавычек и экранирования
      while (quoteEndIndex < existingContent.length) {
        const char = existingContent[quoteEndIndex];

        if (char === '\\') {
          escaped = !escaped; // Переключаем состояние экранирования
        } else if (char === quoteChar && !escaped) {
          break; // Нашли закрывающую кавычку
        } else {
          escaped = false; // Сбрасываем состояние экранирования для других символов
        }

        quoteEndIndex++;
      }

      if (quoteEndIndex >= existingContent.length) {
        console.error('Не удалось найти конец блока context');
        return;
      }

      // Формируем новый блок контекста
      const newContextBlock = `${contextStartPattern} \`${template.context}\``;

      // Заменяем старый блок контекста на новый
      const beforeContext = existingContent.substring(0, contextStartIndex);
      const afterContext = existingContent.substring(quoteEndIndex + 1);

      // Собираем обновленное содержимое
      existingContent = beforeContext + newContextBlock + afterContext;

      // Обновляем translations и exampleData (используя простой подход с поиском маркеров)

      // Обновляем translations
      const translationsStartPattern = 'export const translations =';
      const translationsStartIndex = existingContent.indexOf(
        translationsStartPattern
      );

      if (translationsStartIndex !== -1) {
        const translationsBracketIndex = existingContent.indexOf(
          '{',
          translationsStartIndex
        );
        if (translationsBracketIndex !== -1) {
          // Ищем закрывающую фигурную скобку с учетом вложенности
          let bracketCount = 1;
          let translationsEndIndex = translationsBracketIndex + 1;

          while (
            translationsEndIndex < existingContent.length &&
            bracketCount > 0
          ) {
            if (existingContent[translationsEndIndex] === '{') {
              bracketCount++;
            } else if (existingContent[translationsEndIndex] === '}') {
              bracketCount--;
            }
            translationsEndIndex++;
          }

          if (bracketCount === 0) {
            const newTranslations = `${translationsStartPattern} {
  ru: ${JSON.stringify(template.translation, null, 4).replace(/^/gm, '    ')},
}`;

            existingContent =
              existingContent.substring(0, translationsStartIndex) +
              newTranslations +
              existingContent.substring(translationsEndIndex);
          }
        }
      }

      // Обновляем exampleData
      const exampleDataStartPattern = 'export const exampleData =';
      const exampleDataStartIndex = existingContent.indexOf(
        exampleDataStartPattern
      );

      const newExampleData = `${exampleDataStartPattern} ${JSON.stringify(
        template.exampleData,
        null,
        2
      )}`;

      if (exampleDataStartIndex !== -1) {
        const exampleDataBracketIndex = existingContent.indexOf(
          '{',
          exampleDataStartIndex
        );
        if (exampleDataBracketIndex !== -1) {
          // Ищем закрывающую фигурную скобку с учетом вложенности
          let bracketCount = 1;
          let exampleDataEndIndex = exampleDataBracketIndex + 1;

          while (
            exampleDataEndIndex < existingContent.length &&
            bracketCount > 0
          ) {
            if (existingContent[exampleDataEndIndex] === '{') {
              bracketCount++;
            } else if (existingContent[exampleDataEndIndex] === '}') {
              bracketCount--;
            }
            exampleDataEndIndex++;
          }

          if (bracketCount === 0) {
            existingContent =
              existingContent.substring(0, exampleDataStartIndex) +
              newExampleData +
              existingContent.substring(exampleDataEndIndex);
          }
        }
      } else {
        // Добавляем exampleData в конец файла
        existingContent += `\n\n// Пример данных для редактора шаблонов\n${newExampleData}\n`;
      }

      // Сохраняем обновленный файл
      await window.electronAPI.writeCooptypeFile(template.id, existingContent);
      console.log('Файл шаблона успешно обновлен');
    } catch (error) {
      console.error('Ошибка при обновлении файла шаблона:', error);
    }
  }

  private getHardcodedTemplatesList(): TemplateFile[] {
    const templates = [
      '1.WalletAgreement',
      '100.ParticipantApplication',
      '1000.InvestmentAgreement',
      '1001.InvestByResultStatement',
      '1002.InvestByResultAct',
      '1005.InvestByMoneyStatement',
      '101.SelectBranchStatement',
      '1010.InvestMembershipConvertation',
      '2.RegulationElectronicSignature',
      '3.PrivacyPolicy',
      '300.AnnualGeneralMeetingAgenda',
      '301.AnnualGeneralMeetingSovietDecision',
      '302.AnnualGeneralMeetingNotification',
      '303.AnnualGeneralMeetingVotingBallot',
      '304.AnnualGeneralMeetingDecision',
      '4.UserAgreement',
      '50.CoopenomicsAgreement',
      '501.DecisionOfParticipantApplication',
      '599.ProjectFreeDecision',
      '600.FreeDecision',
      '700.AssetContributionStatement',
      '701.AssetContributionDecision',
      '702.AssetContributionAct',
      '800.ReturnByAssetStatement',
      '801.ReturnByAssetDecision',
      '802.ReturnByAssetAct',
    ];

    return templates.map((templateId) => {
      const name = this.formatTemplateName(templateId);
      const fileName = `${templateId}.json`;

      return {
        id: templateId,
        name,
        title: name,
        fileName,
        context: '',
        translation: {},
        exampleData: {},
      };
    });
  }

  private formatTemplateName(templateId: string): string {
    // Форматируем имя файла для отображения
    const parts = templateId.split('.');

    if (parts.length === 2) {
      const [id, namepart] = parts;
      // Преобразуем PascalCase в читаемый формат
      const formatted = namepart
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      return `${id}. ${formatted}`;
    }

    return templateId;
  }
}
