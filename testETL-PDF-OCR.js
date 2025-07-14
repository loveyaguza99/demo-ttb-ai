const fs = require('fs');
const pdf = require('pdf-parse');
const { PDFImage } = require('pdf-image');
const PdfExtractor = require('pdf-extractor').PdfExtractor;
// const { createWorker } = require('tesseract.js');
const Tesseract = require('tesseract.js');
const path = require('path');

async function extractTextAndOCR(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const pdfData = await pdf(buffer);
  const numberOfPages = pdfData.numpages;
  const textLayer = pdfData.text;

  console.log(`📄 PDF has ${numberOfPages} pages`);
  console.log(`🔤 Text layer extracted (length: ${textLayer.length})`);

  // Init pdf-image to convert each page
  // const pdfImage = new PDFImage(pdfPath);
  // console.log("🚀 ~ extractTextAndOCR ~ pdfImage:", pdfImage)
  // const pdfImage = new PDFImage(pdfPath, {
  //   convertOptions: {
  //     "-density": "300",
  //     "-quality": "100"
  //   },
  //   outputDirectory: './docs'
  // });

      pdfExtractor = new PdfExtractor("./docs/output", {
      viewportScale: (width, height) => {
        //dynamic zoom based on rendering a page to a fixed page size 
        if (width > height) {
          //landscape: 1100px wide
          return 1100 / width;
        }
        //portrait: 800px wide
        return 800 / width;
      },
      pageRange: [1, numberOfPages],
    });
    await pdfExtractor.parse(pdfPath)

  // Init OCR worker
  // const worker = await createWorker('tha+eng');
  // await worker.loadLanguage('tha+eng');
  // await worker.initialize('tha+eng');

  let allOCR = '';

  for (let i = 0; i < numberOfPages; i++) {
    console.log(`🔄 Processing page ${i + 1}/${numberOfPages}`);
    // const imgPath = await pdfImage.convertPage(i);
    const imgPath = './docs/output/page-' + (i + 1) + '.png'; // Adjust based on your output directory

    // const {
    //   data: { text: ocrText }
    // } = await worker.recognize(imgPath);
    const {
      data: { text: ocrText }
    } = await Tesseract.recognize(imgPath, 'tha+eng');
    // allOCR += `\n\n== OCR Page ${i + 1} ==\n${ocrText}`;
    allOCR += ocrText;
  }

  // await worker.terminate();

  // const output = `== TEXT LAYER ==\n${textLayer.trim()}\n\n== OCR LAYER ==\n${allOCR.trim()}`;
  // const output = allOCR;
  fs.writeFileSync('./docs/output/output_full.txt', allOCR, 'utf8');

  console.log('✅ Output saved: output_full.txt');
}

extractTextAndOCR('./docs/test2.pdf').catch(err => {
  console.error('❌ Error:', err);
});
