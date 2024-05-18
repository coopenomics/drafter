import nunjucks from 'nunjucks';
import { jsPDF } from 'jspdf';

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

  run(context, key) {
    return this.translation[key] || key;
  }
}

function convertToNestedObject(obj) {
  const result = {};
  Object.keys(obj).forEach((key) => {
    const parts = key.split('.');
    let currentPart = result;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        currentPart[part] =
          obj[key] === 'true' ? true : obj[key] === 'false' ? false : obj[key];
      } else {
        currentPart[part] = currentPart[part] || {};
        currentPart = currentPart[part];
      }
    });
  });
  return result;
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
  const objectVars = convertToNestedObject(vars);
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
