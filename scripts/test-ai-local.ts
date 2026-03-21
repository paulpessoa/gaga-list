const dotenv = require('dotenv');
const OpenAI = require('openai');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env' });

const openaiKey = process.env.OPENAI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;

if (!openaiKey || !groqKey) {
  console.error('OPENAI_API_KEY ou GROQ_API_KEY não encontrada no .env');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openaiKey });
const groq = new Groq({ apiKey: groqKey });

async function testVision() {
  console.log('\n--- Testando OpenAI Vision (Lata Redbull) ---');
  try {
    const imagePath = path.join(process.cwd(), 'public/testes-com-ia/Lata Redbull Maçã.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "O que é este produto? Responda apenas o nome e marca." },
            {
              type: "image_url",
              image_url: { url: base64Image },
            },
          ],
        },
      ],
    });

    console.log('Resultado Vision:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('Erro no Vision:', (error as any).message);
  }
}

async function testOCR() {
  console.log('\n--- Testando OpenAI OCR (Lista Escrita) ---');
  try {
    const imagePath = path.join(process.cwd(), 'public/testes-com-ia/lista-comras-escrita.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia os itens desta lista de compras em JSON array [{\"name\", \"quantity\"}]." },
            {
              type: "image_url",
              image_url: { url: base64Image },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    console.log('Resultado OCR:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('Erro no OCR:', (error as any).message);
  }
}

async function testVoice() {
  console.log('\n--- Testando GROQ Voice (Whisper) ---');
  try {
    const audioPath = path.join(process.cwd(), 'public/testes-com-ia/teste-lista-de-compras.m4a');
    
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-large-v3',
      language: 'pt',
      response_format: 'text',
    });

    console.log('Transcrição:', transcription);
  } catch (error) {
    console.error('Erro no Voice:', (error as any).message);
  }
}

async function runTests() {
  await testVision();
  await testOCR();
  await testVoice();
}

runTests();
