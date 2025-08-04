const { PDFDocument } = require('pdf-lib');
const { convert } = require('pdf-poppler');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function loadMixedPdf(filePath) {
  return {
    load: async () => {
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);

      const outputDir = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '_img');
      fs.mkdirSync(outputDir, { recursive: true });

      await convert(filePath, {
        format: 'jpeg',
        out_dir: outputDir,
        out_prefix: 'page',
        page: null,
        scale: 2048
      });

      const ocrTexts = [];

      const worker = await Tesseract.createWorker('tha+eng');

      const imageFiles = fs.readdirSync(outputDir)
        .filter(f => f.endsWith('.jpg'))
        .sort();
        
      for (const file of imageFiles) {
        const imagePath = path.join(outputDir, file);
        const buffer = fs.readFileSync(imagePath);
        const updatedBuffer = await sharp(buffer)
          .withMetadata({ density: 2048 })
          .toBuffer();
        const {
          data: { text }
        } = await worker.recognize(updatedBuffer);

        ocrTexts.push(text);
        fs.unlinkSync(imagePath);
      }
      await worker.terminate();
      fs.rmSync(outputDir, { recursive: true, force: true });
      const ocrFull = ocrTexts.join('\n').trim();
      return [
        {
          pageContent: ocrFull,
          metadata: { source: filePath }
        }
      ];
    }
  }
}

module.exports = {
  loadMixedPdf
};
