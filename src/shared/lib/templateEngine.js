import nunjucks from 'nunjucks';
import { jsPDF } from 'jspdf';
import { convertToNestedObject } from './convertToNested';

class TransExtension {
  constructor(translation) {
    this.tags = ['trans'];
    this.translation = translation;
  }

  parse(parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtension(this, 'run', args);
  }

  run(_context, key, ...args) {
    let translation = this.translation[key] || key;
    // Используйте args для замены плейсхолдеров в строке перевода
    args.forEach((value, index) => {
      translation = translation.replace(
        new RegExp(`\\{${index}\\}`, 'g'),
        value
      );
    });
    return translation;
  }
}

function createEnv(translation) {
  const env = new nunjucks.Environment();
  env.addExtension('TransExtension', new TransExtension(translation));

  return env;
}

function getBodyContent(draft, vars, translation) {
  const htmlString = renderTemplate(draft, vars, translation);
  return htmlString;
}

function renderTemplate(draft, vars, translation) {
  // Если vars уже является структурированным объектом (object_model), используем его напрямую
  // Иначе преобразуем через convertToNestedObject для обратной совместимости
  const objectVars =
    vars &&
    typeof vars === 'object' &&
    !Array.isArray(vars) &&
    Object.keys(vars).some((key) => !key.includes('.'))
      ? vars
      : convertToNestedObject(vars);

  const env = createEnv(translation);
  return env.renderString(draft, objectVars);
}

async function downloadPDF(
  draft,
  vars,
  translation,
  filename = 'document.pdf'
) {
  try {
    console.log('here on down', draft, vars, translation);
    const content = renderTemplate(draft, vars, translation);
    const buffer = await convertToPDF(content);

    const blob = new Blob([buffer], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
}

async function convertToPDF(content) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF('p', 'mm', [210, 297]);
      doc.html(content, {
        callback: function (pdfInstance) {
          const pdfOutput = pdfInstance.output('arraybuffer');
          resolve(new Uint8Array(pdfOutput));
        },
        x: 15,
        y: 15,
        width: 170,
        windowWidth: 650,
      });
    } catch (err) {
      reject(err);
    }
  });
}

export { renderTemplate, getBodyContent, downloadPDF, convertToPDF };
