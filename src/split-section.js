require("dotenv").config();
const math = require("mathjs"); // ใช้ math.js สำหรับคำนวณ Cosine Similarity
const Similarity = require("compute-cosine-similarity");
const { AzureOpenAI } = require("openai");

const modelName = process.env.AZURE_OPENAI_EMBEDDINGS_MODEL;
const endpoint = process.env.AZURE_OPENAI_API_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_EMBEDDINGS_MODEL;
const apiVersion = process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION;
const options = { endpoint, apiKey, deployment, apiVersion };

const client = new AzureOpenAI(options);

async function getEmbedding(input) {
  try {
    const result = await client.embeddings.create({
      input: [input],
      model: modelName,
    });
    const embedding = result.data[0].embedding;
    return embedding;
  } catch (error) {
    console.error("Error getting embedding:", error);
    return null;
  }
}

// ฟังก์ชันในการคำนวณ Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = math.dot(vecA, vecB);
  const magnitudeA = math.sqrt(math.dot(vecA, vecA));
  const magnitudeB = math.sqrt(math.dot(vecB, vecB));
  return dotProduct / (magnitudeA * magnitudeB);
}

// ฟังก์ชันในการแบ่ง section ข้อความ และคำนวณคะแนนแต่ละ section
async function splitSection(textArray, bestScript) {
  try {
    const sectionKeys = Object.keys(bestScript.sections);
    const sectionScores = {};
    const sectionCounts = {};
    sectionKeys.forEach((key) => {
      sectionScores[key] = 0;
      sectionCounts[key] = 0;
    });

    // สร้าง cache embedding แต่ละ dialogue ของ bestScript
    const dialogueEmbeddingCache = {};
    for (const key of sectionKeys) {
      dialogueEmbeddingCache[key] = [];
      for (const dialogue of bestScript.sections[key]) {
        const emb = await getEmbedding(dialogue);
        dialogueEmbeddingCache[key].push(emb);
      }
    }

    // สร้าง cache embedding แต่ละ dialogue ของ user
    const userEmbeddingCache = {};
    for (const text of textArray) {
      if (!userEmbeddingCache[text]) {
        userEmbeddingCache[text] = await getEmbedding(text);
      }
    }

    let currentSectionIndex = 0;

    for (const text of textArray) {
      const textEmbedding = userEmbeddingCache[text];

      while (currentSectionIndex < sectionKeys.length) {
        const currentSectionKey = sectionKeys[currentSectionIndex];
        const currentSectionEmbeddings =
          dialogueEmbeddingCache[currentSectionKey];

        // หา similarity สูงสุดของ section ปัจจุบัน
        let maxCurrent = -Infinity;
        for (const dialogueEmbedding of currentSectionEmbeddings) {
          const sim = cosineSimilarity(textEmbedding, dialogueEmbedding);
          maxCurrent = Math.max(maxCurrent, sim);
        }

        // ถ้าเป็น section สุดท้าย
        if (currentSectionIndex === sectionKeys.length - 1) {
          sectionScores[currentSectionKey] += maxCurrent;
          sectionCounts[currentSectionKey] += 1;
          break;
        }

        // หา similarity สูงสุดของ section ถัดไป
        const nextSectionKey = sectionKeys[currentSectionIndex + 1];
        const nextSectionEmbeddings = dialogueEmbeddingCache[nextSectionKey];
        let maxNext = -Infinity;
        for (const dialogueEmbedding of nextSectionEmbeddings) {
          const sim = cosineSimilarity(textEmbedding, dialogueEmbedding);
          maxNext = Math.max(maxNext, sim);
        }

        // เปรียบเทียบตาม logic
        // ถ้า dialogue ที่มี score สูงสุดของ section ปัจจุบัน มี score สูงกว่า หรือเท่ากัน กับ dialogue ที่มี score สูงสุด ของ section ถัดไป ให้ถือว่า dialogue นี้เป็นของ section ปัจจุบัน
        if (maxCurrent >= maxNext) {
          sectionScores[currentSectionKey] += maxCurrent;
          sectionCounts[currentSectionKey] += 1;
          break;
          // ถ้า  dialogue ที่มี score สูงสุดของ section ปัจจุบันมี score ต่ำกว่า dialogue ที่มี score สูงสุด ของ section ถัดไป ให้ถือว่า dialogue นี้เป็นของ section ถัดไป แล้วแเปลี่ยน section ปัจจุบันเป็น section ถัดไป
        } else {
          currentSectionIndex += 1;
        }
      }
    }

    // คำนวณค่าเฉลี่ยแต่ละ section
    const score = {};
    sectionKeys.forEach((key) => {
      const avg =
        sectionCounts[key] > 0 ? sectionScores[key] / sectionCounts[key] : 0;
      // score[key] = avg.toFixed(2);

      // สมมติ avg อยู่ในช่วง 0-1 ให้แปลงเป็น 1-10 (ถ้า similarity อาจติดลบ ให้ clamp เป็น 0-1 ก่อน)
      const normalized = Math.max(0, Math.min(1, avg));
      const scaled = normalized * 10; // 0 => 1, 1 => 10
      score[key] = scaled.toFixed(2); // แสดงทศนิยม 2 ตำแหน่ง
    });

    return { score };
  } catch (error) {
    console.error("Error in splitSection:", error);
    return null;
  }
}

module.exports = {
  splitSection,
};
