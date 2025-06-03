const fs = require('fs');
const path = require('path');

// Получаем package.json
const pkg = require('../package.json');

// Создаем новый package.json только с production dependencies
const newPkg = {
  name: pkg.name,
  version: pkg.version,
  dependencies: pkg.dependencies,
};

// Путь к директории UnPackaged
const unpackagedDir = path.join(__dirname, '../dist/electron/UnPackaged');

// Проверяем, существует ли директория
if (!fs.existsSync(unpackagedDir)) {
  console.error('Директория UnPackaged не найдена!');
  process.exit(1);
}

// Записываем новый package.json
fs.writeFileSync(
  path.join(unpackagedDir, 'package.json'),
  JSON.stringify(newPkg, null, 2)
);

// Создаем пустой pnpm-lock.yaml
fs.writeFileSync(path.join(unpackagedDir, 'pnpm-lock.yaml'), '{}');

console.log(
  'Файлы package.json и pnpm-lock.yaml успешно обновлены в UnPackaged директории'
);
