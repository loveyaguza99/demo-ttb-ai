const fs = require('fs');
const path = require('path');
const { convert } = require('pdf-poppler');
// const { createWorker } = require('tesseract.js');
const Tesseract = require('tesseract.js');

const inputPdf = './docs/test4.pdf';
const outputDir = './docs/output';
fs.mkdirSync(outputDir, { recursive: true });

async function convertPdfToImages(pdfPath) {
  const opts = {
    format: 'png',
    out_dir: outputDir,
    out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
    page: null, // All pages
    scale: 2048 // DPI
  };

  console.log('🔄 Converting PDF to images...');
  await convert(pdfPath, opts);
}

async function ocrImagesInFolder(folderPath, prefix) {
  // const worker = await createWorker('tha+eng');
  // await worker.loadLanguage('tha+eng');
  // await worker.initialize('tha+eng');

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png') && f.startsWith(prefix));
  files.sort(); // Ensure page order

  let allOCR = '';

  for (const file of files) {
    const imgPath = path.join(folderPath, file);
    console.log(`🔍 OCR: ${file}`);
    const {
      data: { text: ocrText }
    } = await Tesseract.recognize(imgPath, 'tha+eng');
    // console.log("🚀 ~ ocrImagesInFolder ~ ocrText:", ocrText)

    allOCR += ocrText;
    // console.log("🚀 ~ ocrImagesInFolder ~ allOCR:", allOCR)
    // const outputTextPath = path.join(folderPath, `${file}.txt`);
    // fs.writeFileSync(outputTextPath, text.trim(), 'utf8');
    // console.log(`✅ Saved: ${outputTextPath}`);
  }
  output = allOCR.trim();
  fs.writeFileSync('./docs/output/output_full.txt', output.trim(), 'utf8');
  // await worker.terminate();
}

(async () => {
  await convertPdfToImages(inputPdf);
  const prefix = path.basename(inputPdf, path.extname(inputPdf));
  await ocrImagesInFolder(outputDir, prefix);
})();
