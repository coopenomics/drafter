# Drafter - Редактор шаблонов документов

Drafter - это Electron приложение для редактирования шаблонов документов кооперативов. Приложение работает напрямую с файлами cooptypes, позволяя редактировать context, translations и exampleData.

## Возможности

- 📝 Редактирование HTML шаблонов с поддержкой Nunjucks
- 🌐 Управление переводами (i18n)
- 📊 Редактирование примеров данных (object_model)
- 💾 Автоматическое сохранение в файлы cooptypes
- 🔍 Поиск по шаблонам
- 👀 Предварительный просмотр в реальном времени

## Установка и запуск

1. Установите зависимости:

```bash
pnpm install
```

2. Настройте путь в `.env` файле:

```bash
cp .env-example .env
```

Отредактируйте `.env`:

```
COOPTYPES_REGISTRY_PATH=../cooptypes/src/cooperative/registry
```

3. Запустите в режиме разработки:

```bash
pnpm dev
```

4. Или соберите Electron приложение:

```bash
pnpm build
```

## Структура проекта

```
drafter/
├── src/
│   ├── components/
│   │   ├── TemplatesList.vue      # Список шаблонов в левом drawer
│   │   ├── htmlEditor.vue         # Редактор HTML
│   │   ├── modelViewer.vue        # Редактор данных
│   │   └── htmlPreview.vue        # Предварительный просмотр
│   ├── services/
│   │   └── TemplateService.ts     # Сервис для работы с cooptypes файлами
│   ├── stores/
│   │   └── store.ts               # Pinia store
│   └── layouts/
│       └── MainLayout.vue         # Главный layout с drawer
├── src-electron/
│   ├── electron-main.ts           # Главный процесс Electron
│   └── electron-preload.ts        # Preload скрипт
└── .env                           # Конфигурация путей
```

## Как использовать

1. **Выбор шаблона**: Используйте левое меню для выбора шаблона из списка
2. **Редактирование**:
   - HTML шаблон редактируется в левой колонке
   - Данные и переводы - в центральной колонке
   - Предварительный просмотр - в правой колонке
3. **Сохранение**: Нажмите кнопку "Сохранить" рядом с шаблоном в списке
4. **Автосохранение**: Изменения сохраняются в `cooptypes/src/cooperative/registry/[template]/index.ts`

## Формат шаблонов

Шаблоны используют Nunjucks синтаксис:

```html
<div class="digital-document">
  <h3>{% trans 'TITLE' %}</h3>
  <p>{{ coop.city }}, {{ meet.created_at_day }}</p>

  {% for question in questions %}
  <p>{{ question.number }}. {{ question.title }}</p>
  {% endfor %}
</div>
```

## Структура cooptypes файлов

Каждый файл шаблона содержит:

- `context` - HTML шаблон с Nunjucks разметкой
- `translations` - Объект с переводами (экспорт `translations`)
- `exampleData` - Пример данных для рендеринга (экспорт `exampleData`)

## Разработка

Для добавления нового шаблона:

1. Создайте папку `[id].[Name]/` в `cooptypes/src/cooperative/registry/`
2. Добавьте `index.ts` файл с типами и экспортом `context`, `translations`, `exampleData`

## Технологии

- **Vue 3** + **TypeScript** - фронтенд
- **Quasar Framework** - UI компоненты
- **Electron** - десктопное приложение
- **Pinia** - управление состоянием
- **Nunjucks** - шаблонизатор
