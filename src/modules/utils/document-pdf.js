const fs = require('fs');
const path = require('path');
const { convert } = require('pdf-poppler');
// const Tesseract = require('tesseract.js');
const { createWorker } = require('tesseract.js');
const pdf = require('pdf-parse');

async function convertPdfToImages(pdfPath, outputDir) {
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

async function extractPdf(pdfPath, imgName, outputDir) {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdf(buffer);
  const numberOfPages = data.numpages;

  const worker = await createWorker('tha+eng');
  let allOcrText = '';
  for (let i = 0; i < numberOfPages; i++) {
    const imgPath = `${outputDir}/${imgName}-` + (i + 1) + '.png';
    const {
      data: { text: ocrText }
    } = await worker.recognize(imgPath);

    allOcrText += ocrText;
  }

  const final = subtractTextLayer(allOcrText, data.text);
  fs.writeFileSync(`${outputDir}/output_full.txt`, final.trim(), 'utf8');
  await worker.terminate();
  return final;
}

function subtractTextLayer(ocrText, textLayer) {
  const textLayerLines = textLayer
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0);

  const cleaned = ocrText
    .split('\n')
    .filter(line => {
      const normLine = line.trim().toLowerCase();
      return normLine.length > 0 && !textLayerLines.includes(normLine);
    })
    .join('\n');

  return cleaned.trim();
}

module.exports = {
  convertPdfToImages,
  extractPdf
};
