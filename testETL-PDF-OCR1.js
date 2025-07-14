import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFRawStream } from 'pdf-lib';
import { createWorker } from 'tesseract.js';

async function extractImagesAndOCR(pdfPath) {
  const outputDir = './output';
  fs.mkdirSync(outputDir, { recursive: true });

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  const worker = await createWorker('tha+eng');

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const resources = page.node.Resources();
    const xObjectKey = resources.get('XObject');
    console.log("🚀 ~ extractImagesAndOCR ~ xObjectKey:", xObjectKey)

    if (!xObjectKey) continue;

    const xObjectDict = pdfDoc.context.lookup(xObjectKey);
    let imageIndex = 0;

    for (const [key, ref] of xObjectDict.dict.entries()) {
      const xObject = pdfDoc.context.lookup(ref);
      const subtype = xObject.dict?.get('Subtype');

      if (subtype?.name === 'Image') {
        const bytes = xObject instanceof PDFRawStream
          ? xObject.contents
          : xObject.getContent();

        const ext = getImageType(xObject);
        const imgPath = path.join(outputDir, `page${i + 1}_img${++imageIndex}.${ext}`);
        fs.writeFileSync(imgPath, bytes);

        console.log(`🔍 OCR: ${imgPath}`);
        const {
          data: { text }
        } = await worker.recognize(imgPath);

        fs.writeFileSync(`${imgPath}.txt`, text.trim(), 'utf8');
        console.log(`✅ Saved: ${imgPath}.txt`);
      }
    }
  }

  await worker.terminate();
}

function getImageType(xObject) {
  const colorSpace = xObject.dict?.get('ColorSpace');
  const csName = colorSpace?.name || (Array.isArray(colorSpace) ? colorSpace[0]?.name : '');
  return csName === 'DeviceGray' ? 'png' : 'jpg';
}

extractImagesAndOCR('./docs/test.pdf').catch(console.error);
